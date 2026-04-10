const Job = require('../models/Job');
const OpenAI = require('openai');

const ai = new OpenAI({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
  apiKey: process.env.CF_API_TOKEN,
});

// Use Llama 3.3 70B to parse user query and GENERATE mock jobs from external platforms
// Use Llama 3.3 70B to parse user query into structured search terms
async function parseQueryWithAI(q) {
  try {
    const comp = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [
        {
          role: 'user',
          content: `Extract job search terms from: "${q}"

Return ONLY this JSON, no explanation, no markdown:
{"roles":["job title keywords"],"skills":["technical skills"],"keywords":["other terms"]}`
        }
      ],
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    let raw = comp.choices[0].message.content || '{}';
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}') + 1;
    const parsed = JSON.parse(start >= 0 ? raw.slice(start, end) : raw);
    return {
      roles: parsed.roles || [],
      skills: parsed.skills || [],
      keywords: parsed.keywords || []
    };
  } catch (err) {
    console.error('AI parse error:', err.message);
    return { roles: [q], skills: [], keywords: [] };
  }
}

const axios = require('axios');
const cheerio = require('cheerio');

// @desc  AI-powered job search — exclusively local jobs posted by companies
// @route GET /api/jobs/search
const searchJobs = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query; // modified default limit to 10

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  try {
    if (!q || !q.trim()) {
      // No query — return recent jobs from our DB
      const jobs = await Job.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
      const total = await Job.countDocuments({});
      return res.json({
        jobs: jobs.map(j => ({ ...j.toObject(), match_score: 'New', source: 'NaukriQuest', why_match: 'Recently posted' })),
        total, query: '', page: pageNum, hasMore: (skip + jobs.length) < total
      });
    }

    // Attempt to pull GLOBAL jobs securely using a native HTML parser to bypass subscription limits
    try {
      console.log(`Triggering Native Global Scan for -> "${q}" | Page ${pageNum}`);
      
      // We run the actor. To support pagination natively, we seed the DB on Page 1.
      if (pageNum === 1) {
        const encodedQ = encodeURIComponent(q.trim());
        // We use LinkedIn's public guest jobs search API to bypass Apify completely.
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQ}&location=Worldwide&f_TPR=r604800&start=0`;
        
        const { data: html } = await axios.get(url, {
           headers: {
             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
             'Accept-Language': 'en-US,en;q=0.9',
           }
        });
        
        const $ = cheerio.load(html);
        const externalJobs = [];
        $('.job-search-card').each((_, el) => {
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle').text().trim();
            const location = $(el).find('.job-search-card__location').text().trim();
            const jobUrl = $(el).find('.base-card__full-link').attr('href');
            
            if (title && company) {
               externalJobs.push({ title, company, location, jobUrl: jobUrl ? jobUrl.split('?')[0] : '' });
            }
        });

        // Seed our MongoDB with the global results so pagination is instant
        if (externalJobs.length > 0) {
           const { blastJobNotification } = require('../services/emailService');
           for (let item of externalJobs.slice(0, 20)) {
             const existing = await Job.findOne({ title: item.title, company: item.company });
             if (!existing) {
               const newJob = await Job.create({
                  title: item.title,
                  company: item.company,
                  recruiterId: new (require('mongoose').Types.ObjectId)(),
                  location: item.location || "Remote",
                  description: "Full remote or onsite opportunity available directly through external application.",
                  type: "Full-time",
                  salary: "Not Disclosed",
                  skills: [q.trim()],
                  createdAt: new Date(), 
                  apply_link: item.jobUrl || ""
               });
               // Notify all candidates about this new global job (fire-and-forget)
               setImmediate(() => blastJobNotification(newJob));
             }
           }
        }
      }
    } catch (scrapeErr) {
      console.warn("Native Global Scan softly failed (fallback enabled):", scrapeErr.message);
    }

    // Now standard logic: use AI to parse query, search local DB (which now includes Apify jobs)
    const { roles, skills, keywords } = await parseQueryWithAI(q.trim());
    const allTerms = [...roles, ...skills, ...keywords].filter(Boolean);
    
    let allMatches = [];
    if (allTerms.length > 0) {
      const orClauses = allTerms.flatMap(term => {
        const r = { $regex: term, $options: 'i' };
        return [{ title: r }, { description: r }, { requiredSkills: r }, { skills: r }];
      });

      const rawRegex = { $regex: q.trim(), $options: 'i' };
      orClauses.push({ title: rawRegex }, { company: rawRegex }, { description: rawRegex });

      allMatches = await Job.find({ $or: orClauses }).limit(200);
    }
    
    // Fallback: if no results with strict OR, return latest
    if (allMatches.length === 0) {
      allMatches = await Job.find({}).limit(200);
    }

    // Score each job perfectly
    const userTerms = [...roles, ...skills, ...keywords, q.trim()].map(t => t.toLowerCase());
    const scored = allMatches.map(job => {
      const allJobSkills = [...(job.requiredSkills || []), ...(job.skills || [])];
      const jobText = [job.title || '', job.description || '', job.company || '', ...allJobSkills].join(' ').toLowerCase();

      let score = 0;
      userTerms.forEach(term => { if (term && jobText.includes(term.toLowerCase())) score++; });
      const titleLower = (job.title || '').toLowerCase();
      roles.forEach(role => { if (titleLower.includes(role.toLowerCase())) score += 5; });

      return { job, score, allJobSkills };
    });

    scored.sort((a, b) => b.score - a.score || new Date(b.job.createdAt) - new Date(a.job.createdAt));

    const paginated = scored.slice(skip, skip + limitNum);
    const total = scored.length;
    const maxScore = scored[0]?.score || 1;

    const formattedJobs = paginated.map(({ job, score, allJobSkills }) => {
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
      const matchPct = Math.max(pct, 50);
      const matchedSkills = allJobSkills.filter(s => userTerms.some(t => s.toLowerCase().includes(t)));
      return {
        ...job.toObject(),
        match_score: `${matchPct}%`,
        source: job.apply_link ? 'LinkedIn Global' : 'NaukriQuest',
        why_match: matchedSkills.length > 0 ? `Matches: ${matchedSkills.slice(0, 3).join(', ')}` : `Relevant to "${q}"`
      };
    });

    res.json({ jobs: formattedJobs, total, query: q, page: pageNum, hasMore: (skip + formattedJobs.length) < total });
  } catch (err) {
    console.error('Job search failed:', err.message);
    res.json({ jobs: [], total: 0, query: q || '', page: pageNum, hasMore: false });
  }
};

module.exports = { searchJobs };

