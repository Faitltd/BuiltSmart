import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRentalEstimate } from '../services/rentcastService';
import RentalComparison from '../components/RentalComparison/RentalComparison';
import './RentalAnalysisPage.css';

const RentalAnalysisPage = () => {
  const [formData, setFormData] = useState({
    address: '',
    bedrooms: '3',
    bathrooms: '2',
    squareFeet: '',
    propertyType: 'single-family',
    yearBuilt: '',
    includeUtilities: false
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedProperties, setSavedProperties] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Load saved properties from localStorage on component mount
  useEffect(() => {
    const savedPropertiesJson = localStorage.getItem('savedRentalProperties');
    if (savedPropertiesJson) {
      try {
        const parsedProperties = JSON.parse(savedPropertiesJson);
        setSavedProperties(parsedProperties);
      } catch (error) {
        console.error('Error parsing saved properties:', error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
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
      newErrors.address = 'Address is required';
    }

    // Validate square feet
    if (!formData.squareFeet) {
      newErrors.squareFeet = 'Square footage is required';
    } else if (isNaN(formData.squareFeet) || Number(formData.squareFeet) <= 0) {
      newErrors.squareFeet = 'Please enter a valid square footage';
    }

    // Validate year built
    if (formData.yearBuilt) {
      const currentYear = new Date().getFullYear();
      const yearBuilt = Number(formData.yearBuilt);

      if (isNaN(yearBuilt) || yearBuilt < 1800 || yearBuilt > currentYear) {
        newErrors.yearBuilt = 'Please enter a valid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchRentalEstimate = async () => {
    // Use the rentcastService to get rental estimates
    return await getRentalEstimate(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const rentalData = await fetchRentalEstimate();
      setResults(rentalData);
    } catch (error) {
      console.error('Error fetching rental estimate:', error);
      setErrors({
        ...errors,
        api: 'Failed to fetch rental estimate. Please try again.'
      });
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

  const resetForm = () => {
    setFormData({
      address: '',
      bedrooms: '3',
      bathrooms: '2',
      squareFeet: '',
      propertyType: 'single-family',
      yearBuilt: '',
      includeUtilities: false
    });
    setResults(null);
    setErrors({});
  };

  // Save current property to localStorage
  const saveProperty = () => {
    if (!results) return;

    // Create a property object with all necessary data
    const propertyToSave = {
      id: Date.now(), // Use timestamp as unique ID
      address: results.address,
      estimatedRent: results.estimatedRent,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      squareFeet: formData.squareFeet,
      propertyType: formData.propertyType,
      yearBuilt: formData.yearBuilt,
      financials: results.financials,
      savedDate: new Date().toISOString()
    };

    // Add to saved properties
    const updatedProperties = [...savedProperties, propertyToSave];
    setSavedProperties(updatedProperties);

    // Save to localStorage
    localStorage.setItem('savedRentalProperties', JSON.stringify(updatedProperties));

    // Show confirmation
    alert(`Property at ${results.address} saved for comparison!`);
  };

  // Remove a property from saved properties
  const removeProperty = (propertyId) => {
    const updatedProperties = savedProperties.filter(prop => prop.id !== propertyId);
    setSavedProperties(updatedProperties);
    localStorage.setItem('savedRentalProperties', JSON.stringify(updatedProperties));
  };

  // Toggle comparison view
  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  return (
    <div className="rental-analysis-page">
      <div className="page-header">
        <h1>Rental Analysis</h1>
        <p>Estimate potential rental income for your flipped property</p>
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
                className={errors.address ? 'error-input' : ''}
              />
              {errors.address && <div className="error-message">{errors.address}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bedrooms">Bedrooms</label>
                <select
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bathrooms">Bathrooms</label>
                <select
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                >
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                  <option value="3.5">3.5</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="squareFeet">Square Feet</label>
                <input
                  type="number"
                  id="squareFeet"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                  className={errors.squareFeet ? 'error-input' : ''}
                />
                {errors.squareFeet && <div className="error-message">{errors.squareFeet}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="yearBuilt">Year Built</label>
                <input
                  type="number"
                  id="yearBuilt"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  placeholder="e.g. 1985"
                  className={errors.yearBuilt ? 'error-input' : ''}
                />
                {errors.yearBuilt && <div className="error-message">{errors.yearBuilt}</div>}
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
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="includeUtilities"
                  checked={formData.includeUtilities}
                  onChange={handleChange}
                />
                Include utilities in rent estimate
              </label>
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
                'Analyze Rental Potential'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>Rental Analysis Results</h2>
            <p>For property at {results.address}</p>
          </div>

          <div className="rent-estimate-card">
            <h3>Estimated Monthly Rent</h3>
            <div className="rent-estimate">
              <span className="rent-amount">{formatCurrency(results.estimatedRent)}</span>
              <span className="rent-range">
                Range: {formatCurrency(results.rentRangeLow)} - {formatCurrency(results.rentRangeHigh)}
              </span>
            </div>
            <div className="confidence-level">
              Confidence: <span className={`confidence-${results.confidence}`}>{results.confidence}</span>
            </div>
          </div>

          <div className="financial-metrics">
            <h3>Financial Analysis</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Annual Rental Income</h4>
                <div className="metric-value">{formatCurrency(results.financials.annualRent)}</div>
              </div>

              <div className="metric-card">
                <h4>Estimated Expenses</h4>
                <div className="metric-value">{formatCurrency(results.financials.estimatedExpenses)}</div>
              </div>

              <div className="metric-card">
                <h4>Net Operating Income</h4>
                <div className="metric-value">{formatCurrency(results.financials.netOperatingIncome)}</div>
              </div>

              <div className="metric-card">
                <h4>Cap Rate</h4>
                <div className="metric-value">{results.financials.capRate}%</div>
              </div>
            </div>
          </div>

          <div className="comparable-properties">
            <h3>Comparable Rental Properties</h3>
            <div className="comps-grid">
              {results.comparableProperties.map((property, index) => (
                <div className="comp-card" key={index}>
                  <h4>{property.address}</h4>
                  <p className="comp-distance">{property.distance} away</p>
                  <div className="comp-details">
                    <p>{property.bedrooms} bed / {property.bathrooms} bath</p>
                    <p>{property.squareFeet} sq ft</p>
                    <p className="comp-rent">{formatCurrency(property.rent)}/month</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button className="reset-button" onClick={resetForm}>
              New Analysis
            </button>

            <Link to="/solar-analysis" className="next-step-button">
              Analyze Solar Potential
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalAnalysisPage;
