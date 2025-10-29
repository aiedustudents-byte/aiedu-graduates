import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Trash2, ExternalLink } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

export default function PostJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    link: '',
    description: '',
  });

  // Function to validate and format URLs
  function formatUrl(url: string): string {
    if (!url) return '';
    
    // Remove any extra text and extract just the URL
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    // If no protocol, add https://
    if (url.includes('.') && !url.startsWith('http')) {
      return `https://${url}`;
    }
    
    return url;
  }

  // Function to validate URL
  function isValidUrl(url: string): boolean {
    try {
      new URL(formatUrl(url));
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const jobsQuery = query(collection(db, 'jobs'), orderBy('created_at', 'desc'));
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate URL before submission
    if (!isValidUrl(formData.link)) {
      alert('Please enter a valid URL for the application link');
      return;
    }
    
    try {
      // Format the URL before saving
      const formattedData = {
        ...formData,
        link: formatUrl(formData.link),
        created_at: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'jobs'), formattedData);
      setFormData({ title: '', company: '', link: '', description: '' });
      setShowForm(false);
      fetchJobs();
    } catch (error) {
      console.error('Error adding job:', error);
    }
  }

  async function deleteJob(id: string) {
    try {
      await deleteDoc(doc(db, 'jobs', id));
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Post Jobs/Internships</h1>
              <p className="text-text-secondary text-lg mb-4">Add career opportunities for students</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-admin-accent" />
                  <span>{jobs.length} Job Postings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-success" />
                  <span>Easy Posting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-warning" />
                  <span>Career Support</span>
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
              Add Job
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
            <h3 className="text-xl font-bold text-text-primary mb-4">Create New Job Posting</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Job Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., Machine Learning Engineer"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Company</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Application Link</label>
                <input
                  type="text"
                  required
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-button text-text-primary focus:outline-none focus:ring-2 ${
                    formData.link && !isValidUrl(formData.link) 
                      ? 'border-error focus:border-error focus:ring-error/20' 
                      : 'border-gray-200 focus:border-admin-accent focus:ring-admin-accent/20'
                  }`}
                  placeholder="https://careers.company.com or just paste the full LinkedIn URL"
                />
                {formData.link && (
                  <div className="mt-2">
                    {isValidUrl(formData.link) ? (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <ExternalLink className="w-4 h-4" />
                        <span>Valid URL: </span>
                        <a 
                          href={formatUrl(formData.link)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-accent hover:text-primary-accent/80 underline"
                        >
                          {formatUrl(formData.link)}
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-error">
                        ⚠️ Please enter a valid URL (e.g., https://example.com)
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={4}
                  placeholder="Job description and requirements..."
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary"
                >
                  Post Job
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

      <div className="space-y-4">
        {jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-warm-brown/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-8 h-8 text-admin-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-1">{job.title}</h3>
                    <p className="text-primary-accent font-medium mb-2">{job.company}</p>
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">{job.description}</p>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary-accent hover:text-secondary-accent/80 truncate block"
                    >
                      {job.link}
                    </a>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteJob(job.id)}
                  className="w-9 h-9 bg-error/10 rounded-lg flex items-center justify-center hover:bg-error/20 transition-colors ml-4"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </motion.button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
