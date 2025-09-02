import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Button from './Button';

interface VoiceOverPlayerProps {
  text: string;
  avatarGender: 'boy' | 'girl';
  autoPlay?: boolean;
}

function VoiceOverPlayer({ text, avatarGender, autoPlay = false }: VoiceOverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const speak = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      utterance.rate = 0.9;
      utterance.pitch = avatarGender === 'girl' ? 1.6 : 0.7;
      utterance.volume = isMuted ? 0 : volume;
      const voices = speechSynthesis.getVoices();
      let preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('child') ||
        voice.name.toLowerCase().includes('kid')
      );
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (avatarGender === 'girl' 
            ? (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('zira')) 
            : (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('david')))
        );
      }
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        startProgressTracking();
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        stopProgressTracking();
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
    const wordsPerMinute = avatarGender === 'girl' ? 140 : 130;
    const words = text.split(' ').length;
    const estimatedDuration = (words / wordsPerMinute) * 60 * 1000;
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
      speechSynthesis.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    } else if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    } else {
      pausedTimeRef.current = 0;
      speak();
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (utteranceRef.current && isPlaying) {
      speechSynthesis.cancel();
      setTimeout(() => {
        pausedTimeRef.current = (progress / 100) * ((text.split(' ').length / (avatarGender === 'girl' ? 140 : 130)) * 60 * 1000);
        speak();
      }, 100);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    if (utteranceRef.current && isPlaying) {
      speechSynthesis.cancel();
      setTimeout(() => {
        pausedTimeRef.current = (progress / 100) * ((text.split(' ').length / (avatarGender === 'girl' ? 140 : 130)) * 60 * 1000);
        speak();
      }, 100);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
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
            animate={isPlaying && !isPaused ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.2, repeat: isPlaying && !isPaused ? Infinity : 0, ease: "easeInOut" }}
          >
            {getVolumeIcon()}
          </motion.div>
          <div>
            <span className="text-white font-bold text-xl">Listen & Learn! 🎧</span>
            <div className="text-purple-200 text-base">
              {progress >= 100 ? 'Completed! ✅' : 
               isPaused ? 'Paused ⏸️' :
               isPlaying ? 'Playing... 🔊' : 'Ready to play 🎵'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
            {getVolumeIcon()}
          </Button>
        </div>
      </div>
      <div className="w-full bg-white/20 rounded-full h-4 mb-6 shadow-inner overflow-hidden">
        <motion.div
          className="h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.5 }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <VolumeX className="w-5 h-5 text-purple-300" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        <Volume2 className="w-5 h-5 text-purple-300" />
        <span className="text-purple-200 text-base font-medium min-w-[4rem]">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

export default VoiceOverPlayer;