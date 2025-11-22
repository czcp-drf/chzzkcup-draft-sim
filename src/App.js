import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SimulationMode from './pages/SimulationMode';
import TierRanking from './pages/TierRanking';
import MockDraft from './pages/MockDraft';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SimulationMode />} />
            <Route path="/tier" element={<TierRanking />} />
            <Route path="/mock" element={<MockDraft />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
