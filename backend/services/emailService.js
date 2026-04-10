const nodemailer = require('nodemailer');

const getTransporter = () => {
  // Create fresh each time to always use current env vars
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send a job alert email to a single candidate
 */
const sendJobNotificationEmail = async ({ to, candidateName, job }) => {
  try {
    const transporter = getTransporter();
    const applyLink = job.apply_link || 'https://naukariquest.vercel.app';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;color:#111827;padding:0;margin:0}
.outer{background:#f3f4f6;padding:32px 16px}
.card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05)}
.header{background:#0055ff;padding:28px 32px 24px}
.header-icon{width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px}
.header h1{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;margin:0}
.header p{margin-top:6px;font-size:14px;color:rgba(255,255,255,0.9)}
.body{padding:32px}
.greeting{font-size:16px;line-height:1.6;color:#374151;margin-bottom:24px}
.greeting strong{color:#111827}
.job-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid #0055ff}
.job-title{font-size:18px;font-weight:800;color:#111827;margin-bottom:6px}
.company-name{font-size:14px;color:#0055ff;font-weight:700;margin-bottom:12px}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tag{font-size:12px;color:#4b5563;background:#e5e7eb;padding:4px 10px;border-radius:6px;font-weight:500;}
.cta{display:block;text-align:center;background:#0055ff;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;}
.divider{height:1px;background:#e5e7eb;margin:24px 0}
.footer{padding:0 32px 28px;font-size:12px;color:#6b7280;text-align:center;line-height:1.6}
.footer a{color:#0055ff;text-decoration:none}
</style>
</head>
<body>
<div class="outer">
<div class="card">
  <div class="header">
    <div class="header-icon">⚡</div>
    <h1>New Job Alert</h1>
    <p>NaukriQuest AI found a new opportunity for you!</p>
  </div>
  <div class="body">
    <p class="greeting">Hey <strong>${candidateName || 'there'}</strong> 👋,<br/>A new job has been posted that matches your profile. Don't miss out!</p>
    <div class="job-card">
      <div class="job-title">${job.title}</div>
      <div class="company-name">${job.company}</div>
      <div class="tags">
        <span class="tag">📍 ${job.location || 'Remote'}</span>
        <span class="tag">💼 ${job.type || 'Full-time'}</span>
        ${job.salary && job.salary !== 'Not Disclosed' ? `<span class="tag">💰 ${job.salary}</span>` : ''}
      </div>
    </div>
    <a href="${applyLink}" class="cta">🚀 View &amp; Apply Now</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#6b7280;text-align:center">Log in to see your full personalized recommendations.</p>
  </div>
  <div class="footer">
    You're receiving this as a registered NaukriQuest candidate.<br/>
    <a href="https://naukariquest.vercel.app">naukariquest.vercel.app</a>
  </div>
</div>
</div>
</body></html>`;

    await transporter.sendMail({
      from: `"NaukriQuest Notifications" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⚡ New Job: ${job.title} at ${job.company}`,
      html,
    });
    console.log(`📧 Email sent → ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed for ${to}:`, err.message);
    return false;
  }
};

/**
 * Send an email when application status changes
 */
const sendStatusUpdateEmail = async ({ to, candidateName, jobTitle, companyName, oldStatus, newStatus }) => {
  try {
    const transporter = getTransporter();
    
    // Format Status nicely
    const safeStatus = (newStatus || '').toUpperCase();
    const verb = safeStatus === 'REJECTED' ? 'declined' : safeStatus === 'HIRED' ? 'hired' : safeStatus === 'SHORTLISTED' ? 'shortlisted' : 'updated';
    const messagePart = safeStatus === 'HIRED' 
      ? 'Congratulations! You have been hired. The company will reach out for next steps.'
      : safeStatus === 'SHORTLISTED' || safeStatus === 'INTERVIEW' || safeStatus === 'EXAM'
      ? `Congratulations! Your application has been moved to the <strong>${safeStatus}</strong> stage. Keep an eye out for further instructions.`
      : safeStatus === 'REJECTED'
      ? `Unfortunately, the company has decided to move forward with other candidates at this time. Keep applying, don't give up!`
      : `Your application status has been updated to <strong>${safeStatus}</strong>.`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;color:#111827;padding:0;margin:0}
.outer{background:#f3f4f6;padding:32px 16px}
.card{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05)}
.header{background:${safeStatus === 'REJECTED' ? '#ef4444' : safeStatus === 'HIRED' ? '#10b981' : '#0055ff'};padding:28px 32px 24px}
.header h1{font-size:22px;font-weight:800;color:#ffffff;margin:0}
.body{padding:32px}
.greeting{font-size:16px;line-height:1.6;color:#374151;margin-bottom:24px}
.greeting strong{color:#111827}
.job-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;}
.job-title{font-size:18px;font-weight:800;color:#111827;margin-bottom:6px}
.company-name{font-size:14px;color:#6b7280;font-weight:600;}
.footer{padding:0 32px 28px;font-size:12px;color:#6b7280;text-align:center;}
</style>
</head>
<body>
<div class="outer">
<div class="card">
  <div class="header">
    <h1>Application Update</h1>
  </div>
  <div class="body">
    <p class="greeting">Hey <strong>${candidateName || 'there'}</strong>,</p>
    <p class="greeting" style="margin-bottom:12px">There's an update regarding your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
    <div class="job-card">
      <p style="font-size:15px;color:#111827;line-height:1.6">${messagePart}</p>
    </div>
    <p style="font-size:14px;color:#4b5563;">Best regards,<br/>The NaukriQuest Team</p>
  </div>
  <div class="footer">NaukriQuest Notifications</div>
</div>
</div>
</body></html>`;

    await transporter.sendMail({
      from: `"NaukriQuest Updates" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Application Update: ${jobTitle} at ${companyName}`,
      html,
    });
    console.log(`📧 Status update email sent → ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Status email failed for ${to}:`, err.message);
    return false;
  }
};

/**
 * Blast job notifications to ALL candidates with emails.
 * Only triggered when a recruiter posts a job from the Dashboard.
 */
const blastJobNotification = async (savedJob) => {
  try {
    const User = require('../models/User');
    const Candidate = require('../models/Candidate');

    // Query User model — emails are ALWAYS stored here at registration
    const candidateUsers = await User.find({
      role: 'candidate',
      email: { $exists: true, $ne: '' }
    }).select('_id name email');

    if (!candidateUsers.length) {
      console.log('📭 No candidate users to notify.');
      return;
    }

    console.log(`📣 Blasting to ${candidateUsers.length} candidates for "${savedJob.title}"...`);

    let sent = 0;
    for (const user of candidateUsers) {
      // 1. Push in-app notification into Candidate doc (upsert if missing)
      try {
        await Candidate.findOneAndUpdate(
          { $or: [{ userId: user._id }, { email: user.email }] },
          {
            $push: {
              notifications: {
                message: `New job posted: "${savedJob.title}" at ${savedJob.company}`,
                jobId: savedJob._id,
                read: false,
                createdAt: new Date(),
              }
            },
            $setOnInsert: { userId: user._id, email: user.email, name: user.name }
          },
          { upsert: true }
        );
      } catch (notifErr) {
        console.warn(`In-app notif failed for ${user.email}:`, notifErr.message);
      }

      // 2. Send email
      const ok = await sendJobNotificationEmail({
        to: user.email,
        candidateName: user.name,
        job: savedJob,
      });
      if (ok) sent++;
    }

    console.log(`✅ Done: ${sent}/${candidateUsers.length} emails sent for "${savedJob.title}"`);
  } catch (err) {
    console.error('Blast notification error:', err.message);
  }
};

module.exports = { sendJobNotificationEmail, sendStatusUpdateEmail, blastJobNotification };
