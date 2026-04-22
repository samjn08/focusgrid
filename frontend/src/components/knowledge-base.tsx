"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/notes/recent");
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleViewDocument = async (id: number) => {
    setLoadingDoc(true);
    try {
      const res = await fetch(`http://localhost:8000/api/notes/${id}`);
      if (res.ok) {
        setSelectedDocument(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocuments();
        if (selectedDocument?.id === id) setSelectedDocument(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch("http://localhost:8000/api/notes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/notes/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      alert(`Upload Success: ${data.message} ${data.summary}`);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      alert("Error uploading file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
      <header className="space-y-2">
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
          Knowledge Base
        </h2>
        <p className="text-slate-400 text-lg">
          Upload, search, and manage your notes and documents.
        </p>
      </header>

      {/* Semantic Search Area */}
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-3xl transition-all group-hover:bg-emerald-500/30"></div>
        <div className="relative flex items-center bg-black/40 border border-white/10 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ask a question or search your notes semantics..."
            className="flex-1 bg-transparent border-none text-lg px-4 focus-visible:ring-0 placeholder:text-slate-500 text-slate-100"
          />
          <Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8 py-6 shadow-lg">
            Search
          </Button>
        </div>
      </div>
      
      {searchResults && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-100 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h4 className="font-bold text-emerald-400">Search Findings:</h4>
            <button onClick={() => setSearchResults("")} className="text-xs text-emerald-400 hover:text-emerald-300">Clear</button>
          </div>
          <ScrollArea className="h-[250px] pr-4">
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 pb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {searchResults}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-slate-200">Recent Documents</h3>
          <ScrollArea className="flex-1 h-[400px]">
            <div className="grid grid-cols-1 gap-4 pb-4">
              {documents.length === 0 && <p className="text-slate-500 text-sm">No recent documents found.</p>}
              {documents.map((doc, i) => (
                <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => handleViewDocument(doc.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md text-slate-100 group-hover:text-emerald-400 transition-colors break-words w-2/3">{doc.title}</CardTitle>
                      <div className="flex flex-col items-end gap-2 w-1/3">
                        <span className="text-xs text-slate-500 text-right">{doc.date}</span>
                        <button onClick={(e) => handleDeleteDocument(e, doc.id)} className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 absolute top-2 right-2 md:static md:opacity-100 md:hidden group-hover:md:block">Delete</button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 line-clamp-3">
                      <span className="font-semibold text-purple-400">AI Summary: </span>
                      {doc.summary || "Processing..."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="md:col-span-1 flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-slate-200">Upload Notes</h3>
          <Card 
            className="flex-1 border-dashed border-2 border-emerald-500/30 bg-black/20 backdrop-blur-md flex flex-col items-center justify-center p-8 hover:bg-emerald-500/5 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.txt,.md" 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 text-emerald-400 ${uploading ? 'animate-bounce' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p className="text-center font-medium text-slate-300 mb-2">
              {uploading ? "Uploading and processing..." : "Click to select or drag & drop"}
            </p>
            <p className="text-center text-xs text-slate-500 mb-6">Supports PDF, TXT, MD</p>
            <Button disabled={uploading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
              {uploading ? "Processing..." : "Browse Files"}
            </Button>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#191022] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="font-bold text-lg text-slate-100">{selectedDocument.title}</h3>
                <span className="text-xs text-slate-500">{selectedDocument.date}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => handleDeleteDocument(e, selectedDocument.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedDocument(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/5 border-b border-white/5">
              <p className="text-sm text-emerald-400 font-medium">AI Summary:</p>
              <p className="text-sm text-slate-300 mt-1">{selectedDocument.summary}</p>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="prose prose-invert max-w-none prose-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedDocument.content || "No content available for this document."}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
