"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { KnowledgeBase } from "@/components/knowledge-base";
import { CalendarView } from "@/components/calendar";
import { EmailView } from "@/components/email";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
<div className="h-screen min-h-0 bg-background flex flex-col p-4 md:p-8 font-sans overflow-hidden text-foreground">
        {/* Premium Glassmorphic Background Effect */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl z-0 mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-indigo-500/20 rounded-full blur-3xl z-0 mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full blur-3xl z-0 mix-blend-screen"></div>

      {/* App Layout */}
      <div className="z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar */}
<div className="w-full md:w-64 flex flex-col gap-8 bg-black/40 backdrop-blur-2xl border-white/10 rounded-3xl p-6 shadow-2xl h-full shrink-0">
  
  {/* Logo + Branding */}
  <div className="flex items-center gap-3">
    <img 
      src="/focusgrid-logo.png" 
      alt="FocusGrid Logo" 
      className="w-10 h-10"
    />
    
    <div>
      <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
        FocusGrid
      </h1>
      <p className="text-[10px] text-slate-500 font-medium leading-none">
        Your day. Automated.
      </p>
    </div>
  </div>
          
          <nav className="flex flex-col gap-2 flex-1">
            <Button 
  variant="ghost" 
  onClick={() => setActiveTab("chat")}
  className={`justify-start rounded-xl px-4 py-6 text-base font-semibold transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
  Command Console
</Button>

<Button 
  variant="ghost" 
  onClick={() => setActiveTab("notes")}
  className={`justify-start rounded-xl px-4 py-6 text-base font-semibold transition-all group ${activeTab === 'notes' ? 'bg-gradient-to-r from-emerald-500/20 to-purple-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 group-hover:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  Memory Vault
</Button>

<Button 
  variant="ghost" 
  onClick={() => setActiveTab("calendar")}
  className={`justify-start rounded-xl px-4 py-6 text-base font-semibold transition-all group ${activeTab === 'calendar' ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  Time Engine
</Button>

<Button 
  variant="ghost" 
  onClick={() => setActiveTab("emails")}
  className={`justify-start rounded-xl px-4 py-6 text-base font-semibold transition-all group mb-auto ${activeTab === 'emails' ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  Inbox AI
</Button>
            
            <div className="mt-8 border-t border-white/10 pt-4">
              <Button variant="ghost" className="justify-start rounded-xl px-4 py-6 text-base font-medium text-slate-400 hover:text-white w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </Button>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
<main className="flex-1 min-h-0 overflow-hidden bg-black/20 backdrop-blur-3xl border-white/5 rounded-3xl shadow-2xl relative flex flex-col">        {activeTab === 'chat' && <Chat />}
          {activeTab === 'notes' && <KnowledgeBase />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'emails' && <EmailView />}
        </main>
      </div>
    </div>
  );
}
