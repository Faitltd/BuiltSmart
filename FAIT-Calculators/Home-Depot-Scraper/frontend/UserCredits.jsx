import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Replace with your actual API URL
const API_URL = 'https://scraper-api-[hash].us-central1.run.app';

const UserCredits = ({ apiKey }) => {
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user credits and transactions
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch credits
        const creditsResponse = await fetch(`${API_URL}/api/user/credits`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        
        if (!creditsResponse.ok) {
          throw new Error(`HTTP error! status: ${creditsResponse.status}`);
        }
        
        const creditsData = await creditsResponse.json();
        
        if (creditsData.status === 'success' && creditsData.data) {
          setCredits(creditsData.data.credits || 0);
        } else {
          throw new Error('Failed to fetch credits');
        }
        
        // Fetch transactions
        const transactionsResponse = await fetch(`${API_URL}/api/user/transactions`, {
          headers: {
            'X-API-Key': apiKey
          }
        });
        
        if (!transactionsResponse.ok) {
          throw new Error(`HTTP error! status: ${transactionsResponse.status}`);
        }
        
        const transactionsData = await transactionsResponse.json();
        
        if (transactionsData.status === 'success' && transactionsData.transactions) {
          setTransactions(transactionsData.transactions);
        } else {
          throw new Error('Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (apiKey) {
      fetchUserData();
    }
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="alert alert-warning" role="alert">
        Please log in to view your credits.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="user-credits">
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Credits</h5>
            </div>
            <div className="card-body text-center">
              <div className="display-4 text-primary mb-3">{credits}</div>
              <p className="text-muted">Available credits</p>
              <Link to="/credits/purchase" className="btn btn-primary">Buy More Credits</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Transaction History</h5>
            </div>
            <div className="card-body">
              {transactions.length === 0 ? (
                <p className="text-muted">No transactions found</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const date = transaction.created_at ? 
                          new Date(transaction.created_at._seconds * 1000).toLocaleString() : 
                          'N/A';
                        
                        return (
                          <tr key={transaction.id}>
                            <td>{date}</td>
                            <td>{transaction.type === 'purchase' ? 'Purchase' : 'Usage'}</td>
                            <td className={transaction.amount >= 0 ? 'text-success' : 'text-danger'}>
                              {transaction.amount}
                            </td>
                            <td>{transaction.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCredits;
