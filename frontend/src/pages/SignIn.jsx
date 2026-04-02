import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignInComponent from '../components/SignInComponent';

const SignIn = () => {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = (userData) => {
    login(userData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Sign In</h1>
        <SignInComponent onLogin={handleLogin} />
        <p className="text-sm text-slate-300 mt-4 text-center">
          Don’t have an account? <Link to="/signup" className="text-purple-400 hover:text-purple-300">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;