import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import ROICalculatorPage from './pages/ROICalculatorPage';
import DesignAnalysisPage from './pages/DesignAnalysisPage';
import RentalAnalysisPage from './pages/RentalAnalysisPage';
import SolarAnalysisPage from './pages/SolarAnalysisPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo-link">
              <h1 className="logo">FlipperCalc</h1>
            </Link>
            <div className="header-subtitle">8-bit Real Estate Analysis Tool</div>
          </div>
          <nav className="main-nav">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="/design-analysis" className="nav-link">Design Analysis</Link></li>
              <li><Link to="/roi-calculator" className="nav-link">ROI Calculator</Link></li>
              <li><Link to="/rental-analysis" className="nav-link">Rental Analysis</Link></li>
              <li><Link to="/solar-analysis" className="nav-link">Solar Analysis</Link></li>
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/design-analysis" element={<DesignAnalysisPage />} />
            <Route path="/roi-calculator" element={<ROICalculatorPage />} />
            <Route path="/rental-analysis" element={<RentalAnalysisPage />} />
            <Route path="/solar-analysis" element={<SolarAnalysisPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <p>© 2025 FlipperCalc. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;