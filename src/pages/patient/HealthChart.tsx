import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Alert,
  Button
} from "@mui/material";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SpeedIcon from '@mui/icons-material/Speed';

interface HealthRecord {
  heartRate: number;
  temperature?: number;
  systolic: number;
  diastolic: number;
  timestamp: string; // formatted date string
  originalTimestamp: Timestamp; // explicitly using Firebase Timestamp
}

type ChartType = 'line' | 'area' | 'bar';
type TimeRange = '7days' | '30days' | '90days' | 'all';

const HealthChart = () => {
  const [chartData, setChartData] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [activeMetric, setActiveMetric] = useState<string>('all');
  const navigate = useNavigate();

  // Function to filter data by time range
  const filterDataByTimeRange = (data: HealthRecord[], range: TimeRange) => {
    if (range === 'all') return data;
    
    const now = new Date();
    const daysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    };
    
    const rangeMap: Record<TimeRange, Date> = {
      '7days': daysAgo(7),
      '30days': daysAgo(30),
      '90days': daysAgo(90),
      'all': new Date(0) // Not used but needed for TypeScript
    };
    
    return data.filter(item => {
      if (!item.originalTimestamp) return false;
      try {
        return new Date(item.originalTimestamp.toDate()) >= rangeMap[range];
      } catch (err) {
        console.error("Error filtering by date:", err);
        return false;
      }
    });
  };

  // Function to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short', 
      day: 'numeric'
    });
  };

  // Query health records for the current user
  useEffect(() => {
    if (!auth.currentUser) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Using a simpler query without orderBy to avoid the need for a composite index
    const q = query(
      collection(db, "healthRecords"),
      where("userId", "==", auth.currentUser.uid)
      // Removed the orderBy clause to avoid needing a composite index
    );

    // Listen for realtime updates
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        try {
          if (snapshot.empty) {
            setChartData([]);
            setLoading(false);
            setError("No health records found");
            return;
          }
          
          const data = snapshot.docs.map((doc) => {
            const record = doc.data();
            // Parse bp if available, expecting format "systolic/diastolic"
            let systolic = 0;
            let diastolic = 0;
            
            if (record.bp) {
              const bpValues = (record.bp as string).split("/").map(Number);
              if (bpValues.length === 2) {
                systolic = bpValues[0];
                diastolic = bpValues[1];
              }
            }
            
            // Validate timestamp exists
            if (!record.timestamp) {
              console.warn("Record missing timestamp:", doc.id);
              return null;
            }
            
            // Original timestamp for filtering
            const originalTimestamp = record.timestamp;
            
            // Format date for display
            let formattedDate = "Unknown date";
            try {
              // Ensure timestamp has toDate method before calling it
              if (typeof originalTimestamp.toDate === 'function') {
                formattedDate = formatDate(originalTimestamp.toDate());
              }
            } catch (err) {
              console.error("Error formatting date:", err);
            }
              
            return {
              heartRate: Number(record.heartRate) || 0,
              temperature: Number(record.temperature) || undefined, // Keep as undefined if not available
              systolic,
              diastolic,
              timestamp: formattedDate,
              originalTimestamp
            };
          }).filter(record => record !== null) as HealthRecord[]; // Filter out null records

          // Sort the data manually after fetching
          const sortedData = data.sort((a, b) => {
            try {
              const aTime = a.originalTimestamp.toDate().getTime();
              const bTime = b.originalTimestamp.toDate().getTime();
              return aTime - bTime; // ascending order (oldest to newest)
            } catch (err) {
              console.error("Error during sort:", err);
              return 0;
            }
          });

          setChartData(sortedData);
          setLoading(false);
          
          if (sortedData.length === 0) {
            setError("No health records found");
          } else {
            setError(null);
          }
        } catch (err: any) {
          console.error("Error processing data:", err);
          setError(`Error processing data: ${err.message || "Unknown error"}`);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching health records:", err);
        setError(`Error fetching health records: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]); // Add proper dependency to ensure it re-runs when user ID changes

  // Rest of your component remains unchanged
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const handleMetricChange = (
    event: React.MouseEvent<HTMLElement>,
    newMetric: string | null,
  ) => {
    if (newMetric !== null) {
      setActiveMetric(newMetric);
    }
  };

  // Get color based on value for BP
  const getBpColor = (value: number) => {
    if (value < 90) return "#3498db"; // Low - blue
    if (value > 140) return "#e74c3c"; // High - red
    return "#2ecc71"; // Normal - green
  };

  // Get filtered data based on time range
  const filteredData = filterDataByTimeRange(chartData, timeRange);

  const renderChartBasedOnType = () => {
    if (filteredData.length === 0) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '300px',
            backgroundColor: '#f9f9f9',
            borderRadius: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">No data available for the selected time period</Typography>
        </Box>
      );
    }

    // Function to render specific charts based on type and active metric
    const renderChart = () => {
      const commonProps = {
        data: filteredData,
        margin: { top: 10, right: 30, left: 0, bottom: 5 },
      };

      switch (chartType) {
        case 'line':
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              {(activeMetric === 'all' || activeMetric === 'heartRate') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Heart Rate (bpm)"
                  connectNulls
                />
              )}
              
              {(activeMetric === 'all' || activeMetric === 'bp') && (
                <>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="systolic"
                    stroke="#ff7300"
                    strokeWidth={2}
                    name="Systolic BP"
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#387908"
                    strokeWidth={2}
                    name="Diastolic BP"
                    connectNulls
                  />
                </>
              )}
              
              {(activeMetric === 'all' || activeMetric === 'temperature') && 
                filteredData.some(item => item.temperature) && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Temperature (°C)"
                  connectNulls
                />
              )}
            </LineChart>
          );
        
        case 'area':
          return (
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              {(activeMetric === 'all' || activeMetric === 'heartRate') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#8884d8"
                  fill="#8884d830"
                  name="Heart Rate (bpm)"
                  connectNulls
                />
              )}
              
              {(activeMetric === 'all' || activeMetric === 'bp') && (
                <>
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="systolic"
                    stroke="#ff7300"
                    fill="#ff730030"
                    name="Systolic BP"
                    connectNulls
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#387908"
                    fill="#38790830"
                    name="Diastolic BP"
                    connectNulls
                  />
                </>
              )}
              
              {(activeMetric === 'all' || activeMetric === 'temperature') && 
                filteredData.some(item => item.temperature) && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#82ca9d"
                  fill="#82ca9d30"
                  name="Temperature (°C)"
                  connectNulls
                />
              )}
            </AreaChart>
          );
          
        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickMargin={10} 
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              {(activeMetric === 'all' || activeMetric === 'heartRate') && (
                <Bar
                  yAxisId="left"
                  dataKey="heartRate"
                  fill="#8884d8"
                  name="Heart Rate (bpm)"
                />
              )}
              
              {(activeMetric === 'all' || activeMetric === 'bp') && (
                <>
                  <Bar
                    yAxisId="right"
                    dataKey="systolic"
                    fill="#ff7300"
                    name="Systolic BP"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="diastolic"
                    fill="#387908"
                    name="Diastolic BP"
                  />
                </>
              )}
              
              {(activeMetric === 'all' || activeMetric === 'temperature') && 
                filteredData.some(item => item.temperature) && (
                <Bar
                  yAxisId="left"
                  dataKey="temperature"
                  fill="#82ca9d"
                  name="Temperature (°C)"
                />
              )}
            </BarChart>
          );
          
        default:
          return null;
      }
    };

    return (
      <ResponsiveContainer width="100%" height={400}>
        {renderChart() || <></>}
      </ResponsiveContainer>
    );
  };

  // Function to calculate statistic summary (latest, average, max, min)
  const calculateStatistics = (metric: string) => {
    if (chartData.length === 0) return { latest: 'N/A', avg: 'N/A', max: 'N/A', min: 'N/A' };
    
    let values: number[] = [];
    
    switch(metric) {
      case 'heartRate':
        values = chartData.map(d => d.heartRate).filter(val => val > 0);
        break;
      case 'systolic':
        values = chartData.map(d => d.systolic).filter(val => val > 0);
        break;
      case 'diastolic':
        values = chartData.map(d => d.diastolic).filter(val => val > 0);
        break;
      case 'temperature':
        values = chartData.filter(d => d.temperature).map(d => d.temperature as number);
        break;
    }
    
    if (values.length === 0) return { latest: 'N/A', avg: 'N/A', max: 'N/A', min: 'N/A' };
    
    // Sort safely by timestamp
    const sortedData = [...chartData].sort((a, b) => {
      // Ensure both timestamps exist and have toDate method
      if (!a.originalTimestamp || !b.originalTimestamp) return 0;
      
      try {
        const aDate = a.originalTimestamp.toDate().getTime();
        const bDate = b.originalTimestamp.toDate().getTime();
        return bDate - aDate; // descending
      } catch (err) {
        console.error("Error comparing timestamps:", err);
        return 0;
      }
    });
    
    let latest;
    if (sortedData.length > 0) {
      switch(metric) {
        case 'heartRate':
          latest = sortedData[0].heartRate;
          break;
        case 'systolic':
          latest = sortedData[0].systolic;
          break;
        case 'diastolic':
          latest = sortedData[0].diastolic;
          break;
        case 'temperature':
          latest = sortedData[0].temperature;
          break;
      }
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return { 
      latest: latest || 'N/A', 
      avg: avg || 'N/A', 
      max: max || 'N/A', 
      min: min || 'N/A' 
    };
  };

  // Get statistics
  const heartRateStats = calculateStatistics('heartRate');
  const systolicStats = calculateStatistics('systolic');
  const diastolicStats = calculateStatistics('diastolic');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Banner */}
      <Box sx={{ 
        position: 'relative',
        height: '160px',
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(52, 152, 219, 0.5)'
          }}
        />
        <Box sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: 3
        }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              Health Progress Over Time
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Track and visualize your health metrics to monitor improvements
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Heart Rate Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#8884d8', mr: 2 }}>
                  <MonitorHeartIcon />
                </Avatar>
                <Typography variant="h6">Heart Rate</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Latest</Typography>
                  <Typography variant="h6">{heartRateStats.latest} bpm</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Average</Typography>
                  <Typography variant="h6">{heartRateStats.avg} bpm</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min</Typography>
                  <Typography variant="body1">{heartRateStats.min} bpm</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Max</Typography>
                  <Typography variant="body1">{heartRateStats.max} bpm</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Systolic BP Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#ff7300', mr: 2 }}>
                  <SpeedIcon />
                </Avatar>
                <Typography variant="h6">Systolic BP</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Latest</Typography>
                  <Typography variant="h6">{systolicStats.latest} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Average</Typography>
                  <Typography variant="h6">{systolicStats.avg} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min</Typography>
                  <Typography variant="body1">{systolicStats.min} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Max</Typography>
                  <Typography variant="body1">{systolicStats.max} mmHg</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Diastolic BP Stats */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#387908', mr: 2 }}>
                  <FavoriteIcon />
                </Avatar>
                <Typography variant="h6">Diastolic BP</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Latest</Typography>
                  <Typography variant="h6">{diastolicStats.latest} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Average</Typography>
                  <Typography variant="h6">{diastolicStats.avg} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min</Typography>
                  <Typography variant="body1">{diastolicStats.min} mmHg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Max</Typography>
                  <Typography variant="body1">{diastolicStats.max} mmHg</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Controls */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#3498db', mr: 2 }}>
                <TimelineIcon />
              </Avatar>
              <Typography variant="h5">
                Health Chart
              </Typography>
            </Box>
            
            {/* Filter Controls */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Chart Type Selector */}
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                aria-label="chart type"
                size="small"
              >
                <ToggleButton value="line" aria-label="line chart">
                  <ShowChartIcon />
                </ToggleButton>
                <ToggleButton value="area" aria-label="area chart">
                  <TimelineIcon />
                </ToggleButton>
                <ToggleButton value="bar" aria-label="bar chart">
                  <BarChartIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              {/* Time Range Selector */}
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                aria-label="time range"
                size="small"
              >
                <ToggleButton value="7days" aria-label="7 days">
                  7D
                </ToggleButton>
                <ToggleButton value="30days" aria-label="30 days">
                  30D
                </ToggleButton>
                <ToggleButton value="90days" aria-label="90 days">
                  90D
                </ToggleButton>
                <ToggleButton value="all" aria-label="all time">
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          
          {/* Metric Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={activeMetric}
              exclusive
              onChange={handleMetricChange}
              aria-label="active metric"
              size="small"
            >
              <ToggleButton value="all" aria-label="all metrics">
                All Metrics
              </ToggleButton>
              <ToggleButton value="heartRate" aria-label="heart rate">
                Heart Rate
              </ToggleButton>
              <ToggleButton value="bp" aria-label="blood pressure">
                Blood Pressure
              </ToggleButton>
              {chartData.some(item => item.temperature) && (
                <ToggleButton value="temperature" aria-label="temperature">
                  Temperature
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Box>

          {/* Chart Display */}
          <Divider sx={{ mb: 3 }} />
          
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 400
            }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert 
              severity="info" 
              sx={{ 
                my: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2
              }}
              action={
                error === "No health records found" && (
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => navigate('/patient/vitals')}
                  >
                    Add Vitals
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          ) : (
            renderChartBasedOnType()
          )}
        </CardContent>
      </Card>

      {/* Health Trend Analysis */}
      {!loading && !error && chartData.length > 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Health Insights</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {/* Heart Rate Trend */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#8884d8', fontWeight: 'bold' }}>
                    Heart Rate
                  </Typography>
                  <Typography variant="body2">
                    {heartRateStats.latest === 'N/A' ? 'No data available' : 
                      Number(heartRateStats.latest) > 100 ? 'Your heart rate appears to be elevated. Consider resting more.' :
                      Number(heartRateStats.latest) < 60 ? 'Your heart rate is lower than normal. Consult your doctor if you feel dizzy.' :
                      'Your heart rate is within normal range.'}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Blood Pressure Trend */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#ff7300', fontWeight: 'bold' }}>
                    Blood Pressure
                  </Typography>
                  <Typography variant="body2">
                    {systolicStats.latest === 'N/A' ? 'No data available' : 
                      Number(systolicStats.latest) > 140 || Number(diastolicStats.latest) > 90 ? 'Your blood pressure is high. Consider reducing salt intake and stress.' :
                      Number(systolicStats.latest) < 90 || Number(diastolicStats.latest) < 60 ? 'Your blood pressure is low. Stay hydrated and consult your doctor if symptoms persist.' :
                      'Your blood pressure is within normal range.'}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Overall Health Trend */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#2ecc71', fontWeight: 'bold' }}>
                    Overall Trend
                  </Typography>
                  <Typography variant="body2">
                    {chartData.length < 2 ? 'Need more data points to determine trends' :
                      'Regular monitoring helps identify patterns. Continue tracking your vitals for better insights.'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default HealthChart;