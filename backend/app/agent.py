import json
from datetime import datetime
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.models import Task
from app.rag import query_knowledge_base
from app.calendar_service import get_upcoming_events, schedule_event
from app.gmail_service import get_recent_emails, send_email, get_email_content

import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class Message(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    messages: List[Message]

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new pending task in the user's productivity system.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "The title of the task"},
                    "description": {"type": "string", "description": "Detailed description of the task"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List all current pending tasks.",
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Search the user's previously uploaded notes and knowledge base for context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query to look up"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_events",
            "description": "Get upcoming calendar events from Google Calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_results": {"type": "integer", "description": "Maximum number of events to return. Defaults to 10."}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_event",
            "description": "Schedule a new event on Google Calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string", "description": "Title of the event"},
                    "start_time": {"type": "string", "description": "Start time in ISO 8601 format (e.g., 2026-03-16T10:00:00)"},
                    "end_time": {"type": "string", "description": "End time in ISO 8601 format (e.g., 2026-03-16T11:00:00)"},
                    "description": {"type": "string", "description": "Description of the event (optional)"}
                },
                "required": ["summary", "start_time", "end_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_emails",
            "description": "Read recent emails from the user's Gmail inbox.",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_results": {"type": "integer", "description": "Maximum number of emails to return. Defaults to 5."}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email using the user's Gmail account.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "The recipient's email address"},
                    "subject": {"type": "string", "description": "The subject of the email"},
                    "body": {"type": "string", "description": "The text body of the email"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_email_content",
            "description": "Read the full content of a specific email message.",
            "parameters": {
                "type": "object",
                "properties": {
                    "msg_id": {"type": "string", "description": "The unique ID of the email message."}
                },
                "required": ["msg_id"]
            }
        }
    }
]

async def execute_tool(func_name: str, args: dict, db: Session) -> str:
    if func_name == "create_task":
        new_task = Task(title=args.get("title"), description=args.get("description", ""))
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return f"Task created successfully with ID: {new_task.id}"
    elif func_name == "list_tasks":
        tasks = db.query(Task).filter(Task.completed == False).all()
        if not tasks:
            return "No pending tasks."
        return "\\n".join([f"- [ ] {t.id}: {t.title} ({t.description})" for t in tasks])
    elif func_name == "search_knowledge_base":
        query = args.get("query", "")
        return await query_knowledge_base(query)
    elif func_name == "get_upcoming_events":
        max_results = args.get("max_results", 10)
        return json.dumps(get_upcoming_events(max_results))
    elif func_name == "schedule_event":
        return schedule_event(
            summary=args.get("summary"),
            start_time=args.get("start_time"),
            end_time=args.get("end_time"),
            description=args.get("description", "")
        )
    elif func_name == "get_recent_emails":
        max_results = args.get("max_results", 5)
        return json.dumps(get_recent_emails(max_results))
    elif func_name == "send_email":
        return send_email(
            to=args.get("to"),
            subject=args.get("subject"),
            body=args.get("body")
        )
    elif func_name == "get_email_content":
        return json.dumps(get_email_content(args.get("msg_id")))
    return "Unknown tool."

async def run_agent(messages: List[Message], db: Session):
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in messages]
    current_time = datetime.now().astimezone().strftime('%Y-%m-%d %H:%M:%S %Z')
    system_prompt = {
        "role": "system", 
        "content": f"You are a helpful Personal Productivity AI Assistant. You have tools available to manage tasks, schedule calendar events, check and send emails via Gmail, and search notes. Auto-format your responses using Markdown. The current date and time is {current_time}.\n\nIMPORTANT GMAIL RULES:\n1. You CANNOT know an email's `msg_id` without listing them first. \n2. To read or summarize an email, you MUST first call `get_recent_emails` to retrieve the inbox.\n3. Wait for the list of emails to return, THEN in a SUBSEQUENT turn, call `get_email_content` using a real `id` value from the output.\n4. NEVER guess, placeholder, or halluncinate a message ID. \n5. NEVER attempt to call `get_recent_emails` and `get_email_content` in the same response; you must see the IDs first.\n\nWhen scheduling events, pay close attention to the current date to determine correct days (like 'tomorrow' or 'next monday'), and format times using the correct ISO 8601 offset based on this timezone."
    }
    openai_messages.insert(0, system_prompt)

    # First call to LLM
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=openai_messages,
        tools=TOOLS,
        tool_choice="auto"
    )
    
    response_message = response.choices[0].message
    
    # Check if a tool was called
    if response_message.tool_calls:
        # Append the assistant message with tool calls
        openai_messages.append(response_message)
        
        # Execute each tool and append the results
        for tool_call in response_message.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            
            tool_result = await execute_tool(func_name, args, db)
            
            openai_messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": func_name,
                "content": tool_result
            })
            
        # Second call to LLM to summarize the tool result
        second_response = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=openai_messages,
        )
        return second_response.choices[0].message
        
    return response_message
