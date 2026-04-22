"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ... existing message types etc ...
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your AI Productivity Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.filter(m => m.role !== "system") }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data: Message = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col bg-background/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden rounded-3xl">
      <CardHeader className="px-6 pt-5 pb-3 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <CardTitle className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        {/* Glow effect inside chat */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-[50px] pointer-events-none"></div>
        
        <ScrollArea className="h-full p-6">
          <div className="flex flex-col gap-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-5 py-4 text-sm ${
                  msg.role === "user"
                    ? "ml-auto bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/10 text-foreground backdrop-blur-md border border-white/10 shadow-lg"
                }`}
              >
                {/* Use React Markdown to render content formatted as Markdown */}
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="bg-white/10 text-foreground flex w-max max-w-[80%] flex-col gap-2 rounded-2xl px-5 py-4 text-sm animate-pulse backdrop-blur-md border border-white/10">
                <div className="flex space-x-2 items-center h-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 bg-white/5 backdrop-blur-md border-t border-white/5">
        <form
          className="flex w-full space-x-3 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to schedule time, create tasks, or search notes..."
            className="flex-1 bg-black/40 border-white/10 focus-visible:ring-emerald-500 rounded-2xl h-12 px-6"
            disabled={loading}
          />
          <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
