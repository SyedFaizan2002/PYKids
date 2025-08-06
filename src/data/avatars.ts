export interface Avatar {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  color: string;
  personality: string;
  description: string;
  avatar: string;
}

export const avatars: Avatar[] = [
  {
    id: 'leo',
    name: 'Leo',
    gender: 'boy',
    color: 'from-blue-500 to-cyan-500',
    personality: 'friendly and encouraging',
    description: 'Leo loves solving puzzles and making coding fun!',
    avatar: '👦🏻'
  },
  {
    id: 'alex',
    name: 'Alex',
    gender: 'boy', 
    color: 'from-green-500 to-emerald-500',
    personality: 'creative and adventurous',
    description: 'Alex enjoys building cool projects and exploring new ideas!',
    avatar: '👦🏽'
  },
  {
    id: 'mia',
    name: 'Mia',
    gender: 'girl',
    color: 'from-purple-500 to-pink-500', 
    personality: 'patient and helpful',
    description: 'Mia is great at explaining things step by step!',
    avatar: '👧🏻'
  },
  {
    id: 'emma',
    name: 'Emma',
    gender: 'girl',
    color: 'from-pink-500 to-rose-500',
    personality: 'energetic and motivating',
    description: 'Emma makes learning Python feel like playing games!',
    avatar: '👧🏾'
  }
];