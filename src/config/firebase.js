import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyD5HLvzfvfqQZO_hTYtLqH66ZRYnHVMC74",
  authDomain: "ph-a10.firebaseapp.com",
  projectId: "ph-a10",
  storageBucket: "ph-a10.firebasestorage.app",
  messagingSenderId: "817451560258",
  appId: "1:817451560258:web:1e83a1c19ed8ffda326cdb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
