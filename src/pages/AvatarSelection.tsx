import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { avatars } from '../data/avatars';
import AnimatedBackground from '../components/AnimatedBackground';
import Button from '../components/Button';

function AvatarSelection() {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userData, setSelectedAvatar, loading: userLoading } = useUser();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user already has an avatar and redirect to dashboard
  useEffect(() => {
    if (!userLoading && userData?.selectedAvatar) {
      navigate('/dashboard');
    }
  }, [userLoading, userData, navigate]);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedAvatarId) {
      setError('Please select an avatar');
      return;
    }

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const avatar = avatars.find(a => a.id === selectedAvatarId);
      if (avatar) {
        await setSelectedAvatar(avatar);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error setting avatar:', error);
      setError(error.message || 'Failed to save avatar');
      navigate('/dashboard'); // Proceed to dashboard even on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-5xl shadow-custom border border-white/20"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
            >
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Choose Your AI Tutor! ✨
            </motion.h1>
            <motion.p 
              className="text-purple-200 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Pick your coding companion who will guide you through your Python journey! 
              Your tutor will speak with you, teach you, and help you become a Python master!
            </motion.p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm shadow-custom"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {/* Avatar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {avatars.map((avatar, index) => (
              <motion.div
                key={avatar.id}
                className={`relative cursor-pointer rounded-3xl p-8 text-center transition-all duration-300 border-4 shadow-custom ${
                  selectedAvatarId === avatar.id
                    ? 'bg-white/25 border-purple-400 scale-105 shadow-glow'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 hover:border-purple-300 hover:shadow-glow'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                onClick={() => handleAvatarSelect(avatar.id)}
                whileHover={{ y: -12 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedAvatarId === avatar.id && (
                  <motion.div
                    className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-custom"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                
                <motion.div 
                  className="text-8xl mb-6"
                  animate={selectedAvatarId === avatar.id ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {avatar.avatar}
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-3">{avatar.name}</h3>
                <motion.div 
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${avatar.color} text-white mb-4 shadow-custom`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {avatar.personality}
                </motion.div>
                <p className="text-purple-200 text-base leading-relaxed">{avatar.description}</p>
                
                <motion.div 
                  className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-center justify-center space-x-2 text-purple-200">
                    <span className="text-2xl">🎤</span>
                    <span className="text-sm font-medium">
                      {avatar.gender === 'boy' ? 'Boy Voice' : 'Girl Voice'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                variant="success"
                size="lg"
                onClick={handleContinue}
                disabled={!selectedAvatarId || loading}
                className="px-16 py-4 text-xl"
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Starting Adventure...
                  </>
                ) : (
                  <>
                    Start My Python Journey! 🚀
                  </>
                )}
              </Button>
            </motion.div>
            
            {selectedAvatarId && (
              <motion.p
                className="text-purple-200 mt-4 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Great choice! {avatars.find(a => a.id === selectedAvatarId)?.name} is excited to teach you Python! 🎉
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AvatarSelection;