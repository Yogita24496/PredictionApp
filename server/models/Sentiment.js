const mongoose = require('mongoose');

const SentimentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      required: true,
      enum: ['positive', 'negative', 'neutral'],
    },
    score: {
      type: Number,
      required: true,
    },
    contextInfo: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sentiment', SentimentSchema);

module.exports = mongoose.model('Sentiment', SentimentSchema);