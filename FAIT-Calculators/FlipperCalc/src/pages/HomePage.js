import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>FlipperCalc</h1>
          <p className="subtitle">The 8-bit Real Estate Analysis Tool for House Flippers</p>
          <Link to="/roi-calculator" className="cta-button">Calculate ROI</Link>
        </div>
      </section>

      <section className="features">
        <h2>Tools & Features</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Design Analysis</h3>
            <p>Analyze property designs and get renovation recommendations to maximize your property's value.</p>
            <Link to="/design-analysis" className="feature-link">Try It Now</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>ROI Calculator</h3>
            <p>Calculate potential return on investment for your flip with our detailed financial analysis tool.</p>
            <Link to="/roi-calculator" className="feature-link">Try It Now</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Rental Analysis</h3>
            <p>Estimate potential rental income for your flipped property and calculate key investment metrics.</p>
            <Link to="/rental-analysis" className="feature-link">Try It Now</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">☀️</div>
            <h3>Solar Analysis</h3>
            <p>Determine if solar is a good option for your property and calculate potential savings and ROI.</p>
            <Link to="/solar-analysis" className="feature-link">Try It Now</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Comps Engine</h3>
            <p>Find comparable properties in your target area to accurately estimate after-repair value.</p>
            <div className="coming-soon">Coming Soon</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;