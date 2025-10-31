import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Clock, 
  Star,
  Target,
  Zap,
  Crown,
  TrendingUp,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import Card from './Card';
import { db, storage, auth } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, where, getDoc, Timestamp, increment, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: any;
  endDate: any;
  prize: string;
  participants: number;
  submissions: number;
  status: 'upcoming' | 'active' | 'ended';
  winner?: string;
  imageUrl?: string;
}

interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  imageUrl: string;
  votes: number;
  createdAt: any;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  challengesWon: number;
  totalSubmissions: number;
  pointsEarned: number;
}

export default function CommunityChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityStats, setCommunityStats] = useState({
    totalPosts: 0,
    pendingPosts: 0,
    activeArtists: 0,
    weeklyLeader: ''
  });
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submissionData, setSubmissionData] = useState({
    title: '',
    description: '',
    imageFile: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallenges();
    fetchSubmissions();
    fetchCommunityStats();
  }, []);

  useEffect(() => {
    if (!loading) {
      calculateLeaderboard();
    }
  }, [submissions, challenges, loading]);

  const fetchChallenges = async () => {
    try {
      const challengesRef = collection(db, 'challenges');
      const snapshot = await getDocs(challengesRef);
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Challenge[];
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const [postsSnapshot, usersSnapshot, profilesSnapshot] = await Promise.all([
        getDocs(collection(db, 'artPosts')),
        getDocs(collection(db, 'userPoints')),
        getDocs(collection(db, 'user_profiles'))
      ]);

      const postsData = postsSnapshot.docs.map(d => d.data());
      const usersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const pendingPosts = postsData.filter((p: any) => p.status === 'pending' || !p.status).length;
      const usersWithPoints = usersData.filter((u: any) => (u.totalPoints > 0 || u.weeklyPoints > 0));
      const sortedByWeekly = [...usersWithPoints].sort((a: any, b: any) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0));
      const top = sortedByWeekly[0];

      // Build email->name map
      const profileEmailMap: { [email: string]: string } = {};
      profilesSnapshot.docs.forEach(doc => {
        const data: any = doc.data();
        if (data.email && data.name) profileEmailMap[data.email.toLowerCase()] = data.name;
      });

      let weeklyLeaderName = '';
      if (top) {
        const email = (top.email || '').toLowerCase();
        weeklyLeaderName = profileEmailMap[email] || top.creatorName || (email ? email.split('@')[0] : '');
      }

      setCommunityStats({
        totalPosts: postsSnapshot.size,
        pendingPosts,
        activeArtists: usersWithPoints.length,
        weeklyLeader: weeklyLeaderName
      });
    } catch (e) {
      console.error('Error fetching community stats', e);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const submissionsRef = collection(db, 'challengeSubmissions');
      const snapshot = await getDocs(submissionsRef);
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaderboard = async () => {
    try {
      // Group submissions by user
      const userSubmissions: {[userId: string]: Submission[]} = {};
      submissions.forEach(submission => {
        if (!userSubmissions[submission.userId]) {
          userSubmissions[submission.userId] = [];
        }
        userSubmissions[submission.userId].push(submission);
      });

      // Count challenges won by checking challenge winners
      const userChallengesWon: {[userId: string]: number} = {};
      challenges.forEach(challenge => {
        if (challenge.winner) {
          // Find user ID from winner name or winner field
          const winnerSubmission = submissions.find(
            s => s.userName === challenge.winner || s.userId === challenge.winner
          );
          if (winnerSubmission) {
            userChallengesWon[winnerSubmission.userId] = 
              (userChallengesWon[winnerSubmission.userId] || 0) + 1;
          }
        }
      });

    // Fetch user points AND emails
    const userPointsMap: {[userId: string]: number} = {};
    const userIdToEmailMap: {[userId: string]: string} = {}; // userId -> email
    try {
      const usersRef = collection(db, 'userPoints');
      const usersSnapshot = await getDocs(usersRef);
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        userPointsMap[doc.id] = data.totalPoints || 0;
        if (data.email) {
          userIdToEmailMap[doc.id] = data.email.toLowerCase();
        }
      });
    } catch (error) {
      console.error('Error fetching user points:', error);
    }

    // Fetch user profiles (email -> name mapping)
    const profileEmailMap: {[email: string]: string} = {}; // email -> name from profile
    try {
      const profilesRef = collection(db, 'user_profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      profilesSnapshot.docs.forEach(doc => {
        const profileData = doc.data();
        if (profileData.email && profileData.name) {
          profileEmailMap[profileData.email.toLowerCase()] = profileData.name;
        }
      });
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }

    // Helper function to get user name with priority
    const getUserName = (userId: string): string => {
      // Priority 1: Get email from userPoints, then check profile name
      const email = userIdToEmailMap[userId];
      if (email && profileEmailMap[email]) {
        return profileEmailMap[email]; // Profile name (updated by user)
      }
      
      // Priority 2: Check submission userName (if it's not an email)
      const userSubmission = submissions.find(s => s.userId === userId);
      if (userSubmission?.userName && !userSubmission.userName.includes('@')) {
        return userSubmission.userName;
      }
      
      // Priority 3: Extract name from email (before @)
      if (email) {
        const emailPrefix = email.split('@')[0];
        // Capitalize first letter
        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
      
      // Priority 4: Fallback to Anonymous
      return 'Anonymous';
    };

      // Build leaderboard entries
      const leaderboardData: LeaderboardEntry[] = [];
      const addedUserIds = new Set<string>();
      
    // Add users who have submissions
    Object.keys(userSubmissions).forEach(userId => {
      const userSubs = userSubmissions[userId];
      
      leaderboardData.push({
        userId: userId,
        userName: getUserName(userId),
        userAvatar: '',
        challengesWon: userChallengesWon[userId] || 0,
        totalSubmissions: userSubs.length,
        pointsEarned: userPointsMap[userId] || 0
      });
      addedUserIds.add(userId);
    });

    // Add users who have points but no submissions
    Object.keys(userPointsMap).forEach(userId => {
      if (!addedUserIds.has(userId) && userPointsMap[userId] > 0) {
        leaderboardData.push({
          userId: userId,
          userName: getUserName(userId),
          userAvatar: '',
          challengesWon: userChallengesWon[userId] || 0,
          totalSubmissions: 0,
          pointsEarned: userPointsMap[userId]
        });
      }
    });

      // Sort by points earned (descending)
      leaderboardData.sort((a, b) => b.pointsEarned - a.pointsEarned);

      // Limit to top 10
      setLeaderboard(leaderboardData.slice(0, 10));
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
    }
  };

  const handleSetReminder = (challenge: Challenge) => {
    try {
      const existingRaw = localStorage.getItem('challengeReminders') || '[]';
      const existing = JSON.parse(existingRaw);
      const already = existing.some((r: any) => r.id === challenge.id);
      if (!already) {
        existing.push({
          id: challenge.id,
          title: challenge.title,
          start: challenge.startDate,
          end: challenge.endDate
        });
        localStorage.setItem('challengeReminders', JSON.stringify(existing));
      }
      alert('Reminder set! We\'ll remind you on the challenge start date.');
    } catch (e) {
      console.error('Failed to set reminder', e);
      alert('Could not set reminder. Please try again.');
    }
  };

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOpenSubmissionModal = (challenge: Challenge) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please sign in to submit artwork for challenges.');
      return;
    }
    setSelectedChallenge(challenge);
    setSubmissionData({ title: '', description: '', imageFile: null });
    setShowSubmissionModal(true);
  };

  const handleSubmitArtwork = async () => {
    if (!selectedChallenge || !auth.currentUser) return;
    
    const { title, description, imageFile } = submissionData;
    if (!title || !description || !imageFile) {
      alert('Please fill in all fields and upload an image.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const userId = user.uid;
      const userName = user.displayName || user.email?.split('@')[0] || 'Anonymous';
      
      // Compress image (fast, client-side)
      const compressedFile = await compressImage(imageFile);
      
      // Use base64 for localhost/dev (much faster), Firebase Storage for production
      let imageUrl: string;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // Instant base64 for localhost
        imageUrl = await convertToBase64(compressedFile);
      } else {
        // Firebase Storage for production
        const imageRef = ref(storage, `challenge-submissions/${selectedChallenge.id}/${userId}_${Date.now()}_${compressedFile.name}`);
        await uploadBytes(imageRef, compressedFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Create submission and update challenge atomically (no read needed)
      const challengeRef = doc(db, 'challenges', selectedChallenge.id);
      
      // Create submission first
      await addDoc(collection(db, 'challengeSubmissions'), {
        challengeId: selectedChallenge.id,
        userId: userId,
        userName: userName,
        title: title,
        description: description,
        imageUrl: imageUrl,
        votes: 0,
        createdAt: Timestamp.now()
      });

      // Update challenge counts atomically (fast, no read needed!)
      await updateDoc(challengeRef, {
        submissions: increment(1),
        participantIds: arrayUnion(userId)
      });

      // Update participants count in background (non-blocking)
      getDoc(challengeRef).then(doc => {
        if (doc.exists()) {
          const data = doc.data();
          const participantIds = data.participantIds || [];
          updateDoc(challengeRef, { participants: participantIds.length }).catch(console.error);
        }
      }).catch(console.error);

      // Close modal immediately (better UX)
      setShowSubmissionModal(false);
      setSelectedChallenge(null);
      setSubmissionData({ title: '', description: '', imageFile: null });
      
      alert('Your artwork has been submitted successfully! 🎨');
      
      // Immediately refresh submissions and challenges
      await Promise.all([
        fetchSubmissions(),
        fetchChallenges()
      ]);
      
      setSubmitting(false);
      
    } catch (error) {
      console.error('Error submitting artwork:', error);
      alert('Failed to submit artwork. Please try again.');
      setSubmitting(false);
    }
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const now = new Date();
    const startDate = challenge.startDate?.toDate?.() || new Date(challenge.startDate);
    const endDate = challenge.endDate?.toDate?.() || new Date(challenge.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  };

  const formatDate = (date: any) => {
    if (!date) return 'TBD';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const getTimeRemaining = (endDate: any) => {
    const now = new Date();
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const upcomingChallenges = challenges.filter(c => getChallengeStatus(c) === 'upcoming');
  const activeChallenges = challenges.filter(c => getChallengeStatus(c) === 'active');
  const endedChallenges = challenges.filter(c => getChallengeStatus(c) === 'ended');

  return (
    <div className="space-y-8">
      {/* Community Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
              label: 'Total Posts', value: communityStats.totalPosts, icon: TrendingUp as any, bg: 'bg-admin-accent/10', color: 'text-admin-accent'
            },{
              label: 'Pending Review', value: communityStats.pendingPosts, icon: Calendar as any, bg: 'bg-warning/10', color: 'text-warning'
            },{
              label: 'Active Artists', value: communityStats.activeArtists, icon: Users as any, bg: 'bg-success/10', color: 'text-success'
            },{
              label: 'Weekly Leader', value: communityStats.weeklyLeader || '—', icon: Crown as any, bg: 'bg-warm-brown/10', color: 'text-warm-brown'
            }].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/60">
                <div>
                  <p className={`text-2xl font-bold ${s.label === 'Weekly Leader' ? 'text-text-primary' : 'text-text-primary'}`}>{s.value as any}</p>
                  <p className="text-sm text-text-secondary">{s.label}</p>
                </div>
                <div className={`w-14 h-14 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">🏆 Community Challenges</h1>
              <p className="text-text-secondary text-lg mb-4">Weekly AI art contests and competitions</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-admin-accent" />
                  <span>Weekly Contests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-success" />
                  <span>Community Recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  <span>Leaderboards</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="flex gap-4">
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-warm-brown text-white shadow-lg'
                  : 'bg-light-accent text-medium-gray hover:bg-warm-brown/10'
              }`}
            >
              <Crown className="w-5 h-5" />
              Leaderboard
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {activeTab === 'challenges' ? (
        <>
          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-green-600" />
                Active Challenges
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="overflow-hidden border-2 border-green-200 bg-green-50">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-text-primary mb-2">{challenge.title}</h4>
                            <p className="text-text-secondary mb-3">{challenge.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-green-100 text-green-600 text-sm font-semibold rounded-full">
                                🎯 {challenge.theme}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-semibold">{getTimeRemaining(challenge.endDate)}</span>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-full">
                              Active
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-text-primary">{challenge.participants}</p>
                            <p className="text-sm text-text-secondary">Participants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-text-primary">{challenge.submissions}</p>
                            <p className="text-sm text-text-secondary">Submissions</p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <h5 className="font-semibold text-text-primary mb-2">🏆 Prize</h5>
                          <p className="text-text-secondary">{challenge.prize}</p>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleOpenSubmissionModal(challenge)}
                          className="w-full px-4 py-3 bg-warm-brown text-white rounded-lg font-semibold hover:bg-warm-brown/90 transition-colors cursor-pointer mb-3"
                        >
                          Submit Your Artwork
                        </motion.button>
                        
                        {/* Show Submissions for this Challenge */}
                        {(() => {
                          const challengeSubmissions = submissions.filter(s => s.challengeId === challenge.id);
                          if (challengeSubmissions.length > 0) {
                            return (
                              <div className="mt-4 pt-4 border-t border-green-200">
                                <h6 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Submissions ({challengeSubmissions.length})
                                </h6>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {challengeSubmissions.slice(0, 4).map((sub) => (
                                    <div key={sub.id} className="relative group">
                                      <img
                                        src={sub.imageUrl}
                                        alt={sub.title}
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
                                        <p className="text-white text-xs text-center font-semibold line-clamp-2">{sub.title}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {challengeSubmissions.length > 4 && (
                                    <div className="w-full h-24 bg-green-100 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-semibold text-green-600">
                                        +{challengeSubmissions.length - 4} more
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Submissions Gallery - Full View */}
          {activeChallenges.length > 0 && submissions.filter(s => activeChallenges.some(c => c.id === s.challengeId)).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-warm-brown" />
                Recent Submissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissions
                  .filter(s => activeChallenges.some(c => c.id === s.challengeId))
                  .sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
                    const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
                    return bTime - aTime;
                  })
                  .slice(0, 9)
                  .map((submission) => {
                    const challenge = activeChallenges.find(c => c.id === submission.challengeId);
                    return (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="overflow-hidden">
                          <div className="relative">
                            <img
                              src={submission.imageUrl}
                              alt={submission.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-warm-brown/90 text-white text-xs font-semibold rounded">
                                {challenge?.theme || 'Challenge'}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h5 className="font-bold text-text-primary mb-1 line-clamp-1">{submission.title}</h5>
                            <p className="text-sm text-text-secondary mb-2 line-clamp-2">{submission.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-warm-brown rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {submission.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-text-primary">{submission.userName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-text-secondary">
                                <Star className="w-4 h-4" />
                                <span className="text-xs">{submission.votes || 0}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Upcoming Challenges */}
          {upcomingChallenges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Upcoming Challenges
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="overflow-hidden border-2 border-blue-200 bg-blue-50">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-text-primary mb-2">{challenge.title}</h4>
                            <p className="text-text-secondary mb-3">{challenge.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                                🎯 {challenge.theme}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-600 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-semibold">
                                Starts {formatDate(challenge.startDate)}
                              </span>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                              Upcoming
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <h5 className="font-semibold text-text-primary mb-2">🏆 Prize</h5>
                          <p className="text-text-secondary">{challenge.prize}</p>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleSetReminder(challenge)}
                          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                          Set Reminder
                        </motion.button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Challenges */}
          {endedChallenges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-gray-600" />
                Past Challenges
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {endedChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-text-primary mb-2">{challenge.title}</h4>
                            <p className="text-text-secondary mb-3">{challenge.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
                                🎯 {challenge.theme}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              Ended
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-text-primary">{challenge.participants}</p>
                            <p className="text-sm text-text-secondary">Participants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-text-primary">{challenge.submissions}</p>
                            <p className="text-sm text-text-secondary">Submissions</p>
                          </div>
                        </div>
                        
                        {challenge.winner && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <h5 className="font-semibold text-yellow-800 mb-1">🏆 Winner</h5>
                            <p className="text-yellow-700">{challenge.winner}</p>
                          </div>
                        )}
                        
                        {/* Show Submissions for this Past Challenge */}
                        {(() => {
                          const challengeSubmissions = submissions.filter(s => s.challengeId === challenge.id);
                          if (challengeSubmissions.length > 0) {
                            return (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h6 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Submissions ({challengeSubmissions.length})
                                </h6>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {challengeSubmissions.slice(0, 4).map((sub) => (
                                    <div key={sub.id} className="relative group">
                                      <img
                                        src={sub.imageUrl}
                                        alt={sub.title}
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
                                        <p className="text-white text-xs text-center font-semibold line-clamp-2">{sub.title}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {challengeSubmissions.length > 4 && (
                                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <span className="text-xs font-semibold text-gray-600">
                                        +{challengeSubmissions.length - 4} more
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                              <p className="text-sm text-text-secondary">No submissions yet</p>
                            </div>
                          );
                        })()}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {challenges.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Card>
                <div className="py-8">
                  <Trophy className="w-16 h-16 text-warm-brown mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No challenges yet</h3>
                  <p className="text-text-secondary mb-6">Check back soon for exciting AI art competitions!</p>
                </div>
              </Card>
            </motion.div>
          )}
        </>
      ) : (
        /* Leaderboard Tab */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                Challenge Leaderboard
              </h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-warm-brown border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-warm-brown mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No leaderboard data yet</h3>
                  <p className="text-text-secondary">Submit artwork to challenges to appear on the leaderboard!</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-accent">
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Artist</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Challenges Won</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Total Submissions</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr key={entry.userId} className="border-b border-light-accent/50 hover:bg-light-accent/20">
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
                                  {entry.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                              <span className="font-semibold text-text-primary">{entry.userName}</span>
                          </div>
                        </td>
                          <td className="py-3 px-4 text-text-secondary">{entry.challengesWon}</td>
                          <td className="py-3 px-4 text-text-secondary">{entry.totalSubmissions}</td>
                        <td className="py-3 px-4">
                            <span className="font-semibold text-warm-brown">{entry.pointsEarned}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary">Submit Your Artwork</h3>
                  <p className="text-sm text-text-secondary">Challenge: {selectedChallenge.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setSelectedChallenge(null);
                    setSubmissionData({ title: '', description: '', imageFile: null });
                  }}
                  className="p-2 hover:bg-light-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-medium-gray" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Artwork Title *
                  </label>
                  <input
                    type="text"
                    value={submissionData.title}
                    onChange={(e) => setSubmissionData({ ...submissionData, title: e.target.value })}
                    placeholder="Give your artwork a title"
                    className="w-full px-4 py-2 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Description *
                  </label>
                  <textarea
                    value={submissionData.description}
                    onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                    placeholder="Describe your artwork and how it relates to the challenge theme"
                    rows={4}
                    className="w-full px-4 py-2 border border-light-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-brown/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Upload Image *
                  </label>
                  <div className="border-2 border-dashed border-light-accent rounded-lg p-6 text-center">
                    {submissionData.imageFile ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(submissionData.imageFile)}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-text-secondary">{submissionData.imageFile.name}</p>
                        <button
                          onClick={() => setSubmissionData({ ...submissionData, imageFile: null })}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSubmissionData({ ...submissionData, imageFile: file });
                            }
                          }}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <ImageIcon className="w-12 h-12 text-medium-gray mx-auto" />
                          <p className="text-sm text-text-secondary">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-medium-gray">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSubmissionModal(false);
                      setSelectedChallenge(null);
                      setSubmissionData({ title: '', description: '', imageFile: null });
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitArtwork}
                    disabled={submitting || !submissionData.title || !submissionData.description || !submissionData.imageFile}
                    className="flex-1 px-4 py-3 bg-warm-brown text-white rounded-lg hover:bg-warm-brown/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Submit Artwork
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
