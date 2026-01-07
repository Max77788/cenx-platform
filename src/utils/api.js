/**
 * API utility functions for making requests to the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Make a GET request to the API
 */
export const apiGet = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData?.msg ||
          errorData?.message ||
          errorData?.errors?.message ||
          (typeof errorData?.errors === "string" ? errorData.errors : null) ||
          errorMessage;
      } catch (e) {
        // If response is not JSON, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API GET Error:', error);
    // If it's a network error, provide a more helpful message
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw error;
  }
};

/**
 * Make a POST request to the API
 */
export const apiPost = async (endpoint, body) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
};

/**
 * Get token price
 */
export const getTokenPrice = async (tokenAddress) => {

  console.log("tokenAddress", tokenAddress);

  const endpoint = tokenAddress 
    ? `/token/price?tokenAddress=${tokenAddress}`
    : '/token/price';
  return apiGet(endpoint);
};

/**
 * Get transaction history for a wallet
 */
export const getTransactionHistory = async (walletAddress, limit = 50, skip = 0) => {
  return apiPost('/transaction/history', {
    walletAddress,
    limit,
    skip,
  });
};

/**
 * Get token transfers from Moralis
 */
export const getTokenTransfers = async (tokenAddress, limit = 100, cursor = null) => {
  const endpoint = `/token/transfers?tokenAddress=${tokenAddress}&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
  return apiGet(endpoint);
};

