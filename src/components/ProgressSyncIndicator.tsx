import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { SyncStatus } from '../services/ProgressPersistenceService';

interface ProgressSyncIndicatorProps {
  syncStatus: SyncStatus;
  lastSyncTime?: string | null;
  className?: string;
}

const ProgressSyncIndicator: React.FC<ProgressSyncIndicatorProps> = ({
  syncStatus,
  lastSyncTime,
  className = ''
}) => {
  const getStatusConfig = () => {
    if (!syncStatus.isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline - Progress saved locally',
        color: 'from-yellow-500 to-orange-500',
        textColor: 'text-yellow-100',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-400/30'
      };
    }

    if (syncStatus.isSyncing) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        text: `Syncing ${syncStatus.pendingCount} update${syncStatus.pendingCount !== 1 ? 's' : ''}...`,
        color: 'from-blue-500 to-cyan-500',
        textColor: 'text-blue-100',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-400/30'
      };
    }

    if (syncStatus.pendingCount > 0) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: `${syncStatus.pendingCount} update${syncStatus.pendingCount !== 1 ? 's' : ''} pending`,
        color: 'from-orange-500 to-red-500',
        textColor: 'text-orange-100',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-400/30'
      };
    }

    if (syncStatus.lastError) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Sync error - Will retry',
        color: 'from-red-500 to-pink-500',
        textColor: 'text-red-100',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-400/30'
      };
    }

    // All synced
    return {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Progress synced',
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-100',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30'
    };
  };

  const statusConfig = getStatusConfig();
  
  // Show indicator when there's something important to show
  const shouldShow = !syncStatus.isOnline || 
                    syncStatus.isSyncing || 
                    syncStatus.pendingCount > 0 || 
                    syncStatus.lastError ||
                    (syncStatus.lastSyncTime && Date.now() - new Date(syncStatus.lastSyncTime).getTime() < 3000);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`fixed top-4 right-4 z-50 ${className}`}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`${statusConfig.bgColor} backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border ${statusConfig.borderColor} max-w-xs`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`text-white p-1 rounded-full bg-gradient-to-r ${statusConfig.color}`}>
                {statusConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${statusConfig.textColor} block truncate`}>
                  {statusConfig.text}
                </span>
                {lastSyncTime && syncStatus.lastSyncTime && !syncStatus.isSyncing && (
                  <span className="text-xs text-white/60 block">
                    Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar for syncing */}
            {syncStatus.isSyncing && (
              <motion.div
                className="mt-2 w-full bg-white/20 rounded-full h-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressSyncIndicator;