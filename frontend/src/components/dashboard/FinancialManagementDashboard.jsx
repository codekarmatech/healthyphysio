import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button,
         FormControl, InputLabel, Select, MenuItem, CircularProgress,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
         Cell, ResponsiveContainer, CartesianGrid, PieChart, Pie } from 'recharts';
// We'll use regular TextField for date input instead of DatePicker
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from './StatCard';
import DashboardSection from './DashboardSection';
import { useAuth } from '../../contexts/AuthContext';

const FinancialManagementDashboard = () => {
  const theme = useTheme();
  const { authTokens, user } = useAuth();
  // Use user information for personalized dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState({
    total_revenue: 0,
    admin_revenue: 0,
    therapist_revenue: 0,
    doctor_revenue: 0,
    pending_amount: 0,
    paid_amount: 0,
    collection_rate: 0,
    total_sessions: 0,
    average_fee: 0,
    period_start: null,
    period_end: null,
    therapist_breakdown: []
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [distributionConfigs, setDistributionConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [calculatorFee, setCalculatorFee] = useState('1000');
  const [calculationResult, setCalculationResult] = useState(null);

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  // Fetch financial dashboard data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/earnings/financial-dashboard/', {
          params: {
            start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
            end_date: endDate ? endDate.toISOString().split('T')[0] : undefined
          },
          headers: {
            'Authorization': `Bearer ${authTokens?.access}`
          }
        });
        setFinancialData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchDistributionConfigs = async () => {
      try {
        const response = await axios.get('/api/earnings/distribution-configs/', {
          headers: {
            'Authorization': `Bearer ${authTokens?.access}`
          }
        });
        setDistributionConfigs(response.data);
        if (response.data.length > 0) {
          const defaultConfig = response.data.find(config => config.is_default) || response.data[0];
          setSelectedConfig(defaultConfig.id);
        }
      } catch (err) {
        console.error('Error fetching distribution configs:', err);
      }
    };

    fetchFinancialData();
    fetchDistributionConfigs();
  }, [authTokens, startDate, endDate]);

  // Handle date filter changes
  const handleDateFilterApply = () => {
    // The useEffect will trigger a new data fetch when startDate or endDate changes
  };

  // Handle revenue calculation
  const handleCalculateRevenue = async () => {
    if (!calculatorFee || !selectedConfig) return;

    try {
      const response = await axios.post('/api/earnings/distribution-configs/calculate/', {
        total_fee: parseFloat(calculatorFee),
        distribution_config_id: selectedConfig
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });
      setCalculationResult(response.data.distribution);
    } catch (err) {
      console.error('Error calculating revenue distribution:', err);
      setError('Failed to calculate revenue distribution. Please try again later.');
    }
  };

  // Prepare data for revenue distribution chart
  const getRevenueDistributionData = () => {
    return [
      { name: 'Admin', value: financialData.admin_revenue },
      { name: 'Therapists', value: financialData.therapist_revenue },
      { name: 'Doctors', value: financialData.doctor_revenue },
    ];
  };

  // Prepare data for payment status chart
  const getPaymentStatusData = () => {
    return [
      { name: 'Paid', value: financialData.paid_amount },
      { name: 'Pending', value: financialData.pending_amount },
    ];
  };

  // Prepare data for monthly revenue chart (using the imported chart components)
  const getMonthlyRevenueData = () => {
    // This is sample data - in a real app, this would come from the API
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Total Revenue',
          data: [12000, 15000, 18000, 16000, 21000, 24000],
          borderColor: COLORS[0],
          backgroundColor: `${COLORS[0]}20`,
          fill: true,
        },
        {
          label: 'Admin Revenue',
          data: [3000, 3750, 4500, 4000, 5250, 6000],
          borderColor: COLORS[1],
          backgroundColor: `${COLORS[1]}20`,
          fill: true,
        },
        {
          label: 'Therapist Revenue',
          data: [7200, 9000, 10800, 9600, 12600, 14400],
          borderColor: COLORS[2],
          backgroundColor: `${COLORS[2]}20`,
          fill: true,
        }
      ]
    };
  };

  // Prepare data for therapist performance chart
  const getTherapistPerformanceData = () => {
    // This is sample data - in a real app, this would come from the API
    return [
      { name: 'Dr. Sharma', sessions: 45, earnings: 54000 },
      { name: 'Dr. Patel', sessions: 38, earnings: 45600 },
      { name: 'Dr. Singh', sessions: 32, earnings: 38400 },
      { name: 'Dr. Kumar', sessions: 28, earnings: 33600 },
      { name: 'Dr. Gupta', sessions: 25, earnings: 30000 },
    ];
  };

  return (
    <DashboardLayout title={`Financial Management Dashboard${user ? ` - ${user.firstName || 'Admin'}` : ''}`}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          {/* Financial Overview */}
          <DashboardSection title="Financial Overview">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Revenue"
                  value={`₹${financialData.total_revenue.toLocaleString()}`}
                  icon="payments"
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Collection Rate"
                  value={`${financialData.collection_rate}%`}
                  icon="trending_up"
                  color={theme.palette.secondary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Sessions"
                  value={financialData.total_sessions}
                  icon="event_available"
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Average Fee"
                  value={`₹${financialData.average_fee.toLocaleString()}`}
                  icon="attach_money"
                  color={theme.palette.error.main}
                />
              </Grid>
            </Grid>
          </DashboardSection>

          {/* Date Filter */}
          <DashboardSection title="Date Filter">
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleDateFilterApply}
                  sx={{ height: '56px' }}
                >
                  Apply Filter
                </Button>
              </Grid>
            </Grid>
          </DashboardSection>

          {/* Financial Visualizations */}
          <DashboardSection title="Financial Visualizations">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Revenue Distribution</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getRevenueDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getRevenueDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Payment Status</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPaymentStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill={theme.palette.success.main} />
                          <Cell fill={theme.palette.warning.main} />
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Monthly Revenue Trends</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getMonthlyRevenueData().labels.map((month, index) => ({
                        month,
                        total: getMonthlyRevenueData().datasets[0].data[index],
                        admin: getMonthlyRevenueData().datasets[1].data[index],
                        therapist: getMonthlyRevenueData().datasets[2].data[index],
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke={COLORS[0]}
                          activeDot={{ r: 8 }}
                          name="Total Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="admin"
                          stroke={COLORS[1]}
                          name="Admin Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="therapist"
                          stroke={COLORS[2]}
                          name="Therapist Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DashboardSection>

          {/* Revenue Distribution Calculator */}
          <DashboardSection title="Revenue Distribution Calculator">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Session Fee (₹)"
                  variant="outlined"
                  type="number"
                  value={calculatorFee}
                  onChange={(e) => setCalculatorFee(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography variant="body1">₹</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Distribution Configuration</InputLabel>
                  <Select
                    value={selectedConfig}
                    onChange={(e) => setSelectedConfig(e.target.value)}
                    label="Distribution Configuration"
                  >
                    {distributionConfigs.map((config) => (
                      <MenuItem key={config.id} value={config.id}>
                        {config.name} {config.is_default ? '(Default)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleCalculateRevenue}
                  sx={{ height: '56px' }}
                >
                  Calculate
                </Button>
              </Grid>
            </Grid>

            {/* Calculation Result */}
            {calculationResult && (
              <Box mt={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Calculation Result</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle1">Total Fee:</Typography>
                        <Typography variant="h6">₹{calculationResult.total.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle1">Admin Amount:</Typography>
                        <Typography variant="h6">₹{calculationResult.admin.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle1">Therapist Amount:</Typography>
                        <Typography variant="h6">₹{calculationResult.therapist.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle1">Doctor Amount:</Typography>
                        <Typography variant="h6">₹{calculationResult.doctor.toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )}
          </DashboardSection>

          {/* Therapist Earnings Breakdown */}
          {financialData.therapist_breakdown && financialData.therapist_breakdown.length > 0 && (
            <DashboardSection title="Therapist Earnings Breakdown">
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Therapist</TableCell>
                          <TableCell align="right">Sessions</TableCell>
                          <TableCell align="right">Total Earnings</TableCell>
                          <TableCell align="right">Average Per Session</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialData.therapist_breakdown.map((therapist) => (
                          <TableRow key={therapist.therapist__id}>
                            <TableCell component="th" scope="row">
                              {therapist.therapist__user__first_name} {therapist.therapist__user__last_name}
                            </TableCell>
                            <TableCell align="right">{therapist.sessions}</TableCell>
                            <TableCell align="right">₹{therapist.total.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              ₹{(therapist.total / therapist.sessions).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Top Therapist Performance</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getTherapistPerformanceData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="earnings" name="Total Earnings" fill={COLORS[0]} />
                          <Bar dataKey="sessions" name="Sessions" fill={COLORS[1]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DashboardSection>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default FinancialManagementDashboard;
