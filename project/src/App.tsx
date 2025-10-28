import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { UserProvider } from './contexts/UserContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/student/Home';
import PromptEngineering from './pages/student/PromptEngineering';
import VibeCoding from './pages/student/VibeCoding';
import Courses from './pages/student/Courses';
import AITools from './pages/student/AITools';
import CareerBooster from './pages/student/CareerBooster';
import AIDigest from './pages/student/AIDigest';
import AIMentor from './pages/student/AIMentor';
import Profile from './pages/student/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManagePromptEngineering from './pages/admin/ManagePromptEngineering';
import ManageVibeCoding from './pages/admin/ManageVibeCoding';
import PostNews from './pages/admin/PostNews';
import ProjectsManager from './pages/admin/ProjectsManager';
import PostJobs from './pages/admin/PostJobs';
import ViewStudents from './pages/admin/ViewStudents';
import ManageAITools from './pages/admin/ManageAITools';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';

  // Show login/signup pages without sidebar and navbar
  if (isLogin || isSignup) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  return (
    <div className={`min-h-screen ${isAdmin ? 'bg-admin-bg' : 'bg-primary-bg'}`}>
      <Sidebar isAdmin={isAdmin} />
      <Navbar isAdmin={isAdmin} />

      <main className="ml-72 pt-24 px-8 pb-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prompt-engineering" element={<PromptEngineering />} />
          <Route path="/vibe-coding" element={<VibeCoding />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/career" element={<CareerBooster />} />
          <Route path="/digest" element={<AIDigest />} />
          <Route path="/mentor" element={<AIMentor />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<ManageCourses />} />
          <Route path="/admin/prompt-engineering" element={<ManagePromptEngineering />} />
          <Route path="/admin/vibe-coding" element={<ManageVibeCoding />} />
          <Route path="/admin/news" element={<PostNews />} />
          <Route path="/admin/projects" element={<ProjectsManager />} />
          <Route path="/admin/jobs" element={<PostJobs />} />
          <Route path="/admin/ai-tools" element={<ManageAITools />} />
          <Route path="/admin/students" element={<ViewStudents />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
