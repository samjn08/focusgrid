import os
import uuid
import tiktoken
from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session
from app.models import Document
from openai import AsyncOpenAI
from app.database import knowledge_collection

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

def get_text_chunks(text: str, chunk_size: int = 500) -> list[str]:
    """Splits a string into a list of chunks based on token approximations."""
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    
    chunks = []
    for i in range(0, len(tokens), chunk_size):
        chunk_tokens = tokens[i:i + chunk_size]
        chunks.append(enc.decode(chunk_tokens))
    
    return chunks

async def process_document(file: UploadFile, db: Session) -> dict:
    """Reads a PDF or text file, chunks it, creates embeddings, and stores in ChromaDB. Also saves a Document record."""
    content = ""
    
    # Read the file data
    file_bytes = await file.read()
    
    if file.filename and file.filename.endswith(".pdf"):
        # Write temporarily to parse
        temp_path = f"temp_{uuid.uuid4()}.pdf"
        with open(temp_path, "wb") as f:
            f.write(file_bytes)
        
        reader = PdfReader(temp_path)
        for page in reader.pages:
            content += page.extract_text() + "\n"
            
        os.remove(temp_path)
    else:
        # Fallback to plain text if not PDF
        content = file_bytes.decode('utf-8')
        
    if not content.strip():
        return {"chunks": 0, "summary": "Empty file.", "id": 0}
        
    chunks = get_text_chunks(content, 500)
    
    # Generate embeddings asynchronously for all chunks
    # Note: For production with many chunks, batching may be needed.
    response = await client.embeddings.create(
        input=chunks,
        model="text-embedding-3-small"
    )
    
    embeddings = [d.embedding for d in response.data]
    
    # Save to SQLite first to get an ID
    new_doc = Document(filename=file.filename, summary="Processing...", content=content)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # Generate unique IDs for each chunk
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [{"source": file.filename, "document_id": new_doc.id, "chunk_index": i} for i in range(len(chunks))]
    
    # Add to ChromaDB
    knowledge_collection.add(
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )
    
    # Generate brief summary of first chunk
    summary = "No summary available."
    if chunks:
        # Avoid indexing issues
        first_chunk = chunks[0]
        summary_prompt = f"Summarize the following text in 2 short sentences max:\n\n{first_chunk[:1500] if len(first_chunk) > 1500 else first_chunk}"
        try:
            summary_res = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": summary_prompt}]
            )
            summary = summary_res.choices[0].message.content
        except Exception:
            pass

    # Update summary in SQLite
    new_doc.summary = summary
    db.commit()
    
    return {"chunks": len(chunks), "summary": summary, "id": new_doc.id}

async def delete_document_from_rag(document_id: int):
    """Deletes a document's chunks from ChromaDB by document_id metadata."""
    knowledge_collection.delete(where={"document_id": document_id})

async def query_knowledge_base(query: str, n_results: int = 4) -> str:
    """Queries chroma db for contextual matches to a string query."""
    response = await client.embeddings.create(
        input=[query],
        model="text-embedding-3-small"
    )
    
    query_embedding = response.data[0].embedding
    
    results = knowledge_collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    docs = results.get("documents", [])
    metas = results.get("metadatas", [])
    
    if not docs or not docs[0]:
        return "No relevant notes found."
        
    combined_parts = []
    for doc_text, meta in zip(docs[0], metas[0]):
        source = meta.get("source", "Unknown")
        combined_parts.append(f"**Source: {source}**\n{doc_text}")
        
    combined_context = "\n\n---\n\n".join(combined_parts)
    
    prompt = f"""
    Answer the user's query comprehensively yet concisely using ONLY the provided context from their notes.
    If the context does not contain the answer, explicitly state that you don't know based on the notes.
    Format your response cleanly using Markdown (use lists, bold text, etc., where appropriate).
    Always include brief markdown format citations to the Source filenames where appropriate.
    
    User Query: {query}
    
    Context:
    {combined_context}
    """
    
    try:
        completion = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"**Found Relevant Context (Summary failed: {str(e)}):**\n\n{combined_context}"
