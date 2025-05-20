const natural = require('natural');
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

// Custom thresholds for sentiment classification
const POSITIVE_THRESHOLD = 0.2;
const NEGATIVE_THRESHOLD = -0.2;

/**
 * Main analysis function that handles different types of statements
 * @param {string} text - The text to analyze
 * @returns {Object} - Analysis result
 */
const analyzeText = (text) => {
  // Check if it's a date statement
  if (isDateStatement(text)) {
    return analyzeDateAccuracy(text);
  }
  
  // Check if it's a mathematical statement
  if (isMathStatement(text)) {
    return analyzeMathAccuracy(text);
  }
  
  // Default to sentiment analysis for emotional content
  return analyzeSentiment(text);
};

/**
 * Analyzes emotional sentiment in text
 */
const analyzeSentiment = (text) => {
  // Tokenize and remove punctuation
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  
  if (!tokens || tokens.length === 0) {
    return { 
      sentiment: 'neutral', 
      score: 0,
      type: 'emotional',
      explanation: 'No meaningful text detected'
    };
  }
  
  // Get sentiment score
  const score = analyzer.getSentiment(tokens);
  
  // Determine sentiment category based on score
  let sentiment;
  let explanation;
  
  if (score > POSITIVE_THRESHOLD) {
    sentiment = 'positive';
    explanation = 'Text contains positive emotional content';
  } else if (score < NEGATIVE_THRESHOLD) {
    sentiment = 'negative';
    explanation = 'Text contains negative emotional content';
  } else {
    sentiment = 'neutral';
    explanation = 'Text contains neutral emotional content';
  }
  
  return { 
    sentiment, 
    score,
    type: 'emotional',
    explanation
  };
};

/**
 * Detects if text is a date statement
 */
const isDateStatement = (text) => {
  const lowerText = text.toLowerCase();
  
  // Check for date patterns
  return (
    lowerText.includes('today is') || 
    lowerText.includes('date is') || 
    lowerText.includes('current date') ||
    (lowerText.includes('today') && lowerText.includes('may')) ||
    /\d+\s*(st|nd|rd|th)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lowerText)
  );
};

/**
 * Analyzes date accuracy
 */
const analyzeDateAccuracy = (text) => {
  const lowerText = text.toLowerCase();
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
  
  // Extract day from text
  let mentionedDay = null;
  
  // Try to find a day number in the text
  const dayMatch = lowerText.match(/\b(\d+)\s*(st|nd|rd|th)\b/);
  if (dayMatch) {
    mentionedDay = parseInt(dayMatch[1], 10);
  }
  
  // If no explicit day number, look for "today"
  if (mentionedDay === null && lowerText.includes('today')) {
    // Look for a day number after "today"
    const todayDayMatch = lowerText.match(/today\s+is\s+(\d+)\s*(st|nd|rd|th)/i);
    if (todayDayMatch) {
      mentionedDay = parseInt(todayDayMatch[1], 10);
    }
  }
  
  // Default to neutral if we couldn't extract a day
  if (mentionedDay === null) {
    return {
      sentiment: 'neutral',
      score: 0,
      type: 'date',
      explanation: 'Could not extract a specific date from the statement'
    };
  }
  
  // Check accuracy
  if (mentionedDay === currentDay) {
    return {
      sentiment: 'positive',
      score: 0.8,
      type: 'date',
      explanation: `The statement is factually correct. Today is indeed the ${currentDay}${getDaySuffix(currentDay)} of May.`
    };
  } else {
    return {
      sentiment: 'negative',
      score: -0.8,
      type: 'date',
      explanation: `The statement is factually incorrect. Today is the ${currentDay}${getDaySuffix(currentDay)} of May, not the ${mentionedDay}${getDaySuffix(mentionedDay)}.`
    };
  }
};

/**
 * Helper function to get the day suffix (st, nd, rd, th)
 */
const getDaySuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Detects if text is a mathematical statement
 */
const isMathStatement = (text) => {
  // Look for patterns like "X + Y = Z" or "X times Y is Z"
  return (
    /\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\d+/.test(text) || // Matches "5 + 3 = 8"
    /\d+\s*(plus|minus|times|divided by)\s*\d+\s*(is|equals)\s*\d+/i.test(text) // Matches "5 plus 3 equals 8"
  );
};

/**
 * Analyzes mathematical accuracy
 */
const analyzeMathAccuracy = (text) => {
  let equation = text.replace(/[^0-9\+\-\*\/=\.]/g, ''); // Keep only numbers and operators
  
  // Extract parts of the equation
  let parts;
  
  // Handle different formats
  if (equation.includes('=')) {
    parts = equation.split('=');
    
    if (parts.length !== 2) {
      return {
        sentiment: 'neutral',
        score: 0,
        type: 'math',
        explanation: 'Could not parse the mathematical statement'
      };
    }
    
    const leftSide = parts[0].trim();
    const rightSide = parts[1].trim();
    
    // Safely evaluate the left side
    let leftResult;
    try {
      // Use Function constructor instead of eval for better security
      leftResult = new Function('return ' + leftSide)();
    } catch (e) {
      return {
        sentiment: 'neutral',
        score: 0,
        type: 'math',
        explanation: 'Could not evaluate the mathematical expression'
      };
    }
    
    // Compare with right side
    const rightResult = parseFloat(rightSide);
    
    if (Math.abs(leftResult - rightResult) < 0.0001) { // Allow for floating point imprecision
      return {
        sentiment: 'positive',
        score: 0.9,
        type: 'math',
        explanation: `The mathematical statement is correct: ${leftSide} = ${rightResult}`
      };
    } else {
      return {
        sentiment: 'negative',
        score: -0.9,
        type: 'math',
        explanation: `The mathematical statement is incorrect. ${leftSide} actually equals ${leftResult}, not ${rightResult}`
      };
    }
  }
  
  // If we couldn't parse it as an equation
  return {
    sentiment: 'neutral',
    score: 0,
    type: 'math',
    explanation: 'Could not identify a clear mathematical statement'
  };
};

module.exports = { analyzeText };