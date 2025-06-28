const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const aiAnalysis = require('../services/aiAnalysis');

const prisma = new PrismaClient();
const router = express.Router();

const cashflowSchema = Joi.object({
  date: Joi.date().required(),
  amount: Joi.number().required(),
  type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').required(),
  category: Joi.string().optional(),
  description: Joi.string().optional(),
  source: Joi.string().required(),
  metadata: Joi.object().optional()
});

// Add cashflow data
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = cashflowSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const data = await prisma.cashflowData.create({
      data: { ...value, userId: req.user.id }
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// List cashflow data
router.get('/', async (req, res, next) => {
  try {
    const data = await prisma.cashflowData.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Run AI analysis (forecast, leaks, shortfalls)
router.post('/analyze', async (req, res, next) => {
  try {
    const forecast = await aiAnalysis.forecast(req.user.id, 90);
    const leaks = await aiAnalysis.detectLeaks(req.user.id);
    const shortfalls = await aiAnalysis.predictShortfalls(req.user.id);
    res.json({ forecast, leaks, shortfalls });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 