"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Plus,
  Maximize2,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
import { apiGet, apiPost, apiStream } from "@/lib/api";
import type { Conversation, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_ASK_EVENT } from "@/lib/chatBus";

const SUGGESTIONS = [
  "What should I learn next?",
  "Which project increases my score fastest?",
  "Am I interview ready?",
];

/** Floating Career Twin Chat launcher + panel for the dashboard. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Lazy-init on first open: load the most recent conversation if any.
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    (async () => {
      try {
        const convos = await apiGet<Conversation[]>("/api/chat/conversations");
        if (convos.length) {
          setActiveId(convos[0].id);
          const msgs = await apiGet<ChatMessage[]>(
            `/api/chat/conversations/${convos[0].id}/messages`
          );
          setMessages(msgs);
        }
      } catch {
        /* not configured / none yet — start fresh */
      }
    })();
  }, [open, loaded]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Allow other parts of the app to open the widget with a prefilled question.
  useEffect(() => {
    function onAsk(e: Event) {
      const prompt = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (prompt) setInput(prompt);
    }
    window.addEventListener(CHAT_ASK_EVENT, onAsk as EventListener);
    return () => window.removeEventListener(CHAT_ASK_EVENT, onAsk as EventListener);
  }, []);

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setInput("");
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setInput("");

    let id = activeId;
    if (!id) {
      try {
        const conv = await apiPost<Conversation>("/api/chat/conversations");
        id = conv.id;
        setActiveId(conv.id);
      } catch {
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      await apiStream(
        `/api/chat/conversations/${id}/stream`,
        { message },
        (chunk) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          });
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, content: last.content || `_${msg}_` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="glass fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/50 sm:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-sm font-semibold">Ask Your Career Twin</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={newChat}
                  aria-label="New chat"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <Link
                  href="/chat"
                  aria-label="Open full chat"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                >
                  <Maximize2 className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="max-w-[16rem] text-sm text-muted">
                    Ask anything about your skills, scores, and how to get hired — I
                    know your Career Twin.
                  </p>
                  <div className="flex w-full flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="glass-hover rounded-xl border border-white/10 px-3 py-2 text-left text-xs text-foreground/90"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <Bubble
                    key={i}
                    message={m}
                    streaming={streaming}
                    last={i === messages.length - 1}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-white/5 p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask your Career Twin…"
                  className="max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted/70 focus-visible:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                />
                <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
                  {streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open Career Twin chat"}
        className="btn-glow fixed bottom-6 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-xl transition hover:scale-105 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </>
  );
}

function Bubble({
  message,
  streaming,
  last,
}: {
  message: ChatMessage;
  streaming: boolean;
  last: boolean;
}) {
  const isUser = message.role === "user";
  const showCursor = streaming && last && !isUser;
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
          isUser ? "bg-white/10" : "bg-gradient-to-br from-brand to-brand-2"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-white" />
        )}
      </span>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-brand/20 text-foreground"
            : "border border-white/10 bg-white/5 text-foreground/90"
        )}
      >
        {message.content}
        {showCursor && message.content === "" && (
          <span className="text-muted">Thinking…</span>
        )}
        {showCursor && message.content !== "" && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-brand align-middle" />
        )}
      </div>
    </div>
  );
}
