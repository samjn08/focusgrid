import os.path
import base64
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file gmail_token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

def get_gmail_service():
    creds = None
    if os.path.exists('gmail_token.json'):
        creds = Credentials.from_authorized_user_file('gmail_token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                raise Exception("Missing credentials.json for Google API. Please place it in the root folder.")
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('gmail_token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def get_recent_emails(max_results=10):
    try:
        service = get_gmail_service()
    except Exception as e:
        raise Exception(f"Error connecting to Gmail: {e}")
        
    try:
        results = service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=max_results).execute()
        messages = results.get('messages', [])

        if not messages:
            return []

        emails = []
        for msg in messages:
            txt = service.users().messages().get(userId='me', id=msg['id'], format='metadata', metadataHeaders=['From', 'Subject', 'Date']).execute()
            
            headers = txt.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown Date')
            
            emails.append({
                "id": msg['id'],
                "threadId": msg['threadId'],
                "subject": subject,
                "from": sender,
                "date": date,
                "snippet": txt.get('snippet', '')
            })
            
        return emails
    except Exception as e:
         raise Exception(f"Failed to fetch emails: {str(e)}")

def get_email_content(msg_id: str):
    try:
        service = get_gmail_service()
        txt = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        
        payload = txt.get('payload', {})
        headers = payload.get('headers', [])
        subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
        sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Unknown Sender')
        date = next((h['value'] for h in headers if h['name'].lower() == 'date'), 'Unknown Date')

        def get_part_content(payload):
            parts = payload.get('parts', [])
            plain = ""
            html = ""
            
            if not parts:
                data = payload.get('body', {}).get('data', '')
                if data:
                    content = base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
                    if payload.get('mimeType') == 'text/html':
                        html = content
                    else:
                        plain = content
                return plain, html

            for part in parts:
                p, h = get_part_content(part)
                if p: plain += p
                if h: html += h
            return plain, html

        plain_text, html_content = get_part_content(payload)
        
        # Fallback to snippet if no body found
        if not plain_text and not html_content:
            plain_text = txt.get('snippet', 'No content available.')

        return {
            "id": msg_id,
            "subject": subject,
            "from": sender,
            "date": date,
            "body": plain_text,
            "html": html_content
        }
    except Exception as e:
        raise Exception(f"Failed to fetch email content: {str(e)}")

def send_email(to: str, subject: str, body: str) -> str:
    try:
        service = get_gmail_service()
    except Exception as e:
        return f"Error connecting to Gmail: {e}"
        
    try:
        message = EmailMessage()
        message.set_content(body)
        message['To'] = to
        message['From'] = 'me'
        message['Subject'] = subject

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {'raw': encoded_message}

        send_message = (service.users().messages().send(userId="me", body=create_message).execute())
        return f"Message sent successfully. Message Id: {send_message['id']}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"
