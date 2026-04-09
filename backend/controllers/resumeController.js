const OpenAI = require('openai');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const Job = require('../models/Job');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const ImageKit = require('imagekit');

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

const COURSE_DB = {
  'Data Science': [
    { title: 'Machine Learning Crash Course by Google', url: 'https://developers.google.com/machine-learning/crash-course', provider: 'Google', type: 'Free' },
    { title: 'Machine Learning A-Z', url: 'https://www.udemy.com/course/machinelearning/', provider: 'Udemy', type: 'Paid' },
    { title: 'Machine Learning by Andrew NG', url: 'https://www.coursera.org/learn/machine-learning', provider: 'Coursera', type: 'Paid' },
  ],
  'Web Development': [
    { title: 'Django Crash Course', url: 'https://youtu.be/e1IyzVyrLSU', provider: 'YouTube', type: 'Free' },
    { title: 'React Crash Course', url: 'https://youtu.be/Dorf8i6lCuk', provider: 'YouTube', type: 'Free' },
    { title: 'Become a React Developer', url: 'https://www.udacity.com/course/react-nanodegree--nd019', provider: 'Udacity', type: 'Paid' },
  ],
  'Android Development': [
    { title: 'Android Development for Beginners', url: 'https://youtu.be/fis26HvvDII', provider: 'YouTube', type: 'Free' },
    { title: 'Flutter App Development Course', url: 'https://youtu.be/rZLR5olMR64', provider: 'YouTube', type: 'Free' },
  ],
};

const FIELD_KEYWORDS = {
  'Data Science':        ['tensorflow', 'keras', 'pytorch', 'machine learning', 'deep learning', 'pandas', 'numpy', 'data science'],
  'Web Development':     ['react', 'django', 'node', 'nodejs', 'javascript', 'html', 'css', 'typescript'],
  'Android Development': ['android', 'flutter', 'kotlin', 'java', 'firebase'],
};

const RECOMMENDED_SKILLS = {
  'Data Science':        ['Data Visualization', 'ML Algorithms', 'Tensorflow', 'Streamlit'],
  'Web Development':     ['React', 'Node JS', 'TypeScript', 'REST APIs'],
  'Android Development': ['Android', 'Flutter', 'Kotlin', 'Firebase'],
};

function detectField(skills) {
  const lower = skills.map(s => s.toLowerCase());
  const scores = {};
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    scores[field] = keywords.filter(kw => lower.some(s => s.includes(kw))).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

function calculateATSScore(resumeText, targetJob, parsedData) {
  let score = 55;
  const sections = ['experience', 'skills', 'education', 'project', 'summary', 'contact'];
  sections.forEach(s => { if (resumeText.toLowerCase().includes(s)) score += 5; });
  if (targetJob) {
    const jobLower = targetJob.toLowerCase();
    const skillsFound = (parsedData.skills || []).filter(s => jobLower.includes(s.toLowerCase())).length;
    score += Math.min(skillsFound * 3, 15);
  }
  return Math.min(score, 100);
}

function getAnalysisDetails(resumeText) {
  const sections = [
    { key: 'summary', label: 'Summary', tip: 'Add a professional summary.' },
    { key: 'experience', label: 'Experience', tip: 'List your work experience clearly.' },
    { key: 'skills', label: 'Skills', tip: 'Include a dedicated skills section.' },
  ];
  return sections.map(s => ({
    label: s.label,
    found: resumeText.toLowerCase().includes(s.key),
    msg: resumeText.toLowerCase().includes(s.key) ? `Good ${s.label} section ✅` : `💡 ${s.tip}`
  }));
}

function getCandidateLevel(experienceStr) {
  if (!experienceStr) return 'Fresher';
  const match = experienceStr.match(/(\d+)/);
  if (match) {
    const yrs = parseInt(match[1]);
    if (yrs >= 3) return 'Experienced';
    return 'Intermediate';
  }
  return 'Fresher';
}

const extractResume = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    try {
      let text = '';
      const mimetype = req.file.mimetype;
      const fileName = req.file.originalname.toLowerCase();
      
      if (mimetype === 'application/pdf' || fileName.endsWith('.pdf')) {
        const data = await pdfParse(req.file.buffer);
        text = data.text;
      } else if (mimetype.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const doc = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = doc.value;
      } else {
        text = req.file.buffer.toString('utf-8');
      }

      const up = await imagekit.upload({ file: req.file.buffer, fileName: req.file.originalname, folder: '/resumes' });
      res.json({ text: text.trim().slice(0, 8000), fileUrl: up.url });
    } catch (err) { 
      console.error('Extraction error:', err);
      res.status(500).json({ error: 'Extraction failed' }); 
    }
  }
];

const analyzeResume = async (req, res) => {
  const { text, targetJob, fileUrl } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });

  const prompt = `Analyze resume for target role: "${targetJob || 'Tech Role'}".
  Return JSON: { "name": "str", "email": "str", "phone": "str", "title": "str", "experience": "str", "skills": ["str"], "summary": "str" }
  TEXT: ${text.slice(0, 4000)}`;

  try {
    const comp = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    let raw = comp.choices[0].message.content || '{}';
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}') + 1;
    const result = JSON.parse(start >= 0 ? raw.slice(start, end) : raw);
    
    result.ats_score = calculateATSScore(text, targetJob, result);
    result.section_tips = getAnalysisDetails(text);
    result.candidate_level = getCandidateLevel(result.experience);
    result.predicted_field = detectField(result.skills) || targetJob || 'IT';
    result.field_courses = COURSE_DB[result.predicted_field] || [];
    result.recommended_skills = RECOMMENDED_SKILLS[result.predicted_field] || [];

    const dbJobs = await Job.find({}).limit(50);
    const userSkills = (result.skills || []).map(s => s.toLowerCase());
    
    result.matchedJobs = dbJobs.map(j => {
      const jobSkills = (j.skills || []).map(s => s.toLowerCase());
      const matches = jobSkills.filter(s => userSkills.includes(s));
      const matchPct = jobSkills.length > 0 ? (matches.length / jobSkills.length) * 100 : 60;
      const finalScore = Math.min(Math.floor(matchPct + (targetJob && j.title.toLowerCase().includes(targetJob.toLowerCase()) ? 30 : 0)), 98);
      
      return {
        ...j.toObject(),
        match_score: `${finalScore}%`,
        why_match: matches.length > 0 ? `Matches ${matches.slice(0, 2).join(', ')} skills.` : 'Matches your industry profile.'
      };
    }).sort((a,b) => parseInt(b.match_score) - parseInt(a.match_score)).slice(0, 5);

    await new ResumeAnalysis({ ...result, file_url: fileUrl }).save();
    res.json(result);
  } catch (err) { 
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed' }); 
  }
};

const rewriteResume = async (req, res) => {
  const { text, targetJob } = req.body;
  const prompt = `Rewrite resume for role: ${targetJob || 'relevant tech role'}.\n\nTEXT:\n${text.slice(0, 4000)}`;
  try {
    const comp = await ai.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [{ role: 'user', content: prompt }]
    });
    res.json({ rewritten: comp.choices[0].message.content });
  } catch { res.status(500).json({ error: 'Rewrite failed' }); }
};

module.exports = { extractResume, analyzeResume, rewriteResume };
