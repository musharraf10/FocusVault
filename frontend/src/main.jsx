import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import ErrorBoundary from './components/ui/ErrorBoundry.jsx';
import './index.css';
import { FeedbackProvider } from './context/FeedbackContext.jsx';
import { setupAxios } from './services/apiServices';


// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        if ('SyncManager' in window) {
          registration.sync.register('sync-session').then(() => {
            console.log('Background sync registered for session saves');
          }).catch((error) => {
            console.error('Background sync registration failed:', error);
          });
        }
      })
      .catch((registrationError) => {
        console.error('Service Worker registration failed:', registrationError);
      });
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}


setupAxios();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>

            <StudyProvider>
              <ChatProvider>
                <FeedbackProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </FeedbackProvider>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#1F2937',
                      color: '#F9FAFB',
                      borderRadius: '12px',
                      padding: '12px 16px'
                    }
                  }}
                />
              </ChatProvider>
            </StudyProvider>

          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);