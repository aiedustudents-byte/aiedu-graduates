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

  const clampScore = (val: number) => Math.max(0, Math.min(100, Math.round(val)));

  const analyzePrompt = (rawPrompt: string) => {
    const text = rawPrompt.trim();
    const lower = text.toLowerCase();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const uniqueKeywords = new Set((lower.match(/\b[a-z]{5,}\b/g) || []).filter(w => !['please','write','create','generate','make','help','give','need','want','provide','the','that','with','this','about','for','from','into','using','like','such','very','your','their','with'].includes(w))).size;
    const numbers = text.match(/\d+/g) || [];
    const adjectives = text.match(/\b(creative|innovative|engaging|vivid|specific|detailed|immersive|inspiring|playful|data-driven|tactical|strategic|emotional|human|empathetic|visual|compelling|memorable|actionable|comprehensive|step-by-step|practical|imaginative|bold|fresh|original)\b/gi) || [];

    const hasPurpose = /(\bhelp|\bcreate|\bwrite|\bdesign|\bbuild|\bdevelop|\bproduce|\bgenerate|\bcompose|\bdraft|\bexplain|\bsummarize|\bplan|\boutline|\bbrainstorm|objective|goal|purpose|achieve|in order to|so that)/i.test(lower);
    const hasAudience = /(audience|customers?|clients?|students?|users?|children|kids|executives?|managers?|leaders?|developers?|designers?|teachers?|patients?|parents?|stakeholders?)/i.test(lower);
    const hasTone = /(tone|style|formal|casual|friendly|professional|playful|academic|persuasive|empathetic|confident|neutral|conversational|inspirational|humorous)/i.test(lower);
    const hasFormat = /(list|bullet|outline|steps|table|plan|script|story|email|summary|report|proposal|strategy|presentation|worksheet|lesson|curriculum|tweet|thread|poem|code|pseudocode|scenario|framework|canvas)/i.test(lower) || Boolean(selectedTaskObj?.output_format);
    const hasConstraints = /(\b\d+\s*(words|sentences|paragraphs|pages|minutes|slides|ideas|options|examples|points|steps)|within\s+\d+|deadline|timeframe|limit)/i.test(lower);
    const hasExamples = /(include|provide|give|such as|for example|e\.g\.|case study|sample)/i.test(lower);
    const hasContext = hasAudience || /(background|context|currently|right now|regarding|related to|based on|about)/i.test(lower) || Boolean(task);

    let clarityScore = 30;
    clarityScore += hasPurpose ? 25 : -15;
    clarityScore += hasAudience ? 10 : -5;
    clarityScore += hasContext ? 8 : -6;
    clarityScore += hasFormat ? 6 : 0;
    clarityScore += hasTone ? 4 : 0;
    if (wordCount >= 25 && wordCount <= 140) clarityScore += 10;
    if (wordCount < 15) clarityScore -= 15;
    if (wordCount > 200) clarityScore -= 12;

    let concisenessScore = 60;
    if (wordCount > 200) concisenessScore -= 30;
    else if (wordCount > 150) concisenessScore -= 18;
    else if (wordCount >= 40 && wordCount <= 100) concisenessScore += 12;
    if (wordCount < 15) concisenessScore -= 20;
    if (hasConstraints) concisenessScore += 6;
    if (!hasConstraints && wordCount > 40) concisenessScore -= 6;

    let creativityScore = 20 + adjectives.length * 4 + Math.min(16, uniqueKeywords * 1.5);
    if (selectedTaskObj?.creativity_required) creativityScore += 10;
    if (wordCount < 15) creativityScore -= 12;

    let accuracyScore = 40;
    accuracyScore += numbers.length > 0 ? 10 : 0;
    accuracyScore += hasExamples ? 8 : 0;
    accuracyScore += hasConstraints ? 10 : 0;
    accuracyScore += hasTone ? 6 : 0;
    accuracyScore += hasFormat ? 6 : 0;
    if (!hasPurpose) accuracyScore -= 18;
    if (wordCount < 20) accuracyScore -= 15;

    const scores: FeedbackScore = {
      clarity: clampScore(clarityScore),
      conciseness: clampScore(concisenessScore),
      creativity: clampScore(creativityScore),
      accuracy: clampScore(accuracyScore),
    };

    const avgScore = Math.round((scores.clarity + scores.conciseness + scores.creativity + scores.accuracy) / 4);

    const suggestionsList: string[] = [];
    if (!hasPurpose) suggestionsList.push('Clarify the exact outcome you want (e.g., "Help me design a 3-step onboarding email sequence").');
    if (!hasAudience) suggestionsList.push('Mention who the content is for (students, marketing managers, startup founders, etc.).');
    if (!hasFormat) suggestionsList.push('Specify the format or deliverable (bullet list, outline, script, table, etc.).');
    if (!hasTone) suggestionsList.push('Indicate the tone or style—formal, playful, persuasive, data-driven, etc.');
    if (!hasConstraints) suggestionsList.push('Add constraints like length, number of ideas, time frame, or success criteria.');
    if (wordCount < 25) suggestionsList.push('Add a bit more context or background so the AI has something specific to work with.');
    if (wordCount > 160) suggestionsList.push('Break long prompts into shorter sentences and focus on the most important details.');
    if (suggestionsList.length === 0) {
      suggestionsList.push('Great prompt! Consider adding success criteria or metrics so the AI knows how to measure a good answer.');
    }

    const templateLines = [
      `Goal: ${hasPurpose ? '✔️ Clearly stated.' : '[Describe the outcome you want the AI to produce.]'}`,
      `Audience: ${hasAudience ? '✔️ Included.' : '[Who will use or see the result?]'}`,
      `Context: ${hasContext ? '✔️ Adequate context provided.' : '[Add 1-2 sentences of background or current situation.]'}`,
      `Deliverable: ${hasFormat ? '✔️ Format specified.' : '[State the format: outline, script, email, etc.]'}`,
      `Tone/Style: ${hasTone ? '✔️ Mentioned.' : '[Describe tone: formal, playful, empathetic, data-driven…]'}`,
      `Constraints: ${hasConstraints ? '✔️ Limits provided.' : '[Set limits: length, number of ideas, timeframe, do/don’t rules.]'}`,
      `Examples/Evidence: ${hasExamples ? '✔️ Examples requested.' : '[Ask for examples, references, or evidence if you need them.]'}`,
    ];

    const summarySections = [
      `🔍 Prompt analysis (${wordCount} words, ~${Math.max(1, Math.round(text.length / 4))} estimated tokens)`
        + `\n• Objective clarity: ${hasPurpose ? 'Strong — goal detected.' : 'Missing — add a clear goal.'}`
        + `\n• Audience specified: ${hasAudience ? 'Yes' : 'No'}`
        + `\n• Format defined: ${hasFormat ? 'Yes' : 'No'}`
        + `\n• Tone/style: ${hasTone ? 'Mentioned' : 'Not mentioned'}`
        + `\n• Constraints/details: ${hasConstraints ? 'Present' : 'None detected'}`
        + `\n• Concrete signals: ${numbers.length > 0 ? 'Includes numbers/metrics.' : 'No numeric constraints yet.'}`,
      '',
      `Scores → Clarity ${scores.clarity}/100 | Conciseness ${scores.conciseness}/100 | Creativity ${scores.creativity}/100 | Precision ${scores.accuracy}/100 (avg ${avgScore})`,
      '',
      suggestionsList.length > 0 ? `Top improvement ideas:\n- ${suggestionsList.slice(0, 3).join('\n- ')}` : '',
      '',
      'Prompt upgrade checklist:',
      templateLines.map(line => `• ${line}`).join('\n'),
    ].filter(Boolean);

    const analysisSummary = summarySections.join('\n');

    const xpGain = Math.max(8, Math.round(avgScore / 5));
    const tokens = Math.max(1, Math.round(text.length / 4));

    return {
      scores,
      suggestions: suggestionsList,
      analysisSummary,
      xpGain,
      tokens,
    };
  };

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

    const analysis = analyzePrompt(prompt);

    await streamAnalysisResponse(analysis.analysisSummary);

    setFeedback(analysis.scores);
    setSuggestions(analysis.suggestions);
    setTokenUsage(analysis.tokens);

    setIsAnimatingXP(true);
    setTimeout(() => {
      setXpPoints(prev => prev + analysis.xpGain);
      setIsAnimatingXP(false);
    }, 400);

    setIsRunning(false);
  };
  const streamAnalysisResponse = async (text: string) => {
    let currentOutput = '';
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 15));
      currentOutput += text[i];
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
