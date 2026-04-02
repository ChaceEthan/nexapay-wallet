import { useState } from 'react';

const DepositComponent = () => {
  const [formData, setFormData] = useState({
    walletAddress: '',
    amount: '',
    currency: 'USD',
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

    if (!formData.walletAddress || !formData.amount) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const url = `${import.meta.env.VITE_API_URL}/deposit`;

    try {
      // Mock deposit
      setSuccessMessage('Deposit successful!');
      setFormData({ walletAddress: '', amount: '', currency: 'USD' });
    } catch (err) {
      console.error('Deposit error:', err);
      setError('Network error or server is unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Deposit Funds</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Wallet Address</label>
          <input
            type="text"
            name="walletAddress"
            value={formData.walletAddress}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="GXXXXXXX..."
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {successMessage && <p className="text-green-400 text-xs">{successMessage}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? 'Processing...' : 'Deposit'}
        </button>
      </form>
    </div>
  );
};

export default DepositComponent;