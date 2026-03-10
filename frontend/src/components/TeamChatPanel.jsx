import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamChatPanel({ messages, onSendMessage }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSendMessage(input.trim());
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'hh:mm a');
    } catch {
      return '';
    }
  };

  const formatDate = (date) => {
    try {
      const d = new Date(date);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return format(d, 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  messages.forEach(msg => {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) {
      groupedMessages.push({ type: 'date', date });
      lastDate = date;
    }
    groupedMessages.push({ type: 'message', data: msg });
  });

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <MessageCircle size={18} />
        <span>Team Chat</span>
        <span className="chat-msg-count">{messages.length}</span>
      </div>

      <div className="chat-messages" ref={containerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <MessageCircle size={36} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${i}`} className="chat-date-divider">
                  <span>{item.date}</span>
                </div>
              );
            }
            const msg = item.data;
            const isOwn = msg.sender?._id === user?._id;
            return (
              <div key={msg._id || i} className={`chat-message ${isOwn ? 'chat-message-own' : ''}`}>
                {!isOwn && (
                  <div className="chat-avatar" style={{ background: msg.sender?.avatarColor || '#6366F1' }}>
                    {msg.sender?.initials || '?'}
                  </div>
                )}
                <div className={`chat-bubble ${isOwn ? 'chat-bubble-own' : ''}`}>
                  {!isOwn && (
                    <div className="chat-sender-name">{msg.sender?.name || 'Unknown'}</div>
                  )}
                  <div className="chat-text">{msg.content}</div>
                  <div className="chat-time">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
        />
        <button className="chat-send-btn" type="submit" disabled={!input.trim() || sending}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
