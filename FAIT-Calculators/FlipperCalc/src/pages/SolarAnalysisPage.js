import React, { useState } from 'react';
import { getSolarResourceData, calculateSolarPotential, getSolarViability } from '../services/solarService';
import { geocodeAddress } from '../services/geocodingService';
import './SolarAnalysisPage.css';

const SolarAnalysisPage = () => {
  const [formData, setFormData] = useState({
    address: '',
    roofArea: '500',
    electricityRate: '0.13',
    propertyType: 'single-family'
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [geocodeResults, setGeocodeResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Property address is required';
    }

    // Validate roof area
    if (!formData.roofArea) {
      newErrors.roofArea = 'Roof area is required';
    } else if (isNaN(formData.roofArea) || Number(formData.roofArea) <= 0) {
      newErrors.roofArea = 'Please enter a valid roof area';
    }

    // Validate electricity rate
    if (!formData.electricityRate) {
      newErrors.electricityRate = 'Electricity rate is required';
    } else if (isNaN(formData.electricityRate) || Number(formData.electricityRate) <= 0) {
      newErrors.electricityRate = 'Please enter a valid electricity rate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // First, geocode the address to get coordinates
      const geocoded = await geocodeAddress(formData.address);
      setGeocodeResults(geocoded);

      // Get solar resource data using the geocoded coordinates
      const solarData = await getSolarResourceData({
        latitude: geocoded.latitude,
        longitude: geocoded.longitude
      });

      // Calculate solar potential
      const potentialData = calculateSolarPotential(solarData, {
        roofArea: Number(formData.roofArea),
        electricityRate: Number(formData.electricityRate)
      });

      // Get viability rating
      const viabilityData = getSolarViability(solarData, potentialData);

      // Set results
      setResults({
        solarData,
        potentialData,
        viabilityData,
        formattedAddress: geocoded.formattedAddress
      });
    } catch (error) {
      console.error('Error analyzing solar potential:', error);

      // Determine if it's a geocoding error or solar data error
      if (error.message && error.message.includes('geocode')) {
        setErrors({
          ...errors,
          address: 'Could not find this address. Please check and try again.',
          api: 'Failed to geocode address. Please enter a valid address.'
        });
      } else {
        setErrors({
          ...errors,
          api: 'Failed to analyze solar potential. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      address: '',
      roofArea: '500',
      electricityRate: '0.13',
      propertyType: 'single-family'
    });
    setResults(null);
    setErrors({});
    setGeocodeResults(null);
  };

  // Helper function to get color based on viability score
  const getViabilityColor = (score) => {
    if (score >= 80) return '#00e436'; // Excellent - Green
    if (score >= 60) return '#29adff'; // Good - Blue
    if (score >= 40) return '#ffec27'; // Moderate - Yellow
    return '#ff004d'; // Low - Red
  };

  return (
    <div className="solar-analysis-page">
      <div className="page-header">
        <h1>Solar Analysis</h1>
        <p>Determine if solar is a good option for your flipped property</p>
      </div>

      {!results ? (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="address">Property Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full property address"
                className={errors.address ? 'error-input' : ''}
              />
              {errors.address && <div className="error-message">{errors.address}</div>}
              <p className="helper-text">Enter the complete address including city and state</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="roofArea">Available Roof Area (sq ft)</label>
                <input
                  type="number"
                  id="roofArea"
                  name="roofArea"
                  value={formData.roofArea}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className={errors.roofArea ? 'error-input' : ''}
                />
                {errors.roofArea && <div className="error-message">{errors.roofArea}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="electricityRate">Electricity Rate ($/kWh)</label>
                <input
                  type="number"
                  id="electricityRate"
                  name="electricityRate"
                  value={formData.electricityRate}
                  onChange={handleChange}
                  placeholder="e.g. 0.13"
                  step="0.01"
                  className={errors.electricityRate ? 'error-input' : ''}
                />
                {errors.electricityRate && <div className="error-message">{errors.electricityRate}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
              >
                <option value="single-family">Single Family</option>
                <option value="multi-family">Multi-Family</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            {errors.api && <div className="error-message api-error">{errors.api}</div>}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <div className="loading-pixels">
                  <div className="pixel"></div>
                  <div className="pixel"></div>
                  <div className="pixel"></div>
                </div>
              ) : (
                'Analyze Solar Potential'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>Solar Analysis Results</h2>
            <p>For property at {results.formattedAddress || formData.address}</p>
            <p className="coordinates">Coordinates: {results.solarData.location.latitude.toFixed(6)}, {results.solarData.location.longitude.toFixed(6)}</p>
          </div>

          <div className="viability-card" style={{ borderColor: getViabilityColor(results.viabilityData.viabilityScore) }}>
            <h3>Solar Viability</h3>
            <div className="viability-score">
              <div className="score-display">
                <span className="score-value" style={{ color: getViabilityColor(results.viabilityData.viabilityScore) }}>
                  {results.viabilityData.viabilityScore}
                </span>
                <span className="score-label">/100</span>
              </div>
              <div className="rating-display" style={{ color: getViabilityColor(results.viabilityData.viabilityScore) }}>
                {results.viabilityData.viabilityRating}
              </div>
            </div>
          </div>

          <div className="solar-metrics">
            <h3>Solar Resource Data</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Avg. Solar Radiation</h4>
                <div className="metric-value">{formatNumber(results.solarData.annualData.avgLatTilt)} kWh/m²/day</div>
                <div className="metric-description">Annual average at optimal tilt</div>
              </div>

              <div className="metric-card">
                <h4>System Size</h4>
                <div className="metric-value">{formatNumber(results.potentialData.systemSizeKW, 1)} kW</div>
                <div className="metric-description">Based on available roof area</div>
              </div>

              <div className="metric-card">
                <h4>Annual Production</h4>
                <div className="metric-value">{formatNumber(results.potentialData.annualEnergyProduction, 0)} kWh</div>
                <div className="metric-description">Estimated yearly energy generation</div>
              </div>

              <div className="metric-card">
                <h4>Annual Savings</h4>
                <div className="metric-value">{formatCurrency(results.potentialData.annualSavings)}</div>
                <div className="metric-description">Based on current electricity rates</div>
              </div>
            </div>
          </div>

          <div className="financial-metrics">
            <h3>Financial Analysis</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Installation Cost</h4>
                <div className="metric-value">{formatCurrency(results.potentialData.installationCost)}</div>
                <div className="metric-description">Before incentives</div>
              </div>

              <div className="metric-card">
                <h4>Federal Tax Credit</h4>
                <div className="metric-value">{formatCurrency(results.potentialData.federalTaxCredit)}</div>
                <div className="metric-description">26% of installation cost</div>
              </div>

              <div className="metric-card">
                <h4>Net Cost</h4>
                <div className="metric-value">{formatCurrency(results.potentialData.netCost)}</div>
                <div className="metric-description">After incentives</div>
              </div>

              <div className="metric-card">
                <h4>Payback Period</h4>
                <div className="metric-value">{formatNumber(results.potentialData.paybackPeriod, 1)} years</div>
                <div className="metric-description">Time to recoup investment</div>
              </div>

              <div className="metric-card">
                <h4>25-Year Savings</h4>
                <div className="metric-value">{formatCurrency(results.potentialData.totalSavings)}</div>
                <div className="metric-description">Lifetime energy savings</div>
              </div>

              <div className="metric-card">
                <h4>Return on Investment</h4>
                <div className="metric-value">{formatNumber(results.potentialData.roi, 0)}%</div>
                <div className="metric-description">25-year ROI</div>
              </div>
            </div>
          </div>

          <div className="recommendations">
            <h3>Recommendations</h3>
            <ul className="recommendations-list">
              {results.viabilityData.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>

          <div className="button-group">
            <button className="reset-button" onClick={resetForm}>
              New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarAnalysisPage;
