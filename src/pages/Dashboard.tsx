import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Order, Address, SupportTicket, ChatMessage } from '../types';
import { User, ShoppingBag, Heart, MapPin, Award, Trash2, Sliders, CheckCircle, ArrowRight, Upload, Truck, Search, RefreshCw, MessageSquare, Plus } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const Dashboard: React.FC = () => {
  const { user, token, logout, wishlist, cancelOrder, triggerNotification, notifications, fetchUser } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'wishlist' | 'support'>('overview');
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Tracking state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Address add states
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('India');

  // Edit Profile States
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editProfilePhoto, setEditProfilePhoto] = useState(user?.profilePhoto || user?.avatar || '');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  // Support Ticket States
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Order' | 'Payment' | 'Product' | 'Shipping' | 'Returns' | 'Account' | 'Other'>('Other');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');
  const [newTicketProductId, setNewTicketProductId] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Fetch latest user data to get current loyalty points
    fetchUser();
    // Check if user is coming from track order link
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders') {
      setActiveTab('orders');
      fetchMyOrders();
    } else {
      fetchMyOrders();
    }
    // Force immediate refresh to ensure latest loyalty points
    setTimeout(() => fetchUser(), 100);
  }, [token, searchParams]);

  // Fetch user data when overview tab is active to refresh loyalty points
  useEffect(() => {
    if (activeTab === 'overview' && token) {
      fetchUser();
    }
  }, [activeTab, token]);

  // Also fetch user data when component gains focus (user returns from checkout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTab === 'overview' && token) {
        fetchUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab, token]);

  // Periodically refresh user data every 30 seconds to keep loyalty points up-to-date
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        fetchUser();
      }
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token, activeTab]);

  const fetchMyOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setMyOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const trackShipment = async (trackingNum: string) => {
    try {
      const res = await fetch(`/api/shipping/track/${trackingNum}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTrackingInfo(data.data);
      } else {
        triggerNotification('Tracking Error', data.error || 'Failed to fetch tracking information', 'error');
      }
    } catch (e) {
      triggerNotification('Tracking Error', 'Network error occurred while fetching tracking info', 'error');
    }
  };

  // Support Ticket Functions
  const fetchSupportTickets = async () => {
    try {
      const res = await fetch(`/api/customer-service/tickets?userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSupportTickets(data.data.tickets);
      }
    } catch (e) {
      console.error('Error fetching support tickets:', e);
    }
  };

  const createSupportTicket = async () => {
    try {
      const res = await fetch('/api/customer-service/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: newTicketSubject,
          category: newTicketCategory,
          priority: newTicketPriority,
          description: newTicketDescription,
          orderId: newTicketOrderId || undefined,
          productId: newTicketProductId || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Support ticket created successfully.', 'success');
        setShowCreateTicketModal(false);
        setNewTicketSubject('');
        setNewTicketDescription('');
        setNewTicketOrderId('');
        setNewTicketProductId('');
        fetchSupportTickets();
      } else {
        triggerNotification('Error', data.error || 'Failed to create support ticket.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Failed to create support ticket.', 'error');
    }
  };

  const fetchChatMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/customer-service/chat?ticketId=${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages);
      }
    } catch (e) {
      console.error('Error fetching chat messages:', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    try {
      const res = await fetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    } catch (e) {
      triggerNotification('Error', 'Failed to send message.', 'error');
    }
  };

  // Fetch support tickets when support tab is active
  useEffect(() => {
    if (activeTab === 'support') {
      fetchSupportTickets();
    }
  }, [activeTab]);

  // Fetch chat messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchChatMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const handleTrackOrder = (order: Order) => {
    const trackingNum = (order as any).trackingNumber;
    if (trackingNum) {
      setTrackingNumber(trackingNum);
      setTrackingOrderId(order.id);
      setShowTrackingModal(true);
      trackShipment(trackingNum);
    } else {
      triggerNotification('No Tracking', 'This order does not have a tracking number yet', 'warning');
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingProfile(true);
    try {
      let finalPhotoUrl = editProfilePhoto;

      // Upload image if file is selected
      if (profilePhotoFile) {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('file', profilePhotoFile);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalPhotoUrl = uploadData.url;
            setEditProfilePhoto(uploadData.url);
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          triggerNotification('Upload Failed', 'Using local preview for image.', 'warning');
        }
        setUploadingPhoto(false);
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, phone: editPhone, profilePhoto: finalPhotoUrl })
      });
      const data = await res.json();
      if (data.user) {
        triggerNotification('Profile Updated', 'Profile adjustments locked successfully!', 'success');
        setProfilePhotoFile(null);
        setProfilePhotoPreview('');
        // Refresh user context to update navbar profile icon
        await fetchUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Cloudinary upload preset

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.secure_url) {
        setEditProfilePhoto(data.secure_url);
        triggerNotification('Photo Uploaded', 'Profile photo uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      triggerNotification('Upload Failed', 'Failed to upload image. Please try again.', 'warning');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ street, city, state, zipCode: zip, country })
      });
      const data = await res.json();
      if (data.addresses) {
        triggerNotification('Address Appended', 'Saved address was successfully listed!', 'success');
        setStreet(''); setCity(''); setState(''); setZip('');
        if (user) user.addresses = data.addresses; // sync locally
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.addresses) {
        triggerNotification('Address Removed', 'Removed address successfully from catalog', 'info');
        if (user) user.addresses = data.addresses; // sync
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelOrder = async (id: string) => {
    const res = await cancelOrder(id);
    if (res.success) {
      fetchMyOrders(); // refresh
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.data && data.data.plainTextDoc) {
        // Create a downloadable text file
        const blob = new Blob([data.data.plainTextDoc], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${order.orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        triggerNotification(
          'Invoice Downloaded',
          `Invoice for order ${order.orderNumber} downloaded successfully.`,
          'success'
        );
      } else {
        triggerNotification('Download Failed', 'Could not generate invoice.', 'warning');
      }
    } catch (err) {
      console.error('Invoice download error:', err);
      triggerNotification('Download Failed', 'Failed to download invoice.', 'warning');
    }
  };

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnImages, setReturnImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [processingReturn, setProcessingReturn] = useState(false);

  const handleReturnRequest = (order: Order) => {
    setSelectedOrderForReturn(order);
    setShowReturnModal(true);
    setReturnReason('');
    setReturnImages([]);
    setImagePreviews([]);
  };

  const handleReturnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setReturnImages(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReturnImage = (index: number) => {
    setReturnImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const isWithinReturnWindow = (order: Order): boolean => {
    const deliveredDate = (order as any).deliveredAt || order.date;
    const deliveryDate = new Date(deliveredDate);
    const today = new Date();
    const daysSinceDelivery = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7;
  };

  const submitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn || !returnReason.trim()) return;

    if (!isWithinReturnWindow(selectedOrderForReturn)) {
      triggerNotification('Return Not Allowed', 'Returns are only allowed within 7 days of delivery.', 'error');
      return;
    }

    setProcessingReturn(true);
    try {
      const formData = new FormData();
      formData.append('reason', returnReason);
      
      returnImages.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const res = await fetch(`/api/orders/${selectedOrderForReturn.id}/return`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Return Requested', 'Your return request has been logged successfully.', 'success');
        setShowReturnModal(false);
        setSelectedOrderForReturn(null);
        setReturnReason('');
        setReturnImages([]);
        setImagePreviews([]);
        fetchMyOrders();
      } else {
        triggerNotification('Return Failed', data.error || 'Failed to process return request.', 'error');
      }
    } catch (e) {
      triggerNotification('Return Failed', 'Network error occurred while processing return.', 'error');
    } finally {
      setProcessingReturn(false);
    }
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="mb-10 text-left border-b border-gray-200/60 pb-6">
        <h1 className="font-display font-extrabold text-4xl tracking-tight text-gray-900">Personal Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2 font-medium">Manage addresses, check physical deliverables, track referrals, and spend reward metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left items-start">
        
        {/* Sidebar Nav Buttons */}
        <aside className="space-y-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 p-5 rounded-3xl shadow-xl shadow-gray-200/50">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'overview' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg shadow-gray-900/20' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
          >
            <User className="w-4 h-4" /> Guest Overview
          </button>
          
          <button
            onClick={() => { setActiveTab('orders'); fetchMyOrders(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${activeTab === 'orders' ? 'bg-black text-white shadow' : 'hover:bg-gray-50 text-gray-655'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Active Orders ({myOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${activeTab === 'addresses' ? 'bg-black text-white shadow' : 'hover:bg-gray-50 text-gray-650'}`}
          >
            <MapPin className="w-4 h-4" /> Saved Addresses
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${activeTab === 'wishlist' ? 'bg-black text-white shadow' : 'hover:bg-gray-50 text-gray-650'}`}
          >
            <Heart className="w-4 h-4" /> My Saved Wishlist ({wishlist.length})
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${activeTab === 'support' ? 'bg-black text-white shadow' : 'hover:bg-gray-50 text-gray-650'}`}
          >
            <MessageSquare className="w-4 h-4" /> Customer Support ({supportTickets.length})
          </button>

          <hr className="border-gray-200/60 my-2" />

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 text-xs font-bold tracking-wider uppercase rounded-xl transition-all duration-300"
          >
            Sign Out
          </button>
        </aside>

        {/* Dynamic Detail Content Box */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl border border-gray-200/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-gray-200/50 min-h-[400px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
                  <p className="text-xs text-gray-500 mt-1">Here's your account overview and rewards summary</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'}} />
                  <div className="relative flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                      <Award className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-pulse delay-100" />
                    </div>
                  </div>
                  <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Loyalty Points</span>
                  <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{user.loyaltyPoints ?? 0}</p>
                  <p className="relative text-[9px] text-gray-400 mt-1">Accumulated rewards</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'}} />
                  <div className="relative flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                      <ShoppingBag className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse delay-100" />
                    </div>
                  </div>
                  <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Total Orders</span>
                  <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{myOrders.length}</p>
                  <p className="relative text-[9px] text-gray-400 mt-1">Completed purchases</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'}} />
                  <div className="relative flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                      <Heart className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-lg shadow-pink-400/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400/50 animate-pulse delay-100" />
                    </div>
                  </div>
                  <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Wishlist Items</span>
                  <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{wishlist.length}</p>
                  <p className="relative text-[9px] text-gray-400 mt-1">Saved products</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'}} />
                  <div className="relative flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                      <MapPin className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse delay-100" />
                    </div>
                  </div>
                  <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Saved Addresses</span>
                  <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{user.addresses?.length || 0}</p>
                  <p className="relative text-[9px] text-gray-400 mt-1">Delivery locations</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>

              {/* Referral Card */}
              <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-md group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl transition-all duration-500">
                      <Award className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-gray-900 uppercase tracking-wider group-hover:tracking-wide transition-all duration-300">Referral Reward Program</h3>
                      <p className="text-xs text-gray-600 mt-1">Share your code and earn 50 loyalty points per referral</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm group-hover:border-gray-300 group-hover:shadow-xl group-hover:shadow-gray-400/30 transition-all duration-500">
                    <span className="font-mono font-bold text-sm text-gray-900 select-all group-hover:tracking-wide transition-all duration-300">{user.referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Profile Modifier Form */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-gray-400" /> Account Settings
                </h3>

                <form onSubmit={handleEditProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Primary Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Contact Phone Number *</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Profile Photo</label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProfilePhotoFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfilePhotoPreview(reader.result as string);
                                setEditProfilePhoto(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="url"
                          value={editProfilePhoto && !profilePhotoPreview ? editProfilePhoto : ''}
                          onChange={(e) => {
                            setEditProfilePhoto(e.target.value);
                            if (e.target.value && !profilePhotoFile) {
                              setProfilePhotoPreview(e.target.value);
                            }
                          }}
                          placeholder="Or paste image URL..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all text-xs"
                        />
                      </div>
                    </div>
                    {(profilePhotoPreview || editProfilePhoto) && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={profilePhotoPreview || editProfilePhoto}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                        {profilePhotoFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePhotoFile(null);
                              setProfilePhotoPreview('');
                              setEditProfilePhoto('');
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Sync Login Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-xl p-3 font-medium cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={editingProfile}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg w-fit mt-2 disabled:bg-gray-300 disabled:shadow-none flex items-center gap-2"
                  >
                    {editingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Update Profile
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* MY ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-gray-400" /> Active Purchase Logs ({myOrders.length})
                </h3>
              </div>

              {myOrders.length > 0 ? (
                <div className="space-y-6">
                  {myOrders.map((ord) => (
                    <div key={ord.id} className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                      
                      {/* Order Info top bar */}
                      <div className="relative bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 font-semibold text-gray-600">
                        <div className="space-y-0.5 text-left">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Placed Date</p>
                          <p className="text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{new Date(ord.date).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Invoice / Dispatch Number</p>
                          <p className="text-gray-800 font-mono select-all group-hover:text-gray-900 transition-colors duration-300">{ord.orderNumber}</p>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pay Amount</p>
                          <p className="text-gray-900 font-extrabold text-sm group-hover:tracking-wide transition-all duration-300">{formatPrice(ord.totalAmount)}</p>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order Status</p>
                          <span className={`inline-block px-4 py-2 rounded-xl font-bold uppercase text-[9px] tracking-wider shadow-md ${ord.status === 'Delivered' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' : ord.status === 'Cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/30' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30 animate-pulse'}`}>
                            {ord.status}
                          </span>
                        </div>
                        {(ord as any).trackingNumber && (
                          <div className="space-y-0.5 text-left">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tracking Number</p>
                            <p className="text-gray-800 font-mono text-xs select-all group-hover:text-gray-900 transition-colors duration-300">{(ord as any).trackingNumber}</p>
                          </div>
                        )}
                      </div>

                      {/* Items row list */}
                      <div className="relative p-5 divide-y divide-gray-100 text-left">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group/item">
                            <div className="flex gap-4">
                              <div className="relative">
                                <img src={item.productImage} className="w-14 h-14 object-cover rounded-xl bg-gray-50 shadow-sm group-hover/item:scale-110 group-hover/item:shadow-lg transition-all duration-300" />
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">{item.quantity}</div>
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-gray-800 group-hover/item:text-gray-900 transition-colors duration-300">{item.productName}</p>
                                <span className="text-[10px] text-gray-400 group-hover/item:text-gray-500 transition-colors duration-300">Qty: {item.quantity} × {formatPrice(item.price)}</span>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 group-hover/item:tracking-wide transition-all duration-300">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Interaction Controls */}
                      <div className="relative bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
                        <button
                          onClick={() => navigate(`/order-tracking/${ord.id}`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2 group/btn"
                        >
                          <Truck className="w-4 h-4 group-hover/btn:animate-pulse" />
                          Track Order
                        </button>

                        <button
                          onClick={() => handleDownloadInvoice(ord)}
                          className="bg-white hover:bg-gray-900 hover:text-white border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-gray-900/30 flex items-center gap-2 group/btn"
                        >
                          <svg className="w-4 h-4 group-hover/btn:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Invoice Details
                        </button>

                        {(ord.status === 'Shipped' || ord.status === 'Delivered') && (ord as any).trackingNumber && (
                          <button
                            onClick={() => handleTrackOrder(ord)}
                            className="bg-white hover:bg-blue-600 hover:text-white border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 group/btn"
                          >
                            <Truck className="w-4 h-4 group-hover/btn:animate-pulse" />
                            Live Tracking
                          </button>
                        )}
                        
                        {ord.status === 'Delivered' && (
                          <button
                            onClick={() => handleReturnRequest(ord)}
                            className="bg-white hover:bg-gray-900 hover:text-white border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-gray-900/30 flex items-center gap-2 group/btn"
                          >
                            <svg className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Return Request
                          </button>
                        )}

                        {(ord.status === 'Pending' || ord.status === 'Processing') && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-red-500/30 flex items-center gap-2 group/btn"
                          >
                            <svg className="w-4 h-4 group-hover/btn:scale-125 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative text-center p-16 space-y-4 border-2 border-dashed border-gray-200 rounded-2xl">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No order history established on this account yet.</p>
                  <p className="text-xs text-gray-400">Start shopping to see your orders here</p>
                </div>
              )}
            </div>
          )}

          {/* Tracking Modal */}
          {showTrackingModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5" /> Track Shipment
                  </h3>
                  <button
                    onClick={() => { setShowTrackingModal(false); setTrackingInfo(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-sm text-gray-900">{trackingNumber}</p>
                </div>

                {trackingInfo ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-600">Status</span>
                      <span className="text-sm font-bold text-gray-900">{trackingInfo.status}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-600">Carrier</span>
                      <span className="text-sm font-bold text-gray-900">{trackingInfo.carrier}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-600">Estimated Delivery</span>
                      <span className="text-sm font-bold text-gray-900">{trackingInfo.estimatedDelivery}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-semibold text-gray-600">Last Update</span>
                      <span className="text-sm font-bold text-gray-900">{trackingInfo.lastUpdate}</span>
                    </div>
                    {trackingInfo.timeline && trackingInfo.timeline.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Tracking Timeline</p>
                        <div className="space-y-2">
                          {trackingInfo.timeline.map((event: any, idx: number) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{event.status}</p>
                                <p className="text-[10px] text-gray-500">{event.description}</p>
                                <p className="text-[10px] text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500">Loading tracking information...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Return Request Modal */}
          {showReturnModal && selectedOrderForReturn && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Return Request
                  </h3>
                  <button
                    onClick={() => { setShowReturnModal(false); setSelectedOrderForReturn(null); setReturnReason(''); setReturnImages([]); setImagePreviews([]); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Order Number</p>
                  <p className="font-mono font-bold text-sm text-gray-900">{selectedOrderForReturn.orderNumber}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-2">Delivery Date</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date((selectedOrderForReturn as any).deliveredAt || selectedOrderForReturn.date).toLocaleDateString()}</p>
                  {!isWithinReturnWindow(selectedOrderForReturn) && (
                    <p className="text-xs text-red-600 font-semibold mt-2">⚠️ Returns are only allowed within 7 days of delivery</p>
                  )}
                </div>

                <form onSubmit={submitReturnRequest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Reason for Return</label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Please describe why you want to return this product (e.g., damaged, defective, not as described)"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none h-32"
                      required
                      disabled={!isWithinReturnWindow(selectedOrderForReturn)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Upload Images (Optional)</label>
                    <p className="text-xs text-gray-500">Upload photos of damaged or defective products</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="return-images"
                        multiple
                        accept="image/*"
                        onChange={handleReturnImageUpload}
                        className="hidden"
                        disabled={!isWithinReturnWindow(selectedOrderForReturn)}
                      />
                      <label
                        htmlFor="return-images"
                        className={`cursor-pointer ${!isWithinReturnWindow(selectedOrderForReturn) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Click to upload images</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
                      </label>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeReturnImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              disabled={!isWithinReturnWindow(selectedOrderForReturn)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowReturnModal(false); setSelectedOrderForReturn(null); setReturnReason(''); setReturnImages([]); setImagePreviews([]); }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-3 rounded-xl transition-all duration-300 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingReturn || !isWithinReturnWindow(selectedOrderForReturn) || !returnReason.trim()}
                      className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingReturn ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Submit Return Request'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-8">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-gray-400" /> Saved Delivery Addresses
                </h3>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddAddress} className="relative bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-650 space-y-4 text-left shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                    Create new delivery address
                  </h4>
                </div>
                
                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Street Name</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium transition-all duration-300 shadow-sm" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider block">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium transition-all duration-300 shadow-sm" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider block">State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium transition-all duration-300 shadow-sm" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider block">ZIP / Postal Code</label>
                    <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium transition-all duration-300 shadow-sm" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Country Location</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium text-xs transition-all duration-300 shadow-sm">
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="relative bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-gray-900/30 flex items-center gap-2 group/btn">
                  <MapPin className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                  Add Delivery Address
                </button>
              </form>

              {/* Address lists mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses.map((a) => (
                  <div key={a.id} className="relative bg-white border border-gray-200 rounded-2xl p-5 flex justify-between items-start text-xs shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="relative text-left space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center shadow-md">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destination</span>
                      </div>
                      <p className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{user.name}</p>
                      <p className="text-gray-500 group-hover:text-gray-600 transition-colors duration-300">{a.street}</p>
                      <p className="text-gray-500 group-hover:text-gray-600 transition-colors duration-300">{a.city}, {a.state} {a.zipCode}</p>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveAddress(a.id)}
                      className="relative p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-red-500/30 group/btn"
                    >
                      <Trash2 className="w-4 h-4 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* MY WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-1.5">
                  <Heart className="w-5 h-5 text-gray-400" /> Monitored Wishlist items ({wishlist.length})
                </h3>
              </div>

              {wishlist.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map((prod) => (
                    <div key={prod.id} className="relative bg-white border border-gray-200 rounded-2xl p-4 text-xs flex flex-col justify-between shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                      
                      <Link to={`/product/${prod.slug}`} className="relative block">
                        <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
                          <img src={prod.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-110">
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-800 line-clamp-1 mt-3 text-left group-hover:text-gray-900 transition-colors duration-300">{prod.name}</h4>
                        <span className="text-xs font-bold text-gray-900 block mt-1 text-left group-hover:tracking-wide transition-all duration-300">₹{(prod.discountPrice || prod.price).toFixed(2)}</span>
                      </Link>
                      
                      <Link
                        to={`/product/${prod.slug}`}
                        className="relative bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white py-2.5 rounded-xl font-semibold w-full mt-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-gray-900/30 group/btn"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-4.5 h-4.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative text-center p-16 space-y-4 border-2 border-dashed border-gray-200 rounded-2xl">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                    <Heart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Your wishlist is currently unpopulated.</p>
                  <p className="text-xs text-gray-400">Start adding products to see them here</p>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER SUPPORT TAB */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5" /> Customer Support
                </h3>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Ticket
                </button>
              </div>

              {selectedTicket ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                  >
                    ← Back to tickets
                  </button>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{selectedTicket.ticketNumber}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedTicket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                        selectedTicket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedTicket.subject}</p>
                    <p className="text-sm text-gray-600 mt-2">{selectedTicket.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Category: {selectedTicket.category} • Priority: {selectedTicket.priority}</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 h-96 overflow-y-auto">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 ${msg.sender === 'customer' ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          msg.sender === 'customer' ? 'bg-black text-white' : 'bg-gray-200'
                        }`}>
                          <p className="font-semibold text-xs">{msg.userName}</p>
                          <p>{msg.message}</p>
                          <p className="text-xs mt-1 opacity-75">{new Date(msg.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border rounded-xl px-4 py-3 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <div className="text-center p-12 space-y-4 border-2 border-dashed border-gray-200 rounded-2xl">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                        <MessageSquare className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No support tickets yet.</p>
                      <p className="text-xs text-gray-400">Create a ticket to get help with your orders or account</p>
                    </div>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-black transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900">{ticket.ticketNumber}</h4>
                            <p className="font-semibold text-gray-900">{ticket.subject}</p>
                            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
    </div>
  );
};
