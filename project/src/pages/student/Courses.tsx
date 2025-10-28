import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, PlayCircle, Brain } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, orderBy, query, where } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any>({});

  // Function to convert URLs to clickable links
  function convertUrlsToLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-warm-brown hover:text-warm-brown/80 underline">$1</a>');
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const coursesQuery = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }

  async function selectCourse(course: any) {
    setSelectedCourse(course);

    try {
      // Get current user email from localStorage
      const userData = localStorage.getItem('userData');
      const currentUserEmail = userData ? JSON.parse(userData).email : 'student@example.com';

      // Fetch lessons
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const lessonsData = lessonsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((lesson: any) => lesson.course_id === course.id)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setLessons(lessonsData);

      // Fetch user progress
      const progressSnapshot = await getDocs(collection(db, 'user_progress'));
      const progressData = progressSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((progress: any) => progress.course_id === course.id && progress.user_email === currentUserEmail);

      if (progressData) {
        setUserProgress(progressData);
      } else {
        setUserProgress({});
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  }

  async function markAsCompleted() {
    if (!selectedCourse) return;

    try {
      // Get current user email from localStorage
      const userData = localStorage.getItem('userData');
      const currentUserEmail = userData ? JSON.parse(userData).email : 'student@example.com';

      await addDoc(collection(db, 'user_progress'), {
        course_id: selectedCourse.id,
        user_email: currentUserEmail,
        completed: true,
        progress_percentage: 100,
        updated_at: new Date().toISOString(),
      });

      setUserProgress({ ...userProgress, completed: true, progress_percentage: 100 });
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  }

  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCourse(null)}
          className="text-warm-brown hover:text-warm-brown/80 font-medium flex items-center gap-2"
        >
          ← Back to Courses
        </motion.button>

        <Card variant="premium">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary mb-3">{selectedCourse.title}</h1>
              <p className="text-text-secondary text-lg mb-4">{selectedCourse.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-success">
                  <Clock className="w-5 h-5" />
                  <span>{selectedCourse.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-warm-brown">
                  <BookOpen className="w-5 h-5" />
                  <span>{lessons.length} Lessons</span>
                </div>
              </div>
            </div>
            {userProgress.completed ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-button border border-success/20">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-success font-medium">Completed</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAsCompleted}
                className="btn-primary"
              >
                Mark as Completed
              </motion.button>
            )}
          </div>

          {userProgress.progress_percentage !== undefined && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Progress</span>
                <span className="text-sm text-success font-medium">{userProgress.progress_percentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userProgress.progress_percentage}%` }}
                  className="h-full bg-warm-brown"
                />
              </div>
            </div>
          )}
        </Card>

        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Course Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-warm-brown/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-text-primary font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">{lesson.title}</h3>
                      <p className="text-sm text-text-secondary">{lesson.summary}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-warm-brown/10 rounded-full flex items-center justify-center hover:bg-warm-brown/20 transition-colors"
                    >
                      <PlayCircle className="w-5 h-5 text-warm-brown" />
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">No matter your stream — Commerce, Engineering, or Arts — the future belongs to skilled learners!</h1>
              <p className="text-text-secondary text-lg mb-4">Explore our comprehensive AI learning programs</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-warm-brown" />
                  <span>{courses.length} Courses Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-warning" />
                  <span>Certificates Included</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <div className="h-40 bg-warm-brown/20 rounded-xl mb-4 flex items-center justify-center">
                <Brain className="w-16 h-16 text-warm-brown" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{course.title}</h3>
              <p className="text-sm text-text-secondary mb-4">{course.description}</p>
              {course.advertisement && (
                <div className="mb-4 p-3 bg-warm-brown/5 border border-warm-brown/20 rounded-lg">
                  <div className="text-sm text-text-primary whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightQuestionsInHTML(convertUrlsToLinks(course.advertisement.replace(/\n/g, '<br>'))) }} />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-success">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{course.duration}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
