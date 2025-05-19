import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeatureGuard from './FeatureGuard';
import useFeatureAccess from '../../hooks/useFeatureAccess';

// Mock the useFeatureAccess hook
jest.mock('../../hooks/useFeatureAccess');

describe('FeatureGuard Component', () => {
  // Test content to render when access is granted
  const testContent = <div data-testid="test-content">Test Content</div>;
  
  // Test fallback content
  const testFallback = <div data-testid="test-fallback">Custom Fallback</div>;
  
  beforeEach(() => {
    // Reset mock before each test
    jest.clearAllMocks();
  });
  
  test('renders loading state when feature access is being checked', () => {
    // Mock the hook to return loading state
    useFeatureAccess.mockReturnValue({
      canAccess: () => false,
      loading: true,
      error: null
    });
    
    render(<FeatureGuard feature="test-feature">{testContent}</FeatureGuard>);
    
    // Check for loading indicator
    expect(screen.getByTestId('feature-guard-loading')).toBeInTheDocument();
    
    // Content should not be rendered
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
  });
  
  test('renders children when feature is accessible', () => {
    // Mock the hook to return access granted
    useFeatureAccess.mockReturnValue({
      canAccess: (feature) => feature === 'test-feature',
      loading: false,
      error: null
    });
    
    render(<FeatureGuard feature="test-feature">{testContent}</FeatureGuard>);
    
    // Content should be rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    
    // Default fallback should not be rendered
    expect(screen.queryByText('Waiting for Admin Approval')).not.toBeInTheDocument();
  });
  
  test('renders default fallback when feature is not accessible', () => {
    // Mock the hook to return access denied
    useFeatureAccess.mockReturnValue({
      canAccess: () => false,
      loading: false,
      error: null
    });
    
    render(<FeatureGuard feature="test-feature">{testContent}</FeatureGuard>);
    
    // Content should not be rendered
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    
    // Default fallback should be rendered
    expect(screen.getByText('Waiting for Admin Approval')).toBeInTheDocument();
    expect(screen.getByText('This feature requires admin approval before you can access it.')).toBeInTheDocument();
  });
  
  test('renders custom fallback when provided and feature is not accessible', () => {
    // Mock the hook to return access denied
    useFeatureAccess.mockReturnValue({
      canAccess: () => false,
      loading: false,
      error: null
    });
    
    render(
      <FeatureGuard 
        feature="test-feature"
        fallback={testFallback}
      >
        {testContent}
      </FeatureGuard>
    );
    
    // Content should not be rendered
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    
    // Custom fallback should be rendered
    expect(screen.getByTestId('test-fallback')).toBeInTheDocument();
    
    // Default fallback should not be rendered
    expect(screen.queryByText('Waiting for Admin Approval')).not.toBeInTheDocument();
  });
});
