import { useState } from 'react';
import axios from 'axios';
import { Save, AlertCircle } from 'lucide-react';

export default function AddRecord() {
  const [formData, setFormData] = useState({
    moduleType: 'BC Module',
    rackId: '',
    shelfId: '',
    position: 'front',
    fileTag: ''
  });

  const [entryMethod, setEntryMethod] = useState('custom');

  const [customAccounts, setCustomAccounts] = useState('');
  const [rangedAccounts, setRangedAccounts] = useState({
    prefix: '',
    start: '',
    end: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, payload: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRangedChange = (e) => {
    const { name, value } = e.target;
    setRangedAccounts(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Saving record...' });

    let accountNumbers = [];

    if (entryMethod === 'custom') {
      accountNumbers = customAccounts
        .split('\n')
        .map(acc => acc.trim())
        .filter(acc => acc.length > 0);
    } else {
      const startNum = parseInt(rangedAccounts.start, 10);
      const endNum = parseInt(rangedAccounts.end, 10);
      
      if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
        setStatus({ type: 'error', message: 'Invalid range' });
        return;
      }

      for (let i = startNum; i <= endNum; i++) {
        // padding logic if needed, but assuming prefix handles the base and range is appended
        accountNumbers.push(`${rangedAccounts.prefix}${i}`);
      }
    }

    try {
      const payload = {
        ...formData,
        shelfId: parseInt(formData.shelfId, 10),
        accountNumbers
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      await axios.post(`${API_URL}/api/records`, payload);
      setStatus({ type: 'success', message: 'Record saved successfully!' });
      
      // Reset form but keep rack/slab for quick entry
      setFormData(prev => ({ ...prev, fileTag: '' }));
      setCustomAccounts('');
      setRangedAccounts({ prefix: '', start: '', end: '' });
      
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      if (error.response?.status === 409) {
        setStatus({ type: '', message: '' });
        setDuplicateModal({ isOpen: true, payload: { ...formData, shelfId: parseInt(formData.shelfId, 10), accountNumbers } });
      } else {
        setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to save record' });
      }
    }
  };

  const handleModalAction = async (action) => {
    try {
      setStatus({ type: 'loading', message: `Processing ${action}...` });
      setDuplicateModal({ isOpen: false, payload: null });
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      await axios.post(`${API_URL}/api/records`, {
        ...duplicateModal.payload,
        action
      });
      
      setStatus({ type: 'success', message: `Record ${action}ed successfully!` });
      
      setFormData(prev => ({ ...prev, fileTag: '' }));
      setCustomAccounts('');
      setRangedAccounts({ prefix: '', start: '', end: '' });
      
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || `Failed to ${action} record` });
    }
  };

  return (
    <div className="clay-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-[var(--bob-blue)] mb-6 flex items-center gap-2">
        <Save className="text-[var(--bob-orange)]" />
        Add New Record
      </h2>

      {status.message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${
          status.type === 'error' ? 'bg-red-100 text-red-700' : 
          status.type === 'success' ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          <AlertCircle size={20} />
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Module Type</label>
            <select 
              name="moduleType" 
              value={formData.moduleType} 
              onChange={handleChange}
              className="clay-input"
            >
              <option value="BC Module">BC Module</option>
              <option value="SB Account Openings">SB Account Openings</option>
              <option value="Vouchers Files">Vouchers Files</option>
              <option value="KCC files">KCC Files</option>
              <option value="Personal Loan">Personal Loan</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">File Tag (e.g. BC 1)</label>
            <input 
              required
              type="text" 
              name="fileTag" 
              value={formData.fileTag} 
              onChange={handleChange}
              className="clay-input"
              placeholder="Enter file tag"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Rack ID (e.g. A1)</label>
            <input 
              required
              type="text" 
              name="rackId" 
              value={formData.rackId} 
              onChange={handleChange}
              className="clay-input"
              placeholder="e.g. A1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Shelf Number (Top is 0)</label>
            <input 
              required
              type="number" 
              name="shelfId" 
              min="0"
              value={formData.shelfId} 
              onChange={handleChange}
              className="clay-input"
              placeholder="e.g. 0"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-semibold text-gray-700">Position in Slab</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="position" 
                  value="front" 
                  checked={formData.position === 'front'} 
                  onChange={handleChange}
                  className="w-4 h-4 text-[var(--bob-orange)]"
                />
                Front Row (High Priority)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="position" 
                  value="rear" 
                  checked={formData.position === 'rear'} 
                  onChange={handleChange}
                  className="w-4 h-4 text-[var(--bob-blue)]"
                />
                Rear Row (Low Priority)
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2 mt-4 pt-4 border-t border-gray-200">
            <label className="font-semibold text-gray-700">File Type (Account Numbers)</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryMethod" 
                  value="custom" 
                  checked={entryMethod === 'custom'} 
                  onChange={(e) => setEntryMethod(e.target.value)}
                  className="w-4 h-4 text-[var(--bob-orange)]"
                />
                Custom (Manual entry)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryMethod" 
                  value="ranged" 
                  checked={entryMethod === 'ranged'} 
                  onChange={(e) => setEntryMethod(e.target.value)}
                  className="w-4 h-4 text-[var(--bob-blue)]"
                />
                Ranged (Consecutive)
              </label>
            </div>

            {entryMethod === 'custom' ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-500">Enter account numbers (one per line)</label>
                <textarea 
                  required
                  rows="5"
                  value={customAccounts}
                  onChange={(e) => setCustomAccounts(e.target.value)}
                  className="clay-input resize-none"
                  placeholder="07188100006420&#10;07188100006423&#10;..."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-500">Prefix</label>
                  <input 
                    required
                    type="text" 
                    name="prefix"
                    value={rangedAccounts.prefix}
                    onChange={handleRangedChange}
                    className="clay-input"
                    placeholder="e.g. 071881000"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-500">Range Start</label>
                  <input 
                    required
                    type="number" 
                    name="start"
                    value={rangedAccounts.start}
                    onChange={handleRangedChange}
                    className="clay-input"
                    placeholder="e.g. 24201"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-500">Range End</label>
                  <input 
                    required
                    type="number" 
                    name="end"
                    value={rangedAccounts.end}
                    onChange={handleRangedChange}
                    className="clay-input"
                    placeholder="e.g. 24250"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button 
            type="submit" 
            disabled={status.type === 'loading'}
            className="clay-btn clay-btn-orange px-8 py-3 text-lg"
          >
            {status.type === 'loading' ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

      {/* Duplicate Modal Overlay */}
      {duplicateModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="clay-card max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold">File Tag Already Exists!</h3>
            </div>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              A file with tag <strong className="text-gray-800">{duplicateModal.payload?.fileTag}</strong> already exists at this exact Rack and Shelf location. How would you like to proceed?
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleModalAction('append')}
                className="clay-btn clay-btn-blue w-full py-3 text-lg"
              >
                Append Missing Accounts
              </button>
              
              <button 
                onClick={() => handleModalAction('overwrite')}
                className="clay-btn bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.3),inset_1px_1px_3px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_14px_rgba(239,68,68,0.4),inset_1px_1px_3px_rgba(255,255,255,0.3)] hover:-translate-y-[1px] active:scale-[0.97] active:shadow-[0_2px_4px_rgba(239,68,68,0.3),inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-150 rounded-xl font-semibold py-3 text-lg"
              >
                Wipe & Overwrite Data
              </button>
              
              <button 
                onClick={() => setDuplicateModal({ isOpen: false, payload: null })}
                className="clay-btn mt-2 py-3 text-gray-600 border border-transparent hover:border-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
