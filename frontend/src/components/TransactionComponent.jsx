import { useState } from 'react';
import { sendTransaction } from '../services/stellar';

const TransactionComponent = () => {
  const [formData, setFormData] = useState({ toWallet: '', amount: '' });
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

    const amountNum = parseFloat(formData.amount);

    if (!formData.toWallet) {
      setError('Destination address required');
      setLoading(false);
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const result = await sendTransaction(formData.toWallet, amountNum);
      setSuccessMessage('Transaction sent successfully!');
      setFormData({ toWallet: '', amount: '' });
      console.log('Transaction result:', result);
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Send XLM</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Destination Address</label>
          <input
            type="text"
            name="toWallet"
            placeholder="GXXXXXXX..."
            value={formData.toWallet}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Amount (XLM)</label>
          <input
            type="number"
            name="amount"
            placeholder="0.0000001"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            min="0.0000001"
            step="0.0000001"
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
          {loading ? 'Sending...' : 'Send XLM'}
        </button>
      </form>
    </div>
  );
};

export default TransactionComponent;