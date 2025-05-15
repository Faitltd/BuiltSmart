import React, { useState, useEffect } from 'react';
import './DesignAnalysisPage.css';
import { geocodeAddress } from '../services/geocodingService';
import { analyzePropertyDesign } from '../services/designAnalysisService';

const DesignAnalysisPage = () => {
  const [formData, setFormData] = useState({
    address: '',
    propertyType: 'single-family',
    bedrooms: '3',
    bathrooms: '2',
    squareFeet: '',
    yearBuilt: '',
    currentStyle: 'traditional',
    budget: '',
    targetBuyer: 'families'
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [coordinates, setCoordinates] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);

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

    // Validate budget
    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || Number(formData.budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget amount';
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
      // Step 1: Geocode the address to get coordinates
      const geocodeResult = await geocodeAddress(formData.address);
      setCoordinates(geocodeResult);

      // Step 2: Analyze the property design using AI
      const analysisResult = await analyzePropertyDesign(
        geocodeResult.latitude,
        geocodeResult.longitude,
        formData.propertyType,
        formData.currentStyle,
        Number(formData.budget)
      );

      setDesignAnalysis(analysisResult);
      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error analyzing property:', error);
      setErrors({
        ...errors,
        general: 'An error occurred while analyzing the property. Please try again.'
      });
      setLoading(false);
    }
  };

  const designRecommendations = [
    {
      area: 'Kitchen',
      recommendations: [
        'Replace outdated cabinets with shaker style in white or light gray',
        'Install quartz countertops in a neutral tone',
        'Add a subway tile backsplash',
        'Update lighting fixtures to pendant lights',
        'Replace appliances with stainless steel'
      ],
      potentialValueIncrease: '$15,000 - $25,000'
    },
    {
      area: 'Bathrooms',
      recommendations: [
        'Install dual vanity in master bathroom',
        'Replace tub with walk-in shower in master',
        'Update fixtures to brushed nickel or matte black',
        'Add subway tile to shower walls',
        'Install luxury vinyl tile flooring'
      ],
      potentialValueIncrease: '$10,000 - $20,000'
    },
    {
      area: 'Living Areas',
      recommendations: [
        'Remove carpet and install luxury vinyl plank flooring',
        'Paint walls in neutral colors (Agreeable Gray, Alabaster)',
        'Update lighting fixtures',
        'Add recessed lighting',
        'Create open concept by removing non-load bearing walls'
      ],
      potentialValueIncrease: '$5,000 - $15,000'
    },
    {
      area: 'Exterior',
      recommendations: [
        'Repaint exterior in modern color scheme',
        'Replace front door',
        'Update landscaping with low-maintenance plants',
        'Add outdoor lighting',
        'Repair/replace driveway if cracked'
      ],
      potentialValueIncrease: '$8,000 - $12,000'
    }
  ];

  return (
    <div className="design-analysis-page">
      <div className="page-header">
        <h1>Design Analysis Tool</h1>
        <p>Analyze your property's design potential and get renovation recommendations</p>
      </div>

      {!submitted ? (
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
                <label htmlFor="propertyType">Property Type</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                >
                  <option value="single-family">Single Family</option>
                  <option value="multi-family">Multi-Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>

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
                  <option value="5+">5+</option>
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
                  <option value="3+">3+</option>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="currentStyle">Current Style</label>
                <select
                  id="currentStyle"
                  name="currentStyle"
                  value={formData.currentStyle}
                  onChange={handleChange}
                >
                  <option value="traditional">Traditional</option>
                  <option value="colonial">Colonial</option>
                  <option value="ranch">Ranch</option>
                  <option value="craftsman">Craftsman</option>
                  <option value="contemporary">Contemporary</option>
                  <option value="mid-century">Mid-Century</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget">Renovation Budget</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className={errors.budget ? 'error-input' : ''}
                />
                {errors.budget && <div className="error-message">{errors.budget}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="targetBuyer">Target Buyer</label>
                <select
                  id="targetBuyer"
                  name="targetBuyer"
                  value={formData.targetBuyer}
                  onChange={handleChange}
                >
                  <option value="first-time">First-time Buyers</option>
                  <option value="families">Families</option>
                  <option value="luxury">Luxury Buyers</option>
                  <option value="retirees">Retirees</option>
                  <option value="investors">Investors</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Design Potential'}
            </button>
          </form>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>AI Design Analysis Results</h2>
            <p>Based on your property at {formData.address}</p>
          </div>

          {/* Street View Images Section */}
          <div className="street-view-container">
            <h3>Property Views</h3>
            <div className="street-view-images">
              {designAnalysis && designAnalysis.streetViewImages && designAnalysis.streetViewImages.map((image, index) => (
                <div className="street-view-image-card" key={index}>
                  <img src={image.url} alt={`Property view ${image.angle}°`} />
                  <p>{image.angle}° View</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Detected Design Elements */}
          <div className="design-elements-container">
            <h3>AI-Detected Design Elements</h3>
            <div className="design-elements-list">
              {designAnalysis && designAnalysis.designElements && designAnalysis.designElements.map((element, index) => (
                <div className="design-element" key={index}>
                  <span className="element-name">{element.name}</span>
                  <div className="confidence-bar-container">
                    <div
                      className="confidence-bar"
                      style={{ width: `${element.confidence * 100}%` }}
                    ></div>
                    <span className="confidence-value">{Math.round(element.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-box">
            <h3>Summary</h3>
            <p>Your {formData.squareFeet} sq ft {formData.propertyType} has excellent potential for a modern renovation that would appeal to {formData.targetBuyer}. With a budget of ${parseInt(formData.budget).toLocaleString()}, we recommend focusing on the following areas to maximize your return on investment.</p>
            <div className="potential-value">
              <span>Potential Value Increase:</span>
              <span className="value">
                {designAnalysis && designAnalysis.potentialValueIncrease
                  ? designAnalysis.potentialValueIncrease.formattedRange
                  : `$${Math.round(formData.budget * 1.5).toLocaleString()} - $${Math.round(formData.budget * 2.2).toLocaleString()}`}
              </span>
            </div>
          </div>

          <div className="recommendations-container">
            <h3>AI-Powered Renovation Recommendations</h3>

            {designAnalysis && designAnalysis.recommendations
              ? designAnalysis.recommendations.map((area, index) => (
                <div className="recommendation-area" key={index}>
                  <h4>{area.area}</h4>
                  <ul>
                    {area.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                  <div className="recommendation-details">
                    <div className="estimated-cost">
                      <span>Estimated Cost:</span>
                      <span className="value">${area.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="value-increase">
                      <span>Potential Value Increase:</span>
                      <span className="value">{area.potentialValueIncrease}</span>
                    </div>
                  </div>
                </div>
              ))
              : designRecommendations.map((area, index) => (
                <div className="recommendation-area" key={index}>
                  <h4>{area.area}</h4>
                  <ul>
                    {area.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                  <div className="value-increase">
                    <span>Potential Value Increase:</span>
                    <span className="value">{area.potentialValueIncrease}</span>
                  </div>
                </div>
              ))
            }
          </div>

          <button className="reset-button" onClick={() => {
            setSubmitted(false);
            setDesignAnalysis(null);
            setCoordinates(null);
          }}>
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default DesignAnalysisPage;