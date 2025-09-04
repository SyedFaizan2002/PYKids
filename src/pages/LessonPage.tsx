import React, { useState, useEffect, useCallback, useMemo, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, RotateCcw, BookOpen, Code } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { curriculum } from '../data/curriculum';
import { analyticsAPI } from '../services/api';
import { navigationService } from '../services/NavigationService';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';
import VoiceOverPlayer from '../components/VoiceOverPlayer';
import LazyComponentWrapper from '../components/LazyComponentWrapper';
import OptimizedAnimatePresence, { PageTransition, StaggerContainer, StaggerItem } from '../components/OptimizedAnimatePresence';
import { 
  cardVariants, 
  buttonVariants, 
  avatarVariants, 
  celebrationVariants, 
  particleVariants
} from '../utils/animationVariants';
import { reducedMotionVariants } from '../utils/animationVariants';

// Lazy loaded components for better performance
const CodeEditor = lazy(() => import('../components/CodeEditor'));
const CodeAnimation = lazy(() => import('../components/CodeAnimation'));
const LessonAnimation = lazy(() => import('../components/LessonAnimation'));



const LessonPage = React.memo(() => {
  const { moduleId, topicId } = useParams();
  const navigate = useNavigate();
  const { userData, updateUserProgress } = useUser();
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [completed, setCompleted] = useState(false);

  // Memoize lesson and navigation data to prevent unnecessary recalculations
  const lesson = useMemo(() => {
    const module = curriculum.find(m => m.id === moduleId);
    return module?.lessons.find(l => l.id === topicId);
  }, [moduleId, topicId]);

  const module = useMemo(() => {
    return curriculum.find(m => m.id === moduleId);
  }, [moduleId]);
  
  // Use NavigationService for navigation state - memoized to prevent recalculation
  const navigationState = useMemo(() => {
    return moduleId && topicId 
      ? navigationService.getNavigationState(moduleId, topicId)
      : { canGoNext: false, canGoPrevious: false, nextDestination: 'dashboard' as const, previousAvailable: false };
  }, [moduleId, topicId]);
  
  const previousLesson = useMemo(() => {
    return moduleId && topicId 
      ? navigationService.getPreviousContent(moduleId, topicId)
      : null;
  }, [moduleId, topicId]);

  // Optimize useEffect dependencies - only run when lesson changes
  useEffect(() => {
    if (lesson) {
      const initialCode = lesson.exerciseCode || `# Welcome to Python! 🐍
print("Hello, PyKIDS!")
print("I'm learning Python! 🚀")
name = "CodeKid"
age = 10
print(f"My name is {name} and I'm {age} years old!")`;
      setUserCode(initialCode);
    }
  }, [lesson?.exerciseCode, lesson?.id]); // Only depend on specific lesson properties

  // Use useCallback to prevent unnecessary re-renders of child components
  const handleCodeChange = useCallback((newCode: string) => {
    setUserCode(newCode);
  }, []);

  // Enhanced completion handler with proper persistence and error handling
  const handleComplete = useCallback(async () => {
    if (!moduleId || !topicId) {
      console.error('Missing moduleId or topicId for lesson completion');
      return;
    }
    
    try {
      console.log('Completing lesson:', { moduleId, topicId });
      
      // CRITICAL: Update progress and wait for persistence BEFORE navigation
      await updateUserProgress(moduleId, topicId, true, 10, 'lesson');
      
      // Track analytics event (non-blocking)
      try {
        await analyticsAPI.trackEvent('user', 'lesson_completed', {
          moduleId,
          topicId,
          codeWritten: userCode.length > 0,
          timestamp: new Date().toISOString()
        });
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
        // Don't block completion for analytics failures
      }
      
      // Set completion state for UI feedback
      setCompleted(true);
      
      // Navigate after showing completion animation
      setTimeout(() => {
        navigateAfterCompletion();
      }, 2000);
      
    } catch (error) {
      console.error('Error completing lesson:', error);
      
      // Show user-friendly error message
      alert('There was an issue saving your progress. Please check your connection and try again.');
      
      // Don't navigate if progress save failed - let user retry
      // This prevents data loss and ensures progress is properly saved
    }
  }, [moduleId, topicId, userCode.length, updateUserProgress, navigateAfterCompletion]);

  const navigateAfterCompletion = useCallback(() => {
    if (!moduleId || !topicId) return;
    
    // Use NavigationService to determine next destination
    const currentNavigationState = navigationService.getNavigationState(moduleId, topicId);
    const nextContentInfo = navigationService.getNextContent(moduleId, topicId);
    
    if (currentNavigationState.nextDestination === 'dashboard') {
      // This is the final content item - go to dashboard
      navigate('/dashboard');
    } else if (nextContentInfo) {
      // Navigate to next content item (lesson or quiz)
      if (nextContentInfo.isModuleTransition) {
        // Show a brief module transition message or animation
        console.log(`Transitioning from module ${moduleId} to module ${nextContentInfo.moduleId}`);
      }
      
      // Navigate based on content type
      const nextRoute = navigationService.getContentRoute(nextContentInfo.moduleId, nextContentInfo.topicId);
      navigate(nextRoute);
    } else {
      // Fallback to dashboard if no next content found
      navigate('/dashboard');
    }
  }, [moduleId, topicId, navigate]);

  const handlePreviousContent = useCallback(() => {
    if (previousLesson && navigationState.canGoPrevious) {
      const previousRoute = navigationService.getContentRoute(previousLesson.moduleId, previousLesson.topicId);
      navigate(previousRoute);
    }
  }, [previousLesson, navigationState.canGoPrevious, navigate]);

  const handleNextContent = useCallback(() => {
    if (!moduleId || !topicId) return;
    
    // Navigate directly to next content without completing current one
    const nextContentInfo = navigationService.getNextContent(moduleId, topicId);
    const currentNavigationState = navigationService.getNavigationState(moduleId, topicId);
    
    if (currentNavigationState.nextDestination === 'dashboard') {
      navigate('/dashboard');
    } else if (nextContentInfo) {
      const nextRoute = navigationService.getContentRoute(nextContentInfo.moduleId, nextContentInfo.topicId);
      navigate(nextRoute);
    }
  }, [moduleId, topicId, navigate]);

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
    <OptimizedAnimatePresence mode="wait">
      <PageTransition className="min-h-screen relative overflow-hidden">
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
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <motion.span 
                    className="text-2xl"
                    variants={avatarVariants}
                    animate="animate"
                  >
                    {userData.selectedAvatar}
                  </motion.span>
                  <span className="text-white">{userData.selectedAvatar}</span>
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
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                {userData?.selectedAvatar && (
                  <motion.div
                    className="text-center mb-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-400/30 shadow-custom"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <motion.div 
                      className="text-8xl mb-4"
                      variants={avatarVariants}
                      animate="animate"
                    >
                      {userData.selectedAvatar}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Hey there! I'm {userData.selectedAvatar}! 👋
                    </h2>
                    <p className="text-purple-200 text-lg">
                      Today, we're going to learn something awesome – {lesson.title}! Ready? 🚀
                    </p>
                  </motion.div>
                )}
                <StaggerContainer className="text-center mb-8">
                  <StaggerItem>
                    <motion.div
                      className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${module?.color} text-white font-medium mb-4 shadow-custom`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {module?.title}
                    </motion.div>
                  </StaggerItem>
                  <StaggerItem>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {lesson.title}
                    </h1>
                  </StaggerItem>
                  <StaggerItem>
                    <p className="text-purple-200 text-lg">
                      {lesson.description}
                    </p>
                  </StaggerItem>
                </StaggerContainer>
                <VoiceOverPlayer
                  text={lesson.voiceOver}
                  avatarGender="boy"
                  autoPlay={true}
                />
                <StaggerItem className="mb-8">
                  <LazyComponentWrapper>
                    <LessonAnimation type={lesson.animationType} />
                  </LazyComponentWrapper>
                </StaggerItem>
                <StaggerItem className="bg-white/5 rounded-2xl p-6 mb-8 shadow-custom border border-white/10">
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
                </StaggerItem>
                {lesson.hasExercise && (
                  <StaggerItem className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-6 mb-8 border border-green-400/30 shadow-custom">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Code className="w-6 h-6 mr-2" />
                      Code Playground! 🚀
                    </h3>
                    <p className="text-green-200 mb-4 text-lg">
                      {lesson.exercisePrompt || "Write and run your own Python code! Experiment, learn, and have fun! ✨"}
                    </p>
                    <LazyComponentWrapper>
                      <CodeEditor 
                        initialCode={userCode}
                        onRun={setOutput}
                        onCodeChange={handleCodeChange}
                      />
                    </LazyComponentWrapper>
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
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
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
                  </StaggerItem>
                )}
                <div className="text-center mt-8">
                  {completed ? (
                    <motion.div
                      variants={celebrationVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <div className="relative">
                        {Array.from({ length: 8 }, (_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-2xl"
                            style={{ left: '50%', top: '50%' }}
                            variants={particleVariants}
                            custom={i}
                            animate="animate"
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
                          variants={cardVariants}
                          whileHover="hover"
                        >
                          <div className="text-6xl mb-2">{userData.selectedAvatar}</div>
                          <p className="text-green-200 text-lg font-medium">
                            "Great job! You totally rocked that lesson! 🚀"
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex justify-center gap-4">
                      <motion.div
                        variants={navigationState.canGoPrevious ? buttonVariants : { ...buttonVariants, disabled: buttonVariants.disabled }}
                        whileHover={navigationState.canGoPrevious ? "hover" : "disabled"}
                        whileTap={navigationState.canGoPrevious ? "tap" : "disabled"}
                      >
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={handlePreviousContent}
                          disabled={!navigationState.canGoPrevious}
                          className={!navigationState.canGoPrevious ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" />
                          Previous {previousLesson?.type === 'quiz' ? 'Quiz' : 'Lesson'}
                        </Button>
                      </motion.div>
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
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
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleNextContent}
                          disabled={!navigationState.canGoNext && navigationState.nextDestination !== 'dashboard'}
                        >
                          {navigationState.nextDestination === 'dashboard' 
                            ? 'Back to Dashboard' 
                            : navigationState.nextDestination === 'quiz'
                            ? 'Take Quiz'
                            : 'Next Lesson'}
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
                <LazyComponentWrapper>
                  <CodeAnimation />
                </LazyComponentWrapper>
              </div>
            </div>
          </div>
        </div>
        </div>
      </PageTransition>
    </OptimizedAnimatePresence>
  );
});

LessonPage.displayName = 'LessonPage';

export default LessonPage;