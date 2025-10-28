import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Briefcase, MessageCircle, ExternalLink } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const resumeTemplates = [
  { name: 'AI Engineer Resume', description: 'Perfect for machine learning and AI roles' },
  { name: 'Data Scientist Resume', description: 'Ideal for data science positions' },
  { name: 'Tech Graduate Resume', description: 'Great for fresh graduates in tech' },
];

const interviewQuestions = [
  'Explain the difference between supervised and unsupervised learning.',
  'What is overfitting and how do you prevent it?',
  'Describe how a neural network works.',
  'What are the key differences between precision and recall?',
  'Explain the concept of gradient descent.',
];

export default function CareerBooster() {
  const [jobs, setJobs] = useState<any[]>([]);

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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Career Booster</h1>
              <p className="text-text-secondary text-lg mb-4">Resources to accelerate your AI career journey</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-accent" />
                  <span>Resume Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-success" />
                  <span>Interview Prep</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-warning" />
                  <span>Job Opportunities</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-accent" />
          Resume Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resumeTemplates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <div className="h-32 bg-warm-brown/20 rounded-xl mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-primary-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{template.name}</h3>
                <p className="text-sm text-text-secondary mb-4">{template.description}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary w-full"
                >
                  Download
                </motion.button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-secondary-accent" />
          Interview Questions
        </h2>
        <div className="space-y-3">
          {interviewQuestions.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card hover={false}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-light-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-text-primary font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-text-primary flex-1">{question}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-success" />
          Job Opportunities & Internships
        </h2>
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
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{job.title}</h3>
                    <p className="text-success font-medium mb-2">{job.company}</p>
                    <p className="text-sm text-text-secondary mb-3">{job.description}</p>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors"
                    >
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                    <Briefcase className="w-8 h-8 text-success" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
