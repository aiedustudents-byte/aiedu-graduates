import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/Card';
import { db, storage } from '../../lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface MoodLog { userId: string; mood: string; createdAt?: any; }
interface JournalEntry { userId: string; text: string; summary?: string; createdAt?: any; }

export default function ManageWellness() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const [videoForm, setVideoForm] = useState<{ title: string; url: string; posterUrl: string; videoFile?: File | null; posterFile?: File | null }>({ title: '', url: '', posterUrl: '', videoFile: null, posterFile: null });
  const [videos, setVideos] = useState<{ id: string; title: string; url: string; poster?: string }[]>([]);

  useEffect(() => { (async () => {
    try {
      const logsRef = collection(db, 'user_mood_logs');
      const logsQ = query(logsRef, orderBy('createdAt', 'desc'), limit(50));
      const logsSnap = await getDocs(logsQ);
      const logs: MoodLog[] = []; logsSnap.forEach(d => logs.push(d.data() as any)); setMoodLogs(logs);

      const jRef = collection(db, 'user_mood_journals');
      const jQ = query(jRef, orderBy('createdAt', 'desc'), limit(50));
      const jSnap = await getDocs(jQ);
      const jEntries: JournalEntry[] = []; jSnap.forEach(d => jEntries.push(d.data() as any)); setJournals(jEntries);

      const upSnap = await getDocs(collection(db, 'userPoints'));
      const map: Record<string, string> = {}; upSnap.forEach(d => { const data:any=d.data(); const name=data.creatorName || data.email?.split('@')[0]; if(name) map[d.id]=name; }); setUserNameMap(map);

      const vRef = collection(db, 'wellness_videos');
      const vSnap = await getDocs(vRef);
      const vList: { id: string; title: string; url: string; poster?: string }[] = []; vSnap.forEach(d => vList.push({ id: d.id, ...(d.data() as any) })); setVideos(vList);
    } finally { setLoading(false); }
  })(); }, []);

  const totalLogs = moodLogs.length; const totalJournals = journals.length; const last7 = moodLogs.slice(0,7);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="premium"><div className="flex items-center justify-between"><div><h1 className="text-4xl font-bold text-warm-brown">🧠 Manage Wellness Corner</h1><p className="text-text-secondary">Review check‑ins, journals and manage short videos.</p></div></div></Card>
      </motion.div>

      {loading ? (<Card><div className="py-12 text-center text-text-secondary">Loading wellness data…</div></Card>) : (<>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-cream-bg border border-light-accent"><div className="text-sm text-text-secondary">Total Mood Check‑ins</div><div className="text-3xl font-bold text-warm-brown">{totalLogs}</div></div>
              <div className="p-4 rounded-xl bg-cream-bg border border-light-accent"><div className="text-sm text-text-secondary">Total Journal Entries</div><div className="text-3xl font-bold text-warm-brown">{totalJournals}</div></div>
              <div className="p-4 rounded-xl bg-cream-bg border border-light-accent"><div className="text-sm text-text-secondary">Last 7 Mood Emojis</div><div className="text-2xl">{last7.map((l,i)=>(<span key={i} className="mr-2">{moodToEmoji(l.mood)}</span>))}</div></div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h2 className="text-xl font-semibold mb-3">Recent Mood Logs</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-light-accent text-left"><th className="py-2 px-2">User</th><th className="py-2 px-2">Mood</th><th className="py-2 px-2">Time</th></tr></thead><tbody>{moodLogs.map((l,idx)=>(<tr key={idx} className="border-b border-light-accent/40"><td className="py-2 px-2 text-text-secondary">{getUserName(l.userId, userNameMap)}</td><td className="py-2 px-2">{moodToEmoji(l.mood)} <span className="ml-1 text-text-secondary">({l.mood})</span></td><td className="py-2 px-2 text-text-secondary">{formatDate(l.createdAt)}</td></tr>))}</tbody></table></div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h2 className="text-xl font-semibold mb-3">Recent Journal Entries</h2>
            <div className="space-y-3">{journals.map((j,idx)=>(<div key={idx} className="rounded-lg p-3 bg-cream-bg border border-light-accent"><div className="text-sm text-text-secondary mb-1">{getUserName(j.userId,userNameMap)} • {formatDate(j.createdAt)}</div><div className="text-dark-primary">{j.text}</div>{j.summary && (<div className="text-sm text-text-secondary mt-1">AI: {j.summary}</div>)}</div>))}</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h2 className="text-xl font-semibold mb-3">Wellness Videos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-cream-bg border border-light-accent">
                <h3 className="font-semibold mb-2">Add New Video</h3>
                <div className="space-y-2">
                  <input value={videoForm.title} onChange={(e)=>setVideoForm(prev=>({...prev,title:e.target.value}))} placeholder="Title" className="w-full px-3 py-2 rounded border border-light-accent"/>
                  <input value={videoForm.url} onChange={(e)=>setVideoForm(prev=>({...prev,url:e.target.value}))} placeholder="Video URL (optional if uploading)" className="w-full px-3 py-2 rounded border border-light-accent"/>
                  <div className="text-sm text-text-secondary">or upload video:</div>
                  <input type="file" accept="video/*" onChange={(e)=>setVideoForm(prev=>({...prev,videoFile:e.target.files?.[0]||null}))}/>
                  <input value={videoForm.posterUrl} onChange={(e)=>setVideoForm(prev=>({...prev,posterUrl:e.target.value}))} placeholder="Poster URL (optional)" className="w-full px-3 py-2 rounded border border-light-accent"/>
                  <div className="text-sm text-text-secondary">or upload poster:</div>
                  <input type="file" accept="image/*" onChange={(e)=>setVideoForm(prev=>({...prev,posterFile:e.target.files?.[0]||null}))}/>
                  <button onClick={()=>saveVideo({ videoForm, setVideoForm, setVideos })} className="px-4 py-2 bg-warm-brown text-white rounded-lg">Save Video</button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-cream-bg border border-light-accent">
                <h3 className="font-semibold mb-2">Existing Videos</h3>
                {videos.length===0 ? (<div className="text-sm text-text-secondary">No videos yet.</div>) : (
                  <div className="space-y-3">{videos.map(v=>(<div key={v.id} className="flex items-center justify-between rounded-lg border border-light-accent p-2"><div className="text-sm"><div className="font-semibold">{v.title}</div><div className="text-text-secondary truncate max-w-[420px]">{v.url}</div></div><div className="flex gap-2"><a href={v.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-light-accent/50 text-dark-primary text-sm">Open</a><button onClick={()=>deleteVideo({ setVideos }, v)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Delete</button></div></div>))}</div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </>)}
    </div>
  );
}

function formatDate(ts: any) { try { const date = ts?.toDate?.() ?? new Date(ts); return new Date(date).toLocaleString(); } catch { return ''; } }
function moodToEmoji(mood?: string) { switch (mood) { case 'joy': return '😄'; case 'calm': return '😊'; case 'neutral': return '😐'; case 'sad': return '😔'; case 'angry': return '😡'; default: return '🙂'; } }
function getUserName(userId: string, map: Record<string,string>) { return map[userId] || userId; }

async function saveVideo(ctx: any) {
  const { videoForm, setVideoForm, setVideos } = ctx; try {
    let url = videoForm.url?.trim(); let poster = videoForm.posterUrl?.trim();
    if (!url && videoForm.videoFile) { const fileRef = ref(storage, `wellness-videos/${Date.now()}-${videoForm.videoFile.name}`); await uploadBytes(fileRef, videoForm.videoFile); url = await getDownloadURL(fileRef); }
    if (!poster && videoForm.posterFile) { const posterRef = ref(storage, `wellness-videos/posters/${Date.now()}-${videoForm.posterFile.name}`); await uploadBytes(posterRef, videoForm.posterFile); poster = await getDownloadURL(posterRef); }
    if (!url) return alert('Provide a Video URL or upload a file.');
    await addDoc(collection(db, 'wellness_videos'), { title: videoForm.title || 'Wellness video', url, poster });
    const vSnap = await getDocs(collection(db, 'wellness_videos')); const list:any[]=[]; vSnap.forEach(d=>list.push({ id:d.id, ...(d.data() as any) })); setVideos(list);
    setVideoForm({ title: '', url: '', posterUrl: '', videoFile: null, posterFile: null });
  } catch { alert('Failed to save video.'); }
}

async function deleteVideo(ctx: any, v: any) {
  const { setVideos } = ctx; try { await deleteDoc(doc(db, 'wellness_videos', v.id)); try { if (v.url?.includes('/o/')) { const path = decodeURIComponent(v.url.split('/o/')[1].split('?')[0]); await deleteObject(ref(storage, path)); } if (v.poster?.includes('/o/')) { const p = decodeURIComponent(v.poster.split('/o/')[1].split('?')[0]); await deleteObject(ref(storage, p)); } } catch {}
    const vSnap = await getDocs(collection(db, 'wellness_videos')); const list:any[]=[]; vSnap.forEach(d=>list.push({ id:d.id, ...(d.data() as any) })); setVideos(list);
  } catch { alert('Failed to delete video.'); }
}


