import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Code, Brain, Gamepad2, Trophy } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';

function LandingPage() {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Learning',
      description: 'Personal tutor that adapts to your learning style'
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Interactive Coding',
      description: 'Write and run Python code right in your browser'
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: 'Fun & Games',
      description: 'Learn through interactive games and challenges'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Track Progress',
      description: 'See your coding skills grow with every lesson'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="landing" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <div></div>
            
            <motion.div 
              className="space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}  
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Start Learning</Button>
              </Link>
            </motion.div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center items-center space-x-6 mb-8">
              {/* PyKIDS Logo */}
              <div className="relative">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-custom border-4 border-white/20"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 3, -3, 0]
                  }}
                  style={{
                    animationDuration: '4s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out'
                  }}
                >
                  <div className="text-4xl font-bold text-white transform -rotate-12">🐍</div>
                </motion.div>
                <motion.div
                  className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-custom"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-sm">✨</span>
                </motion.div>
              </div>
              <div>
                <motion.span 
                  className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  PYKids
                </motion.span>
                <div className="text-lg text-purple-300 font-semibold">Learn Python the Fun Way!</div>
              </div>
            </div>
            
            <motion.p 
              className="text-lg text-purple-200 mb-8 max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Code, learn, and have fun with your AI buddy! 🚀✨
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link to="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  <Play className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Kids Love PyKIDS? 🚀
            </h2>
            <p className="text-purple-200 text-lg">
              Making Python programming fun, interactive, and accessible for everyone!
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 shadow-custom border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  boxShadow: "0 20px 40px -10px rgba(168, 85, 247, 0.3)"
                }}
              >
                <motion.div 
                  className="text-purple-300 mb-4 flex justify-center"
                  whileHover={{ 
                    scale: 1.2,
                    rotate: 10,
                    color: "#a855f7"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default LandingPage;