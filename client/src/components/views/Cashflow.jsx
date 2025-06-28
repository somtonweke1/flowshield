import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Upload, FileText, BarChart3, Plus, Download } from 'lucide-react'
import Charts from '../Charts'

function Cashflow() {
  const [cashflow, setCashflow] = useState([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('income')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('Manual')
  const [showForm, setShowForm] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Fetch cashflow data
  const fetchCashflow = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/cashflow')
      setCashflow(res.data)
    } catch (err) {
      setError('Failed to fetch cashflow data')
    } finally {
      setLoading(false)
    }
  }

  // Add cashflow entry
  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/cashflow', {
        date,
        amount: parseFloat(amount),
        type,
        category,
        description,
        source
      })
      setAmount('')
      setType('income')
      setDate('')
      setCategory('')
      setDescription('')
      setSource('Manual')
      setShowForm(false)
      setAnalysis(res.data.analysis)
      fetchCashflow()
      setSuccess('Cashflow entry added successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add cashflow entry')
    } finally {
      setLoading(false)
    }
  }

  // Handle CSV upload
  const handleCsvUpload = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      setError('Please select a CSV file')
      return
    }

    setUploading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('csvFile', csvFile)

    try {
      const res = await axios.post('/api/cashflow/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setCsvFile(null)
      setAnalysis(res.data.analysis)
      fetchCashflow()
      setSuccess(`Successfully uploaded ${res.data.uploaded} entries!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload CSV file')
    } finally {
      setUploading(false)
    }
  }

  // Run AI analysis
  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/cashflow/analyze')
      setAnalysis(res.data)
      setSuccess('Analysis completed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to run analysis')
    } finally {
      setLoading(false)
    }
  }

  // Download CSV template
  const downloadTemplate = () => {
    const template = `date,amount,type,description,category
2024-01-01,1000,income,Salary,Employment
2024-01-02,50,expense,Groceries,Food
2024-01-03,200,expense,Utilities,Bills`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cashflow_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Fetch on mount
  useEffect(() => {
    fetchCashflow()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cashflow Management</h2>
          <p className="text-gray-600 mt-1">Track your income and expenses with AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Cashflow Analytics</h3>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <BarChart3 className="h-4 w-4" />
            {loading ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
        <Charts cashflowData={cashflow} analysis={analysis} />
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Bulk Import</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Upload CSV File</h4>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={!csvFile || uploading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">CSV Template</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download our CSV template to ensure your data is formatted correctly.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-mono">
                Required columns: date, amount, type, description, category
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Cashflow Entry</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cashflow Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashflow.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.date?.slice(0, 10)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    row.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${row.amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      row.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cashflow.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No cashflow entries yet. Add your first entry or upload a CSV file.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cashflow 