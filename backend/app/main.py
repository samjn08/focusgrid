from fastapi import FastAPI, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import Document

from fastapi.middleware.cors import CORSMiddleware
from app.agent import ChatRequest, run_agent
from app.rag import process_document, query_knowledge_base, delete_document_from_rag
from app.calendar_service import get_upcoming_events, schedule_event
from app.gmail_service import get_recent_emails, send_email, get_email_content
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

# Create SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Productivity OS API")

# Add CORS so Next.js frontend can communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AI Productivity OS Backend Running", "modules": ["sqlite", "chromadb"]}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    # Pass messages to our agent with the db session
    response_message = await run_agent(request.messages, db)
    return {"role": response_message.role, "content": response_message.content}

@app.post("/api/notes/upload")
async def upload_note(file: UploadFile = File(...), db: Session = Depends(get_db)):
    result = await process_document(file, db)
    return {"message": f"Successfully processed {result['chunks']} chunks.", "summary": result['summary']}

@app.get("/api/notes/recent")
def get_recent_notes(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).limit(10).all()
    return [{
        "id": doc.id,
        "title": doc.filename,
        "summary": doc.summary,
        "date": doc.created_at.strftime("%Y-%m-%d %H:%M")
    } for doc in docs]

@app.get("/api/notes/{doc_id}")
def get_note(doc_id: int, db: Session = Depends(get_db)):
    from app.models import Document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return {"error": "Document not found."}
    return {
        "id": doc.id,
        "title": doc.filename,
        "summary": doc.summary,
        "content": doc.content,
        "date": doc.created_at.strftime("%Y-%m-%d %H:%M")
    }

@app.delete("/api/notes/{doc_id}")
async def delete_note(doc_id: int, db: Session = Depends(get_db)):
    from app.models import Document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return {"error": "Document not found."}
    
    # Delete from ChromaDB
    await delete_document_from_rag(doc_id)
    
    # Delete from SQLite
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully."}

class SearchRequest(BaseModel):
    query: str

@app.post("/api/notes/search")
async def search_notes(request: SearchRequest):
    result = await query_knowledge_base(request.query)
    return {"result": result}

class ScheduleRequest(BaseModel):
    summary: str
    start_time: str
    end_time: str
    description: str = ""

@app.get("/api/calendar/upcoming")
def get_events(max_results: int = 10):
    try:
        return {"events": get_upcoming_events(max_results)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/calendar/schedule")
def add_event(req: ScheduleRequest):
    try:
        res = schedule_event(req.summary, req.start_time, req.end_time, req.description)
        return {"message": res}
    except Exception as e:
        return {"error": str(e)}

class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str

@app.get("/api/email/recent")
def get_emails(max_results: int = 10):
    try:
        return {"emails": get_recent_emails(max_results)}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/email/{msg_id}")
def get_single_email(msg_id: str):
    try:
        return {"email": get_email_content(msg_id)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/email/send")
def post_send_email(req: EmailSendRequest):
    try:
        res = send_email(req.to, req.subject, req.body)
        return {"message": res}
    except Exception as e:
        return {"error": str(e)}

class EmailAIRequest(BaseModel):
    id: str
    action: str # "summarize" or "draft"
    prompt: str = ""

@app.post("/api/email/ai-assist")
async def email_ai_assist(req: EmailAIRequest):
    try:
        content = get_email_content(req.id)
        email_context = f"From: {content['from']}\nSubject: {content['subject']}\nBody: {content['body']}"
        
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        if req.action == "summarize":
            prompt = f"Please summarize the following email in a few concise bullet points:\n\n{email_context}"
        else: # draft
            prompt = f"Based on the following email, draft a professional response. User request: {req.prompt}\n\nEmail Content:\n{email_context}"

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful executive assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return {"result": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

