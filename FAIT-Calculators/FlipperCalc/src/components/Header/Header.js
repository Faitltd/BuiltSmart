import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-icon">🏠</span>
            FlipperCalc
          </Link>
        </div>

        <button className="mobile-menu-button" onClick={toggleMenu}>
          ☰
        </button>

        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          {menuOpen && (
            <button className="close-menu" onClick={closeMenu}>
              ✕
            </button>
          )}
          <ul>
            <li><Link to="/" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/design-analysis" onClick={closeMenu}>Design Analysis</Link></li>
            <li><Link to="/roi-calculator" onClick={closeMenu}>ROI Calculator</Link></li>
            <li><Link to="/rental-analysis" onClick={closeMenu}>Rental Analysis</Link></li>
            <li><Link to="/solar-analysis" onClick={closeMenu}>Solar Analysis</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;