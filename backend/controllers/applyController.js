// Lazy AI — prevents crash if CF_API_TOKEN is missing at startup
function getAI() {
  const OpenAI = require('openai');
  return new OpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
    apiKey: process.env.CF_API_TOKEN || 'placeholder',
  });
}

// @desc  Generate cover letter / email / talking points (SSE streaming)
// @route POST /api/apply/generate
const generateApplication = async (req, res) => {
  const { jobDescription, userName, userExperience, userSkills, userEmail, generationType } = req.body;

  if (!jobDescription || jobDescription.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide a job description' });
  }

  const candidateInfo = `
Name: ${userName || 'the candidate'}
Experience: ${userExperience || 'not specified'}
Key Skills: ${userSkills || 'not specified'}
Email: ${userEmail || ''}
`.trim();

  const prompt = `You are an expert career coach helping a candidate apply for a job in the Indian tech market.

JOB DESCRIPTION:
---
${jobDescription.slice(0, 3000)}
---

CANDIDATE INFO:
${candidateInfo}

Generate application content as a JSON object. Return ONLY the JSON object.
{
  "job_title": "string",
  "company_name": "string",
  "cover_letter": "string (300 words)",
  "email_subject": "string",
  "email_body": "string (150 words)",
  "talking_points": ["string", "string", "string"],
  "key_requirements": ["string", "string"],
  "suggested_questions": ["string", "string"],
  "tips": ["string", "string"]
}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ai = getAI();
    const stream = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [
        { role: 'system', content: 'You are a career expert. You MUST return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.2,
      stream: true,
      response_format: { type: 'json_object' },
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        // Stream the incremental delta to the frontend
        res.write(`data: ${JSON.stringify({ delta: content })}\n\n`);
      }
    }
    
    // Final signal with full content for safety
    res.write(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Apply AI Error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateApplication };
