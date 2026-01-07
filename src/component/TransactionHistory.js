import React, { useState, useEffect } from "react";
import { getTransactionHistory } from "../utils/api";
import moment from "moment";

function TransactionHistory({ walletAddress }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const fetchTransactions = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getTransactionHistory(walletAddress, limit, skip);
      
      if (response.success !== false && response.data) {
        setTransactions(response.data.transactions || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        throw new Error(response.message || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to load transaction history");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [walletAddress, skip]);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return "0";
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    if (num === 0) return "0";
    if (num < 0.0001) return num.toExponential(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      stake: "Stake",
      unstake: "Unstake",
      emergencyUnstake: "Emergency Unstake",
      harvest: "Harvest",
      transfer: "Transfer",
      approve: "Approve",
    };
    return labels[type] || type || "Transaction";
  };

  const getTransactionTypeClass = (type) => {
    const classes = {
      stake: "type-stake",
      unstake: "type-unstake",
      emergencyUnstake: "type-emergency",
      harvest: "type-harvest",
      transfer: "type-transfer",
      approve: "type-approve",
    };
    return classes[type] || "type-default";
  };

  const handlePrevPage = () => {
    if (skip >= limit) {
      setSkip(skip - limit);
    }
  };

  const handleNextPage = () => {
    if (skip + limit < totalCount) {
      setSkip(skip + limit);
    }
  };

  if (!walletAddress) {
    return (
      <div className="transaction-history">
        <h3>Transaction History</h3>
        <div className="no-wallet">
          <p>Please connect your wallet to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h3>Transaction History</h3>
        {totalCount > 0 && (
          <span className="total-count">
            {totalCount} transaction{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchTransactions} className="btn btn-primary">
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
        </div>
      ) : (
        <>
          <div className="transactions-table">
            <div className="table-header">
              <div className="table-cell">Type</div>
              <div className="table-cell">From</div>
              <div className="table-cell">To</div>
              <div className="table-cell">Amount</div>
              <div className="table-cell">Date</div>
              <div className="table-cell">Hash</div>
            </div>

            {transactions.map((tx, index) => (
              <div key={tx._id || index} className="table-row">
                <div className="table-cell">
                  <span className={`tx-type ${getTransactionTypeClass(tx.type)}`}>
                    {getTransactionTypeLabel(tx.type)}
                  </span>
                </div>
                <div className="table-cell">
                  <span className="address">{formatAddress(tx.from)}</span>
                </div>
                <div className="table-cell">
                  <span className="address">{formatAddress(tx.to)}</span>
                </div>
                <div className="table-cell">
                  {tx.amount ? formatAmount(tx.amount) : "-"}
                </div>
                <div className="table-cell">
                  {tx.createdAt
                    ? moment(tx.createdAt).format("MM/DD/YYYY HH:mm")
                    : "-"}
                </div>
                <div className="table-cell">
                  <a
                    href={`https://bscscan.com/tx/${tx.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {formatAddress(tx.transactionHash)}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {totalCount > limit && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={skip === 0}
                className="btn btn-sm"
              >
                Previous
              </button>
              <span className="page-info">
                Showing {skip + 1} - {Math.min(skip + limit, totalCount)} of{" "}
                {totalCount}
              </span>
              <button
                onClick={handleNextPage}
                disabled={skip + limit >= totalCount}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .transaction-history {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .history-header h3 {
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
        .no-wallet {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .error-state p {
          color: #e74c3c;
          margin-bottom: 15px;
        }
        
        .transactions-table {
          overflow-x: auto;
        }
        
        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 120px 150px 1fr;
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
        
        .tx-type {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 0.85em;
          font-weight: 600;
        }
        
        .type-stake {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .type-unstake {
          background: #fff3e0;
          color: #f57c00;
        }
        
        .type-emergency {
          background: #ffebee;
          color: #c62828;
        }
        
        .type-harvest {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .type-transfer {
          background: #f3e5f5;
          color: #7b1fa2;
        }
        
        .type-approve {
          background: #fff9c4;
          color: #f57f17;
        }
        
        .address {
          font-family: monospace;
          color: #666;
        }
        
        .tx-link {
          color: #667eea;
          text-decoration: none;
          font-family: monospace;
          transition: color 0.2s;
        }
        
        .tx-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }
        
        .page-info {
          color: #666;
          font-size: 0.9em;
        }
        
        .btn {
          padding: 8px 16px;
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
        
        .btn-sm {
          background: #667eea;
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
            grid-template-columns: 100px 80px 80px 100px 120px 100px;
            font-size: 0.8em;
            gap: 8px;
          }
          
          .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default TransactionHistory;

