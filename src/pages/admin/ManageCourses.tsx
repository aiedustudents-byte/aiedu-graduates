import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function ManageCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    advertisement: '',
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Update existing course
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...formData,
          updated_at: new Date().toISOString(),
        });
        setEditingCourse(null);
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), {
          ...formData,
          created_at: new Date().toISOString(),
        });
      }
      setFormData({ title: '', description: '', duration: '', advertisement: '' });
      setShowForm(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  }

  function editCourse(course: any) {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      duration: course.duration,
      advertisement: course.advertisement || '',
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingCourse(null);
    setFormData({ title: '', description: '', duration: '', advertisement: '' });
    setShowForm(false);
  }

  async function deleteCourse(id: string) {
    try {
      await deleteDoc(doc(db, 'courses', id));
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage Courses</h1>
              <p className="text-text-secondary text-lg mb-4">Add and manage learning courses for students</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-admin-accent" />
                  <span>{courses.length} Courses Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-success" />
                  <span>Easy Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-warning" />
                  <span>Quick Editing</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Course
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="premium">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., Introduction to Machine Learning"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={3}
                  placeholder="Brief description of the course..."
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Advertisement / Contact Section (Optional)</label>
                <textarea
                  value={formData.advertisement}
                  onChange={(e) => setFormData({ ...formData, advertisement: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={4}
                  placeholder="💬 Want to master this course? Join AI EDU Academy today!&#10;📞 Contact us: +91 98765 43210&#10;✉️ Email: support@aieduacademy.com&#10;🌐 Visit: [www.aieduacademy.com](http://www.aieduacademy.com)"
                />
                <p className="text-xs text-text-secondary mt-1">Supports HTML/Markdown formatting for rich text, emojis, and links</p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Duration</label>
                <input
                  type="text"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., 8 weeks"
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary"
                >
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-warm-brown/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-admin-accent" />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => editCourse(course)}
                    className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center hover:bg-warning/20 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-warning" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteCourse(course.id)}
                    className="w-9 h-9 bg-error/10 rounded-lg flex items-center justify-center hover:bg-error/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </motion.button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{course.title}</h3>
              <p className="text-sm text-text-secondary mb-3">{course.description}</p>
              {course.advertisement && (
                <div className="mb-3 p-3 bg-warm-brown/5 border border-warm-brown/20 rounded-lg">
                  <p className="text-xs text-warm-brown font-medium mb-1">Advertisement:</p>
                  <div className="text-sm text-text-primary whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightQuestionsInHTML(course.advertisement.replace(/\n/g, '<br>')) }} />
                </div>
              )}
              <div className="flex items-center gap-2 text-success">
                <span className="text-sm font-medium">{course.duration}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
