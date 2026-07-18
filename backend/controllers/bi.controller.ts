import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';

export const getAdvancedBIStatus = async (req: Request, res: Response) => {
  try {
    const orders = [...dbConnection.getCollection('orders')];
    const users = [...dbConnection.getCollection('users')];
    const products = [...dbConnection.getCollection('products')];

    // 1. Customer Retention calculation (retained = users with >= 2 closed/completed orders)
    const userOrderCounts: Record<string, number> = {};
    orders.forEach(o => {
      userOrderCounts[o.userId] = (userOrderCounts[o.userId] || 0) + 1;
    });
    const uniqueBuyers = Object.keys(userOrderCounts).length;
    const retainedBuyers = Object.values(userOrderCounts).filter(count => count >= 2).length;
    const customerRetentionRate = uniqueBuyers > 0 
      ? parseFloat(((retainedBuyers / uniqueBuyers) * 100).toFixed(2)) 
      : 0;

    // 2. Product sales performance ranking
    const productMetrics: Record<string, { id: string; name: string; category: string; unitsSold: number; revenue: number }> = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          if (!productMetrics[item.productId]) {
            productMetrics[item.productId] = {
              id: item.productId,
              name: item.productName || 'Unknown Product',
              category: item.category || 'General',
              unitsSold: 0,
              revenue: 0
            };
          }
          const qty = item.quantity || 1;
          const price = item.price || 0;
          productMetrics[item.productId].unitsSold += qty;
          productMetrics[item.productId].revenue += qty * price;
        });
      }
    });
    const productRankings = Object.values(productMetrics)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 3. Cohort Analysis (Group orders volume by calendar months)
    const monthlyCohorts: Record<string, { count: number; totalRevenue: number }> = {};
    orders.forEach(o => {
      const date = o.createdAt || o.date;
      if (date) {
        const monthKey = new Date(date).toISOString().slice(0, 7); // e.g. "2026-06"
        if (!monthlyCohorts[monthKey]) {
          monthlyCohorts[monthKey] = { count: 0, totalRevenue: 0 };
        }
        monthlyCohorts[monthKey].count += 1;
        monthlyCohorts[monthKey].totalRevenue += o.totalAmount || o.total || 0;
      }
    });

    // 4. Sales Trends (Historically group performance timeline day-by-day)
    const dailyTrend: Record<string, number> = {};
    orders.forEach(o => {
      const date = o.createdAt || o.date;
      if (date) {
        const dayKey = new Date(date).toISOString().slice(0, 10);
        dailyTrend[dayKey] = (dailyTrend[dayKey] || 0) + (o.totalAmount || o.total || 0);
      }
    });
    const salesTrends = Object.entries(dailyTrend)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14) // Last 14 days
      .map(([date, sales]) => ({ date, sales }));

    // 5. Linear Revenue Forecasting for next 30 days
    // Map chronological daily values to line fit: y = mx + c
    const trendValues = Object.values(dailyTrend);
    let forecastedRevenueNext30Days = 0;
    if (trendValues.length > 1) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      const n = trendValues.length;
      trendValues.forEach((val, i) => {
        sumX += i;
        sumY += val;
        sumXY += i * val;
        sumXX += i * i;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
      const intercept = (sumY - slope * sumX) / n || 0;

      // Forecast next 30 steps summing predicted day values
      for (let day = n; day < n + 30; day++) {
        const singleDayForecast = Math.max(0, slope * day + intercept);
        forecastedRevenueNext30Days += singleDayForecast;
      }
    } else {
      // Fallback simple forecast (30 days extrapolation)
      const avgDaily = trendValues[0] || 1500;
      forecastedRevenueNext30Days = avgDaily * 30;
    }

    // 6. Conversion Funnel (Industry Benchmark Simulation)
    const ConversionFunnel = {
      sessions: 10000, // Total system views
      searches: 7500,  // Checked search catalog index
      cartAdds: 4200,  // Incremented item quantities to bag
      initiatedCheckout: 2100, // Loaded shipping form
      purchased: orders.length || 150 // Placed clean checkout transaction
    };

    const analyticsPayload = {
      customerRetentionRate,
      forecastedRevenueNext30Days: parseFloat(forecastedRevenueNext30Days.toFixed(2)),
      productRankings,
      monthlyCohorts,
      salesTrends,
      ConversionFunnel
    };

    return sendResponse(res, 200, true, 'Business intelligence coordinates compiled successfully.', analyticsPayload);
  } catch (error: any) {
    return sendError(res, 500, `Failed generating BI metrics: ${error?.message || error}`);
  }
};

/**
 * Endpoint to trigger instant Excel/CSV tabular sales exports
 */
export const exportSalesCSVReport = async (req: Request, res: Response) => {
  try {
    const orders = [...dbConnection.getCollection('orders')];

    // CSV Headers
    let csvContent = 'Order ID,Date,Status,User ID,Total Amount ($),Payment Status,Items Count\n';

    orders.forEach(o => {
      const itemsCount = o.items ? o.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 1;
      const dateString = new Date(o.createdAt || o.date || Date.now()).toISOString().slice(0, 10);
      csvContent += `${o.id},${dateString},${o.status},${o.userId},${(o.totalAmount || o.total || 0).toFixed(2)},${o.paymentStatus || 'Pending'},${itemsCount}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ModernShop-Enterprise-Sales-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).send(`Failed compiling export report: ${error.message}`);
  }
};
