# FlipperCalc - 8-bit Real Estate Analysis Tool

FlipperCalc is an 8-bit styled real estate analysis tool for house flippers that combines property data analysis with visual design insights to make smarter renovation decisions.

## Project Goal

The primary goal of FlipperCalc is to help real estate investors make data-driven decisions by:

1. **Analyzing Neighborhood Design Trends**: Using Google Street View API to visually analyze comparable properties in the target area and identify popular design features.

2. **Providing Market-Based Renovation Guidance**: Suggesting renovation budgets and design choices based on what's selling in the neighborhood.

3. **Calculating Precise ROI**: Combining purchase price, renovation costs, and expected ARV (based on actual comps) to provide accurate return on investment projections.

4. **Visualizing Renovation Potential**: Offering design recommendations that balance neighborhood trends with budget constraints.

## Key Features

- **Property Comparables Engine**: Fetches addresses of similar properties in the area using real estate data APIs
- **Street View Analysis**: Uses Google Street View API to capture and analyze design features of comparable homes
- **Design Trend Detection**: Identifies common exterior design elements in successful sales
- **ROI Calculator**: Provides comprehensive financial analysis for potential flips
- **Renovation Budget Optimizer**: Suggests how to allocate renovation funds for maximum return
- **Rental Income Estimator**: Calculates potential rental income and investment metrics for flipped properties
- **Solar Analysis Tool**: Determines if solar is a good option for properties and calculates potential savings
- **8-bit Retro UI**: Makes complex real estate analysis approachable and engaging

## Technical Implementation

- React frontend with 8-bit styled UI components
- Integration with property data APIs for comparable analysis
- Google Street View API for visual property assessment
- NREL Solar Resource Data API for solar analysis
- Rentcast API for rental market analysis
- Machine learning algorithms for design feature detection and analysis
- Data visualization for financial projections and design recommendations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google API key with Street View API enabled (for production version)
- Property data API access (for production version)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flipper-calc.git
   cd flipper-calc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Usage

### ROI Calculator
1. Enter property purchase price
2. Add estimated renovation costs
3. Input expected after-repair value (ARV)
4. View your potential return on investment

### Design Analysis
1. Enter property address
2. Choose your renovation budget
3. Receive design recommendations based on neighborhood trends
4. View potential value increase from recommended renovations

### Rental Analysis
1. Enter property details (address, bedrooms, bathrooms, etc.)
2. View estimated monthly rental income
3. See financial metrics like cap rate and net operating income
4. Compare with similar rental properties in the area

### Solar Analysis
1. Enter property location (latitude and longitude)
2. Specify roof area and electricity rate
3. View solar viability score and recommendations
4. See detailed financial analysis including payback period and ROI

## Browser Compatibility

FlipperCalc is designed to work on modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
