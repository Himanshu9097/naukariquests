import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Users, Calendar, Plus, Trash2, Edit3, X, Check,
  Clock, MapPin, DollarSign, ChevronDown, ChevronUp, Loader2,
  BarChart3, Award, ClipboardList, Video, FileText, Save, AlertCircle,
  ShieldAlert, LogIn, TrendingUp, TrendingDown, Star, Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/lib/theme';

const TABS = [
  { key: 'overview', label: 'Overview',      icon: BarChart3 },
  { key: 'jobs',     label: 'Manage Jobs',   icon: Briefcase },
  { key: 'apps',     label: 'Applications',  icon: ClipboardList },
  { key: 'schedule', label: 'Schedule',       icon: Calendar },
];

const STATUS_COLORS = {
  applied:     { bg: 'rgba(0,212,255,0.1)',   color: '#00d4ff',  label: 'Applied' },
  shortlisted: { bg: 'rgba(191,90,242,0.1)',  color: '#bf5af2',  label: 'Shortlisted' },
  interview:   { bg: 'rgba(255,214,10,0.1)',  color: '#ffd60a',  label: 'Interview' },
  exam:        { bg: 'rgba(48,209,88,0.1)',   color: '#30d158',  label: 'Exam' },
  hired:       { bg: 'rgba(48,209,88,0.15)',  color: '#30d158',  label: 'Hired' },
  rejected:    { bg: 'rgba(255,55,95,0.1)',   color: '#ff375f',  label: 'Rejected' },
};

