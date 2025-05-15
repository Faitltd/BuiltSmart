-- Create tables for PostgreSQL database

-- Trades table
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Labor_Rates table
CREATE TABLE labor_rates (
  id SERIAL PRIMARY KEY,
  trade_id INTEGER REFERENCES trades(id),
  unit VARCHAR(20) NOT NULL, -- sq_ft, linear_ft, etc.
  rate DECIMAL(10,2) NOT NULL,
  region VARCHAR(100) -- for regional pricing variations
);

-- Product_Categories table
CREATE TABLE product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES product_categories(id) NULL -- for hierarchical categories
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100), -- ID from Home Depot/Lowes
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES product_categories(id),
  price DECIMAL(10,2),
  url TEXT,
  image_url TEXT,
  source VARCHAR(50), -- 'home_depot', 'lowes', etc.
  tier VARCHAR(20) -- 'good', 'better', 'best'
);

-- Insert some initial data

-- Trades
INSERT INTO trades (name, description) VALUES 
('Carpentry', 'Framing, trim work, and general woodworking'),
('Plumbing', 'Installation and repair of water systems'),
('Electrical', 'Installation and repair of electrical systems'),
('Painting', 'Interior and exterior painting'),
('Flooring', 'Installation of various flooring types'),
('Tiling', 'Installation of tile for floors, walls, and backsplashes'),
('Drywall', 'Installation and finishing of drywall'),
('HVAC', 'Heating, ventilation, and air conditioning');

-- Labor Rates
INSERT INTO labor_rates (trade_id, unit, rate, region) VALUES
(1, 'sq_ft', 5.50, 'National Average'),
(2, 'fixture', 85.00, 'National Average'),
(3, 'outlet', 75.00, 'National Average'),
(4, 'sq_ft', 3.75, 'National Average'),
(5, 'sq_ft', 4.25, 'National Average'),
(6, 'sq_ft', 12.00, 'National Average'),
(7, 'sq_ft', 2.50, 'National Average'),
(8, 'unit', 95.00, 'National Average');

-- Product Categories
INSERT INTO product_categories (name, parent_id) VALUES
('Building Materials', NULL),
('Plumbing', NULL),
('Electrical', NULL),
('Paint', NULL),
('Flooring', NULL),
('Kitchen', NULL),
('Bathroom', NULL),
('Lighting', NULL),
('Hardware', NULL);

-- Add subcategories
INSERT INTO product_categories (name, parent_id) VALUES
('Lumber', 1),
('Drywall', 1),
('Insulation', 1),
('Pipes & Fittings', 2),
('Faucets', 2),
('Toilets', 2),
('Sinks', 2),
('Wiring', 3),
('Outlets & Switches', 3),
('Panels & Breakers', 3),
('Interior Paint', 4),
('Exterior Paint', 4),
('Primers', 4),
('Hardwood', 5),
('Laminate', 5),
('Tile', 5),
('Vinyl', 5),
('Carpet', 5),
('Cabinets', 6),
('Countertops', 6),
('Backsplashes', 6),
('Appliances', 6),
('Vanities', 7),
('Showers', 7),
('Bathtubs', 7),
('Ceiling Lights', 8),
('Wall Lights', 8),
('Lamps', 8),
('Doors', 9),
('Windows', 9),
('Fasteners', 9);

-- Sample Products
INSERT INTO products (external_id, name, description, category_id, price, url, image_url, source, tier) VALUES
('HD123456', 'Premium Oak Hardwood Flooring', '3/4 inch solid oak, prefinished', 14, 7.99, 'https://example.com/oak-flooring', 'https://example.com/images/oak-flooring.jpg', 'home_depot', 'best'),
('HD789012', 'Standard Laminate Flooring', '12mm thickness with attached underlayment', 15, 2.49, 'https://example.com/laminate-flooring', 'https://example.com/images/laminate-flooring.jpg', 'home_depot', 'good'),
('LW345678', 'Ceramic Floor Tile', '12x12 inch glazed ceramic', 16, 1.89, 'https://example.com/ceramic-tile', 'https://example.com/images/ceramic-tile.jpg', 'lowes', 'better'),
('HD901234', 'Interior Latex Paint', 'Premium one-coat coverage, eggshell finish', 11, 32.98, 'https://example.com/latex-paint', 'https://example.com/images/latex-paint.jpg', 'home_depot', 'best'),
('LW567890', 'Kitchen Faucet', 'Pull-down sprayer, stainless steel finish', 5, 149.00, 'https://example.com/kitchen-faucet', 'https://example.com/images/kitchen-faucet.jpg', 'lowes', 'better'),
('HD234567', 'Bathroom Vanity', '36-inch, white with marble top', 23, 599.00, 'https://example.com/bathroom-vanity', 'https://example.com/images/bathroom-vanity.jpg', 'home_depot', 'best'),
('LW678901', 'Toilet', 'Elongated bowl, comfort height, white', 6, 189.00, 'https://example.com/toilet', 'https://example.com/images/toilet.jpg', 'lowes', 'better'),
('HD345678', 'Ceiling Fan with Light', '52-inch, brushed nickel finish', 26, 129.00, 'https://example.com/ceiling-fan', 'https://example.com/images/ceiling-fan.jpg', 'home_depot', 'good'),
('LW789012', 'Vinyl Plank Flooring', 'Waterproof, wood-look luxury vinyl', 17, 3.49, 'https://example.com/vinyl-plank', 'https://example.com/images/vinyl-plank.jpg', 'lowes', 'better'),
('HD456789', 'Kitchen Cabinet Set', 'Shaker style, maple, 10-piece set', 19, 2499.00, 'https://example.com/kitchen-cabinets', 'https://example.com/images/kitchen-cabinets.jpg', 'home_depot', 'best');
