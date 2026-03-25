import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './components/homepages/homepage';
import EventLoading from './components/loading/EventLoading';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {isLoading ? <EventLoading /> : <HomePage />}
    </div>
  );
}

export default App;
