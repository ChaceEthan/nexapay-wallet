import { useAuth } from '../context/AuthContext';
import SignUpComponent from '../components/SignUpComponent';
import SignInComponent from '../components/SignInComponent';

const Auth = () => {
  const { login } = useAuth();

  const handleSignIn = (email, password) => {
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="NexaPay Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-2">NexaPay</h1>
          <p className="text-slate-400">Your Stellar Wallet</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800 hover:border-purple-700 transition">
          <h2 className="text-3xl font-bold text-white mb-6">Create Account</h2>
          <SignUpComponent />
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800 hover:border-purple-700 transition">
          <h2 className="text-3xl font-bold text-white mb-6">Sign In</h2>
          <SignInComponent onLogin={handleSignIn} />
        </div>
      </div>
    </div>
  );
};

export default Auth;