const Job = require('../models/Job');
const OpenAI = require('openai');

const ai = new OpenAI({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
  apiKey: process.env.CF_API_TOKEN,
});

// Use Llama 3.3 70B to parse user query and GENERATE mock jobs from external platforms
async function searchAndGenerateWithAI(q) {
  try {
    const comp = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [
        {
          role: 'user',
          content: `You are an AI job aggregator. The user is searching for: "${q}".
1) Extract search terms (roles, skills, keywords).
2) Generate 6 realistic job listings matching this search explicitly located in India (e.g. Bangalore, Mumbai, Pune, Remote India). 
Assign sources randomly among "LinkedIn", "Naukri.com", "Indeed", "Glassdoor", "Instahyre".

Return exactly this JSON format and nothing else:
{
  "search_terms": {
    "roles": ["role1"],
    "skills": ["skill1"],
    "keywords": ["keyword1"]
  },
  "generated_jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, India",
      "salary": "₹12L - ₹18L PA",
      "experience": "2-5 years",
      "type": "Full-time",
      "source": "LinkedIn",
      "skills": ["Skill1", "Skill2"],
      "description": "Brief description related to role",
      "apply_link": ""
    }
  ]
}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    let raw = comp.choices[0].message.content || '{}';
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}') + 1;
    const parsed = JSON.parse(start >= 0 ? raw.slice(start, end) : raw);
    
    return {
      terms: parsed.search_terms || { roles: [q], skills: [], keywords: [] },
      generated_jobs: (parsed.generated_jobs || []).map(job => ({
        ...job,
        _id: 'ai_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        is_ai_generated: true,
        apply_link: job.apply_link || `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}`
      }))
    };
  } catch (err) {
    console.error('AI search generation error:', err.message);
    return { terms: { roles: [q], skills: [], keywords: [] }, generated_jobs: [] };
  }
}

// @desc  AI-powered job search — always scoped to India
// @route GET /api/jobs/search
const searchJobs = async (req, res) => {
  const { q, page = 1, limit = 8 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 8;
  const skip = (pageNum - 1) * limitNum;

  try {
    // India location filter — always applied
    const INDIA_REGEX = /india|bangalore|bengaluru|mumbai|pune|hyderabad|noida|chennai|delhi|gurgaon|kolkata|remote/i;
    const indiaFilter = { location: { $regex: INDIA_REGEX } };

    if (!q || !q.trim()) {
      // No query — return recent India jobs
      const jobs = await Job.find(indiaFilter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
      const total = await Job.countDocuments(indiaFilter);
      return res.json({
        jobs: jobs.map(j => ({ ...j.toObject(), match_score: 'New', source: 'NaukriQuest', why_match: 'Recently posted in India.' })),
        total, query: '', page: pageNum, hasMore: (skip + jobs.length) < total
      });
    }

    // Use AI to parse the query and generate external jobs
    const { terms, generated_jobs } = await searchAndGenerateWithAI(q.trim());
    const { roles, skills, keywords } = terms;

    // Build all search terms into regex array
    const allTerms = [...(roles || []), ...(skills || []), ...(keywords || [])].filter(Boolean);
    const orClauses = allTerms.flatMap(term => {
      const r = { $regex: term, $options: 'i' };
      return [
        { title: r },
        { description: r },
        { requiredSkills: r },
        { skills: r }
      ];
    });

    // Also add the raw query as a fallback
    const rawRegex = { $regex: q.trim(), $options: 'i' };
    orClauses.push(
      { title: rawRegex },
      { company: rawRegex },
      { description: rawRegex },
      { requiredSkills: rawRegex }
    );

    // Combine India filter with search OR clauses using $and
    const searchQuery = {
      $and: [
        indiaFilter,
        { $or: orClauses }
      ]
    };

    let allMatches = await Job.find(searchQuery).limit(50);
    
    // Fallback: if no results with strict AND, relax to just OR on India jobs
    if (allMatches.length === 0) {
      allMatches = await Job.find(indiaFilter).limit(20);
    }

    const combinedMatches = [...allMatches, ...generated_jobs];

    // Score each job by how many search terms it matches
    const userTerms = [...(roles || []), ...(skills || []), ...(keywords || []), q.trim()].map(t => t.toLowerCase());
    const scored = combinedMatches.map(job => {
      const allJobSkills = [...(job.requiredSkills || []), ...(job.skills || [])];
      
      const plainJob = typeof job.toObject === 'function' ? job.toObject() : job;

      const jobText = [
        plainJob.title || '',
        plainJob.description || '',
        plainJob.company || '',
        ...allJobSkills
      ].join(' ').toLowerCase();

      let score = 0;
      userTerms.forEach(term => {
        if (term && jobText.includes(term.toLowerCase())) score++;
      });

      // Strong boost if title directly matches a role keyword
      const titleLower = (plainJob.title || '').toLowerCase();
      (roles || []).forEach(role => { if (titleLower.includes(role.toLowerCase())) score += 5; });

      // Boost if skill matches
      (skills || []).forEach(skill => {
        if (allJobSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) score += 2;
      });
      
      // Slight boost logic for AI-generated to feature modern platforms naturally
      if (plainJob.is_ai_generated) score += 1;

      return { job: plainJob, score, allJobSkills };
    });

    // Sort by score desc, then by date (or randomized slightly if scores are tied)
    scored.sort((a, b) => b.score - a.score || new Date(b.job.createdAt || Date.now()) - new Date(a.job.createdAt || Date.now()));

    const paginated = scored.slice(skip, skip + limitNum);
    const total = scored.length;
    const maxScore = scored[0]?.score || 1;

    const formattedJobs = paginated.map(({ job, score, allJobSkills }) => {
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
      const matchPct = Math.max(pct, 50); // always show at least 50% for results returned
      const matchedSkills = allJobSkills.filter(s =>
        userTerms.some(t => s.toLowerCase().includes(t))
      );
      
      return {
        ...job,
        match_score: `${matchPct}%`,
        source: job.source || 'NaukriQuest',
        why_match: matchedSkills.length > 0
          ? `Matches: ${matchedSkills.slice(0, 3).join(', ')}`
          : `Relevant to "${q}"`
      };
    });

    res.json({ jobs: formattedJobs, total, query: q, page: pageNum, hasMore: (skip + formattedJobs.length) < total });
  } catch (err) {
    console.error('Job search failed:', err.message);
    res.json({ jobs: [], total: 0, query: q || '', page: pageNum, hasMore: false });
  }
};

module.exports = { searchJobs };

