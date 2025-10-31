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
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, getDoc, setDoc, addDoc, Timestamp } from 'firebase/firestore';

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
  // Challenges management state
  const [challenges, setChallenges] = useState<any[]>([]);
  const [challengeSubmissions, setChallengeSubmissions] = useState<any[]>([]);
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState<string | null>(null);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    theme: '',
    prize: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchPosts(),
        fetchUserStats(),
        fetchOverallStats(),
        fetchUserPoints(),
        fetchChallenges(),
        fetchChallengeSubmissions()
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

  const fetchChallenges = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'challenges'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChallenges(data);
    } catch (e) {
      console.error('Error fetching challenges', e);
    }
  };

  const fetchChallengeSubmissions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'challengeSubmissions'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChallengeSubmissions(data);
    } catch (e) {
      console.error('Error fetching challenge submissions', e);
    }
  };

  const createChallenge = async () => {
    const { title, description, theme, prize, startDate, endDate } = newChallenge;
    if (!title || !description || !theme || !startDate || !endDate) {
      alert('Please fill title, description, theme, start and end dates.');
      return;
    }
    try {
      await addDoc(collection(db, 'challenges'), {
        title,
        description,
        theme,
        prize: prize || 'Community shout-out + 100 pts',
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        participants: 0,
        submissions: 0,
        status: 'upcoming'
      });
      setNewChallenge({ title: '', description: '', theme: '', prize: '', startDate: '', endDate: '' });
      await Promise.all([fetchChallenges(), fetchChallengeSubmissions()]);
      alert('Challenge created successfully.');
    } catch (e) {
      console.error('Error creating challenge', e);
      alert('Failed to create challenge.');
    }
  };

  const endChallenge = async (id: string) => {
    try {
      await updateDoc(doc(db, 'challenges', id), { status: 'ended' });
      await Promise.all([fetchChallenges(), fetchChallengeSubmissions()]);
    } catch (e) {
      console.error('Error ending challenge', e);
    }
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This will also remove all submissions.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'challenges', id));
      // Also delete related submissions
      const subsToDelete = challengeSubmissions.filter((s: any) => s.challengeId === id);
      await Promise.all(subsToDelete.map((sub: any) => deleteDoc(doc(db, 'challengeSubmissions', sub.id))));
      await Promise.all([fetchChallenges(), fetchChallengeSubmissions()]);
      setSelectedChallengeForSubmissions(null);
    } catch (e) {
      console.error('Error deleting challenge', e);
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
      {/* Stats Cards - keep at top */}
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

      {/* Create Challenge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">Post New Challenge</h3>
        <Card>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
              placeholder="Title"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
              placeholder="Theme (e.g., Neon Nature)"
              value={newChallenge.theme}
              onChange={(e) => setNewChallenge({ ...newChallenge, theme: e.target.value })}
            />
            <input
              className="px-3 py-2 md:col-span-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
              placeholder="Short description"
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                value={newChallenge.startDate}
                onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
              />
              <input
                type="date"
                className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                value={newChallenge.endDate}
                onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
              />
            </div>
            <input
              className="px-3 py-2 border border-light-accent rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
              placeholder="Prize (optional)"
              value={newChallenge.prize}
              onChange={(e) => setNewChallenge({ ...newChallenge, prize: e.target.value })}
            />
            <div className="flex items-end">
              <button
                onClick={createChallenge}
                className="px-4 py-3 bg-warm-brown text-white rounded-lg font-semibold hover:bg-warm-brown/90 transition-colors"
              >
                Post Challenge
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Manage Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-text-primary mb-4">Manage Challenges</h3>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-accent">
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Theme</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Dates</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-4 text-center text-text-secondary">No challenges yet.</td>
                  </tr>
                ) : (
                  challenges.flatMap((c: any) => {
                    const subs = challengeSubmissions.filter((s: any) => s.challengeId === c.id);
                    const isExpanded = selectedChallengeForSubmissions === c.id;
                    
                    const rows: JSX.Element[] = [
                      <tr key={c.id} className="border-b border-light-accent/50">
                        <td className="py-3 px-4 font-semibold text-text-primary">{c.title}</td>
                        <td className="py-3 px-4 text-text-secondary">{c.theme}</td>
                        <td className="py-3 px-4 text-text-secondary">{c.status || 'upcoming'}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          {(c.startDate?.toDate?.() || new Date(c.startDate)).toLocaleDateString()} - {(c.endDate?.toDate?.() || new Date(c.endDate)).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <button 
                            onClick={() => setSelectedChallengeForSubmissions(isExpanded ? null : c.id)} 
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            {subs.length} Submissions
                          </button>
                          <button onClick={() => endChallenge(c.id)} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">End</button>
                          <button onClick={() => deleteChallenge(c.id)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                        </td>
                      </tr>
                    ];
                    
                    if (isExpanded) {
                      rows.push(
                        <tr key={`${c.id}-submissions`}>
                          <td colSpan={5} className="py-4 px-4">
                            <div className="bg-light-accent/30 rounded-lg p-4">
                              <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-warm-brown" />
                                Submissions for "{c.title}"
                              </h4>
                              {subs.length === 0 ? (
                                <p className="text-text-secondary text-center py-4">No submissions yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {subs.map((sub: any) => (
                                    <Card key={sub.id} className="overflow-hidden">
                                      <div className="relative">
                                        <img
                                          src={sub.imageUrl}
                                          alt={sub.title}
                                          className="w-full h-40 object-cover"
                                        />
                                      </div>
                                      <div className="p-3">
                                        <h5 className="font-bold text-text-primary mb-1 line-clamp-1">{sub.title}</h5>
                                        <p className="text-xs text-text-secondary mb-2 line-clamp-2">{sub.description}</p>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-warm-brown rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs font-bold">
                                                {sub.userName?.charAt(0).toUpperCase() || 'A'}
                                              </span>
                                            </div>
                                            <span className="text-xs font-semibold text-text-primary">{sub.userName || 'Anonymous'}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-text-secondary">
                                            <Star className="w-3 h-3" />
                                            <span className="text-xs">{sub.votes || 0}</span>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-xs text-text-secondary">
                                          Submitted: {sub.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Challenge Submissions Summary */}
      {challengeSubmissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-xl font-semibold text-text-primary mb-4">All Challenge Submissions</h3>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {challengeSubmissions.slice(0, 12).map((sub: any) => {
                const challenge = challenges.find((c: any) => c.id === sub.challengeId);
                return (
                  <Card key={sub.id} className="overflow-hidden p-0">
                    <div className="relative">
                      <img
                        src={sub.imageUrl}
                        alt={sub.title}
                        className="w-full h-32 object-cover"
                      />
                      {challenge && (
                        <div className="absolute top-1 right-1">
                          <span className="px-1.5 py-0.5 bg-warm-brown/90 text-white text-xs font-semibold rounded">
                            {challenge.theme}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h6 className="font-semibold text-text-primary text-sm line-clamp-1 mb-1">{sub.title}</h6>
                      <p className="text-xs text-text-secondary line-clamp-1 mb-1">{sub.userName || 'Anonymous'}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{challenge?.title || 'Challenge'}</span>
                        <span className="flex items-center gap-1 text-warm-brown">
                          <Star className="w-3 h-3" />
                          {sub.votes || 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {challengeSubmissions.length > 12 && (
              <div className="text-center mt-4">
                <p className="text-text-secondary">And {challengeSubmissions.length - 12} more submissions...</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

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
