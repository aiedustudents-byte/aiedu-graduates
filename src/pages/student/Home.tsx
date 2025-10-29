import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Zap, ArrowRight, BookOpen, Users, Award, Clock, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useUser } from '../../contexts/UserContext';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

const motivationalQuotes = [
  'The future belongs to those who learn more skills and combine them in creative ways.',
  'AI is not here to replace you, but to amplify your capabilities.',
  'Every expert was once a beginner who refused to give up.',
  'In the age of AI, continuous learning is not optional, it is essential.',
];

const aiTips = [
  'Master prompt engineering: specificity and context are your best friends.',
  'Understanding token limits helps you craft better AI conversations.',
  'Break complex problems into smaller steps for better AI assistance.',
  'Always verify AI outputs - critical thinking remains irreplaceable.',
];

export default function Home() {
  const [quote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [tip] = useState(aiTips[Math.floor(Math.random() * aiTips.length)]);
  const [courses, setCourses] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('');
  const [userStats, setUserStats] = useState({
    coursesCompleted: 0,
    hoursStudied: 0,
    certificates: 0,
    progress: 0
  });
  const { userName } = useUser();

  // Function to convert URLs to clickable links
  function convertUrlsToLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-warm-brown hover:text-warm-brown/80 underline">$1</a>');
  }

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchData();
  }, []);

  // Refetch user stats when courses are loaded
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const currentUserEmail = userData ? JSON.parse(userData).email : null;
    if (currentUserEmail && courses.length > 0) {
      fetchUserStats(currentUserEmail);
    }
  }, [courses]);

  async function fetchData() {
    try {
      // Get current user email from localStorage
      const userData = localStorage.getItem('userData');
      const currentUserEmail = userData ? JSON.parse(userData).email : null;

      // Fetch courses
      const coursesQuery = query(collection(db, 'courses'), limit(3));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);

      // Fetch news
      const newsQuery = query(collection(db, 'news'), orderBy('created_at', 'desc'), limit(3));
      const newsSnapshot = await getDocs(newsQuery);
      const newsData = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(newsData);

      // Fetch user statistics if user is logged in
      if (currentUserEmail) {
        await fetchUserStats(currentUserEmail);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function fetchUserStats(userEmail: string) {
    try {
      // Fetch user progress
      const progressSnapshot = await getDocs(collection(db, 'user_progress'));
      const progressData = progressSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((progress: any) => progress.user_email === userEmail);

      // Fetch total courses count
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const totalCourses = coursesSnapshot.size;

      // Calculate statistics
      const completedCourses = progressData.filter((progress: any) => progress.completed).length;
      const progressPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
      
      // Estimate hours studied (assuming 2-3 hours per completed course)
      const hoursStudied = completedCourses * 2.5;

      setUserStats({
        coursesCompleted: completedCourses,
        hoursStudied: Math.round(hoursStudied),
        certificates: completedCourses, // Each completed course = 1 certificate
        progress: progressPercentage
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">
                {greeting}, Future AI Expert!
              </h1>
              <p className="text-medium-gray text-lg mb-4">Ready to level up your AI skills today?</p>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: BookOpen, label: 'Courses Completed', value: userStats.coursesCompleted.toString(), color: 'text-warm-brown', bg: 'bg-warm-brown/10' },
          { icon: Clock, label: 'Hours Studied', value: userStats.hoursStudied.toString(), color: 'text-success', bg: 'bg-success/10' },
          { icon: Award, label: 'Certificates', value: userStats.certificates.toString(), color: 'text-warning', bg: 'bg-warning/10' },
          { icon: TrendingUp, label: 'Progress', value: `${userStats.progress}%`, color: 'text-light-accent', bg: 'bg-light-accent/10' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="text-center">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-dark-primary mb-1">{stat.value}</h3>
              <p className="text-sm text-medium-gray">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Motivation & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-warm-brown/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-warm-brown" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-1">Daily Motivation</h3>
                <p className="text-sm text-medium-gray">Keep pushing forward</p>
              </div>
            </div>
            <p className="text-medium-gray text-base italic leading-relaxed">"{quote}"</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-primary mb-1">Today's AI Tip</h3>
                <p className="text-sm text-medium-gray">Pro insight of the day</p>
              </div>
            </div>
            <p className="text-medium-gray text-base leading-relaxed">{tip}</p>
          </Card>
        </motion.div>
      </div>

      {/* Trending Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-warm-brown/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warm-brown" />
            </div>
            <h2 className="text-2xl font-bold text-dark-primary">Trending Courses</h2>
          </div>
          <Link to="/courses">
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="text-warm-brown hover:text-warm-brown/80 font-medium flex items-center gap-2 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <div className="h-32 bg-warm-brown/20 rounded-xl mb-4 flex items-center justify-center">
                  <Brain className="w-12 h-12 text-warm-brown" />
                </div>
                <h3 className="text-lg font-semibold text-dark-primary mb-2">{course.title}</h3>
                <p className="text-sm text-medium-gray mb-3 line-clamp-2">{course.description}</p>
                {course.advertisement && (
                  <div className="mb-3 p-2 bg-warm-brown/5 border border-warm-brown/20 rounded-lg">
                    <div className="text-xs text-text-primary whitespace-pre-wrap line-clamp-2" dangerouslySetInnerHTML={{ __html: highlightQuestionsInHTML(convertUrlsToLinks(course.advertisement.replace(/\n/g, '<br>'))) }} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-brown font-medium">{course.duration}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Latest AI News */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-light-accent/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-light-accent" />
            </div>
            <h2 className="text-2xl font-bold text-dark-primary">Latest AI News</h2>
          </div>
          <Link to="/digest">
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="text-warm-brown hover:text-warm-brown/80 font-medium flex items-center gap-2 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>

        <div className="space-y-4">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-warm-brown/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-primary mb-1">{item.title}</h3>
                    <p className="text-sm text-medium-gray line-clamp-2">{item.content}</p>
                    <p className="text-xs text-warm-brown mt-2 font-medium">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
