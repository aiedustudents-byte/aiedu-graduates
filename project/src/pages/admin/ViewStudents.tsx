import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ViewStudents() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'user_profiles'));
      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const studentsWithStats = studentsData.map((student) => {
        // For now, return mock data since we don't have user_progress collection
        return {
          ...student,
          completedCourses: 0,
          averageProgress: 0,
        };
      });
      
      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">View Student Progress</h1>
              <p className="text-text-secondary text-lg mb-4">Monitor student learning activity and progress</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-admin-accent" />
                  <span>{students.length} Total Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-warning" />
                  <span>Student Analytics</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="premium">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-warm-brown rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">{students.length}</p>
              <p className="text-text-secondary">Total Students</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="space-y-4">
        {students.length > 0 ? (
          students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-warm-brown/20 rounded-full flex items-center justify-center">
                      <span className="text-text-primary font-bold text-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-text-primary mb-1">{student.name}</h3>
                      <p className="text-sm text-text-secondary mb-3">{student.email}</p>
                      <p className="text-sm text-text-secondary mb-3">
                        <span className="text-primary-accent font-medium">Goal:</span> {student.learning_goal || 'Not set'}
                      </p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary-accent" />
                          <span className="text-sm text-text-secondary">
                            {student.completedCourses} courses completed
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-text-secondary">
                            Average Progress: <span className="text-success font-medium">{student.averageProgress}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card variant="premium">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
              <p className="text-text-secondary text-lg">No student data available</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
