"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  Send,
  Trash2,
  Loader2,
  MessageSquare,
  User,
  PanelLeft,
  X,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, apiStream, ApiError } from "@/lib/api";
import type { Conversation, ChatMessage } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfigBanner } from "@/components/ConfigBanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How employable am I right now?",
  "What should I build next for my target role?",
  "Why is my credibility score low?",
  "Give me a 30-day plan to improve my profile.",
];

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <>
      <Button onClick={onNew} className="mb-3 w-full">
        <Plus className="h-4 w-4" /> New chat
      </Button>
      <div className="glass flex-1 overflow-y-auto rounded-2xl p-2">
        {conversations.length ? (
          conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                c.id === activeId
                  ? "bg-white/10 text-foreground"
                  : "text-muted hover:bg-white/5"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex flex-1 items-center gap-2 truncate text-left"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                aria-label="Delete conversation"
                className="opacity-60 transition hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted">
            No conversations yet.
          </p>
        )}
      </div>
    </>
  );
}

function ChatInner() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const msgs = await apiGet<ChatMessage[]>(
        `/api/chat/conversations/${id}/messages`
      );
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const convos = await apiGet<Conversation[]>("/api/chat/conversations");
        setConversations(convos);
        if (convos.length) {
          setActiveId(convos[0].id);
          await loadMessages(convos[0].id);
        }
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) {
          setError("Could not load your conversations.");
        }
      }
    })();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectConversation(id: string) {
    setMobileNav(false);
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    loadMessages(id);
  }

  async function newChat() {
    setMobileNav(false);
    try {
      const conv = await apiPost<Conversation>("/api/chat/conversations");
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
    } catch {
      setError("Could not start a new chat.");
    }
  }

  async function deleteConversation(id: string) {
    try {
      await apiDelete(`/api/chat/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setInput("");

    let id = activeId;
    if (!id) {
      try {
        const conv = await apiPost<Conversation>("/api/chat/conversations");
        id = conv.id;
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
      } catch {
        setError("Could not start a new chat.");
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
      apiGet<Conversation[]>("/api/chat/conversations")
        .then(setConversations)
        .catch(() => {});
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
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl gap-4 px-3 py-3 sm:px-5 sm:py-4">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col md:flex">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onDelete={deleteConversation}
          onNew={newChat}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              aria-hidden
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 flex h-dvh w-[min(18rem,85vw)] flex-col bg-[#0c0d12]/95 p-3 backdrop-blur-xl md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Conversations</span>
                <button
                  type="button"
                  onClick={() => setMobileNav(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={selectConversation}
                onDelete={deleteConversation}
                onNew={newChat}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Conversations"
            className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Career Twin Chat</span>
          <button
            type="button"
            onClick={newChat}
            aria-label="New chat"
            className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2">
                <Sparkles className="h-6 w-6 text-white" />
              </span>
              <div>
                <h1 className="text-xl font-semibold">Career Twin Chat</h1>
                <p className="mt-1 max-w-md text-sm text-muted">
                  Ask anything about your skills, projects, scores, and how to get
                  hired. I know your Career Twin.
                </p>
              </div>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="glass-hover rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-foreground/90"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  streaming={streaming}
                  last={i === messages.length - 1}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && <p className="px-5 text-sm text-red-300">{error}</p>}

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-white/5 p-3 sm:p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
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
              className="max-h-40 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted/70 focus-visible:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
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
      </main>
    </div>
  );
}

function MessageBubble({
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          isUser ? "bg-white/10" : "bg-gradient-to-br from-brand to-brand-2"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </span>
      <div
        className={cn(
          "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[80%]",
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
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand align-middle" />
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ConfigBanner />
      <Navbar />
      <ChatInner />
    </AuthGuard>
  );
}
