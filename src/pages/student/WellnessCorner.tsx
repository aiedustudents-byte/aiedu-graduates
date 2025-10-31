import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { addDoc, collection, doc, getDocs, increment, limit, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useUser } from '../../contexts/UserContext';

type MoodType = 'joy' | 'calm' | 'neutral' | 'sad' | 'angry';

interface MoodLog {
  userId: string;
  mood: MoodType;
  createdAt: Date;
}

const MOOD_POINTS = { checkIn: 1, activity: 5, streak7: 20 };

const moodEmojis: { key: MoodType; label: string; emoji: string }[] = [
  { key: 'joy', label: 'Happy', emoji: '😄' },
  { key: 'calm', label: 'Calm', emoji: '😊' },
  { key: 'neutral', label: 'Neutral', emoji: '😐' },
  { key: 'sad', label: 'Low', emoji: '😔' },
  { key: 'angry', label: 'Tense', emoji: '😡' },
];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function WellnessCorner() {
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayMood, setTodayMood] = useState<MoodType | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [journalText, setJournalText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [videos, setVideos] = useState<{ title: string; url: string; poster?: string }[]>([]);

  // Quiz state
  const baseBank = useMemo(
    () => [
      { q: 'Which word best matches the feeling of calm happiness?', options: ['Fury', 'Content', 'Anxious', 'Gloomy'], a: 1 },
      { q: 'If you feel “overwhelmed”, what helps first?', options: ['Breathing slowly', 'Shouting', 'Ignoring it', 'Blaming others'], a: 0 },
      { q: '“Gratitude” is mostly about…', options: ['Being thankful', 'Being angry', 'Being confused', 'Being bored'], a: 0 },
      { q: '“Empathy” means…', options: ['Understanding others’ feelings', 'Winning arguments', 'Hiding emotions', 'Forgetting problems'], a: 0 },
      { q: 'Best quick reset when feeling tense?', options: ['3‑deep breaths', 'Scroll endlessly', 'Skip sleep', 'Overeat'], a: 0 },
      { q: 'When a friend is sad, a kind reply is…', options: ['“I’m here for you.”', '“It’s your fault.”', '“Whatever.”', '“Why me?”'], a: 0 },
      { q: '“Frustrated” is closest to…', options: ['Irritated', 'Excited', 'Grateful', 'Peaceful'], a: 0 },
    ],
    []
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizBank, setQuizBank] = useState<typeof baseBank>([] as any);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const isQuizDone = quizIndex >= quizBank.length;

  // Game state (two types: guess, memory)
  const [showGame, setShowGame] = useState(false);
  const [gameType, setGameType] = useState<'guess' | 'memory'>('guess');
  const [gameRound, setGameRound] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<MoodType>('joy');
  const [memSequence, setMemSequence] = useState<MoodType[]>([]);
  const [memInputIndex, setMemInputIndex] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [sequenceAnimKey, setSequenceAnimKey] = useState(0);
  const [inputFeedback, setInputFeedback] = useState<'correct' | 'wrong' | null>(null);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, loading } = useUser();

  const vibeScore = useMemo(() => {
    if (moodHistory.length === 0) return 0;
    const score = moodHistory.reduce((acc, m) => {
      switch (m.mood) {
        case 'joy': return acc + 1;
        case 'calm': return acc + 0.8;
        case 'neutral': return acc + 0.5;
        case 'sad': return acc + 0.2;
        case 'angry': return acc + 0.1;
        default: return acc;
      }
    }, 0);
    return Math.round((score / moodHistory.length) * 100);
  }, [moodHistory]);

  // load logs
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setTodayMood(null);
      setMoodHistory([]);
      return;
    }
    (async () => {
      const logsRef = collection(db, 'user_mood_logs');
      const q = query(logsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(60));
      const snap = await getDocs(q);
      const logs: MoodLog[] = [];
      const today = startOfDay(new Date());
      snap.forEach((d) => {
        const data = d.data() as any;
        const created = data.createdAt?.toDate?.() ?? new Date(data.createdAt);
        logs.push({ userId: data.userId, mood: data.mood, createdAt: created });
        if (startOfDay(created).getTime() === today.getTime()) setTodayMood(data.mood);
      });
      setMoodHistory(logs.reverse());
    })();
  }, [user, loading]);

  // load videos
  useEffect(() => {
    (async () => {
      try {
        const vRef = collection(db, 'wellness_videos');
        const vQ = query(vRef, limit(9));
        const vSnap = await getDocs(vQ);
        const list: { title: string; url: string; poster?: string }[] = [];
        vSnap.forEach((d) => { const data: any = d.data(); if (data?.url) list.push({ title: data.title || 'Wellness video', url: data.url, poster: data.poster }); });
        setVideos(list);
      } catch { setVideos([]); }
    })();
  }, []);

  async function awardPoints(points: number) {
    if (!user) return;
    try {
      const ref = doc(db, 'userPoints', user.uid);
      await updateDoc(ref, { totalPoints: increment(points), weeklyPoints: increment(points) }).catch(async () => {
        await updateDoc(ref, { totalPoints: points, weeklyPoints: points });
      });
    } catch {}
  }

  async function handleMoodSelect(mood: MoodType) {
    if (!user) {
      alert('Please sign in to log your mood.');
      return;
    }
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      await addDoc(collection(db, 'user_mood_logs'), { userId: user.uid, mood, createdAt: Timestamp.fromDate(now) });
      setTodayMood(mood);
      setMoodHistory((prev) => [...prev, { userId: user.uid, mood, createdAt: now }]);
      await awardPoints(MOOD_POINTS.checkIn);
    } catch (error) {
      console.error('Error saving mood check-in:', error);
      alert('Could not record your mood. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleSummarize() {
    setIsSummarizing(true);
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setAiSummary('AI summarizer not configured. Your note has been saved.');
      } else {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const res = await model.generateContent(`Summarize this in one friendly line and infer mood (joy/calm/neutral/sad/angry):\n\n${journalText}`);
        setAiSummary(res.response.text());
      }
      if (user) {
        await addDoc(collection(db, 'user_mood_journals'), { userId: user.uid, text: journalText, summary: aiSummary, createdAt: Timestamp.fromDate(new Date()) });
        await awardPoints(MOOD_POINTS.activity);
      }
      setJournalText('');
    } catch { setAiSummary('Could not summarize. Saved your entry safely.'); } finally { setIsSummarizing(false); }
  }

  // Quiz handlers
  function submitQuizChoice(i: number) { if (!isQuizDone && i === quizBank[quizIndex].a) setQuizScore((s) => s + 1); setQuizIndex((n) => n + 1); }
  async function endQuiz() { await awardPoints(MOOD_POINTS.activity); setShowQuiz(false); setQuizIndex(0); setQuizScore(0); }

  // Game: guess
  useEffect(() => { if (!showGame || gameType !== 'guess') return; const keys = moodEmojis.map(m => m.key); setCurrentTarget(keys[Math.floor(Math.random()*keys.length)] as MoodType); }, [showGame, gameRound, gameType]);
  function guessMood(m: MoodType) { if (!showGame || gameType!=='guess') return; if (m===currentTarget) setGameScore(s=>s+1); setGameRound(r=>r+1); }

  // Game: memory
  const previewSequence = (length: number) => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
    const duration = 3000 + Math.max(0, length - 1) * 500;
    setIsShowingSequence(true);
    setSequenceAnimKey((k) => k + 1);
    setInputFeedback(null);
    sequenceTimeoutRef.current = setTimeout(() => {
      setIsShowingSequence(false);
      sequenceTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => () => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
  }, []);

  function startMemoryGame() {
    const keys = moodEmojis.map((m) => m.key);
    const first = keys[Math.floor(Math.random() * keys.length)] as MoodType;
    setMemSequence([first]);
    setMemInputIndex(0);
    previewSequence(1);
  }

  function extendSequence() {
    const keys = moodEmojis.map((m) => m.key);
    const next = keys[Math.floor(Math.random() * keys.length)] as MoodType;
    const seq = [...memSequence, next];
    setMemSequence(seq);
    setMemInputIndex(0);
    previewSequence(seq.length);
  }

  function handleMemoryClick(m: MoodType) {
    if (isShowingSequence || !showGame || gameType !== 'memory' || memSequence.length === 0) return;

    const expected = memSequence[memInputIndex];
    const isCorrect = m === expected;
    setInputFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      if (memInputIndex + 1 === memSequence.length) {
        setGameScore((s) => s + 1);
        const handleNext = () => {
          if (memSequence.length >= 4) {
            endGame(true);
          } else {
            extendSequence();
          }
        };
        setTimeout(handleNext, 1200);
      } else {
        setMemInputIndex((i) => i + 1);
      }
    } else {
      setMemInputIndex(0);
      setTimeout(() => {
        previewSequence(memSequence.length);
      }, 800);
    }
  }

  async function endGame(addPoints = true) {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    setIsShowingSequence(false);
    setInputFeedback(null);
    if (addPoints) {
      await awardPoints(MOOD_POINTS.activity);
    }
    setShowGame(false);
    setGameRound(0);
    setGameScore(0);
    setMemSequence([]);
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between"><div className="flex-1"><h1 className="text-4xl font-bold text-warm-brown mb-1">🧠 Emotional Wellness Corner</h1><p className="text-text-secondary text-lg">A calm, playful space to build self‑awareness and emotional strength.</p></div></div>
        </Card>
      </motion.div>

      {/* Mood Check-In */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-semibold text-dark-primary">Daily Mood Check‑In</h2>{todayMood ? (<span className="text-sm text-medium-gray">Checked in today: {moodEmojis.find(m=>m.key===todayMood)?.emoji}</span>) : (<span className="text-sm text-medium-gray">No check‑in yet</span>)}</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{moodEmojis.map(m => (
            <button
              key={m.key}
              type="button"
              disabled={!!todayMood || checkingIn || !user || loading}
              onClick={() => handleMoodSelect(m.key)}
              className={`p-4 rounded-xl border border-light-accent bg-cream-bg transition-all flex flex-col items-center gap-2 ${todayMood === m.key ? 'ring-2 ring-warm-brown' : ''} ${(!user || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-light-accent/30'}`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-sm text-text-secondary">{m.label}</span>
            </button>
          ))}</div>
          {!loading && !user && (
            <p className="text-xs text-text-secondary mt-2">Sign in to track your mood and earn wellness points.</p>
          )}
        </Card>
      </motion.div>

      {/* Activities */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <h2 className="text-2xl font-semibold text-dark-primary mb-4">Gamified Activities</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-light-accent bg-cream-bg"><h3 className="font-semibold mb-2">Match Your Mood Quiz</h3><p className="text-sm text-text-secondary mb-3">Learn emotional vocabulary with a quick 60‑sec quiz.</p><button type="button" className="px-4 py-2 bg-warm-brown text-white rounded-lg" onClick={()=>{const shuffled=[...baseBank].sort(()=>Math.random()-0.5); setQuizBank(shuffled.slice(0,5)); setShowQuiz(true);}}>Start Quiz (+5)</button></div>
            <div className="p-4 rounded-xl border border-light-accent bg-cream-bg"><h3 className="font-semibold mb-2">Play a Mini‑Game</h3><p className="text-sm text-text-secondary mb-3">Random: Guess the Expression or Mood Memory.</p><button type="button" className="px-4 py-2 bg-warm-brown text-white rounded-lg" onClick={()=>{const g:(typeof gameType)[]=['guess','memory']; const pick=g[Math.floor(Math.random()*g.length)]; setGameType(pick); setShowGame(true); if(pick==='memory'){startMemoryGame();}}}>Play Now (+5)</button></div>
            <div className="p-4 rounded-xl border border-light-accent bg-cream-bg"><h3 className="font-semibold mb-2">Mood Journal Quest</h3><p className="text-sm text-text-secondary mb-3">Write one line about your day. Optionally, let AI reflect it.</p><textarea value={journalText} onChange={(e)=>setJournalText(e.target.value)} placeholder="Tell me about your day in one line…" className="w-full p-3 rounded-lg border border-light-accent bg-white mb-2" rows={3}/><div className="flex gap-2"><button disabled={!journalText||isSummarizing} className="px-4 py-2 bg-warm-brown text-white rounded-lg" onClick={handleSummarize}>{isSummarizing?'Thinking…':'Save & Reflect'}</button>{aiSummary && <span className="text-sm text-text-secondary self-center">{aiSummary}</span>}</div></div>
          </div>
        </Card>
      </motion.div>

      {/* Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <h2 className="text-2xl font-semibold text-dark-primary mb-4">Mood Insights</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-2 p-4 rounded-xl border border-light-accent bg-cream-bg"><h3 className="font-semibold mb-2">Last Check‑ins</h3><div className="flex flex-wrap gap-2">{moodHistory.slice(-14).map((m,idx)=>(<div key={idx} className="px-3 py-2 bg-light-accent/30 rounded-full text-sm">{new Date(m.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})} • {moodEmojis.find(x=>x.key===m.mood)?.emoji}</div>))}</div></div>
            <div className="p-4 rounded-xl border border-light-accent bg-cream-bg"><h3 className="font-semibold mb-2">Vibe Score</h3><div className="text-5xl font-bold text-warm-brown mb-2">{vibeScore}</div><p className="text-sm text-text-secondary">You’ve stayed {vibeScore}% positive lately — keep shining!</p></div>
          </div>
        </Card>
      </motion.div>

      {/* Wellness videos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <h2 className="text-2xl font-semibold text-dark-primary mb-4">Daily Wellness Scroll</h2>
          {videos.length===0 ? (
            <div className="p-4 rounded-xl border border-light-accent bg-cream-bg text-sm text-text-secondary">No wellness videos yet. Admin can add them in Admin → Manage Wellness Corner.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">{videos.map((v,idx)=>(<div key={idx} className="rounded-xl overflow-hidden border border-light-accent bg-black aspect-[9/16]"><video className="w-full h-full object-cover" src={v.url} poster={v.poster} muted playsInline loop autoPlay controls/><div className="p-2 text-center text-sm text-white/90 bg-black/50 -mt-10">{v.title}</div></div>))}</div>
          )}
        </Card>
      </motion.div>

      {/* Quiz modal */}
      {showQuiz && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="relative max-w-xl w-full rounded-xl bg-white shadow-xl p-6"><button type="button" onClick={()=>setShowQuiz(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-light-accent/60 hover:bg-light-accent text-dark-primary flex items-center justify-center" aria-label="Close quiz">×</button>{!isQuizDone ? (<><h3 className="text-lg font-semibold mb-3">Question {quizIndex+1} / {quizBank.length}</h3><p className="mb-4 text-dark-primary">{quizBank[quizIndex].q}</p><div className="space-y-2">{quizBank[quizIndex].options.map((opt,i)=>(<button key={i} type="button" onClick={()=>submitQuizChoice(i)} className="w-full text-left px-4 py-2 rounded-lg border border-light-accent hover:bg-light-accent/20">{opt}</button>))}</div><div className="mt-4 text-sm text-text-secondary">Score: {quizScore}</div></>) : (<div className="text-center"><h3 className="text-xl font-bold text-warm-brown mb-2">Great job!</h3><p className="mb-4">You scored {quizScore}/{quizBank.length}. +5 points added.</p><button type="button" onClick={endQuiz} className="px-4 py-2 bg-warm-brown text-white rounded-lg">Close</button></div>)}</div></div>)}

      {/* Game modal */}
      {showGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full rounded-xl bg-white shadow-xl p-6">
            <button
              type="button"
              onClick={() => setShowGame(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-light-accent/60 hover:bg-light-accent text-dark-primary flex items-center justify-center"
              aria-label="Close game"
            >
              ×
            </button>
            {gameType === 'guess' ? (
              <>
                <h3 className="text-lg font-semibold mb-3">Guess the Expression</h3>
                <div className="text-7xl text-center mb-4">{moodEmojis.find(m => m.key === currentTarget)?.emoji}</div>
                <p className="text-center text-sm text-text-secondary mb-4">Round {gameRound + 1} • Score {gameScore}</p>
                <div className="grid grid-cols-2 gap-2">
                  {moodEmojis.map(m => (
                    <button key={m.key} type="button" onClick={() => guessMood(m.key)} className="px-4 py-2 rounded-lg border border-light-accent hover:bg-light-accent/20">
                      {m.label}
                    </button>
                  ))}
                </div>
                {gameRound >= 5 && (
                  <div className="text-center mt-4">
                    <p className="mb-2">Nice! +5 points added.</p>
                    <button type="button" onClick={() => endGame(true)} className="px-4 py-2 bg-warm-brown text-white rounded-lg">
                      Close
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">Mood Memory</h3>
                <p className="text-center text-sm text-text-secondary mb-2">Watch the sequence, then repeat it.</p>
                <div className="flex items-center justify-center gap-2 my-4 h-20">
                  <AnimatePresence mode="wait">
                        {isShowingSequence ? (
                      <motion.div
                        key={`sequence-${sequenceAnimKey}`}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.4 }}
                      >
                        {memSequence.map((m, i) => (
                          <motion.div
                            key={`${sequenceAnimKey}-${i}`}
                            className="text-4xl"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                          >
                            {moodEmojis.find(x => x.key === m)?.emoji}
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`placeholders-${memSequence.length}-${inputFeedback}`}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {memSequence.map((_, i) => (
                          <span
                            key={i}
                            className={`text-4xl transition-colors duration-300 ${
                              inputFeedback === 'wrong' && i === memInputIndex
                                ? 'text-red-500'
                                : inputFeedback === 'correct' && i < memInputIndex
                                ? 'text-green-500'
                                : 'text-medium-gray'
                            }`}
                          >
                            {inputFeedback === 'correct' && i < memInputIndex
                              ? moodEmojis.find(x => x.key === memSequence[i])?.emoji
                              : '?'}
                          </span>
                        ))}
                        {memSequence.length === 0 && <span className="text-sm text-text-secondary">Sequence ready!</span>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-center text-sm text-text-secondary mb-4">Score {gameScore}</p>
                <div className="grid grid-cols-2 gap-2">
                  {moodEmojis.map(m => (
                    <button key={m.key} type="button" onClick={() => handleMemoryClick(m.key)} className="px-4 py-2 rounded-lg border border-light-accent hover:bg-light-accent/20">
                      {m.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