function StatCard({ icon: Icon, label, value, color, isDark, trend, trendValue }) {
  return (
    <div className="relative p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden group" 
         style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, backdropFilter: 'blur(10px)' }}>
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl transition-all duration-500 group-hover:scale-150" style={{ background: color }} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: trend === 'up' ? 'rgba(48,209,88,0.1)' : 'rgba(255,55,95,0.1)', color: trend === 'up' ? '#30d158' : '#ff375f' }}>
            {trend === 'up' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {trendValue}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#000' }}>{value}</div>
        <div className="text-xs font-bold mt-1 opacity-60" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [, setLocation] = useLocation();

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  
  const initialJobForm = { title: '', company: '', location: '', salary: '', experience: '', type: 'Full-time', skills: '', description: '', apply_link: '' };
  const initialScheduleForm = { type: 'interview', title: '', description: '', date: '', time: '', location: '', link: '', jobId: '', candidates: [] };
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
  const [jobApplicants, setJobApplicants] = useState([]);

  const T  = isDark ? '#fff' : '#0a0f1e';
  const TM = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(10,15,30,0.55)';
  const SB = isDark ? 'rgba(255,255,255,0.03)' : '#fff';
  const SBR= isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';

  if (userRole !== 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-24 h-24 rounded-[32px] mx-auto mb-8 flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.2)' }}>
            <ShieldAlert size={40} className="text-[#ff375f]" />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: T }}>Access Restricted</h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: TM }}>
            This workspace is strictly reserved for <span className="text-[#bf5af2] font-bold">Recruiter / Company</span> profiles.
            {userRole ? ` You are logged in as "${userRole}".` : ' Secure your access by logging in.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #bf5af2, #7c3aed)' }}>
                <LogIn size={16} /> {userRole ? 'Switch Account' : 'Login as Recruiter'}
              </button>
            </Link>
            {userRole === 'candidate' && (
              <Link href="/candidate">
                <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" 
                        style={{ border: `1.5px solid ${SBR}`, color: TM }}>
                  My Candidate Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q = `?recruiterId=${userId}`;
      const [sRes, jRes, aRes, scRes] = await Promise.all([
        fetch(`/api/dashboard/recruiter/stats${q}`), fetch(`/api/dashboard/recruiter/jobs${q}`),
        fetch(`/api/dashboard/recruiter/applications${q}`), fetch(`/api/dashboard/recruiter/schedules${q}`),
      ]);
      setStats(await sRes.json()); setJobs(await jRes.json());
      setApps(await aRes.json()); setSchedules(await scRes.json());
    } catch {}
    finally { setLoading(false); }
  }, [userId]);

  const openCandidateProfile = async (candidateId) => {
    setSelectedCandidate(candidateId);
    setCandidateDetails(null);
    setLoadingCandidate(true);
    try {
      const r = await fetch(`/api/profile/${candidateId}`);
      if (r.ok) {
        const d = await r.json();
        setCandidateDetails(d);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingCandidate(false);
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const submitJob = async () => {
    const body = { ...jobForm, recruiterId: userId, skills: jobForm.skills.split(',').map(s => s.trim()).filter(Boolean) };
    const url = editJob ? `/api/dashboard/recruiter/jobs/${editJob._id}` : '/api/dashboard/recruiter/jobs';
    await fetch(url, { method: editJob ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowJobForm(false); setEditJob(null);
    setJobForm(initialJobForm);
    fetchAll();
  };

  const deleteJob = async (id) => {
    await fetch(`/api/dashboard/recruiter/jobs/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const updateAppStatus = async (id, status) => {
    await fetch(`/api/dashboard/recruiter/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchAll();
  };

  const submitSchedule = async () => {
    const body = { ...scheduleForm, recruiterId: userId };
    await fetch('/api/dashboard/recruiter/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowScheduleForm(false);
    setScheduleForm(initialScheduleForm);
    setJobApplicants([]);
    fetchAll();
  };

  // Fetch applicants when a job is selected in the schedule form
  const fetchJobApplicants = async (jobId) => {
    if (!jobId) { setJobApplicants([]); return; }
    try {
      const appsForJob = apps.filter(a => String(a.jobId?._id) === String(jobId));
      setJobApplicants(appsForJob);
    } catch { setJobApplicants([]); }
  };

  const deleteSchedule = async (id) => {
    await fetch(`/api/dashboard/recruiter/schedules/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const inputStyle = { background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: `1.5px solid ${SBR}`, color: T, transition: 'all 0.2s', focusOutline: '2px solid #bf5af2' };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full border-4 border-[#bf5af2]/20 border-t-[#bf5af2] animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-[#00d4ff]/20 border-t-[#00d4ff] animate-spin-slow" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
      {/* Top Banner Gradient */}
      <div className="absolute top-0 left-0 w-full h-96 opacity-10 pointer-events-none" 
           style={{ background: 'radial-gradient(ellipse at 50% -20%, #bf5af2, transparent 70%)' }} />
      
      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        {/* Header Segment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.2)' }}>
              <Sparkles size={12} className="text-[#bf5af2]" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#bf5af2]">Workspace Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: T }}>
              Welcome back, <br className="md:hidden" />
              <span style={{ background: 'linear-gradient(135deg, #bf5af2, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {userName || 'Recruiter'}
              </span>
            </h1>
            <p className="text-sm font-medium mt-3 max-w-lg" style={{ color: TM }}>Accelerating your hiring pipeline with powerful management tools and curated insights.</p>
          </div>
          {/* Quick Actions in Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setTab('jobs'); setShowJobForm(true); setEditJob(null); setJobForm(initialJobForm); }} 
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #bf5af2, #7c3aed)' }}>
              <Plus size={16} /> Post Job
            </button>
            <button onClick={() => { setTab('schedule'); setShowScheduleForm(true); }}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #30d158, #28a745)' }}>
              <Calendar size={16} /> Schedule
            </button>
          </div>
        </div>

        {/* Tab Navigation Hub */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 custom-scrollbar p-1 rounded-3xl" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${SBR}` }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 ${active ? 'shadow-md' : 'hover:bg-white/5'}`}
                style={{ 
                  background: active ? (isDark ? '#2a2a2a' : '#fff') : 'transparent',
                  color: active ? T : TM,
                }}>
                <t.icon size={16} className={active ? "text-[#bf5af2]" : ""} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              <StatCard icon={Briefcase} label="Active Jobs" value={stats.totalJobs ?? 0} color="#00d4ff" isDark={isDark} trend="up" trendValue="+2" />
              <StatCard icon={ClipboardList} label="Applications Received" value={stats.totalApps ?? 0} color="#bf5af2" isDark={isDark} trend="up" trendValue="+14%" />
              <StatCard icon={Award} label="Shortlisted" value={stats.shortlisted ?? 0} color="#ffd60a" isDark={isDark} />
              <StatCard icon={Video} label="Interviews Setup" value={stats.interviews ?? 0} color="#ff9f0a" isDark={isDark} />
              <StatCard icon={FileText} label="Exams Conducted" value={stats.exams ?? 0} color="#30d158" isDark={isDark} />
              <StatCard icon={Check} label="Hired Candidates" value={stats.hired ?? 0} color="#30d158" isDark={isDark} trend="up" trendValue="+1" />
            </div>

            {/* Dashboard Splitting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Apps */}
              <div className="lg:col-span-2 rounded-3xl p-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black" style={{ color: T }}>Recent Activity</h3>
                  <button onClick={() => setTab('apps')} className="text-xs font-bold text-[#bf5af2] hover:underline">View All</button>
                </div>
                {apps.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {apps.slice(0, 5).map(app => {
                      const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
                      return (
                        <div key={app._id} className="flex items-center gap-4 p-4 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5" style={{ border: `1px solid ${SBR}` }}>
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-sm shrink-0" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)' }}>
                            {app.candidateId?.avatarUrl
                              ? <img src={app.candidateId.avatarUrl} alt={app.candidateId?.name} className="w-full h-full object-cover" />
                              : (app.candidateId?.name || 'C').charAt(0).toUpperCase()
                            }
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: T }}>{app.candidateId?.name || 'New Candidate'}</p>
                            <p className="text-[11px]" style={{ color: TM }}>Applied for <span className="font-semibold">{app.jobId?.title || 'a job'}</span></p>
                          </div>
                          <div className="text-[10px] px-3 py-1.5 rounded-full font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-20" style={{ color: T }} />
                    <p className="text-sm" style={{ color: TM }}>No recent activity to show.</p>
                  </div>
                )}
              </div>
              {/* Quick Profile */}
              <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(191,90,242,0.1), rgba(0,212,255,0.05))', border: `1px solid rgba(191,90,242,0.2)` }}>
                <div className="w-20 h-20 rounded-full mb-4 shadow-xl flex items-center justify-center border-4 border-white/10" style={{ background: '#bf5af2' }}>
                  <Briefcase size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-black mb-1" style={{ color: T }}>{userName || 'Company Profile'}</h3>
                <p className="text-xs mb-6 px-4" style={{ color: TM }}>Your recruitment dashboard is fully active and ready to scale your team.</p>
                <div className="w-full flex flex-col gap-2">
                  <button onClick={() => { setTab('jobs'); setShowJobForm(true); }} className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#bf5af2] transition hover:bg-[#a844da] shadow-lg shadow-[#bf5af2]/20">Create New Metric</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MANAGE JOBS ─────────────────────────────────────────────── */}
        {tab === 'jobs' && (
          <div className="space-y-6 animate-fade-in">
            {showJobForm ? (
              <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden" style={{ background: SB, border: `1px solid ${SBR}` }}>
                {/* Decorative background for form */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff] opacity-5 rounded-full blur-3xl" />
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: T }}>{editJob ? 'Update Job Listing' : 'Draft New Job'}</h3>
                    <p className="text-xs mt-1" style={{ color: TM }}>Build an attractive job card to capture the right talent.</p>
                  </div>
                  <button onClick={() => setShowJobForm(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10">
                    <X size={18} style={{ color: T }} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Job Title *</label>
                    <input value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Company Name *</label>
                    <input value={jobForm.company} onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))} placeholder="Your Company Ltd." className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Location *</label>
                    <input value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, Hybrid" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Salary Bracket</label>
                    <input value={jobForm.salary} onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))} placeholder="₹12LPA - ₹18LPA" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Experience Req.</label>
                    <input value={jobForm.experience} onChange={e => setJobForm(p => ({ ...p, experience: e.target.value }))} placeholder="3-5 Years" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Job Type</label>
                    <div onClick={() => setOpenDropdown(openDropdown === 'jobType' ? null : 'jobType')} className="w-full px-5 py-4 rounded-xl text-sm flex justify-between items-center cursor-pointer transition-all" style={inputStyle}>
                      <span className="truncate">{jobForm.type}</span> <ChevronDown size={16} className="opacity-50 shrink-0 ml-2" style={{ transform: openDropdown === 'jobType' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                    {openDropdown === 'jobType' && (
                       <div className="absolute left-0 mt-1 w-full rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in" style={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${SBR}` }}>
                         {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map(opt => (
                           <div key={opt} onClick={() => { setJobForm(p => ({ ...p, type: opt })); setOpenDropdown(null); }} className="px-5 py-3 text-sm font-bold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>{opt}</div>
                         ))}
                       </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Key Skills</label>
                    <input value={jobForm.skills} onChange={e => setJobForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, TypeScript (comma separated)" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Apply Redirect Link (Optional UI bypass)</label>
                    <input value={jobForm.apply_link} onChange={e => setJobForm(p => ({ ...p, apply_link: e.target.value }))} placeholder="https://careers.company.com/apply/..." className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none transition-all" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Full Description</label>
                    <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} placeholder="Detail the role, responsibilities, and perks..." rows={5} className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#bf5af2] outline-none resize-y transition-all" style={inputStyle} />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 relative z-10">
                  <button onClick={() => setShowJobForm(false)} className="px-6 py-3.5 rounded-xl text-sm font-bold transition hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>Cancel</button>
                  <button onClick={submitJob} className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
                    <Save size={16} /> {editJob ? 'Update Configuration' : 'Publish Job'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div key={job._id} className="group p-6 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                    style={{ background: SB, border: `1px solid ${SBR}` }}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md" style={{ background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)' }}>
                          {(job.company || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditJob(job); setJobForm({ ...job, skills: (job.skills || []).join(', ') }); setShowJobForm(true); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
                            <Edit3 size={14} style={{ color: '#00d4ff' }} />
                          </button>
                          <button onClick={() => deleteJob(job._id)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,55,95,0.1)' }}>
                            <Trash2 size={14} style={{ color: '#ff375f' }} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xl font-black mb-1" style={{ color: T }}>{job.title}</h4>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: TM }}>
                        <MapPin size={12}/> {job.location} {job.salary && <><span className="opacity-30">•</span> <DollarSign size={12}/> {job.salary}</>}
                      </p>
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {job.skills.slice(0, 4).map(s => <span key={s} className="text-[10px] px-2.5 py-1 rounded-md font-bold shrink-0" style={{ background: 'rgba(191,90,242,0.08)', color: '#bf5af2', border: '1px solid rgba(191,90,242,0.15)' }}>{s}</span>)}
                          {job.skills.length > 4 && <span className="text-[10px] px-2.5 py-1 rounded-md font-bold" style={{ background: 'rgba(128,128,128,0.1)', color: TM }}>+{job.skills.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="lg:col-span-2 text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: SBR, background: 'transparent' }}>
                    <Briefcase size={40} className="mx-auto mb-4" style={{ color: TM }} />
                    <p className="text-lg font-bold" style={{ color: T }}>Your Job Portal is Empty</p>
                    <p className="text-sm mt-1 mb-6" style={{ color: TM }}>Create your first listing to start accepting applications.</p>
                    <button onClick={() => setShowJobForm(true)} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#bf5af2] transition-transform hover:scale-105">Post New Job</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS ────────────────────────────────────────────── */}
        {tab === 'apps' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-3xl overflow-hidden" style={{ background: SB, border: `1px solid ${SBR}` }}>
              <div className="px-6 py-5 border-b" style={{ borderColor: SBR }}>
                <h2 className="text-lg font-black" style={{ color: T }}>Candidate Pipeline</h2>
                <p className="text-xs mt-1" style={{ color: TM }}>Update states and advance candidates directly from here.</p>
              </div>
              <div className="overflow-x-auto pb-32">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase font-black tracking-widest text-opacity-50" style={{ color: TM, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                      <th className="px-6 py-4 font-black w-2/5">Candidate</th>
                      <th className="px-6 py-4 font-black">Applied Job</th>
                      <th className="px-6 py-4 font-black">Date</th>
                      <th className="px-6 py-4 font-black text-right">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {apps.map(app => {
                      const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
                      return (
                        <tr key={app._id} className="border-b last:border-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: SBR }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 flex shrink-0 items-center justify-center rounded-[14px] font-bold text-white text-sm shadow-md overflow-hidden" style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
                                {app.candidateId?.avatarUrl
                                  ? <img src={app.candidateId.avatarUrl} alt={app.candidateId?.name} className="w-full h-full object-cover" />
                                  : (app.candidateId?.name || 'U').charAt(0).toUpperCase()
                                }
                              </div>
                              <div className="cursor-pointer hover:underline" onClick={() => openCandidateProfile(app.candidateId?._id)}>
                                <p className="font-bold whitespace-nowrap" style={{ color: T }}>{app.candidateId?.name || 'Applicant'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[11px] truncate w-40" style={{ color: TM }}>{app.candidateId?.email}</p>
                                  {(app.candidateId?.jobFitScore > 0) && (
                                    <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase" style={{ background: 'rgba(48,209,88,0.1)', color: '#30d158' }}>
                                      Fit: {app.candidateId.jobFitScore}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold whitespace-nowrap" style={{ color: T }}>{app.jobId?.title || 'Unknown Role'}</td>
                          <td className="px-6 py-4 text-[11px] whitespace-nowrap" style={{ color: TM }}>{new Date(app.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-6 py-4 text-right relative">
                            <div className="inline-flex items-center rounded-xl p-1 shadow-sm transition-all hover:ring-2 hover:ring-[#bf5af2]/30 cursor-pointer" 
                                 style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f0f4f8' }}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setOpenDropdown(openDropdown === app._id ? null : app._id);
                                 }}>
                              <div className="px-3 py-1.5 rounded-lg text-[10px] font-black mr-2 pointer-events-none" style={{ background: sc.bg, color: sc.color }}>{sc.label}</div>
                              <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: T }}>{sc.label}</span>
                              <ChevronDown size={14} className="ml-1.5 opacity-50 transition-transform" style={{ color: T, transform: openDropdown === app._id ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                            </div>

                            {openDropdown === app._id && (
                              <div className="absolute right-6 top-16 w-40 rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in"
                                   style={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${SBR}` }}>
                                {Object.entries(STATUS_COLORS).map(([k, v]) => (
                                  <div key={k} 
                                       onClick={() => { updateAppStatus(app._id, k); setOpenDropdown(null); }}
                                       className="px-4 py-3 text-xs font-bold cursor-pointer text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2"
                                       style={{ color: T }}>
                                    <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                                    {v.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {apps.length === 0 && <div className="text-center py-16 text-sm" style={{ color: TM }}>Pipeline is empty.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULE ────────────────────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="space-y-6 animate-fade-in">
            {showScheduleForm && (
              <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#30d158] opacity-5 rounded-full blur-3xl" />
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black" style={{ color: T }}>Schedule Interview/Exam</h3>
                    <p className="text-xs mt-1" style={{ color: TM }}>Organize your upcoming recruiting events efficiently.</p>
                  </div>
                  <button onClick={() => setShowScheduleForm(false)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10">
                    <X size={18} style={{ color: T }} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Event Type *</label>
                    <div onClick={() => setOpenDropdown(openDropdown === 'schedType' ? null : 'schedType')} className="w-full px-5 py-4 rounded-xl text-sm flex justify-between items-center cursor-pointer transition-all" style={inputStyle}>
                      <span className="truncate">{scheduleForm.type === 'interview' ? '🎥 Video / In-Person Interview' : '📝 Assessment / Exam'}</span>
                      <ChevronDown size={16} className="opacity-50 shrink-0 ml-2" style={{ transform: openDropdown === 'schedType' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                    {openDropdown === 'schedType' && (
                       <div className="absolute left-0 mt-1 w-full rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in" style={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${SBR}` }}>
                         <div onClick={() => { setScheduleForm(p => ({ ...p, type: 'interview' })); setOpenDropdown(null); }} className="px-5 py-3 text-sm font-bold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>🎥 Video / In-Person Interview</div>
                         <div onClick={() => { setScheduleForm(p => ({ ...p, type: 'exam' })); setOpenDropdown(null); }} className="px-5 py-3 text-sm font-bold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>📝 Assessment / Exam</div>
                       </div>
                    )}
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Linked Job *</label>
                    <div onClick={() => setOpenDropdown(openDropdown === 'schedJob' ? null : 'schedJob')} className="w-full px-5 py-4 rounded-xl text-sm flex justify-between items-center cursor-pointer transition-all" style={inputStyle}>
                      <span className="truncate">{!scheduleForm.jobId ? '-- Select Active Job --' : (jobs.find(j => j._id === scheduleForm.jobId)?.title || '-- Select Active Job --')}</span>
                      <ChevronDown size={16} className="opacity-50 shrink-0 ml-2" style={{ transform: openDropdown === 'schedJob' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                    {openDropdown === 'schedJob' && (
                       <div className="absolute left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-xl shadow-2xl z-50 animate-fade-in custom-scrollbar" style={{ background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${SBR}` }}>
                         {jobs.length === 0 && <div className="px-5 py-3 text-sm font-bold opacity-50" style={{ color: T }}>No jobs available</div>}
                         {jobs.map(j => (
                           <div key={j._id} onClick={() => { 
                             setScheduleForm(p => ({ ...p, jobId: j._id, candidates: [] })); 
                             setOpenDropdown(null); 
                             fetchJobApplicants(j._id); 
                           }} className="px-5 py-3 text-sm font-bold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>{j.title}</div>
                         ))}
                       </div>
                    )}
                  </div>

                  {/* ── Candidate Picker (shown after job is selected) ────── */}
                  {scheduleForm.jobId && (
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Assign Candidates *</label>
                      {jobApplicants.length === 0 ? (
                        <div className="px-5 py-4 rounded-xl text-sm" style={inputStyle}>
                          <span style={{ color: TM }}>No applicants for this job yet.</span>
                        </div>
                      ) : (
                        <div className="rounded-xl p-4 space-y-2 max-h-52 overflow-y-auto custom-scrollbar" style={{ ...inputStyle, padding: '16px' }}>
                          {/* Select All */}
                          <label className="flex items-center gap-3 pb-2 mb-2 cursor-pointer" style={{ borderBottom: `1px solid ${SBR}` }}>
                            <input
                              type="checkbox"
                              checked={scheduleForm.candidates.length === jobApplicants.length && jobApplicants.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setScheduleForm(p => ({ ...p, candidates: jobApplicants.map(a => a.candidateId?._id).filter(Boolean) }));
                                } else {
                                  setScheduleForm(p => ({ ...p, candidates: [] }));
                                }
                              }}
                              className="w-4 h-4 rounded accent-[#30d158]"
                            />
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: TM }}>Select All ({jobApplicants.length})</span>
                          </label>
                          {jobApplicants.map(a => {
                            const cId = a.candidateId?._id;
                            const isChecked = scheduleForm.candidates.includes(cId);
                            return (
                              <label key={a._id} className="flex items-center gap-3 py-1.5 cursor-pointer rounded-lg px-1 transition hover:bg-black/5 dark:hover:bg-white/5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setScheduleForm(p => ({
                                      ...p,
                                      candidates: isChecked
                                        ? p.candidates.filter(id => id !== cId)
                                        : [...p.candidates, cId]
                                    }));
                                  }}
                                  className="w-4 h-4 rounded accent-[#30d158]"
                                />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
                                    {a.candidateId?.avatarUrl
                                      ? <img src={a.candidateId.avatarUrl} alt="" className="w-full h-full object-cover" />
                                      : (a.candidateId?.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: T }}>{a.candidateId?.name || 'Applicant'}</p>
                                    <p className="text-[10px] truncate" style={{ color: TM }}>{a.candidateId?.email}</p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {scheduleForm.candidates.length > 0 && (
                        <p className="text-[10px] font-bold mt-1" style={{ color: '#30d158' }}>
                          ✓ {scheduleForm.candidates.length} candidate{scheduleForm.candidates.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Title *</label>
                    <input value={scheduleForm.title} onChange={e => setScheduleForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Round 1 Technical" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#30d158] outline-none" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Date *</label>
                    <input type="date" value={scheduleForm.date} onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#30d158] outline-none" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Time *</label>
                    <input value={scheduleForm.time} onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))} placeholder="10:00 AM IST" className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#30d158] outline-none" style={inputStyle} />
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Meeting Link / Exam URL</label>
                    <input value={scheduleForm.link} onChange={e => setScheduleForm(p => ({ ...p, link: e.target.value }))} placeholder="https://zoom.us/..." className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#30d158] outline-none" style={inputStyle} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Instructions (Optional)</label>
                    <textarea value={scheduleForm.description} onChange={e => setScheduleForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide joining instructions or agenda..." rows={3} className="w-full px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-[#30d158] outline-none resize-y" style={inputStyle} />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 relative z-10">
                  <button onClick={() => setShowScheduleForm(false)} className="px-6 py-3.5 rounded-xl text-sm font-bold transition hover:bg-black/5 dark:hover:bg-white/10" style={{ color: T }}>Cancel</button>
                  <button onClick={submitSchedule} className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #30d158, #28a745)' }}>
                    <Calendar size={16} /> Finalize Schedule
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schedules.map(s => (
                <div key={s._id} className="relative group p-6 rounded-3xl transition duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{ background: SB, border: `1px solid ${SBR}` }}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteSchedule(s._id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20">
                      <Trash2 size={14} className="text-[#ff375f]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: s.type === 'interview' ? 'rgba(255,214,10,0.1)' : 'rgba(0,212,255,0.1)' }}>
                      {s.type === 'interview' ? <Video size={16} style={{ color: '#ffd60a' }} /> : <FileText size={16} style={{ color: '#00d4ff' }} />}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-black" style={{ color: TM }}>{s.type}</span>
                      <p className="text-sm font-bold leading-tight" style={{ color: T }}>{s.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 p-3 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <p className="text-[11px] font-semibold flex items-center gap-2 truncate" style={{ color: TM }}><Briefcase size={12}/> {s.jobId?.title}</p>
                    <p className="text-[11px] font-semibold flex items-center gap-2" style={{ color: TM }}><Clock size={12}/> {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} at {s.time}</p>
                  </div>
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer" className="block text-center py-2.5 rounded-xl text-xs font-bold text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 transition-colors">Join Workspace</a>
                  ) : (
                    <span className="block text-center py-2.5 rounded-xl text-[10px] font-bold text-gray-400 bg-gray-500/10 cursor-not-allowed">No Link Attached</span>
                  )}
                </div>
              ))}
              {schedules.length === 0 && !showScheduleForm && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: SBR, background: 'transparent' }}>
                  <Calendar size={40} className="mx-auto mb-4" style={{ color: TM }} />
                  <p className="text-lg font-bold" style={{ color: T }}>Calendar is Clear</p>
                  <p className="text-sm mt-1" style={{ color: TM }}>Schedule interviews and exams to see them mapped here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CANDIDATE PROFILE MODAL ─────────────────────────────────────── */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => { setSelectedCandidate(null); setCandidateDetails(null); }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
            style={{ background: isDark ? '#0f1423' : '#fff', border: `1px solid ${SBR}`, maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between shrink-0" style={{ borderColor: SBR }}>
              <h2 className="text-xl font-black" style={{ color: T }}>Candidate Profile</h2>
              <button onClick={() => { setSelectedCandidate(null); setCandidateDetails(null); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                <X size={20} style={{ color: T }} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {loadingCandidate ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={36} className="animate-spin" style={{ color: '#00d4ff' }} />
                  <p className="text-sm font-bold" style={{ color: TM }}>Loading profile...</p>
                </div>
              ) : candidateDetails ? (
                <div className="space-y-5">
                  {/* Identity */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black text-white shrink-0"
                         style={{ background: 'linear-gradient(135deg, #00d4ff, #0055ff)' }}>
                      {candidateDetails.avatarUrl
                        ? <img src={candidateDetails.avatarUrl} alt={candidateDetails.name} className="w-full h-full object-cover" />
                        : (candidateDetails.name || 'U').charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <h3 className="text-xl font-black" style={{ color: T }}>{candidateDetails.name || '—'}</h3>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#00d4ff' }}>{candidateDetails.title || 'Applicant'}</p>
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Email', value: candidateDetails.email },
                      { label: 'Phone', value: candidateDetails.phone },
                      { label: 'Experience', value: candidateDetails.experience },
                      { label: 'Education', value: candidateDetails.education },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label} className="p-4 rounded-2xl"
                           style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${SBR}` }}>
                        <p className="text-[10px] uppercase tracking-widest font-black mb-1" style={{ color: TM }}>{label}</p>
                        <p className="text-sm font-semibold break-all" style={{ color: T }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {candidateDetails.summary && (
                    <div className="p-4 rounded-2xl"
                         style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${SBR}` }}>
                      <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: TM }}>Summary</p>
                      <p className="text-sm leading-relaxed" style={{ color: T }}>{candidateDetails.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {candidateDetails.skills?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: TM }}>Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {candidateDetails.skills.map(s => (
                          <span key={s} className="px-3 py-1 text-xs font-bold rounded-lg"
                                style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social */}
                  {(candidateDetails.linkedin || candidateDetails.github) && (
                    <div className="flex gap-3 flex-wrap">
                      {candidateDetails.linkedin && (
                        <a href={
                             candidateDetails.linkedin.startsWith('http')
                               ? candidateDetails.linkedin
                               : 'https://' + candidateDetails.linkedin.replace(/^\/+/, '')
                           } target="_blank" rel="noreferrer"
                           className="text-xs font-bold px-4 py-2 rounded-xl"
                           style={{ background: 'rgba(0,119,181,0.1)', color: '#0077b5', border: '1px solid rgba(0,119,181,0.2)' }}>
                          🔗 LinkedIn
                        </a>
                      )}
                      {candidateDetails.github && (
                        <a href={
                             candidateDetails.github.startsWith('http')
                               ? candidateDetails.github
                               : 'https://' + candidateDetails.github.replace(/^\/+/, '')
                           } target="_blank" rel="noreferrer"
                           className="text-xs font-bold px-4 py-2 rounded-xl"
                           style={{ background: 'rgba(191,90,242,0.1)', color: '#bf5af2', border: '1px solid rgba(191,90,242,0.2)' }}>
                          🐙 GitHub
                        </a>
                      )}
                    </div>
                  )}

                  {/* Resume button */}
                  {candidateDetails.resumeUrl ? (
                    <a href={candidateDetails.resumeUrl} target="_blank" rel="noreferrer"
                       className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02]"
                       style={{ background: 'linear-gradient(135deg, #0055ff, #00d4ff)' }}>
                      <FileText size={16} /> View Full Resume
                    </a>
                  ) : (
                    <div className="flex items-center justify-center w-full py-3.5 rounded-2xl font-bold text-sm"
                         style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', color: TM, border: `1px solid ${SBR}` }}>
                      No resume uploaded yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16" style={{ color: TM }}>
                  <Users size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Profile not found</p>
                  <p className="text-xs mt-1">This candidate hasn't filled their profile yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
