import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Bot, Loader2 } from 'lucide-react';
import Card from '../../components/Card';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIMentor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI Mentor. I can help you with questions about AI, machine learning, programming, and your course materials. How can I assist you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Gemini AI with 2.0 Flash model
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  async function handleSendMessage() {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get the Gemini 2.0 Flash model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Create a context-aware prompt for AI education
      const prompt = `You are an AI Mentor for graduate students learning AI and machine learning. You are powered by Google Gemini 2.0 Flash.

      Your role:
      - Help students understand AI concepts, machine learning, and programming
      - Provide educational guidance and explanations
      - Be encouraging and supportive
      - Give practical examples and real-world applications
      - Help with course-related questions and assignments

      Student's question: ${inputText}

      Please provide a helpful, educational response that guides the student in their learning journey. Be concise but thorough, and include examples when helpful.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponseText = response.text();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request. Please check your API key and internet connection, then try again.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }

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
              <h1 className="text-4xl font-bold text-warm-brown mb-3">Ask AI Mentor</h1>
              <p className="text-medium-gray text-lg mb-4">Powered by Google Gemini 2.0 Flash</p>
              <div className="flex items-center gap-6 text-sm text-medium-gray">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-warm-brown" />
                  <span>24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-success" />
                  <span>Course-Focused</span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-warning" />
                  <span>Instant Responses</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 bg-warm-brown rounded-2xl flex items-center justify-center animate-pulse-soft shadow-card">
              <Bot className="w-12 h-12 text-white" />
            </div>
          </div>
        </Card>
      </motion.div>

      <Card className="h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'ai'
                      ? 'bg-warm-brown'
                      : 'bg-light-accent/20'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-dark-primary text-sm font-medium">You</span>
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.sender === 'ai'
                      ? 'bg-light-accent/20 border border-light-accent'
                      : 'bg-warm-brown/10 border border-warm-brown/20'
                  }`}
                >
                    <p className="text-dark-primary text-base whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-warm-brown/70' : 'text-medium-gray'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-warm-brown">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-light-accent/20 border border-light-accent">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-warm-brown" />
                    <span className="text-dark-primary text-base">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-light-accent">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about AI, programming, or your courses..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-light-accent/20 border border-light-accent rounded-xl text-dark-primary placeholder-medium-gray focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 disabled:opacity-50"
          />
          <motion.button
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 bg-warm-brown rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>
      </Card>
    </div>
  );
}
