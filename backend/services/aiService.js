const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI feedback and score for an interview answer
 * @param {string} question - The interview question
 * @param {string} answer - The user's answer
 * @param {string} category - The interview category (technical, behavioral, etc.)
 * @returns {Promise<{feedback: string, score: number}>}
 */
const generateInterviewFeedback = async (question, answer, category = 'general') => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
You are an expert interviewer evaluating a candidate's response to an interview question.

Question: ${question}
Candidate's Answer: ${answer}
Category: ${category}

Please provide:
1. A detailed feedback on the answer quality, completeness, and relevance
2. A score from 0-100 based on:
   - Technical accuracy (if applicable)
   - Completeness of answer
   - Communication clarity
   - Problem-solving approach
   - Relevance to the question

Format your response as JSON with exactly these fields:
{
  "feedback": "Your detailed feedback here...",
  "score": 85
}

Be constructive, specific, and helpful in your feedback. The score should be a number between 0 and 100.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Always respond with valid JSON containing feedback and score fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI API');
    }

    // Parse the JSON response
    const result = JSON.parse(content);

    // Validate the response structure
    if (typeof result.feedback !== 'string' || typeof result.score !== 'number') {
      throw new Error('Invalid response format from AI');
    }

    // Ensure score is within bounds
    const score = Math.max(0, Math.min(100, Math.round(result.score)));

    return {
      feedback: result.feedback.trim(),
      score: score
    };

  } catch (error) {
    console.error('AI Feedback Generation Error:', error);

    // Return fallback feedback if AI fails
    return {
      feedback: 'Unable to generate AI feedback at this time. Please try again later.',
      score: null
    };
  }
};

/**
 * Generate a sample interview question based on category and difficulty
 * @param {string} category - The interview category
 * @param {string} difficulty - The difficulty level
 * @returns {Promise<string>}
 */
const generateInterviewQuestion = async (category = 'technical', difficulty = 'medium') => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate one interview question for a ${category} interview at ${difficulty} difficulty level. Make it relevant and professional.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interviewer. Generate one clear, professional interview question.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const question = response.choices[0]?.message?.content?.trim();

    return question || 'Tell me about yourself and your background in software development.';

  } catch (error) {
    console.error('Question Generation Error:', error);

    // Return a fallback question
    return 'Tell me about yourself and your background in software development.';
  }
};

module.exports = {
  generateInterviewFeedback,
  generateInterviewQuestion
};