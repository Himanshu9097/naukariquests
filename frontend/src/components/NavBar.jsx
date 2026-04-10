import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Zap, LayoutDashboard, BookOpen, Target, Send,
  Briefcase, User, Sun, Moon, Menu, X, Shield, UserCircle, LogOut,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function NavBar() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const isDark = theme === 'dark';

  // Read auth state from localStorage
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setUserRole(localStorage.getItem('userRole'));
      setUserName(localStorage.getItem('userName'));
    };
    checkAuth();
    // Re-check on storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);
    // Also re-check on route changes by polling
    const iv = setInterval(checkAuth, 500);
    return () => { window.removeEventListener('storage', checkAuth); clearInterval(iv); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('profilePic');
    setUserRole(null);
    setUserName(null);
    setLocation('/login');
  };

  const textPrimary = isDark ? '#ffffff' : '#0a0f1e';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(10,15,30,0.45)';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const navBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';

  // Build nav links based on auth state
  const baseLinks = [
    { href: '/', icon: <LayoutDashboard size={13} />, mIcon: <LayoutDashboard size={14} />, label: 'Jobs', mLabel: 'AI Job Search', color: '#00d4ff' },
    { href: '/courses', icon: <BookOpen size={13} />, mIcon: <BookOpen size={14} />, label: 'Courses', mLabel: 'Free & Paid Courses', color: '#30d158' },
    { href: '/resume-match', icon: <Target size={13} />, mIcon: <Target size={14} />, label: 'Resume', mLabel: 'Resume Match AI', color: '#bf5af2' },
    { href: '/assessments', icon: <Target size={13} />, mIcon: <Target size={14} />, label: 'Tests', mLabel: 'Mock Assessments', color: '#30d158' },
    { href: '/apply', icon: <Send size={13} />, mIcon: <Send size={14} />, label: 'Apply AI', mLabel: 'Apply Assistant', color: '#00d4ff' },
    { href: '/portal', icon: <Briefcase size={13} />, mIcon: <Briefcase size={14} />, label: 'Portal', mLabel: 'Job Portal', color: '#ffd60a' },
  ];

  // Role-specific links
  if (userRole === 'company') {
    baseLinks.push({ href: '/recruiter', icon: <Shield size={13} />, mIcon: <Shield size={14} />, label: 'Dashboard', mLabel: 'Recruiter Dashboard', color: '#bf5af2' });
  } else if (userRole === 'candidate') {
    baseLinks.push({ href: '/candidate', icon: <UserCircle size={13} />, mIcon: <UserCircle size={14} />, label: 'Dashboard', mLabel: 'Candidate Dashboard', color: '#00d4ff' });
    baseLinks.push({ href: '/profile', icon: <User size={13} />, mIcon: <User size={14} />, label: 'Profile', mLabel: 'My Profile & Alerts', color: '#30d158' });
  }


  return (
    <nav className="relative z-50 apple-nav border-b" style={{ borderColor: navBorder }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #00d4ff, #0055ff)' }}>
                <Zap size={15} color="#000" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-black text-sm tracking-tight" style={{ color: textPrimary }}>NaukriQuest</span>
                <span className="gradient-text-cyan font-black text-sm tracking-tight"> AI</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {baseLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all hover:bg-white/5" style={{ color: textMuted }}>
                  {l.icon} {l.label}
                </button>
              </Link>
            ))}

            <span className="w-px h-4 mx-1" style={{ background: surfaceBorder }} />

            {userRole ? (
              <>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                  background: userRole === 'company' ? 'rgba(191,90,242,0.1)' : 'rgba(0,212,255,0.1)',
                  color: userRole === 'company' ? '#bf5af2' : '#00d4ff'
                }}>
                  {userName || userRole}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 text-xs px-2 py-2 rounded-lg transition-all hover:bg-white/5" style={{ color: '#ff375f' }}>
                  <LogOut size={12} />
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all hover:bg-white/5" style={{ color: textMuted }}>
                  <User size={13} /> Login
                </button>
              </Link>
            )}

            <button onClick={toggleTheme} className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10" style={{ border: `1px solid ${surfaceBorder}`, color: textMuted }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: surfaceBg, border: `1px solid ${surfaceBorder}`, color: textMuted }}>
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: surfaceBg, border: `1px solid ${surfaceBorder}` }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={16} style={{ color: textPrimary }} /> : <Menu size={16} style={{ color: textMuted }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute w-full left-0 border-b shadow-2xl" style={{ background: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,244,248,0.98)', borderColor: navBorder }}>
          <div className="px-4 py-3 space-y-1">
            {baseLinks.map(({ href, mIcon, mLabel, color }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-white/5" style={{ border: `1px solid ${surfaceBorder}` }}>
                  <span style={{ color }}>{mIcon}</span>
                  <span className="text-sm" style={{ color: textPrimary }}>{mLabel}</span>
                </div>
              </Link>
            ))}

            {/* Auth button in mobile */}
            {userRole ? (
              <div className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ border: `1px solid ${surfaceBorder}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                    background: userRole === 'company' ? 'rgba(191,90,242,0.1)' : 'rgba(0,212,255,0.1)',
                    color: userRole === 'company' ? '#bf5af2' : '#00d4ff'
                  }}>
                    {userRole === 'company' ? '🛡️ Recruiter' : '👤 Candidate'}
                  </span>
                  <span className="text-sm" style={{ color: textPrimary }}>{userName}</span>
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,55,95,0.1)', color: '#ff375f' }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-white/5" style={{ border: `1px solid ${surfaceBorder}` }}>
                  <span style={{ color: '#ff375f' }}><User size={14} /></span>
                  <span className="text-sm" style={{ color: textPrimary }}>Login</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
