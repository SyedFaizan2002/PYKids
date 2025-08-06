import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  LogOut, 
  Settings,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { avatars } from '../data/avatars';
import Button from './Button';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarChange: () => void;
  onLogout: () => void;
}

function ProfileSidebar({ isOpen, onClose, onAvatarChange, onLogout }: ProfileSidebarProps) {
  const { currentUser } = useAuth();
  const { userData } = useUser();

  const getUserDisplayName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'PyKIDS Learner';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white/10 backdrop-blur-lg shadow-custom border-l border-white/20 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-custom"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <User className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">My Profile</h2>
                    <p className="text-purple-200 text-sm">Manage your account</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* User Info */}
              <div className="mb-8">
                {/* Avatar Display */}
                {userData?.selectedAvatar && (
                  <motion.div
                    className="text-center mb-6 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-400/30"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <motion.div 
                      className="text-6xl mb-3"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {userData.selectedAvatar.avatar}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {userData.selectedAvatar.name}
                    </h3>
                    <p className="text-purple-200 text-sm">
                      Your AI Tutor ({userData.selectedAvatar.personality})
                    </p>
                  </motion.div>
                )}

                {/* User Details */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <User className="w-5 h-5 text-purple-300" />
                    <div>
                      <div className="text-purple-200 text-sm">Name</div>
                      <div className="text-white font-medium text-base break-words">{getUserDisplayName()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <Mail className="w-5 h-5 text-purple-300" />
                    <div>
                      <div className="text-purple-200 text-sm">Email</div>
                      <div className="text-white font-medium text-base break-words">{currentUser?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-purple-200 text-sm">Total Score</div>
                      <div className="text-white font-medium text-base">{userData?.totalScore || 0} points</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onAvatarChange}
                  className="w-full"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Change Avatar
                </Button>

                <Button
                  variant="danger"
                  size="lg"
                  onClick={onLogout}
                  className="w-full"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export default ProfileSidebar