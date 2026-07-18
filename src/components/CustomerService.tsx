import React, { useState, useEffect } from 'react';
import { SupportTicket, ChatMessage, CustomerNote } from '../types';

interface CustomerServiceProps {
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  triggerNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const CustomerService: React.FC<CustomerServiceProps> = ({ authedFetch, triggerNotification }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'chat' | 'notes'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'General' | 'Order History' | 'Payment Issues' | 'Behavior' | 'VIP' | 'Risk'>('General');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Order' | 'Payment' | 'Product' | 'Shipping' | 'Returns' | 'Account' | 'Other'>('Other');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketUserId, setNewTicketUserId] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');
  const [newTicketProductId, setNewTicketProductId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  // Fetch chat messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchChatMessages(selectedTicket.id);
      fetchCustomerNotes(selectedTicket.userId);
    }
  }, [selectedTicket]);

  // Fetch users when modal opens
  useEffect(() => {
    if (showCreateTicketModal) {
      fetchUsers();
    }
  }, [showCreateTicketModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const fetchUsers = async () => {
    try {
      const res = await authedFetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.id?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const fetchTickets = async () => {
    try {
      const res = await authedFetch('/api/customer-service/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets);
      } else {
        console.error('Failed to fetch tickets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await authedFetch('/api/customer-service/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChatMessages = async (ticketId: string) => {
    try {
      const res = await authedFetch(`/api/customer-service/chat?ticketId=${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const fetchCustomerNotes = async (userId: string) => {
    try {
      const res = await authedFetch(`/api/customer-service/notes?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setCustomerNotes(data.data.notes);
      }
    } catch (error) {
      console.error('Error fetching customer notes:', error);
    }
  };

  const createTicket = async (ticketData: any) => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/customer-service/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Support ticket created successfully.', 'success');
        fetchTickets();
        fetchStats();
      } else {
        triggerNotification('Error', data.error || 'Failed to create ticket.', 'error');
      }
    } catch (error) {
      triggerNotification('Error', 'Failed to create ticket.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, resolution?: string) => {
    try {
      const res = await authedFetch(`/api/customer-service/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Ticket updated successfully.', 'success');
        fetchTickets();
        fetchStats();
        if (selectedTicket) {
          setSelectedTicket(data.data);
        }
      } else {
        triggerNotification('Error', data.error || 'Failed to update ticket.', 'error');
      }
    } catch (error) {
      triggerNotification('Error', 'Failed to update ticket.', 'error');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    try {
      const res = await authedFetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: newMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchChatMessages(selectedTicket.id);
      } else {
        triggerNotification('Error', data.error || 'Failed to send message.', 'error');
      }
    } catch (error) {
      triggerNotification('Error', 'Failed to send message.', 'error');
    }
  };

  const createCustomerNote = async () => {
    if (!newNote.trim() || !selectedTicket) return;
    
    try {
      const res = await authedFetch('/api/customer-service/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedTicket.userId,
          note: newNote,
          category: noteCategory,
          isInternal: isInternalNote
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        fetchCustomerNotes(selectedTicket.userId);
        triggerNotification('Success', 'Customer note created successfully.', 'success');
      } else {
        triggerNotification('Error', data.error || 'Failed to create note.', 'error');
      }
    } catch (error) {
      triggerNotification('Error', 'Failed to create note.', 'error');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Service</h1>
        <button
          onClick={() => setShowCreateTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <span className="text-lg">+</span> Create New Ticket
        </button>
      </div>

      {/* Stats Dashboard */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm">
            <h3 className="text-blue-700 text-sm font-semibold uppercase tracking-wider">Total Tickets</h3>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.tickets.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-sm">
            <h3 className="text-green-700 text-sm font-semibold uppercase tracking-wider">Open Tickets</h3>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.tickets.open}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-sm">
            <h3 className="text-red-700 text-sm font-semibold uppercase tracking-wider">High Priority</h3>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.tickets.highPriority}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm">
            <h3 className="text-purple-700 text-sm font-semibold uppercase tracking-wider">Unread Messages</h3>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.chats.unread}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl mb-6 text-sm text-gray-600 border border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Loading statistics...
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-6 bg-white rounded-t-2xl p-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          📋 Tickets
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
          disabled={!selectedTicket}
        >
          💬 Chat {selectedTicket ? '' : '(Select a ticket)'}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'notes' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
          disabled={!selectedTicket}
        >
          📝 Notes {selectedTicket ? '' : '(Select a ticket)'}
        </button>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <span className="text-5xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Support Tickets</h3>
              <p className="text-gray-600 mb-6">Create your first support ticket to get started helping customers.</p>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                <span className="text-lg">+</span> Create First Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-6 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent ${selectedTicket?.id === ticket.id ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{ticket.ticketNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 text-lg mb-1">{ticket.subject}</p>
                      <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">👤</span> {ticket.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">📧</span> {ticket.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">📅</span> {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && selectedTicket && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl mb-1">💬 Chat - {selectedTicket.ticketNumber}</h3>
                <p className="text-blue-100">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all"
              >
                ← Back to Tickets
              </button>
            </div>
          </div>
          <div className="p-6 h-96 overflow-y-auto bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Messages Yet</h3>
                <p className="text-gray-600">Start the conversation by sending a message below.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender === 'admin' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-white border border-gray-200'} rounded-2xl p-4 shadow-sm`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{msg.userName}</span>
                        <span className="text-xs opacity-75">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message here..."
                className="flex-1 border-2 border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 transition-all font-medium"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                Send 📤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Notes Tab */}
      {activeTab === 'notes' && selectedTicket && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl mb-1">📝 Customer Notes</h3>
                <p className="text-purple-100">Notes for {selectedTicket.userName}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all"
              >
                ← Back to Tickets
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-8 bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4">Add New Note</h4>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note about this customer's behavior, preferences, or any important information..."
                className="w-full border-2 border-gray-200 rounded-xl p-4 h-24 focus:outline-none focus:border-purple-500 transition-all font-medium mb-4"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-all font-semibold bg-white"
                >
                  <option value="General">📌 General</option>
                  <option value="Order History">🛒 Order History</option>
                  <option value="Payment Issues">💳 Payment Issues</option>
                  <option value="Behavior">🎭 Behavior</option>
                  <option value="VIP">⭐ VIP</option>
                  <option value="Risk">⚠️ Risk</option>
                </select>
                <label className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-purple-500 transition-all">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">🔒 Internal Only</span>
                </label>
                <button
                  onClick={createCustomerNote}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                >
                  Add Note ➕
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {customerNotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Notes Yet</h3>
                  <p className="text-gray-600">Add your first note about this customer to keep track of important information.</p>
                </div>
              ) : (
                customerNotes.map((note) => (
                  <div key={note.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          note.category === 'VIP' ? 'bg-yellow-100 text-yellow-800' :
                          note.category === 'Risk' ? 'bg-red-100 text-red-800' :
                          note.category === 'Order History' ? 'bg-blue-100 text-blue-800' :
                          note.category === 'Payment Issues' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {note.category}
                        </span>
                        {note.isInternal && <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">🔒 Internal</span>}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed mb-2">{note.note}</p>
                    <p className="text-sm text-gray-500 font-medium">By {note.adminName}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700 animate-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-black p-8 rounded-t-3xl border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">Create Support Ticket</h2>
                    <p className="text-gray-400 text-sm mt-1">Help your customers resolve their issues efficiently</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateTicketModal(false)}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center transition-all border border-gray-700"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8">
              {/* Customer Selection */}
              <div className="space-y-3 relative user-dropdown-container">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Select Customer
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={selectedUser ? `${selectedUser.name} (${selectedUser.id})` : userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                      if (!selectedUser) {
                        setNewTicketUserId(e.target.value);
                      }
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="Search by name, email, or ID..."
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 transition-all font-medium text-white placeholder-gray-500"
                    required
                  />
                  {showUserDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-gray-800 border-2 border-gray-700 rounded-2xl shadow-2xl max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                      {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium">No users found</p>
                          <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setNewTicketUserId(user.id);
                              setUserSearchQuery(`${user.name} (${user.id})`);
                              setShowUserDropdown(false);
                            }}
                            className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-shadow">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-white group-hover:text-gray-300 transition-colors">{user.name}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                              </div>
                              <div className="text-xs text-gray-400 bg-gray-700 px-3 py-1.5 rounded-lg font-medium">
                                {user.id}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 transition-all font-medium text-white placeholder-gray-500"
                  required
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Category
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 transition-all font-semibold text-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select category...</option>
                    <option value="Order">🛒 Order</option>
                    <option value="Payment">💳 Payment</option>
                    <option value="Product">📦 Product</option>
                    <option value="Shipping">🚚 Shipping</option>
                    <option value="Returns">↩️ Returns</option>
                    <option value="Account">👤 Account</option>
                    <option value="Other">📌 Other</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Priority
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 transition-all font-semibold text-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select priority...</option>
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Description
                </label>
                <textarea
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10 transition-all font-medium text-white placeholder-gray-500 h-40 resize-none"
                  required
                />
              </div>

              {/* Optional Fields */}
              <div className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</label>
                    <input
                      type="text"
                      value={newTicketOrderId}
                      onChange={(e) => setNewTicketOrderId(e.target.value)}
                      placeholder="Related order ID"
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 transition-all font-medium text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product ID</label>
                    <input
                      type="text"
                      value={newTicketProductId}
                      onChange={(e) => setNewTicketProductId(e.target.value)}
                      placeholder="Related product ID"
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 transition-all font-medium text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowCreateTicketModal(false);
                    setNewTicketSubject('');
                    setNewTicketDescription('');
                    setNewTicketUserId('');
                    setNewTicketOrderId('');
                    setNewTicketProductId('');
                    setSelectedUser(null);
                    setUserSearchQuery('');
                  }}
                  className="flex-1 px-8 py-4 bg-gray-700 text-white rounded-2xl font-semibold hover:bg-gray-600 transition-all border-2 border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    createTicket({
                      userId: newTicketUserId,
                      subject: newTicketSubject,
                      category: newTicketCategory,
                      priority: newTicketPriority,
                      description: newTicketDescription,
                      orderId: newTicketOrderId || undefined,
                      productId: newTicketProductId || undefined
                    });
                    setShowCreateTicketModal(false);
                    setNewTicketSubject('');
                    setNewTicketDescription('');
                    setNewTicketUserId('');
                    setNewTicketOrderId('');
                    setNewTicketProductId('');
                    setSelectedUser(null);
                    setUserSearchQuery('');
                  }}
                  className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-semibold hover:bg-gray-200 transition-all shadow-xl hover:shadow-2xl border-2 border-white"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
