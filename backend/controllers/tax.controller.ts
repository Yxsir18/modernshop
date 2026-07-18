import { Response } from 'express';
import { sendResponse, sendError } from '../utils/response';
import { calculateGST, calculateGSTForCart, validateStateName, getStateCode, isUnionTerritory, getTaxInvoiceDetails, getCategoryFromHSN, isProductExempt } from '../services/tax.service';

export const calculateTax = async (req: any, res: Response) => {
  try {
    const { amount, customerAddress, productCategory, isExempt } = req.body;

    if (!amount || typeof amount !== 'number') {
      return sendError(res, 400, 'Valid amount is required.');
    }

    if (!customerAddress || !customerAddress.state) {
      return sendError(res, 400, 'Customer address with state is required.');
    }

    if (!validateStateName(customerAddress.state)) {
      return sendError(res, 400, 'Invalid Indian state name.');
    }

    const taxCalculation = calculateGST(
      amount,
      customerAddress,
      productCategory || 'general',
      isExempt || false
    );

    return sendResponse(res, 200, true, 'Tax calculated successfully.', {
      amount,
      customerAddress,
      taxCalculation,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error calculating tax:', error);
    return sendError(res, 500, 'Failed to calculate tax.');
  }
};

export const calculateCartTax = async (req: any, res: Response) => {
  try {
    const { items, customerAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'Cart items array is required.');
    }

    if (!customerAddress || !customerAddress.state) {
      return sendError(res, 400, 'Customer address with state is required.');
    }

    if (!validateStateName(customerAddress.state)) {
      return sendError(res, 400, 'Invalid Indian state name.');
    }

    const taxCalculation = calculateGSTForCart(items, customerAddress);

    return sendResponse(res, 200, true, 'Cart tax calculated successfully.', {
      customerAddress,
      taxCalculation,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error calculating cart tax:', error);
    return sendError(res, 500, 'Failed to calculate cart tax.');
  }
};

export const getTaxInvoice = async (req: any, res: Response) => {
  try {
    const { amount, customerAddress, productCategory } = req.body;

    if (!amount || typeof amount !== 'number') {
      return sendError(res, 400, 'Valid amount is required.');
    }

    if (!customerAddress || !customerAddress.state) {
      return sendError(res, 400, 'Customer address with state is required.');
    }

    const invoiceDetails = getTaxInvoiceDetails(amount, customerAddress, productCategory || 'general');

    return sendResponse(res, 200, true, 'Tax invoice details generated successfully.', invoiceDetails);
  } catch (error) {
    console.error('Error generating tax invoice:', error);
    return sendError(res, 500, 'Failed to generate tax invoice details.');
  }
};

export const validateState = async (req: any, res: Response) => {
  try {
    const { state } = req.body;

    if (!state) {
      return sendError(res, 400, 'State name is required.');
    }

    const isValid = validateStateName(state);
    const stateCode = isValid ? getStateCode(state) : null;
    const isUT = isValid ? isUnionTerritory(state) : null;

    return sendResponse(res, 200, true, 'State validation completed.', {
      state,
      isValid,
      stateCode,
      isUnionTerritory: isUT
    });
  } catch (error) {
    console.error('Error validating state:', error);
    return sendError(res, 500, 'Failed to validate state.');
  }
};

export const getProductTaxInfo = async (req: any, res: Response) => {
  try {
    const { hsnCode, category } = req.body;

    if (!hsnCode && !category) {
      return sendError(res, 400, 'Either HSN code or category is required.');
    }

    let productCategory = category;
    let isExempt = false;

    if (hsnCode) {
      productCategory = getCategoryFromHSN(hsnCode);
      isExempt = isProductExempt(productCategory);
    } else if (category) {
      isExempt = isProductExempt(category);
    }

    return sendResponse(res, 200, true, 'Product tax information retrieved successfully.', {
      hsnCode,
      category: productCategory,
      isExempt,
      taxRate: isExempt ? 0 : 18 // Default rate for non-exempt items
    });
  } catch (error) {
    console.error('Error fetching product tax info:', error);
    return sendError(res, 500, 'Failed to fetch product tax information.');
  }
};
