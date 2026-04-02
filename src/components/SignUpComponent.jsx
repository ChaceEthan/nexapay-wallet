import { useState } from 'react';

const SignUpComponent = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+250',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const countryCodes = [
    { code: '+250', name: 'Rwanda' },
    { code: '+254', name: 'Kenya' },
    { code: '+256', name: 'Uganda' },
    { code: '+255', name: 'Tanzania' },
    { code: '+234', name: 'Nigeria' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhoneNumber = () => {
    const { countryCode, phoneNumber } = formData;
    let regex;
    switch (countryCode) {
      case '+250':
      case '+254':
      case '+256':
      case '+255':
        regex = /^\d{9}$/;
        break;
      case '+234':
        regex = /^\d{10}$/;
        break;
      default:
        return false;
    }
    return regex.test(phoneNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setWalletAddress('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber()) {
      setError('Invalid phone number for the selected country');
      setLoading(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/signup`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          country: formData.countryCode,
          phoneNumber: formData.countryCode + formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Sign up successful!');
        setWalletAddress(data.walletAddress || 'N/A');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          countryCode: '+250',
          phoneNumber: '',
        });
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error or server is unreachable');
    } finally {
      setLoading(false);
    }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="John"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
          placeholder="••••••••"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
          placeholder="••••••••"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
          <select
            name="countryCode"
            value={formData.countryCode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            required
          >
            {countryCodes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
            placeholder="781234567"
            required
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

      {successMessage && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4">
          <p className="text-green-300 font-medium">{successMessage}</p>
          {walletAddress && walletAddress !== 'N/A' && (
            <p className="text-green-300 text-sm mt-2 break-all font-mono">
              Wallet: {walletAddress}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition duration-200"
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignUpComponent;