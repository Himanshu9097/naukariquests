import { useState, useRef, useCallback } from 'react';
import {
  Upload, Zap, CheckCircle, AlertCircle, GraduationCap, Loader2,
  AlertTriangle, Briefcase, ChevronDown, ChevronUp, Copy, Check,
  Sparkles, BookOpen, TrendingUp, Award, Target, FileText, X,
} from 'lucide-react';
import TerminalLog from '@/components/TerminalLog';
import JobCard from '@/components/JobCard';
import { useTheme } from '@/lib/theme';

const RESUME_LOGS = [
  '$ Uploading resume to AI parser...',
  '$ Extracting text with NLP engine...',
  '$ Scanning contact info (name, email, phone)...',
  '$ Detecting career field (DS / Web / Android / iOS / UI-UX)...',
  '$ Mapping skills against market demand...',
  '$ Running 5-point ATS compatibility check...',
  '$ Scoring resume sections (Objective, Projects, Achievements)...',
  '$ Calculating weighted ATS score...',
  '$ Fetching matching Indian jobs from database...',
  '$ Curating field-specific course recommendations...',
  '$ Analysis complete ✓',
];

const LEVEL_CONFIG = {
  Fresher:      { color: '#30d158', bg: 'rgba(48,209,88,0.12)',   label: 'Fresher',      emoji: '🌱' },
  Intermediate: { color: '#ffd60a', bg: 'rgba(255,214,10,0.12)',  label: 'Intermediate', emoji: '🚀' },
  Experienced:  { color: '#bf5af2', bg: 'rgba(191,90,242,0.12)',  label: 'Experienced',  emoji: '⚡' },
};

