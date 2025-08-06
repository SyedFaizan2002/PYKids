import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogOut, 
  User, 
  Trophy, 
  BookOpen, 
  Play, 
  Lock,
  Star,
  Award,
  Code,
  CheckCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { curriculum } from '../data/curriculum';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';
import ProfileSidebar from '../components/ProfileSidebar';

function Dashboard() {
  const { logout } = useAuth();
  const { userData, refreshUserData } = useUser();
  const navigate = useNavigate();
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleChangeAvatar = () => {
    setShowProfileSidebar(false);
    navigate('/avatar-selection');
  };

  // Helper function to get lesson position across all modules
  const getLessonGlobalIndex = (moduleId: string, topicId: string) => {
    let globalIndex = 0;
    
    for (const module of curriculum) {
      for (const lesson of module.lessons) {
        if (module.id === moduleId && lesson.id === topicId) {
          return globalIndex;
        }
        globalIndex++;
      }
    }
    return globalIndex;
  };

  // Get total number of lessons across all modules
  const getTotalLessons = () => {
    return curriculum.reduce((total, module) => total + module.lessons.length, 0);
  };

  const isLessonUnlocked = (moduleId: string, topicId: string) => {
    if (!userData?.progress) return moduleId === 'module1' && topicId === 'topic1'; // Only first lesson unlocked initially
    
    // First lesson is always unlocked
    if (moduleId === 'module1' && topicId === 'topic1') return true;
    
    const currentLessonIndex = getLessonGlobalIndex(moduleId, topicId);
    
    // Check if all previous lessons are completed
    let completedLessons = 0;
    
    for (const module of curriculum) {
      for (const lesson of module.lessons) {
        const lessonIndex = getLessonGlobalIndex(module.id, lesson.id);
        
        if (lessonIndex < currentLessonIndex) {
          if (userData.progress[module.id]?.[lesson.id]?.completed) {
            completedLessons++;
          } else {
            return false; // Previous lesson not completed
          }
        }
      }
    }
    
    return completedLessons === currentLessonIndex;
  };

  const getLessonProgress = (moduleId: string, topicId: string) => {
    if (!userData?.progress?.[moduleId]?.[topicId]) return null;
    return userData.progress[moduleId][topicId];
  };

  const getModuleProgress = (moduleId: string) => {
    if (!userData?.progress?.[moduleId]) return 0;
    
    const module = curriculum.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const completedLessons = module.lessons.filter(lesson => 
      userData.progress[moduleId][lesson.id]?.completed
    ).length;
    
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const getTotalProgress = () => {
    if (!userData?.progress) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    curriculum.forEach(module => {
      totalLessons += module.lessons.length;
      module.lessons.forEach(lesson => {
        if (userData.progress[module.id]?.[lesson.id]?.completed) {
          completedLessons++;
        }
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const isQuizUnlocked = (moduleId: string) => {
    if (!userData?.progress) return false;
    
    // Count total completed lessons across all modules
    let totalCompletedLessons = 0;
    
    for (const module of curriculum) {
      for (const lesson of module.lessons) {
        if (userData.progress[module.id]?.[lesson.id]?.completed) {
          totalCompletedLessons++;
        }
      }
    }
    
    // Quiz unlocks after 5th and 10th lessons are completed
    if (moduleId === 'module1') {
      return totalCompletedLessons >= 5; // After 5 lessons
    } else if (moduleId === 'module2') {
      return totalCompletedLessons >= 10; // After 10 lessons
    }
    
    return false;
  };

  const getNextLesson = () => {
    for (const module of curriculum) {
      for (const lesson of module.lessons) {
        if (!userData?.progress?.[module.id]?.[lesson.id]?.completed) {
          return { moduleId: module.id, topicId: lesson.id, title: lesson.title };
        }
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-custom"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Code className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">PyKIDS Dashboard</h1>
                {userData?.selectedAvatar && (
                  <motion.p 
                    className="text-purple-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Learning with {userData.selectedAvatar.name} {userData.selectedAvatar.avatar}
                  </motion.p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" onClick={() => setShowProfileSidebar(true)}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Button>
              <motion.div 
                className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">{userData?.totalScore || 0} points</span>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="container mx-auto px-4 py-8">
          <motion.div
            className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-3xl p-8 text-center mb-12 shadow-custom border border-purple-400/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 25px 50px -10px rgba(168, 85, 247, 0.4)"
            }}
          >
            <motion.h2 
              className="text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Welcome to PyKIDS! 🎉
            </motion.h2>
            
            {userData?.selectedAvatar ? (
              <>
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {userData.selectedAvatar.avatar}
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Hey there, Python Explorer! 🚀
                </h3>
                <p className="text-purple-200 text-lg mb-4">
                  I'm {userData.selectedAvatar.name}, and I'm excited to help you learn Python! 
                  Let's continue your coding adventure!
                </p>
                
                {/* Continue Learning Button */}
                {nextLesson && (
                  <motion.div 
                    className="mb-6"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <Link to={`/lesson/${nextLesson.moduleId}/${nextLesson.topicId}`}>
                      <Button variant="success" size="lg" className="px-8">
                        <Play className="w-5 h-5 mr-2" />
                        Continue: {nextLesson.title}
                      </Button>
                    </Link>
                  </motion.div>
                )}
                
                {/* Overall Progress */}
                <motion.div 
                  className="bg-white/10 rounded-2xl p-4 max-w-md mx-auto backdrop-blur-sm border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-200">Overall Progress</span>
                    <span className="text-white font-bold">{getTotalProgress()}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getTotalProgress()}%` }}
                      transition={{ 
                        duration: 1.5, 
                        delay: 0.8,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                    />
                  </div>
                </motion.div>
              </>
            ) : (
              <>
              </>
            )}
          </motion.div>
        </section>

        {/* Modules */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {curriculum.map((module, moduleIndex) => (
              <motion.div
                key={module.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-custom border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: moduleIndex * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  boxShadow: "0 20px 40px -10px rgba(168, 85, 247, 0.3)"
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{module.title}</h3>
                    <p className="text-purple-200">{module.description}</p>
                  </div>
                  <div className="text-right">
                    <motion.div 
                      className="text-3xl font-bold text-white"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getModuleProgress(module.id)}%
                    </motion.div>
                    <div className="text-purple-200 text-sm">Complete</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
                  <motion.div
                    className={`bg-gradient-to-r ${module.color} h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getModuleProgress(module.id)}%` }}
                    transition={{ 
                      duration: 1.2, 
                      delay: moduleIndex * 0.2 + 0.5,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  />
                </div>

                {/* Lessons */}
                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isUnlocked = isLessonUnlocked(module.id, lesson.id);
                    const progress = getLessonProgress(module.id, lesson.id);
                    
                    return (
                      <motion.div
                        key={lesson.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${
                          isUnlocked
                            ? 'bg-white/10 hover:bg-white/20 cursor-pointer border-white/20 hover:border-purple-400/50'
                            : 'bg-white/5 opacity-50 border-white/10'
                        }`}
                        whileHover={isUnlocked ? { 
                          scale: 1.02,
                          x: 5,
                          boxShadow: "0 10px 20px -5px rgba(168, 85, 247, 0.2)"
                        } : {}}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: lessonIndex * 0.1,
                          type: "spring",
                          stiffness: 200
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-custom ${
                              progress?.completed
                                ? 'bg-green-500'
                                : isUnlocked
                                ? `bg-gradient-to-r ${module.color}`
                                : 'bg-gray-500'
                            }`}
                            whileHover={isUnlocked ? { scale: 1.1 } : {}}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            {progress?.completed ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : isUnlocked ? (
                              <BookOpen className="w-5 h-5 text-white" />
                            ) : (
                              <Lock className="w-5 h-5 text-white" />
                            )}
                          </motion.div>
                          
                          <div>
                            <h4 className="font-semibold text-white">{lesson.title}</h4>
                            <p className="text-purple-200 text-sm">{lesson.description}</p>
                            {!isUnlocked && (
                              <p className="text-yellow-300 text-xs mt-1">
                                🔒 Complete previous lesson to unlock
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {progress?.score && (
                            <motion.div 
                              className="flex items-center space-x-1 text-yellow-400"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{progress.score}</span>
                            </motion.div>
                          )}
                          
                          {isUnlocked && (
                            <Link to={`/lesson/${module.id}/${lesson.id}`}>
                              <Button
                                variant={progress?.completed ? "success" : "primary"}
                                size="sm"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {progress?.completed ? 'Review' : 'Start'}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Module Quiz */}
                <motion.div
                  className={`mt-6 p-4 rounded-xl border shadow-custom ${
                    isQuizUnlocked(module.id)
                      ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-yellow-400/30'
                      : 'bg-gray-600/20 border-gray-500/30 opacity-60'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: moduleIndex * 0.2 + 1,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={isQuizUnlocked(module.id) ? { 
                    scale: 1.02,
                    boxShadow: "0 15px 30px -5px rgba(251, 191, 36, 0.3)"
                  } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={isQuizUnlocked(module.id) ? { 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Trophy className={`w-8 h-8 ${isQuizUnlocked(module.id) ? 'text-yellow-400' : 'text-gray-400'}`} />
                      </motion.div>
                      <div>
                        <h4 className="font-semibold text-white">Module Quiz 🧠</h4>
                        <p className={`text-sm ${isQuizUnlocked(module.id) ? 'text-yellow-200' : 'text-gray-300'}`}>
                          {isQuizUnlocked(module.id) 
                            ? 'Test your knowledge and earn bonus points!' 
                            : module.id === 'module1' 
                              ? 'Complete 5 lessons to unlock quiz'
                              : 'Complete 10 lessons to unlock quiz'
                          }
                        </p>
                      </div>
                    </div>
                    {isQuizUnlocked(module.id) ? (
                      <Link to={`/quiz/${module.id}`}>
                        <Button variant="success" size="sm">
                          <Trophy className="w-4 h-4 mr-1" />
                          Take Quiz
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Lock className="w-4 h-4 mr-1" />
                        <span className="text-sm">Locked</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        onAvatarChange={handleChangeAvatar}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default Dashboard;