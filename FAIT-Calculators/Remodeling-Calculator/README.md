# Remodeling Calculator Components

This folder contains reusable React components for remodeling cost estimation.

## Components

### RemodelingCalculator

A comprehensive remodeling calculator that allows users to:
- Select room types and quality levels
- Enter square footage or dimensions
- Add multiple rooms to an estimate
- View detailed descriptions of each quality level
- Update quality levels after adding rooms
- See a total cost estimate

### SimpleRemodelingCalculator

A simplified version of the remodeling calculator that:
- Provides a more streamlined interface
- Automatically adds calculated rooms to a list
- Shows a running total of all estimates
- Allows removal of items from the estimate

## Usage

```jsx
import { RemodelingCalculator, SimpleRemodelingCalculator } from './remodeling-calculator';

function App() {
  return (
    <div>
      <h1>Full Remodeling Calculator</h1>
      <RemodelingCalculator />
      
      <h1>Simple Remodeling Calculator</h1>
      <SimpleRemodelingCalculator />
    </div>
  );
}
```

## Dependencies

These components require:
- React
- Lucide React for icons
- TailwindCSS for styling

## Customization

You can customize the cost rates and descriptors in each component to match your specific pricing and service offerings.
