import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, MapPin } from 'lucide-react';
import clsx from 'clsx';

export default function SearchRecord() {
  const [accountNumber, setAccountNumber] = useState('071881000');
  const [moduleType, setModuleType] = useState('BC Module');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleModuleChange = (e) => {
    const newModule = e.target.value;
    setModuleType(newModule);
    if (newModule === 'BC Module') {
      setAccountNumber('071881000');
    } else {
      setAccountNumber('');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    setStatus({ type: 'loading', message: '' });
    setResult(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      const response = await axios.get(`${API_URL}/api/records/search`, {
        params: { accountNumber: accountNumber.trim(), moduleType }
      });
      setResult(response.data);
      setStatus({ type: 'success', message: 'Record(s) found!' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Record not found' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="clay-card p-8">
        <h2 className="text-2xl font-bold text-[var(--bob-blue)] mb-6 flex items-center gap-2">
          <Search className="text-[var(--bob-orange)]" />
          Find a Record
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 flex-grow">
            <label className="font-semibold text-gray-700">Module Type</label>
            <select 
              value={moduleType} 
              onChange={handleModuleChange}
              className="clay-input"
            >
              <option value="BC Module">BC Module</option>
              <option value="SB Account Openings">SB Account Openings</option>
              <option value="Vouchers Files">Vouchers Files</option>
              <option value="KCC files">KCC Files</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2 flex-grow">
            <label className="font-semibold text-gray-700">Account Number</label>
            <input 
              type="text" 
              value={accountNumber} 
              onChange={(e) => setAccountNumber(e.target.value)}
              className="clay-input"
              placeholder="Enter account number (leave empty for all)"
            />
          </div>

          <button 
            type="submit" 
            disabled={status.type === 'loading'}
            className="clay-btn clay-btn-blue px-8 py-3 mb-[2px] h-[48px] flex items-center justify-center min-w-[120px]"
          >
            {status.type === 'loading' ? <Loader2 className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {status.type === 'error' && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-xl text-center font-medium">
            {status.message}
          </div>
        )}
      </div>

      {result && result.type === 'exact' && (() => {
        const exactResult = result.data;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">
            
            {/* Details Card */}
            <div className="clay-card p-8 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4 flex items-center gap-2">
                <MapPin className="text-[var(--bob-orange)]" /> Record Index Details
              </h3>
              
              <div className="space-y-4 text-lg">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/40">
                  <span className="text-gray-500 font-medium">Module</span>
                  <span className="font-bold text-[var(--bob-blue)]">{exactResult.moduleType}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/40">
                  <span className="text-gray-500 font-medium">Row Position</span>
                  <span className={clsx(
                    "font-bold px-3 py-1 rounded-full text-sm",
                    exactResult.position === 'front' ? "bg-orange-100 text-[var(--bob-orange)]" : "bg-blue-100 text-[var(--bob-blue)]"
                  )}>
                    {exactResult.position === 'front' ? 'FRONT ROW' : 'REAR ROW'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/40">
                  <span className="text-gray-500 font-medium">File Tag</span>
                  <span className="font-bold text-[var(--bob-orange)]">{exactResult.fileTag}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/40">
                  <span className="text-gray-500 font-medium">Rack ID</span>
                  <span className="font-bold text-gray-800 text-2xl">{exactResult.rackId}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/40">
                  <span className="text-gray-500 font-medium">Shelf ID</span>
                  <span className="font-bold text-gray-800 text-2xl">{exactResult.shelfId}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bob-blue)] text-white shadow-md">
                  <span className="font-medium text-blue-100">Record Index</span>
                  <span className="font-bold text-2xl">
                    {exactResult.accountNumbers ? exactResult.accountNumbers.indexOf(accountNumber.trim()) + 1 : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rack Visualizer */}
            <div className="clay-card p-8 bg-[#e6ecf2] flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-700 mb-6 text-center">Visual Position</h3>
              
              <div className="relative bg-gray-800 rounded-lg p-2 w-full max-w-[240px] shadow-2xl border-4 border-gray-700 mt-4">
                {/* Rack Label */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg whitespace-nowrap">
                  RACK: {exactResult.rackId}
                </div>

                {/* Generate 5 shelves visually from top to bottom (Top is 0) */}
                {(() => {
                  const startShelf = Math.max(0, exactResult.shelfId > 3 ? exactResult.shelfId - 2 : 0);
                  const shelves = Array.from({length: 5}, (_, i) => startShelf + i);
                  
                  return shelves.map((shelfIndex) => {
                    const isTargetSlab = shelfIndex === exactResult.shelfId;
                    
                    return (
                      <div key={shelfIndex} className="relative mb-6 last:mb-0">
                        {/* Slab Base */}
                        <div className={clsx(
                          "h-3 w-full rounded-sm shadow-md mt-12",
                          isTargetSlab ? "bg-[var(--bob-orange)]" : "bg-gray-400"
                        )}></div>
                        
                        {/* File Visualization on Slab */}
                        {isTargetSlab && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end h-12 w-full">
                            
                            {/* Rear Position Indicator */}
                            <div className={clsx(
                              "absolute w-16 h-10 rounded-t-sm border-2 border-dashed transition-all",
                              exactResult.position === 'rear' ? "bg-blue-200 border-blue-500 z-10 bottom-2" : "bg-transparent border-gray-400 opacity-30 bottom-2"
                            )}>
                              {exactResult.position === 'rear' && <div className="text-[10px] text-center mt-1 font-bold text-blue-800">REAR</div>}
                            </div>

                            {/* Front Position Indicator */}
                            <div className={clsx(
                              "absolute w-20 h-8 rounded-t-sm border-2 transition-all",
                              exactResult.position === 'front' ? "bg-orange-200 border-orange-500 shadow-lg z-20 bottom-0" : "bg-transparent border-dashed border-gray-400 opacity-30 bottom-0 z-20"
                            )}>
                              {exactResult.position === 'front' && <div className="text-[10px] text-center mt-1 font-bold text-orange-800">FRONT</div>}
                            </div>
                          </div>
                        )}

                        {/* Empty files for non-target slabs for visual context */}
                        {!isTargetSlab && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                            <div className="w-2 h-8 bg-gray-500/50 rounded-sm"></div>
                            <div className="w-2 h-8 bg-gray-500/50 rounded-sm"></div>
                            <div className="w-2 h-8 bg-gray-500/50 rounded-sm translate-y-1 rotate-12"></div>
                          </div>
                        )}

                        {/* Shelf Number Label */}
                        <div className={clsx(
                          "absolute -left-8 bottom-4 text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap",
                          isTargetSlab ? "text-[var(--bob-orange)] bg-orange-100" : "text-gray-500 bg-gray-200"
                        )}>
                          SHELF: {shelfIndex}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <p className="text-sm text-gray-500 mt-6 text-center">
                Navigate to Rack {exactResult.rackId}, locate Shelf {exactResult.shelfId}, and look in the {exactResult.position} row.
              </p>
            </div>
          </div>
        );
      })()}

      {result && (result.type === 'all' || result.type === 'partial') && (
        <div className="clay-card p-8 animate-in fade-in zoom-in duration-500 mt-8">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4 flex items-center gap-2">
            <Search className="text-[var(--bob-orange)]" /> Search Results
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 border-b">Rack ID</th>
                  <th className="p-3 border-b">Shelf ID</th>
                  <th className="p-3 border-b">File Tag</th>
                  <th className="p-3 border-b">Row Position</th>
                  {result.type === 'all' ? (
                    <th className="p-3 border-b">Total Account Numbers</th>
                  ) : (
                    <th className="p-3 border-b">Account Number</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {result.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{item.rackId}</td>
                    <td className="p-3">{item.shelfId}</td>
                    <td className="p-3 text-[var(--bob-orange)] font-medium">{item.fileTag}</td>
                    <td className="p-3">
                      <span className={clsx(
                        "font-bold px-2 py-1 rounded-full text-xs",
                        item.position === 'front' ? "bg-orange-100 text-[var(--bob-orange)]" : "bg-blue-100 text-[var(--bob-blue)]"
                      )}>
                        {item.position === 'front' ? 'FRONT ROW' : 'REAR ROW'}
                      </span>
                    </td>
                    {result.type === 'all' ? (
                      <td className="p-3 font-bold text-[var(--bob-blue)]">{item.totalAccounts}</td>
                    ) : (
                      <td className="p-3 font-bold text-[var(--bob-blue)]">{item.accountNumber}</td>
                    )}
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
