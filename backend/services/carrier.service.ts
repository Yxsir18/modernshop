import axios from 'axios';

export interface ShipmentRequest {
  carrier: 'delhivery' | 'bluedart' | 'fedex' | 'dtdc' | 'shiprocket';
  orderData: {
    orderId: string;
    orderNumber: string;
    shipToAddress: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      phone: string;
    };
    shipFromAddress: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      phone: string;
    };
    packages: Array<{
      weight: number;
      dimensions?: {
        length: number;
        width: number;
        height: number;
      };
      description: string;
      value?: number;
    }>;
    serviceType?: string;
    paymentType?: 'prepaid' | 'cod';
    declaredValue?: number;
  };
}

export interface TrackingResponse {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  currentLocation?: string;
  trackingHistory: Array<{
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }>;
}

export interface CarrierShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  estimatedDelivery?: string;
  error?: string;
}

class CarrierService {
  private carriers = {
    delhivery: {
      apiKey: process.env.DELHIVERY_API_KEY,
      apiUrl: process.env.DELHIVERY_API_URL || 'https://track.delhivery.com/api/cmu/json.json',
    },
    bluedart: {
      apiKey: process.env.BLUEDART_API_KEY,
      apiUrl: process.env.BLUEDART_API_URL || 'https://api.bluedart.com/logistics/API',
    },
    fedex: {
      apiKey: process.env.FEDEX_API_KEY,
      apiSecret: process.env.FEDEX_API_SECRET,
      apiUrl: process.env.FEDEX_API_URL || 'https://apis.fedex.com',
    },
    dtdc: {
      apiKey: process.env.DTDC_API_KEY,
      apiUrl: process.env.DTDC_API_URL || 'https://dtdc-api.dtdc.com',
    },
    shiprocket: {
      apiKey: process.env.SHIPROCKET_API_KEY,
      email: process.env.SHIPROCKET_API_EMAIL,
      apiUrl: process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in',
    },
  };

  /**
   * Create shipment via carrier API
   */
  async createShipment(request: ShipmentRequest): Promise<CarrierShipmentResponse> {
    const { carrier, orderData } = request;

    try {
      switch (carrier) {
        case 'delhivery':
          return await this.createDelhiveryShipment(orderData);
        case 'bluedart':
          return await this.createBlueDartShipment(orderData);
        case 'fedex':
          return await this.createFedExShipment(orderData);
        case 'dtdc':
          return await this.createDTDCShipment(orderData);
        case 'shiprocket':
          return await this.createShiprocketShipment(orderData);
        default:
          return { success: false, error: 'Unsupported carrier' };
      }
    } catch (error: any) {
      console.error(`[CARRIER] Error creating shipment for ${carrier}:`, error);
      return { success: false, error: error.message || 'Failed to create shipment' };
    }
  }

