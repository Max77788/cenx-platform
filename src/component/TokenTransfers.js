import React, { useState, useEffect, useCallback } from "react";
import { getTokenTransfers } from "../utils/api";
import moment from "moment";

function TokenTransfers({ tokenAddress }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchTransfers = useCallback(async (nextCursor = null) => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getTokenTransfers(tokenAddress, limit, nextCursor);
      
      if (response && response.success !== false && response.data) {
        const newTransfers = response.data.transfers || [];
        if (nextCursor) {
          // Append to existing transfers for pagination
          setTransfers((prev) => [...prev, ...newTransfers]);
        } else {
          // Replace transfers for new search
          setTransfers(newTransfers);
        }
        setCursor(response.data.cursor || null);
        setHasMore(!!response.data.cursor && newTransfers.length === limit);
      } else {
        throw new Error(response?.msg || "Failed to fetch transfers");
      }
    } catch (err) {
      console.error("Error fetching token transfers:", err);
      setError(err.message || "Failed to load token transfers");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, limit]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (value, decimals = 18) => {
    if (!value) return "0";
    try {
      const divisor = Math.pow(10, parseInt(decimals) || 18);
      const amount = parseFloat(value) / divisor;
      if (amount === 0) return "0";
      if (amount < 0.0001) return amount.toExponential(2);
      return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch (e) {
      return value;
    }
  };

  const handleLoadMore = () => {
    if (cursor && !loading) {
      fetchTransfers(cursor);
    }
  };

  if (!tokenAddress) {
    return (
      <div className="token-transfers">
        <h3>Token Transfers</h3>
        <div className="no-token">
          <p>Token address is required to view transfers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-transfers">
      <div className="transfers-header">
        <h3>Token Transfers</h3>
        {transfers.length > 0 && (
          <span className="total-count">
            {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && transfers.length === 0 ? (
        <div className="loading-state">
          <p>Loading transfers...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => fetchTransfers()} className="btn btn-primary">
            Retry
          </button>
        </div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <p>No transfers found</p>
        </div>
      ) : (
        <>
          <div className="transfers-table">
            <div className="table-header">
              <div className="table-cell">From</div>
              <div className="table-cell">To</div>
              <div className="table-cell">Amount</div>
              <div className="table-cell">Date</div>
              <div className="table-cell">Transaction</div>
            </div>

            {transfers.map((transfer, index) => (
              <div key={`${transfer.transactionHash}-${transfer.logIndex}-${index}`} className="table-row">
                <div className="table-cell">
                  <a
                    href={`https://bscscan.com/address/${transfer.from}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-link"
                  >
                    {formatAddress(transfer.from)}
                  </a>
                </div>
                <div className="table-cell">
                  <a
                    href={`https://bscscan.com/address/${transfer.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-link"
                  >
                    {formatAddress(transfer.to)}
                  </a>
                </div>
                <div className="table-cell">
                  {formatAmount(transfer.value, transfer.tokenDecimals)} {transfer.tokenSymbol || "TOKEN"}
                </div>
                <div className="table-cell">
                  {transfer.blockTimestamp
                    ? moment(transfer.blockTimestamp).format("MM/DD/YYYY HH:mm")
                    : "-"}
                </div>
                <div className="table-cell">
                  <a
                    href={`https://bscscan.com/tx/${transfer.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {formatAddress(transfer.transactionHash)}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .token-transfers {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .transfers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .transfers-header h3 {
          margin: 0;
          font-size: 1.5em;
          color: #333;
        }
        
        .total-count {
          color: #666;
          font-size: 0.9em;
        }
        
        .loading-state,
        .error-state,
        .empty-state,
        .no-token {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .error-state p {
          color: #e74c3c;
          margin-bottom: 15px;
        }
        
        .transfers-table {
          overflow-x: auto;
        }
        
        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 150px 150px 1fr;
          gap: 15px;
          padding: 12px 0;
          align-items: center;
        }
        
        .table-header {
          font-weight: 600;
          color: #666;
          border-bottom: 2px solid #f0f0f0;
          font-size: 0.9em;
        }
        
        .table-row {
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }
        
        .table-row:hover {
          background: #f9f9f9;
        }
        
        .table-cell {
          font-size: 0.9em;
          color: #333;
        }
        
        .address-link,
        .tx-link {
          color: #667eea;
          text-decoration: none;
          font-family: monospace;
          transition: color 0.2s;
        }
        
        .address-link:hover,
        .tx-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .load-more {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.9em;
          transition: all 0.3s;
        }
        
        .btn-primary {
          background: linear-gradient(to right, #3867d0 20%, #2dbec9);
          color: white;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 80px 80px 100px 120px 100px;
            font-size: 0.8em;
            gap: 8px;
          }
          
          .transfers-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default TokenTransfers;

