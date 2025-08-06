import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Volume as VolumeOff, Volume1 } from 'lucide-react';
import Button from './Button';

interface VoiceOverPlayerProps {
  text: string;
  avatarGender: 'boy' | 'girl';
  onComplete?: () => void;
  autoPlay?: boolean;
}

function VoiceOverPlayer({ text, avatarGender, onComplete, autoPlay = false }: VoiceOverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const speak = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Configure voice based on avatar gender - kid-friendly settings
      utterance.rate = 0.9; // Slightly slower for kids to follow along
      utterance.pitch = avatarGender === 'girl' ? 1.6 : 0.7; // Higher pitch for girls, lower for boys
      utterance.volume = isMuted ? 0 : volume;
      
      // Try to find a child-like or appropriate voice
      const voices = speechSynthesis.getVoices();
      let preferredVoice = null;
      
      // Look for child voices first
      preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('child') ||
        voice.name.toLowerCase().includes('kid')
      );
      
      // If no child voice, look for gender-appropriate voices
      if (!preferredVoice) {
        if (avatarGender === 'girl') {
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('susan')
          );
        } else {
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') ||
            voice.name.toLowerCase().includes('man') ||
            voice.name.toLowerCase().includes('boy') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('mark')
          );
        }
      }
      
      // Use English voices as fallback
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (avatarGender === 'girl' ? 
            (voice.name.includes('Female') || voice.name.includes('female')) : 
            (voice.name.includes('Male') || voice.name.includes('male'))
          )
        );
      }
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsCompleted(false);
        startTimeRef.current = Date.now();
        startProgressTracking();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setIsCompleted(true);
        stopProgressTracking();
        onComplete?.();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        stopProgressTracking();
      };

      speechSynthesis.speak(utterance);
    }
  };

  const startProgressTracking = () => {
    // Estimate duration based on text length and speech rate
    const wordsPerMinute = avatarGender === 'girl' ? 140 : 130; // Slightly different for different voices
    const words = text.split(' ').length;
    const estimatedDuration = (words / wordsPerMinute) * 60 * 1000; // Convert to milliseconds
    
    let elapsed = pausedTimeRef.current;
    
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        elapsed += 100;
        const progressPercent = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(progressPercent);
        
        if (progressPercent >= 100) {
          stopProgressTracking();
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (isPlaying && !isPaused) {
      // Pause
      speechSynthesis.pause();
      setIsPaused(true);
      pausedTimeRef.current = (Date.now() - startTimeRef.current);
    } else if (isPaused) {
      // Resume
      speechSynthesis.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    } else {
      // Start new
      pausedTimeRef.current = 0;
      speak();
    }
  };

  const stopPlayback = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    stopProgressTracking();
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (utteranceRef.current && isPlaying) {
      // Update volume immediately for current utterance
      const currentProgress = progress;
      speechSynthesis.cancel();
      setTimeout(() => {
        pausedTimeRef.current = (currentProgress / 100) * ((text.split(' ').length / 140) * 60 * 1000);
        speak();
      }, 100);
    }
  };

  const restart = () => {
    speechSynthesis.cancel();
    setProgress(0);
    setIsPlaying(false);
    setIsPaused(false);
    setIsCompleted(false);
    pausedTimeRef.current = 0;
    stopProgressTracking();
    setTimeout(speak, 100);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    
    // Update current playback volume if playing
    if (utteranceRef.current && isPlaying) {
      const currentProgress = progress;
      speechSynthesis.cancel();
      setTimeout(() => {
        pausedTimeRef.current = (currentProgress / 100) * ((text.split(' ').length / 140) * 60 * 1000);
        speak();
      }, 100);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  useEffect(() => {
    if (autoPlay) {
      setTimeout(speak, 500);
    }
    
    return () => {
      speechSynthesis.cancel();
      stopProgressTracking();
    };
  }, [text, autoPlay]);

  useEffect(() => {
    // Load voices when component mounts
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        speechSynthesis.getVoices();
      };
      
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return (
    <motion.div
      className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-3xl p-8 mb-8 border-2 border-purple-400/30 shadow-custom"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.div 
            className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-custom"
            animate={isPlaying && !isPaused ? { 
              scale: [1, 1.15, 1],
              boxShadow: [
                "0 0 0 0 rgba(168, 85, 247, 0.4)",
                "0 0 0 15px rgba(168, 85, 247, 0.1)",
                "0 0 0 0 rgba(168, 85, 247, 0)"
              ]
            } : {}}
            transition={{ 
              duration: 1.2, 
              repeat: isPlaying && !isPaused ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {getVolumeIcon()}
          </motion.div>
          <div>
            <span className="text-white font-bold text-xl">Listen & Learn! 🎧</span>
            <div className="text-purple-200 text-base">
              {isCompleted ? 'Completed! ✅' : 
               isPaused ? 'Paused ⏸️' :
               isPlaying ? 'Playing... 🔊' : 'Ready to play 🎵'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={restart} disabled={isPlaying && !isPaused}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button 
            variant={isPlaying && !isPaused ? "danger" : "success"} 
            size="md" 
            onClick={togglePlayback}
            className="px-6"
          >
            {isPlaying && !isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="ml-2">
              {isPlaying && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Play'}
            </span>
          </Button>
          <Button variant="secondary" size="sm" onClick={toggleMute}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          {isPlaying && (
            <Button variant="danger" size="sm" onClick={stopPlayback}>
              Stop
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/20 rounded-full h-4 mb-6 shadow-inner overflow-hidden">
        <motion.div
          className={`h-4 rounded-full shadow-lg ${
            isCompleted 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 0.5
          }}
        />
      </div>
      
      {/* Volume Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <VolumeOff className="w-5 h-5 text-purple-300" />
        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
        <Volume2 className="w-5 h-5 text-purple-300" />
        <span className="text-purple-200 text-base font-medium min-w-[4rem]">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
      
      {/* Completion Status */}
      {isCompleted && (
        <motion.div
          className="text-center p-4 bg-green-500/20 rounded-2xl border border-green-400/50 shadow-glow-green"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: 0.6
          }}
        >
          <motion.div
            className="text-green-400 font-bold text-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉 Voice-over completed! You can now continue to the next section.
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default VoiceOverPlayer;