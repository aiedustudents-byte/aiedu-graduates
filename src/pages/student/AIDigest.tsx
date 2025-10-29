import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Calendar } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function AIDigest() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const newsQuery = query(collection(db, 'news'), orderBy('created_at', 'desc'));
      const newsSnapshot = await getDocs(newsQuery);
      const newsData = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">AI Digest Feed</h1>
              <p className="text-text-secondary text-lg mb-4">Stay updated with the latest AI and tech news</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary-accent" />
                  <span>{news.length} Articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-success" />
                  <span>Updated Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-warning" />
                  <span>Curated Content</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Newspaper className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="space-y-6">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card variant="premium">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-warm-brown/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-12 h-12 text-primary-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary mb-3">{item.title}</h2>
                  <p className="text-text-secondary mb-4 leading-relaxed">{item.content}</p>
                  {item.image_data && (
                    <div className="mb-4">
                      <img
                        src={item.image_data}
                        alt={item.title}
                        className="w-full max-w-lg h-64 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-primary-accent">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {news.length === 0 && (
        <Card variant="premium">
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
            <p className="text-text-secondary text-lg">No news articles available yet</p>
          </div>
        </Card>
      )}
    </div>
  );
}
