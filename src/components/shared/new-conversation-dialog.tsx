"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { searchUsers, startConversation, startDirectMessage } from "@/actions/messaging";
import type { SearchableUser } from "@/actions/messaging";
import { Search, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationDialog({
  open,
  onClose,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchableUser[]>([]);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      // Reset state when dialog closes
      setQuery("");
      setResults([]);
      setSelectedUsers([]);
      setMessage("");
    }
  }, [open]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.trim().length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const users = await searchUsers(value);
          // Filter out already selected users
          const filtered = users.filter(
            (u) => !selectedUsers.some((s) => s.id === u.id)
          );
          setResults(filtered);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [selectedUsers]
  );

  const addUser = (user: SearchableUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setResults((prev) => prev.filter((u) => u.id !== user.id));
    setQuery("");
    searchInputRef.current?.focus();
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;

    setSending(true);
    try {
      let result;

      if (selectedUsers.length === 1 && !message.trim()) {
        // Direct message - find or create
        result = await startDirectMessage(selectedUsers[0].id);
      } else {
        // Group or new conversation
        const participantIds = selectedUsers.map((u) => u.id);
        result = await startConversation(participantIds);
      }

      if (result.success && result.conversationId) {
        // Send the initial message if provided
        if (message.trim()) {
          const { sendMessage } = await import("@/actions/messaging");
          await sendMessage(result.conversationId, message.trim());
        }
        onConversationCreated(result.conversationId);
        onClose();
      }
    } catch {
      // Handle error silently
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "WORKER":
        return "bg-blue-50 text-blue-700";
      case "COMPANY":
        return "bg-purple-50 text-purple-700";
      case "ADMIN":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "WORKER":
        return "Worker";
      case "COMPANY":
        return "Provider";
      case "ADMIN":
        return "Admin";
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>New Message</DialogTitle>
      </DialogHeader>
      <DialogContent>
        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
              >
                {user.name}
                <button
                  onClick={() => removeUser(user.id)}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Search Results */}
        {(results.length > 0 || searching) && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white">
            {searching && results.length === 0 && (
              <div className="p-3 text-sm text-gray-400 text-center">
                Searching...
              </div>
            )}
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => addUser(user)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                    getRoleBadge(user.role)
                  )}
                >
                  {getRoleLabel(user.role)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.trim().length >= 2 &&
          !searching &&
          results.length === 0 && (
            <p className="mt-2 text-sm text-gray-400 text-center py-3">
              No users found
            </p>
          )}

        {/* Message Input */}
        {selectedUsers.length > 0 && (
          <div className="mt-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your first message (optional)..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={selectedUsers.length === 0 || sending}
          loading={sending}
        >
          <Send size={16} />
          {message.trim() ? "Send" : "Start Conversation"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
