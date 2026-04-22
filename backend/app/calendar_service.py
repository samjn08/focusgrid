import datetime
import os.path
from dateutil import parser
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    """Shows basic usage of the Google Calendar API.
    Prints the start and name of the next 10 events on the user's calendar.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                raise Exception("Missing credentials.json for Google Calendar API. Please download it from Google Cloud Console.")
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('calendar', 'v3', credentials=creds)
    return service

def get_upcoming_events(max_results=10) -> str:
    """Gets the upcoming events."""
    try:
        service = get_calendar_service()
    except Exception as e:
        return f"Error connecting to calendar: {e}"
        
    now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
    
    events_result = service.events().list(calendarId='primary', timeMin=now,
                                          maxResults=max_results, singleEvents=True,
                                          orderBy='startTime').execute()
    events = events_result.get('items', [])

    if not events:
        return 'No upcoming events found.'

    result = "Upcoming Events:\n"
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        # Parse formatting
        dt = parser.parse(start)
        # Convert to local timezone before formatting for display
        from dateutil import tz
        if dt.tzinfo is not None:
            dt = dt.astimezone(tz.tzlocal())
            
        formatted_time = dt.strftime('%B %d, %Y at %I:%M %p %Z').strip()
        result += f"- {event['summary']} ({formatted_time})\n"
        
    return result

def schedule_event(summary: str, start_time: str, end_time: str, description: str = "") -> str:
    """Schedules a new calendar event.
    start_time and end_time should be ISO 8601 formatted strings (e.g. 2026-03-16T10:00:00)
    """
    try:
        service = get_calendar_service()
    except Exception as e:
        return f"Error connecting to calendar: {e}"
        
    # Standardize time format for Google API
    try:
        # Example validation
        parser.parse(start_time)
        parser.parse(end_time)
    except ValueError:
        return "Invalid time format provided. Please use standard ISO format."

    event = {
        'summary': summary,
        'description': description,
        'start': {
            'dateTime': start_time,
        },
        'end': {
            'dateTime': end_time,
        },
    }

    try:
        event = service.events().insert(calendarId='primary', body=event).execute()
        return f"Successfully scheduled event: {summary}. Link: {event.get('htmlLink')}"
    except Exception as e:
        return f"Failed to schedule event: {str(e)}"
