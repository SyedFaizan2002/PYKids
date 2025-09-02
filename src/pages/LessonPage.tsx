import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play, Code, CheckCircle, RotateCcw, MessageCircle, BookOpen } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { curriculum } from '../data/curriculum';
import { codeAPI, aiAPI, analyticsAPI } from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';
import VoiceOverPlayer from '../components/VoiceOverPlayer';
import LessonAnimation from '../components/LessonAnimation';

// Interactive Python Code Editor with execution
const PythonCodeEditor = ({ 
  initialCode, 
  onRun, 
  onCodeChange 
}: { 
  initialCode: string; 
  onRun: (output: string) => void;
  onCodeChange: (code: string) => void;
}) => {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange(newCode);
  };

  const runCode = () => {
    setIsRunning(true);
    try {
      if (code.includes('print(')) {
        const matches = code.match(/print\([^)]+\)/g);
        if (matches) {
          const outputs = matches.map(match => {
            const content = match.match(/print\(([^)]+)\)/)?.[1];
            if (content) {
              let output = content.replace(/['"]/g, '');
              output = output.replace(/\{[^}]+\}/g, '[value]');
              return output;
            }
            return '';
          });
          onRun(`✅ Output:\n${outputs.join('\n')}`);
        }
      } else {
        onRun('✅ Code executed successfully! Great job! 🎉');
      }
    } catch (error) {
      onRun(`❌ Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div 
      className="bg-gray-900 rounded-lg p-4 shadow-custom border border-gray-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium flex items-center">
          <Code className="w-4 h-4 mr-2" />
          Interactive Python Editor ✨
        </h4>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="success" 
            size="sm" 
            onClick={runCode}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
        </motion.div>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/30 rounded-l flex flex-col text-gray-500 text-xs font-mono pt-3 z-10 pointer-events-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="px-2 leading-6 text-center">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="w-full h-64 text-green-400 text-sm font-mono bg-black/50 p-3 pl-14 pr-4 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-600 relative z-20"
          placeholder="# Write your Python code here...
print('Hello, World!')

# Try creating variables:
name = 'CodeKid'
age = 10
print(f'Hi, I am {name} and I am {age} years old!')"
          spellCheck={false}
          style={{
            lineHeight: '1.5',
            tabSize: 4,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newCode = code.substring(0, start) + '    ' + code.substring(end);
              setCode(newCode);
              onCodeChange(newCode);
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
              }, 0);
            }
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-20 rounded overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
          }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>💡 Tip: Use Tab for indentation</span>
        </div>
      </div>
    </motion.div>
  );
};

// AI Chatbot Component
const CodeBuddy = () => {
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
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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

function LessonPage() {
  const { moduleId, topicId } = useParams();
  const navigate = useNavigate();
  const { userData, updateUserProgress } = useUser();
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [completed, setCompleted] = useState(false);

  const module = curriculum.find(m => m.id === moduleId);
  const lesson = module?.lessons.find(l => l.id === topicId);
  const lessonIndex = module?.lessons.findIndex(l => l.id === topicId) || 0;
  const isFirstLesson = lessonIndex === 0;
  const isLastLesson = lessonIndex === (module?.lessons.length || 0) - 1;

  useEffect(() => {
    const initialCode = lesson?.exerciseCode || `# Welcome to Python! 🐍
print("Hello, PyKIDS!")
print("I'm learning Python! 🚀")
name = "CodeKid"
age = 10
print(f"My name is {name} and I'm {age} years old!")`;
    setUserCode(initialCode);
  }, [lesson]);

  const handleCodeChange = (newCode: string) => {
    setUserCode(newCode);
  };

  const handleComplete = async () => {
    if (!moduleId || !topicId) return;
    try {
      await analyticsAPI.trackEvent(userData?.selectedAvatar?.id || 'unknown', 'lesson_completed', {
        moduleId,
        topicId,
        codeWritten: userCode.length > 0
      });
      await updateUserProgress(moduleId, topicId, true, 10);
      setCompleted(true);
      setTimeout(() => {
        const nextLesson = module?.lessons[lessonIndex + 1];
        if (nextLesson) {
          navigate(`/lesson/${moduleId}/${nextLesson.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handlePreviousLesson = () => {
    const prevLesson = module?.lessons[lessonIndex - 1];
    if (prevLesson) {
      navigate(`/lesson/${moduleId}/${prevLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    handleComplete(); // Complete current lesson and move to next
  };

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
          <Link to="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              {userData?.selectedAvatar && (
                <motion.div 
                  className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.span 
                    className="text-2xl"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {userData.selectedAvatar.avatar}
                  </motion.span>
                  <span className="text-white">{userData.selectedAvatar.name}</span>
                </motion.div>
              )}
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 pb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-custom border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {userData?.selectedAvatar && (
                  <motion.div
                    className="text-center mb-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-400/30 shadow-custom"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(168, 85, 247, 0.3)" }}
                  >
                    <motion.div 
                      className="text-8xl mb-4"
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {userData.selectedAvatar.avatar}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Hey there! I'm {userData.selectedAvatar.name}! 👋
                    </h2>
                    <p className="text-purple-200 text-lg">
                      Today, we're going to learn something awesome – {lesson.title}! Ready? 🚀
                    </p>
                  </motion.div>
                )}
                <div className="text-center mb-8">
                  <motion.div
                    className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${module?.color} text-white font-medium mb-4 shadow-custom`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {module?.title}
                  </motion.div>
                  <motion.h1 
                    className="text-4xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    {lesson.title}
                  </motion.h1>
                  <motion.p 
                    className="text-purple-200 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    {lesson.description}
                  </motion.p>
                </div>
                <VoiceOverPlayer
                  text={lesson.voiceOver}
                  avatarGender={userData?.selectedAvatar?.gender || 'boy'}
                  autoPlay={true}
                />
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <LessonAnimation type={lesson.animationType} />
                </motion.div>
                <motion.div
                  className="bg-white/5 rounded-2xl p-6 mb-8 shadow-custom border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <div className="flex items-center mb-4">
                    <BookOpen className="w-6 h-6 text-purple-300 mr-2" />
                    <h3 className="text-xl font-bold text-white">Read Along 📖</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-purple-100 leading-relaxed text-lg"
                      dangerouslySetInnerHTML={{ 
                        __html: lesson.content
                          .replace(/\n/g, '<br>')
                          .replace(/```python([\s\S]*?)```/g, '<pre class="bg-gray-900 p-4 rounded-lg text-green-400 font-mono my-4 shadow-custom border border-gray-700"><code>$1</code></pre>')
                          .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-green-300 font-mono shadow-sm">$1</code>')
                          .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-white mt-6 mb-3">$1</h2>')
                          .replace(/### (.*)/g, '<h3 class="text-xl font-bold text-purple-200 mt-4 mb-2">$1</h3>')
                      }}
                    />
                  </div>
                </motion.div>
                {lesson.hasExercise && (
                  <motion.div
                    className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-6 mb-8 border border-green-400/30 shadow-custom"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    whileHover={{ scale: 1.01, boxShadow: "0 20px 40px -10px rgba(34, 197, 94, 0.3)" }}
                  >
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Code className="w-6 h-6 mr-2" />
                      Code Playground! 🚀
                    </h3>
                    <p className="text-green-200 mb-4 text-lg">
                      {lesson.exercisePrompt || "Write and run your own Python code! Experiment, learn, and have fun! ✨"}
                    </p>
                    <PythonCodeEditor 
                      initialCode={userCode}
                      onRun={setOutput}
                      onCodeChange={handleCodeChange}
                    />
                    {output && (
                      <motion.div
                        className="mt-4 p-4 bg-gray-800 rounded-lg border border-green-400/30 shadow-custom"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-gray-300 text-sm font-mono whitespace-pre-wrap">{output}</div>
                      </motion.div>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setUserCode(lesson?.exerciseCode || `print("Hello, PyKIDS!")\nprint("Let's code together! 🚀")`)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Code
                        </Button>
                      </motion.div>
                      <div className="text-green-200 text-sm">
                        💡 Tip: Write your code and click "Run Code" to see it in action!
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="text-center mt-8">
                  {completed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                    >
                      <div className="relative">
                        {Array.from({ length: 12 }, (_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-2xl"
                            style={{ left: '50%', top: '50%' }}
                            animate={{
                              x: [0, (Math.random() - 0.5) * 200],
                              y: [0, (Math.random() - 0.5) * 200],
                              rotate: [0, Math.random() * 360],
                              scale: [1, 0],
                              opacity: [1, 0],
                            }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 }}
                          >
                            {['🎉', '🎊', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)]}
                          </motion.div>
                        ))}
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Awesome Job! 🎉</h3>
                      <p className="text-purple-200">You're becoming a Python expert!</p>
                      <div className="mt-4 text-yellow-300">
                        <span className="text-3xl">⭐</span>
                        <span className="mx-2 text-lg font-bold">+10 Points!</span>
                        <span className="text-3xl">⭐</span>
                      </div>
                      {userData?.selectedAvatar && (
                        <motion.div 
                          className="mt-6 p-4 bg-green-500/20 rounded-2xl border border-green-400/50 shadow-glow-green"
                          animate={{ 
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              "0 0 20px rgba(34, 197, 94, 0.3)",
                              "0 0 30px rgba(34, 197, 94, 0.5)",
                              "0 0 20px rgba(34, 197, 94, 0.3)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="text-6xl mb-2">{userData.selectedAvatar.avatar}</div>
                          <p className="text-green-200 text-lg font-medium">
                            "Great job! You totally rocked that lesson! 🚀"
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex justify-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={handlePreviousLesson}
                          disabled={isFirstLesson}
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" />
                          Previous Lesson
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="success"
                          size="lg"
                          onClick={handleComplete}
                          className="px-12"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Complete Lesson
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleNextLesson}
                          disabled={isLastLesson}
                        >
                          Next Lesson
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="lg:w-72 w-full">
              <div className="sticky top-6 h-[calc(100vh-8rem)]">
                <CodeBuddy />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonPage;