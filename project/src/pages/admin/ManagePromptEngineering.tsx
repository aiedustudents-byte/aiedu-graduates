import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, Save, Edit } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query, limit } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function ManagePromptEngineering() {
  const [content, setContent] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    video_url: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const contentQuery = query(collection(db, 'prompt_engineering'), orderBy('created_at', 'desc'), limit(1));
      const contentSnapshot = await getDocs(contentQuery);
      
      if (!contentSnapshot.empty) {
        const data = contentSnapshot.docs[0].data();
        setContent({
          ...data,
          id: contentSnapshot.docs[0].id,
        });
      }
    } catch (error) {
      console.error('Error fetching Prompt Engineering content:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEditing && content) {
        // Update existing content
        await updateDoc(doc(db, 'prompt_engineering', content.id), {
          ...formData,
          updated_at: new Date().toISOString(),
        });
        setIsEditing(false);
      } else {
        // Add new content
        await addDoc(collection(db, 'prompt_engineering'), {
          ...formData,
          created_at: new Date().toISOString(),
        });
      }
      setFormData({ title: '', content: '', video_url: '' });
      setShowForm(false);
      fetchContent();
    } catch (error) {
      console.error('Error saving Prompt Engineering content:', error);
    }
  }

  function editContent() {
    if (content) {
      setFormData({
        title: content.title || '',
        content: content.content || '',
        video_url: content.video_url || '',
      });
      setIsEditing(true);
      setShowForm(true);
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    setFormData({ title: '', content: '', video_url: '' });
    setShowForm(false);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage Prompt Engineering</h1>
              <p className="text-text-secondary text-lg mb-4">Create and manage Prompt Engineering to Context Engineering content</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-admin-accent" />
                  <span>Content Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-success" />
                  <span>Rich Text Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-warning" />
                  <span>Auto Save</span>
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
              {content ? 'Update Content' : 'Add Content'}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* Content Preview */}
      {content && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="premium">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary mb-2">{content.title}</h2>
                <p className="text-sm text-text-secondary mb-4">
                  Last updated: {content.updated_at ? new Date(content.updated_at).toLocaleDateString() : new Date(content.created_at).toLocaleDateString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={editContent}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Content
              </motion.button>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              <div 
                className="prose max-w-none text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: highlightQuestionsInHTML(content.content?.replace(/\n/g, '<br>') || 'No content available') 
                }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Content Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="premium">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {isEditing ? 'Edit Prompt Engineering Content' : 'Add Prompt Engineering Content'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Module Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., Prompt Engineering to Context Engineering"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Content</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={15}
                  placeholder="Enter your content here. You can use HTML tags for formatting:

<h2>Introduction</h2>
<p>Welcome to Prompt Engineering...</p>

<h3>Key Concepts</h3>
<ul>
  <li>Concept 1</li>
  <li>Concept 2</li>
</ul>

<h3>Examples</h3>
<p>Here are some examples...</p>

<a href='https://example.com'>External Link</a>"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Supports HTML formatting: headings (&lt;h2&gt;, &lt;h3&gt;), paragraphs (&lt;p&gt;), lists (&lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;), links (&lt;a&gt;), and more
                </p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Video URL (Optional)</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-text-secondary mt-1">
                  Enter YouTube or other video platform URL. Videos will be embedded in the student view.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary"
                >
                  {isEditing ? 'Update Content' : 'Save Content'}
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
    </div>
  );
}
