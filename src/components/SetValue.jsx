import { useState } from 'react';

const SetValue = () => {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.key || !formData.value) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    let parsedValue;
    try {
      parsedValue = JSON.parse(formData.value);
    } catch {
      setError('Invalid JSON format');
      setLoading(false);
      return;
    }

    const url = `${import.meta.env.VITE_API_URL}/set_value`;

    try {
      // Mock set value
      setSuccessMessage('Value set successfully!');
      setFormData({ key: '', value: '' });
    } catch (err) {
      console.error('SetValue error:', err);
      setError('Network error or server is unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Set Value</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Key</label>
          <input
            type="text"
            name="key"
            value={formData.key}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="myKey"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Value (JSON)</label>
          <textarea
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder='{"key":"value"}'
            rows="3"
            required
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {successMessage && <p className="text-green-400 text-xs">{successMessage}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? 'Setting...' : 'Set Value'}
        </button>
      </form>
    </div>
  );
};

export default SetValue;