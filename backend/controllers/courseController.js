// Lazy AI — prevents crash if CF_API_TOKEN is missing at startup
function getAI() {
  const OpenAI = require('openai');
  return new OpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
    apiKey: process.env.CF_API_TOKEN || 'placeholder',
  });
}

function getCourseUrl(provider, title, interest) {
  const q = encodeURIComponent(interest);
  const tq = encodeURIComponent(title);
  switch (provider.toLowerCase()) {
    case 'udemy': return `https://www.udemy.com/courses/search/?q=${q}`;
    case 'coursera': return `https://www.coursera.org/search?query=${q}`;
    case 'edx': return `https://www.edx.org/search?q=${q}`;
    case 'freecodecamp': return `https://www.freecodecamp.org/learn`;
    case 'youtube': return `https://www.youtube.com/results?search_query=${tq}+full+course`;
    case 'nptel': return `https://nptel.ac.in/course.html?discipline=Computer%20Science%20and%20Engineering`;
    case 'great learning': return `https://www.mygreatlearning.com/blog/tag/${q}`;
    case 'simplilearn': return `https://www.simplilearn.com/resources/search?query=${q}`;
    case 'scaler': return `https://www.scaler.com/courses/`;
    case 'alison': return `https://alison.com/courses?query=${q}`;
    case 'mit opencourseware': return `https://ocw.mit.edu/search/?q=${q}`;
    case 'google developers': return `https://developers.google.com/learn/`;
    case 'microsoft learn': return `https://learn.microsoft.com/en-us/training/browse/?terms=${q}`;
    case 'aws training': return `https://aws.amazon.com/training/`;
    default: return `https://www.udemy.com/courses/search/?q=${q}`;
  }
}

// @desc  Search courses via Gemini AI
// @route GET /api/courses/search
const searchCourses = async (req, res) => {
  const { interest, type = 'all' } = req.query;

  if (!interest || !interest.trim()) {
    return res.status(400).json({ error: 'interest query parameter is required' });
  }

  const typeFilter = type === 'free' ? 'only FREE courses' : type === 'paid' ? 'only PAID courses' : 'a mix of free and paid courses';

  const prompt = `You are a course recommendation AI for India's tech learners in 2025. Generate 8 realistic course recommendations for someone interested in: "${interest}". Include ${typeFilter}.

Return ONLY a valid JSON object. No explanation, no markdown. Each course must have:
- title: specific course title
- provider: platform name (Udemy, Coursera, edX, freeCodeCamp, YouTube, NPTEL, Great Learning, Simplilearn, Scaler, Alison, MIT OpenCourseWare, Google Developers, Microsoft Learn, AWS Training)
- price: for free use "Free", for paid use realistic INR price like "₹1,499" or "₹4,999/month"
- type: "free" or "paid"
- level: "Beginner", "Intermediate", or "Advanced"
- duration: e.g. "40 hours", "12 weeks", "6 months"
- rating: string like "4.7/5" or "4.9/5"
- students: e.g. "1.2M students", "45K students"
- description: one sentence description
- skills: array of 3-4 skills learned
- certificate: true or false

Order by relevance. Mix free and paid courses naturally.

Return ONLY valid JSON in this exact structure, starting with {:
{
  "courses": [
    {
      "title": "Course Title",
      "provider": "Provider Name",
      "price": "Free",
      "type": "free",
      "level": "Beginner",
      "duration": "10 hours",
      "rating": "4.8/5",
      "students": "50K students",
      "description": "Description here",
      "skills": ["Skill 1", "Skill 2"],
      "certificate": true
    }
  ]
}`;

  try {
    const ai = getAI();
    const completion = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const rawText = completion.choices[0]?.message?.content ?? '{"courses": []}';
    let courses = [];

    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}') + 1;
      const parsed = JSON.parse(start >= 0 ? cleaned.slice(start, end) : cleaned);
      courses = Array.isArray(parsed.courses) ? parsed.courses : [];
    } catch {
      courses = [];
    }

    const enriched = courses.map((course) => ({
      ...course,
      url: getCourseUrl(course.provider, course.title, interest),
    }));

    const filtered =
      type === 'free' ? enriched.filter((c) => c.type === 'free') :
      type === 'paid' ? enriched.filter((c) => c.type === 'paid') : enriched;

    res.json({ courses: filtered, interest });
  } catch (err) {
    console.error('Course search failed:', err.message);
    res.json({ courses: getFallbackCourses(interest), interest });
  }
};

function getFallbackCourses(interest) {
  const q = encodeURIComponent(interest);
  return [
    { title: `Complete ${interest} Bootcamp 2025`, provider: 'Udemy', price: '₹1,499', type: 'paid', level: 'Beginner', duration: '45 hours', rating: '4.7/5', students: '450K students', description: `Master ${interest} from scratch with hands-on projects.`, skills: [interest, 'Projects', 'Best Practices', 'Interview Prep'], certificate: true, url: `https://www.udemy.com/courses/search/?q=${q}` },
    { title: `${interest} Fundamentals`, provider: 'freeCodeCamp', price: 'Free', type: 'free', level: 'Beginner', duration: '30 hours', rating: '4.8/5', students: '1.2M students', description: `Learn ${interest} fundamentals for free with interactive exercises.`, skills: [interest, 'Problem Solving', 'Web Dev'], certificate: true, url: `https://www.freecodecamp.org/learn` },
    { title: `${interest} Professional Certificate`, provider: 'Coursera', price: '₹3,200/month', type: 'paid', level: 'Intermediate', duration: '6 months', rating: '4.6/5', students: '89K students', description: `Industry-recognized certificate in ${interest} from top universities.`, skills: [interest, 'Theory', 'Industry Tools', 'Portfolio'], certificate: true, url: `https://www.coursera.org/search?query=${q}` },
    { title: `${interest} Full Course`, provider: 'YouTube', price: 'Free', type: 'free', level: 'Beginner', duration: '12 hours', rating: '4.9/5', students: '2.5M views', description: `Complete ${interest} course available free on YouTube.`, skills: [interest, 'Concepts', 'Examples'], certificate: false, url: `https://www.youtube.com/results?search_query=${q}+full+course` },
    { title: `${interest} by Google`, provider: 'Google Developers', price: 'Free', type: 'free', level: 'Intermediate', duration: '20 hours', rating: '4.7/5', students: '500K students', description: `Official Google training for ${interest} developers.`, skills: [interest, 'Google Tools', 'Best Practices'], certificate: true, url: `https://developers.google.com/learn/` },
    { title: `${interest} Masters Program`, provider: 'Scaler', price: '₹1.5L total', type: 'paid', level: 'Advanced', duration: '9 months', rating: '4.8/5', students: '12K students', description: `Job-guaranteed ${interest} program with mentorship from top engineers.`, skills: [interest, 'System Design', 'DSA', 'Interview Prep'], certificate: true, url: `https://www.scaler.com/courses/` },
  ];
}

module.exports = { searchCourses };
