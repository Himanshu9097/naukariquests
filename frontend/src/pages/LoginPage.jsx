import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { User, Building2, ChevronLeft, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const textPrimary = isDark ? '#ffffff' : '#0a0f1e';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(10,15,30,0.5)';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.85)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter email and password');
    if (!isLogin && !name) return alert('Please enter name');

    setLoading(true);

    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user._id || '');
        if (data.user.profilePic) localStorage.setItem('profilePic', data.user.profilePic);

        if (data.user.role === 'company') setLocation('/recruiter');
        else setLocation('/candidate');
        
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user._id || '');
        if (data.user.profilePic) localStorage.setItem('profilePic', data.user.profilePic);

        if (data.user.role === 'company') setLocation('/recruiter');
        else setLocation('/candidate');
      }
    } catch(err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg relative overflow-x-hidden" style={{ background: isDark ? '#000000' : '#f0f4f8' }}>


      <div className="relative z-10 max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: textPrimary }}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
          <p className="text-sm" style={{ color: textMuted }}>
            {isLogin ? 'Sign in to continue to NaukriQuest AI' : 'Join the future of hiring today'}
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-6" style={{ background: surfaceBg, border: `1px solid ${surfaceBorder}` }}>
          <div className="flex gap-4 mb-6">
            <button onClick={() => setIsLogin(true)} className={`text-sm font-bold pb-2 ${isLogin ? 'border-b-2 border-[#00d4ff] text-[#00d4ff]' : 'text-gray-500'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`text-sm font-bold pb-2 ${!isLogin ? 'border-b-2 border-[#00d4ff] text-[#00d4ff]' : 'text-gray-500'}`}>Sign Up</button>
          </div>

          {!isLogin && (
            <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <button type="button" onClick={() => setRole('candidate')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'candidate' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>
                <User size={16} /> Candidate
              </button>
              <button type="button" onClick={() => setRole('company')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'company' ? 'bg-[#bf5af2] text-white shadow-md' : 'text-gray-500'}`}>
                <Building2 size={16} /> Company
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: textMuted }}>Full Name / Company Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${surfaceBorder}`, color: textPrimary }} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: textMuted }}>Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={!isLogin && role === 'company' ? 'hr@company.com' : 'you@example.com'} className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${surfaceBorder}`, color: textPrimary }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: textMuted }}>Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${surfaceBorder}`, color: textPrimary }} />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50" style={{ background: !isLogin && role === 'company' ? '#bf5af2' : '#00d4ff', color: !isLogin && role === 'company' ? '#ffffff' : '#000000' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : `Sign Up as ${role === 'company' ? 'Company' : 'Candidate'}`)} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
