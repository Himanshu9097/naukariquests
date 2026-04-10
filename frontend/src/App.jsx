import { Switch, Route, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/lib/theme';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import ResumeMatchPage from '@/pages/ResumeMatchPage';
import AssessmentsPage from '@/pages/AssessmentsPage';
import ApplyPage from '@/pages/ApplyPage';
import PortalPage from '@/pages/PortalPage';
import AdminDashboard from '@/pages/AdminDashboard';
import RecruiterDashboard from '@/pages/RecruiterDashboard';
import CandidateDashboard from '@/pages/CandidateDashboard';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';
import NavBar from '@/components/NavBar';
import AIChatbot from '@/components/AIChatbot';
import CustomCursor from '@/components/CustomCursor';

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/resume-match" component={ResumeMatchPage} />
      <Route path="/assessments" component={AssessmentsPage} />
      <Route path="/apply" component={ApplyPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/recruiter" component={RecruiterDashboard} />
      <Route path="/candidate" component={CandidateDashboard} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter>
        <CustomCursor />
        <NavBar />
        <AppRouter />
        <AIChatbot />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
