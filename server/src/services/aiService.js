const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Build the prompt for generating test questions
 */
function buildGenerationPrompt(config, documentText = null) {
  const {
    totalQuestions,
    difficulty,
    questionTypes,
    bloomsLevels,
    topics,
    topicWeightage,
    customInstructions,
  } = config;

  const questionTypeMap = {
    mcq: 'Multiple Choice Questions (MCQ) with 4 options labeled A, B, C, D',
    true_false: 'True/False Questions',
    short_answer: 'Short Answer Questions (1-3 sentence answers)',
    coding: 'Coding Questions (provide a coding problem with expected solution)',
  };

  const selectedTypes = questionTypes.map((t) => questionTypeMap[t] || t).join(', ');

  let prompt = `You are an expert test/exam question generator. Generate exactly ${totalQuestions} questions.\n\n`;

  // Source context
  if (documentText) {
    prompt += `=== SOURCE DOCUMENT ===\n${documentText}\n=== END DOCUMENT ===\n\n`;
    prompt += `Generate questions BASED ON the content of the document above.\n\n`;
  } else if (topics && topics.length > 0) {
    prompt += `Generate questions on the following topics: ${topics.join(', ')}\n`;
    prompt += `Use your general knowledge to create questions on these topics.\n\n`;
  }

  // Configuration
  prompt += `=== CONFIGURATION ===\n`;
  prompt += `- Total Questions: ${totalQuestions}\n`;
  prompt += `- Difficulty: ${difficulty}\n`;
  prompt += `- Question Types: ${selectedTypes}\n`;

  if (bloomsLevels && bloomsLevels.length > 0) {
    prompt += `- Bloom's Taxonomy Levels: ${bloomsLevels.join(', ')}\n`;
  }

  if (topicWeightage && topicWeightage.length > 0) {
    prompt += `- Topic Weightage:\n`;
    topicWeightage.forEach((tw) => {
      prompt += `  * ${tw.topic}: ${tw.percentage}%\n`;
    });
  }

  if (customInstructions) {
    prompt += `- Additional Instructions: ${customInstructions}\n`;
  }

  prompt += `\n=== OUTPUT FORMAT ===\n`;
  prompt += `Return a valid JSON array of question objects. Each question must have:\n`;
  prompt += `{
  "questionText": "The question text",
  "questionType": "mcq" | "true_false" | "short_answer" | "coding",
  "options": [
    {"label": "A", "text": "Option text"},
    {"label": "B", "text": "Option text"},
    {"label": "C", "text": "Option text"},
    {"label": "D", "text": "Option text"}
  ],
  "correctAnswer": "A" (for MCQ use the label, for true_false use "True"/"False", for short_answer/coding provide the answer text),
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "The topic this question belongs to",
  "bloomsLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
  "marks": 1
}\n\n`;

  prompt += `IMPORTANT RULES:\n`;
  prompt += `1. For MCQ questions, always provide exactly 4 options (A, B, C, D).\n`;
  prompt += `2. For true_false questions, set options to [{"label": "True", "text": "True"}, {"label": "False", "text": "False"}] and correctAnswer to "True" or "False".\n`;
  prompt += `3. For short_answer and coding questions, options should be an empty array [].\n`;
  prompt += `4. Distribute question types as evenly as possible among the requested types.\n`;
  prompt += `5. If difficulty is "mixed", distribute evenly across easy/medium/hard.\n`;
  prompt += `6. Return ONLY the JSON array, no other text, no markdown formatting, no code blocks.\n`;

  return prompt;
}

/**
 * Generate test questions using Google Gemini
 */
async function generateQuestions(config, documentText = null) {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const prompt = buildGenerationPrompt(config, documentText);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON
    const questions = JSON.parse(text);

    if (!Array.isArray(questions)) {
      throw new Error('AI did not return a valid array of questions');
    }

    // Validate and clean each question
    const cleanedQuestions = questions.map((q, index) => ({
      questionText: q.questionText || `Question ${index + 1}`,
      questionType: q.questionType || 'mcq',
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty || config.difficulty || 'medium',
      topic: q.topic || '',
      bloomsLevel: q.bloomsLevel || '',
      marks: q.marks || 1,
    }));

    return cleanedQuestions;
  } catch (error) {
    console.error('Gemini AI generation error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Grade a short answer / coding question using Gemini
 */
async function gradeShortAnswer(question, userAnswer) {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const prompt = `You are a test grading assistant. Grade the following answer.

Question: ${question.questionText}
Expected Answer: ${question.correctAnswer}
Student's Answer: ${userAnswer}

Respond with ONLY a JSON object:
{
  "isCorrect": true/false,
  "score": 0.0 to 1.0 (partial credit allowed),
  "feedback": "Brief feedback"
}

Return ONLY the JSON, no markdown, no code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error('Grading error:', error);
    // Fallback to simple string matching
    const isCorrect =
      userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    return { isCorrect, score: isCorrect ? 1.0 : 0.0, feedback: 'Auto-graded by exact match' };
  }
}

module.exports = { generateQuestions, gradeShortAnswer };
