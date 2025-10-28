import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Save, Plus, Trash2, Eye, Play } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit } from 'firebase/firestore';

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

export default function ManageAITools() {
  const [formData, setFormData] = useState<AIToolsData>({
    module_title: 'AI Learning Tools',
    intro_text: '',
    question_text: '',
    answer_text: '',
    tool_categories: [],
    tool_list: [],
    video_url: '',
    outcome_text: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAIToolsData();
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
        setFormData({
          ...data,
          id: snapshot.docs[0].id,
        });
      }
    } catch (error) {
      console.error('Error fetching AI Tools data:', error);
    }
  }

  function addCategory() {
    setFormData({
      ...formData,
      tool_categories: [
        ...formData.tool_categories,
        { id: Date.now().toString(), title: '' }
      ]
    });
  }

  function updateCategory(index: number, title: string) {
    const updatedCategories = [...formData.tool_categories];
    updatedCategories[index].title = title;
    setFormData({
      ...formData,
      tool_categories: updatedCategories
    });
  }

  function removeCategory(index: number) {
    const updatedCategories = formData.tool_categories.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      tool_categories: updatedCategories
    });
  }

  function addTool() {
    setFormData({
      ...formData,
      tool_list: [
        ...formData.tool_list,
        { id: Date.now().toString(), tool_name: '', description: '', url: '' }
      ]
    });
  }

  function updateTool(index: number, field: keyof Tool, value: string) {
    const updatedTools = [...formData.tool_list];
    updatedTools[index] = { ...updatedTools[index], [field]: value };
    setFormData({
      ...formData,
      tool_list: updatedTools
    });
  }

  function removeTool(index: number) {
    const updatedTools = formData.tool_list.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      tool_list: updatedTools
    });
  }

  async function handleSave() {
    if (!formData.module_title.trim()) {
      alert('Please enter a module title');
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        last_updated: new Date().toISOString(),
      };

      if (formData.id) {
        // Update existing document
        await updateDoc(doc(db, 'ai_learning_tools', formData.id), dataToSave);
      } else {
        // Create new document
        await addDoc(collection(db, 'ai_learning_tools'), dataToSave);
      }

      alert('AI Learning Tools content saved successfully!');
      await fetchAIToolsData(); // Refresh data
    } catch (error) {
      console.error('Error saving AI Tools data:', error);
      alert('Error saving content. Please try again.');
    } finally {
      setIsLoading(false);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage AI Learning Tools</h1>
              <p className="text-text-secondary text-lg mb-4">Create and manage AI learning tools content for students</p>
            </div>
            <div className="w-20 h-20 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Content Editor</h2>
            
            <div className="space-y-6">
              {/* Module Title */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Module Title</label>
                <input
                  type="text"
                  value={formData.module_title}
                  onChange={(e) => setFormData({ ...formData, module_title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="Enter module title"
                />
              </div>

              {/* Introduction Text */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Introduction Text</label>
                <textarea
                  value={formData.intro_text}
                  onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="Enter introduction text"
                />
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Question</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="Enter question text"
                />
              </div>

              {/* Answer Text */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Answer</label>
                <textarea
                  value={formData.answer_text}
                  onChange={(e) => setFormData({ ...formData, answer_text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="Enter answer text"
                />
              </div>

              {/* Tool Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-text-secondary">Tool Categories</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addCategory}
                    className="flex items-center gap-2 px-3 py-2 bg-warm-brown text-white rounded-lg text-sm hover:bg-warm-brown/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {formData.tool_categories.map((category, index) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => updateCategory(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                        placeholder="Category title"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeCategory(index)}
                        className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center hover:bg-error/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tool List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-text-secondary">Tools List</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addTool}
                    className="flex items-center gap-2 px-3 py-2 bg-warm-brown text-white rounded-lg text-sm hover:bg-warm-brown/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tool
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {formData.tool_list.map((tool, index) => (
                    <div key={tool.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-text-primary">Tool #{index + 1}</h4>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeTool(index)}
                          className="w-6 h-6 bg-error/10 rounded flex items-center justify-center hover:bg-error/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-error" />
                        </motion.button>
                      </div>
                      <input
                        type="text"
                        value={tool.tool_name}
                        onChange={(e) => updateTool(index, 'tool_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                        placeholder="Tool name"
                      />
                      <textarea
                        value={tool.description}
                        onChange={(e) => updateTool(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                        placeholder="Tool description"
                      />
                      <input
                        type="url"
                        value={tool.url}
                        onChange={(e) => updateTool(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                        placeholder="Tool URL"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Video URL (Optional)</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="YouTube or Vimeo URL"
                />
              </div>

              {/* Outcome Text */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Outcome Text</label>
                <textarea
                  value={formData.outcome_text}
                  onChange={(e) => setFormData({ ...formData, outcome_text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  placeholder="Enter outcome text"
                />
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-warm-brown text-white font-medium rounded-button hover:bg-warm-brown/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Saving...' : 'Save Content'}
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-text-primary">Live Preview</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-light-accent text-text-primary rounded-lg hover:bg-light-accent/80 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </motion.button>
            </div>

            {showPreview && (
              <div className="space-y-6">
                {/* Main Title Card */}
                <div>
                  <h1 className="text-3xl font-bold text-warm-brown mb-3">
                    {formData.module_title || 'AI Learning Tools'}
                  </h1>
                </div>

                {/* Introduction Section */}
                {formData.intro_text && (
                  <div>
                    <h3 className="text-xl font-semibold text-warm-brown mb-3">Introduction</h3>
                    <div className="space-y-3">
                      <p className="text-warm-brown font-semibold text-lg">What are AI Learning Tools?</p>
                      <p className="text-black text-lg leading-relaxed">
                        AI Learning Tools are digital applications that use Artificial Intelligence (AI) to make studying, researching, and creating easier and smarter. They help graduate students learn faster, write better, code efficiently, and analyze data effectively — all using the power of AI. These tools act like your personal tutor, writing assistant, data analyst, and creative designer — all in one place! Whether you're preparing for exams, doing research, coding a project, or making a presentation — AI tools can save time and improve your learning outcomes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Q&A Section */}
                {(formData.question_text || formData.answer_text) && (
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Q&A</h3>
                    <div className="space-y-3">
                      {formData.question_text && (
                        <div>
                          <p className="text-warm-brown font-semibold text-lg mb-2">Q: {formData.question_text}</p>
                        </div>
                      )}
                      {formData.answer_text && (
                        <div>
                          <p className="text-text-secondary text-lg leading-relaxed">A: {formData.answer_text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {formData.tool_categories.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.tool_categories.map((category, index) => (
                        <span key={index} className="px-3 py-1 bg-warm-brown/10 text-warm-brown rounded-full text-sm">
                          {category.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools */}
                {formData.tool_list.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Tools</h3>
                    <div className="space-y-3">
                      {formData.tool_list.map((tool, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-text-primary mb-2">{tool.tool_name}</h4>
                          <p className="text-text-secondary mb-2">{tool.description}</p>
                          {tool.url && (
                            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-warm-brown hover:text-warm-brown/80 text-sm">
                              Visit Tool →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {formData.video_url && (
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Video</h3>
                    <div className="aspect-video">
                      {formData.video_url.includes('youtube.com') || formData.video_url.includes('youtu.be') ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={getEmbedUrl(formData.video_url)}
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
                              href={formData.video_url} 
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
                  </div>
                )}

                {/* Outcome */}
                {formData.outcome_text && (
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Outcome</h3>
                    <p className="text-text-secondary">{formData.outcome_text}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
