import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutCancel = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card p-5">
            <div className="text-danger mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
              </svg>
            </div>
            <h1 className="display-4">Payment Cancelled</h1>
            <p className="lead">Your payment was cancelled and you have not been charged.</p>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <div className="mt-4">
              <Link to="/credits" className="btn btn-primary">Try Again</Link>
              <Link to="/dashboard" className="btn btn-outline-secondary ms-2">Go to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
