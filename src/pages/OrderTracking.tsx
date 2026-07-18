import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Package, Truck, CheckCircle, Clock, MapPin, ArrowLeft, Calendar, User, Phone, Mail } from 'lucide-react';
import { formatPrice } from '../utils/currency';

interface TrackingEvent {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  completed: boolean;
}

export const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { token } = useShop();
  const [order, setOrder] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // First try to fetch from user's orders
        const res = await fetch(`/api/orders/my-orders`, {
          headers
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Orders API response:', data);
          
          // Try different possible response formats
          const ordersList = data.orders || data.data || data;
          
          if (Array.isArray(ordersList)) {
            const foundOrder = ordersList.find((o: any) => o.id === orderId);
            if (foundOrder) {
              setOrder(foundOrder);
              generateTrackingEvents(foundOrder);
              return;
            } else {
              console.log('Order not found in user orders. Order ID:', orderId, 'Available IDs:', ordersList.map((o: any) => o.id));
            }
          } else {
            console.error('Orders data is not an array:', data);
          }
        } else {
          console.error('Failed to fetch orders:', res.status, res.statusText);
        }
        
        // If not found in user orders and user is admin, try fetching all orders
        if (token) {
          try {
            const adminRes = await fetch(`/api/admin/orders`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (adminRes.ok) {
              const adminData = await adminRes.json();
              console.log('Admin orders API response:', adminData);
              
              const adminOrdersList = adminData.orders || adminData.data || adminData;
              
              if (Array.isArray(adminOrdersList)) {
                const foundOrder = adminOrdersList.find((o: any) => o.id === orderId);
                if (foundOrder) {
                  setOrder(foundOrder);
                  generateTrackingEvents(foundOrder);
                  return;
                }
              }
            }
          } catch (adminError) {
            console.error('Error fetching admin orders:', adminError);
          }
        }
        
        console.log('Order not found after all attempts');
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  const generateTrackingEvents = (ord: any) => {
    const events: TrackingEvent[] = [
      {
        status: 'Pending',
        title: 'Order Placed',
        description: 'Your order has been successfully placed and is being processed.',
        timestamp: ord.date,
        icon: <Package className="w-5 h-5" />,
        completed: true
      }
    ];

    if (ord.status === 'Processing' || ord.status === 'Shipped' || ord.status === 'Delivered') {
      events.push({
        status: 'Processing',
        title: 'Order Processing',
        description: 'Your order is being prepared for shipment.',
        timestamp: ord.date,
        icon: <Clock className="w-5 h-5" />,
        completed: ord.status !== 'Pending'
      });
    }

    if (ord.status === 'Shipped' || ord.status === 'Delivered') {
      events.push({
        status: 'Shipped',
        title: 'Order Shipped',
        description: `Your order has been shipped via ${ord.shippingMethod || 'Standard Delivery'}.`,
        timestamp: ord.shippedAt || ord.date,
        icon: <Truck className="w-5 h-5" />,
        completed: ord.status !== 'Pending' && ord.status !== 'Processing'
      });
    }

    if (ord.status === 'Shipped') {
      events.push({
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Your package is on its way to your location.',
        timestamp: ord.shippedAt || ord.date,
        icon: <MapPin className="w-5 h-5" />,
        completed: false
      });
    }

    if (ord.status === 'Delivered') {
      events.push({
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Your package was out for delivery.',
        timestamp: ord.deliveredAt || ord.date,
        icon: <MapPin className="w-5 h-5" />,
        completed: true
      });
      events.push({
        status: 'Delivered',
        title: 'Delivered',
        description: 'Your order has been successfully delivered.',
        timestamp: ord.deliveredAt || ord.date,
        icon: <CheckCircle className="w-5 h-5" />,
        completed: true
      });
    }

    if (ord.status === 'Cancelled') {
      events.push({
        status: 'Cancelled',
        title: 'Order Cancelled',
        description: 'This order has been cancelled.',
        timestamp: ord.cancelledAt || ord.date,
        icon: <Package className="w-5 h-5" />,
        completed: true
      });
    }

    setTrackingEvents(events);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Order not found</p>
          <p className="text-sm text-gray-400 mb-4">Order ID: {orderId}</p>
          <div className="space-y-2">
            <Link to="/dashboard" className="text-emerald-600 hover:underline inline-block">
              Return to Dashboard
            </Link>
            {token && (
              <>
                <br />
                <Link to="/admin" className="text-gray-600 hover:underline inline-block">
                  Go to Admin Panel
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-gray-600">Track your order #{order.orderNumber}</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(order.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipping Address</p>
            </div>
            <p className="text-gray-900 font-semibold">{order.shippingAddress?.street || 'N/A'}</p>
            <p className="text-gray-600 text-sm">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
            </p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.country}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</p>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <img 
                    src={item.productImage || item.image} 
                    alt={item.productName} 
                    className="w-16 h-16 object-cover rounded-lg bg-white"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Tracking Timeline
          </h2>
          
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {trackingEvents.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                    event.completed ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {event.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-semibold ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {event.title}
                        </p>
                        <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                          {event.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-sm text-emerald-800 font-semibold">
              {order.status === 'Delivered' 
                ? 'Your order has been successfully delivered!'
                : order.status === 'Shipped'
                ? 'Your order is on its way to you!'
                : order.status === 'Processing'
                ? 'Your order is being prepared for shipment.'
                : 'Your order is being processed.'
              }
            </p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
          <button className="text-emerald-600 font-semibold hover:underline">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
