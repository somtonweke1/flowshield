import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Charts = ({ cashflowData, analysis }) => {
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('30');

  // Process data for different chart types
  const processData = () => {
    if (!cashflowData || cashflowData.length === 0) return [];

    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const filteredData = cashflowData.filter(entry => {
      const entryDate = new Date(entry.date);
      return (now - entryDate) <= (daysAgo * 24 * 60 * 60 * 1000);
    });

    // Group by date
    const grouped = filteredData.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, net: 0 };
      }
      
      if (entry.type === 'income') {
        acc[date].income += entry.amount;
        acc[date].net += entry.amount;
      } else {
        acc[date].expense += entry.amount;
        acc[date].net -= entry.amount;
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const processCategoryData = () => {
    if (!cashflowData || cashflowData.length === 0) return [];

    const categoryTotals = cashflowData.reduce((acc, entry) => {
      const category = entry.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, type: entry.type };
      }
      acc[category].value += entry.amount;
      return acc;
    }, {});

    return Object.values(categoryTotals)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  };

  const processMonthlyData = () => {
    if (!cashflowData || cashflowData.length === 0) return [];

    const monthlyData = cashflowData.reduce((acc, entry) => {
      const date = new Date(entry.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, income: 0, expense: 0, net: 0 };
      }
      
      if (entry.type === 'income') {
        acc[monthYear].income += entry.amount;
        acc[monthYear].net += entry.amount;
      } else {
        acc[monthYear].expense += entry.amount;
        acc[monthYear].net -= entry.amount;
      }
      
      return acc;
    }, {});

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const chartData = processData();
  const categoryData = processCategoryData();
  const monthlyData = processMonthlyData();

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#FF8042" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="net" stroke="#0088FE" strokeWidth={3} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#00C49F" name="Income" />
              <Bar dataKey="expense" fill="#FF8042" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name="Income" />
              <Area type="monotone" dataKey="expense" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#00C49F" name="Income" />
              <Bar dataKey="expense" fill="#FF8042" name="Expense" />
              <Bar dataKey="net" fill="#0088FE" name="Net" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getSummaryStats = () => {
    if (!cashflowData || cashflowData.length === 0) return {};

    const totalIncome = cashflowData
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpense = cashflowData
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const netCashflow = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netCashflow };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalIncome?.toLocaleString() || '0'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${stats.totalExpense?.toLocaleString() || '0'}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Cashflow</p>
              <p className={`text-2xl font-bold ${stats.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.netCashflow?.toLocaleString() || '0'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart (Categories)</option>
              <option value="monthly">Monthly Overview</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full">
          {chartData.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No data available for the selected time range</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Summary */}
      {analysis && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.leaks && analysis.leaks.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Cashflow Leaks Detected</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {analysis.leaks.map((leak, index) => (
                    <li key={index}>• {leak}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.shortfall && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Shortfall Prediction</h4>
                <p className="text-sm text-yellow-700">{analysis.shortfall}</p>
              </div>
            )}

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts; 