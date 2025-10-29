import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Code, Save, Edit } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query, limit } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function ManageVibeCoding() {
  const [content, setContent] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    introduction: '',
    video_url: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const contentQuery = query(collection(db, 'vibe_coding'), orderBy('created_at', 'desc'), limit(1));
      const contentSnapshot = await getDocs(contentQuery);
      
      if (!contentSnapshot.empty) {
        const data = contentSnapshot.docs[0].data();
        setContent({
          ...data,
          id: contentSnapshot.docs[0].id,
        });
      }
    } catch (error) {
      console.error('Error fetching Vibe Coding content:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEditing && content) {
        // Update existing content
        await updateDoc(doc(db, 'vibe_coding', content.id), {
          ...formData,
          updated_at: new Date().toISOString(),
        });
        setIsEditing(false);
      } else {
        // Add new content
        await addDoc(collection(db, 'vibe_coding'), {
          ...formData,
          created_at: new Date().toISOString(),
        });
      }
      setFormData({ title: '', introduction: '', video_url: '' });
      setShowForm(false);
      fetchContent();
    } catch (error) {
      console.error('Error saving Vibe Coding content:', error);
    }
  }

  function editContent() {
    if (content) {
      setFormData({
        title: content.title || '',
        introduction: content.introduction || '',
        video_url: content.video_url || '',
      });
      setIsEditing(true);
      setShowForm(true);
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    setFormData({ title: '', introduction: '', video_url: '' });
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage Vibe Coding</h1>
              <p className="text-text-secondary text-lg mb-4">Create and manage Vibe Coding content and videos</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-admin-accent" />
                  <span>Content Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-success" />
                  <span>Rich Text Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-warning" />
                  <span>Video Integration</span>
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
            <div className="space-y-4">
              {content.introduction && (
                <div>
                  <h3 className="text-lg font-semibold text-warm-brown mb-2">Introduction</h3>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    <div 
                      className="prose max-w-none text-text-primary leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightQuestionsInHTML(content.introduction?.replace(/\n/g, '<br>') || 'No introduction available') 
                      }}
                    />
                  </div>
                </div>
              )}
              {content.video_url && (
                <div>
                  <h3 className="text-lg font-semibold text-warm-brown mb-2">Video</h3>
                  <p className="text-sm text-text-secondary">
                    <a href={content.video_url} target="_blank" rel="noopener noreferrer" className="text-warm-brown hover:text-warm-brown/80 underline">
                      {content.video_url}
                    </a>
                  </p>
                </div>
              )}
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
              {isEditing ? 'Edit Vibe Coding Content' : 'Add Vibe Coding Content'}
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
                  placeholder="e.g., Vibe Coding"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Introduction Content</label>
                <textarea
                  required
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={12}
                  placeholder="Enter your introduction content here. You can use HTML tags for formatting:

<h2>What is Vibe Coding?</h2>
<p>Vibe Coding is about...</p>

<h3>Key Principles</h3>
<ul>
  <li>Principle 1</li>
  <li>Principle 2</li>
</ul>

<h3>Benefits</h3>
<p>Here are the benefits...</p>

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
