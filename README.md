# **FocusGrid: AI Personal Productivity Suite**

**Your day. Automated.**

FocusGrid is a premium, agentic AI platform designed to streamline your workflow by unifying your notes, calendar, and emails into a single intelligent system. Powered by advanced large language models, FocusGrid acts as your personal AI operator—helping you execute tasks, retrieve knowledge, and manage your day effortlessly.

---

## ✨ Key Features

### 🤖 Smart AI Assistant

* **Agentic Intelligence**: Execute tasks, search your knowledge base, and manage your calendar or email—automatically.
* **Natural Language Control**: Simply say *“Schedule a meeting tomorrow at 2 PM”* or *“Summarize that email from Bob”*.

---

### 📚 Knowledge Base

* **Document Processing**: Upload PDFs or text files to build your private knowledge repository.
* **Smart Retrieval**: Instantly find relevant insights using semantic, vector-based search.

---

### 📅 Calendar Integration

* **Real-time Sync**: View and manage your schedule in a clean, interactive interface.
* **AI Scheduling**: Understands timezones, availability, and context to book events seamlessly.

---

### 📧 Email Intelligence Center

* **Modern Inbox**: Clean, focused view of recent emails with previews.
* **AI Assistance**: One-click summarization and intelligent reply drafting.
* **Full Rendering**: Supports rich HTML emails, newsletters, and branded content.

---

## 🛠️ Technology Stack

### Backend

* **Framework**: FastAPI (Python)
* **Database**: SQLAlchemy (SQLite)
* **Vector Store**: ChromaDB
* **AI Engine**: OpenAI GPT-4o / GPT-5-mini
* **APIs**: Google Gmail & Calendar APIs

---

### Frontend

* **Framework**: Next.js (React)
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui
* **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

* Python 3.9+
* Node.js 18+
* Google Cloud Project with Gmail and Calendar APIs enabled

---

### Backend Setup

1. Navigate to the `backend` directory.
2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:

   ```env
   OPENAI_API_KEY=your_key_here
   ```
5. Place your `credentials.json` (from Google Cloud) in the root of the `backend` folder.
6. Start the server:

   ```bash
   uvicorn app.main:app --reload
   ```

---

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the development server:

   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── agent.py            # AI agent logic & automation tools
│   │   ├── calendar_service.py # Calendar integration
│   │   ├── gmail_service.py    # Email integration
│   │   ├── main.py             # FastAPI routes
│   │   ├── rag.py              # Knowledge base processing
│   │   └── models.py           # Database schemas
│   └── credentials.json        # Google OAuth client secrets
├── frontend/
│   ├── src/
│   │   ├── components/         # UI components (Chat, Email, etc.)
│   │   └── app/                # Next.js pages
└── README.md
```

---

## 🛡️ Privacy & Security

* **Local Data Storage**: Tasks, notes, and embeddings are stored locally using SQLite and ChromaDB.
* **Secure OAuth**: Google tokens (`token.json`, `gmail_token.json`) remain on your machine and are never shared.
* **Credential Isolation**: Sensitive keys are stored in `.env` and excluded via `.gitignore`.

---

## ⚡ Summary

FocusGrid transforms how you manage your day by combining AI, automation, and context into a single system. Instead of juggling tools, you operate from one intelligent grid—where everything works together.