const express = require('express');
const router = express.Router();
const Sentiment = require('../models/Sentiment');
const { analyzeSentiment } = require('../services/sentimentAnalyzer');

// @route   POST api/analyze
// @desc    Analyze text sentiment and save to DB
// @access  Public
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    // Analyze the sentiment
    const { sentiment, score, contextInfo } = analyzeSentiment(text);
    
    // Create new record in database
    const newAnalysis = new Sentiment({
      text,
      sentiment,
      score,
      contextInfo: contextInfo || ''
    });
    
    const savedAnalysis = await newAnalysis.save();
    
    res.status(201).json(savedAnalysis);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/history
// @desc    Get all previous sentiment analyses
// @access  Public
router.get('/history', async (req, res) => {
  try {
    const history = await Sentiment.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/history/:id
// @desc    Delete a sentiment analysis
// @access  Public
router.delete('/history/:id', async (req, res) => {
  try {
    const deleted = await Sentiment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Record deleted', id: req.params.id });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;