import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Filter,
  Trophy,
  Star,
  Award,
  Upload,
  Sparkles,
  TrendingUp,
  Calendar,
  Tag,
  Target,
  Send,
  Check
} from 'lucide-react';
import Card from '../../components/Card';
import CommunityChallenges from '../../components/CommunityChallenges';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, limit, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '../../contexts/UserContext';
import type { User } from 'firebase/auth';

interface ArtPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creatorName: string;
  creatorAvatar: string;
  creatorId: string;
  aiTool: string;
  tags: string[];
  upvotes: number;
  upvotedBy: string[];
  comments: number;
  createdAt: any;
  category: string;
}

interface UserPoints {
  userId: string;
  totalPoints: number;
  weeklyPoints: number;
  posts: number;
  upvotes: number;
}

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  authorId: string;
  createdAt: any;
}

const AI_TOOLS = [
  'Midjourney', 'Leonardo AI', 'Runway ML', 'DALL-E 3', 'Stable Diffusion', 
  'Adobe Firefly', 'Canva AI', 'Figma AI', 'Other'
];

const CATEGORIES = [
  'Digital Portraits', '3D Art', 'Anime', 'Landscape', 'Abstract', 
  'Character Design', 'Concept Art', 'Photography', 'Other'
];

export default function AIArtistCorner() {
  const [posts, setPosts] = useState<ArtPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'category'>('popular');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [featuredCreator, setFeaturedCreator] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges'>('feed');
  const { user, loading: authLoading } = useUser();
  
  // New state for comments and sharing
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{[postId: string]: Comment[]}>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchFeaturedCreator();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUserPoints(null);
      return;
    }
    fetchUserPoints(user);
  }, [user, authLoading]);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'artPosts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArtPost[];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async (currentUser: User) => {
    try {
      const userRef = doc(db, 'userPoints', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPoints(userData as UserPoints);
        
        // Update email if missing
        if (!userData.email && currentUser.email) {
          await updateDoc(userRef, {
            email: currentUser.email
          });
        }
      } else {
        // Initialize user points with email
        const newUserPoints = {
          userId: currentUser.uid,
          email: currentUser.email || '',
          totalPoints: 0,
          weeklyPoints: 0,
          posts: 0,
          upvotes: 0
        };
        await setDoc(userRef, newUserPoints);
        setUserPoints(newUserPoints as UserPoints);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchFeaturedCreator = async () => {
    try {
      const usersRef = collection(db, 'userPoints');
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const topUser = users.sort((a: any, b: any) => b.weeklyPoints - a.weeklyPoints)[0];
      setFeaturedCreator(topUser);
    } catch (error) {
      console.error('Error fetching featured creator:', error);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!user) {
      alert('Please sign in to upvote posts.');
      return;
    }

    try {
      const postRef = doc(db, 'artPosts', postId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) return;

      const isUpvoted = post.upvotedBy.includes(user.uid);
      
      if (isUpvoted) {
        // Remove upvote
        await updateDoc(postRef, {
          upvotes: post.upvotes - 1,
          upvotedBy: arrayRemove(user.uid)
        });
        
        // Update user points
        if (userPoints) {
          const userRef = doc(db, 'userPoints', user.uid);
          await updateDoc(userRef, {
            upvotes: userPoints.upvotes - 1,
            totalPoints: userPoints.totalPoints - 1
          });
        }
      } else {
        // Add upvote
        await updateDoc(postRef, {
          upvotes: post.upvotes + 1,
          upvotedBy: arrayUnion(user.uid)
        });
        
        // Update user points
        if (userPoints) {
          const userRef = doc(db, 'userPoints', user.uid);
          await updateDoc(userRef, {
            upvotes: userPoints.upvotes + 1,
            totalPoints: userPoints.totalPoints + 1
          });
        }
      }
      
      fetchPosts();
      if (user) fetchUserPoints(user);
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  // Handle adding comments
  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    if (!user) {
      alert('Please sign in to comment.');
      return;
    }
    
    try {
      const commentData = {
        text: commentText.trim(),
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: user.photoURL || '',
        authorId: user.uid,
        createdAt: new Date()
      };
      
      // Add comment to Firestore
      await addDoc(collection(db, 'artPosts', postId, 'comments'), commentData);
      
      // Update post comment count
      const postRef = doc(db, 'artPosts', postId);
      await updateDoc(postRef, {
        comments: (posts.find(p => p.id === postId)?.comments || 0) + 1
      });
      
      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { id: Date.now().toString(), ...commentData }]
      }));
      
      setCommentText('');
      fetchPosts(); // Refresh posts to get updated comment count
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Handle fetching comments for a post
  const fetchComments = async (postId: string) => {
    try {
      const commentsRef = collection(db, 'artPosts', postId, 'comments');
      const snapshot = await getDocs(commentsRef);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      
      setComments(prev => ({
        ...prev,
        [postId]: commentsData
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle sharing posts
  const handleShare = async (post: ArtPost) => {
    try {
      const shareUrl = `${window.location.origin}/ai-artist-corner?post=${post.id}`;
      const shareText = `Check out this amazing AI artwork: "${post.title}"`;
      
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/ai-artist-corner?post=${post.id}`;
        await navigator.clipboard.writeText(`${post.title}\n${shareUrl}`);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  const filteredPosts = posts.filter(post => 
    selectedCategory === 'all' || post.category === selectedCategory
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.upvotes - a.upvotes;
      case 'newest':
        return b.createdAt?.toDate?.() - a.createdAt?.toDate?.();
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-bg to-light-accent/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="premium" className="overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-warm-brown to-red-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-warm-brown mb-2">🎨 AI Artist Corner</h1>
                  <p className="text-text-secondary text-lg">Community + Gamified Creativity Hub</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWallet(true)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Trophy className="w-5 h-5" />
                  {userPoints?.weeklyPoints || 0} Points
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!user) {
                      alert('Please sign in to create a post.');
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                  className="px-6 py-3 bg-warm-brown text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Post
                </motion.button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'feed'
                    ? 'bg-warm-brown text-white shadow-lg'
                    : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                Community Feed
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('challenges')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'challenges'
                    ? 'bg-warm-brown text-white shadow-lg'
                    : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
                }`}
              >
                <Target className="w-5 h-5" />
                Challenges
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* Featured Creator */}
        {featuredCreator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card variant="premium" className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-2xl font-bold text-warm-brown">🏆 AI Art Maestro of the Week</h3>
                  </div>
                  <p className="text-text-secondary">
                    <span className="font-semibold">{featuredCreator.creatorName || 'Anonymous Artist'}</span> 
                    {' '}leads this week with {featuredCreator.weeklyPoints} points!
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-600">{featuredCreator.weeklyPoints}</p>
                  <p className="text-sm text-text-secondary">Weekly Points</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'feed' ? (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-medium-gray" />
                    <span className="font-semibold text-text-primary">Sort by:</span>
                  </div>
                  {[
                    { key: 'popular', label: 'Popular', icon: TrendingUp },
                    { key: 'newest', label: 'Newest', icon: Calendar },
                    { key: 'category', label: 'Category', icon: Tag }
                  ].map(({ key, label, icon: Icon }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortBy(key as any)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        sortBy === key
                          ? 'bg-warm-brown text-white shadow-lg'
                          : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </motion.button>
                  ))}
                  
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <div className="animate-pulse">
                          <div className="w-full h-48 bg-light-accent rounded-lg mb-4"></div>
                          <div className="h-4 bg-light-accent rounded mb-2"></div>
                          <div className="h-3 bg-light-accent rounded w-3/4"></div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  sortedPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      layout
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="relative">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 bg-warm-brown text-white text-xs font-semibold rounded-full">
                              {post.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-bold text-text-primary mb-2 line-clamp-2">{post.title}</h3>
                          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{post.description}</p>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-warm-brown rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {post.creatorName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{post.creatorName}</p>
                              <p className="text-xs text-text-secondary">{post.aiTool}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleUpvote(post.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                                  post.upvotedBy.includes(user?.uid || '')
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-light-accent text-medium-gray hover:bg-red-50'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${
                                  post.upvotedBy.includes(user?.uid || '') ? 'fill-current' : ''
                                }`} />
                                {post.upvotes}
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setShowComments(showComments === post.id ? null : post.id);
                                  if (showComments !== post.id) {
                                    fetchComments(post.id);
                                  }
                                }}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                                  showComments === post.id
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-light-accent text-medium-gray hover:bg-blue-50'
                                }`}
                              >
                                <MessageCircle className="w-4 h-4" />
                                {post.comments}
                              </motion.button>
                            </div>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleShare(post)}
                              className={`p-2 rounded-full transition-all ${
                                copiedPostId === post.id
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-light-accent text-medium-gray hover:bg-green-50'
                              }`}
                            >
                              {copiedPostId === post.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-warm-brown/10 text-warm-brown text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Card>
                      
                      {/* Comments Section */}
                      <AnimatePresence>
                        {showComments === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-2"
                          >
                            <Card className="p-4">
                              <div className="space-y-4">
                                {/* Existing Comments */}
                                <div className="space-y-3">
                                  {comments[post.id]?.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <div className="w-8 h-8 bg-warm-brown rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">
                                          {comment.authorName.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-semibold text-text-primary">
                                            {comment.authorName}
                                          </span>
                                          <span className="text-xs text-text-secondary">
                                            {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-text-secondary">{comment.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {(!comments[post.id] || comments[post.id].length === 0) && (
                                    <p className="text-sm text-text-secondary text-center py-4">
                                      No comments yet. Be the first to comment!
                                    </p>
                                  )}
                                </div>
                                
                                {/* Add Comment Form */}
                                {user && (
                                  <div className="flex gap-3 pt-3 border-t border-light-accent">
                                    <div className="w-8 h-8 bg-warm-brown rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-xs font-bold">
                                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
                                      </span>
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && commentText.trim()) {
                                            handleAddComment(post.id);
                                          }
                                        }}
                                        className="flex-1 px-3 py-2 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20 text-sm"
                                      />
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={!commentText.trim()}
                                        className="px-3 py-2 bg-warm-brown text-white rounded-lg hover:bg-warm-brown/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Send className="w-4 h-4" />
                                      </motion.button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {!loading && sortedPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Card>
                  <div className="py-8">
                    <Sparkles className="w-16 h-16 text-warm-brown mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No posts yet</h3>
                    <p className="text-text-secondary mb-6">Be the first to share your AI artwork!</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-warm-brown text-white rounded-xl font-semibold flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Create First Post
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        ) : (
          <CommunityChallenges />
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onPostCreated={() => {
              fetchPosts();
              if (user) fetchUserPoints(user);
              setShowCreateModal(false);
            }}
            userPoints={userPoints}
          />
        )}
      </AnimatePresence>

      {/* Wallet Modal */}
      <AnimatePresence>
        {showWallet && (
          <WalletModal
            userPoints={userPoints}
            onClose={() => setShowWallet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Post Modal Component
function CreatePostModal({ onClose, onPostCreated, userPoints }: { onClose: () => void; onPostCreated: () => void; userPoints: UserPoints | null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aiTool: '',
    category: '',
    tags: [] as string[],
    image: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { user } = useUser();

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    // Compress image first
    const compressedFile = await compressImage(file);
    
    // Try Firebase Storage first, but immediately fallback to base64 for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Localhost detected, using base64 fallback for image storage');
      return await convertToBase64(compressedFile);
    }
    
    try {
      const imageRef = ref(storage, `art-posts/${Date.now()}-${compressedFile.name}`);
      const snapshot = await uploadBytes(imageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Firebase Storage failed, using base64 fallback:', error);
      return await convertToBase64(compressedFile);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to create a post.');
      return;
    }
    if (!formData.image) {
      alert('Please upload an image before posting.');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload image with compression (allows longer uploads on production)
      const imageUrl = await handleImageUpload(formData.image);
      
      // Step 2: Create post data
      const postData = {
        title: formData.title,
        description: formData.description,
        imageUrl,
        creatorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        creatorAvatar: user.photoURL || '',
        creatorId: user.uid,
        aiTool: formData.aiTool,
        category: formData.category,
        tags: formData.tags,
        upvotes: 0,
        upvotedBy: [],
        comments: 0,
        createdAt: new Date(),
        status: 'pending' // Add moderation status
      };

      // Step 3: Save to database
      await addDoc(collection(db, 'artPosts'), postData);
      
      // Step 4: Update user points (optional, can be done in background)
      try {
        const userRef = doc(db, 'userPoints', user.uid);
        await updateDoc(userRef, {
          posts: (userPoints?.posts || 0) + 1,
          totalPoints: (userPoints?.totalPoints || 0) + 5,
          weeklyPoints: (userPoints?.weeklyPoints || 0) + 5
        }).catch(async () => {
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email || '',
            posts: (userPoints?.posts || 0) + 1,
            totalPoints: (userPoints?.totalPoints || 0) + 5,
            weeklyPoints: (userPoints?.weeklyPoints || 0) + 5,
            upvotes: userPoints?.upvotes || 0
          }, { merge: true });
        });
      } catch (pointsError) {
        console.warn('Failed to update user points:', pointsError);
        // Don't fail the entire upload for points update
      }

      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to upload post. Please check your connection or try again with a smaller image.');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-warm-brown">Create New Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-accent rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Upload Image/Video
              </label>
              <div className="border-2 border-dashed border-light-accent rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        alert('File size must be less than 10MB. Please choose a smaller image.');
                        return;
                      }
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        alert('Please select an image file (PNG, JPG, etc.)');
                        return;
                      }
                      setFormData(prev => ({ ...prev, image: file }));
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-medium-gray" />
                    <span className="text-text-secondary">Click to upload or drag and drop</span>
                    <span className="text-xs text-medium-gray">PNG, JPG up to 10MB (will be compressed)</span>
                  </div>
                </label>
                {formData.image && (
                  <div className="mt-2">
                    <p className="text-sm text-warm-brown">✓ {formData.image.name}</p>
                    <p className="text-xs text-medium-gray">
                      Size: {(formData.image.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                placeholder="Give your artwork a catchy title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20 h-24 resize-none"
                placeholder="Describe your creative process, inspiration, or techniques used..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  AI Tool Used *
                </label>
                <select
                  value={formData.aiTool}
                  onChange={(e) => setFormData(prev => ({ ...prev, aiTool: e.target.value }))}
                  className="w-full px-4 py-3 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                  required
                >
                  <option value="">Select AI Tool</option>
                  {AI_TOOLS.map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                  placeholder="Add tags (press Enter to add)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-warm-brown text-white rounded-lg hover:bg-warm-brown/90 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-warm-brown/10 text-warm-brown rounded-full text-sm flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-light-accent text-medium-gray rounded-lg hover:bg-light-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !formData.image || !formData.title || !formData.aiTool || !formData.category}
                className="flex-1 px-6 py-3 bg-warm-brown text-white rounded-lg hover:bg-warm-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Image...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Post (+5 Points)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Wallet Modal Component
function WalletModal({ userPoints, onClose }: { userPoints: UserPoints | null; onClose: () => void }) {
  const rewards = [
    { name: 'Course Discount (10%)', points: 100, description: 'Get 10% off any premium course' },
    { name: 'Premium AI Tools Access', points: 100, description: '1 month access to premium AI tools' },
    { name: 'Certificate of Excellence', points: 100, description: 'Official AI Art Certificate' },
    { name: 'Mentorship Session', points: 100, description: '1-on-1 session with AI expert' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-warm-brown">🏆 Your Reward Wallet</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-accent rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="text-center">
              <div className="p-4">
                <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-warm-brown">{userPoints?.totalPoints || 0}</p>
                <p className="text-sm text-text-secondary">Total Points</p>
              </div>
            </Card>
            <Card className="text-center">
              <div className="p-4">
                <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-warm-brown">{userPoints?.weeklyPoints || 0}</p>
                <p className="text-sm text-text-secondary">Weekly Points</p>
              </div>
            </Card>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Available Rewards</h3>
            <div className="space-y-3">
              {rewards.map((reward, index) => (
                <Card key={index} className={`p-4 ${(userPoints?.totalPoints || 0) >= reward.points ? 'border-green-200 bg-green-50' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">{reward.name}</h4>
                      <p className="text-sm text-text-secondary">{reward.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-warm-brown">{reward.points} pts</p>
                      <button
                        disabled={(userPoints?.totalPoints || 0) < reward.points}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          (userPoints?.totalPoints || 0) >= reward.points
                            ? 'bg-warm-brown text-white hover:bg-warm-brown/90'
                            : 'bg-light-accent text-medium-gray cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-text-secondary mb-4">
              Earn points by creating posts (+5), getting upvotes (+1), and participating in challenges!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-warm-brown text-white rounded-lg hover:bg-warm-brown/90 transition-colors"
            >
              Close Wallet
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
