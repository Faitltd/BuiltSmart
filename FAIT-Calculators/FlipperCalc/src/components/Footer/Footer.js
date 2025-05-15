import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>FlipperCalc</h3>
          <p>The 8-bit real estate analysis tool for house flippers. Calculate ROI, analyze designs, and make data-driven decisions.</p>
          <div className="social-links">
            <a href="https://twitter.com" className="social-link" target="_blank" rel="noopener noreferrer">𝕏</a>
            <a href="https://facebook.com" className="social-link" target="_blank" rel="noopener noreferrer">f</a>
            <a href="https://instagram.com" className="social-link" target="_blank" rel="noopener noreferrer">📷</a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Tools</h3>
          <ul className="footer-links">
            <li><Link to="/design-analysis">Design Analysis</Link></li>
            <li><Link to="/roi-calculator">ROI Calculator</Link></li>
            <li><Link to="/rental-analysis">Rental Analysis</Link></li>
            <li><Link to="/solar-analysis">Solar Analysis</Link></li>
            <li><span style={{ color: '#aaa' }}>Comps Engine (Coming Soon)</span></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Resources</h3>
          <ul className="footer-links">
            {/* Using buttons styled as links for placeholders */}
            <li><button className="footer-button">Blog</button></li>
            <li><button className="footer-button">Guides</button></li>
            <li><button className="footer-button">FAQ</button></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <ul className="footer-links">
            <li><a href="mailto:info@flippercalc.com">info@flippercalc.com</a></li>
            <li><a href="tel:+15551234567">(555) 123-4567</a></li>
            <li><button className="footer-button">Support</button></li>
          </ul>
        </div>

        <div className="copyright">
          &copy; {currentYear} FlipperCalc. Made with <span className="pixel-heart">♥</span> in 8-bit.
        </div>
      </div>
    </footer>
  );
};

export default Footer;