const axios = require('axios');

// POST /api/chat
// body: { messages: [{ role: 'user'|'assistant'|'system', text: string }] }
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required.' });
    }

    // System prompt restricting behavior to educational content
    const systemPrompt = `You are an educational assistant. Answer only educational questions related to technology, medicine, and general education topics. Provide clear, factual, and concise explanations. When appropriate, provide examples, steps, or brief study suggestions. If a question is outside the educational scope or requests harmful/medical advice beyond general information, politely decline and recommend consulting a qualified professional.`;

    // Build a single prompt text from conversation
    let promptText = systemPrompt + '\n\nConversation:\n';
    messages.forEach((m) => {
      const role = m.role || 'user';
      const label = role === 'user' ? 'User' : role === 'assistant' ? 'Assistant' : 'System';
      promptText += `${label}: ${m.text}\n`;
    });
    promptText += '\nAssistant:';

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'AI API key not configured on the server.' });

    const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${apiKey}`;

    const body = {
      prompt: {
        text: promptText,
      },
      // tuning options
      temperature: 0.2,
      candidateCount: 1,
      maxOutputTokens: 800,
    };

    const response = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    const data = response.data;
    // Response shape: { candidates: [ { output: '...' } ] }
  const reply = (data?.candidates && data.candidates[0]?.output) || data?.output || '';

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Server error during chat.' });
  }
};
