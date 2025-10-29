import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Trash2 } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    dataset_link: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const projectsQuery = query(collection(db, 'projects'), orderBy('created_at', 'desc'));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        created_at: new Date().toISOString(),
      });
      setFormData({ title: '', summary: '', dataset_link: '' });
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  }

  async function deleteProject(id: string) {
    try {
      await deleteDoc(doc(db, 'projects', id));
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Upload Projects</h1>
              <p className="text-text-secondary text-lg mb-4">Add real-world case studies and projects for students</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-admin-accent" />
                  <span>{projects.length} Projects Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-success" />
                  <span>Easy Upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-warning" />
                  <span>Real-world Cases</span>
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
              Add Project
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
            <h3 className="text-xl font-bold text-text-primary mb-4">Add New Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Project Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., Customer Churn Prediction"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Summary</label>
                <textarea
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={4}
                  placeholder="Describe the project objectives and approach..."
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Dataset Link (Optional)</label>
                <input
                  type="text"
                  value={formData.dataset_link}
                  onChange={(e) => setFormData({ ...formData, dataset_link: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="https://kaggle.com/..."
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary"
                >
                  Add Project
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowForm(false)}
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
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-warm-brown/20 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-7 h-7 text-admin-accent" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteProject(project.id)}
                  className="w-9 h-9 bg-error/10 rounded-lg flex items-center justify-center hover:bg-error/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </motion.button>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{project.title}</h3>
              <p className="text-sm text-text-secondary mb-3">{project.summary}</p>
              {project.dataset_link && (
                <p className="text-xs text-primary-accent font-medium truncate">Dataset: {project.dataset_link}</p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
