import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.tsx';
import DataEntry from './pages/DataEntry.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/data-entry" element={<DataEntry />} />
      </Routes>
    </Router>
  );
};

export default App; 