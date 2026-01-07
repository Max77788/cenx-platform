import React, { useState, useEffect, useCallback } from "react";
import { getTokenPrice } from "../utils/api";
import moment from "moment";

function TokenPrice({ tokenAddress }) {
  const [priceData, setPriceData] = useState({
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    lastUpdated: null,
    loading: true,
    error: null,
  });

  const fetchPrice = useCallback(async () => {
    try {
      setPriceData((prev) => ({ ...prev, loading: true, error: null }));

      console.log("tokenAddress", tokenAddress);

      const response = await getTokenPrice(tokenAddress);
      
      // Handle the response format: { success: true, data: {...} }
      if (response && response.success !== false && response.data) {
        const priceData = response.data;
        // If price is 0 and there's a message, show it as a warning but still display
        if (priceData.price === 0 && priceData.message) {
          setPriceData({
            price: 0,
            priceChange24h: priceData.priceChange24h || 0,
            volume24h: priceData.volume24h || 0,
            lastUpdated: priceData.lastUpdated || Date.now(),
            loading: false,
            error: priceData.message, // Show as error/warning message
          });
        } else {
          setPriceData({
            price: priceData.price || 0,
            priceChange24h: priceData.priceChange24h || 0,
            volume24h: priceData.volume24h || 0,
            lastUpdated: priceData.lastUpdated || Date.now(),
            loading: false,
            error: null,
          });
        }
      } else if (response && response.msg) {
        // Handle error message from backend
        throw new Error(response.msg);
      } else {
        throw new Error("Failed to fetch price");
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setPriceData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load price. Please check your connection.",
      }));
    }
  }, [tokenAddress]);

  useEffect(() => {
    fetchPrice();
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const formatPrice = (price) => {
    if (price === 0) return "$0.00";
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume === 0) return "$0";
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className="token-price-widget">
      <div className="price-header">
        <h4>cenx Token Price</h4>
        {priceData.lastUpdated && (
          <span className="last-updated">
            Updated {moment(priceData.lastUpdated * 1000).fromNow()}
          </span>
        )}
      </div>
      
      {priceData.loading ? (
        <div className="price-loading">
          <p>Loading price...</p>
        </div>
      ) : priceData.error ? (
        <div className="price-error">
          <p style={{ marginBottom: priceData.price === 0 ? "15px" : "10px" }}>{priceData.error}</p>
          {priceData.price === 0 ? (
            <div className="price-content">
              <div className="current-price">
                <span className="price-label">Current Price</span>
                <h2 className="price-value">$0.00</h2>
                <p style={{ fontSize: "0.85em", marginTop: "10px", opacity: 0.9 }}>
                  Price data not available
                </p>
              </div>
            </div>
          ) : (
            <button onClick={fetchPrice} className="btn btn-sm btn-primary">
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="price-content">
          <div className="current-price">
            <span className="price-label">Current Price</span>
            <h2 className="price-value">{formatPrice(priceData.price)}</h2>
          </div>
          
          <div className="price-stats">
            <div className="stat-item">
              <span className="stat-label">24h Change</span>
              <span
                className={`stat-value ${
                  priceData.priceChange24h >= 0 ? "positive" : "negative"
                }`}
              >
                {priceData.priceChange24h >= 0 ? "+" : ""}
                {priceData.priceChange24h.toFixed(2)}%
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">{formatVolume(priceData.volume24h)}</span>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .token-price-widget {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 25px;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .price-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .price-header h4 {
          margin: 0;
          font-size: 1.2em;
          font-weight: 600;
        }
        
        .last-updated {
          font-size: 0.85em;
          opacity: 0.8;
        }
        
        .price-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .current-price {
          text-align: center;
        }
        
        .price-label {
          display: block;
          font-size: 0.9em;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        
        .price-value {
          margin: 0;
          font-size: 2.5em;
          font-weight: bold;
        }
        
        .price-stats {
          display: flex;
          justify-content: space-around;
          gap: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        
        .stat-label {
          font-size: 0.85em;
          opacity: 0.8;
        }
        
        .stat-value {
          font-size: 1.3em;
          font-weight: 600;
        }
        
        .stat-value.positive {
          color: #4ade80;
        }
        
        .stat-value.negative {
          color: #f87171;
        }
        
        .price-loading,
        .price-error {
          text-align: center;
          padding: 20px;
        }
        
        .price-error p {
          margin-bottom: 10px;
          color: #f87171;
        }
        
        .btn-sm {
          padding: 8px 16px;
          font-size: 0.9em;
        }
        
        .btn-primary {
          background: white;
          color: #667eea;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

export default TokenPrice;

