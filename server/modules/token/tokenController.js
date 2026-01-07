const httpStatus = require("http-status");
const otherHelper = require("../../helper/others.helper");
const https = require("https");
const http = require("http");

// http-status v2+ uses different export format, define status codes directly
const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

console.log("📦 Loading tokenController module...");

const tokenController = {};

console.log("✅ tokenController object created, methods:", Object.keys(tokenController));

const TOKEN_PRICE_DEBUG =
  process.env.DEBUG_TOKEN_PRICE === "1" ||
  process.env.DEBUG_TOKEN_PRICE === "true";

const debugLog = (...args) => {
  if (TOKEN_PRICE_DEBUG) console.log("[token-price]", ...args);
};

/**
 * Helper function to make HTTP requests
 */
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    debugLog("makeRequest:start", { url });
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;
    
    // Merge default headers with provided headers
    const defaultHeaders = {
      'User-Agent': 'Node.js',
    };
    const headers = { ...defaultHeaders, ...(options.headers || {}) };
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: headers,
      timeout: options.timeout || 10000,
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = "";
      debugLog("makeRequest:response", {
        url,
        statusCode: res.statusCode,
        contentType: res.headers?.["content-type"],
      });

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          debugLog("makeRequest:json", {
            url,
            statusCode: res.statusCode,
            topLevelKeys:
              jsonData && typeof jsonData === "object"
                ? Object.keys(jsonData).slice(0, 20)
                : null,
          });
          resolve({ data: jsonData, status: res.statusCode });
        } catch (e) {
          debugLog("makeRequest:non_json", {
            url,
            statusCode: res.statusCode,
            sample: typeof data === "string" ? data.slice(0, 200) : null,
          });
          resolve({ data: data, status: res.statusCode });
        }
      });
    });

    req.on("error", (error) => {
      debugLog("makeRequest:error", { url, message: error?.message });
      reject(error);
    });

    req.on("timeout", () => {
      debugLog("makeRequest:timeout", { url });
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
};

/**
 * Get token price from CoinGecko API
 * @route GET /api/token/price
 * @description Get current token price in USD
 * @access Public
 */
tokenController.GetTokenPrice = async (req, res, next) => {
  console.log("🚀 GetTokenPrice: FUNCTION CALLED");
  console.log("📥 GetTokenPrice: Request URL:", req.url);
  console.log("📥 GetTokenPrice: Request Query:", req.query);
  
  try {
    const { tokenAddress } = req.query;

    console.log("🔍 GetTokenPrice: tokenAddress from query:", tokenAddress);
    
    // Default token address for cenx token on BSC
    const defaultTokenAddress = "0x739e81BCd49854d7BDF526302989f14A2E7994B2";
    const address = tokenAddress || defaultTokenAddress;
    const addressLower = String(address || "").toLowerCase();

    console.log("✅ GetTokenPrice: Resolved address:", address);
    console.log("✅ GetTokenPrice: Address (lowercase):", addressLower);

    debugLog("GetTokenPrice:request", {
      tokenAddress,
      resolvedAddress: address,
      resolvedAddressLower: addressLower,
    });

    try {
      // Try CoinGecko API first (BSC chain)
      const url = `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
      debugLog("GetTokenPrice:coingecko:fetch", { url });
      const response = await makeRequest(url);

      debugLog("GetTokenPrice:coingecko:result", {
        status: response?.status,
        hasData: !!response?.data,
        dataType: typeof response?.data,
      });

      if (response.status === 200 && response.data) {
        const keys =
          response.data && typeof response.data === "object"
            ? Object.keys(response.data)
            : [];
        debugLog("GetTokenPrice:coingecko:data_keys", {
          count: keys.length,
          sample: keys.slice(0, 5),
        });

        const tokenData = response.data[addressLower];
        debugLog("GetTokenPrice:coingecko:tokenData", {
          found: !!tokenData,
          tokenDataKeys:
            tokenData && typeof tokenData === "object"
              ? Object.keys(tokenData)
              : null,
          tokenData,
        });

        if (tokenData) {
          console.log("✅ GetTokenPrice: CoinGecko success - Price:", tokenData.usd);
          return otherHelper.sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            {
              price: tokenData.usd || 0,
              priceChange24h: tokenData.usd_24h_change || 0,
              volume24h: tokenData.usd_24h_vol || 0,
              lastUpdated: tokenData.last_updated_at || Date.now(),
              source: "coingecko",
            },
            null,
            null,
            null
          );
        } else {
          console.log("⚠️ GetTokenPrice: CoinGecko returned data but no tokenData for address:", addressLower);
        }
      }
    } catch (coingeckoError) {
      console.log("CoinGecko API error:", coingeckoError.message);
      debugLog("GetTokenPrice:coingecko:error", {
        message: coingeckoError?.message,
      });
    }

    // Fallback: Try PancakeSwap API
    try {
      const url = `https://api.pancakeswap.info/api/v2/tokens/${address}`;
      debugLog("GetTokenPrice:pancakeswap:fetch", { url });
      const pancakeResponse = await makeRequest(url);

      debugLog("GetTokenPrice:pancakeswap:result", {
        status: pancakeResponse?.status,
        hasData: !!pancakeResponse?.data,
        dataType: typeof pancakeResponse?.data,
      });

      if (pancakeResponse.status === 200 && pancakeResponse.data && pancakeResponse.data.data) {
        debugLog("GetTokenPrice:pancakeswap:data", {
          tokenDataKeys:
            pancakeResponse.data.data && typeof pancakeResponse.data.data === "object"
              ? Object.keys(pancakeResponse.data.data)
              : null,
          tokenData: pancakeResponse.data.data,
        });
        const price = parseFloat(pancakeResponse.data.data.price);
        console.log("✅ GetTokenPrice: PancakeSwap success - Price:", price);
        debugLog("GetTokenPrice:pancakeswap:parsed_price", { price });
        return otherHelper.sendResponse(
          res,
          HTTP_STATUS.OK,
          true,
          {
            price: price || 0,
            priceChange24h: 0,
            volume24h: 0,
            lastUpdated: Date.now(),
            source: "pancakeswap",
          },
          null,
          null,
          null
        );
      }
    } catch (pancakeError) {
      console.log("PancakeSwap API error:", pancakeError.message);
      debugLog("GetTokenPrice:pancakeswap:error", {
        message: pancakeError?.message,
      });
    }

    // If both APIs fail, return a default price of 0 with a message
    // This allows the frontend to still display something
    console.log("⚠️ GetTokenPrice: Both APIs failed, returning default");
    debugLog("GetTokenPrice:fallback_default", {
      resolvedAddress: address,
      resolvedAddressLower: addressLower,
    });
    return otherHelper.sendResponse(
      res,
      HTTP_STATUS.OK,
      true,
      {
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        lastUpdated: Date.now(),
        source: "default",
        message: "Token price not available. This token may not be listed on price tracking services.",
      },
      null,
      "Token price not available",
      null
    );
  } catch (err) {
    debugLog("GetTokenPrice:unhandled_error", {
      message: err?.message,
      stack: err?.stack,
    });
    next(err);
  }
};

/**
 * Get token price history (24h, 7d, 30d)
 * @route GET /api/token/price-history
 * @description Get token price history
 * @access Public
 */
tokenController.GetTokenPriceHistory = async (req, res, next) => {
  try {
    const { tokenAddress, days = 7 } = req.query;
    const defaultTokenAddress = "0x739e81BCd49854d7BDF526302989f14A2E7994B2";
    const address = tokenAddress || defaultTokenAddress;

    try {
      // Use CoinGecko API for price history
      const interval = days <= 1 ? "hourly" : "daily";
      const url = `https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${address}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;
      const response = await makeRequest(url);

      if (response.status === 200 && response.data) {
        return otherHelper.sendResponse(
          res,
          HTTP_STATUS.OK,
          true,
          {
            prices: response.data.prices || [],
            marketCaps: response.data.market_caps || [],
            totalVolumes: response.data.total_volumes || [],
            days: parseInt(days),
            source: "coingecko",
          },
          null,
          null,
          null
        );
      }
    } catch (error) {
      console.log("Price history API error:", error.message);
      return otherHelper.sendResponse(
        res,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        false,
        null,
        null,
        "Unable to fetch price history at this time",
        null
      );
    }
  } catch (err) {
    console.error('❌ GetTokenPrice:FATAL_ERROR:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    next(err);
  }
};

/**
 * Get token transfers from Moralis API
 * @route GET /api/token/transfers
 * @description Get ERC20 token transfers from Moralis
 * @access Public
 */
tokenController.GetTokenTransfers = async (req, res, next) => {
  console.log("🚀 GetTokenTransfers: FUNCTION CALLED");
  console.log("📥 GetTokenTransfers: Request URL:", req.url);
  console.log("📥 GetTokenTransfers: Request Query:", req.query);
  
  try {
    const { tokenAddress, limit = 100, cursor = null } = req.query;
    
    // Default token address for cenx token on BSC
    const defaultTokenAddress = "0x739e81BCd49854d7BDF526302989f14A2E7994B2";
    const address = (tokenAddress || defaultTokenAddress).toLowerCase();
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImEzOTI4NTUwLTk3ZDMtNDZmNC1hOGZiLTBjZGJjOWRhNGNlYSIsIm9yZ0lkIjoiNDg5MDY1IiwidXNlcklkIjoiNTAzMTg2IiwidHlwZUlkIjoiNmEyZTNhZmQtNTZjMi00ZTczLWJhMzctMGYyYmU4N2NjNmU5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Njc3NjU0NDAsImV4cCI6NDkyMzUyNTQ0MH0.Lodp3U-K3joq4u_YSC1wijyy8jTIfxdLrG-3U34a3lU";
    
    console.log("🔍 GetTokenTransfers:request", {
      tokenAddress: address,
      limit,
      cursor: cursor ? "provided" : "none",
    });

    try {
      // Build Moralis API URL
      let url = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/transfers?chain=bsc&limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      console.log("📡 GetTokenTransfers:morals:fetch", { url: url.replace(MORALIS_API_KEY, "***") });

      const response = await makeRequest(url, {
        headers: {
          "accept": "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
      });

      console.log("✅ GetTokenTransfers:morals:result", {
        status: response?.status,
        hasData: !!response?.data,
        resultCount: response?.data?.result?.length || 0,
        hasCursor: !!response?.data?.cursor,
      });

      if (response.status === 200 && response.data) {
        const transfers = response.data.result || [];
        const formattedTransfers = transfers.map((transfer) => ({
          transactionHash: transfer.transaction_hash,
          blockNumber: transfer.block_number,
          blockTimestamp: transfer.block_timestamp,
          from: transfer.from_address,
          to: transfer.to_address,
          value: transfer.value,
          tokenAddress: transfer.token_address,
          tokenName: transfer.token_name,
          tokenSymbol: transfer.token_symbol,
          tokenDecimals: transfer.token_decimals,
          logIndex: transfer.log_index,
        }));

        console.log("✅ GetTokenTransfers: Returning", formattedTransfers.length, "transfers");

        return otherHelper.sendResponse(
          res,
          HTTP_STATUS.OK,
          true,
          {
            transfers: formattedTransfers,
            cursor: response.data.cursor || null,
            page: response.data.page || 1,
            pageSize: response.data.page_size || limit,
            total: response.data.total || formattedTransfers.length,
          },
          null,
          null,
          null
        );
      } else {
        // If API returns non-200, return empty transfers instead of error
        console.log("⚠️ GetTokenTransfers: Moralis API returned non-200 status:", response.status);
        return otherHelper.sendResponse(
          res,
          HTTP_STATUS.OK,
          true,
          {
            transfers: [],
            cursor: null,
            page: 1,
            pageSize: limit,
            total: 0,
            message: `Moralis API returned status ${response.status}`,
          },
          null,
          null,
          null
        );
      }
    } catch (moralisError) {
      console.error("❌ GetTokenTransfers:morals:error", {
        message: moralisError?.message,
        stack: moralisError?.stack,
      });
      
      // Return empty transfers instead of throwing error
      return otherHelper.sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        {
          transfers: [],
          cursor: null,
          page: 1,
          pageSize: limit,
          total: 0,
          message: moralisError?.message || "Failed to fetch transfers from Moralis API",
        },
        null,
        null,
        null
      );
    }
  } catch (err) {
    console.error('❌ GetTokenTransfers:FATAL_ERROR:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    next(err);
  }
};

module.exports = tokenController;

