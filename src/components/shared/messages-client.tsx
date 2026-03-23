"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Badge available if needed
import { NewConversationDialog } from "@/components/shared/new-conversation-dialog";
import {
  getConversationsWithUnreadCounts,
  getConversation,
  sendMessage,
  markAsRead,
} from "@/actions/messaging";
import type {
  ConversationPreview,
  ConversationWithMessages,
} from "@/actions/messaging";
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  ArrowLeft,
  Users,
  Radio,
  Hash,
  MessageCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface MessagesClientProps {
  conversations: ConversationPreview[];
  currentUserId: string;
  userRole: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getConversationName(
  conversation: ConversationPreview | ConversationWithMessages,
  currentUserId: string
): string {
  if (conversation.title) return conversation.title;

  const others = conversation.participants.filter(
    (p) => p.userId !== currentUserId
  );

  if (others.length === 0) return "You";
  if (others.length === 1) return others[0].user.name;
  if (others.length === 2)
    return `${others[0].user.name} and ${others[1].user.name}`;
  return `${others[0].user.name} and ${others.length - 1} others`;
}

function getConversationInitials(
  conversation: ConversationPreview | ConversationWithMessages,
  currentUserId: string
): string {
  if (conversation.type === "broadcast") return "BC";

  const others = conversation.participants.filter(
    (p) => p.userId !== currentUserId
  );

  if (others.length === 0) return "Y";
  return getInitials(others[0].user.name);
}

function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullTimestamp(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateDivider(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function getConversationTypeIcon(type: string) {
  switch (type) {
    case "broadcast":
      return <Radio size={12} />;
    case "shift_thread":
      return <Hash size={12} />;
    default:
      return null;
  }
}

function getConversationTypeBadge(type: string) {
  switch (type) {
    case "broadcast":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md">
          <Radio size={10} /> Broadcast
        </span>
      );
    case "shift_thread":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">
          <Hash size={10} /> Shift
        </span>
      );
    default:
      return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────

export function MessagesClient({
  conversations: initialConversations,
  currentUserId,
  userRole: _userRole,
}: MessagesClientProps) {
  const [conversations, setConversations] =
    useState<ConversationPreview[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [activeConversation, setActiveConversation] =
    useState<ConversationWithMessages | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [mobileShowConversation, setMobileShowConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load a conversation
  const loadConversation = useCallback(
    async (conversationId: string) => {
      setLoadingConversation(true);
      setActiveConversationId(conversationId);
      setMobileShowConversation(true);

      try {
        const conv = await getConversation(conversationId);
        setActiveConversation(conv);

        // Mark as read
        await markAsRead(conversationId);

        // Update unread count in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        // Handle error
      } finally {
        setLoadingConversation(false);
      }
    },
    []
  );

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (activeConversation) {
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversation, scrollToBottom]);

  // Focus textarea when conversation loads
  useEffect(() => {
    if (activeConversation && !loadingConversation) {
      textareaRef.current?.focus();
    }
  }, [activeConversation, loadingConversation]);

  // Poll for new messages (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Refresh conversation list
        const updated = await getConversationsWithUnreadCounts();
        setConversations(updated);

        // Refresh active conversation if one is open
        if (activeConversationId) {
          const conv = await getConversation(activeConversationId);
          if (conv) {
            setActiveConversation(conv);
            await markAsRead(activeConversationId);
          }
        }
      } catch {
        // Silently handle polling errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversationId || sendingMessage) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const result = await sendMessage(activeConversationId, content);

      if (result.success) {
        // Reload conversation to show new message
        const conv = await getConversation(activeConversationId);
        setActiveConversation(conv);

        // Update conversation list
        const updated = await getConversationsWithUnreadCounts();
        setConversations(updated);
      }
    } catch {
      // Restore message on error
      setMessageInput(content);
    } finally {
      setSendingMessage(false);
      textareaRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  // Handle new conversation created
  const handleConversationCreated = (conversationId: string) => {
    loadConversation(conversationId);
    // Refresh conversation list
    getConversationsWithUnreadCounts().then(setConversations).catch(() => {});
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchFilter.trim()) return true;
    const name = getConversationName(conv, currentUserId).toLowerCase();
    const lastMsg = conv.lastMessage?.content?.toLowerCase() ?? "";
    const filter = searchFilter.toLowerCase();
    return name.includes(filter) || lastMsg.includes(filter);
  });

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mobileShowConversation && (
            <button
              onClick={() => setMobileShowConversation(false)}
              className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNewDialog(true)}
          className="hidden sm:inline-flex"
        >
          <Plus size={16} />
          New Message
        </Button>
        <Button
          size="icon"
          onClick={() => setShowNewDialog(true)}
          className="sm:hidden h-9 w-9"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List (left panel) */}
        <div
          className={cn(
            "w-full lg:w-[340px] xl:w-[380px] bg-white border-r border-gray-200 flex flex-col shrink-0",
            mobileShowConversation && "hidden lg:flex"
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {searchFilter
                    ? "No matching conversations"
                    : "No messages yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchFilter
                    ? "Try a different search term"
                    : "Start a new conversation to get started"}
                </p>
                {!searchFilter && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewDialog(true)}
                    className="mt-4"
                  >
                    <Plus size={14} />
                    New Message
                  </Button>
                )}
              </div>
            )}

            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const name = getConversationName(conv, currentUserId);
              const initials = getConversationInitials(conv, currentUserId);
              const typeIcon = getConversationTypeIcon(conv.type);

              return (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors relative",
                    isActive
                      ? "bg-blue-50 border-l-[3px] border-l-blue-600"
                      : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                      conv.type === "broadcast"
                        ? "bg-purple-100 text-purple-700"
                        : conv.type === "shift_thread"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {typeIcon ?? initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          conv.unreadCount > 0
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"
                        )}
                      >
                        {name}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                          {formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          conv.unreadCount > 0
                            ? "text-gray-600"
                            : "text-gray-400"
                        )}
                      >
                        {conv.lastMessage
                          ? conv.lastMessage.isSystem
                            ? conv.lastMessage.content
                            : `${conv.lastMessage.sender.name}: ${conv.lastMessage.content}`
                          : "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 shrink-0">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Conversation (right panel) */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-gray-50 min-w-0",
            !mobileShowConversation && "hidden lg:flex"
          )}
        >
          {!activeConversation && !loadingConversation && (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-5 shadow-sm">
                <MessageSquare size={36} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm">
                Choose a conversation from the list or start a new one to begin
                messaging.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(true)}
                className="mt-5"
              >
                <Plus size={16} />
                New Message
              </Button>
            </div>
          )}

          {loadingConversation && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading conversation...</p>
              </div>
            </div>
          )}

          {activeConversation && !loadingConversation && (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    activeConversation.type === "broadcast"
                      ? "bg-purple-100 text-purple-700"
                      : activeConversation.type === "shift_thread"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                  )}
                >
                  {getConversationTypeIcon(activeConversation.type) ??
                    getConversationInitials(activeConversation, currentUserId)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {getConversationName(activeConversation, currentUserId)}
                    </h2>
                    {getConversationTypeBadge(activeConversation.type)}
                  </div>
                  {activeConversation.participants.length > 2 && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={11} />
                      {activeConversation.participants.length} participants
                    </p>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                {activeConversation.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                      <MessageSquare size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  </div>
                )}

                {activeConversation.messages.map((msg, idx) => {
                  const isOwn = msg.senderId === currentUserId;
                  const prevMsg = activeConversation.messages[idx - 1];
                  const showDateDivider =
                    !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
                  const showSenderName =
                    !isOwn &&
                    !msg.isSystem &&
                    activeConversation.participants.length > 2 &&
                    (!prevMsg ||
                      prevMsg.senderId !== msg.senderId ||
                      showDateDivider);

                  return (
                    <div key={msg.id}>
                      {/* Date Divider */}
                      {showDateDivider && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                            {formatDateDivider(msg.createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}

                      {/* System Message */}
                      {msg.isSystem && (
                        <div className="flex justify-center my-2">
                          <p className="text-sm text-gray-400 italic text-center max-w-md">
                            {msg.content}
                          </p>
                        </div>
                      )}

                      {/* Regular Message */}
                      {!msg.isSystem && (
                        <div
                          className={cn(
                            "flex mb-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] sm:max-w-[65%]",
                              isOwn ? "items-end" : "items-start"
                            )}
                          >
                            {showSenderName && (
                              <p className="text-[11px] font-medium text-gray-500 mb-0.5 px-1">
                                {msg.sender.name}
                              </p>
                            )}
                            <div
                              className={cn(
                                "px-3.5 py-2 text-sm leading-relaxed break-words",
                                isOwn
                                  ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                                  : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
                              )}
                            >
                              {msg.content.split("\n").map((line, i) => (
                                <span key={i}>
                                  {line}
                                  {i < msg.content.split("\n").length - 1 && (
                                    <br />
                                  )}
                                </span>
                              ))}
                            </div>
                            <p
                              className={cn(
                                "text-[10px] text-gray-400 mt-0.5 px-1",
                                isOwn ? "text-right" : "text-left"
                              )}
                            >
                              {formatFullTimestamp(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors max-h-[120px]"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="h-10 w-10 shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <p className="text-[10px] text-gray-300 mt-1.5 px-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
