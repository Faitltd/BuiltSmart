import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ROICalculatorPage.css';

const ROICalculatorPage = () => {
  const [formData, setFormData] = useState({
    purchasePrice: '',
    closingCosts: '',
    repairCosts: '',
    holdingCosts: '',
    afterRepairValue: '',
    sellingCosts: ''
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setFormData({
      ...formData,
      [name]: numericValue
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

    // Validate purchase price
    if (!formData.purchasePrice) {
      newErrors.purchasePrice = 'Purchase price is required';
    } else if (parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    // Validate after repair value
    if (!formData.afterRepairValue) {
      newErrors.afterRepairValue = 'After repair value is required';
    } else if (parseFloat(formData.afterRepairValue) <= 0) {
      newErrors.afterRepairValue = 'After repair value must be greater than 0';
    }

    // Validate repair costs
    if (!formData.repairCosts) {
      newErrors.repairCosts = 'Repair costs are required';
    } else if (parseFloat(formData.repairCosts) < 0) {
      newErrors.repairCosts = 'Repair costs cannot be negative';
    }

    // Validate other fields to ensure they're not negative
    if (formData.closingCosts && parseFloat(formData.closingCosts) < 0) {
      newErrors.closingCosts = 'Closing costs cannot be negative';
    }

    if (formData.holdingCosts && parseFloat(formData.holdingCosts) < 0) {
      newErrors.holdingCosts = 'Holding costs cannot be negative';
    }

    if (formData.sellingCosts && parseFloat(formData.sellingCosts) < 0) {
      newErrors.sellingCosts = 'Selling costs cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateROI = () => {
    // Convert string values to numbers
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const closing = parseFloat(formData.closingCosts) || 0;
    const repairs = parseFloat(formData.repairCosts) || 0;
    const holding = parseFloat(formData.holdingCosts) || 0;
    const arv = parseFloat(formData.afterRepairValue) || 0;
    const selling = parseFloat(formData.sellingCosts) || 0;

    // Calculate total investment
    const totalInvestment = purchase + closing + repairs + holding;

    // Calculate net profit
    const netProfit = arv - totalInvestment - selling;

    // Calculate ROI percentage
    const roi = (netProfit / totalInvestment) * 100;

    // Calculate profit margin
    const profitMargin = (netProfit / arv) * 100;

    // Calculate 70% rule value
    const seventyRuleValue = (arv * 0.7) - repairs;

    return {
      totalInvestment,
      netProfit,
      roi,
      profitMargin,
      seventyRuleValue,
      maxPurchasePrice: seventyRuleValue,
      purchasePriceDifference: purchase - seventyRuleValue
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
      const calculatedResults = calculateROI();
      setResults(calculatedResults);
      setLoading(false);
    }, 1000);
  };

  const resetCalculator = () => {
    setFormData({
      purchasePrice: '',
      closingCosts: '',
      repairCosts: '',
      holdingCosts: '',
      afterRepairValue: '',
      sellingCosts: ''
    });
    setResults(null);
    setErrors({});
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="roi-calculator-page">
      <div className="page-header">
        <h1>ROI Calculator</h1>
        <p>Calculate the potential return on investment for your house flip</p>
      </div>

      <div className="calculator-container">
        {!results ? (
          <form className="roi-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="purchasePrice">Purchase Price</label>
              <div className="input-with-icon">
                <span className="currency-icon">$</span>
                <input
                  type="text"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="e.g. 200000"
                  className={errors.purchasePrice ? 'error-input' : ''}
                />
              </div>
              {errors.purchasePrice && <div className="error-message">{errors.purchasePrice}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="closingCosts">Closing Costs</label>
                <div className="input-with-icon">
                  <span className="currency-icon">$</span>
                  <input
                    type="text"
                    id="closingCosts"
                    name="closingCosts"
                    value={formData.closingCosts}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="repairCosts">Repair Costs</label>
                <div className="input-with-icon">
                  <span className="currency-icon">$</span>
                  <input
                    type="text"
                    id="repairCosts"
                    name="repairCosts"
                    value={formData.repairCosts}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    className={errors.repairCosts ? 'error-input' : ''}
                  />
                </div>
                {errors.repairCosts && <div className="error-message">{errors.repairCosts}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="holdingCosts">Holding Costs</label>
                <div className="input-with-icon">
                  <span className="currency-icon">$</span>
                  <input
                    type="text"
                    id="holdingCosts"
                    name="holdingCosts"
                    value={formData.holdingCosts}
                    onChange={handleChange}
                    placeholder="e.g. 10000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="afterRepairValue">After Repair Value (ARV)</label>
                <div className="input-with-icon">
                  <span className="currency-icon">$</span>
                  <input
                    type="text"
                    id="afterRepairValue"
                    name="afterRepairValue"
                    value={formData.afterRepairValue}
                    onChange={handleChange}
                    placeholder="e.g. 300000"
                    className={errors.afterRepairValue ? 'error-input' : ''}
                  />
                </div>
                {errors.afterRepairValue && <div className="error-message">{errors.afterRepairValue}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sellingCosts">Selling Costs</label>
              <div className="input-with-icon">
                <span className="currency-icon">$</span>
                <input
                  type="text"
                  id="sellingCosts"
                  name="sellingCosts"
                  value={formData.sellingCosts}
                  onChange={handleChange}
                  placeholder="e.g. 18000"
                  required
                />
              </div>
            </div>

            <button type="submit" className="calculate-button" disabled={loading}>
              {loading ? (
                <div className="loading-pixels">
                  <div className="pixel"></div>
                  <div className="pixel"></div>
                  <div className="pixel"></div>
                </div>
              ) : (
                'Calculate ROI'
              )}
            </button>
          </form>
        ) : (
          <div className="results-container">
            <h2>ROI Analysis Results</h2>

            <div className="results-summary">
              <div className="result-card profit">
                <h3>Net Profit</h3>
                <div className="result-value">
                  {formatCurrency(results.netProfit)}
                </div>
                <div className="result-label">
                  {results.netProfit > 0 ? 'Profit' : 'Loss'}
                </div>
              </div>

              <div className="result-card roi">
                <h3>ROI</h3>
                <div className="result-value">
                  {results.roi.toFixed(2)}%
                </div>
                <div className="result-label">
                  Return on Investment
                </div>
              </div>

              <div className="result-card margin">
                <h3>Profit Margin</h3>
                <div className="result-value">
                  {results.profitMargin.toFixed(2)}%
                </div>
                <div className="result-label">
                  Of Sale Price
                </div>
              </div>
            </div>

            <div className="detailed-results">
              <div className="result-section">
                <h3>Investment Breakdown</h3>
                <div className="result-row">
                  <span>Purchase Price:</span>
                  <span>{formatCurrency(parseFloat(formData.purchasePrice))}</span>
                </div>
                <div className="result-row">
                  <span>Closing Costs:</span>
                  <span>{formatCurrency(parseFloat(formData.closingCosts))}</span>
                </div>
                <div className="result-row">
                  <span>Repair Costs:</span>
                  <span>{formatCurrency(parseFloat(formData.repairCosts))}</span>
                </div>
                <div className="result-row">
                  <span>Holding Costs:</span>
                  <span>{formatCurrency(parseFloat(formData.holdingCosts))}</span>
                </div>
                <div className="result-row total">
                  <span>Total Investment:</span>
                  <span>{formatCurrency(results.totalInvestment)}</span>
                </div>
              </div>

              <div className="result-section">
                <h3>Sale Breakdown</h3>
                <div className="result-row">
                  <span>After Repair Value:</span>
                  <span>{formatCurrency(parseFloat(formData.afterRepairValue))}</span>
                </div>
                <div className="result-row">
                  <span>Selling Costs:</span>
                  <span>{formatCurrency(parseFloat(formData.sellingCosts))}</span>
                </div>
                <div className="result-row total">
                  <span>Net Sale Proceeds:</span>
                  <span>{formatCurrency(parseFloat(formData.afterRepairValue) - parseFloat(formData.sellingCosts))}</span>
                </div>
              </div>

              <div className="result-section">
                <h3>70% Rule Analysis</h3>
                <div className="result-row">
                  <span>Maximum Purchase Price:</span>
                  <span>{formatCurrency(results.maxPurchasePrice)}</span>
                </div>
                <div className="result-row">
                  <span>Your Purchase Price:</span>
                  <span>{formatCurrency(parseFloat(formData.purchasePrice))}</span>
                </div>
                <div className={`result-row total ${results.purchasePriceDifference <= 0 ? 'positive' : 'negative'}`}>
                  <span>Difference:</span>
                  <span>
                    {results.purchasePriceDifference <= 0
                      ? `${formatCurrency(Math.abs(results.purchasePriceDifference))} under max`
                      : `${formatCurrency(results.purchasePriceDifference)} over max`}
                  </span>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button className="reset-button" onClick={resetCalculator}>
                New Calculation
              </button>

              <Link to="/rental-analysis" className="next-step-button">
                Analyze Rental Potential
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ROICalculatorPage;