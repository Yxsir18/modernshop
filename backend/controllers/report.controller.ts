import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';

interface DateRange {
  start: string;
  end: string;
}

const getDateRangeFilter = (range: string): DateRange => {
  const now = new Date();
  const end = now.toISOString();
  let start: string;

  switch (range) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'all':
    default:
      start = new Date(0).toISOString();
      break;
  }

  return { start, end };
};

const filterByDateRange = <T extends { date: string }>(items: T[], range: string): T[] => {
  if (range === 'all') return items;
  
  const { start, end } = getDateRangeFilter(range);
  return items.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(start) && itemDate <= new Date(end);
  });
};

export const generateSalesReport = async (req: Request, res: Response) => {
  const { range = '30d', format = 'json' } = req.query;
  
  try {
    const orders = dbConnection.getCollection('orders');
    const filteredOrders = filterByDateRange(orders, range as string);
    
    const reportData = {
      reportType: 'Sales Report',
      dateRange: range,
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: filteredOrders.length > 0 
          ? filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length 
          : 0,
        statusBreakdown: filteredOrders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      orders: filteredOrders.map(order => ({
        orderNumber: order.orderNumber,
        date: order.date,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        itemCount: order.items.length,
        loyaltyPointsEarned: order.loyaltyPointsEarned,
        loyaltyPointsUsed: order.loyaltyPointsUsed
      }))
    };

    if (format === 'csv') {
      const csv = convertToCSV(reportData.orders);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${range}_${Date.now()}.csv"`);
      return res.send(csv);
    }

    return sendResponse(res, 200, true, 'Sales report generated successfully.', reportData);
  } catch (error) {
    return sendError(res, 500, 'Failed to generate sales report');
  }
};

export const generateInventoryReport = async (req: Request, res: Response) => {
  const { range = 'all', format = 'json' } = req.query;
  
  try {
    const products = dbConnection.getCollection('products');
    const orders = dbConnection.getCollection('orders');
    
    // Calculate sales data for each product
    const productSales = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    const reportData = {
      reportType: 'Inventory Report',
      dateRange: range,
      generatedAt: new Date().toISOString(),
      summary: {
        totalProducts: products.length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        lowStockProducts: products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length,
        outOfStockProducts: products.filter(p => p.stock === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
      },
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold || 5,
        price: product.price,
        discountPrice: product.discountPrice,
        totalValue: product.price * product.stock,
        unitsSold: productSales[product.id] || 0,
        isLowStock: product.stock <= (product.lowStockThreshold || 5),
        isOutOfStock: product.stock === 0,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival
      }))
    };

    if (format === 'csv') {
      const csv = convertToCSV(reportData.products);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${range}_${Date.now()}.csv"`);
      return res.send(csv);
    }

    return sendResponse(res, 200, true, 'Inventory report generated successfully.', reportData);
  } catch (error) {
    return sendError(res, 500, 'Failed to generate inventory report');
  }
};

export const generateCustomerReport = async (req: Request, res: Response) => {
  const { range = 'all', format = 'json' } = req.query;
  
  try {
    const users = dbConnection.getCollection('users');
    const orders = dbConnection.getCollection('orders');
    
    // Calculate customer metrics
    const customerMetrics = users.map(user => {
      const userOrders = orders.filter(o => o.userId === user.id);
      const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = userOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      return {
        ...user,
        totalSpent,
        totalOrders,
        avgOrderValue,
        lastOrderDate: userOrders.length > 0 ? userOrders[userOrders.length - 1].date : null
      };
    });

    const reportData = {
      reportType: 'Customer Report',
      dateRange: range,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCustomers: users.length,
        totalActiveCustomers: customerMetrics.filter(c => c.totalOrders > 0).length,
        totalRevenue: customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0),
        averageSpentPerCustomer: users.length > 0 
          ? customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / users.length 
          : 0,
        totalLoyaltyPoints: users.reduce((sum, u) => sum + u.loyaltyPoints, 0),
        customerBreakdown: {
          newCustomers: customerMetrics.filter(c => c.totalOrders === 0).length,
          oneTimeCustomers: customerMetrics.filter(c => c.totalOrders === 1).length,
          repeatCustomers: customerMetrics.filter(c => c.totalOrders > 1).length
        }
      },
      customers: customerMetrics.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        loyaltyPoints: customer.loyaltyPoints,
        referralCode: customer.referralCode,
        referredBy: customer.referredBy,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        avgOrderValue: customer.avgOrderValue,
        lastOrderDate: customer.lastOrderDate,
        addressCount: customer.addresses.length,
        dateJoined: customer.id // Using ID as proxy for join date
      }))
    };

    if (format === 'csv') {
      const csv = convertToCSV(reportData.customers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customer_report_${range}_${Date.now()}.csv"`);
      return res.send(csv);
    }

    return sendResponse(res, 200, true, 'Customer report generated successfully.', reportData);
  } catch (error) {
    return sendError(res, 500, 'Failed to generate customer report');
  }
};

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Handle objects/arrays
      if (typeof value === 'object') return JSON.stringify(value);
      // Escape quotes and commas
      const stringValue = String(value);
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${stringValue.replace(/"/g, '""')}"` 
        : stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};
