import { useState } from 'react';
import { Target, Activity, FileText, CheckCircle, Clock, Award, Loader2, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Link, useLocation } from 'wouter';

export default function AssessmentsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [, setLocation] = useLocation();

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const candidateId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'demo') : 'demo';

  const [activeTest, setActiveTest] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currQ, setCurrQ] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testComplete, setTestComplete] = useState(null);

  const T  = isDark ? '#fff' : '#0a0f1e';
  const TM = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(10,15,30,0.55)';
  const SB = isDark ? 'rgba(255,255,255,0.03)' : '#fff';
  const SBR= isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';

  if (userRole !== 'candidate' && userRole) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
        <h1 className="text-3xl font-black mb-4" style={{ color: T }}>Access Restricted</h1>
        <p className="text-base mb-8" style={{ color: TM }}>Only candidates can take mock assessments.</p>
        <Link href="/"><button className="px-8 py-3 rounded-xl font-bold bg-white/10 text-white">Go Home</button></Link>
      </div>
    );
  }

  const tests = [
    { id: 'aptitude', title: 'General Aptitude', time: '15 mins', points: 25, color: '#00d4ff', diff: 'Intermediate', icon: Target },
    { id: 'logical-reasoning', title: 'Logical Reasoning', time: '15 mins', points: 25, color: '#ff375f', diff: 'Intermediate', icon: Target },
    { id: 'c-programming', title: 'C Programming', time: '20 mins', points: 30, color: '#bf5af2', diff: 'Intermediate', icon: Activity },
    { id: 'c-sharp', title: 'C# Programming', time: '25 mins', points: 40, color: '#30d158', diff: 'Advanced', icon: Activity },
    { id: 'cpp', title: 'C++ Programming', time: '25 mins', points: 40, color: '#00d4ff', diff: 'Advanced', icon: Activity },
    { id: 'java', title: 'Java Programming', time: '25 mins', points: 40, color: '#ffd60a', diff: 'Advanced', icon: Activity },
    { id: 'data-interpretation', title: 'Data Interpretation', time: '30 mins', points: 50, color: '#bf5af2', diff: 'Hard', icon: FileText },
    { id: 'non-verbal', title: 'Non-Verbal Reasoning', time: '10 mins', points: 20, color: '#ff375f', diff: 'Intermediate', icon: Target },
    { id: 'verbal-ability', title: 'Verbal Ability', time: '15 mins', points: 25, color: '#30d158', diff: 'Intermediate', icon: FileText },
    { id: 'verbal-reasoning', title: 'Verbal Reasoning', time: '20 mins', points: 35, color: '#ffd60a', diff: 'Hard', icon: FileText }
  ];

  const submitTest = async (points) => {
    try {
      if (userRole === 'candidate') {
        await fetch(`/api/dashboard/candidate/${candidateId}/mocktest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointsEarned: points })
        });
      }
      setTestMode(false);
      setTestComplete({ points });
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
      setTestComplete(null);
    } catch (e) { console.error(e); }
  };

  const handleAnswerClick = (idx) => {
    const isCorrect = idx === testQuestions[currQ].correctOptionIndex;
    if (isCorrect) setTestScore(p => p + 1);
    
    if (currQ + 1 < testQuestions.length) {
      setCurrQ(p => p + 1);
    } else {
      // End of test calculation
      const finalScore = testScore + (isCorrect ? 1 : 0);
      const earned = finalScore >= Math.ceil(testQuestions.length / 2) ? activeTest.points : Math.floor(activeTest.points / 2);
      submitTest(earned);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 relative" style={{ background: isDark ? '#000' : '#f0f4f8' }}>
      <div className="absolute top-0 left-0 w-full h-96 opacity-10 pointer-events-none" 
           style={{ background: 'radial-gradient(ellipse at 50% -20%, #30d158, transparent 70%)' }} />
           
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 shadow-md" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
            <Award size={12} className="text-[#30d158]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#30d158]">Global Assessment Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: T }}>
            Challenge Your Limits
          </h1>
          <p className="text-base font-medium max-w-xl mx-auto" style={{ color: TM }}>
            Attempt comprehensive mock exams to drastically boost your <span style={{ color: '#bf5af2', fontWeight: 800 }}>JobFit Score</span> and stand out to top recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tests.map(test => (
            <div key={test.id} className="relative group p-6 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden flex flex-col justify-between" style={{ background: SB, border: `1px solid ${SBR}`, minHeight: '260px' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl transition-transform group-hover:scale-150" style={{ background: test.color }} />
              <div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${test.color}15` }}>
                    <test.icon size={24} style={{ color: test.color }} />
                  </div>
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-sm" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: TM }}>{test.diff}</span>
                </div>
                <h3 className="text-lg font-black mb-2 relative z-10 leading-tight" style={{ color: T }}>{test.title}</h3>
              </div>
              <div>
                <div className="flex items-center gap-4 text-xs font-semibold mt-2 mb-5 relative z-10" style={{ color: TM }}>
                  <span className="flex items-center gap-1.5"><Clock size={14}/> {test.time}</span>
                  <span className="flex items-center gap-1.5" style={{ color: test.color }}><Target size={14}/> +{test.points} XP</span>
                </div>
                <button onClick={() => {
                    if (!userRole) { alert('Please login as a Candidate first.'); setLocation('/login'); return; }
                    setActiveTest(test); // Make sure modal opens
                    setTestComplete(null);
                  }} 
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95 relative z-10" 
                  style={{ background: `linear-gradient(135deg, ${test.color}, ${test.color}99)` }}>
                  Play Mock Test
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Global Test Execution Modal overlay */}
        {activeTest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { if(!testComplete) setActiveTest(null); }} />
            <div className="relative w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-fade-in" style={{ background: isDark ? '#111' : '#fff', border: `1px solid ${SBR}` }}>
              <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ background: activeTest.color }} />
              
              <div className="relative z-10 w-full">
                {testComplete ? (
                  <div className="text-center py-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative" style={{ background: 'rgba(48,209,88,0.1)' }}>
                      <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#30d158' }}></div>
                      <CheckCircle size={48} style={{ color: '#30d158' }} className="animate-fade-in" />
                    </div>
                    <h2 className="text-3xl font-black mb-2" style={{ color: T }}>Assessment Cleared</h2>
                    <p className="text-sm font-bold mb-6 mt-1 uppercase tracking-widest" style={{ color: '#30d158' }}>Intelligence Acquired</p>
                    
                    <div className="py-4 px-6 rounded-2xl inline-block mb-10 shadow-inner" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                      <p className="text-xs font-semibold mb-1 opacity-70" style={{ color: TM }}>Payload Granted</p>
                      <p className="text-4xl font-black" style={{ color: activeTest.color }}>+{testComplete.points} <span className="text-sm">XP</span></p>
                    </div>
                    
                    <button onClick={() => { setTestComplete(null); setActiveTest(null); setLocation('/candidate'); }} className="w-full py-4 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-xl" style={{ background: 'linear-gradient(135deg, #30d158, #bf5af2)' }}>
                      Return to Mission Control
                    </button>
                  </div>
                ) : !testMode ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: `${activeTest.color}15` }}>
                        <activeTest.icon size={20} style={{ color: activeTest.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black leading-tight" style={{ color: T }}>{activeTest.title}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: activeTest.color }}>{activeTest.points} JobFit XP Reward</p>
                      </div>
                    </div>
                    <div className="mb-8 p-5 rounded-2xl space-y-4" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${SBR}` }}>
                      <p className="text-sm font-semibold leading-relaxed" style={{ color: T }}>
                        You are about to launch the <span style={{ color: activeTest.color }}>{activeTest.title}</span> Challenge. Question pools are strictly randomized.
                      </p>
                      <ul className="text-xs space-y-2.5 opacity-80" style={{ color: TM }}>
                        <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: activeTest.color }}/> Stable internet connection is required.</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: activeTest.color }}/> Answer 5 consecutive questions to calculate accuracy.</li>
                        <li className="flex items-center gap-2"><CheckCircle size={14} style={{ color: activeTest.color }}/> Scoring majority earns full JobFit XP payload.</li>
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setActiveTest(null); setTestMode(false); }} className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: T }}>Decline</button>
                      <button onClick={startRealTest} className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-xl" style={{ background: `linear-gradient(135deg, ${activeTest.color}, ${activeTest.color}99)` }}>
                        Engage Assessment
                      </button>
                    </div>
                  </>
                ) : testQuestions.length === 0 ? (
                   <div className="py-20 text-center flex flex-col items-center justify-center">
                     <Loader2 className="animate-spin mb-4" size={32} style={{ color: activeTest.color }}/>
                     <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TM }}>Pulling Assessment Data...</span>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: SBR }}>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-opacity-20 px-3 py-1 rounded-full" style={{ color: activeTest.color, background: `${activeTest.color}20` }}>Question {currQ + 1} of {testQuestions.length}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TM }}>{activeTest.title}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-8 leading-relaxed" style={{ color: T }}>{testQuestions[currQ].text}</h3>
                    <div className="space-y-3 mb-6">
                      {testQuestions[currQ].options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswerClick(i)} className="w-full text-left p-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${SBR}`, color: T }}>
                          <span className="opacity-50 mr-3 inline-block w-4 font-black" style={{ color: activeTest.color }}>{String.fromCharCode(65 + i)}</span> 
                          <span className="leading-snug">{opt}</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <button onClick={() => { setActiveTest(null); setTestMode(false); }} className="px-4 py-2 rounded-lg text-[10px] font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-50 uppercase tracking-widest" style={{ color: T }}>Abort Protocol</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
