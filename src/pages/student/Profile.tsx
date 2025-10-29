import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, TrendingUp, Save } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { useUser } from '../../contexts/UserContext';

export default function Profile() {
  const [name, setName] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [email] = useState('student@example.com');
  const [progress, setProgress] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { updateUserName } = useUser();

  useEffect(() => {
    fetchProfile();
    fetchProgress();
  }, []);

  async function fetchProfile() {
    try {
      const profileSnapshot = await getDocs(collection(db, 'user_profiles'));
      const profileData = profileSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((profile: any) => profile.email === email);

      if (profileData) {
        setName(profileData.name);
        setLearningGoal(profileData.learning_goal);
      } else {
        setName('Graduate Student');
        setLearningGoal('Master AI and Machine Learning');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchProgress() {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const progressSnapshot = await getDocs(collection(db, 'user_progress'));
      
      const total = coursesSnapshot.size;
      const completed = progressSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((progress: any) => progress.user_email === email && progress.completed).length;
      
      setCompletedCourses(completed);
      setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }

  async function saveProfile() {
    try {
      const profileSnapshot = await getDocs(collection(db, 'user_profiles'));
      const existingProfile = profileSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((profile: any) => profile.email === email);

      if (existingProfile) {
        await updateDoc(doc(db, 'user_profiles', existingProfile.id), {
          name,
          learning_goal: learningGoal,
          updated_at: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'user_profiles'), {
          email,
          name,
          learning_goal: learningGoal,
          created_at: new Date().toISOString(),
        });
      }

      // Update the navbar immediately using context
      updateUserName(name);

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Profile & Progress</h1>
              <p className="text-text-secondary text-lg mb-4">Track your learning journey and achievements</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-accent" />
                  <span>Personal Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-success" />
                  <span>Learning Goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  <span>Progress Tracking</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2"
        >
          <Card variant="premium">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-warm-brown rounded-2xl flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-2xl font-bold text-text-primary bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 mb-1 focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-text-primary mb-1">{name}</h2>
                  )}
                  <p className="text-text-secondary">{email}</p>
                </div>
              </div>
              {isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveProfile}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary"
                >
                  Edit Profile
                </motion.button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-accent" />
                  Learning Goal
                </label>
                {isEditing ? (
                  <textarea
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20"
                    rows={3}
                  />
                ) : (
                  <p className="text-text-primary px-4 py-3 bg-gray-50 rounded-lg">{learningGoal}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="premium">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary">{progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Overall Progress</h3>
              <p className="text-sm text-text-secondary">{completedCourses} courses completed</p>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="premium">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary-accent" />
            <h3 className="text-xl font-bold text-text-primary">Learning Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-text-primary mb-1">{completedCourses}</p>
              <p className="text-sm text-text-secondary">Completed</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-text-primary mb-1">7</p>
              <p className="text-sm text-text-secondary">Day Streak</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-text-primary mb-1">24</p>
              <p className="text-sm text-text-secondary">Hours Learned</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-text-primary mb-1">3</p>
              <p className="text-sm text-text-secondary">Badges</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
