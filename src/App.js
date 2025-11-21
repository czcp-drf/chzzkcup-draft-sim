import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SimulationMode from './pages/SimulationMode';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SimulationMode />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
