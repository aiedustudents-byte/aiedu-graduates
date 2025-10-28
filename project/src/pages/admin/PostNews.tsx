import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Newspaper, Trash2, Upload, X } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

export default function PostNews() {
  const [news, setNews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_file: null as File | null,
    image_preview: '',
  });

  useEffect(() => {
    fetchNews();
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          image_file: file,
          image_preview: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setFormData({
      ...formData,
      image_file: null,
      image_preview: '',
    });
  }

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

  async function testFirebaseConnection() {
    try {
      console.log('Testing Firebase connection...');
      const testDoc = await addDoc(collection(db, 'test'), {
        test: true,
        timestamp: new Date().toISOString()
      });
      console.log('Firebase test successful!', testDoc.id);
      
      // Clean up test document
      await deleteDoc(doc(db, 'test', testDoc.id));
      console.log('Test document cleaned up');
      return true;
    } catch (error) {
      console.error('Firebase test failed:', error);
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Form submitted!', formData); // Debug log
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('Please enter content');
      return;
    }
    
    // Test Firebase connection first
    const firebaseWorking = await testFirebaseConnection();
    if (!firebaseWorking) {
      alert('Firebase connection failed. Please check your internet connection and try again.');
      return;
    }
    
    try {
      const newsData: any = {
        title: formData.title,
        content: formData.content,
        created_at: new Date().toISOString(),
      };

      // If image is uploaded, store the base64 data
      if (formData.image_file && formData.image_preview) {
        newsData.image_data = formData.image_preview;
        newsData.image_name = formData.image_file.name;
      }

      console.log('Saving news data:', newsData); // Debug log
      await addDoc(collection(db, 'news'), newsData);
      console.log('News saved successfully!'); // Debug log
      
      setFormData({ title: '', content: '', image_file: null, image_preview: '' });
      setShowForm(false);
      fetchNews();
    } catch (error) {
      console.error('Error adding news:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a Firebase permission error
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as any;
        if (firebaseError.code === 'permission-denied') {
          alert('Permission denied. Please check your Firebase security rules.');
        } else if (firebaseError.code === 'unavailable') {
          alert('Firebase service is unavailable. Please try again later.');
        } else {
          alert(`Firebase error: ${firebaseError.code}. Please try again.`);
        }
      } else {
        alert('Error saving article. Please try again.');
      }
    }
  }

  async function deleteNews(id: string) {
    try {
      await deleteDoc(doc(db, 'news', id));
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Post AI News</h1>
              <p className="text-text-secondary text-lg mb-4">Share latest AI and tech updates with students</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-admin-accent" />
                  <span>{news.length} Articles Published</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-success" />
                  <span>Easy Publishing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-warning" />
                  <span>Real-time Updates</span>
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
              Add News
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
            <h3 className="text-xl font-bold text-text-primary mb-4">Create New Article</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="Article headline..."
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Content</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={5}
                  placeholder="Article content..."
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Image Upload (Optional)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </label>
                    {formData.image_preview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-2 px-3 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                  {formData.image_preview && (
                    <div className="mt-3">
                      <img
                        src={formData.image_preview}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-3 bg-warm-brown text-white font-medium rounded-button hover:bg-warm-brown/90 transition-colors"
                >
                  Publish Article
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-button hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-warm-brown/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-8 h-8 text-admin-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">{item.content}</p>
                    {item.image_data && (
                      <div className="mb-3">
                        <img
                          src={item.image_data}
                          alt={item.title}
                          className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    <p className="text-xs text-primary-accent font-medium">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteNews(item.id)}
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
