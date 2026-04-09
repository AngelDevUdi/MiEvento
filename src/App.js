import React, { useState, useEffect } from 'react';
import HomePage from './components/homepages/homepage';
import MyProfile from './components/myprofile/myprofile';
import EventLoading from './components/loading/EventLoading';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {isLoading ? (
        <EventLoading />
      ) : currentView === 'home' ? (
        <HomePage onViewChange={setCurrentView} />
      ) : (
        <MyProfile onViewChange={setCurrentView} />
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
