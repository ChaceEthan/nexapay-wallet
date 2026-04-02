import { useState } from 'react';

const GetValue = () => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [value, setValue] = useState(null);

  const handleKeyChange = (e) => {
    setKey(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValue(null);

    if (!key) {
      setError('Please enter a key');
      setLoading(false);
      return;
    }

    const url = `${import.meta.env.VITE_API_URL}/get_value/${key}`;

    try {
      // Mock get value
      const mockData = { message: 'Hello from NexaPay!', timestamp: new Date().toISOString() };
      setValue(mockData);
    } catch (err) {
      console.error('GetValue error:', err);
      setError('Network error or server is unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Get Value</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Key</label>
          <input
            type="text"
            placeholder="myKey"
            value={key}
            onChange={handleKeyChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            required
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? 'Getting...' : 'Get Value'}
        </button>
      </form>
      {value !== null && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Value:</h4>
          <pre className="text-xs text-green-400 overflow-auto max-h-32 font-mono">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GetValue;