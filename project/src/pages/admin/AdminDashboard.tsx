import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Newspaper, FolderKanban, Briefcase, Users, TrendingUp, BarChart3, Activity } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    news: 0,
    projects: 0,
    jobs: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [coursesSnapshot, newsSnapshot, projectsSnapshot, jobsSnapshot] = await Promise.all([
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'news')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'jobs')),
      ]);

      setStats({
        courses: coursesSnapshot.size,
        news: newsSnapshot.size,
        projects: projectsSnapshot.size,
        jobs: jobsSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  const statCards = [
    { icon: BookOpen, label: 'Total Courses', value: stats.courses, color: 'text-admin-accent', bg: 'bg-admin-accent/10' },
    { icon: Newspaper, label: 'News Articles', value: stats.news, color: 'text-primary-accent', bg: 'bg-primary-accent/10' },
    { icon: FolderKanban, label: 'Projects', value: stats.projects, color: 'text-success', bg: 'bg-success/10' },
    { icon: Briefcase, label: 'Job Postings', value: stats.jobs, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Admin Dashboard</h1>
              <p className="text-text-secondary text-lg mb-4">Manage your AI EDU APP content and analytics</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-admin-accent" />
                  <span>Platform Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" />
                  <span>Student Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-warning" />
                  <span>Content Control</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
                    <p className="text-sm text-text-secondary">{stat.label}</p>
                  </div>
                  <div className={`w-14 h-14 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card variant="premium">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-warm-brown rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Welcome, Admin!</h2>
              <p className="text-text-secondary">Manage content for graduate students</p>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Use the sidebar to navigate through different sections. You can add courses, post AI news,
            upload projects, manage job postings, and view student progress. All changes will be immediately
            visible to students.
          </p>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, label: 'Add New Course', description: 'Create educational content', color: 'bg-admin-accent/10 text-admin-accent' },
            { icon: Newspaper, label: 'Post AI News', description: 'Share latest developments', color: 'bg-primary-accent/10 text-primary-accent' },
            { icon: Users, label: 'View Students', description: 'Monitor progress', color: 'bg-success/10 text-success' },
          ].map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index + 0.7 }}
            >
              <Card className="text-center hover:shadow-hover transition-all duration-300">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-text-primary mb-1">{action.label}</h4>
                <p className="text-sm text-text-secondary">{action.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
