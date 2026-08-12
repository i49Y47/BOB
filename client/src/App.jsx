import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddRecord from './pages/AddRecord';
import SearchRecord from './pages/SearchRecord';
import { Database, Search } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen p-8 flex flex-col items-center">
        {/* Header / Navbar */}
        <nav className="clay-card w-full max-w-4xl p-4 flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <img 
              src="/Bank-of-Baroda-icon.png" 
              alt="Bank of Baroda Logo" 
              className="h-10 object-contain drop-shadow-md"
            />
            <h1 className="text-2xl font-bold text-[var(--bob-blue)]">Record Room Manager</h1>
          </div>
          <div className="flex gap-4">
            <Link to="/add">
              <button className="clay-btn clay-btn-blue px-6 py-2 flex items-center gap-2">
                <Database size={18} />
                <span>Add Record</span>
              </button>
            </Link>
            <Link to="/">
              <button className="clay-btn clay-btn-orange px-6 py-2 flex items-center gap-2">
                <Search size={18} />
                <span>Search</span>
              </button>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="w-full max-w-4xl">
          <Routes>
            <Route path="/" element={<SearchRecord />} />
            <Route path="/add" element={<AddRecord />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
