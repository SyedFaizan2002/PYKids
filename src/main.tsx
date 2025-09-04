import React from 'react';
     import { createRoot } from 'react-dom/client';
     import { BrowserRouter } from 'react-router-dom';
     import App from './App.tsx';
     import { AuthProvider } from './contexts/AuthContext.tsx';
     import { UserProvider } from './contexts/UserContext.tsx';
     import './index.css';

     const root = createRoot(document.getElementById('root')!);
     root.render(
       <React.StrictMode>
         <BrowserRouter>
           <AuthProvider>
             <UserProvider>
               <App />
             </UserProvider>
           </AuthProvider>
         </BrowserRouter>
       </React.StrictMode>
     );