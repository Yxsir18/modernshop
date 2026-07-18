import { Response } from 'express';
import { sendResponse, sendError } from '../utils/response';
import { getShippingRates, generateTrackingNumber, getTrackingInfo, validatePinCode, getStateFromPinCode } from '../services/shipping.service';
import { carrierService, ShipmentRequest } from '../services/carrier.service';
import { dbConnection } from '../config/db';

export const fetchShippingRates = async (req: any, res: Response) => {
  try {
    const { destinationAddress, packageDetails } = req.body;

    // Validate destination address
    if (!destinationAddress) {
      return sendError(res, 400, 'Destination address is required.');
    }

    const city = destinationAddress.city || 'Mumbai';
    const state = destinationAddress.state || 'Maharashtra';
    const zipCode = destinationAddress.zipCode || '400001';
    const country = destinationAddress.country || 'India';

    // Validate country - India only
    if (country && country.toLowerCase() !== 'india') {
      return sendError(res, 400, 'We currently deliver within India only.');
    }

    // Validate package details
    if (!packageDetails) {
      return sendError(res, 400, 'Package details are required.');
    }

    const weight = packageDetails.weight || 0.5; // Default to 0.5kg if not provided

    // Validate PIN code (only if provided and not default)
    if (destinationAddress.zipCode && !validatePinCode(destinationAddress.zipCode)) {
      return sendError(res, 400, 'Invalid Indian PIN code format.');
    }

    // Default origin address (can be configured via environment variables)
    const originAddress = {
      street: process.env.WAREHOUSE_ADDRESS || 'Warehouse Complex',
      city: process.env.WAREHOUSE_CITY || 'Mumbai',
      state: process.env.WAREHOUSE_STATE || 'Maharashtra',
      zipCode: process.env.WAREHOUSE_PINCODE || '400001',
      country: 'India'
    };

    const normalizedDestination = {
      street: destinationAddress.street || '',
      city,
      state,
      zipCode,
      country
    };

    const normalizedPackageDetails = {
      weight,
      length: packageDetails.length,
      width: packageDetails.width,
      height: packageDetails.height
    };

    const rates = await getShippingRates(originAddress, normalizedDestination, normalizedPackageDetails);

    return sendResponse(res, 200, true, 'Shipping rates calculated successfully.', {
      origin: originAddress,
      destination: normalizedDestination,
      packageDetails: normalizedPackageDetails,
      rates,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return sendError(res, 500, 'Failed to calculate shipping rates.');
  }
};

export const generateShipmentTracking = async (req: any, res: Response) => {
  try {
    const { carrier, orderId } = req.body;

    if (!carrier || !orderId) {
      return sendError(res, 400, 'Carrier and order ID are required.');
    }

    const trackingNumber = generateTrackingNumber(carrier, orderId);

    return sendResponse(res, 200, true, 'Tracking number generated successfully.', {
      trackingNumber,
      carrier,
      orderId
    });
  } catch (error) {
    console.error('Error generating tracking number:', error);
    return sendError(res, 500, 'Failed to generate tracking number.');
  }
};

export const createCarrierShipment = async (req: any, res: Response) => {
  try {
    const { carrier, orderData } = req.body;

    if (!carrier || !orderData) {
      return sendError(res, 400, 'Carrier and order data are required.');
    }

    const shipmentRequest: ShipmentRequest = {
      carrier,
      orderData
    };

    const result = await carrierService.createShipment(shipmentRequest);

    if (result.success) {
      // Update order with tracking information
      const orders = dbConnection.getCollection('orders');
      const order = orders.find(o => o.id === orderData.orderId);
      
      if (order) {
        (order as any).trackingNumber = result.trackingNumber;
        (order as any).carrier = carrier;
        (order as any).estimatedDelivery = result.estimatedDelivery;
        (order as any).labelUrl = result.labelUrl;
        
        (order as any).timeline.push({
          status: 'Shipped',
          description: `Shipment created via ${carrier}. Tracking: ${result.trackingNumber}`,
          timestamp: new Date().toISOString()
        });
        
        dbConnection.updateCollection('orders', orders);
      }

      return sendResponse(res, 200, true, 'Shipment created successfully via carrier API.', result);
    }

    return sendError(res, 400, result.error || 'Failed to create shipment.');
  } catch (error) {
    console.error('Error creating carrier shipment:', error);
    return sendError(res, 500, 'Failed to create shipment via carrier API.');
  }
};

export const trackCarrierShipment = async (req: any, res: Response) => {
  try {
    const { carrier, trackingNumber } = req.params;

    if (!carrier || !trackingNumber) {
      return sendError(res, 400, 'Carrier and tracking number are required.');
    }

    const trackingInfo = await carrierService.trackShipment(carrier, trackingNumber);

    return sendResponse(res, 200, true, 'Tracking information retrieved successfully.', trackingInfo);
  } catch (error) {
    console.error('Error tracking carrier shipment:', error);
    return sendError(res, 500, 'Failed to track shipment.');
  }
};

export const handleCarrierWebhook = async (req: any, res: Response) => {
  try {
    const { carrier } = req.params;
    const payload = req.body;

    if (!carrier) {
      return sendError(res, 400, 'Carrier is required.');
    }

    const result = await carrierService.processWebhook(carrier, payload);

    if (result.success && result.trackingNumber) {
      // Update order status based on webhook
      const orders = dbConnection.getCollection('orders');
      const order = orders.find(o => (o as any).trackingNumber === result.trackingNumber);
      
      if (order) {
        (order as any).status = result.status || order.status;
        (order as any).timeline.push({
          status: result.status || 'Status Updated',
          description: `Status updated via ${carrier} webhook`,
          timestamp: new Date().toISOString()
        });
        
        dbConnection.updateCollection('orders', orders);
      }
    }

    return sendResponse(res, 200, true, 'Webhook processed successfully.', result);
  } catch (error) {
    console.error('Error processing carrier webhook:', error);
    return sendError(res, 500, 'Failed to process webhook.');
  }
};

export const getAvailableCarriers = async (req: any, res: Response) => {
  try {
    const carriers = carrierService.getAvailableCarriers();
    return sendResponse(res, 200, true, 'Available carriers retrieved successfully.', carriers);
  } catch (error) {
    console.error('Error fetching available carriers:', error);
    return sendError(res, 500, 'Failed to fetch available carriers.');
  }
};

export const fetchTrackingInfo = async (req: any, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return sendError(res, 400, 'Tracking number is required.');
    }

    const trackingInfo = await getTrackingInfo(trackingNumber);

    return sendResponse(res, 200, true, 'Tracking information retrieved successfully.', trackingInfo);
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return sendError(res, 500, 'Failed to fetch tracking information.');
  }
};

export const validateAddress = async (req: any, res: Response) => {
  try {
    const { pinCode, state, country } = req.body;

    if (!pinCode) {
      return sendError(res, 400, 'PIN code is required.');
    }

    // Validate country - India only
    if (country && country.toLowerCase() !== 'india') {
      return sendError(res, 400, 'We currently deliver within India only.');
    }

    const isValidPin = validatePinCode(pinCode);
    const stateFromPin = getStateFromPinCode(pinCode);

    const validation = {
      pinCodeValid: isValidPin,
      suggestedState: stateFromPin,
      stateMatch: state ? stateFromPin === state : null,
      countryValid: !country || country.toLowerCase() === 'india'
    };

    return sendResponse(res, 200, true, 'Address validation completed.', validation);
  } catch (error) {
    console.error('Error validating address:', error);
    return sendError(res, 500, 'Failed to validate address.');
  }
};
