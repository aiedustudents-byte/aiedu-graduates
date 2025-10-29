import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Code, BookOpen, Zap, Play } from 'lucide-react';
import Card from '../../components/Card';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { highlightQuestionsInHTML } from '../../utils/questionHighlighter';

export default function VibeCoding() {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);

  // Declare YouTube API functions globally
  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Global function for YouTube API ready
    (window as any).onYouTubeIframeAPIReady = () => {
      if (content?.video_url && playerDivRef.current) {
        const videoId = extractVideoId(content.video_url);
        if (videoId) {
          playerRef.current = new (window as any).YT.Player(playerDivRef.current, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              'rel': 0,
              'modestbranding': 1,
              'controls': 1,
              'showinfo': 0,
              'fs': 1,
              'cc_load_policy': 0,
              'iv_load_policy': 3,
              'autohide': 1,
              'disablekb': 0,
              'enablejsapi': 1,
              'origin': window.location.origin,
              'loop': 1,
              'playlist': videoId
            },
            events: {
              'onStateChange': onPlayerStateChange
            }
          });
        }
      }
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [content?.video_url]);

  function onPlayerStateChange(event: any) {
    // Handle video end state to prevent suggested videos
    if (event.data === (window as any).YT.PlayerState.ENDED) {
      // Video has ended - ensure no suggested videos show
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    }
  }

  function extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

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
      } else {
        // Set default content if no content exists
        setContent({
          title: 'Vibe Coding',
          introduction: 'Content will be added by admin soon...',
        });
      }
    } catch (error) {
      console.error('Error fetching Vibe Coding content:', error);
      // Set default content on error
      setContent({
        title: 'Vibe Coding',
        introduction: 'Content will be added by admin soon...',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to convert URLs to clickable links
  function convertUrlsToLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-warm-brown hover:text-warm-brown/80 underline">$1</a>');
  }

  if (isLoading) {
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
                <div className="h-8 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </Card>
        </motion.div>
        
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Title Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card variant="premium" className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-warm-brown mb-3">
                Transform Ideas into Impact — That's the Vibe of Coding!
              </h1>
              <p className="text-text-secondary text-lg mb-4">Code with style, creativity, and modern development practices</p>
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-warm-brown" />
                  <span>Modern Coding</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-success" />
                  <span>Best Practices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span>Creative Development</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Code className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Introduction Section */}
      {content?.introduction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-2xl font-semibold text-warm-brown mb-4">Introduction</h2>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              <div 
                className="prose max-w-none text-text-primary leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: highlightQuestionsInHTML(convertUrlsToLinks(content.introduction.replace(/\n/g, '<br>'))) 
                }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Video Section */}
      {content?.video_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-6 h-6 text-warm-brown" />
              <h2 className="text-2xl font-semibold text-text-primary">Learning Video</h2>
            </div>
            <div className="aspect-video relative overflow-hidden rounded-lg">
              {content?.video_url && (content.video_url.includes('youtube.com') || content.video_url.includes('youtu.be')) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${extractVideoId(content.video_url)}?rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1&disablekb=0&enablejsapi=1&origin=${window.location.origin}&loop=1&playlist=${extractVideoId(content.video_url)}`}
                  title="Vibe Coding Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              ) : content?.video_url ? (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Video format not supported for embedding</p>
                    <a 
                      href={content.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-warm-brown hover:text-warm-brown/80 mt-2 inline-block"
                    >
                      Open video in new tab →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No video available</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
