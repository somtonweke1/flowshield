import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Shield, 
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

function Liquidity() {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [buffers, setBuffers] = useState([])

  const fetchBuffers = async () => {
    try {
      const res = await axios.get('/api/liquidity/status')
      setBuffers(res.data)
    } catch (err) {
      // ignore for now
    }
  }

  useEffect(() => {
    fetchBuffers()
  }, [])

  const handleRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await axios.post('/api/liquidity/request', { amount: parseFloat(amount), notes })
      setSuccess('Liquidity buffer requested successfully!')
      setAmount('')
      setNotes('')
      fetchBuffers()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to request buffer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRepay = async (bufferId) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await axios.post('/api/liquidity/repay', { bufferId })
      setSuccess('Buffer repaid successfully!')
      fetchBuffers()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to repay buffer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'repaid':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'repaid':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalActiveAmount = buffers
    .filter(b => b.status?.toLowerCase() === 'active')
    .reduce((sum, b) => sum + (b.amount || 0), 0)

  const totalAvailable = 50000 - totalActiveAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Micro-Liquidity Buffers</h2>
        <p className="text-gray-600 mt-1">Get instant access to cash buffers with 0% APR for under 30 days</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Available</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalAvailable.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Buffers</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalActiveAmount.toLocaleString()}
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interest Rate</p>
              <p className="text-2xl font-bold text-purple-600">0% APR</p>
            </div>
            <Percent className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Request New Buffer</h3>
        <form onSubmit={handleRequest} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="1000"
                max="50000"
                step="100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount (min: $1,000, max: $50,000)"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: ${totalAvailable.toLocaleString()} | Max: $50,000
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of how you plan to use this buffer..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || parseFloat(amount) > totalAvailable}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing Request...' : 'Request Buffer'}
          </button>
        </form>
      </div>

      {/* Buffers List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Your Buffers</h3>
        </div>
        
        {buffers.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No liquidity buffers yet.</p>
            <p className="text-sm text-gray-400 mt-1">Request your first buffer above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buffers.map((buffer) => {
                  const daysRemaining = calculateDaysRemaining(buffer.dueDate)
                  return (
                    <tr key={buffer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${buffer.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(buffer.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(buffer.status)}`}>
                            {buffer.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {buffer.requestedAt?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {buffer.dueDate?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {daysRemaining !== null ? (
                          <div className={`flex items-center text-sm ${
                            daysRemaining <= 7 ? 'text-red-600' : 
                            daysRemaining <= 14 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            <Calendar className="h-4 w-4 mr-1" />
                            {daysRemaining} days
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium text-green-600">{buffer.apr || 0}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {buffer.status?.toLowerCase() !== 'repaid' && (
                          <button
                            onClick={() => handleRepay(buffer.id)}
                            disabled={loading}
                            className="flex items-center text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Repay
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Zero Interest</h4>
              <p className="text-sm text-blue-700 mt-1">
                No interest charges for buffers under 30 days. Only pay what you borrow.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <ArrowUpRight className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900">Instant Access</h4>
              <p className="text-sm text-green-700 mt-1">
                Get approved instantly with AI-powered risk assessment and automated processing.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-900">Flexible Terms</h4>
              <p className="text-sm text-purple-700 mt-1">
                Repay anytime within 30 days. No early repayment penalties or hidden fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Liquidity 