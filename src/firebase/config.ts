import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCqpgffJpT7SpGtS2SdRqu39_M5Rc2XVYY",
  authDomain: "pykids-f144c.firebaseapp.com",
  projectId: "pykids-f144c",
  storageBucket: "pykids-f144c.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { auth, googleProvider };