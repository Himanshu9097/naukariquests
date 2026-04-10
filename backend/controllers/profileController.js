const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const ImageKit = require('imagekit');
const OpenAI = require('openai');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Job = require('../models/Job');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const ai = new OpenAI({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1`,
  apiKey: process.env.CF_API_TOKEN,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── GET /api/profile/:userId ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const candidate = await Candidate.findOne({ userId });
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user.toObject(), ...(candidate ? candidate.toObject() : {}) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// ── PUT /api/profile/:userId ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, title, experience, skills, summary, linkedin, github, education } = req.body;

    // Update User name
    if (name) await User.findByIdAndUpdate(userId, { name });

    // Upsert Candidate profile
    const candidate = await Candidate.findOneAndUpdate(
      { userId },
      { userId, name, phone, title, experience, skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []), summary, linkedin, github, education },
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated', candidate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── POST /api/profile/:userId/resume ─────────────────────────────────────────
// Upload resume → extract text → parse with AI → auto-fill profile
const uploadResume = [
  upload.single('file'),
  async (req, res) => {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    try {
      // 1. Extract text
      let text = '';
      const mime = req.file.mimetype;
      const fname = req.file.originalname.toLowerCase();
      if (mime === 'application/pdf' || fname.endsWith('.pdf')) {
        const data = await pdfParse(req.file.buffer);
        text = data.text;
      } else if (mime.includes('word') || fname.endsWith('.docx') || fname.endsWith('.doc')) {
        const doc = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = doc.value;
      } else {
        text = req.file.buffer.toString('utf-8');
      }

      if (!text || text.trim().length < 30) {
        return res.status(400).json({ error: 'Could not extract readable text from file. Please try a text-based PDF or DOCX.' });
      }

      // 2. Upload to ImageKit in parallel (no need to await before parsing)
      const uploadPromise = imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: '/resumes',
      });

      // 3. Improved AI prompt — detailed extraction with explicit instructions
      const prompt = `You are a resume parser. Extract ALL information precisely from the resume below.

Return ONLY valid JSON with these exact keys:
{
  "name": "Full name of candidate (string)",
  "email": "Email address (string)",
  "phone": "Phone number with country code if present (string)",
  "title": "Current or most recent job title / target role (string, e.g. 'Full Stack Developer', 'Data Scientist')",
  "experience": "Total years of experience as a concise string (e.g. '3 years', 'Fresher', '2+ years')",
  "skills": ["list", "of", "technical", "skills", "only — no soft skills, keep each under 25 chars"],
  "summary": "2-3 sentence professional summary or objective from the resume (string)",
  "education": "Highest degree and institution (e.g. 'B.Tech CSE - IIT Delhi, 2022')",
  "linkedin": "LinkedIn URL if present, else empty string",
  "github": "GitHub URL if present, else empty string"
}

Rules:
- skills array MUST contain individual skills, NOT sentences. Max 20 skills.
- If a field is not found, return empty string "" (never return null).
- Do NOT add any keys other than the ones listed above.
- Return nothing except the JSON object.

Resume text:
${text.slice(0, 5000)}`;

      const comp = await ai.chat.completions.create({
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      let raw = comp.choices[0].message.content || '{}';
      // Strip markdown code fences if present
      raw = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      let parsed = {};
      try {
        parsed = JSON.parse(start >= 0 ? raw.slice(start, end) : raw);
      } catch (_) {
        console.warn('AI JSON parse failed, using empty object');
      }

      // Clean and normalize skills — remove empty strings, duplicates, long sentences
      const cleanSkills = [...new Set(
        (Array.isArray(parsed.skills) ? parsed.skills : [])
          .map(s => String(s).trim())
          .filter(s => s.length > 0 && s.length <= 40 && !s.includes('.') && !s.toLowerCase().startsWith('experience'))
      )];

      // Get existing candidate to merge (don't overwrite good data with empty AI output)
      const existingCandidate = await Candidate.findOne({ userId });

      const mergedData = {
        userId,
        name:       parsed.name       || existingCandidate?.name       || '',
        email:      parsed.email      || existingCandidate?.email      || '',
        phone:      parsed.phone      || existingCandidate?.phone      || '',
        title:      parsed.title      || existingCandidate?.title      || '',
        experience: parsed.experience || existingCandidate?.experience || '',
        skills:     cleanSkills.length > 0 ? cleanSkills : (existingCandidate?.skills || []),
        summary:    parsed.summary    || existingCandidate?.summary    || '',
        education:  parsed.education  || existingCandidate?.education  || '',
        linkedin:   parsed.linkedin   || existingCandidate?.linkedin   || '',
        github:     parsed.github     || existingCandidate?.github     || '',
        resumeText: text.slice(0, 8000),
      };

      // 4. Await ImageKit upload
      let resumeUrl = existingCandidate?.resumeUrl || '';
      try {
        const uploaded = await uploadPromise;
        resumeUrl = uploaded.url;
        mergedData.resumeUrl = resumeUrl;
      } catch (ikErr) {
        console.warn('ImageKit upload failed:', ikErr.message);
      }

      // 5. Update User name
      if (mergedData.name) {
        await User.findByIdAndUpdate(userId, { name: mergedData.name });
      }

      // 6. Upsert Candidate
      const candidate = await Candidate.findOneAndUpdate(
        { userId },
        { $set: mergedData },
        { new: true, upsert: true }
      );

      res.json({
        message: 'Resume uploaded & profile auto-filled!',
        resumeUrl,
        fieldsExtracted: Object.keys(parsed).filter(k => parsed[k] && (Array.isArray(parsed[k]) ? parsed[k].length > 0 : String(parsed[k]).trim() !== '')),
        candidate,
      });
    } catch (e) {
      console.error('Resume upload error:', e);
      res.status(500).json({ error: 'Resume processing failed: ' + e.message });
    }
  }
];

// ── GET /api/profile/:userId/recommendations ─────────────────────────────────
// Returns dynamically matched jobs based on stored resume/skills
const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) return res.json({ jobs: [] });

    const userSkills = (candidate.skills || []).map(s => s.toLowerCase());
    const searchQuery = candidate.title || (candidate.skills || [])[0] || 'software engineer';
    const userTerms = [...userSkills, searchQuery.toLowerCase()];

    // Optionally trigger a fresh LinkedIn scrape in the background
    try {
      const axios = require('axios');
      const cheerio = require('cheerio');
      const encodedQ = encodeURIComponent(searchQuery);
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQ}&location=Worldwide&f_TPR=r604800&start=0`;
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'en-US,en;q=0.9' }
      });
      const $ = cheerio.load(html);
      const jobs = [];
      $('.job-search-card').each((_, el) => {
        const title = $(el).find('.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim();
        const location = $(el).find('.job-search-card__location').text().trim();
        const jobUrl = $(el).find('.base-card__full-link').attr('href');
        if (title && company) jobs.push({ title, company, location, jobUrl: jobUrl ? jobUrl.split('?')[0] : '' });
      });
      for (const item of jobs.slice(0, 20)) {
        const existing = await Job.findOne({ title: item.title, company: item.company });
        if (!existing) {
          await Job.create({
            title: item.title, company: item.company,
            recruiterId: new (require('mongoose').Types.ObjectId)(),
            location: item.location || 'Remote',
            description: 'Opportunity via LinkedIn. Apply on original listing.',
            type: 'Full-time', salary: 'Not Disclosed',
            skills: [searchQuery], apply_link: item.jobUrl || '',
          });
        }
      }
    } catch (_) { /* silent fallback */ }

    // Score all jobs
    const allJobs = await Job.find({}).limit(100);
    const scored = allJobs.map(j => {
      const jSkills = [...(j.skills || []), ...(j.requiredSkills || [])].map(s => s.toLowerCase());
      const jText = [j.title, j.description, j.company, ...jSkills].join(' ').toLowerCase();
      let score = 0;
      userTerms.forEach(t => { if (t && jText.includes(t)) score++; });
      if ((j.title || '').toLowerCase().includes(searchQuery.toLowerCase())) score += 5;
      const matches = jSkills.filter(s => userSkills.includes(s));
      return { job: j, score, matches };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    const jobs = scored.map(({ job, score, matches }) => {
      const pct = Math.min(Math.max(Math.round((score / 10) * 60) + 40, 50), 98);
      return {
        ...job.toObject(),
        match_score: `${pct}%`,
        source: job.apply_link ? 'LinkedIn Global' : 'NaukriQuest',
        why_match: matches.length > 0 ? `Matches: ${matches.slice(0, 3).join(', ')}` : `Relevant to "${searchQuery}"`,
      };
    });

    res.json({ jobs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// ── GET /api/profile/:userId/notifications ───────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) return res.json({ notifications: [] });
    const sorted = (candidate.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ notifications: sorted });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// ── PUT /api/profile/:userId/notifications/read ──────────────────────────────
const markNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Candidate.findOneAndUpdate(
      { userId },
      { $set: { 'notifications.$[].read': true } }
    );
    res.json({ message: 'All marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
};

module.exports = { getProfile, updateProfile, uploadResume, getRecommendations, getNotifications, markNotificationsRead };
