import React from 'react';
import { motion } from 'framer-motion';

interface LessonAnimationProps {
  type: 'programming' | 'python' | 'highlevel' | 'variables' | 'datatypes' | 'strings' | 'lists' | 'tuples' | 'conditions' | 'loops';
  className?: string;
}

function LessonAnimation({ type, className = '' }: LessonAnimationProps) {
  const animations = {
    programming: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center overflow-hidden ${className}`}>
        {/* Background particles */}
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        <motion.div
          className="text-6xl z-10"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          🤖
        </motion.div>
        <motion.div
          className="absolute top-4 left-4 text-2xl z-10"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 15, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >
          📝
        </motion.div>
        <motion.div
          className="absolute bottom-4 right-4 text-2xl z-10"
          animate={{ 
            x: [0, 15, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
        >
          ⚡
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Programming is like...</h3>
            <p className="text-purple-200">Giving step-by-step instructions!</p>
          </div>
        </div>
      </div>
    ),
    
    python: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center ${className}`}>
        <motion.div
          className="text-8xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 8, -8, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          🐍
        </motion.div>
        <motion.div
          className="absolute top-6 left-6 text-3xl"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 360],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute bottom-6 right-6 text-3xl"
          animate={{ 
            scale: [1, 1.4, 1],
            rotate: [0, -360],
            y: [0, -10, 0]
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
        >
          🚀
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center mt-20">
            <h3 className="text-2xl font-bold mb-2">Meet Python! 🐍</h3>
            <p className="text-green-200">Your friendly coding companion!</p>
          </div>
        </div>
      </div>
    ),
    
    highlevel: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl ${className}`}>
        <div className="flex h-full">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
            <motion.div
              className="text-4xl mb-4"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              😰
            </motion.div>
            <div className="text-white text-center">
              <h4 className="font-bold text-red-300">Low-Level (Hard!)</h4>
              <p className="text-xs text-red-200">Walk 50 steps north...</p>
              <p className="text-xs text-red-200">Turn 90 degrees right...</p>
              <p className="text-xs text-red-200">Walk 23 steps east...</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              className="text-4xl mb-4"
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0],
                y: [0, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              😊
            </motion.div>
            <div className="text-white text-center">
              <h4 className="font-bold text-green-300">High-Level (Easy!)</h4>
              <p className="text-sm text-green-200">"Go to Sarah's house"</p>
              <motion.div
                className="text-2xl mt-2"
                animate={{ 
                  scale: [1, 1.4, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              >
                ✨
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    variables: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-2xl flex items-center justify-center ${className}`}>
        <motion.div
          className="text-6xl"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 8, -8, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📦
        </motion.div>
        <motion.div
          className="absolute top-4 right-4 text-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 8, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >
          🐕
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center mt-16">
            <h3 className="text-2xl font-bold mb-2">Variables = Magic Boxes! 📦</h3>
            <p className="text-orange-200">Store your treasures inside!</p>
            <motion.div
              className="text-lg mt-2 font-mono bg-black/30 px-3 py-1 rounded"
              animate={{ 
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              pet_name = "Buddy"
            </motion.div>
          </div>
        </div>
      </div>
    ),
    
    datatypes: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-2xl overflow-hidden ${className}`}>
        {/* Background shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: [-100, 400] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="grid grid-cols-2 gap-4 p-6 h-full relative z-10">
          <motion.div
            className="bg-white/10 rounded-xl p-4 text-center shadow-custom"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="text-white font-bold">String</div>
            <div className="text-cyan-200 text-sm">"Hello!"</div>
          </motion.div>
          <motion.div
            className="bg-white/10 rounded-xl p-4 text-center shadow-custom"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <div className="text-3xl mb-2">🔢</div>
            <div className="text-white font-bold">Integer</div>
            <div className="text-cyan-200 text-sm">42</div>
          </motion.div>
          <motion.div
            className="bg-white/10 rounded-xl p-4 text-center shadow-custom"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-white font-bold">Float</div>
            <div className="text-cyan-200 text-sm">3.14</div>
          </motion.div>
          <motion.div
            className="bg-white/10 rounded-xl p-4 text-center shadow-custom"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="text-white font-bold">Boolean</div>
            <div className="text-cyan-200 text-sm">True</div>
          </motion.div>
        </div>
      </div>
    ),
    
    strings: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center ${className}`}>
        <motion.div
          className="text-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-4xl mb-4">🎪</div>
          <div className="text-white text-2xl font-bold mb-4">String Magic!</div>
          <motion.div
            className="flex items-center justify-center space-x-2 text-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.span
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, 0]
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            >
              🎉
            </motion.span>
            <motion.span className="text-white">+</motion.span>
            <motion.span
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, -15, 0]
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            >
              🎈
            </motion.span>
            <motion.span className="text-white">=</motion.span>
            <motion.span
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 20, 0]
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            >
              🎊
            </motion.span>
          </motion.div>
          <div className="text-pink-200 mt-4 font-mono bg-black/30 px-3 py-1 rounded">
            "Hello" + " " + "World!"
          </div>
        </motion.div>
      </div>
    ),
    
    lists: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl flex items-center justify-center ${className}`}>
        <motion.div
          className="text-6xl"
          animate={{ 
            rotate: [0, 12, -12, 0],
            scale: [1, 1.1, 1],
            y: [0, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🧸
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center mt-20">
            <h3 className="text-2xl font-bold mb-2">Lists = Toy Boxes! 🧸</h3>
            <div className="flex justify-center space-x-2 text-lg">
              <motion.span
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 10, 0]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              >
                🍪
              </motion.span>
              <motion.span
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, -10, 0]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              >
                🍟
              </motion.span>
              <motion.span
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 15, 0]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              >
                🍭
              </motion.span>
            </div>
            <div className="text-green-200 mt-2 font-mono bg-black/30 px-3 py-1 rounded text-sm">
              snacks = ["cookies", "chips", "candy"]
            </div>
          </div>
        </div>
      </div>
    ),
    
    tuples: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl ${className}`}>
        <div className="flex h-full">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-white/20">
            <motion.div
              className="text-4xl mb-4"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear",
                repeatType: "loop"
              }}
            >
              🔒
            </motion.div>
            <div className="text-white text-center">
              <h4 className="font-bold text-yellow-300">Tuples</h4>
              <p className="text-xs text-yellow-200">Can't change!</p>
              <div className="text-xs font-mono bg-black/30 px-2 py-1 rounded mt-1">
                (3, 5)
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              className="text-4xl mb-4"
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🧠
            </motion.div>
            <div className="text-white text-center">
              <h4 className="font-bold text-blue-300">Dictionaries</h4>
              <p className="text-xs text-blue-200">Smart storage!</p>
              <div className="text-xs font-mono bg-black/30 px-2 py-1 rounded mt-1">
                &lbrace;'apple': 'red'&rbrace;
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    conditions: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl ${className}`}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                rotate: [0, 12, -12, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌦️
            </motion.div>
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-4">Make Decisions!</h3>
              <div className="flex justify-center space-x-8">
                <motion.div
                  className="text-center"
                  animate={{ 
                    y: [0, -8, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="text-3xl">☀️</div>
                  <div className="text-yellow-200 text-sm">Sunny → 😎</div>
                </motion.div>
                <motion.div
                  className="text-center"
                  animate={{ 
                    y: [0, -8, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="text-3xl">🌧️</div>
                  <div className="text-blue-200 text-sm">Rainy → ☂️</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    loops: (
      <div className={`relative w-full h-64 bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-2xl flex items-center justify-center ${className}`}>
        <motion.div
          className="text-6xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          🔁
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center mt-20">
            <h3 className="text-2xl font-bold mb-2">Loops = Repeat! 🔁</h3>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((num, index) => (
                <motion.div
                  key={num}
                  className="text-lg"
                  animate={{ 
                    y: [0, -12, 0],
                    scale: [1, 1.3, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                >
                  👋
                </motion.div>
              ))}
            </div>
            <div className="text-red-200 mt-2 font-mono bg-black/30 px-3 py-1 rounded text-sm">
              for i in range(5): print("Hi!")
            </div>
          </div>
        </div>
      </div>
    )
  };

  return animations[type] || null;
}

export default LessonAnimation;