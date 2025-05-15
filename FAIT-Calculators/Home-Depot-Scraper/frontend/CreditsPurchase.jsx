import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key
const stripePromise = loadStripe('pk_test_your_publishable_key');

// Production API URL
const API_URL = 'https://scraper-webhook-qlkvtyydjq-uc.a.run.app';

const CreditsPurchase = ({ onSuccess }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch plans from the API
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/plans`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.plans) {
          // Sort plans by price
          const sortedPlans = data.plans.sort((a, b) => a.price_usd - b.price_usd);
          setPlans(sortedPlans);
        } else {
          throw new Error('Failed to fetch plans');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePurchase = async (planId) => {
    try {
      const stripe = await stripePromise;

      // Create a checkout session
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          base_url: window.location.origin,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = await response.json();

      if (session.id) {
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading plans...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="credits-purchase">
      <h2 className="mb-4">Purchase Credits</h2>

      <div className="row">
        {plans.map((plan) => (
          <div className="col-md-4 mb-4" key={plan.id}>
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">{plan.name}</h5>
              </div>
              <div className="card-body d-flex flex-column">
                <h2 className="card-price">${plan.price_usd.toFixed(2)}</h2>
                <p className="card-text">{plan.description}</p>
                <ul className="list-unstyled mt-3 mb-4">
                  <li><strong>{plan.credits}</strong> credits</li>
                  <li>~{plan.credits} product scrapes</li>
                  <li>~{Math.floor(plan.credits / 5)} search queries</li>
                  <li>~{Math.floor(plan.credits / 10)} category scrapes</li>
                </ul>
                <button
                  className="btn btn-primary mt-auto"
                  onClick={() => handlePurchase(plan.id)}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Credit Usage</h5>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Credits</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product Scrape</td>
                <td>1</td>
                <td>Get detailed information about a single product</td>
              </tr>
              <tr>
                <td>Search Query</td>
                <td>5</td>
                <td>Get search results for a specific query</td>
              </tr>
              <tr>
                <td>Category Scrape</td>
                <td>10</td>
                <td>Get all products in a specific category</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditsPurchase;
