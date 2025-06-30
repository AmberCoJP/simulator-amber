import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.tsx';
import DataEntry from './pages/DataEntry.tsx';
import SimulationForm from './pages/SimulationForm.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/simulation-form" element={<SimulationForm />} />
      </Routes>
    </Router>
  );
};

export default App; 