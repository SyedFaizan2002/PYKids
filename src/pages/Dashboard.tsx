import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  BookOpen, 
  Play, 
  Lock,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { curriculum } from '../data/curriculum';
import { progressAnalyticsService } from '../services/ProgressAnalytics';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';
import ProfileSidebar from '../components/ProfileSidebar';
import ProgressCard from '../components/ProgressCard';
import ResumeSection from '../components/ResumeSection';
import OptimizedAnimatePresence, { PageTransition, StaggerContainer } from '../components/OptimizedAnimatePresence';
import DashboardErrorBoundary from '../components/DashboardErrorBoundary';
import CurriculumSectionErrorBoundary from '../components/CurriculumSectionErrorBoundary';
import ProgressSyncIndicator from '../components/ProgressSyncIndicator';
import { 
  cardVariants, 
  buttonVariants, 
  avatarVariants, 
  progressVariants,
  moduleVariants,
  lessonItemVariants
} from '../utils/animationVariants';

const Dashboard = React.memo(() => {
  const { logout } = useAuth();
  const { 
    userData, 
    refreshUserData, 
    forceRefreshProgress, 
    syncProgress, 
    syncStatus,
    loading 
  } = useUser();
  const navigate = useNavigate();
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Memoize progress analytics calculation to prevent unnecessary recalculations
  const progressAnalytics = useMemo(() => {
    if (userData) {
      return progressAnalyticsService.calculateProgressAnalytics(userData);
    }
    return null;
  }, [userData]);

  // Force refresh on component mount to get latest backend data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard mounting - force refreshing progress data...');
        await forceRefreshProgress();
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error);
        // Fallback to regular refresh
        await refreshUserData();
      }
    };

    initializeDashboard();
  }, [forceRefreshProgress, refreshUserData]);

  // Set up periodic sync to keep data fresh
  useEffect(() => {
    if (!userData) return;

    const syncInterval = setInterval(async () => {
      try {
        await syncProgress();
        setLastSyncTime(new Date().toISOString());
      } catch (error) {
        console.warn('Periodic sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [userData, syncProgress]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pykids_progress_broadcast') {
        console.log('Progress update detected in another tab, syncing...');
        syncProgress();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncProgress]);

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }, [logout, navigate]);

  const handleChangeAvatar = useCallback(() => {
    setShowProfileSidebar(false);
    navigate('/avatar-selection');
  }, [navigate]);

  const handleShowProfile = useCallback(() => {
    setShowProfileSidebar(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setShowProfileSidebar(false);
  }, []);

  // Memoize expensive calculations
  const getLessonGlobalIndex = useCallback((moduleId: string, topicId: string) => {
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
  }, []);



  const isLessonUnlocked = useCallback((moduleId: string, topicId: string) => {
    if (!userData?.progress) return moduleId === 'module1' && topicId === 'topic1';
    if (moduleId === 'module1' && topicId === 'topic1') return true;
    
    const currentLessonIndex = getLessonGlobalIndex(moduleId, topicId);
    let completedLessons = 0;
    
    for (const module of curriculum) {
      for (const lesson of module.lessons) {
        const lessonIndex = getLessonGlobalIndex(module.id, lesson.id);
        if (lessonIndex < currentLessonIndex) {
          if (userData.progress[module.id]?.[lesson.id]?.completed) {
            completedLessons++;
          } else {
            return false;
          }
        }
      }
    }
    
    return completedLessons === currentLessonIndex;
  }, [userData?.progress, getLessonGlobalIndex]);

  const getLessonProgress = useCallback((moduleId: string, topicId: string) => {
    return userData?.progress?.[moduleId]?.[topicId] || null;
  }, [userData?.progress]);

  const getModuleProgress = useCallback((moduleId: string) => {
    if (!userData?.progress?.[moduleId]) return 0;
    const module = curriculum.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const completedLessons = module.lessons.filter(lesson => 
      userData.progress[moduleId][lesson.id]?.completed
    ).length;
    
    return Math.round((completedLessons / module.lessons.length) * 100);
  }, [userData?.progress]);



  const isQuizUnlocked = useCallback((moduleId: string) => {
    if (!userData?.progress) return false;
    const module = curriculum.find(m => m.id === moduleId);
    if (!module) return false;
    
    const completedLessons = module.lessons.every(lesson => 
      userData.progress[moduleId]?.[lesson.id]?.completed
    );
    return completedLessons;
  }, [userData?.progress]);





  return (
    <DashboardErrorBoundary>
      <OptimizedAnimatePresence mode="wait">
        <PageTransition className="min-h-screen relative overflow-hidden">
          <AnimatedBackground variant="dashboard" />
          
          {/* Progress Sync Indicator */}
          <ProgressSyncIndicator 
            syncStatus={syncStatus} 
            lastSyncTime={lastSyncTime} 
          />
          
          <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-custom"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <BookOpen className="w-6 h-6 text-white" />
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
                    Learning with {userData.selectedAvatar} 🚀
                  </motion.p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" onClick={handleShowProfile}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Button>
              <motion.div 
                className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">{userData?.totalScore || 0} points</span>
              </motion.div>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-3xl p-8 text-center mb-8 shadow-custom border border-purple-400/30"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            {userData?.selectedAvatar && (
              <motion.div 
                className="text-8xl mb-4"
                variants={avatarVariants}
                animate="animate"
              >
                {userData.selectedAvatar}
              </motion.div>
            )}
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back{userData?.selectedAvatar ? `, ${userData.selectedAvatar}` : ''}! 👋
            </h2>
            <p className="text-purple-200 text-lg">
              Ready to continue your Python adventure?
            </p>
          </motion.div>

          {/* Progress Overview */}
          {loading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-custom border border-white/10">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                      <div className="w-16 h-8 bg-white/20 rounded"></div>
                    </div>
                    <div className="w-32 h-6 bg-white/20 rounded mb-2"></div>
                    <div className="w-24 h-4 bg-white/20 rounded mb-4"></div>
                    <div className="w-full h-2 bg-white/20 rounded"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : progressAnalytics ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
              <ProgressCard
                title="Lessons Completed"
                value={`${progressAnalytics.completedLessons} of ${progressAnalytics.totalLessons}`}
                percentage={progressAnalytics.completionPercentage}
                icon={<BookOpen className="w-6 h-6 text-white" />}
                color="from-blue-500 to-cyan-500"
              />
              <ProgressCard
                title="Quizzes Completed"
                value={`${progressAnalytics.completedQuizzes || 0} of ${progressAnalytics.totalQuizzes || 2}`}
                percentage={Math.round(((progressAnalytics.completedQuizzes || 0) / (progressAnalytics.totalQuizzes || 2)) * 100)}
                icon={<Trophy className="w-6 h-6 text-white" />}
                color="from-green-500 to-emerald-500"
              />
              <ProgressCard
                title="Overall Progress"
                value={`${(progressAnalytics.completedLessons || 0) + (progressAnalytics.completedQuizzes || 0)} of ${(progressAnalytics.totalLessons || 10) + (progressAnalytics.totalQuizzes || 2)}`}
                percentage={Math.round((((progressAnalytics.completedLessons || 0) + (progressAnalytics.completedQuizzes || 0)) / ((progressAnalytics.totalLessons || 10) + (progressAnalytics.totalQuizzes || 2))) * 100)}
                icon={<Star className="w-6 h-6 text-white" />}
                color="from-purple-500 to-pink-500"
              />
            </motion.div>
          ) : (
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center mb-8 shadow-custom border border-white/10"
              variants={cardVariants}
              initial="initial"
              animate="animate"
            >
              <p className="text-purple-200">Loading your progress...</p>
            </motion.div>
          )}

          {/* Resume Section */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-custom border border-white/10">
              <div className="animate-pulse flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-48 h-6 bg-white/20 rounded mb-2"></div>
                  <div className="w-32 h-4 bg-white/20 rounded mb-1"></div>
                  <div className="w-24 h-4 bg-white/20 rounded"></div>
                </div>
                <div className="w-32 h-12 bg-white/20 rounded"></div>
              </div>
            </div>
          ) : progressAnalytics?.lastActiveLesson ? (
            <ResumeSection 
              lastActiveContent={{
                moduleId: progressAnalytics.lastActiveLesson.moduleId,
                topicId: progressAnalytics.lastActiveLesson.topicId,
                title: progressAnalytics.lastActiveLesson.title,
                moduleName: progressAnalytics.lastActiveLesson.moduleName,
                type: progressAnalytics.lastActiveLesson.topicId === 'quiz' ? 'quiz' : 'lesson'
              }}
              onResume={(moduleId, topicId, type) => {
                const route = type === 'quiz' ? `/quiz/${moduleId}` : `/lesson/${moduleId}/${topicId}`;
                navigate(route);
              }}
            />
          ) : (
            <ResumeSection 
              lastActiveContent={null}
              onResume={(moduleId, topicId, type) => {
                const route = type === 'quiz' ? `/quiz/${moduleId}` : `/lesson/${moduleId}/${topicId}`;
                navigate(route);
              }}
            />
          )}
        </section>

        <section className="container mx-auto px-4 pb-12">
          <CurriculumSectionErrorBoundary>
            <StaggerContainer className="grid lg:grid-cols-2 gap-8">
              {curriculum.map((module, moduleIndex) => (
              <motion.div
                key={module.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-custom border border-white/10"
                variants={moduleVariants}
                custom={moduleIndex}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{module.title}</h3>
                    <p className="text-purple-200">{module.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {getModuleProgress(module.id)}%
                    </div>
                    <div className="text-purple-200 text-sm">Complete</div>
                  </div>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
                  <motion.div
                    className={`bg-gradient-to-r ${module.color} h-2 rounded-full`}
                    variants={progressVariants}
                    initial="initial"
                    animate="animate"
                    custom={getModuleProgress(module.id)}
                  />
                </div>

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
                        variants={lessonItemVariants}
                        custom={lessonIndex}
                        whileHover={isUnlocked ? "hover" : undefined}
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
                            variants={isUnlocked ? buttonVariants : undefined}
                            whileHover={isUnlocked ? "hover" : undefined}
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
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{progress.score}</span>
                            </div>
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
                
                <motion.div
                  className={`mt-6 p-4 rounded-xl border shadow-custom ${
                    userData?.progress?.[module.id]?.quiz?.completed
                      ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400/30'
                      : isQuizUnlocked(module.id)
                      ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-yellow-400/30'
                      : 'bg-gray-600/20 border-gray-500/30 opacity-60'
                  }`}
                  variants={cardVariants}
                  whileHover={isQuizUnlocked(module.id) ? "hover" : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        {userData?.progress?.[module.id]?.quiz?.completed ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <Trophy className={`w-8 h-8 ${isQuizUnlocked(module.id) ? 'text-yellow-400' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Module Quiz 🧠</h4>
                        <p className={`text-sm ${
                          userData?.progress?.[module.id]?.quiz?.completed
                            ? 'text-green-200'
                            : isQuizUnlocked(module.id) 
                            ? 'text-yellow-200' 
                            : 'text-gray-300'
                        }`}>
                          {userData?.progress?.[module.id]?.quiz?.completed
                            ? `Completed! Score: ${userData.progress[module.id].quiz.score || 0}%`
                            : isQuizUnlocked(module.id) 
                            ? 'Test your knowledge and earn bonus points!' 
                            : `Complete all lessons in ${module.title} to unlock quiz`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {userData?.progress?.[module.id]?.quiz?.score && (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{userData.progress[module.id].quiz.score}%</span>
                        </div>
                      )}
                      
                      {isQuizUnlocked(module.id) ? (
                        <Link to={`/quiz/${module.id}`}>
                          <Button 
                            variant={userData?.progress?.[module.id]?.quiz?.completed ? "success" : "primary"} 
                            size="sm"
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            {userData?.progress?.[module.id]?.quiz?.completed ? 'Retake Quiz' : 'Take Quiz'}
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <Lock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              ))}
            </StaggerContainer>
          </CurriculumSectionErrorBoundary>
        </section>
        </div>
        
        <ProfileSidebar
          isOpen={showProfileSidebar}
          onClose={handleCloseProfile}
          onAvatarChange={handleChangeAvatar}
          onLogout={handleLogout}
        />
        </PageTransition>
      </OptimizedAnimatePresence>
    </DashboardErrorBoundary>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;