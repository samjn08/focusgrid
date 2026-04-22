"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RefreshCw, Mail, User, Clock, Wand2, FileText, Eraser } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  html?: string;
}

export function EmailView() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // For composing new emails
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/email/recent");
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailContent = async (msgId: string) => {
    setLoadingContent(true);
    try {
      const res = await fetch(`http://localhost:8000/api/email/${msgId}`);
      const data = await res.json();
      if (data.email) {
        setSelectedEmail(data.email);
        setAiResult("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleAiAssist = async (action: "summarize" | "draft") => {
    if (!selectedEmail) return;
    setAiLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/email/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmail.id,
          action,
          prompt: aiInput
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiResult(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    try {
      const res = await fetch("http://localhost:8000/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (data.message) {
        setComposeOpen(false);
        setTo("");
        setSubject("");
        setBody("");
        fetchEmails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden w-full min-h-0">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
            Gmail Intelligence
          </h2>
          <p className="text-slate-400 text-lg">
            Streamlined inbox with Pro AI assistance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchEmails}
            disabled={loading}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setComposeOpen(true)}
            className="bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </header>

      {/* Inbox List */}
      <Card className="flex-1 bg-black/40 border-white/10 backdrop-blur-md overflow-y-auto flex flex-col min-h-0">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-slate-100 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-rose-400" />
            Inbox
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading && emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                Loading your inbox...
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-20 text-slate-500 italic">Your inbox is empty.</div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => fetchEmailContent(email.id)}
                  className="group relative flex flex-col gap-1 p-4 rounded-xl transition-all cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200 group-hover:text-rose-300 transition-colors truncate max-w-[70%]">
                      {email.from}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {email.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 truncate">
                    {email.subject}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 italic">
                    {email.snippet}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Email View Modal */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl h-[85vh] bg-slate-950 border-white/10 text-slate-100 flex flex-col overflow-hidden shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-rose-300">
                  {selectedEmail?.subject}
                </DialogTitle>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {selectedEmail?.from}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {selectedEmail?.date}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden gap-6 py-6 font-sans min-h-0">
            {/* Main Content */}
            <div className="flex-[2] bg-white rounded-2xl border border-white/5 overflow-hidden flex flex-col">
              {selectedEmail?.html ? (
                <iframe
                  srcDoc={selectedEmail.html}
                  className="w-full h-full border-none bg-white"
                  title="Email Content"
                />
              ) : (
                <ScrollArea className="flex-1 p-6">
                  <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-slate-900 font-sans leading-relaxed">
                    {selectedEmail?.body}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* AI Sidebar */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-slate-200 flex items-center">
                  <Wand2 className="w-4 h-4 mr-2 text-rose-400" />
                  AI Assistant
                </h5>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                    onClick={() => handleAiAssist("summarize")}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileText className="w-4 h-4 mr-2" />}
                    Summarize
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 bg-black/40 rounded-2xl border border-white/5 p-4 overflow-hidden">
                <ScrollArea className="flex-1 text-sm text-slate-300">
                  {aiResult ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic text-center text-xs">
                      Select an action or ask to draft a reply below.
                    </div>
                  )}
                </ScrollArea>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask AI to draft a response..."
                    className="bg-black/60 border-white/10 text-xs min-h-[80px]"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-slate-100 text-slate-900 hover:bg-white font-bold"
                    onClick={() => handleAiAssist("draft")}
                    disabled={aiLoading || !aiInput}
                  >
                    Draft with AI
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Modal */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl bg-slate-950 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Compose New Email</DialogTitle>
            <DialogDescription className="text-slate-400">Send a direct message through Gmail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">To</label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Update on Project..."
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Message</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                className="bg-black/40 border-white/10 min-h-[200px]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={sending || !to || !subject || !body}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {sending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
