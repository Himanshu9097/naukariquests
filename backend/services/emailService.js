const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
};

/**
 * Send a new-job notification email to a single candidate
 */
const sendJobNotificationEmail = async ({ to, candidateName, job }) => {
  try {
    const transporter = createTransporter();
    const applyLink = job.apply_link || `https://naukariquest.vercel.app/jobs`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1e; color: #fff; margin: 0; padding: 0; }
    .wrap { max-width: 580px; margin: 0 auto; padding: 32px 16px; }
    .card { background: linear-gradient(135deg, #111827, #1f2937); border-radius: 20px; border: 1px solid rgba(0,212,255,0.15); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0077ff, #00d4ff); padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; margin-bottom: 20px; color: rgba(255,255,255,0.85); }
    .job-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,212,255,0.2); border-radius: 14px; padding: 20px; margin-bottom: 24px; }
    .job-title { font-size: 20px; font-weight: 900; color: #fff; margin: 0 0 4px; }
    .company { font-size: 14px; color: #00d4ff; font-weight: 700; margin: 0 0 14px; }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 0; }
    .meta-item { font-size: 12px; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.06); padding: 5px 12px; border-radius: 20px; }
    .cta { display: block; text-align: center; background: linear-gradient(135deg, #0077ff, #00d4ff); color: #fff; text-decoration: none; font-weight: 900; font-size: 14px; padding: 14px 28px; border-radius: 12px; margin-top: 12px; }
    .footer { padding: 16px 32px 28px; font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <h1>⚡ New Job Alert — NaukriQuest</h1>
        <p>A new opportunity just dropped that matches your profile!</p>
      </div>
      <div class="body">
        <p class="greeting">Hey ${candidateName || 'there'} 👋, a company just posted a new job on NaukriQuest that matches your profile!</p>
        <div class="job-box">
          <h2 class="job-title">${job.title}</h2>
          <p class="company">${job.company}</p>
          <div class="meta">
            <span class="meta-item">📍 ${job.location || 'Remote'}</span>
            <span class="meta-item">💼 ${job.type || 'Full-time'}</span>
            ${job.salary ? `<span class="meta-item">💰 ${job.salary}</span>` : ''}
          </div>
        </div>
        <a href="${applyLink}" class="cta">🚀 View &amp; Apply Now</a>
      </div>
      <div class="footer">
        You're receiving this because you have a NaukriQuest candidate account.<br/>
        <a href="https://naukariquest.vercel.app" style="color: #00d4ff;">naukariquest.vercel.app</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"NaukriQuest AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⚡ New Job: ${job.title} at ${job.company} — Apply Now!`,
      html,
    });
    console.log(`📧 Job notification sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email to ${to} failed:`, err.message);
  }
};

module.exports = { sendJobNotificationEmail };
