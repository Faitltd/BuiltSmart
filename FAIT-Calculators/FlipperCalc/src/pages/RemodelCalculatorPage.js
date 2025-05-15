import React, { useState } from 'react';
import './RemodelCalculatorPage.css';

const RemodelCalculatorPage = () => {
  const [formData, setFormData] = useState({
    propertyType: 'single-family',
    squareFeet: '',
    kitchenRemodel: false,
    kitchenQuality: 'mid-range',
    bathroomRemodel: false,
    bathroomQuality: 'mid-range',
    bathroomCount: '1',
    flooringRemodel: false,
    flooringType: 'laminate',
    flooringArea: '',
    paintInterior: false,
    paintExterior: false,
    roofReplacement: false,
    windowReplacement: false,
    windowCount: '',
    hvacReplacement: false,
    deckAddition: false,
    deckSize: '',
    landscaping: false,
    landscapingBudget: ''
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.squareFeet) {
      newErrors.squareFeet = 'Square footage is required';
    } else if (isNaN(formData.squareFeet) || Number(formData.squareFeet) <= 0) {
      newErrors.squareFeet = 'Please enter a valid square footage';
    }

    if (formData.flooringRemodel && !formData.flooringArea) {
      newErrors.flooringArea = 'Flooring area is required';
    } else if (formData.flooringRemodel && (isNaN(formData.flooringArea) || Number(formData.flooringArea) <= 0)) {
      newErrors.flooringArea = 'Please enter a valid flooring area';
    }

    if (formData.windowReplacement && !formData.windowCount) {
      newErrors.windowCount = 'Window count is required';
    } else if (formData.windowReplacement && (isNaN(formData.windowCount) || Number(formData.windowCount) <= 0)) {
      newErrors.windowCount = 'Please enter a valid window count';
    }

    if (formData.deckAddition && !formData.deckSize) {
      newErrors.deckSize = 'Deck size is required';
    } else if (formData.deckAddition && (isNaN(formData.deckSize) || Number(formData.deckSize) <= 0)) {
      newErrors.deckSize = 'Please enter a valid deck size';
    }

    if (formData.landscaping && !formData.landscapingBudget) {
      newErrors.landscapingBudget = 'Landscaping budget is required';
    } else if (formData.landscaping && (isNaN(formData.landscapingBudget) || Number(formData.landscapingBudget) <= 0)) {
      newErrors.landscapingBudget = 'Please enter a valid landscaping budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCosts = () => {
    // Base costs for different remodel items (these are example values)
    const costs = {
      kitchen: {
        'economy': 10000,
        'mid-range': 25000,
        'high-end': 50000
      },
      bathroom: {
        'economy': 5000,
        'mid-range': 15000,
        'high-end': 30000
      },
      flooring: {
        'laminate': 7,
        'hardwood': 12,
        'tile': 15,
        'carpet': 5
      },
      paint: {
        interior: 3.5, // per sq ft
        exterior: 4.5  // per sq ft
      },
      roof: 8000,
      window: 600, // per window
      hvac: 7500,
      deck: 35, // per sq ft
      landscaping: 1 // multiplier on budget
    };

    let totalCost = 0;
    const lineItems = [];

    // Kitchen remodel
    if (formData.kitchenRemodel) {
      const kitchenCost = costs.kitchen[formData.kitchenQuality];
      totalCost += kitchenCost;
      lineItems.push({
        item: `Kitchen Remodel (${formData.kitchenQuality})`,
        cost: kitchenCost
      });
    }

    // Bathroom remodel
    if (formData.bathroomRemodel) {
      const bathroomCount = Number(formData.bathroomCount);
      const bathroomCost = costs.bathroom[formData.bathroomQuality] * bathroomCount;
      totalCost += bathroomCost;
      lineItems.push({
        item: `Bathroom Remodel (${formData.bathroomQuality}, ${bathroomCount} ${bathroomCount > 1 ? 'bathrooms' : 'bathroom'})`,
        cost: bathroomCost
      });
    }

    // Flooring
    if (formData.flooringRemodel) {
      const flooringArea = Number(formData.flooringArea);
      const flooringCost = costs.flooring[formData.flooringType] * flooringArea;
      totalCost += flooringCost;
      lineItems.push({
        item: `Flooring (${formData.flooringType}, ${flooringArea} sq ft)`,
        cost: flooringCost
      });
    }

    // Interior paint
    if (formData.paintInterior) {
      const squareFeet = Number(formData.squareFeet);
      const paintCost = costs.paint.interior * squareFeet;
      totalCost += paintCost;
      lineItems.push({
        item: 'Interior Painting',
        cost: paintCost
      });
    }

    // Exterior paint
    if (formData.paintExterior) {
      const squareFeet = Number(formData.squareFeet);
      // Estimate exterior wall area based on square footage
      const exteriorArea = Math.sqrt(squareFeet) * 4 * 10; // Rough estimate
      const paintCost = costs.paint.exterior * exteriorArea;
      totalCost += paintCost;
      lineItems.push({
        item: 'Exterior Painting',
        cost: paintCost
      });
    }

    // Roof replacement
    if (formData.roofReplacement) {
      const squareFeet = Number(formData.squareFeet);
      // Estimate roof area based on square footage
      const roofArea = squareFeet * 1.2; // Rough estimate
      const roofCost = costs.roof * (roofArea / 1000);
      totalCost += roofCost;
      lineItems.push({
        item: 'Roof Replacement',
        cost: roofCost
      });
    }

    // Window replacement
    if (formData.windowReplacement) {
      const windowCount = Number(formData.windowCount);
      const windowCost = costs.window * windowCount;
      totalCost += windowCost;
      lineItems.push({
        item: `Window Replacement (${windowCount} windows)`,
        cost: windowCost
      });
    }

    // HVAC replacement
    if (formData.hvacReplacement) {
      const hvacCost = costs.hvac;
      totalCost += hvacCost;
      lineItems.push({
        item: 'HVAC Replacement',
        cost: hvacCost
      });
    }

    // Deck addition
    if (formData.deckAddition) {
      const deckSize = Number(formData.deckSize);
      const deckCost = costs.deck * deckSize;
      totalCost += deckCost;
      lineItems.push({
        item: `Deck Addition (${deckSize} sq ft)`,
        cost: deckCost
      });
    }

    // Landscaping
    if (formData.landscaping) {
      const landscapingBudget = Number(formData.landscapingBudget);
      const landscapingCost = landscapingBudget * costs.landscaping;
      totalCost += landscapingCost;
      lineItems.push({
        item: 'Landscaping',
        cost: landscapingCost
      });
    }

    // Add contingency
    const contingency = totalCost * 0.15;
    lineItems.push({
      item: 'Contingency (15%)',
      cost: contingency
    });
    totalCost += contingency;

    // Calculate potential value increase (ROI)
    const valueIncrease = totalCost * 1.5;

    return {
      lineItems,
      totalCost,
      valueIncrease,
      roi: (valueIncrease - totalCost) / totalCost * 100
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const calculatedResults = calculateCosts();
      setResults(calculatedResults);
      setLoading(false);
    }, 1000);
  };

  const resetCalculator = () => {
    setFormData({
      propertyType: 'single-family',
      squareFeet: '',
      kitchenRemodel: false,
      kitchenQuality: 'mid-range',
      bathroomRemodel: false,
      bathroomQuality: 'mid-range',
      bathroomCount: '1',
      flooringRemodel: false,
      flooringType: 'laminate',
      flooringArea: '',
      paintInterior: false,
      paintExterior: false,
      roofReplacement: false,
      windowReplacement: false,
      windowCount: '',
      hvacReplacement: false,
      deckAddition: false,
      deckSize: '',
      landscaping: false,
      landscapingBudget: ''
    });
    setResults(null);
    setErrors({});
  };

  return (
    <div className="remodel-calculator-page">
      <h1>Remodel Cost Calculator</h1>
      <p className="page-description">Estimate the cost of your renovation projects and see potential ROI</p>

      {!results ? (
        <form className="remodel-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Property Information</h2>
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
            </div>
          </div>

          <div className="form-section">
            <h2>Kitchen & Bathroom</h2>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="kitchenRemodel"
                  name="kitchenRemodel"
                  checked={formData.kitchenRemodel}
                  onChange={handleChange}
                />
                <label htmlFor="kitchenRemodel">Kitchen Remodel</label>
              </div>
              {formData.kitchenRemodel && (
                <div className="form-group">
                  <label htmlFor="kitchenQuality">Quality Level</label>
                  <select
                    id="kitchenQuality"
                    name="kitchenQuality"
                    value={formData.kitchenQuality}
                    onChange={handleChange}
                  >
                    <option value="economy">Economy</option>
                    <option value="mid-range">Mid-Range</option>
                    <option value="high-end">High-End</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="bathroomRemodel"
                  name="bathroomRemodel"
                  checked={formData.bathroomRemodel}
                  onChange={handleChange}
                />
                <label htmlFor="bathroomRemodel">Bathroom Remodel</label>
              </div>
              {formData.bathroomRemodel && (
                <>
                  <div className="form-group">
                    <label htmlFor="bathroomQuality">Quality Level</label>
                    <select
                      id="bathroomQuality"
                      name="bathroomQuality"
                      value={formData.bathroomQuality}
                      onChange={handleChange}
                    >
                      <option value="economy">Economy</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="high-end">High-End</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bathroomCount">Number of Bathrooms</label>
                    <select
                      id="bathroomCount"
                      name="bathroomCount"
                      value={formData.bathroomCount}
                      onChange={handleChange}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Flooring & Paint</h2>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="flooringRemodel"
                  name="flooringRemodel"
                  checked={formData.flooringRemodel}
                  onChange={handleChange}
                />
                <label htmlFor="flooringRemodel">New Flooring</label>
              </div>
              {formData.flooringRemodel && (
                <>
                  <div className="form-group">
                    <label htmlFor="flooringType">Flooring Type</label>
                    <select
                      id="flooringType"
                      name="flooringType"
                      value={formData.flooringType}
                      onChange={handleChange}
                    >
                      <option value="laminate">Laminate</option>
                      <option value="hardwood">Hardwood</option>
                      <option value="tile">Tile</option>
                      <option value="carpet">Carpet</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="flooringArea">Area (sq ft)</label>
                    <input
                      type="number"
                      id="flooringArea"
                      name="flooringArea"
                      value={formData.flooringArea}
                      onChange={handleChange}
                      placeholder="e.g. 1000"
                      className={errors.flooringArea ? 'error-input' : ''}
                    />
                    {errors.flooringArea && <div className="error-message">{errors.flooringArea}</div>}
                  </div>
                </>
              )}
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="paintInterior"
                  name="paintInterior"
                  checked={formData.paintInterior}
                  onChange={handleChange}
                />
                <label htmlFor="paintInterior">Interior Painting</label>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="paintExterior"
                  name="paintExterior"
                  checked={formData.paintExterior}
                  onChange={handleChange}
                />
                <label htmlFor="paintExterior">Exterior Painting</label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Major Improvements</h2>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="roofReplacement"
                  name="roofReplacement"
                  checked={formData.roofReplacement}
                  onChange={handleChange}
                />
                <label htmlFor="roofReplacement">Roof Replacement</label>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="hvacReplacement"
                  name="hvacReplacement"
                  checked={formData.hvacReplacement}
                  onChange={handleChange}
                />
                <label htmlFor="hvacReplacement">HVAC Replacement</label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="windowReplacement"
                  name="windowReplacement"
                  checked={formData.windowReplacement}
                  onChange={handleChange}
                />
                <label htmlFor="windowReplacement">Window Replacement</label>
              </div>
              {formData.windowReplacement && (
                <div className="form-group">
                  <label htmlFor="windowCount">Number of Windows</label>
                  <input
                    type="number"
                    id="windowCount"
                    name="windowCount"
                    value={formData.windowCount}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                    className={errors.windowCount ? 'error-input' : ''}
                  />
                  {errors.windowCount && <div className="error-message">{errors.windowCount}</div>}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Outdoor Improvements</h2>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="deckAddition"
                  name="deckAddition"
                  checked={formData.deckAddition}
                  onChange={handleChange}
                />
                <label htmlFor="deckAddition">Deck Addition</label>
              </div>
              {formData.deckAddition && (
                <div className="form-group">
                  <label htmlFor="deckSize">Deck Size (sq ft)</label>
                  <input
                    type="number"
                    id="deckSize"
                    name="deckSize"
                    value={formData.deckSize}
                    onChange={handleChange}
                    placeholder="e.g. 200"
                    className={errors.deckSize ? 'error-input' : ''}
                  />
                  {errors.deckSize && <div className="error-message">{errors.deckSize}</div>}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="landscaping"
                  name="landscaping"
                  checked={formData.landscaping}
                  onChange={handleChange}
                />
                <label htmlFor="landscaping">Landscaping</label>
              </div>
              {formData.landscaping && (
                <div className="form-group">
                  <label htmlFor="landscapingBudget">Landscaping Budget ($)</label>
                  <input
                    type="number"
                    id="landscapingBudget"
                    name="landscapingBudget"
                    value={formData.landscapingBudget}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    className={errors.landscapingBudget ? 'error-input' : ''}
                  />
                  {errors.landscapingBudget && <div className="error-message">{errors.landscapingBudget}</div>}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Remodel Costs'}
          </button>
        </form>
      ) : (
        <div className="results-container">
          <h2>Remodel Cost Estimate</h2>
          
          <div className="cost-summary">
            <div className="total-cost">
              <h3>Total Estimated Cost</h3>
              <div className="cost-value">${Math.round(results.totalCost).toLocaleString()}</div>
            </div>
            
            <div className="roi-summary">
              <div className="roi-item">
                <span>Potential Value Increase:</span>
                <span className="value">${Math.round(results.valueIncrease).toLocaleString()}</span>
              </div>
              <div className="roi-item">
                <span>Return on Investment:</span>
                <span className="value">{Math.round(results.roi)}%</span>
              </div>
            </div>
          </div>
          
          <div className="cost-breakdown">
            <h3>Cost Breakdown</h3>
            <table className="cost-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                {results.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item}</td>
                    <td>${Math.round(item.cost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="button-group">
            <button className="reset-button" onClick={resetCalculator}>
              New Calculation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemodelCalculatorPage;
