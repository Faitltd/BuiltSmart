import express, { Request, Response } from 'express';
import { generateGptResponse } from '../services/gptChatbotService';

const router = express.Router();

router.post('/gpt-chat', async (req: Request, res: Response) => {
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

export default router;
