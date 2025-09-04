import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, BookOpen, ArrowRight, Clock } from 'lucide-react';
import Button from './Button';

interface ResumeSectionProps {
  lastActiveContent: {
    moduleId: string;
    topicId: string;
    title: string;
    moduleName: string;
    type: 'lesson' | 'quiz';
  } | null;
  onResume: (moduleId: string, topicId: string, type: 'lesson' | 'quiz') => void;
  className?: string;
}

const ResumeSection: React.FC<ResumeSectionProps> = React.memo(({
  lastActiveContent,
  onResume,
  className = ''
}) => {
  if (!lastActiveContent) {
    return (
      <motion.div
        className={`bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-sm rounded-3xl p-8 text-center shadow-custom border border-blue-400/30 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.02 }}
      >
        <motion.div 
          className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-400/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <BookOpen className="w-10 h-10 text-blue-400" />
        </motion.div>
        
        <motion.h3 
          className="text-2xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Ready to Start Learning?
        </motion.h3>
        
        <motion.p 
          className="text-blue-200 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Begin your Python journey with our first lesson!
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <Button 
            variant="primary" 
            size="lg" 
            className="px-8"
            onClick={() => onResume('module1', 'topic1', 'lesson')}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Your Python Journey!
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`bg-gradient-to-r from-green-600/30 to-blue-600/30 backdrop-blur-sm rounded-3xl p-8 shadow-custom border border-green-400/30 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <motion.div 
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            <Clock className="w-10 h-10 text-green-400" />
          </motion.div>
          
          <div>
            <motion.h3 
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Continue Where You Left Off
            </motion.h3>
            
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-green-200 font-medium">
                {lastActiveContent.moduleName}
              </p>
              <p className="text-white text-lg font-semibold">
                {lastActiveContent.title}
              </p>
              <p className="text-green-300 text-sm font-medium">
                {lastActiveContent.type === 'quiz' ? '🧠 Quiz' : '📚 Lesson'}
              </p>
            </motion.div>
          </div>
        </div>
        
        <motion.div
          className="flex flex-col items-end space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="success" 
              size="lg" 
              className="px-8"
              onClick={() => onResume(lastActiveContent.moduleId, lastActiveContent.topicId, lastActiveContent.type)}
            >
              <Play className="w-5 h-5 mr-2" />
              Resume {lastActiveContent.type === 'quiz' ? 'Quiz' : 'Learning'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          
          <motion.p 
            className="text-green-200 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Pick up where you left off
          </motion.p>
        </motion.div>
      </div>
      
      {/* Progress indicator */}
      <motion.div 
        className="mt-6 pt-6 border-t border-green-400/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-200">
            Last active {lastActiveContent.type === 'quiz' ? 'quiz' : 'lesson'}
          </span>
          <motion.div 
            className="flex items-center space-x-2 text-green-400"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>Continue your journey</span>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

ResumeSection.displayName = 'ResumeSection';

export default ResumeSection;