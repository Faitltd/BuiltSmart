const express = require('express');
const { generateGptResponse } = require('../services/gptChatbotService');

const router = express.Router();

router.post('/gpt-chat', async (req, res) => {
  try {
    const { state, userInput, chatHistory } = req.body;
    
    if (!state || !userInput) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const result = await generateGptResponse(state, userInput, chatHistory || []);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GPT chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
