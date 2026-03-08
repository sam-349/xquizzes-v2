import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, X, Plus, Trash2 } from 'lucide-react';
import API from '../services/api';

// Simple localStorage-backed chat widget. Stores sessions per userId key.
// Messages: { id, role: 'user'|'bot', text, edited, createdAt }

const STORAGE_PREFIX = 'xquizzes_chat_sessions_';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function ChatWidget({ userId }) {
  const storageKey = `${STORAGE_PREFIX}${userId || 'anon'}`;
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [editing, setEditing] = useState({ sessionId: null, messageId: null, text: '' });
  const [modalMounted, setModalMounted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSessions(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  useEffect(() => {
    // auto-scroll when active session or sessions change
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      } catch (e) {
        // fallback
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [sessions, activeId]);

  const createSession = (title = 'New Chat') => {
    const s = { id: uid(), title, messages: [], createdAt: Date.now() };
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  };

  const deleteSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const updateSessionTitle = (id, title) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const addMessage = (sessionId, role, text) => {
    const msg = { id: uid(), role, text, edited: false, createdAt: Date.now() };
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s)));
    return msg;
  };

  const editMessage = (sessionId, messageId, newText) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, text: newText, edited: true } : m)) }
          : s
      )
    );
  };

  const deleteMessage = (sessionId, messageId) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, messages: s.messages.filter((m) => m.id !== messageId) } : s)));
  };

  const activeSession = sessions.find((s) => s.id === activeId);

  const send = async () => {
    if (!input.trim() || !activeId) return;
    const userMsg = addMessage(activeId, 'user', input.trim());
    setInput('');
    setLoading(true);

    try {
      // Build messages for backend, mapping local roles to API roles
      const session = sessions.find((s) => s.id === activeId);
      const payloadMessages = (session?.messages || [])
        .map((m) => ({ role: m.role === 'bot' ? 'assistant' : m.role === 'user' ? 'user' : 'user', text: m.text }))
        // include the just-sent message if not yet in session (addMessage already appended it)
        .slice(-20); // limit to last 20 messages to reduce size

      const resp = await API.post('/chat', { messages: payloadMessages });
      const replyText = resp?.data?.reply || 'Sorry, I could not generate a response.';
      addMessage(activeId, 'bot', replyText);
    } catch (e) {
      console.error('Chat send error', e);
      addMessage(activeId, 'bot', 'Sorry, something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const generatePlaceholderReply = (prompt) => {
    // Very simple canned replies that encourage educational conversation.
    const lower = prompt.toLowerCase();
    if (lower.includes('explain') || lower.includes('what is') || lower.includes('define')) {
      return "Here's a concise explanation I prepared: (replace with real AI). Try asking for examples or follow-ups.";
    }
    if (lower.includes('compare') || lower.includes('difference')) {
      return "Here's a comparison summary: (replace with real AI). You can ask for a table or examples.";
    }
    return "I can help with study summaries, explanations, practice questions, and references. (This is a placeholder reply.)";
  };

  function TypingIndicator() {
    return (
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.12s' }} />
        <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.24s' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Floating button */}
      <button
        aria-label="Open chat"
        onClick={() => {
          // Open centered modal and start a new chat by default
          setOpen(true);
          // trigger mount animation
          setModalMounted(false);
          setTimeout(() => setModalMounted(true), 20);
          createSession('New Chat');
        }}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Centered modal panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className={`relative z-10 w-[min(70vw,1100px)] h-[80vh] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col transition-all duration-200 ease-out ${modalMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                <div>
                  <div className="text-sm font-semibold">Study Assistant</div>
                  <div className="text-xs text-gray-500">AI helper (local mode)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  title="New chat"
                  onClick={() => createSession('New Chat')}
                  className="px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-md"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" /> New
                </button>
                <button title="Close" onClick={() => setOpen(false)} className="p-1 text-gray-600 hover:text-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sessions list */}
              <div className="w-56 border-r border-gray-100 bg-gray-50 h-full overflow-y-auto">
                <div className="p-3">
                  {sessions.length === 0 && <div className="text-sm text-gray-400">No chats yet</div>}
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${s.id === activeId ? 'bg-white shadow-sm' : ''}`}
                      onClick={() => setActiveId(s.id)}
                    >
                      <div className="flex-1 text-sm truncate">{s.title}</div>
                      <button
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col h-full">
                {!activeSession ? (
                  <div className="p-6 text-sm text-gray-500">Select or create a chat to start.</div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <input
                        value={activeSession.title}
                        onChange={(e) => updateSessionTitle(activeSession.id, e.target.value)}
                        className="text-sm font-medium bg-transparent w-64"
                      />
                      <div className="text-xs text-gray-400">{new Date(activeSession.createdAt).toLocaleString()}</div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
                      {activeSession.messages.map((m) => (
                          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-3 rounded-lg transition transform duration-150 ease-out hover:scale-105 ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                            {editing.sessionId === activeSession.id && editing.messageId === m.id ? (
                              <div>
                                <textarea
                                  value={editing.text}
                                  onChange={(e) => setEditing((s) => ({ ...s, text: e.target.value }))}
                                  className="w-full p-2 rounded text-sm"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    className="px-3 py-1 bg-white text-primary-600 rounded border"
                                    onClick={() => {
                                      // Save edit
                                      editMessage(activeSession.id, m.id, editing.text);
                                      setEditing({ sessionId: null, messageId: null, text: '' });
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="px-3 py-1 bg-gray-200 rounded"
                                    onClick={() => setEditing({ sessionId: null, messageId: null, text: '' })}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                                <div className={`flex items-center gap-3 mt-2 text-xs opacity-80 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  {m.role === 'user' ? (
                                    <>
                                      <button
                                        className="text-gray-200 hover:text-white"
                                        onClick={() => setEditing({ sessionId: activeSession.id, messageId: m.id, text: m.text })}
                                      >
                                        Edit
                                      </button>
                                      <button className="text-red-200 hover:text-white" onClick={() => deleteMessage(activeSession.id, m.id)}>
                                        Delete
                                      </button>
                                    </>
                                  ) : (
                                    <div className="text-xs text-gray-500">AI</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900">
                            <TypingIndicator />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white">
                      <div className="flex gap-3">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && send()}
                          placeholder="Ask about topics, summaries, practice questions..."
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <button onClick={send} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                          {loading ? '...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
