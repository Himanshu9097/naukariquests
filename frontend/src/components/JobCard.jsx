import { useState } from 'react';
import { MapPin, IndianRupee, Briefcase, Clock, Trophy, X, Zap, Info, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/lib/theme';

const SOURCE_COLORS = {
  LinkedIn: '#0077b5', Naukri: '#ff7555', Indeed: '#003a9b', Glassdoor: '#0caa41', Instahyre: '#6c5ecf',
};

const COMPANY_DOMAINS = {
  'google': 'google.com', 'microsoft': 'microsoft.com', 'amazon': 'amazon.com', 'aws': 'aws.amazon.com',
  'meta': 'meta.com', 'facebook': 'meta.com', 'apple': 'apple.com', 'netflix': 'netflix.com',
  'linkedin': 'linkedin.com', 'salesforce': 'salesforce.com', 'adobe': 'adobe.com', 'oracle': 'oracle.com',
  'ibm': 'ibm.com', 'accenture': 'accenture.com', 'cognizant': 'cognizant.com', 'capgemini': 'capgemini.com',
  'infosys': 'infosys.com', 'tcs': 'tcs.com', 'wipro': 'wipro.com', 'hcl': 'hcltech.com',
  'tech mahindra': 'techmahindra.com', 'razorpay': 'razorpay.com', 'swiggy': 'swiggy.in',
  'zomato': 'zomato.com', 'ola': 'olacabs.com', 'paytm': 'paytm.com', 'phonepe': 'phonepe.com',
  'cred': 'getcred.com', 'meesho': 'meesho.com', 'dream11': 'dream11.com', 'groww': 'groww.in',
  'zepto': 'zeptonow.com', 'nykaa': 'nykaa.com', 'myntra': 'myntra.com', 'bigbasket': 'bigbasket.com',
  'byju\'s': 'byjus.com', 'freshworks': 'freshworks.com', 'zoho': 'zoho.com', 'flipkart': 'flipkart.com',
  'stripe': 'stripe.com', 'airbnb': 'airbnb.com', 'uber': 'uber.com', 'oyo': 'oyorooms.com',
  'makemytrip': 'makemytrip.com', 'delhivery': 'delhivery.com', 'postman': 'postman.com',
  'browserstack': 'browserstack.com', 'atlassian': 'atlassian.com', 'slack': 'slack.com',
  'twilio': 'twilio.com', 'datadog': 'datadoghq.com', 'nutanix': 'nutanix.com',
};

const COMPANY_COLORS = ['#00d4ff','#bf5af2','#30d158','#ff9500','#ff375f','#0066ff','#ffd60a','#00c7be','#ff6b6b','#4ecdc4'];

function getCompanyColor(name) {
  if (!name) return COMPANY_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COMPANY_COLORS[sum % COMPANY_COLORS.length];
}

function normalizeCompanyName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\b(india|technologies|technology|tech|solutions|software|systems|services|limited|pvt|ltd|inc|corp|corporation|group|global|aws|web services)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function getCompanyDomain(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
  const normalized = normalizeCompanyName(name);
  for (const [k, v] of Object.entries(COMPANY_DOMAINS)) {
    if (normalizeCompanyName(k) === normalized) return v;
    if (normalized.includes(normalizeCompanyName(k)) && normalizeCompanyName(k).length > 3) return v;
  }
  return null;
}

function CompanyLogo({ name, size = 44 }) {
  const [stage, setStage] = useState('clearbit');
  const safeName = name ? String(name) : 'Unknown';
  const domain = getCompanyDomain(safeName);
  const color = getCompanyColor(safeName);
  const px = `${size}px`;

  if (!domain || stage === 'letter') {
    return (
      <div className="rounded-xl flex items-center justify-center shrink-0 text-base font-black"
        style={{ width: px, height: px, background: `${color}18`, border: `1px solid ${color}35`, color }}>
        {safeName.charAt(0).toUpperCase()}
      </div>
    );
  }

  const src = stage === 'clearbit'
    ? `https://logo.clearbit.com/${domain}`
    : `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  return (
    <div className="rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: px, height: px, background: '#fff', border: '1px solid rgba(0,0,0,0.09)', padding: stage === 'clearbit' ? '4px' : '6px' }}>
      <img src={src} alt={safeName} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setStage(stage === 'clearbit' ? 'ddg' : 'letter')} loading="lazy" />
    </div>
  );
}

export default function JobCard({ job, index, highlight = false }) {
  if (!job) return null;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!userId || userRole !== 'candidate') {
      alert('Please login as a Candidate to apply.');
      return;
    }

    try {
      const res = await fetch('/api/dashboard/candidate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job._id, candidateId: userId })
      });
      const data = await res.json();
      if (res.ok) alert('Successfully applied for ' + job.title);
      else alert(data.error || 'Failed to apply');
    } catch (err) {
      alert('Error applying for job');
    }
  };

  // Safe skill resolution — handles both field names
  const allSkills = Array.isArray(job.skills) && job.skills.length > 0
    ? job.skills
    : Array.isArray(job.requiredSkills) ? job.requiredSkills : [];

  const matchNum = parseInt(job.match_score) || 0;
  const isHighMatch = matchNum >= 90;
  const isMedMatch = matchNum >= 75;
  const matchColor = isHighMatch ? '#30d158' : isMedMatch ? '#00d4ff' : '#ffd60a';
  const sourceColor = SOURCE_COLORS[job.source || ''] || '#00d4ff';
  const companyColor = getCompanyColor(job.company);

  const cardBg = isDark ? 'rgba(255,255,255,0.025)' : '#ffffff';
  const cardBorder = highlight
    ? (isDark ? 'rgba(0,212,255,0.3)' : 'rgba(0,100,210,0.3)')
    : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)');
  const textPrimary = isDark ? '#ffffff' : '#0a0f1e';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(10,15,30,0.5)';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f9';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const tagBg = isDark ? 'rgba(0,212,255,0.07)' : 'rgba(0,100,210,0.06)';
  const tagBorder = isDark ? 'rgba(0,212,255,0.18)' : 'rgba(0,100,210,0.14)';
  const tagColor = isDark ? '#00d4ff' : '#0055cc';

  const modalBg = isDark ? 'rgba(10,12,20,0.98)' : 'rgba(250,252,255,0.99)';
  const modalBorder = isDark ? 'rgba(0,212,255,0.22)' : 'rgba(0,100,210,0.18)';
  const modalShadow = isDark
    ? '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,212,255,0.14)'
    : '0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,100,210,0.12)';

  const modal = expanded ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(10,15,30,0.55)', backdropFilter: 'blur(24px) saturate(180%)' }} onClick={() => setExpanded(false)} />
      <div className="modal-scale-in rounded-2xl overflow-hidden relative"
        style={{ width: 'min(92vw, 440px)', maxHeight: '88vh', overflowY: 'auto', background: modalBg, border: `1px solid ${modalBorder}`, boxShadow: modalShadow, backdropFilter: 'blur(48px)' }}>
        <div className="h-1 shrink-0" style={{ background: `linear-gradient(90deg, ${companyColor}, ${companyColor}40)` }} />
        <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${divider}` }}>
          <div className="flex items-start gap-3">
            <CompanyLogo name={job.company} size={46} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-snug" style={{ color: textPrimary }}>{job.title}</h3>
              <p className="text-xs font-semibold mt-0.5" style={{ color: companyColor }}>{job.company}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {job.source && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${sourceColor}18`, color: sourceColor, border: `1px solid ${sourceColor}28` }}>{job.source}</span>}
                {job.type && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: surfaceBg, color: textMuted, border: `1px solid ${divider}` }}>{job.type}</span>}
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: surfaceBg, border: `1px solid ${divider}`, color: textMuted }}>
              <X size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="neon-progress flex-1" style={{ background: `${matchColor}15` }}>
              <div className="neon-progress-fill" style={{ width: job.match_score, background: `linear-gradient(90deg, ${matchColor}, ${matchColor}80)` }} />
            </div>
            <span className="text-xs font-bold font-mono shrink-0" style={{ color: matchColor }}>{job.match_score} match</span>
          </div>
        </div>
        <div className="p-4 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <MapPin size={11} />, label: 'Location', val: job.location, color: '#00d4ff' },
              { icon: <IndianRupee size={11} />, label: 'Salary', val: job.salary, color: '#30d158' },
              { icon: <Briefcase size={11} />, label: 'Experience', val: job.experience || 'Open', color: '#bf5af2' },
              { icon: <Clock size={11} />, label: 'Posted', val: job.posted || 'Recently', color: '#ffd60a' },
            ].map(({ icon, label, val, color }) => (
              <div key={label} className="p-2.5 rounded-xl" style={{ background: surfaceBg, border: `1px solid ${divider}` }}>
                <div className="flex items-center gap-1 mb-1" style={{ color }}>{icon}<span className="text-[9px] font-bold uppercase tracking-wide">{label}</span></div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: textPrimary }}>{val}</p>
              </div>
            ))}
          </div>
          {allSkills.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{ color: textMuted }}>Required Skills</p>
              <div className="flex flex-wrap gap-1">
                {allSkills.map((skill) => (
                  <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: tagColor }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {job.why_match && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(48,209,88,0.04)', border: '1px solid rgba(48,209,88,0.14)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wide mb-1 text-[#30d158]">Why This Matches You</p>
              <p className="text-[11px] leading-relaxed" style={{ color: textMuted }}>{job.why_match}</p>
            </div>
          )}
        </div>
        <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${divider}` }}>
          <a href={job.apply_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #0077ff, #00d4ff)', color: '#fff', boxShadow: '0 4px 16px rgba(0,119,255,0.3)' }}>
            <Zap size={13} /> Apply Now <ExternalLink size={11} style={{ opacity: 0.8 }} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div data-testid={`job-card-${index}`} className="job-card-enter" style={{ animationDelay: `${index * 0.05}s` }}>
      <div
        className="rounded-2xl overflow-hidden apple-card"
        style={{
          background: cardBg, border: `1px solid ${cardBorder}`, transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isDark
            ? (highlight ? '0 0 0 1px rgba(0,212,255,0.15), 0 8px 32px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.3)')
            : (highlight ? '0 4px 20px rgba(0,100,210,0.1)' : '0 2px 12px rgba(0,0,0,0.05)'),
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(0,212,255,0.25)' : 'rgba(0,100,210,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${companyColor}, ${companyColor}40)` }} />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <CompanyLogo name={job.company} size={42} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: companyColor }}>{job.company}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {job.source && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${sourceColor}18`, color: sourceColor, border: `1px solid ${sourceColor}28` }}>{job.source}</span>}
                {job.posted && <span className="text-[9px]" style={{ color: textMuted }}>{job.posted}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-black font-mono" style={{ color: matchColor }}>{job.match_score}</div>
              <div className="text-[9px]" style={{ color: textMuted }}>match</div>
            </div>
          </div>
          <div className="flex items-start gap-1.5 mb-2">
            <h3 className="font-bold text-sm leading-snug flex-1" style={{ color: textPrimary }}>{job.title}</h3>
            {highlight && <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] shrink-0" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.22)', color: '#00d4ff' }}><Trophy size={8} className="fill-current" /> Top</span>}
          </div>
          <div className="neon-progress mb-3" style={{ background: `${matchColor}12` }}>
            <div className="neon-progress-fill" style={{ width: job.match_score, background: `linear-gradient(90deg, ${matchColor}, ${matchColor}60)`, boxShadow: isDark ? `0 0 6px ${matchColor}40` : 'none' }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: textMuted }}><MapPin size={9} color="#00d4ff" /> {job.location}</span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: textMuted }}><IndianRupee size={9} color="#30d158" /> {job.salary}</span>
            {job.experience && <span className="flex items-center gap-1 text-[11px]" style={{ color: textMuted }}><Briefcase size={9} color="#bf5af2" /> {job.experience}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mb-4">
            {allSkills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: tagColor }}>{skill}</span>
            ))}
            {allSkills.length > 3 && <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: surfaceBg, border: `1px solid ${divider}`, color: textMuted }}>+{allSkills.length - 3}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleApply}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0077ff, #00d4ff)', color: '#fff' }}>
              <Zap size={11} /> Apply Now
            </button>
            <button onClick={() => setExpanded(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: surfaceBg, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textMuted }}>
              <Info size={11} /> More Info
            </button>
          </div>
        </div>
      </div>
      {modal}
    </div>
  );
}
