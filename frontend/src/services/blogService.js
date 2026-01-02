/**
 * Blog API Service
 * Handles all API calls related to blog posts
 */

import { API_BASE_URL } from './api';

/**
 * Get all published blog posts
 * @returns {Promise<Array>} List of blog posts
 */
export const getAllBlogPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

/**
 * Get a single blog post by slug
 * @param {string} slug - The blog post slug
 * @returns {Promise<Object|null>} Blog post object or null if not found
 */
export const getBlogPostBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${slug}/`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching blog post ${slug}:`, error);
    return null;
  }
};

/**
 * Get featured blog posts
 * @returns {Promise<Array>} List of featured blog posts
 */
export const getFeaturedBlogPosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/featured/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    return [];
  }
};

/**
 * Get blog posts by category
 * @param {string} category - The category slug
 * @returns {Promise<Array>} List of blog posts in category
 */
export const getBlogPostsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/category/${category}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching blog posts for category ${category}:`, error);
    return [];
  }
};

/**
 * Get related blog posts
 * @param {string} slug - The current blog post slug
 * @returns {Promise<Array>} List of related blog posts
 */
export const getRelatedBlogPosts = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${slug}/related/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching related posts for ${slug}:`, error);
    return [];
  }
};

/**
 * Get all blog categories
 * @returns {Promise<Array>} List of category tuples [value, label]
 */
export const getBlogCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/categories/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
};
