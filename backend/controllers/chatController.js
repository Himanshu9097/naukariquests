// Lazy AI — prevents crash if CF_API_TOKEN is missing at startup
function getAI() {
  const OpenAI = require('openai');
  return new OpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
    apiKey: process.env.CF_API_TOKEN || 'placeholder',
  });
}

const SYSTEM_PROMPT = `You are NaukriQuest AI Career Coach — India's most insightful tech career advisor for 2025.

You specialize in:
- Indian tech job market (Bangalore, Hyderabad, Mumbai, Pune, Delhi NCR)
- Salary benchmarks in LPA (Lakhs Per Annum)
- Career transitions, upskilling, and roadmaps
- Resume & interview prep for Indian tech companies
- Top companies: TCS, Infosys, Wipro, HCL, Razorpay, Zepto, CRED, Flipkart, Meesho, Swiggy, Zomato, PhonePe, Paytm, Groww, Zerodha, Ola, Uber India, Google India, Microsoft India, Amazon India
- In-demand skills: React, Node.js, Python, Go, AI/ML, LLMs, GenAI, DevOps, Cloud (AWS/Azure/GCP), Data Engineering, Cybersecurity

Response style:
- Concise, direct, and actionable (3-5 sentences max per point)
- Use **bold** for key terms
- Use bullet points for lists
- Always mention salary ranges in LPA when relevant
- Be encouraging and realistic about the Indian market
- If asked about non-career topics, gently redirect to career advice`;

// @desc  Chat with AI Career Coach (SSE streaming)
// @route POST /api/chat/message
const sendMessage = async (req, res) => {
  const { messages, language = 'English' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const ai = getAI();
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT + `\n\nCRITICAL INSTRUCTION: You MUST speak, reply, and formulate your response entirely in ${language}. Do not use English unless the requested language is English.` },
      ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    ];

    const stream = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      max_tokens: 1500,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error('Chat failed:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI is temporarily unavailable. Please try again.' })}\n\n`);
  }

  res.end();
};

module.exports = { sendMessage };
