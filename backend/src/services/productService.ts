import pool from '../database/postgres/connection';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Search for products
export const searchProducts = async (
  query: string,
  source?: string,
  category_id?: number,
  tier?: string
): Promise<any[]> => {
  try {
    let sqlQuery = `
      SELECT p.*, pc.name as category_name 
      FROM products p
      JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.name ILIKE $1
    `;
    
    const params: any[] = [`%${query}%`];
    let paramIndex = 2;
    
    if (source) {
      sqlQuery += ` AND p.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }
    
    if (category_id) {
      sqlQuery += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }
    
    if (tier) {
      sqlQuery += ` AND p.tier = $${paramIndex}`;
      params.push(tier);
      paramIndex++;
    }
    
    sqlQuery += ' ORDER BY p.price ASC';
    
    const result = await pool.query(sqlQuery, params);
    return result.rows;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Get product details by ID
export const getProductDetails = async (id: string): Promise<any> => {
  try {
    const result = await pool.query(
      `SELECT p.*, pc.name as category_name 
       FROM products p
       JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting product details:', error);
    throw error;
  }
};

// Get product by URL
export const getProductByUrl = async (url: string): Promise<any> => {
  try {
    // First check if we already have this product in our database
    const result = await pool.query(
      `SELECT p.*, pc.name as category_name 
       FROM products p
       JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.url = $1`,
      [url]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // If not in database, we would normally scrape the product details
    // For this implementation, we'll simulate scraping with a placeholder
    
    // Determine source from URL
    let source = 'unknown';
    if (url.includes('homedepot')) {
      source = 'home_depot';
    } else if (url.includes('lowes')) {
      source = 'lowes';
    }
    
    // In a real implementation, this would call a scraper service
    // For now, return a placeholder product
    return {
      id: null,
      external_id: `ext-${Date.now()}`,
      name: 'Product from URL',
      description: 'This product was retrieved from a URL',
      category_id: 1,
      category_name: 'Building Materials',
      price: 99.99,
      url: url,
      image_url: 'https://example.com/placeholder.jpg',
      source: source,
      tier: 'better'
    };
  } catch (error) {
    console.error('Error getting product by URL:', error);
    throw error;
  }
};

// Get recommended products by category and tier
export const getRecommendedProducts = async (
  category_id: number,
  tier: string = 'better',
  limit: number = 3
): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT p.*, pc.name as category_name 
       FROM products p
       JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.category_id = $1 AND p.tier = $2
       ORDER BY p.price ASC
       LIMIT $3`,
      [category_id, tier, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting recommended products:', error);
    throw error;
  }
};