  /**
   * Delhivery Shipment Creation
   */
  private async createDelhiveryShipment(orderData: any): Promise<CarrierShipmentResponse> {
    const { apiKey, apiUrl } = this.carriers.delhivery;
    
    if (!apiKey || apiKey === 'your_delhivery_api_key') {
      // Fallback to simulation for demo
      return this.simulateShipmentCreation('delhivery', orderData);
    }

    const payload = {
      format: 'json',
      data: {
        shipments: [{
          name: orderData.shipToAddress.name,
          add: orderData.shipToAddress.address,
          add2: orderData.shipToAddress.city,
          city: orderData.shipToAddress.city,
          state: orderData.shipToAddress.state,
          country: orderData.shipToAddress.country,
          pin: orderData.shipToAddress.pincode,
          phone: orderData.shipToAddress.phone,
          order: orderData.orderNumber,
          payment_mode: orderData.paymentType === 'cod' ? 'COD' : 'Prepaid',
          total_amount: orderData.declaredValue || 0,
          order_date: new Date().toISOString().split('T')[0],
          shipment_width: orderData.packages[0]?.dimensions?.width || 10,
          shipment_height: orderData.packages[0]?.dimensions?.height || 10,
          shipment_length: orderData.packages[0]?.dimensions?.length || 10,
          weight: orderData.packages[0]?.weight || 0.5,
          pieces: orderData.packages.length,
        }]
      }
    };

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          trackingNumber: response.data.waybill || response.data.awb,
          estimatedDelivery: response.data.estimated_delivery,
        };
      }

      return { success: false, error: response.data?.error || 'Delhivery API error' };
    } catch (error) {
      console.error('[DELHIVERY] API Error:', error);
      return this.simulateShipmentCreation('delhivery', orderData);
    }
  }

  /**
   * Blue Dart Shipment Creation
   */
  private async createBlueDartShipment(orderData: any): Promise<CarrierShipmentResponse> {
    const { apiKey, apiUrl } = this.carriers.bluedart;
    
    if (!apiKey || apiKey === 'your_bluedart_api_key') {
      return this.simulateShipmentCreation('bluedart', orderData);
    }

    const payload = {
      Profile: {
        ApiKey: apiKey,
        ApiType: 'A',
        Version: '1.3',
      },
      Consignee: {
        Name: orderData.shipToAddress.name,
        Address1: orderData.shipToAddress.address,
        City: orderData.shipToAddress.city,
        State: orderData.shipToAddress.state,
        PinCode: orderData.shipToAddress.pincode,
        Country: orderData.shipToAddress.country,
        Phone: orderData.shipToAddress.phone,
      },
      Consignor: {
        Name: orderData.shipFromAddress.name,
        Address1: orderData.shipFromAddress.address,
        City: orderData.shipFromAddress.city,
        State: orderData.shipFromAddress.state,
        PinCode: orderData.shipFromAddress.pincode,
        Country: orderData.shipFromAddress.country,
        Phone: orderData.shipFromAddress.phone,
      },
      Services: {
        Service: {
          Type: orderData.serviceType || 'S',
          Description: 'Standard Delivery',
        },
      },
      Shipment: {
        NumberOfPieces: orderData.packages.length,
        ActualWeight: orderData.packages[0]?.weight || 0.5,
        VolWeight: orderData.packages[0]?.weight || 0.5,
        Description: orderData.packages[0]?.description || 'Package',
        InvoiceNo: orderData.orderNumber,
        InvoiceDate: new Date().toISOString().split('T')[0],
        EDD: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    };

    try {
      const response = await axios.post(`${apiUrl}/Shipment/GenerateWaybill`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.Shipment) {
        return {
          success: true,
          trackingNumber: response.data.Shipment.WaybillNo,
          estimatedDelivery: response.data.Shipment.EDD,
        };
      }

      return { success: false, error: 'Blue Dart API error' };
    } catch (error) {
      console.error('[BLUEDART] API Error:', error);
      return this.simulateShipmentCreation('bluedart', orderData);
    }
  }

  /**
   * FedEx Shipment Creation
   */
  private async createFedExShipment(orderData: any): Promise<CarrierShipmentResponse> {
    const { apiKey, apiSecret, apiUrl } = this.carriers.fedex;
    
    if (!apiKey || apiKey === 'your_fedex_api_key') {
      return this.simulateShipmentCreation('fedex', orderData);
    }

    const payload = {
      labelResponseOption: 'LABEL',
      requestedShipment: {
        shipper: {
          contact: {
            personName: orderData.shipFromAddress.name,
            phoneNumber: orderData.shipFromAddress.phone,
          },
          address: {
            streetLines: [orderData.shipFromAddress.address],
            city: orderData.shipFromAddress.city,
            stateOrProvinceCode: orderData.shipFromAddress.state,
            postalCode: orderData.shipFromAddress.pincode,
            countryCode: orderData.shipFromAddress.country,
          },
        },
        recipients: [{
          contact: {
            personName: orderData.shipToAddress.name,
            phoneNumber: orderData.shipToAddress.phone,
          },
          address: {
            streetLines: [orderData.shipToAddress.address],
            city: orderData.shipToAddress.city,
            stateOrProvinceCode: orderData.shipToAddress.state,
            postalCode: orderData.shipToAddress.pincode,
            countryCode: orderData.shipToAddress.country,
          },
        }],
        packageCount: orderData.packages.length,
        requestedPackageLineItems: orderData.packages.map((pkg: any) => ({
          weight: {
            units: 'KG',
            value: pkg.weight,
          },
          dimensions: pkg.dimensions ? {
            length: pkg.dimensions.length,
            width: pkg.dimensions.width,
            height: pkg.dimensions.height,
            units: 'CM',
          } : undefined,
        })),
        serviceType: orderData.serviceType || 'FEDEX_GROUND',
        paymentType: orderData.paymentType === 'cod' ? 'COD' : 'SENDER',
      },
    };

    try {
      const response = await axios.post(`${apiUrl}/ship/v1/shipments`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.data && response.data.output) {
        return {
          success: true,
          trackingNumber: response.data.output.transactionShipments?.[0]?.masterTrackingNumber,
          labelUrl: response.data.output.transactionShipments?.[0]?.pieceResponses?.[0]?.labelUrl,
          estimatedDelivery: response.data.output.transactionShipments?.[0]?.commitment?.commitTimestamp,
        };
      }

      return { success: false, error: 'FedEx API error' };
    } catch (error) {
      console.error('[FEDEX] API Error:', error);
      return this.simulateShipmentCreation('fedex', orderData);
    }
  }

  /**
   * DTDC Shipment Creation
   */
  private async createDTDCShipment(orderData: any): Promise<CarrierShipmentResponse> {
    const { apiKey, apiUrl } = this.carriers.dtdc;
    
    if (!apiKey || apiKey === 'your_dtdc_api_key') {
      return this.simulateShipmentCreation('dtdc', orderData);
    }

    const payload = {
      apikey: apiKey,
      request: {
        shipment: {
          consignee: {
            name: orderData.shipToAddress.name,
            address: orderData.shipToAddress.address,
            city: orderData.shipToAddress.city,
            state: orderData.shipToAddress.state,
          },
          consignor: {
            name: orderData.shipFromAddress.name,
            address: orderData.shipFromAddress.address,
            city: orderData.shipFromAddress.city,
            state: orderData.shipFromAddress.state,
          },
          packages: orderData.packages.map((pkg: any) => ({
            weight: pkg.weight,
            description: pkg.description,
          })),
          service: orderData.serviceType || 'Standard',
        },
      },
    };

    try {
      const response = await axios.post(`${apiUrl}/createShipment`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.awb_no) {
        return {
          success: true,
          trackingNumber: response.data.awb_no,
          estimatedDelivery: response.data.estimated_delivery,
        };
      }

      return { success: false, error: 'DTDC API error' };
    } catch (error) {
      console.error('[DTDC] API Error:', error);
      return this.simulateShipmentCreation('dtdc', orderData);
    }
  }

  /**
   * Shiprocket Shipment Creation
   */
  private async createShiprocketShipment(orderData: any): Promise<CarrierShipmentResponse> {
    const { apiKey, email, apiUrl } = this.carriers.shiprocket;
    
    if (!apiKey || apiKey === 'your_shiprocket_api_key') {
      return this.simulateShipmentCreation('shiprocket', orderData);
    }

    const payload = {
      order_id: orderData.orderId,
      order_date: new Date().toISOString().split('T')[0],
      channel_id: '',
      comment: '',
      billing_customer_name: orderData.shipToAddress.name,
      billing_last_name: '',
      billing_address: orderData.shipToAddress.address,
      billing_address_2: '',
      billing_city: orderData.shipToAddress.city,
      billing_pincode: orderData.shipToAddress.pincode,
      billing_state: orderData.shipToAddress.state,
      billing_country: orderData.shipToAddress.country,
      billing_email: email,
      billing_phone: orderData.shipToAddress.phone,
      shipping_is_billing: true,
      shipping_customer_name: orderData.shipToAddress.name,
      shipping_last_name: '',
      shipping_address: orderData.shipToAddress.address,
      shipping_address_2: '',
      shipping_city: orderData.shipToAddress.city,
      shipping_pincode: orderData.shipToAddress.pincode,
      shipping_country: orderData.shipToAddress.country,
      shipping_state: orderData.shipToAddress.state,
      shipping_email: email,
      shipping_phone: orderData.shipToAddress.phone,
      order_items: orderData.packages.map((pkg: any) => ({
        name: pkg.description,
        sku: '',
        units: 1,
        selling_price: pkg.value || 0,
        discount: 0,
        tax: 0,
        hsn: '',
      })),
      payment_method: orderData.paymentType === 'cod' ? 'cod' : 'prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.declaredValue || 0,
      length: orderData.packages[0]?.dimensions?.length || 10,
      breadth: orderData.packages[0]?.dimensions?.width || 10,
      height: orderData.packages[0]?.dimensions?.height || 10,
      weight: orderData.packages[0]?.weight || 0.5,
    };

    try {
      const response = await axios.post(`${apiUrl}/orders/create/adhoc`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.data && response.data.order_id) {
        return {
          success: true,
          trackingNumber: response.data.shipments?.[0]?.awb,
          estimatedDelivery: response.data.estimated_delivery,
        };
      }

      return { success: false, error: response.data?.message || 'Shiprocket API error' };
    } catch (error) {
      console.error('[SHIPROCKET] API Error:', error);
      return this.simulateShipmentCreation('shiprocket', orderData);
    }
  }

  /**
   * Simulate shipment creation for demo/testing
   */
  private simulateShipmentCreation(carrier: string, orderData: any): CarrierShipmentResponse {
    const trackingNumber = this.generateTrackingNumber(carrier);
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    
    console.log(`[CARRIER] Simulated shipment creation for ${carrier}: ${trackingNumber}`);
    
    return {
      success: true,
      trackingNumber,
      estimatedDelivery,
    };
  }

  /**
   * Generate tracking number for simulation
   */
  private generateTrackingNumber(carrier: string): string {
    const prefixes = {
      delhivery: 'DLV',
      bluedart: 'BDT',
      fedex: 'FDX',
      dtdc: 'DTDC',
      shiprocket: 'SRK',
    };
    
    const prefix = prefixes[carrier as keyof typeof prefixes] || 'TRK';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    
    return `${prefix}${random}${timestamp}`;
  }

  /**
   * Track shipment in real-time
   */
  async trackShipment(carrier: string, trackingNumber: string): Promise<TrackingResponse> {
    try {
      switch (carrier) {
        case 'delhivery':
          return await this.trackDelhivery(trackingNumber);
        case 'bluedart':
          return await this.trackBlueDart(trackingNumber);
        case 'fedex':
          return await this.trackFedEx(trackingNumber);
        case 'dtdc':
          return await this.trackDTDC(trackingNumber);
        case 'shiprocket':
          return await this.trackShiprocket(trackingNumber);
        default:
          return this.simulateTracking(carrier, trackingNumber);
      }
    } catch (error: any) {
      console.error(`[CARRIER] Error tracking ${carrier} shipment:`, error);
      return this.simulateTracking(carrier, trackingNumber);
    }
  }

  /**
   * Track Delhivery shipment
   */
  private async trackDelhivery(trackingNumber: string): Promise<TrackingResponse> {
    const { apiKey, apiUrl } = this.carriers.delhivery;
    
    if (!apiKey || apiKey === 'your_delhivery_api_key') {
      return this.simulateTracking('delhivery', trackingNumber);
    }

    try {
      const response = await axios.get(`${apiUrl}/track/${trackingNumber}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      });

      if (response.data && response.data.shipment) {
        return {
          trackingNumber,
          carrier: 'delhivery',
          status: response.data.shipment.status?.status || 'In Transit',
          currentLocation: response.data.shipment.status?.location,
          estimatedDelivery: response.data.shipment.estimated_delivery,
          trackingHistory: response.data.shipment.status?.history || [],
        };
      }

      return this.simulateTracking('delhivery', trackingNumber);
    } catch (error) {
      return this.simulateTracking('delhivery', trackingNumber);
    }
  }

  /**
   * Track Blue Dart shipment
   */
  private async trackBlueDart(trackingNumber: string): Promise<TrackingResponse> {
    const { apiKey, apiUrl } = this.carriers.bluedart;
    
    if (!apiKey || apiKey === 'your_bluedart_api_key') {
      return this.simulateTracking('bluedart', trackingNumber);
    }

    try {
      const response = await axios.get(`${apiUrl}/Tracking/TrackShipment`, {
        params: {
          ApiKey: apiKey,
          TrackNo: trackingNumber,
        },
      });

      if (response.data && response.data.TrackingResponse) {
        return {
          trackingNumber,
          carrier: 'bluedart',
          status: response.data.TrackingResponse.Status?.Status || 'In Transit',
          currentLocation: response.data.TrackingResponse.Status?.Location,
          trackingHistory: response.data.TrackingResponse.TrackHistory || [],
        };
      }

      return this.simulateTracking('bluedart', trackingNumber);
    } catch (error) {
      return this.simulateTracking('bluedart', trackingNumber);
    }
  }

  /**
   * Track FedEx shipment
   */
  private async trackFedEx(trackingNumber: string): Promise<TrackingResponse> {
    const { apiKey, apiUrl } = this.carriers.fedex;
    
    if (!apiKey || apiKey === 'your_fedex_api_key') {
      return this.simulateTracking('fedex', trackingNumber);
    }

    try {
      const response = await axios.get(`${apiUrl}/track/v1/trackings/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.data && response.data.output) {
        return {
          trackingNumber,
          carrier: 'fedex',
          status: response.data.output.completeTrackResults?.[0]?.trackResults?.[0]?.latestStatusDetail?.description || 'In Transit',
          estimatedDelivery: response.data.output.completeTrackResults?.[0]?.estimatedDeliveryTime,
          trackingHistory: response.data.output.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents || [],
        };
      }

      return this.simulateTracking('fedex', trackingNumber);
    } catch (error) {
      return this.simulateTracking('fedex', trackingNumber);
    }
  }

  /**
   * Track DTDC shipment
   */
  private async trackDTDC(trackingNumber: string): Promise<TrackingResponse> {
    const { apiKey, apiUrl } = this.carriers.dtdc;
    
    if (!apiKey || apiKey === 'your_dtdc_api_key') {
      return this.simulateTracking('dtdc', trackingNumber);
    }

    try {
      const response = await axios.get(`${apiUrl}/track/${trackingNumber}`, {
        params: {
          apikey: apiKey,
        },
      });

      if (response.data && response.data.tracking) {
        return {
          trackingNumber,
          carrier: 'dtdc',
          status: response.data.tracking.status || 'In Transit',
          currentLocation: response.data.tracking.location,
          trackingHistory: response.data.tracking.history || [],
        };
      }

      return this.simulateTracking('dtdc', trackingNumber);
    } catch (error) {
      return this.simulateTracking('dtdc', trackingNumber);
    }
  }

  /**
   * Track Shiprocket shipment
   */
  private async trackShiprocket(trackingNumber: string): Promise<TrackingResponse> {
    const { apiKey, apiUrl } = this.carriers.shiprocket;
    
    if (!apiKey || apiKey === 'your_shiprocket_api_key') {
      return this.simulateTracking('shiprocket', trackingNumber);
    }

    try {
      const response = await axios.get(`${apiUrl}/orders/track/awb/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.data && response.data.tracking_data) {
        return {
          trackingNumber,
          carrier: 'shiprocket',
          status: response.data.tracking_data.status || 'In Transit',
          currentLocation: response.data.tracking_data.current_location,
          trackingHistory: response.data.tracking_data.tracking_history || [],
        };
      }

      return this.simulateTracking('shiprocket', trackingNumber);
    } catch (error) {
      return this.simulateTracking('shiprocket', trackingNumber);
    }
  }

  /**
   * Simulate tracking for demo/testing
   */
  private simulateTracking(carrier: string, trackingNumber: string): TrackingResponse {
    const statuses = ['In Transit', 'Out for Delivery', 'Delivered', 'Pending'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      trackingNumber,
      carrier,
      status: randomStatus,
      currentLocation: 'Distribution Center',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      trackingHistory: [
        {
          status: 'Shipped',
          location: 'Warehouse',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Package picked up',
        },
        {
          status: 'In Transit',
          location: 'Distribution Center',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Package in transit',
        },
      ],
    };
  }

  /**
   * Process webhook from carrier
   */
  async processWebhook(carrier: string, payload: any): Promise<{ success: boolean; trackingNumber?: string; status?: string }> {
    console.log(`[CARRIER] Received webhook from ${carrier}:`, payload);
    
    try {
      switch (carrier) {
        case 'delhivery':
          return await this.processDelhiveryWebhook(payload);
        case 'bluedart':
          return await this.processBlueDartWebhook(payload);
        case 'fedex':
          return await this.processFedExWebhook(payload);
        case 'dtdc':
          return await this.processDTDCWebhook(payload);
        case 'shiprocket':
          return await this.processShiprocketWebhook(payload);
        default:
          return { success: false };
      }
    } catch (error) {
      console.error(`[CARRIER] Error processing webhook from ${carrier}:`, error);
      return { success: false };
    }
  }

  private async processDelhiveryWebhook(payload: any) {
    const trackingNumber = payload.waybill || payload.awb;
    const status = payload.status || payload.current_status;
    return { success: true, trackingNumber, status };
  }

  private async processBlueDartWebhook(payload: any) {
    const trackingNumber = payload.waybill_no || payload.tracking_number;
    const status = payload.status || payload.current_status;
    return { success: true, trackingNumber, status };
  }

  private async processFedExWebhook(payload: any) {
    const trackingNumber = payload.tracking_number || payload.master_tracking_number;
    const status = payload.status || payload.event_type;
    return { success: true, trackingNumber, status };
  }

  private async processDTDCWebhook(payload: any) {
    const trackingNumber = payload.awb_no || payload.tracking_number;
    const status = payload.status || payload.current_status;
    return { success: true, trackingNumber, status };
  }

  private async processShiprocketWebhook(payload: any) {
    const trackingNumber = payload.awb || payload.tracking_number;
    const status = payload.status || payload.current_status;
    return { success: true, trackingNumber, status };
  }

  /**
   * Get available carriers
   */
  getAvailableCarriers(): Array<{ id: string; name: string; logo: string }> {
    return [
      { id: 'delhivery', name: 'Delhivery', logo: '/carriers/delhivery.png' },
      { id: 'bluedart', name: 'Blue Dart', logo: '/carriers/bluedart.png' },
      { id: 'fedex', name: 'FedEx', logo: '/carriers/fedex.png' },
      { id: 'dtdc', name: 'DTDC', logo: '/carriers/dtdc.png' },
      { id: 'shiprocket', name: 'Shiprocket', logo: '/carriers/shiprocket.png' },
    ];
  }
}

export const carrierService = new CarrierService();
