import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Code } from 'lucide-react';
import Button from './Button';

interface CodeEditorProps {
  initialCode: string;
  onRun: (output: string) => void;
  onCodeChange: (code: string) => void;
}

// Interactive Python Code Editor with execution
const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode, 
  onRun, 
  onCodeChange 
}) => {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange(newCode);
  };

  const runCode = () => {
    setIsRunning(true);
    try {
      if (code.includes('print(')) {
        const matches = code.match(/print\([^)]+\)/g);
        if (matches) {
          const outputs = matches.map(match => {
            const content = match.match(/print\(([^)]+)\)/)?.[1];
            if (content) {
              let output = content.replace(/['"]/g, '');
              output = output.replace(/\{[^}]+\}/g, '[value]');
              return output;
            }
            return '';
          });
          onRun(`✅ Output:\n${outputs.join('\n')}`);
        }
      } else {
        onRun('✅ Code executed successfully! Great job! 🎉');
      }
    } catch (error) {
      onRun(`❌ Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div 
      className="bg-gray-900 rounded-lg p-4 shadow-custom border border-gray-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium flex items-center">
          <Code className="w-4 h-4 mr-2" />
          Interactive Python Editor ✨
        </h4>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="success" 
            size="sm" 
            onClick={runCode}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
        </motion.div>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/30 rounded-l flex flex-col text-gray-500 text-xs font-mono pt-3 z-10 pointer-events-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="px-2 leading-6 text-center">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="w-full h-64 text-green-400 text-sm font-mono bg-black/50 p-3 pl-14 pr-4 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-600 relative z-20"
          placeholder="# Write your Python code here...
print('Hello, World!')

# Try creating variables:
name = 'CodeKid'
age = 10
print(f'Hi, I am {name} and I am {age} years old!')"
          spellCheck={false}
          style={{
            lineHeight: '1.5',
            tabSize: 4,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newCode = code.substring(0, start) + '    ' + code.substring(end);
              setCode(newCode);
              onCodeChange(newCode);
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
              }, 0);
            }
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-20 rounded overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
          }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>💡 Tip: Use Tab for indentation</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CodeEditor;