import { useState, useEffect, useRef } from 'react';
import {
  User, Upload, Save, Bell, BellDot, Briefcase, FileText,
  Linkedin, Github, MapPin, Zap, CheckCircle, Loader2, X,
  ExternalLink, Star
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import JobCard from '@/components/JobCard';

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = localStorage.getItem('userId');
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', title: '', experience: '',
    skills: '', summary: '', linkedin: '', github: '', education: '',
  });
  const [resumeUrl, setResumeUrl] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Theme tokens
  const BG  = isDark ? '#000'                      : '#f0f4f8';
  const SB  = isDark ? 'rgba(255,255,255,0.03)'    : '#ffffff';
  const SBR = isDark ? 'rgba(255,255,255,0.08)'    : 'rgba(0,0,0,0.09)';
  const T   = isDark ? '#ffffff'                    : '#0a0f1e';
  const TM  = isDark ? 'rgba(255,255,255,0.45)'    : 'rgba(10,15,30,0.5)';
  const IN  = isDark ? 'rgba(255,255,255,0.06)'    : 'rgba(0,0,0,0.04)';
  const INB = isDark ? 'rgba(255,255,255,0.1)'     : 'rgba(0,0,0,0.1)';

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(d => {
        setProfile({
          name: d.name || '',
          email: d.email || '',
          phone: d.phone || '',
          title: d.title || '',
          experience: d.experience || '',
          skills: Array.isArray(d.skills) ? d.skills.join(', ') : (d.skills || ''),
          summary: d.summary || '',
          linkedin: d.linkedin || '',
          github: d.github || '',
          education: d.education || '',
        });
        if (d.resumeUrl) setResumeUrl(d.resumeUrl);
      })
      .catch(() => {});

    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const r = await fetch(`/api/profile/${userId}/notifications`);
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnread((d.notifications || []).filter(n => !n.read).length);
    } catch (_) {}
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const r = await fetch(`/api/profile/${userId}/recommendations`);
      const d = await r.json();
      setRecommendations(d.jobs || []);
    } catch (_) {}
    setLoadingRecs(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch(`/api/profile/${userId}/resume`, { method: 'POST', body: fd });
      const d = await r.json();
      if (d.candidate) {
        const c = d.candidate;
        setProfile({
          name: c.name || profile.name,
          email: c.email || profile.email,
          phone: c.phone || profile.phone,
          title: c.title || profile.title,
          experience: c.experience || profile.experience,
          skills: Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || profile.skills),
          summary: c.summary || profile.summary,
          linkedin: c.linkedin || profile.linkedin,
          github: c.github || profile.github,
          education: c.education || profile.education,
        });
        if (d.resumeUrl) setResumeUrl(d.resumeUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      }
    } catch (_) {}
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  const handleMarkRead = async () => {
    await fetch(`/api/profile/${userId}/notifications/read`, { method: 'PUT' });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: IN, border: `1px solid ${INB}`, color: T,
    fontSize: '13px', outline: 'none', transition: 'border-color 0.2s',
  };

  const labelStyle = { fontSize: '11px', fontWeight: 700, color: TM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' };

  const tabs = [
    { id: 'profile', label: 'Edit Profile', icon: <User size={14} /> },
    { id: 'recommendations', label: 'Recommended Jobs', icon: <Briefcase size={14} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black" style={{ color: T }}>My Profile</h1>
            <p className="text-xs mt-1" style={{ color: TM }}>Manage your profile & get AI job recommendations</p>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={async () => { setShowNotifs(!showNotifs); if (!showNotifs && unread > 0) await handleMarkRead(); }}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: SB, border: `1px solid ${SBR}` }}>
              {unread > 0 ? <BellDot size={18} style={{ color: '#ff375f' }} /> : <Bell size={18} style={{ color: TM }} />}
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center"
                  style={{ background: '#ff375f', color: '#fff' }}>{unread}</span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: isDark ? 'rgba(10,12,20,0.98)' : '#fff', border: `1px solid ${SBR}`, backdropFilter: 'blur(24px)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${SBR}` }}>
                  <span className="text-xs font-black" style={{ color: T }}>Notifications</span>
                  <button onClick={() => setShowNotifs(false)}><X size={14} style={{ color: TM }} /></button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs py-8" style={{ color: TM }}>No notifications yet</p>
                  ) : notifications.map((n, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3"
                      style={{ background: n.read ? 'transparent' : 'rgba(0,212,255,0.05)', borderBottom: `1px solid ${SBR}` }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.read ? SBR : '#00d4ff' }} />
                      <div>
                        <p className="text-[11px] leading-snug" style={{ color: T }}>{n.message}</p>
                        <p className="text-[9px] mt-1" style={{ color: TM }}>{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Resume Upload Banner ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 mb-6 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(0,119,255,0.1), rgba(0,212,255,0.06))', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,212,255,0.12)' }}>
            <FileText size={22} style={{ color: '#00d4ff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black" style={{ color: T }}>
              {resumeUrl ? '✅ Resume Uploaded' : 'Upload Your Resume'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: TM }}>
              {resumeUrl
                ? 'Your profile was auto-filled. Upload a new one to refresh.'
                : 'Upload PDF/DOCX — AI will auto-fill your profile instantly.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {resumeUrl && (
              <a href={resumeUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl font-bold"
                style={{ background: 'rgba(48,209,88,0.1)', color: '#30d158', border: '1px solid rgba(48,209,88,0.2)' }}>
                <ExternalLink size={10} /> View
              </a>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-[11px] px-4 py-2 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0077ff, #00d4ff)', color: '#fff', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? <><Loader2 size={11} className="animate-spin" /> Parsing...</> : <><Upload size={11} /> Upload</>}
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-[12px] font-bold"
            style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.25)', color: '#30d158' }}>
            <CheckCircle size={14} /> Profile auto-filled from resume! Review and save below.
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'recommendations') fetchRecommendations(); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #0077ff, #00d4ff)' : SB,
                color: activeTab === tab.id ? '#fff' : TM,
                border: `1px solid ${activeTab === tab.id ? 'transparent' : SBR}`,
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Edit Profile Tab ─────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: SB, border: `1px solid ${SBR}` }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Himanshu Singh' },
                { key: 'email', label: 'Email Address', placeholder: 'you@email.com' },
                { key: 'phone', label: 'Phone Number', placeholder: '+91 9876543210' },
                { key: 'title', label: 'Job Title / Role', placeholder: 'Full Stack Developer' },
                { key: 'experience', label: 'Years of Experience', placeholder: '2 years' },
                { key: 'education', label: 'Education', placeholder: 'B.Tech Computer Science' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    value={profile[key] || ''}
                    onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#00d4ff'}
                    onBlur={e => e.target.style.borderColor = INB}
                  />
                </div>
              ))}
            </div>

            <div>
              <label style={labelStyle}>Skills (comma-separated)</label>
              <input
                value={profile.skills || ''}
                onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
                placeholder="React, Node.js, MongoDB, Python..."
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#00d4ff'}
                onBlur={e => e.target.style.borderColor = INB}
              />
            </div>

            <div>
              <label style={labelStyle}>Professional Summary</label>
              <textarea
                rows={4}
                value={profile.summary || ''}
                onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))}
                placeholder="A brief description of your background and goals..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#00d4ff'}
                onBlur={e => e.target.style.borderColor = INB}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}><Linkedin size={10} className="inline mr-1" />LinkedIn URL</label>
                <input
                  value={profile.linkedin || ''}
                  onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0077b5'}
                  onBlur={e => e.target.style.borderColor = INB}
                />
              </div>
              <div>
                <label style={labelStyle}><Github size={10} className="inline mr-1" />GitHub URL</label>
                <input
                  value={profile.github || ''}
                  onChange={e => setProfile(p => ({ ...p, github: e.target.value }))}
                  placeholder="https://github.com/username"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#bf5af2'}
                  onBlur={e => e.target.style.borderColor = INB}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02]"
                style={{ background: saved ? 'linear-gradient(135deg, #30d158, #00c7be)' : 'linear-gradient(135deg, #0077ff, #00d4ff)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  : saved ? <><CheckCircle size={14} /> Saved!</>
                  : <><Save size={14} /> Save Profile</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Recommended Jobs Tab ─────────────────────────────────────────── */}
        {activeTab === 'recommendations' && (
          <div>
            {loadingRecs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={36} className="animate-spin" style={{ color: '#00d4ff' }} />
                <p className="text-sm font-bold" style={{ color: TM }}>Scanning LinkedIn for your best matches...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <Star size={36} className="mx-auto mb-3 opacity-20" style={{ color: T }} />
                <p className="font-black text-sm" style={{ color: T }}>No recommendations yet</p>
                <p className="text-xs mt-1" style={{ color: TM }}>Upload your resume to get personalized global job matches.</p>
                <button onClick={() => fileInputRef.current?.click()}
                  className="mt-4 flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #0077ff, #00d4ff)', color: '#fff' }}>
                  <Upload size={12} /> Upload Resume First
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black" style={{ color: T }}>
                    <span style={{ color: '#00d4ff' }}>{recommendations.length}</span> jobs matched to your profile
                  </p>
                  <button onClick={fetchRecommendations}
                    className="text-[11px] px-3 py-1.5 rounded-lg font-bold"
                    style={{ background: SB, border: `1px solid ${SBR}`, color: TM }}>
                    🔄 Refresh
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((job, i) => (
                    <JobCard key={i} job={job} index={i} highlight={i === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
