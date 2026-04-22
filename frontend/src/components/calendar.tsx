"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CalendarView() {
  const [events, setEvents] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/calendar/upcoming");
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      } else if (data.error) {
        setEvents(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      setEvents("Failed to retrieve events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSchedule = async () => {
    if (!summary || !startTime || !endTime) return;
    setScheduling(true);
    try {
      // Ensure time matches ISO 8601 roughly required by google wrapper
      // Local datetime-local input matches "YYYY-MM-DDThh:mm", which we can send directly
      const res = await fetch("http://localhost:8000/api/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          description: "Scheduled via AI AI Productivity OS"
        }),
      });
      const data = await res.json();
      if (data.message) {
        alert("Success: " + data.message);
        setSummary("");
        setStartTime("");
        setEndTime("");
        fetchEvents();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to schedule event.");
    } finally {
      setScheduling(false);
    }
  };

  return (
<div className="flex-1 min-h-0 flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden w-full">
  <header className="space-y-2">
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Calendar & Scheduling
        </h2>
        <p className="text-slate-400 text-lg">
          Manage your Google Calendar meetings and schedules directly or through the AI agent.
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 p-1">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Form */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4">
            <CardTitle className="text-slate-100">Schedule New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="text-sm font-medium text-slate-300">Event Title</label>
              <Input 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Study Session"
                className="mt-1 bg-black/40 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Start Time</label>
                <Input 
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 bg-black/40 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">End Time</label>
                <Input 
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>
            <Button 
              onClick={handleSchedule} 
              disabled={scheduling || !summary || !startTime || !endTime}
              className="w-full bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
            >
              {scheduling ? "Scheduling..." : "Schedule Event"}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md flex flex-col h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4">
            <CardTitle className="text-slate-100">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading} className="text-slate-400 hover:text-white hover:bg-white/10">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm prose-invert max-w-none text-slate-300">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-transparent p-0">
                {events || "Loading your calendar..."}
              </pre>
            </div>
          </div>
        </Card>
      </div>
</div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-colors"></div>
        <h3 className="text-xl font-bold text-blue-100 mb-2">AI Scheduling Tips</h3>
        <p className="text-slate-300 max-w-2xl">
          You don't need to manually create events! Just toggle over to the <strong>Chat Assistant</strong> and say:<br/>
          <span className="italic text-blue-300">"Schedule a meeting with the team tomorrow at 2 PM for 1 hour."</span><br/>
          The AI will automatically communicate with your Google Calendar and set it up.
        </p>
      </div>
    </div>
  );
}