// ── ATS Score Ring (MyPerfectResume-style) ──────────────────────────────────
function ScoreRing({ score, isDark }) {
  const color = score >= 80 ? '#30d158' : score >= 60 ? '#ffd60a' : '#ff375f';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
  const sublabel = score >= 80 ? 'ATS Ready' : score >= 60 ? 'Mostly Optimised' : 'Needs Improvement';
  const r = 52; const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="absolute inset-0" width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} strokeWidth="10" />
          <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 8px ${color}60)` }} />
        </svg>
        <div className="text-center z-10">
          <div className="text-5xl font-black font-mono leading-none" style={{ color }}>{score}</div>
          <div className="text-[10px] font-mono mt-1 opacity-40">/ 100</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-black" style={{ color }}>{label}</div>
        <div className="text-[11px] opacity-50 mt-0.5">{sublabel}</div>
      </div>
    </div>
  );
}

// ── ATS Checkpoint Accordion ────────────────────────────────────────────────
function CheckpointItem({ cp, isDark }) {
  const [open, setOpen] = useState(false);
  const isPass = cp.status === 'pass'; const isWarn = cp.status === 'warning';
  const color = isPass ? '#30d158' : isWarn ? '#ffd60a' : '#ff375f';
  const bg    = isPass ? 'rgba(48,209,88,0.06)' : isWarn ? 'rgba(255,214,10,0.06)' : 'rgba(255,55,95,0.06)';
  const border= isPass ? 'rgba(48,209,88,0.2)'  : isWarn ? 'rgba(255,214,10,0.2)'  : 'rgba(255,55,95,0.2)';
  const Icon  = isPass ? CheckCircle : isWarn ? AlertTriangle : AlertCircle;
  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ background: bg, border: `1px solid ${border}` }}>
      <button className="w-full flex items-center gap-3 p-3.5 text-left" onClick={() => cp.fix && setOpen(o => !o)}>
        <Icon size={15} className="shrink-0" style={{ color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest" style={{ background: `${color}20`, color }}>{cp.category}</span>
            <span className="text-xs font-bold" style={{ color: isDark ? '#fff' : '#0a0f1e' }}>{cp.title}</span>
          </div>
          <p className="text-[11px] mt-0.5 leading-relaxed opacity-55">{cp.detail}</p>
        </div>
        {cp.fix && <div className="shrink-0 opacity-30">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>}
      </button>
      {open && cp.fix && (
        <div className="px-4 pb-3.5 -mt-1">
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Zap size={11} className="shrink-0 mt-0.5 text-yellow-400" />
            <p className="text-[11px] leading-relaxed opacity-75"><span className="font-bold text-yellow-400">Fix: </span>{cp.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Bar ─────────────────────────────────────────────────────────────
function SectionBar({ score, isDark }) {
  const color = score >= 80 ? '#30d158' : score >= 40 ? '#ffd60a' : '#ff375f';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)' }}>Resume Completeness</span>
        <span className="font-black" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
    </div>
  );
}

export default function ResumeMatchPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState('upload');
  const [targetJob, setTargetJob] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const T  = isDark ? '#fff'                        : '#0a0f1e';
  const TM = isDark ? 'rgba(255,255,255,0.42)'      : 'rgba(10,15,30,0.55)';
  const SB = isDark ? 'rgba(255,255,255,0.03)'      : '#ffffff';
  const SBR= isDark ? 'rgba(255,255,255,0.07)'      : 'rgba(0,0,0,0.12)';
  const PBG= isDark ? '#000'                        : '#f0f4f8';

  const getResumeData = useCallback(async () => {
    if (mode === 'paste') return { text: pastedText, fileUrl: null };
    if (!file) return { text: '', fileUrl: null };
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch('/api/resume/extract', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.text) return { text: d.text, fileUrl: d.fileUrl || null };
      throw new Error(d.error || 'Extraction failed');
    } catch { return { text: `Could not extract ${file?.name}. Please paste text instead.`, fileUrl: null }; }
  }, [mode, pastedText, file]);

  const handleAnalyze = () => {
    const ok = mode === 'paste' ? pastedText.trim().length >= 50 : !!file;
    if (!ok) { setError(mode === 'paste' ? 'Paste at least 50 characters of your resume.' : 'Please upload a PDF or DOCX file.'); return; }
    setError(''); setAnalyzing(true); setAnalysisDone(false); setParsed(null);
  };

  const handleTerminalComplete = useCallback(async () => {
    setAiLoading(true);
    try {
      const { text, fileUrl } = await getResumeData();
      const r = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetJob, linkedinUrl, fileUrl }),
      });
      if (!r.ok) throw new Error('Analysis failed – please try again.');
      const data = await r.json();
      setParsed(data);
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); setAnalyzing(false); setAnalysisDone(true); }
  }, [getResumeData, targetJob, linkedinUrl]);

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      const { text } = await getResumeData();
      const r = await fetch('/api/resume/rewrite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetJob, skills: parsed?.skills }),
      });
      const d = await r.json();
      setRewrittenResume(d.rewritten || '');
    } catch {}
    finally { setRewriting(false); }
  };

  const levelCfg = parsed ? (LEVEL_CONFIG[parsed.candidate_level] || LEVEL_CONFIG.Fresher) : null;
  const passCount = parsed?.checkpoints?.filter(c => c.status === 'pass').length ?? 0;
  const failCount = parsed?.checkpoints?.filter(c => c.status === 'fail').length ?? 0;
  const warnCount = parsed?.checkpoints?.filter(c => c.status === 'warning').length ?? 0;

  return (
    <div className="min-h-screen grid-bg" style={{ background: PBG }}>
      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">

        {/* ── Landing / Upload Form ─────────────────────────────────────── */}
        {!analysisDone && !analyzing && (
          <>
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.25)' }}>
                <Sparkles size={13} className="text-[#bf5af2]" />
                <span className="text-xs font-black tracking-wide text-[#bf5af2]">ATS Resume Checker</span>
              </div>
              <h1 className="text-4xl font-black leading-tight" style={{ color: T }}>
                Is Your Resume <span className="text-[#bf5af2]">ATS Ready</span>?
              </h1>
              <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: TM }}>
                Upload your resume and get an instant ATS score, skill gap analysis, field-matched courses, and real Indian job matches — just like MyPerfectResume.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-8 space-y-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
              {/* Mode Toggle */}
              <div className="flex gap-2">
                {['upload', 'paste'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: mode === m ? '#bf5af2' : 'transparent',
                      color: mode === m ? '#fff' : TM,
                      border: `1.5px solid ${mode === m ? '#bf5af2' : SBR}`
                    }}>
                    {m === 'upload' ? <><Upload size={13} /> Upload PDF / DOCX</> : <><FileText size={13} /> Paste Text</>}
                  </button>
                ))}
              </div>

              {/* Upload Zone */}
              {mode === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-48 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                  style={{ borderColor: file ? '#bf5af2' : SBR, background: file ? 'rgba(191,90,242,0.04)' : 'transparent' }}>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                    onChange={e => { setFile(e.target.files[0]); setError(''); }} />
                  {file ? (
                    <>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(191,90,242,0.15)' }}>
                        <FileText size={22} className="text-[#bf5af2]" />
                      </div>
                      <p className="text-sm font-bold text-[#bf5af2]">{file.name}</p>
                      <p className="text-[11px] mt-1" style={{ color: TM }}>{(file.size / 1024).toFixed(0)} KB — click to change</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg" style={{ background: 'rgba(255,55,95,0.1)' }}>
                        <X size={13} className="text-[#ff375f]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(191,90,242,0.08)' }}>
                        <Upload size={24} style={{ color: TM }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: TM }}>Drop your resume here or click to browse</p>
                      <p className="text-[11px] mt-1" style={{ color: TM }}>PDF, DOC, DOCX — max 10MB</p>
                    </>
                  )}
                </div>
              ) : (
                <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
                  placeholder="Paste your complete resume text here..." rows={9}
                  className="w-full p-4 rounded-xl outline-none resize-none text-sm leading-relaxed"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', border: `1.5px solid ${SBR}`, color: T }} />
              )}

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" style={{ color: T }} />
                  <input value={targetJob} onChange={e => setTargetJob(e.target.value)}
                    placeholder="Target job role (e.g. React Developer)"
                    className="w-full pl-9 pr-4 py-3 rounded-xl outline-none text-sm"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', border: `1.5px solid ${SBR}`, color: T }} />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40" style={{ color: T }}>🔗</span>
                  <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn URL (optional)"
                    className="w-full pl-9 pr-4 py-3 rounded-xl outline-none text-sm"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', border: `1.5px solid ${SBR}`, color: T }} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,55,95,0.08)', border: '1px solid rgba(255,55,95,0.2)' }}>
                  <AlertCircle size={14} className="text-[#ff375f] shrink-0" />
                  <p className="text-xs text-[#ff375f]">{error}</p>
                </div>
              )}

              <button onClick={handleAnalyze}
                className="w-full py-4 rounded-xl font-black text-sm tracking-wide text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #bf5af2 0%, #7c3aed 50%, #00d4ff 100%)', boxShadow: '0 8px 32px rgba(191,90,242,0.4)' }}>
                ⚡ Check ATS Score Now — It's Free
              </button>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {['✅ ATS Score', '🏷️ Field Detection', '💡 Skill Gaps', '🎓 Curated Courses', '💼 Indian Jobs'].map(f => (
                  <span key={f} className="text-[10px] px-3 py-1 rounded-full font-semibold" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: TM }}>{f}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Terminal Log ─────────────────────────────────────────────── */}
        {(analyzing || analysisDone) && (
          <TerminalLog active={analyzing} onComplete={handleTerminalComplete} customLogs={RESUME_LOGS} keepAlive={analysisDone} />
        )}

        {/* ── Loading State ─────────────────────────────────────────────── */}
        {aiLoading && (
          <div className="mt-8 flex flex-col items-center justify-center p-16 text-center rounded-2xl" style={{ background: SB, border: `1px solid ${SBR}` }}>
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-[#bf5af2]/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#bf5af2]" />
              </div>
            </div>
            <h3 className="text-xl font-black" style={{ color: T }}>Analysing Your Resume...</h3>
            <p className="text-sm mt-2" style={{ color: TM }}>Detecting field • Scoring ATS checkpoints • Fetching curated courses & Indian jobs</p>
          </div>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────── */}
        {analysisDone && parsed && !aiLoading && (
          <div className="mt-6 space-y-6">

            {/* ── Top Summary Card (MyPerfectResume style) ─────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${SBR}` }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(191,90,242,0.08), rgba(0,212,255,0.05))' }}>
                <div>
                  <h2 className="text-xl font-black" style={{ color: T }}>{parsed.name || 'Tech Professional'}</h2>
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#bf5af2' }}>{parsed.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {levelCfg && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black" style={{ background: levelCfg.bg, color: levelCfg.color }}>
                      {levelCfg.emoji} {levelCfg.label}
                    </span>
                  )}
                  {parsed.predicted_field && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>
                      🏷️ {parsed.predicted_field}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Score Ring */}
                  <div className="shrink-0">
                    <ScoreRing score={parsed.ats_score} isDark={isDark} />
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block h-36 w-px" style={{ background: SBR }} />

                  {/* Stats Grid */}
                  <div className="flex-1 w-full space-y-4">
                    <SectionBar score={parsed.section_score ?? 0} isDark={isDark} />
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Passed', val: passCount, color: '#30d158' },
                        { label: 'Warnings', val: warnCount, color: '#ffd60a' },
                        { label: 'Failed', val: failCount, color: '#ff375f' },
                      ].map(s => (
                        <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                          <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
                          <div className="text-[10px] font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.skills?.slice(0, 14).map(s => (
                        <span key={s} className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: 'rgba(191,90,242,0.1)', color: '#bf5af2', border: '1px solid rgba(191,90,242,0.2)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ATS Checkpoints ───────────────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
              <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: T }}>
                <Target size={16} className="text-[#bf5af2]" /> ATS Checkpoint Results
                <span className="text-[10px] font-normal opacity-40 ml-1">— based on MyPerfectResume methodology</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsed.checkpoints?.map((cp, i) => <CheckpointItem key={i} cp={cp} isDark={isDark} />)}
              </div>
            </div>

            {/* ── Section Tips (Python logic) ───────────────────────────── */}
            {parsed.section_tips?.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: T }}>
                  <Award size={16} className="text-[#ffd60a]" /> Resume Section Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {parsed.section_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-[11px] leading-snug"
                      style={{ background: tip.found ? 'rgba(48,209,88,0.06)' : 'rgba(255,214,10,0.06)', border: `1px solid ${tip.found ? 'rgba(48,209,88,0.2)' : 'rgba(255,214,10,0.15)'}` }}>
                      <span className="text-base leading-none">{tip.found ? '✅' : '⚠️'}</span>
                      <span style={{ color: tip.found ? '#30d158' : '#ffd60a' }}>{tip.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recommended Skills ─────────────────────────────────────── */}
            {parsed.recommended_skills?.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
                <h3 className="text-sm font-black mb-1 flex items-center gap-2" style={{ color: T }}>
                  <TrendingUp size={16} className="text-[#30d158]" />
                  Recommended Skills for&nbsp;<span className="text-[#30d158]">{parsed.predicted_field}</span>
                </h3>
                <p className="text-[11px] mb-4" style={{ color: TM }}>
                  <span className="text-[#30d158] font-bold">✓ Green</span> = already in your resume &nbsp;|&nbsp;
                  <span className="text-yellow-400 font-bold">+ Yellow</span> = add to boost ATS score 🚀
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsed.recommended_skills.map(s => {
                    const has = parsed.skills?.some(sk => sk.toLowerCase() === s.toLowerCase());
                    return (
                      <span key={s} className="text-[11px] px-3 py-1.5 rounded-full font-bold transition-all"
                        style={{ background: has ? 'rgba(48,209,88,0.1)' : 'rgba(255,214,10,0.08)', color: has ? '#30d158' : '#ffd60a', border: `1px solid ${has ? 'rgba(48,209,88,0.25)' : 'rgba(255,214,10,0.2)'}` }}>
                        {has ? '✓ ' : '+ '}{s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AI Career Tips + Rewrite ──────────────────────────────── */}
            <div className="rounded-2xl p-6" style={{ background: SB, border: `1px solid ${SBR}` }}>
              <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: T }}>
                <Sparkles size={15} className="text-[#bf5af2]" /> AI Career Coach Tips
              </h3>
              <div className="space-y-2 mb-5">
                {parsed.improvement_tips?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
                    style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span style={{ color: TM }}>{tip}</span>
                  </div>
                ))}
              </div>
              {!rewrittenResume ? (
                <button onClick={handleRewrite} disabled={rewriting}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #bf5af2, #00d4ff)', opacity: rewriting ? 0.7 : 1 }}>
                  {rewriting
                    ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Rewriting...</span>
                    : '✨ Rewrite My Resume with AI'}
                </button>
              ) : (
                <div className="relative mt-2">
                  <div className="p-4 rounded-xl font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                    style={{ background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.04)', border: `1px solid ${SBR}`, color: T }}>
                    {rewrittenResume}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(rewrittenResume).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
                    className="absolute top-2 right-2 p-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} style={{ color: TM }} />}
                  </button>
                </div>
              )}
            </div>

            {/* ── Matched Indian Jobs ──────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: T }}>
                <Briefcase size={16} className="text-[#00d4ff]" /> Best Matched Indian Jobs
              </h3>
              {parsed.matchedJobs?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsed.matchedJobs.map((j, i) => <JobCard key={i} job={j} index={i} />)}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl" style={{ background: SB, border: `1px solid ${SBR}` }}>
                  <Briefcase size={30} className="mx-auto mb-2 opacity-25" style={{ color: T }} />
                  <p className="text-sm font-semibold" style={{ color: TM }}>No matching jobs in the portal yet.</p>
                  <p className="text-[11px] mt-1" style={{ color: TM }}>Companies can post jobs via the NaukriQuest Portal.</p>
                </div>
              )}
            </div>

            {/* ── Field Courses (from Courses.py) ──────────────────────── */}
            {parsed.field_courses?.length > 0 && (
              <div>
                <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: T }}>
                  <BookOpen size={16} className="text-[#30d158]" />
                  Courses & Certificates for&nbsp;<span className="text-[#30d158]">{parsed.predicted_field}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parsed.field_courses.map((c, i) => (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer"
                      className="flex items-start gap-3.5 p-4 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: SB, border: `1px solid ${SBR}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: c.type === 'Free' ? 'rgba(48,209,88,0.12)' : 'rgba(0,212,255,0.1)' }}>
                        <GraduationCap size={16} style={{ color: c.type === 'Free' ? '#30d158' : '#00d4ff' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-snug" style={{ color: T }}>{c.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px]" style={{ color: TM }}>{c.provider}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
                            style={{ background: c.type === 'Free' ? 'rgba(48,209,88,0.12)' : 'rgba(0,212,255,0.1)', color: c.type === 'Free' ? '#30d158' : '#00d4ff' }}>
                            {c.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Scan Again ────────────────────────────────────────────── */}
            <div className="flex justify-center pb-12">
              <button
                onClick={() => { setAnalysisDone(false); setAnalyzing(false); setParsed(null); setRewrittenResume(''); setFile(null); setPastedText(''); setError(''); }}
                className="flex items-center gap-2 text-xs font-black px-8 py-3 rounded-xl border transition-all hover:scale-[1.01]"
                style={{ borderColor: SBR, color: TM }}>
                🔄 Scan Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
