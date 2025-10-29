import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2, Edit, Upload, X } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';

export default function ManageSimulatorTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emoji: '📝',
    image_file: null as File | null,
    image_preview: '',
    image_data: '', // Base64 string for storage
  });

  useEffect(() => {
    fetchTasks();
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
          image_data: event.target?.result as string,
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
      image_data: '',
    });
  }

  async function fetchTasks() {
    try {
      const tasksQuery = query(collection(db, 'simulator_tasks'), orderBy('created_at', 'desc'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        emoji: formData.emoji,
      };

      // Include image data if present
      if (formData.image_data) {
        taskData.image_data = formData.image_data;
        taskData.image_name = formData.image_file?.name || 'image.png';
      }

      if (editingTask) {
        await updateDoc(doc(db, 'simulator_tasks', editingTask.id), {
          ...taskData,
          updated_at: new Date().toISOString(),
        });
        setEditingTask(null);
      } else {
        await addDoc(collection(db, 'simulator_tasks'), {
          ...taskData,
          created_at: new Date().toISOString(),
        });
      }
      setFormData({ title: '', description: '', emoji: '📝', image_file: null, image_preview: '', image_data: '' });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task. Please try again.');
    }
  }

  function editTask(task: any) {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      emoji: task.emoji || '📝',
      image_file: null,
      image_preview: task.image_data || '',
      image_data: task.image_data || '',
    });
    setShowForm(true);
  }

  async function deleteTask(id: string) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'simulator_tasks', id));
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task. Please try again.');
      }
    }
  }

  function cancelEdit() {
    setEditingTask(null);
    setFormData({ title: '', description: '', emoji: '📝', image_file: null, image_preview: '', image_data: '' });
    setShowForm(false);
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Manage Simulator Tasks</h1>
              <p className="text-text-secondary text-lg mb-4">Create and manage tasks for the Prompt Engineering Simulator</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-admin-accent" />
                  <span>Task Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-success" />
                  <span>Add/Edit/Delete</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (showForm && editingTask) {
                  cancelEdit();
                } else {
                  setShowForm(!showForm);
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Task'}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* Task Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="premium">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="e.g., Write a professional email to request a meeting"
                />
                <p className="text-xs text-text-secondary mt-1">This will be displayed as the task in the simulator</p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Task Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  rows={3}
                  placeholder="Optional: Additional context or instructions for students"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Emoji Icon</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-text-primary focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  placeholder="📧"
                  maxLength={2}
                />
                <p className="text-xs text-text-secondary mt-1">Choose an emoji to represent this task (1-2 characters)</p>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Task Image (Optional)</label>
                {!formData.image_preview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.image_preview}
                      alt="Task preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-text-secondary mt-1">Upload an image for students to analyze or describe</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary"
                >
                  {editingTask ? 'Update Task' : 'Save Task'}
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

      {/* Task List */}
      {tasks.length === 0 && !showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="premium">
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">No tasks yet</h3>
              <p className="text-text-secondary mb-6">Create your first task to get started</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add First Task
              </motion.button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="premium">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-4xl">{task.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-text-secondary mt-1">{task.description}</p>
                    )}
                    {task.image_data && (
                      <div className="mt-2">
                        <img src={task.image_data} alt="Task image" className="w-full h-24 object-cover rounded-lg" />
                      </div>
                    )}
                    <p className="text-xs text-medium-gray mt-2">
                      Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => editTask(task)}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteTask(task.id)}
                    className="flex-1 btn-danger flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
