const { GoogleGenerativeAI } = require('@google/generative-ai');

const systemPrompt = `You are an educational assistant. Answer only educational questions related to technology, medicine, and general education topics. Provide clear, factual, and concise explanations. When appropriate, offer quick examples, steps, or study suggestions. If a request falls outside the educational scope or asks for harmful/medical advice beyond general guidance, politely decline and recommend consulting a qualified professional.`;

const modelCache = new Map();
function getModel(modelName) {
  if (modelCache.has(modelName)) {
    return modelCache.get(modelName);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  modelCache.set(modelName, model);
  return model;
}

// POST /api/chat
// body: { messages: [{ role: 'user'|'assistant', text: string }] }
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required.' });
    }

    const sanitized = messages
      .filter((m) => m?.text?.trim())
      .slice(-20) // keep recent context
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text.trim() }],
      }));

    if (!sanitized.length) {
      return res.status(400).json({ message: 'At least one non-empty message is required.' });
    }

    const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const fallbackModels = Array.from(
      new Set([
        configuredModel,
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
      ])
    );

    const errors = [];
    for (const modelName of fallbackModels) {
      try {
        const model = getModel(modelName);
        const result = await model.generateContent({
          contents: sanitized,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            topP: 0.95,
          },
        });

        const reply = result?.response?.text()?.trim();
        if (!reply) {
          throw new Error('AI returned an empty response.');
        }

        return res.json({ reply, model: modelName });
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.error?.message || err.message || 'Unknown error';
        errors.push(`${modelName}: ${msg}`);

        if (![429, 500, 502, 503].includes(status)) {
          break; // non-transient error, no need to try more models
        }
      }
    }

    return res.status(503).json({
      message: 'AI service is temporarily unavailable. Please try again in a moment.',
      details: errors,
    });
  } catch (error) {
    console.error('Chat error:', error?.response?.data || error.message || error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI API key is missing on the server.' });
    }
    const status = error?.response?.status || 500;
    const details = error?.response?.data?.error?.message || error?.response?.data?.message;
    res.status(status).json({ message: details || 'Server error during chat.' });
  }
};
