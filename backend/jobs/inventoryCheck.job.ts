// Automated background jobs manager
// Handles daily inventory checks, low-stock notifications alerts, and abandoned cart alerts
import { dbConnection } from '../config/db';

export const triggerLowStockAlerts = () => {
  const products = dbConnection.getCollection('products');
  const notifications = dbConnection.getCollection('notifications');
  const users = dbConnection.getCollection('users');
  const admins = users.filter(u => u.role === 'admin' || u.role === 'super-admin');
  
  const defaultThreshold = 5; // Default threshold if not set on product
  const lowStockProducts = products.filter(p => {
    const threshold = (p as any).lowStockThreshold || defaultThreshold;
    return p.stock <= threshold;
  });
  
  if (lowStockProducts.length > 0) {
    console.warn(`[LOW STOCK SYSTEM TRIGGER]: Found ${lowStockProducts.length} products with low stock.`);
    
    lowStockProducts.forEach(product => {
      const threshold = (product as any).lowStockThreshold || defaultThreshold;
      
      // Check if we already sent a notification for this product recently (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentNotification = notifications.find(n => 
        n.userId === 'all' && 
        n.title.includes(product.name) && 
        n.type === 'warning' &&
        new Date(n.date) > new Date(oneHourAgo)
      );
      
      if (!recentNotification) {
        const notification = {
          id: `stock_alert_${Date.now()}_${product.id}`,
          userId: 'all', // Send to all users (admins will see it)
          title: product.stock === 0 ? `OUT OF STOCK: ${product.name}` : `LOW STOCK: ${product.name}`,
          message: product.stock === 0 
            ? `${product.name} is now out of stock. Please restock immediately.`
            : `${product.name} has only ${product.stock} units remaining. Threshold: ${threshold}`,
          type: 'warning' as const,
          date: new Date().toISOString(),
          read: false
        };
        
        notifications.push(notification);
        console.log(`[LOW STOCK ALERT]: Created notification for ${product.name} (Stock: ${product.stock}, Threshold: ${threshold})`);
      }
    });
    
    dbConnection.updateCollection('notifications', notifications);
  }
};

export const initiateScheduledJobs = () => {
  console.log('[JOBS ENGINE]: Automated systems active. Listening for inventory events...');
  // Run initial check
  triggerLowStockAlerts();
  // Schedule recurring check every 5 minutes
  setInterval(triggerLowStockAlerts, 5 * 60 * 1000);
};
