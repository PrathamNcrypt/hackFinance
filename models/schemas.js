const mongoose = require('mongoose');

// A stripped-down user just to hold Plaid tokens
const UserSchema = new mongoose.Schema({
  username: { type: String, default: 'DemoUser' },
  plaidAccessToken: { type: String, default: null },
  plaidItemId: { type: String, default: null }
});

const PortfolioStateSchema = new mongoose.Schema({
  username: { type: String, default: 'DemoUser' },
  currentRiskScore: { type: Number, default: 50 }, 
  assetAllocation: {
    stocks: { type: Number, default: 60 },
    bonds: { type: Number, default: 30 },
    cash: { type: Number, default: 10 }
  }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Portfolio: mongoose.model('PortfolioState', PortfolioStateSchema)
};