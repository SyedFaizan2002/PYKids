import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Button from './Button';

// AI Chatbot Component
const CodeAnimation: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I\'m CodeBuddy 🤖 Ask me anything about Python programming!' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setTimeout(() => {
      const isAboutPython = input.toLowerCase().includes('python') || 
                           input.toLowerCase().includes('code') ||
                           input.toLowerCase().includes('variable') ||
                           input.toLowerCase().includes('print') ||
                           input.toLowerCase().includes('loop') ||
                           input.toLowerCase().includes('list') ||
                           input.toLowerCase().includes('string') ||
                           input.toLowerCase().includes('if') ||
                           input.toLowerCase().includes('function');
      
      let response = '';
      if (isAboutPython) {
        const responses = [
          "Great question! In Python, that's a really important concept! 🐍✨",
          "I love helping with Python! Here's what you need to know... 💡",
          "Python makes that super easy! Let me explain it in a fun way! 🎉",
          "That's one of my favorite Python topics! Here's the scoop... 🚀",
          "Awesome Python question! You're thinking like a real programmer! 👨‍💻"
        ];
        if (input.toLowerCase().includes('print')) {
          response = "The print() function is like making your computer talk! It shows text on the screen. Try: print('Hello, World!') 🗣️";
        } else if (input.toLowerCase().includes('variable')) {
          response = "Variables are like magical boxes where you store information! Like: my_name = 'CodeKid' 📦✨";
        } else if (input.toLowerCase().includes('loop')) {
          response = "Loops are amazing! They help you repeat actions without writing the same code over and over. 🔁";
        } else if (input.toLowerCase().includes('list')) {
          response = "Lists are like toy boxes where you can store many items in order! Perfect for organizing data! 📋";
        } else {
          response = responses[Math.floor(Math.random() * responses.length)];
        }
      } else {
        response = "Oops! I only know about Python programming today! 🤖 Ask me about Python coding, variables, loops, or functions!";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
    setInput('');
  };

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-custom border border-white/20 h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="p-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <motion.div 
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-custom"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <span className="text-white font-medium text-sm">CodeBuddy 🤖</span>
            <div className="text-purple-300 text-xs">Always here to help!</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`p-2 rounded-lg shadow-custom text-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-4' 
                : 'bg-white/10 text-purple-100 mr-4 border border-white/20'
            }`}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.3 
            }}
          >
            {msg.content}
          </motion.div>
        ))}
      </div>
      <div className="p-3 border-t border-white/20 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about Python..."
            className="flex-1 px-2 py-1 text-sm bg-white/10 border border-purple-300/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 backdrop-blur-sm transition-all duration-300"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="primary" size="sm" onClick={sendMessage} className="px-2 py-1 text-xs">
              Send
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CodeAnimation;