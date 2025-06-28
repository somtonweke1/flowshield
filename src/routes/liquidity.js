const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const moment = require('moment');

const prisma = new PrismaClient();
const router = express.Router();

const requestSchema = Joi.object({
  amount: Joi.number().min(1000).max(50000).required(),
  notes: Joi.string().optional()
});

// Request micro-liquidity buffer
router.post('/request', async (req, res, next) => {
  try {
    const { error, value } = requestSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const dueDate = moment().add(30, 'days').toDate();
    const buffer = await prisma.liquidityBuffer.create({
      data: {
        userId: req.user.id,
        amount: value.amount,
        dueDate,
        apr: 0.0,
        notes: value.notes,
        status: 'PENDING'
      }
    });
    res.status(201).json(buffer);
  } catch (err) {
    next(err);
  }
});

// Check buffer status
router.get('/status', async (req, res, next) => {
  try {
    const buffers = await prisma.liquidityBuffer.findMany({
      where: { userId: req.user.id },
      orderBy: { requestedAt: 'desc' }
    });
    res.json(buffers);
  } catch (err) {
    next(err);
  }
});

// Repay buffer
router.post('/repay', async (req, res, next) => {
  try {
    const { bufferId } = req.body;
    if (!bufferId) return res.status(400).json({ error: 'Missing bufferId' });
    const buffer = await prisma.liquidityBuffer.update({
      where: { id: bufferId, userId: req.user.id },
      data: { status: 'REPAID', repaidAt: new Date() }
    });
    res.json(buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 