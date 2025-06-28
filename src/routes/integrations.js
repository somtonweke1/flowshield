const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');

const prisma = new PrismaClient();
const router = express.Router();

// Connect Stripe
router.post('/stripe', async (req, res, next) => {
  try {
    // In a real implementation, handle OAuth or API key exchange
    // For now, just mock saving the integration
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'Missing Stripe API key' });
    const integration = await prisma.integration.create({
      data: {
        userId: req.user.id,
        type: 'STRIPE',
        config: { apiKey },
        isActive: true
      }
    });
    res.status(201).json(integration);
  } catch (err) {
    next(err);
  }
});

// Connect QuickBooks
router.post('/quickbooks', async (req, res, next) => {
  try {
    // In a real implementation, handle OAuth
    // For now, just mock saving the integration
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) return res.status(400).json({ error: 'Missing QuickBooks credentials' });
    const integration = await prisma.integration.create({
      data: {
        userId: req.user.id,
        type: 'QUICKBOOKS',
        config: { clientId, clientSecret },
        isActive: true
      }
    });
    res.status(201).json(integration);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 