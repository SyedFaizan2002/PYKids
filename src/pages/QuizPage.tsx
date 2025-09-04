import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Star,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { quizzes } from '../data/curriculum';
import { progressAPI, analyticsAPI } from '../services/api';
import { progressAnalyticsService } from '../services/ProgressAnalytics';
import { navigationService } from '../services/NavigationService';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

function QuizPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { userData, updateUserProgress } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStartTime] = useState(Date.now());

  const quiz = quizzes[moduleId as keyof typeof quizzes] as QuizQuestion[];

  // Navigation state using NavigationService
  const navigationState = useMemo(() => {
    return moduleId 
      ? navigationService.getNavigationState(moduleId, 'quiz')
      : { canGoNext: false, canGoPrevious: false, nextDestination: 'dashboard' as const, previousAvailable: false };
  }, [moduleId]);
  
  const previousContent = useMemo(() => {
    return moduleId 
      ? navigationService.getPreviousContent(moduleId, 'quiz')
      : null;
  }, [moduleId]);

  // Track quiz start
  React.useEffect(() => {
    if (quiz && userData?.id && moduleId) {
      analyticsAPI.trackEvent(userData.id, 'quiz_started', {
        moduleId,
        totalQuestions: quiz.length,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error('Error tracking quiz start:', error);
      });
    }
  }, [quiz, userData?.id, moduleId]);

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
          <Link to="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = quiz[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    // Track answer selection for analytics
    if (userData?.id && moduleId) {
      const isCorrect = answerIndex === quiz[currentQuestion].correct;
      analyticsAPI.trackEvent(userData.id, 'quiz_answer_selected', {
        moduleId,
        questionId: quiz[currentQuestion].id,
        questionNumber: currentQuestion + 1,
        selectedAnswer: answerIndex,
        correctAnswer: quiz[currentQuestion].correct,
        isCorrect,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error('Error tracking answer selection:', error);
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    const correctAnswers = answers.filter((answer, index) => answer === quiz[index].correct).length;
    const finalScore = Math.round((correctAnswers / quiz.length) * 100);
    setScore(finalScore);

    if (!moduleId) {
      console.error('Missing moduleId for quiz completion');
      setQuizCompleted(true);
      return;
    }

    try {
      console.log('Completing quiz:', { moduleId, finalScore, correctAnswers, totalQuestions: quiz.length });
      
      const completionTime = Date.now() - quizStartTime;
      const timeSpentMinutes = Math.round(completionTime / 60000);
      
      // CRITICAL: Update user progress and wait for persistence BEFORE showing completion
      // Using 'quiz' as topicId to distinguish from regular lessons
      await updateUserProgress(moduleId, 'quiz', true, finalScore, 'quiz');
      
      // Track detailed quiz completion analytics (non-blocking)
      try {
        if (userData?.id) {
          await analyticsAPI.trackEvent(userData.id, 'quiz_completed', {
            moduleId,
            score: finalScore,
            correctAnswers,
            totalQuestions: quiz.length,
            timeSpentMs: completionTime,
            timeSpentMinutes,
            averageTimePerQuestion: Math.round(completionTime / quiz.length),
            timestamp: new Date().toISOString()
          });
          
          // Save detailed quiz result for progress tracking and dashboard integration
          await progressAPI.saveQuizResult(userData.id, {
            moduleId,
            score: finalScore,
            totalQuestions: quiz.length,
            correctAnswers,
            completedAt: new Date().toISOString()
          });

          // Track module-level completion analytics for progress insights
          if (userData.progress) {
            const moduleCompletionStatus = progressAnalyticsService.getModuleCompletionStatus(
              userData.progress, 
              moduleId
            );
            
            await analyticsAPI.trackEvent(userData.id, 'module_quiz_completed', {
              moduleId,
              score: finalScore,
              performance: finalScore >= 80 ? 'excellent' : finalScore >= 60 ? 'good' : 'needs_improvement',
              moduleProgress: moduleCompletionStatus.percentage,
              isModuleCompleted: moduleCompletionStatus.isCompleted,
              timeSpentMinutes,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
        // Don't block completion for analytics failures
      }
      
      // Show completion screen after successful progress save
      setQuizCompleted(true);
      
    } catch (error) {
      console.error('Error completing quiz:', error);
      
      // Show user-friendly error message
      alert('There was an issue saving your quiz results. Please check your connection and try again.');
      
      // Don't show completion screen if progress save failed
      // This prevents data loss and ensures progress is properly saved
    }
  };

  // Navigation handlers
  const handlePreviousContent = useCallback(() => {
    if (previousContent && navigationState.canGoPrevious) {
      const previousRoute = navigationService.getContentRoute(previousContent.moduleId, previousContent.topicId);
      navigate(previousRoute);
    }
  }, [previousContent, navigationState.canGoPrevious, navigate]);

  const handleNextContent = useCallback(() => {
    if (!moduleId) return;
    
    // Navigate directly to next content without completing quiz
    const nextContentInfo = navigationService.getNextContent(moduleId, 'quiz');
    const currentNavigationState = navigationService.getNavigationState(moduleId, 'quiz');
    
    if (currentNavigationState.nextDestination === 'dashboard') {
      navigate('/dashboard');
    } else if (nextContentInfo) {
      const nextRoute = navigationService.getContentRoute(nextContentInfo.moduleId, nextContentInfo.topicId);
      navigate(nextRoute);
    }
  }, [moduleId, navigate]);

  const navigateAfterCompletion = useCallback(() => {
    if (!moduleId) return;
    
    // Use NavigationService to determine next destination after quiz completion
    const currentNavigationState = navigationService.getNavigationState(moduleId, 'quiz');
    const nextContentInfo = navigationService.getNextContent(moduleId, 'quiz');
    
    if (currentNavigationState.nextDestination === 'dashboard') {
      // This is the final quiz - go to dashboard
      navigate('/dashboard');
    } else if (nextContentInfo) {
      // Navigate to next content item (lesson or quiz)
      if (nextContentInfo.isModuleTransition) {
        console.log(`Transitioning from module ${moduleId} to module ${nextContentInfo.moduleId}`);
      }
      
      const nextRoute = navigationService.getContentRoute(nextContentInfo.moduleId, nextContentInfo.topicId);
      navigate(nextRoute);
    } else {
      // Fallback to dashboard
      navigate('/dashboard');
    }
  }, [moduleId, navigate]);

  const resetQuiz = () => {
    // Track quiz reset for analytics
    if (userData?.id && moduleId) {
      analyticsAPI.trackEvent(userData.id, 'quiz_reset', {
        moduleId,
        previousScore: score,
        questionsCompleted: currentQuestion + 1,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error('Error tracking quiz reset:', error);
      });
    }

    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
    setScore(0);
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground variant="dashboard" />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center max-w-md w-full shadow-custom border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 25px 50px -10px rgba(168, 85, 247, 0.4)"
            }}
          >
            {/* Celebration animation */}
            <div className="relative mb-6">
              {/* Sparkle effects */}
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 150],
                    y: [0, (Math.random() - 0.5) * 150],
                    rotate: [0, Math.random() * 360],
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                >
                  ✨
                </motion.div>
              ))}
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  type: "spring", 
                  duration: 0.8,
                  stiffness: 200
                }}
              >
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto relative z-10" />
              </motion.div>
            </div>
            
            <motion.h1 
              className="text-3xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {score >= 80 ? "Amazing! 🎉" : score >= 60 ? "Good Job! 👏" : "Keep Learning! 💪"}
            </motion.h1>
            
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="text-4xl font-bold text-white mb-2">{score}%</div>
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.8 + i * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < Math.floor(score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-400'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-purple-200">
                You got {answers.filter((answer, index) => answer === quiz[index].correct).length} out of {quiz.length} questions correct!
              </p>
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <Button 
                variant="success" 
                size="lg" 
                onClick={navigateAfterCompletion} 
                className="w-full"
              >
                {navigationState.nextDestination === 'dashboard' 
                  ? 'Back to Dashboard' 
                  : navigationState.nextDestination === 'quiz'
                  ? 'Next Quiz'
                  : 'Continue Learning'}
              </Button>
              <Button variant="secondary" size="md" onClick={resetQuiz} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      
      <div className="relative z-10">
        {/* Header */}
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
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {userData.selectedAvatar}
                  </motion.span>
                  <span className="text-white">{userData.selectedAvatar}</span>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {/* Quiz Content */}
        <div className="container mx-auto px-4 pb-12">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto shadow-custom border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Module Quiz 🧠</h2>
                <div className="text-purple-200">
                  Question {currentQuestion + 1} of {quiz.length}
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ 
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-white mb-8 text-center">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => !showResult && handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 border-2 shadow-custom ${
                      showResult
                        ? index === currentQ.correct
                          ? 'bg-green-500/30 border-green-400 shadow-glow-green'
                          : index === selectedAnswer && index !== currentQ.correct
                          ? 'bg-red-500/30 border-red-400 shadow-glow-pink'
                          : 'bg-white/5 border-white/20'
                        : selectedAnswer === index
                        ? 'bg-purple-500/30 border-purple-400 shadow-glow'
                        : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-purple-300'
                    }`}
                    disabled={showResult}
                    whileHover={!showResult ? { 
                      scale: 1.02,
                      x: 5,
                      boxShadow: "0 10px 20px -5px rgba(168, 85, 247, 0.3)"
                    } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{option}</span>
                      {showResult && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                            delay: 0.2
                          }}
                        >
                          {index === currentQ.correct && (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, 0]
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            </motion.div>
                          )}
                          {index === selectedAnswer && index !== currentQ.correct && (
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, -10, 0]
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <XCircle className="w-6 h-6 text-red-400" />
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Explanation */}
              {showResult && (
                <motion.div
                  className="bg-blue-500/20 border border-blue-400/50 rounded-xl p-4 mb-8 shadow-custom"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="font-bold text-blue-200 mb-2">Explanation:</h4>
                  <p className="text-blue-100">{currentQ.explanation}</p>
                </motion.div>
              )}

              {/* Next Button */}
              {showResult && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                    className="px-12"
                  >
                    {currentQuestion < quiz.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      <>
                        Finish Quiz
                        <Trophy className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Navigation buttons when not showing result */}
              {!showResult && (
                <motion.div
                  className="flex justify-center gap-4 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.div
                    whileHover={navigationState.canGoPrevious ? { scale: 1.05 } : {}}
                    whileTap={navigationState.canGoPrevious ? { scale: 0.95 } : {}}
                  >
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handlePreviousContent}
                      disabled={!navigationState.canGoPrevious}
                      className={!navigationState.canGoPrevious ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Previous {previousContent?.type === 'quiz' ? 'Quiz' : 'Lesson'}
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
                        ? 'Next Quiz'
                        : 'Next Lesson'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;