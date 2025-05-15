import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CheckoutSuccess = () => {
  useEffect(() => {
    // You can add code here to refresh the user's credit balance
    // For example, dispatch an action to fetch the user's profile
  }, []);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card p-5">
            <div className="text-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <h1 className="display-4">Payment Successful!</h1>
            <p className="lead">Thank you for your purchase. Your credits have been added to your account.</p>
            <p>You can now use these credits to access our scraper service.</p>
            <div className="mt-4">
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
