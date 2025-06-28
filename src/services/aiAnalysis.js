const tf = require('@tensorflow/tfjs-node');
const moment = require('moment');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AIAnalysisService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
  }

  async loadModel() {
    try {
      // In a real implementation, you would load a pre-trained model
      // For now, we'll create a simple model for demonstration
      this.model = tf.sequential({
        layers: [
          tf.layers.lstm({
            units: 50,
            returnSequences: true,
            inputShape: [30, 1]
          }),
          tf.layers.dropout(0.2),
          tf.layers.lstm({
            units: 50,
            returnSequences: false
          }),
          tf.layers.dropout(0.2),
          tf.layers.dense({
            units: 1
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });

      this.isModelLoaded = true;
      console.log('AI model loaded successfully');
    } catch (error) {
      console.error('Error loading AI model:', error);
      throw error;
    }
  }

  async prepareData(cashflowData, days = 30) {
    // Convert cashflow data to time series format
    const dailyData = {};
    
    cashflowData.forEach(transaction => {
      const date = moment(transaction.date).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        dailyData[date].income += transaction.amount;
      } else {
        dailyData[date].expense += transaction.amount;
      }
    });

    // Create net cashflow series
    const dates = Object.keys(dailyData).sort();
    const netCashflow = dates.map(date => 
      dailyData[date].income - dailyData[date].expense
    );

    // Normalize data
    const min = Math.min(...netCashflow);
    const max = Math.max(...netCashflow);
    const normalized = netCashflow.map(value => 
      (value - min) / (max - min)
    );

    return { normalized, min, max, dates };
  }

  async trainModel(userId) {
    try {
      // Get historical cashflow data
      const cashflowData = await prisma.cashflowData.findMany({
        where: { userId },
        orderBy: { date: 'asc' }
      });

      if (cashflowData.length < 60) {
        throw new Error('Insufficient data for training (minimum 60 days required)');
      }

      const { normalized, min, max } = await this.prepareData(cashflowData);
      
      // Create training sequences
      const sequenceLength = 30;
      const sequences = [];
      const targets = [];

      for (let i = 0; i < normalized.length - sequenceLength; i++) {
        sequences.push(normalized.slice(i, i + sequenceLength));
        targets.push(normalized[i + sequenceLength]);
      }

      // Convert to tensors
      const xs = tf.tensor3d(sequences, [sequences.length, sequenceLength, 1]);
      const ys = tf.tensor2d(targets, [targets.length, 1]);

      // Train the model
      await this.model.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  async forecast(userId, days = 90) {
    try {
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Get recent cashflow data
      const cashflowData = await prisma.cashflowData.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 60
      });

      if (cashflowData.length < 30) {
        throw new Error('Insufficient data for forecasting');
      }

      const { normalized, min, max, dates } = await this.prepareData(cashflowData.reverse());
      
      // Get the last 30 days for prediction
      const lastSequence = normalized.slice(-30);
      let currentSequence = [...lastSequence];
      const predictions = [];

      // Generate predictions
      for (let i = 0; i < days; i++) {
        const input = tf.tensor3d([currentSequence], [1, 30, 1]);
        const prediction = this.model.predict(input);
        const predictedValue = prediction.dataSync()[0];
        
        // Denormalize
        const denormalizedValue = predictedValue * (max - min) + min;
        predictions.push(denormalizedValue);

        // Update sequence for next prediction
        currentSequence.shift();
        currentSequence.push(predictedValue);

        // Clean up tensors
        input.dispose();
        prediction.dispose();
      }

      // Save forecasts to database
      const forecastPromises = predictions.map((amount, index) => {
        const date = moment().add(index + 1, 'days').toDate();
        return prisma.forecast.create({
          data: {
            userId,
            date,
            predictedAmount: amount,
            confidence: 0.85, // This would be calculated based on model performance
            modelVersion: '1.0.0'
          }
        });
      });

      await Promise.all(forecastPromises);

      return {
        predictions,
        dates: Array.from({ length: days }, (_, i) => 
          moment().add(i + 1, 'days').format('YYYY-MM-DD')
        )
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw error;
    }
  }

  async detectLeaks(userId) {
    try {
      // Get recent cashflow data
      const cashflowData = await prisma.cashflowData.findMany({
        where: { 
          userId,
          date: {
            gte: moment().subtract(30, 'days').toDate()
          }
        },
        orderBy: { date: 'asc' }
      });

      const leaks = [];
      const threshold = parseFloat(process.env.ANOMALY_THRESHOLD) || 0.15;

      // Group by category
      const categoryData = {};
      cashflowData.forEach(transaction => {
        if (transaction.type === 'EXPENSE') {
          const category = transaction.category || 'Uncategorized';
          if (!categoryData[category]) {
            categoryData[category] = [];
          }
          categoryData[category].push(transaction.amount);
        }
      });

      // Analyze each category for anomalies
      Object.entries(categoryData).forEach(([category, amounts]) => {
        if (amounts.length < 3) return; // Need at least 3 data points

        const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);

        // Check for amounts that are significantly higher than average
        amounts.forEach((amount, index) => {
          const zScore = Math.abs((amount - mean) / stdDev);
          if (zScore > 2 && amount > mean * (1 + threshold)) {
            leaks.push({
              category,
              amount,
              average: mean,
              zScore,
              date: cashflowData.find(t => 
                t.category === category && t.amount === amount
              )?.date,
              severity: zScore > 3 ? 'HIGH' : 'MEDIUM'
            });
          }
        });
      });

      // Save alerts for detected leaks
      const alertPromises = leaks.map(leak => 
        prisma.alert.create({
          data: {
            userId,
            type: 'CASHFLOW_LEAK',
            message: `Unusual expense detected in ${leak.category}: $${leak.amount.toFixed(2)} (${leak.zScore.toFixed(2)}x above average)`,
            severity: leak.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            metadata: leak
          }
        })
      );

      await Promise.all(alertPromises);

      return leaks;
    } catch (error) {
      console.error('Error detecting leaks:', error);
      throw error;
    }
  }

  async predictShortfalls(userId) {
    try {
      const forecast = await this.forecast(userId, 90);
      const shortfalls = [];

      let runningBalance = 0;
      
      // Get current balance from recent transactions
      const recentTransactions = await prisma.cashflowData.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30
      });

      runningBalance = recentTransactions.reduce((balance, transaction) => {
        return balance + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount);
      }, 0);

      // Check for potential shortfalls
      forecast.predictions.forEach((prediction, index) => {
        runningBalance += prediction;
        
        if (runningBalance < 0) {
          shortfalls.push({
            date: forecast.dates[index],
            predictedBalance: runningBalance,
            daysFromNow: index + 1
          });
        }
      });

      // Save alerts for shortfalls
      if (shortfalls.length > 0) {
        const alert = await prisma.alert.create({
          data: {
            userId,
            type: 'FORECAST_SHORTFALL',
            message: `Cashflow shortfall predicted in ${shortfalls[0].daysFromNow} days`,
            severity: 'HIGH',
            metadata: { shortfalls }
          }
        });
      }

      return shortfalls;
    } catch (error) {
      console.error('Error predicting shortfalls:', error);
      throw error;
    }
  }
}

module.exports = new AIAnalysisService(); 