import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  CreditCard, 
  Building2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Shield, 
  Zap,
  AlertCircle
} from 'lucide-react'

function Integrations() {
  const [stripeKey, setStripeKey] = useState('')
  const [qbClientId, setQbClientId] = useState('')
  const [qbClientSecret, setQbClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [integrations, setIntegrations] = useState([])

  const fetchIntegrations = async () => {
    try {
      const res = await axios.get('/api/integrations')
      setIntegrations(res.data)
    } catch (err) {
      // ignore for now
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const handleStripe = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await axios.post('/api/integrations/stripe', { apiKey: stripeKey })
      setSuccess('Stripe connected successfully!')
      setStripeKey('')
      fetchIntegrations()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to connect Stripe. Please check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickBooks = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await axios.post('/api/integrations/quickbooks', { clientId: qbClientId, clientSecret: qbClientSecret })
      setSuccess('QuickBooks connected successfully!')
      setQbClientId('')
      setQbClientSecret('')
      fetchIntegrations()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to connect QuickBooks. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const integrationCards = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Connect your Stripe account to automatically sync payment data and revenue streams.',
      icon: CreditCard,
      color: 'purple',
      features: ['Payment processing', 'Revenue tracking', 'Subscription management'],
      docsUrl: 'https://stripe.com/docs'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync your QuickBooks data to get comprehensive financial insights and automated bookkeeping.',
      icon: Building2,
      color: 'green',
      features: ['Expense tracking', 'Invoice management', 'Financial reporting'],
      docsUrl: 'https://developer.intuit.com/app/developer/qbo/docs'
    }
  ]

  const getStatusIcon = (isActive) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-400" />
    )
  }

  const getStatusText = (isActive) => {
    return isActive ? 'Connected' : 'Not Connected'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Integrations</h2>
        <p className="text-gray-600 mt-1">Connect your financial tools for automated data sync and insights</p>
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

      {/* Connected Integrations */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Connected Integrations</h3>
        {integrations.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No integrations connected yet.</p>
            <p className="text-sm text-gray-400 mt-1">Connect your first integration below to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(integration.isActive)}
                  <div>
                    <p className="font-medium text-gray-900">{integration.type}</p>
                    <p className="text-sm text-gray-500">{getStatusText(integration.isActive)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    integration.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrationCards.map((card) => {
          const Icon = card.icon
          const isConnected = integrations.some(i => i.type.toLowerCase() === card.name.toLowerCase())
          
          return (
            <div key={card.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                      <Icon className={`h-6 w-6 text-${card.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
                      <p className="text-sm text-gray-500">{card.description}</p>
                    </div>
                  </div>
                  {isConnected && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-1">
                    {card.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Zap className="h-3 w-3 text-blue-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {card.id === 'stripe' && (
                  <form onSubmit={handleStripe} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stripe Secret Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk_test_..."
                        value={stripeKey}
                        onChange={e => setStripeKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Connect Stripe'}
                      </button>
                      <a
                        href={card.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Docs
                      </a>
                    </div>
                  </form>
                )}

                {card.id === 'quickbooks' && (
                  <form onSubmit={handleQuickBooks} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        placeholder="ABcDefGHijklMNOpqrsTUVwxyz1234567890"
                        value={qbClientId}
                        onChange={e => setQbClientId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your client secret"
                        value={qbClientSecret}
                        onChange={e => setQbClientSecret(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Connect QuickBooks'}
                      </button>
                      <a
                        href={card.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Docs
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Security & Privacy</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your API keys and credentials are encrypted and stored securely. We only access the data necessary for cashflow analysis and never store sensitive financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Integrations 