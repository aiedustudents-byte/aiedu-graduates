import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Trash2, 
  Flag, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Users, 
  Award,
  BarChart3,
  Calendar,
  Filter,
  Search,
  Crown,
  Star,
  Trophy,
  Gift,
  X,
  Plus
} from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, getDoc, setDoc } from 'firebase/firestore';

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
  status?: 'pending' | 'approved' | 'rejected';
  reported?: boolean;
}

interface UserStats {
  userId: string;
  creatorName: string;
  totalPoints: number;
  weeklyPoints: number;
  posts: number;
  upvotes: number;
}

export default function ManageAIArtistCorner() {
  const [posts, setPosts] = useState<ArtPost[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingPosts: 0,
    totalUsers: 0,
    weeklyTopCreator: null as any
  });
  
  // Points management state
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ArtPost | null>(null);
  const [pointsToGive, setPointsToGive] = useState<number | ''>('');
  const [userPointsData, setUserPointsData] = useState<{[userId: string]: any}>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchPosts(),
        fetchUserStats(),
        fetchOverallStats(),
        fetchUserPoints()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const usersRef = collection(db, 'userPoints');
      const snapshot = await getDocs(usersRef);
      const pointsMap: {[userId: string]: any} = {};
      snapshot.docs.forEach(doc => {
        pointsMap[doc.id] = doc.data();
      });
      setUserPointsData(pointsMap);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'artPosts');
      const snapshot = await getDocs(postsRef);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArtPost[];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const usersRef = collection(db, 'userPoints');
      const snapshot = await getDocs(usersRef);
      
      // Fetch user profiles for names
      const profilesRef = collection(db, 'user_profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      const profileEmailMap: {[email: string]: string} = {};
      profilesSnapshot.docs.forEach(doc => {
        const profileData = doc.data();
        if (profileData.email && profileData.name) {
          profileEmailMap[profileData.email.toLowerCase()] = profileData.name;
        }
      });
      
      // Fetch actual posts to count posts per user
      const postsRef = collection(db, 'artPosts');
      const postsSnapshot = await getDocs(postsRef);
      const postsByUser: {[userId: string]: number} = {};
      postsSnapshot.docs.forEach(doc => {
        const postData = doc.data();
        const userId = postData.creatorId;
        if (userId) {
          postsByUser[userId] = (postsByUser[userId] || 0) + 1;
        }
      });
      
      const usersData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const email = data.email?.toLowerCase() || '';
          const nameFromProfile = email ? profileEmailMap[email] : null;
          
          return {
            userId: doc.id,
            creatorName: nameFromProfile || data.creatorName || data.email?.split('@')[0] || 'Anonymous',
            totalPoints: data.totalPoints || 0,
            weeklyPoints: data.weeklyPoints || 0,
            posts: postsByUser[doc.id] || 0, // Count actual posts from artPosts collection
            upvotes: data.upvotes || 0
          };
        })
        .filter((user: any) => {
          // Only include users with actual points (totalPoints > 0 or weeklyPoints > 0)
          return (user.totalPoints > 0 || user.weeklyPoints > 0);
        }) as UserStats[];
      setUserStats(usersData.sort((a, b) => b.weeklyPoints - a.weeklyPoints));
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchOverallStats = async () => {
    try {
      const postsRef = collection(db, 'artPosts');
      const usersRef = collection(db, 'userPoints');
      
      const [postsSnapshot, usersSnapshot, profilesSnapshot] = await Promise.all([
        getDocs(postsRef),
        getDocs(usersRef),
        getDocs(collection(db, 'user_profiles'))
      ]);

      const postsData = postsSnapshot.docs.map(doc => doc.data());
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Create email to name mapping from profiles
      const profileEmailMap: {[email: string]: string} = {};
      profilesSnapshot.docs.forEach(doc => {
        const profileData = doc.data();
        if (profileData.email && profileData.name) {
          profileEmailMap[profileData.email.toLowerCase()] = profileData.name;
        }
      });

      const pendingPosts = postsData.filter(post => post.status === 'pending' || !post.status).length;
      
      // Filter users with actual points (Active Artists)
      const usersWithPoints = usersData.filter((user: any) => 
        (user.totalPoints > 0 || user.weeklyPoints > 0)
      );
      
      // Get top creator with real name
      const sortedUsers = usersWithPoints.sort((a: any, b: any) => b.weeklyPoints - a.weeklyPoints);
      const topCreator = sortedUsers[0];
      
      // Get real name for top creator
      if (topCreator) {
        const email = topCreator.email?.toLowerCase() || '';
        const nameFromProfile = email ? profileEmailMap[email] : null;
        topCreator.creatorName = nameFromProfile || topCreator.creatorName || topCreator.email?.split('@')[0] || 'Anonymous';
      }

      setStats({
        totalPosts: postsSnapshot.size,
        pendingPosts,
        totalUsers: usersWithPoints.length, // Only count users with points (Active Artists)
        weeklyTopCreator: topCreator || null
      });
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const handlePostAction = async (postId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const postRef = doc(db, 'artPosts', postId);
      
      if (action === 'delete') {
        await deleteDoc(postRef);
      } else {
        await updateDoc(postRef, {
          status: action === 'approve' ? 'approved' : 'rejected'
        });
      }
      
      fetchPosts();
      fetchOverallStats();
    } catch (error) {
      console.error(`Error ${action}ing post:`, error);
    }
  };

  const handleGivePoints = async (userId: string, points: number | '') => {
    if (!selectedPost) return;
    
    // Validate points
    const pointsValue = typeof points === 'number' ? points : parseInt(String(points));
    if (!pointsValue || pointsValue < 1 || pointsValue > 100) {
      alert('Please enter a valid number of points between 1 and 100.');
      return;
    }
    
    try {
      const userRef = doc(db, 'userPoints', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Set points to the new value (replace old value, don't add)
        await updateDoc(userRef, {
          totalPoints: pointsValue,
          weeklyPoints: pointsValue
        });
      } else {
        // Create new user points document
        await setDoc(userRef, {
          userId: userId,
          totalPoints: pointsValue,
          weeklyPoints: pointsValue,
          posts: 0,
          upvotes: 0,
          challenges: 0
        });
      }
      
      // Refresh data
      await fetchUserPoints();
      await fetchUserStats();
      await fetchOverallStats();
      
      // Close modal
      setShowPointsModal(false);
      setSelectedPost(null);
      setPointsToGive('');
      
      alert(`Successfully set ${pointsValue} points for ${selectedPost.creatorName}!`);
    } catch (error) {
      console.error('Error setting points:', error);
      alert('Failed to set points. Please try again.');
    }
  };

  const openPointsModal = (post: ArtPost) => {
    setSelectedPost(post);
    setShowPointsModal(true);
    setPointsToGive(''); // Start with empty
  };

  const filteredPosts = posts.filter(post => {
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus || (!post.status && filterStatus === 'pending');
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statCards = [
    { 
      icon: BarChart3, 
      label: 'Total Posts', 
      value: stats.totalPosts, 
      color: 'text-admin-accent', 
      bg: 'bg-admin-accent/10' 
    },
    { 
      icon: Flag, 
      label: 'Pending Review', 
      value: stats.pendingPosts, 
      color: 'text-warning', 
      bg: 'bg-warning/10' 
    },
    { 
      icon: Users, 
      label: 'Active Artists', 
      value: stats.totalUsers, 
      color: 'text-success', 
      bg: 'bg-success/10' 
    },
    { 
      icon: Crown, 
      label: 'Weekly Leader', 
      value: stats.weeklyTopCreator && stats.weeklyTopCreator.weeklyPoints > 0 
        ? stats.weeklyTopCreator.creatorName 
        : 'None', 
      color: 'text-warm-brown', 
      bg: 'bg-warm-brown/10' 
    },
  ];

  // Show loading state or empty state
  if (loading) {
    return (
      <div className="space-y-8">
        <Card variant="premium">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-warm-brown border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">🎨 AI Artist Corner Management</h1>
              <p className="text-text-secondary text-lg mb-4">Moderate community posts and manage the creativity hub</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-admin-accent" />
                  <span>Content Moderation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-success" />
                  <span>Community Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  <span>Analytics Dashboard</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-warm-brown to-red-600 rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Award className="w-12 h-12 text-white" />
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
                    <p className="text-2xl font-bold text-text-primary mb-1">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </p>
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

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-medium-gray" />
              <span className="font-semibold text-text-primary">Filter by status:</span>
            </div>
            {[
              { key: 'all', label: 'All Posts' },
              { key: 'pending', label: 'Pending Review' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(key as any)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterStatus === key
                    ? 'bg-warm-brown text-white shadow-lg'
                    : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
                }`}
              >
                {label}
              </motion.button>
            ))}
            
            <div className="ml-auto flex items-center gap-2">
              <Search className="w-5 h-5 text-medium-gray" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search posts..."
                className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Posts Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">Community Posts</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
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
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        post.status === 'approved' ? 'bg-green-100 text-green-600' :
                        post.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {post.status === 'approved' ? '✓ Approved' :
                         post.status === 'rejected' ? '✗ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-warm-brown text-white text-xs font-semibold rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-text-primary mb-2">{post.title}</h3>
                    <p className="text-text-secondary text-sm mb-3 line-clamp-2">{post.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-warm-brown" />
                        <span className="text-sm font-semibold text-warm-brown">
                          {userPointsData[post.creatorId]?.totalPoints || 0} pts
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {post.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-warm-brown/10 text-warm-brown text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {(!post.status || post.status === 'pending') && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePostAction(post.id, 'approve')}
                              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePostAction(post.id, 'reject')}
                              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </motion.button>
                          </>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePostAction(post.id, 'delete')}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openPointsModal(post)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-warm-brown to-orange-500 text-white rounded-lg hover:from-warm-brown/90 hover:to-orange-400 transition-all flex items-center justify-center gap-2 font-semibold"
                      >
                        <Gift className="w-4 h-4" />
                        Set Points
                      </motion.button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">🏆 Community Leaderboard</h3>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-accent">
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Artist</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Posts</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Weekly Points</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {userStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-text-secondary">
                      No users with points yet. Points will appear here once admins award them.
                    </td>
                  </tr>
                ) : (
                  userStats.slice(0, 10).map((user, index) => (
                    <tr key={user.userId} className="border-b border-light-accent/50 hover:bg-light-accent/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Crown className="w-4 h-4 text-yellow-600" />}
                          {index === 1 && <Star className="w-4 h-4 text-gray-400" />}
                          {index === 2 && <Award className="w-4 h-4 text-orange-600" />}
                          <span className="font-semibold text-text-primary">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-warm-brown rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {user.creatorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-text-primary">{user.creatorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{user.posts || 0}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-warm-brown">{user.weeklyPoints || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary">{user.totalPoints || 0}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Points Modal */}
      {showPointsModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-warm-brown to-orange-500 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Set Points</h3>
                    <p className="text-sm text-text-secondary">Set the artist's point balance (replaces existing points)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPointsModal(false);
                    setSelectedPost(null);
                    setPointsToGive('');
                  }}
                  className="p-2 hover:bg-light-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-medium-gray" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-light-accent rounded-lg">
                  <div className="w-10 h-10 bg-warm-brown rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {selectedPost.creatorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{selectedPost.creatorName}</p>
                    <p className="text-xs text-text-secondary">{selectedPost.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Current Points</p>
                    <p className="font-bold text-warm-brown text-lg">
                      {userPointsData[selectedPost.creatorId]?.totalPoints || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Points to Set
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[5, 10, 15, 20, 25].map((points) => (
                      <motion.button
                        key={points}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPointsToGive(points)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          pointsToGive === points
                            ? 'bg-warm-brown text-white shadow-lg'
                            : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
                        }`}
                      >
                        {points}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Custom amount:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pointsToGive}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPointsToGive(value === '' ? '' : parseInt(value) || '');
                      }}
                      className="flex-1 px-3 py-2 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                      placeholder="Enter points"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowPointsModal(false);
                    setSelectedPost(null);
                    setPointsToGive('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGivePoints(selectedPost.creatorId, pointsToGive)}
                  disabled={!pointsToGive || (typeof pointsToGive === 'number' && (pointsToGive < 1 || pointsToGive > 100))}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-warm-brown to-orange-500 text-white rounded-lg hover:from-warm-brown/90 hover:to-orange-400 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trophy className="w-5 h-5" />
                  Set {pointsToGive || '...'} Points
                </motion.button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
