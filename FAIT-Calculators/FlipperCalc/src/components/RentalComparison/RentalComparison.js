import React, { useState } from 'react';
import './RentalComparison.css';

/**
 * RentalComparison component for comparing multiple rental properties
 * 
 * @param {Object} props - Component props
 * @param {Array} props.properties - Array of rental property data
 * @param {Function} props.onClose - Function to call when closing the comparison
 */
const RentalComparison = ({ properties, onClose }) => {
  const [sortField, setSortField] = useState('rent');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Sort properties based on current sort field and direction
  const sortedProperties = [...properties].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle nested properties like financials.capRate
    if (sortField.includes('.')) {
      const [parent, child] = sortField.split('.');
      aValue = a[parent][child];
      bValue = b[parent][child];
    }
    
    // Convert to numbers for numeric fields
    if (typeof aValue === 'string' && !isNaN(aValue)) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    // Sort logic
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Handle sort click
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get sort indicator
  const getSortIndicator = (field) => {
    if (field === sortField) {
      return sortDirection === 'asc' ? '↑' : '↓';
    }
    return '';
  };
  
  return (
    <div className="rental-comparison">
      <div className="comparison-header">
        <h2>Rental Property Comparison</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('address')}>
                Address {getSortIndicator('address')}
              </th>
              <th onClick={() => handleSort('estimatedRent')}>
                Monthly Rent {getSortIndicator('estimatedRent')}
              </th>
              <th onClick={() => handleSort('bedrooms')}>
                Beds {getSortIndicator('bedrooms')}
              </th>
              <th onClick={() => handleSort('bathrooms')}>
                Baths {getSortIndicator('bathrooms')}
              </th>
              <th onClick={() => handleSort('squareFeet')}>
                Sq Ft {getSortIndicator('squareFeet')}
              </th>
              <th onClick={() => handleSort('financials.capRate')}>
                Cap Rate {getSortIndicator('financials.capRate')}
              </th>
              <th onClick={() => handleSort('financials.netOperatingIncome')}>
                NOI {getSortIndicator('financials.netOperatingIncome')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProperties.map((property, index) => (
              <tr key={index}>
                <td>{property.address}</td>
                <td>{formatCurrency(property.estimatedRent)}</td>
                <td>{property.bedrooms}</td>
                <td>{property.bathrooms}</td>
                <td>{property.squareFeet}</td>
                <td>{property.financials.capRate}%</td>
                <td>{formatCurrency(property.financials.netOperatingIncome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="comparison-summary">
        <h3>Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Average Rent:</span>
            <span className="stat-value">
              {formatCurrency(
                properties.reduce((sum, prop) => sum + prop.estimatedRent, 0) / properties.length
              )}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Average Cap Rate:</span>
            <span className="stat-value">
              {(
                properties.reduce((sum, prop) => sum + Number(prop.financials.capRate), 0) / properties.length
              ).toFixed(2)}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Best Value:</span>
            <span className="stat-value">
              {properties.sort((a, b) => 
                (a.estimatedRent / a.squareFeet) - (b.estimatedRent / b.squareFeet)
              )[0].address}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalComparison;
