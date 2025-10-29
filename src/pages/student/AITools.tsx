import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, ExternalLink, Play } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface ToolCategory {
  id: string;
  title: string;
}

interface Tool {
  id: string;
  tool_name: string;
  description: string;
  url: string;
}

interface AIToolsData {
  id?: string;
  module_title: string;
  intro_text: string;
  question_text: string;
  answer_text: string;
  tool_categories: ToolCategory[];
  tool_list: Tool[];
  video_url: string;
  outcome_text: string;
  last_updated?: string;
}

export default function AITools() {
  const [aiToolsData, setAiToolsData] = useState<AIToolsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAIToolsData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAIToolsData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to convert YouTube URLs to embed format with end behavior control
  function getEmbedUrl(url: string): string {
    if (!url) return '';
    
    // If it's already an embed URL, return as is
    if (url.includes('/embed/')) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Add parameters to control end behavior - use loop to prevent suggested videos
        return `https://www.youtube.com/embed/${match[1]}?rel=0&showinfo=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1&controls=1&disablekb=0&enablejsapi=1&origin=${window.location.origin}&loop=1&playlist=${match[1]}`;
      }
    }
    
    // If no pattern matches, return original URL
    return url;
  }

  async function fetchAIToolsData() {
    try {
      const aiToolsQuery = query(collection(db, 'ai_learning_tools'), orderBy('last_updated', 'desc'), limit(1));
      const snapshot = await getDocs(aiToolsQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as AIToolsData;
        setAiToolsData({
          ...data,
          id: snapshot.docs[0].id,
        });
      } else {
        // Set default data if no content exists
        setAiToolsData({
          module_title: 'AI Learning Tools',
          intro_text: '',
          question_text: '',
          answer_text: '',
          tool_categories: [],
          tool_list: [],
          video_url: '',
          outcome_text: '',
        });
      }
    } catch (error) {
      console.error('Error fetching AI Tools data:', error);
      // Set default data on error
      setAiToolsData({
        module_title: 'AI Learning Tools',
        intro_text: '',
        question_text: '',
        answer_text: '',
        tool_categories: [],
        tool_list: [],
        video_url: '',
        outcome_text: '',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
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
                <div className="h-8 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </Card>
        </motion.div>
        
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Title Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">
                {aiToolsData?.module_title || 'AI Learning Tools'}
              </h1>
            </div>
            <div className="w-20 h-20 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Introduction Section */}
      {aiToolsData?.intro_text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-warm-brown mb-4">Introduction</h2>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-warm-brown font-semibold text-lg">What are AI Learning Tools?</p>
                <p className="text-black text-lg leading-relaxed">
                  AI Learning Tools are digital applications that use Artificial Intelligence (AI) to make studying, researching, and creating easier and smarter. They help graduate students learn faster, write better, code efficiently, and analyze data effectively — all using the power of AI. These tools act like your personal tutor, writing assistant, data analyst, and creative designer — all in one place! Whether you're preparing for exams, doing research, coding a project, or making a presentation — AI tools can save time and improve your learning outcomes.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Q&A Section */}
      {(aiToolsData?.question_text || aiToolsData?.answer_text) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Q&A</h2>
            <div className="space-y-4">
              {aiToolsData.question_text && (
                <div>
                  <p className="text-warm-brown font-semibold text-lg mb-2">Q: {aiToolsData.question_text}</p>
                </div>
              )}
              {aiToolsData.answer_text && (
                <div>
                  <p className="text-text-secondary text-lg leading-relaxed">A: {aiToolsData.answer_text}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Categories Section */}
      {aiToolsData?.tool_categories && aiToolsData.tool_categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Tool Categories</h2>
            <div className="flex flex-wrap gap-3">
              {aiToolsData.tool_categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="px-4 py-2 bg-warm-brown/10 text-warm-brown rounded-full text-sm font-medium border border-warm-brown/20"
                >
                  {category.title}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tools Section */}
      {aiToolsData?.tool_list && aiToolsData.tool_list.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Available Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiToolsData.tool_list.map((tool, index) => (
            <motion.div
                  key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-warm-brown/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-warm-brown" />
                      </div>
                      {tool.url && (
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-warm-brown text-white rounded-lg text-sm hover:bg-warm-brown/90 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit
                        </motion.a>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">{tool.tool_name}</h3>
                    <p className="text-text-secondary leading-relaxed">{tool.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Default Content Coming Soon */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="premium">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-warm-brown rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-4">Content Coming Soon</h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                We're working hard to bring you comprehensive AI learning tools and resources. 
                Stay tuned for interactive tutorials, hands-on exercises, and expert guidance 
                to help you master AI technologies.
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-warm-brown">
                <div className="w-2 h-2 bg-warm-brown rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-warm-brown rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-warm-brown rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Video Section */}
      {aiToolsData?.video_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-warm-brown" />
              <h2 className="text-2xl font-semibold text-text-primary">Learning Video</h2>
            </div>
            <div className="aspect-video">
              {aiToolsData.video_url.includes('youtube.com') || aiToolsData.video_url.includes('youtu.be') ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={getEmbedUrl(aiToolsData.video_url)}
                  title="AI Learning Tools Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Video format not supported for embedding</p>
                    <a 
                      href={aiToolsData.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-warm-brown hover:text-warm-brown/80 mt-2 inline-block"
                    >
                      Open video in new tab →
                    </a>
                  </div>
                </div>
              )}
            </div>
              </Card>
            </motion.div>
      )}

      {/* Outcome Section */}
      {aiToolsData?.outcome_text && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
          <Card>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Learning Outcomes</h2>
            <div className="prose max-w-none">
              <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-wrap">
                {aiToolsData.outcome_text}
            </p>
          </div>
        </Card>
      </motion.div>
      )}
    </div>
  );
}
