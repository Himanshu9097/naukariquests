import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, CheckCircle, Clock, MapPin, Target, FileText,
  Loader2, BarChart3, Award, Calendar, ExternalLink, BookOpen, Send,
  TrendingUp, Video, AlertCircle, ShieldAlert, LogIn, ChevronRight, Activity
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/lib/theme';

const STATUS_COLORS = {
  applied:     { bg: 'rgba(0,212,255,0.1)',   color: '#00d4ff',  label: 'Applied',     icon: Send },
  shortlisted: { bg: 'rgba(191,90,242,0.1)',  color: '#bf5af2',  label: 'Shortlisted', icon: Award },
  interview:   { bg: 'rgba(255,214,10,0.1)',  color: '#ffd60a',  label: 'Interview',   icon: Video },
  exam:        { bg: 'rgba(48,209,88,0.1)',   color: '#30d158',  label: 'Exam',        icon: FileText },
  hired:       { bg: 'rgba(48,209,88,0.15)',  color: '#30d158',  label: 'Hired ✓',     icon: CheckCircle },
  rejected:    { bg: 'rgba(255,55,95,0.1)',   color: '#ff375f',  label: 'Rejected',    icon: AlertCircle },
};

function StatCard({ icon: Icon, label, value, color, isDark, subtitle }) {
  return (
    <div className="relative p-6 rounded-3xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden group" 
         style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)'}` }}>
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl transition-all duration-500 group-hover:scale-150" style={{ background: color }} />
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="relative z-10 flex items-baseline gap-1">
        <div className="text-4xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0a0f1e' }}>{value ?? '—'}</div>
        {subtitle && <span className="text-[10px] font-bold opacity-30">{subtitle}</span>}
      </div>
      <div className="text-[11px] font-bold mt-1 opacity-50 uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function CandidateDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [, setLocation] = useLocation();

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
  const userId   = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'demo') : 'demo';

  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [activeTest, setActiveTest] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currQ, setCurrQ] = useState(0);
  const [testScore, setTestScore] = useState(0);

  const T  = isDark ? '#fff' : '#0a0f1e';
  const TM = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(10,15,30,0.55)';
  const SB = isDark ? 'rgba(255,255,255,0.03)' : '#fff';
  const SBR= isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';

  if (userRole === 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-24 h-24 rounded-[32px] mx-auto mb-8 flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.2)' }}>
            <ShieldAlert size={40} className="text-[#ff375f]" />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: T }}>Access Restricted</h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: TM }}>
            This dashboard is strictly for <span className="text-[#00d4ff] font-bold">Candidates</span> only.
            You are logged in via a Company/Recruiter account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/recruiter">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #bf5af2, #7c3aed)' }}>
                Recruiter Dashboard
              </button>
            </Link>
            <Link href="/login">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" 
                      style={{ border: `1.5px solid ${SBR}`, color: TM }}>
                <LogIn size={16} /> Switch Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-24 h-24 rounded-[32px] mx-auto mb-8 flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <LogIn size={40} className="text-[#00d4ff]" />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: T }}>Login Required</h1>
          <p className="text-base mb-8" style={{ color: TM }}>
            Sign in as a <span className="text-[#00d4ff] font-bold">Candidate</span> to unlock your personalized progress tracker.
          </p>
          <Link href="/login">
            <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl hover:scale-105 mx-auto"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
              <LogIn size={16} /> Get Started
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const candidateId = userId;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes, scRes] = await Promise.all([
        fetch(`/api/dashboard/candidate/${candidateId}/stats`),
        fetch(`/api/dashboard/candidate/${candidateId}/applications`),
        fetch(`/api/dashboard/candidate/${candidateId}/schedules`),
      ]);
      setStats(await sRes.json());
      setApplications(await aRes.json());
      setSchedules(await scRes.json());
    } catch {}
    finally { setLoading(false); }
  }, [candidateId]);

  const submitTest = async (points) => {
    try {
      await fetch(`/api/dashboard/candidate/${candidateId}/mocktest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsEarned: points })
      });
      setActiveTest(null);
      setTestMode(false);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const startRealTest = async () => {
    try {
      const res = await fetch(`/api/dashboard/candidate/mocktest/questions/${activeTest.id}`);
      const qs = await res.json();
      setTestQuestions(qs);
      setTestMode(true);
      setCurrQ(0);
      setTestScore(0);
    } catch (e) { console.error(e); }
  };

  const handleAnswerClick = (idx) => {
    const isCorrect = idx === testQuestions[currQ].correctOptionIndex;
    if (isCorrect) setTestScore(p => p + 1);
    
    if (currQ + 1 < testQuestions.length) {
      setCurrQ(p => p + 1);
    } else {
      // Test over!
      // If they got at least 2/5 correct, they get the full XP, otherwise half.
      const earned = (testScore + (isCorrect ? 1 : 0)) >= 2 ? activeTest.points : Math.floor(activeTest.points / 2);
      submitTest(earned);
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full border-4 border-[#00d4ff]/20 border-t-[#00d4ff] animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-[#bf5af2]/20 border-t-[#bf5af2] animate-spin-slow" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
      <div className="absolute top-0 left-0 w-full h-96 opacity-10 pointer-events-none" 
           style={{ background: 'radial-gradient(ellipse at 50% -20%, #00d4ff, transparent 70%)' }} />
           
      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        
        {/* Header Segment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Activity size={12} className="text-[#00d4ff]" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#00d4ff]">Career Hub Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: T }}>
              Hello, <br className="md:hidden" />
              <span style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {userName || 'Candidate'}
              </span>
            </h1>
            <p className="text-sm font-medium mt-3" style={{ color: TM }}>Track your job applications, schedule interviews, and level up.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/resume-match">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #bf5af2, #7c3aed)' }}>
                <Target size={16} /> Scan Resume
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Hub */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 custom-scrollbar p-1 rounded-3xl" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${SBR}` }}>
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'apps', label: 'My Applications', icon: Briefcase },
            { key: 'schedule', label: 'Upcoming', icon: Calendar },
            { key: 'tests', label: 'Assessments', icon: BookOpen },
          ].map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 ${active ? 'shadow-md' : 'hover:bg-white/5'}`}
                style={{ 
                  background: active ? (isDark ? '#2a2a2a' : '#fff') : 'transparent',
                  color: active ? T : TM,
                }}>
                <t.icon size={16} className={active ? "text-[#00d4ff]" : ""} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              <StatCard icon={Send}        label="Apps Sent"    value={stats.totalApps ?? 0} color="#00d4ff" isDark={isDark} />
              <StatCard icon={Award}        label="Shortlisted"  value={stats.shortlisted ?? 0} color="#bf5af2" isDark={isDark} />
              <StatCard icon={Video}        label="Interviews"   value={stats.interviews ?? 0} color="#ffd60a" isDark={isDark} />
              <StatCard icon={CheckCircle}  label="Hired"        value={stats.hired ?? 0} color="#30d158" isDark={isDark} />
              <StatCard icon={Target}       label="JobFit Score" value={stats.jobFitScore || 0} color="#bf5af2" isDark={isDark} subtitle="XP" />
              <StatCard icon={Activity}     label="ATS Match"    value={stats.latestAtsScore ?? '—'} color={
                (stats.latestAtsScore ?? 0) >= 80 ? '#30d158' : (stats.latestAtsScore ?? 0) >= 60 ? '#ffd60a' : '#ff375f'
              } isDark={isDark} subtitle="/100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Panel */}
              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-3xl p-6 shadow-sm" style={{ background: SB, border: `1px solid ${SBR}` }}>
                  <h3 className="text-lg font-black mb-6" style={{ color: T }}>Career Arsenal</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { href: '/resume-match', label: 'Resume AI Check', desc: 'Optimize for ATS passing', icon: Target, color: '#bf5af2' },
                      { href: '/', label: 'Explore Job Market', desc: 'Find latest company postings', icon: Briefcase, color: '#00d4ff' },
                      { href: '/courses', label: 'Upskill Hub', desc: 'Free & premium courses', icon: BookOpen, color: '#30d158' },
                    ].map(a => (
                      <Link key={a.href} href={a.href} className="group flex items-center justify-between p-4 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5" style={{ border: `1px solid ${SBR}` }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${a.color}15` }}>
                            <a.icon size={20} style={{ color: a.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: T }}>{a.label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: TM }}>{a.desc}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: T }}/>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-2 rounded-3xl p-6 shadow-sm" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black" style={{ color: T }}>Recent Status Updates</h3>
                  <button onClick={() => setTab('apps')} className="text-xs font-bold text-[#00d4ff] hover:underline">View All</button>
                </div>
                {applications.length > 0 ? (
                  <div className="space-y-4 relative pl-3 before:absolute before:inset-y-0 before:left-[27px] before:w-[2px] before:bg-gradient-to-b before:from-[#00d4ff] before:to-transparent">
                    {applications.slice(0, 5).map(app => {
                      const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
                      const Icon = sc.icon;
                      return (
                        <div key={app._id} className="relative flex items-center gap-4 p-4 rounded-2xl transition hover:bg-black/5 dark:hover:bg-white/5">
                          <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center border-4" 
                               style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#fff', zIndex: 10 }}>
                            <Icon size={18} style={{ color: sc.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: T }}>{app.jobId?.title || 'Unknown Role'}</p>
                            <p className="text-[11px]" style={{ color: TM }}>{app.jobId?.company} <span className="opacity-30 mx-1">•</span> {new Date(app.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <span className="text-[10px] px-3 py-1.5 rounded-full font-black shadow-sm" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Activity size={40} className="mx-auto mb-4 opacity-20" style={{ color: T }} />
                    <p className="text-sm font-bold" style={{ color: TM }}>No updates yet.</p>
                    <p className="text-xs mt-1" style={{ color: TM }}>Apply for jobs to build your timeline.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MY APPLICATIONS ──────────────────────────────────────── */}
        {tab === 'apps' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-black mb-6" style={{ color: T }}>Pipeline View</h2>
            {applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map(app => {
                  const sc = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
                  const Icon = sc.icon;
                  return (
                    <div key={app._id} className="group p-6 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: SB, border: `1px solid ${SBR}` }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110" style={{ background: sc.bg }}>
                          <Icon size={20} style={{ color: sc.color }} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-black shadow-sm" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                      <h4 className="text-xl font-black mb-1 truncate" style={{ color: T }}>{app.jobId?.title || 'Unknown Role'}</h4>
                      <p className="text-sm font-semibold mb-4" style={{ color: TM }}>{app.jobId?.company} {app.jobId?.location && <span className="opacity-50"> in {app.jobId.location}</span>}</p>
                      
                      <div className="pt-4 mt-2 border-t flex justify-between items-center" style={{ borderColor: SBR }}>
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: TM }}>
                          <Clock size={12}/> Applied {new Date(app.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: SBR, background: 'transparent' }}>
                <Briefcase size={48} className="mx-auto mb-4 opacity-20" style={{ color: T }} />
                <p className="text-xl font-black mb-2" style={{ color: T }}>No applications discovered</p>
                <p className="text-sm mt-1 mb-6" style={{ color: TM }}>Search our platform and kickstart your career!</p>
                <Link href="/">
                  <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
                    Browse Jobs
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── UPCOMING SCHEDULES ──────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black mb-2" style={{ color: T }}>Scheduled Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schedules.map(s => (
                <div key={s._id} className="p-6 rounded-3xl transition duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: SB, border: `1px solid ${SBR}` }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: s.type === 'interview' ? 'rgba(255,214,10,0.1)' : 'rgba(0,212,255,0.1)' }}>
                      {s.type === 'interview' ? <Video size={20} style={{ color: '#ffd60a' }} /> : <FileText size={20} style={{ color: '#00d4ff' }} />}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-black" style={{ color: TM }}>{s.type}</span>
                      <p className="text-base font-bold leading-tight truncate" style={{ color: T }}>{s.title}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 mb-5 p-4 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <p className="text-xs font-semibold flex items-center gap-2 truncate" style={{ color: TM }}><Briefcase size={14} className="opacity-50"/> {s.jobId?.title} at {s.jobId?.company}</p>
                    <p className="text-xs font-semibold flex items-center gap-2" style={{ color: TM }}><Clock size={14} className="opacity-50"/> {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {s.time}</p>
                    {s.location && <p className="text-xs font-semibold flex items-center gap-2 truncate" style={{ color: TM }}><MapPin size={14} className="opacity-50"/> {s.location}</p>}
                  </div>
                  
                  {s.description && <p className="text-[11px] mb-5 leading-relaxed" style={{ color: TM }}>{s.description}</p>}
                  
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #00d4ff, #007bff)' }}>
                      <Video size={14}/> Enter Link
                    </a>
                  ) : (
                    <span className="flex justify-center items-center w-full py-3 rounded-xl text-[10px] font-bold text-gray-400 bg-gray-500/10 uppercase tracking-widest cursor-not-allowed">No Link Attached</span>
                  )}
                </div>
              ))}
              {schedules.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-20 rounded-3xl border-2 border-dashed" style={{ borderColor: SBR, background: 'transparent' }}>
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" style={{ color: T }} />
                  <p className="text-xl font-black mb-2" style={{ color: T }}>Nothing on the Horizon</p>
                  <p className="text-sm mt-1 mb-6" style={{ color: TM }}>Once a company schedules your interview or exam, it will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ── ASSESSMENTS ─────────────────────────────────────────── */}
        {tab === 'tests' && (
          <div className="space-y-6 animate-fade-in relative text-center py-10">
            <div className="max-w-2xl mx-auto">
               <div className="w-24 h-24 rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
                  <Award size={40} className="text-[#30d158]" />
               </div>
               <h2 className="text-3xl font-black mb-4" style={{ color: T }}>Global Assessments Hub</h2>
               <p className="text-base font-medium mb-10 leading-relaxed" style={{ color: TM }}>
                 We've relocated and vastly expanded our Mock Tests! Traverse a massive library of deeply categorized questions covering General Aptitude, Programming logic (C/C++/Java/C#), Data Interpretation, and intricate Verbal Reasoning. Over 10+ distinct skill categories await your challenge. <span className="font-bold underline text-[#bf5af2]">Boost your JobFit XP</span> to rank higher than other candidates.
               </p>
               <Link href="/assessments">
                 <button className="flex items-center justify-center gap-2 px-10 py-5 mx-auto rounded-3xl text-sm font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
                         style={{ background: 'linear-gradient(135deg, #30d158, #00d4ff)' }}>
                   <Target size={18}/> Access the Assessment Interface
                 </button>
               </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
