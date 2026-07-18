import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { MessageCircle, X, Send, Sparkles, AlertCircle, ShoppingBag, ShieldCheck, Mic, MicOff, Download, ThumbsUp, Heart, Star, Gift, Truck, Headphones, CreditCard, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
}

export const LiveChatWidget: React.FC = () => {
  const { user, token } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      senderId: 'admin',
      senderName: 'Sovereign Concierge',
      message: 'Hello! How can I help you today?',
      timestamp: new Date().toISOString(),
      reactions: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load chat messages from backend on mount or when user changes
  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            setMessages(data.data);
          }
        })
        .catch((err) => console.error('Error fetching chats:', err));
    }
  }, [isOpen, token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    // Pre-insert customer message to UI for instant feedback
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: user?.id || 'guest',
      senderName: user?.name || 'Guest',
      message: userText,
      timestamp: new Date().toISOString(),
      reactions: []
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);
    setStreamingMessage('');

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['Authorization'] = 'Bearer jwt-mock-guest-customer-999';
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userText })
      });

      const result = await res.json();
      if (result.success) {
        // Fetch fresh chat history
        const refreshRes = await fetch('/api/chat', { headers });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data) {
          setMessages(refreshData.data);
        }
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      // Fallback response with streaming effect
      const fallbackMessage = 'Your query has been logged. Our team will assist you shortly.';
      await simulateStreamingResponse(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const simulateStreamingResponse = async (message: string) => {
    const tempAiMsg: ChatMessage = {
      id: `temp_ai_${Date.now()}`,
      senderId: 'admin',
      senderName: 'AI Assistant',
      message: '',
      timestamp: new Date().toISOString(),
      reactions: []
    };

    setMessages((prev) => [...prev, tempAiMsg]);

    // Stream the response character by character
    for (let i = 0; i < message.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiMsg.id
            ? { ...msg, message: message.slice(0, i + 1) }
            : msg
        )
      );
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r) => r.emoji === emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1 } : r
              ),
            };
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, count: 1 }],
            };
          }
        }
        return msg;
      })
    );
    setShowReactions(null);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop Web Speech API
    if (!isRecording) {
      // Simulate voice input
      setTimeout(() => {
        setInputValue('I need help with my recent order');
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.senderName}: ${msg.message}`)
      .join('\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-auto z-[9990]" id="live-chat-support-wrapper">
      {/* Trigger Button */}
      <button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-full shadow-2xl hover:shadow-neutral-900/50 transition-all active:scale-95 duration-300 border border-white/10 lg:px-5 lg:py-3.5 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <MessageCircle className="w-5 h-5 animate-pulse relative z-10" />
        <span className="text-xs font-bold font-display tracking-tight relative z-10">AI Shop Concierge</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-lg shadow-emerald-400/50 relative z-10" />
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
      </button>

      {/* Floating Chat Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-container"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute bottom-16 left-0 right-0 lg:left-0 lg:right-auto lg:w-96 lg:h-[600px] bg-gradient-to-br from-white via-white to-gray-50/95 backdrop-blur-xl border border-neutral-200/80 rounded-3xl shadow-2xl shadow-neutral-900/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-center gap-2.5">
                <div className="relative p-1.5 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl border border-white/10">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 rounded-xl blur-md opacity-50" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-display tracking-tight text-white leading-none">Sovereign Concierge</h4>
                  <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">Active Response Mode</span>
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                <button
                  onClick={handleExportChat}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-all hover:scale-110"
                  title="Export chat"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-all hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Premium Announcement Bar */}
            <div className="relative bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-emerald-50 px-4 py-2.5 border-b border-emerald-200/50 flex items-center gap-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-emerald-400/10" />
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 relative z-10" />
              <p className="text-[10px] text-emerald-800 font-semibold leading-relaxed relative z-10">
                <strong className="text-emerald-950 font-bold uppercase tracking-wide">AI Promo:</strong> Use code <span className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-900 border border-emerald-300 rounded px-1.5 py-0.5 font-mono font-bold shadow-sm">FLASH20</span> for 20% savings!
              </p>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-neutral-50/50 to-white/50">
              {messages.map((m) => {
                const isMe = m.senderId === user?.id || (m.senderId !== 'admin' && m.senderId !== 'initial');
                const messageTime = new Date(m.timestamp);
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400 max-w-[200px] truncate">
                        {m.senderName}
                      </span>
                      <span className="text-[8px] text-gray-300 font-mono">
                        {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="relative">
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm transition-all duration-300 ${
                          isMe
                            ? 'bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-tr-none hover:shadow-md'
                            : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 border border-neutral-200/80 rounded-tl-none hover:shadow-md'
                        }`}
                      >
                        {m.message}
                      </div>
                      {/* Reactions */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className="absolute -bottom-2 left-2 flex gap-1">
                          {m.reactions.map((reaction, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-neutral-200 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm"
                            >
                              {reaction.emoji} {reaction.count}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Reaction Button */}
                      <button
                        onClick={() => setShowReactions(showReactions === m.id ? null : m.id)}
                        className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-neutral-200 rounded-full p-1 shadow-sm hover:scale-110"
                      >
                        <Heart className="w-3 h-3 text-gray-400 hover:text-red-500" />
                      </button>
                      {/* Reaction Popup */}
                      {showReactions === m.id && (
                        <div className="absolute -top-10 right-0 bg-white border border-neutral-200 rounded-full shadow-lg p-1 flex gap-1">
                          {['👍', '❤️', '⭐', '🎉'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(m.id, emoji)}
                              className="w-7 h-7 rounded-full hover:bg-neutral-100 transition-colors text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono p-3 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-neutral-200/80 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Sovereign Concierge is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-t border-neutral-200/80 bg-gradient-to-b from-neutral-50 to-white">
              <p className="text-[9px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-wider">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInputValue('What are your featured products?')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-500/20 transition-all"
                >
                  <Gift className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Featured
                </button>
                <button
                  onClick={() => setInputValue('Check my order status')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-blue-500 hover:text-blue-700 hover:shadow-md hover:shadow-blue-500/20 transition-all"
                >
                  <Truck className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Order Status
                </button>
                <button
                  onClick={() => setInputValue('What coupons are available?')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-purple-500 hover:text-purple-700 hover:shadow-md hover:shadow-purple-500/20 transition-all"
                >
                  <Star className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Coupons
                </button>
                <button
                  onClick={() => setInputValue('Return policy information')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-orange-500 hover:text-orange-700 hover:shadow-md hover:shadow-orange-500/20 transition-all"
                >
                  <Package className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Returns
                </button>
                <button
                  onClick={() => setInputValue('I need customer support')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-pink-500 hover:text-pink-700 hover:shadow-md hover:shadow-pink-500/20 transition-all"
                >
                  <Headphones className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Support
                </button>
                <button
                  onClick={() => setInputValue('Payment methods available')}
                  className="group flex items-center gap-1.5 text-[10px] bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-green-500 hover:text-green-700 hover:shadow-md hover:shadow-green-500/20 transition-all"
                >
                  <CreditCard className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Payment
                </button>
              </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50 flex gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? 'Listening...' : 'Submit your message or coupon codes...'}
                className="flex-grow bg-neutral-100 text-xs text-neutral-800 px-4 py-2.5 rounded-xl outline-none focus:bg-neutral-50 focus:ring-2 focus:ring-emerald-500/20 border border-transparent transition-all"
                disabled={isRecording}
              />
              <button
                type="submit"
                className="p-2.5 bg-gradient-to-br from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-neutral-900/20 hover:shadow-neutral-900/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
