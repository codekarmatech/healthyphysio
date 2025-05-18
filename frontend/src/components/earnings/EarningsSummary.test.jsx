import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EarningsSummary from './EarningsSummary';

describe('EarningsSummary Component', () => {
  const mockSummary = {
    totalEarned: 1250.75,
    totalPotential: 1500.00,
    attendedSessions: 10,
    missedSessions: 2,
    attendanceRate: 83.33,
    averagePerSession: 125.08
  };

  test('renders loading state correctly', () => {
    render(<EarningsSummary loading={true} />);
    
    // Check for loading animation elements
    expect(screen.getAllByTestId('loading-animation')).toHaveLength(3);
  });

  test('renders empty state when no summary is provided', () => {
    render(<EarningsSummary summary={null} loading={false} />);
    
    // Check for empty state message
    expect(screen.getByText('No earnings data available.')).toBeInTheDocument();
    expect(screen.getByText('Check back after completing some sessions.')).toBeInTheDocument();
  });

  test('renders summary data correctly', () => {
    render(<EarningsSummary summary={mockSummary} loading={false} />);
    
    // Check for title
    expect(screen.getByText('Earnings Summary')).toBeInTheDocument();
    
    // Check for earnings values
    expect(screen.getByText('$1250.75 of $1500.00')).toBeInTheDocument();
    
    // Check for session counts
    expect(screen.getByText('10')).toBeInTheDocument(); // Attended sessions
    expect(screen.getByText('2')).toBeInTheDocument(); // Missed sessions
    
    // Check for attendance rate
    expect(screen.getByText('83.33%')).toBeInTheDocument();
    
    // Check for average earnings per session
    expect(screen.getByText('$125.08')).toBeInTheDocument();
  });

  test('handles partial or malformed data gracefully', () => {
    const partialSummary = {
      totalEarned: 'not-a-number',
      attendedSessions: 5
    };
    
    render(<EarningsSummary summary={partialSummary} loading={false} />);
    
    // Should display 0 for missing or invalid numeric values
    expect(screen.getByText('$0.00 of $0.00')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Attended sessions
    expect(screen.getByText('0')).toBeInTheDocument(); // Missed sessions (default)
    expect(screen.getByText('0%')).toBeInTheDocument(); // Attendance rate (default)
  });

  test('shows sample data badge when isMockData is true', () => {
    render(<EarningsSummary summary={mockSummary} loading={false} isMockData={true} />);
    
    // Check for sample data badge
    expect(screen.getByText('Sample Data')).toBeInTheDocument();
  });

  test('does not show sample data badge when isMockData is false', () => {
    render(<EarningsSummary summary={mockSummary} loading={false} isMockData={false} />);
    
    // Check that sample data badge is not present
    expect(screen.queryByText('Sample Data')).not.toBeInTheDocument();
  });
});
