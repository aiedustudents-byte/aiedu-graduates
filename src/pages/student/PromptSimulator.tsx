import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, TrendingUp, Target, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface FeedbackScore {
  clarity: number;
  conciseness: number;
  creativity: number;
  accuracy: number;
}

export default function PromptSimulator() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [task, setTask] = useState('');
  const [selectedTaskObj, setSelectedTaskObj] = useState<any>(null);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [prompt, setPrompt] = useState('');
  const [modelOutput, setModelOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackScore | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState(0);
  const [xpPoints, setXpPoints] = useState(0);
  const [isAnimatingXP, setIsAnimatingXP] = useState(false);

  const models = [
    { id: 'gpt-3.5', name: 'GPT-3.5', color: 'text-green-500' },
    { id: 'gpt-4', name: 'GPT-4', color: 'text-blue-500' },
    { id: 'claude-3', name: 'Claude 3', color: 'text-purple-500' },
  ];

  // Fetch tasks from Firebase
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const tasksQuery = query(collection(db, 'simulator_tasks'), orderBy('created_at', 'desc'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableTasks(tasksData);
      
      // Set first task as default if tasks exist
      if (tasksData.length > 0 && !task) {
        setTask(tasksData[0].title);
        setSelectedTaskObj(tasksData[0]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Set default task if Firebase fails
      if (!task) {
        setTask('Write a professional email to request a meeting');
      }
    }
  }

  // Clear output when task changes
  useEffect(() => {
    setModelOutput('');
    setFeedback(null);
    setSuggestions([]);
    setPrompt('');
  }, [task]);

  const handleRunPrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first!');
      return;
    }

    setIsRunning(true);
    setModelOutput('');
    setFeedback(null);
    setSuggestions([]);

    // Simulate API call with streaming effect
    await simulateStreamingResponse();

    // Generate feedback
    const mockFeedback: FeedbackScore = {
      clarity: Math.floor(Math.random() * 30) + 70,
      conciseness: Math.floor(Math.random() * 30) + 70,
      creativity: Math.floor(Math.random() * 30) + 70,
      accuracy: Math.floor(Math.random() * 30) + 70,
    };
    setFeedback(mockFeedback);

    // Generate task-specific suggestions
    let mockSuggestions: string[] = [];
    
    // Check if task has an image - provide image analysis suggestions
    if (selectedTaskObj?.image_data) {
      mockSuggestions = [
        'Specify which aspects of the image to analyze (composition, colors, subjects, mood, symbolism)',
        'Request detailed descriptions with specific visual elements',
        'Ask for interpretations including context, meaning, or technical analysis',
      ];
    } else if (task.toLowerCase().includes('email') || task.toLowerCase().includes('professional')) {
      mockSuggestions = [
        'Specify the relationship with the recipient (colleague, client, etc.)',
        'Add the meeting purpose and agenda details',
        'Include your availability and preferred meeting format',
      ];
    } else if (task.toLowerCase().includes('marketing') || task.toLowerCase().includes('tagline')) {
      mockSuggestions = [
        'Define the unique value proposition of your product',
        'Specify the target audience and their pain points',
        'Request different styles (emotional, data-driven, playful, etc.)',
      ];
    } else if (task.toLowerCase().includes('explain') || task.toLowerCase().includes('complex')) {
      mockSuggestions = [
        'Specify what age or knowledge level to target',
        'Request specific examples or analogies to include',
        'Ask for interactive elements or visuals',
      ];
    } else if (task.toLowerCase().includes('summarize') || task.toLowerCase().includes('paragraph')) {
      mockSuggestions = [
        'Specify the desired length (word count or percentage of original)',
        'Indicate which key points to prioritize',
        'Request the tone (formal, casual, technical, etc.)',
      ];
    } else {
      mockSuggestions = [
        'Be more specific about the desired outcome',
        'Add context about your target audience or use case',
        'Specify the format, tone, and length you want',
      ];
    }
    setSuggestions(mockSuggestions);

    // Calculate token usage
    const tokens = prompt.length / 4; // Simple token estimation
    setTokenUsage(Math.floor(tokens));

    // Award XP
    const earnedXP = Math.floor(Math.random() * 50) + 50;
    setIsAnimatingXP(true);
    setTimeout(() => {
      setXpPoints(prev => prev + earnedXP);
      setIsAnimatingXP(false);
    }, 500);

    setIsRunning(false);
  };

  const simulateStreamingResponse = async () => {
    // Generate a generic contextual response based on the task and user's prompt
    let response = '';
    
    const taskLower = task.toLowerCase();
    
    // Check if task has an image - generate image analysis response
    if (selectedTaskObj?.image_data) {
      const imageAnalysisResponses = [
        "Image Analysis:\n\nThe image appears to contain [visual elements]. Key observations include:\n\n1. [Primary subject/theme]\n2. [Composition/structure]\n3. [Color scheme/mood]\n4. [Notable details or elements]\n\nBased on your prompt requesting description, this analysis demonstrates structured visual analysis techniques.\n\n💡 Tip: Good prompts for image analysis include specific aspects like composition, subjects, mood, context, and potential interpretations.",
        "Visual Description:\n\nThe image depicts [scene/subject]. Important features visible:\n\n• Subject: [main focus]\n• Setting: [environment/context]\n• Style: [artistic/technical approach]\n• Mood: [emotional tone]\n\nYour prompt successfully guided this structured visual analysis.\n\nBest practices: Be specific about what aspects to analyze - composition, colors, subjects, symbolism, or context.",
        "Image Content Analysis:\n\nUpon careful examination:\n\n📐 Composition: [structural elements]\n🎨 Visual Elements: [colors, shapes, patterns]\n🎭 Subject Matter: [what's depicted]\n💡 Interpretation: [meaning or purpose]\n\nThe analysis follows your prompt's instructions for detailed visual description.\n\nPrompt engineering tip: Specify whether you want artistic critique, technical analysis, or narrative interpretation."
      ];
      response = imageAnalysisResponses[Math.floor(Math.random() * imageAnalysisResponses.length)];
    } else if (taskLower.includes('email') || taskLower.includes('professional')) {
      const emailResponses = [
        "Subject: Meeting Request - [Your Topic]\n\nDear [Name],\n\nI hope this message finds you well. I am writing to request a meeting to discuss [brief purpose]. I believe this conversation would be valuable for [specific reason].\n\nI am available at your convenience and would appreciate the opportunity to connect.\n\nBest regards,\n[Your Name]",
        "Dear [Name],\n\nThank you for your time. I would like to schedule a meeting to discuss [topic]. Please let me know your availability for the coming week.\n\nLooking forward to hearing from you.\n\nBest regards"
      ];
      response = emailResponses[Math.floor(Math.random() * emailResponses.length)];
    } else if (taskLower.includes('marketing') || taskLower.includes('tagline')) {
      const taglineResponses = [
        "Here are 5 powerful marketing taglines:\n\n1. 'Innovate. Elevate. Dominate.' - Bold and action-oriented\n2. 'Where Ideas Meet Impact' - Professional and inspiring\n3. 'Transform Tomorrow Today' - Progressive and forward-thinking\n4. 'Built for the Future' - Simple and trustworthy\n5. 'Your Vision. Our Innovation.' - Partnership-focused",
        "Marketing Taglines:\n\n• 'Experience the Difference'\n• 'Beyond Boundaries'\n• 'Precision Meets Performance'\n• 'Redefining Excellence'\n• 'Your Success, Our Mission'"
      ];
      response = taglineResponses[Math.floor(Math.random() * taglineResponses.length)];
    } else if (taskLower.includes('explain') || taskLower.includes('complex')) {
      const explanationResponses = [
        "Imagine [complex topic] is like [simple analogy]. Just like how [analogy example], [topic] works by [simple explanation]. The main idea is that [key point], and it's important because [why it matters]. Think of it like when you were 10 - [child-friendly example].",
        "Let me break this down simply: [Topic] is basically [simple definition]. Think of it like [everyday example]. What makes it special is that [key feature], which is kind of like [relatable comparison]. So in simple terms, [summary in plain language]."
      ];
      response = explanationResponses[Math.floor(Math.random() * explanationResponses.length)];
    } else if (taskLower.includes('summarize') || taskLower.includes('paragraph')) {
      const summaryResponses = [
        "AI is reshaping industries by revolutionizing how we work, communicate, and solve problems across healthcare, autonomous vehicles, and other sectors.",
        "Artificial Intelligence transforms work and communication, advancing diagnostics in healthcare and autonomous vehicle technology."
      ];
      response = summaryResponses[Math.floor(Math.random() * summaryResponses.length)];
    } else {
      // Generic response that works for any task
      response = `Based on your task: "${task}", here's a generated response:\n\n${prompt ? `Your prompt: "${prompt}"\n\n` : ''}[Sample output based on your task. This demonstrates how AI models can generate relevant content based on clear instructions. For optimal results, provide specific context, desired format, and target audience in your prompts.]`;
    }

    // Simulate streaming effect
    let currentOutput = '';
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      currentOutput += response[i];
      setModelOutput(currentOutput);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 text-gray-900"
    >
      {/* Subtle Animation on Load */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-[#780606]/5 blur-3xl"
      />

      <div className="relative z-10 p-8 space-y-6">
        {/* Back Button */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -5 }}
          onClick={() => navigate('/prompt-engineering')}
          className="flex items-center gap-2 text-gray-700 hover:text-[#780606] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Prompt Engineering</span>
        </motion.button>

        {/* Top Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#780606] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Prompt Engineering Simulator</h1>
                <p className="text-gray-900">Master AI communication skills through hands-on practice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#780606]"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(120, 6, 6, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRunPrompt}
                disabled={isRunning}
                className="bg-[#780606] hover:bg-[#a91a1a] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg"
              >
                <Play className="w-5 h-5" />
                {isRunning ? 'Running...' : 'Run Prompt'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Task */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#780606] rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Task</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[150px]">
                {selectedTaskObj?.image_data ? (
                  <div className="space-y-3">
                    <img 
                      src={selectedTaskObj.image_data} 
                      alt="Task" 
                      className="w-full h-48 object-contain rounded-lg bg-white border border-gray-200"
                    />
                    <p className="text-gray-700 leading-relaxed">
                      <span className="font-semibold">Task:</span> {task}
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      💡 Write a detailed prompt to describe this image and analyze its contents
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{task}</p>
                )}
              </div>
              
              {/* Sample Tasks */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Available Tasks:</p>
                {availableTasks.length > 0 ? (
                  availableTasks.map((taskItem) => (
                    <button
                      key={taskItem.id}
                      onClick={() => {
                        setTask(taskItem.title);
                        setSelectedTaskObj(taskItem);
                      }}
                      className="text-sm text-gray-700 hover:text-[#780606] bg-gray-50 hover:bg-gray-100 rounded-lg p-2 w-full text-left transition-colors border border-gray-200"
                    >
                      {taskItem.emoji} {taskItem.title}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No tasks available. Admin will add tasks soon.</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Center Panel - Prompt Editor */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#780606] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Prompt</h2>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write your prompt here..."
              className="w-full h-[300px] bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-[#780606] resize-none custom-scrollbar"
            />
            <p className="text-xs text-gray-900 mt-2">Enter your prompt and click "Run Prompt" to see the results</p>
          </motion.div>

          {/* Right Panel - Output & Feedback */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Model Output */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#780606] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Model Output</h2>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[150px] max-h-[150px] overflow-y-auto custom-scrollbar">
                {isRunning && !modelOutput ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="animate-spin w-4 h-4 border-2 border-[#780606] border-t-transparent rounded-full"></div>
                    <span>Generating response...</span>
                  </div>
                ) : modelOutput ? (
                  <p className="text-gray-700 leading-relaxed">{modelOutput}</p>
                ) : (
                  <p className="text-gray-400 italic">Output will appear here...</p>
                )}
              </div>
            </div>

            {/* Feedback Scores */}
            {feedback && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#780606] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Feedback Scores</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(feedback).map(([key, score]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 capitalize">{key}</span>
                        <span className="text-gray-900 font-semibold">{score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8 }}
                          className="bg-[#780606] h-2 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Suggested Improvements</h3>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-[#780606]">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Bottom Section - Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-gray-600 text-sm">Token Usage</p>
                <p className="text-2xl font-bold text-gray-900">{tokenUsage} tokens</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">XP Points</p>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {isAnimatingXP && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="text-[#780606] font-bold"
                      >
                        +XP!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.p
                    key={xpPoints}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {xpPoints}
                  </motion.p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPrompt('');
                setModelOutput('');
                setFeedback(null);
                setSuggestions([]);
                setTokenUsage(0);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
