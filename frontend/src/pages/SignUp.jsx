import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignUpComponent from '../components/SignUpComponent';

const SignUp = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const redirectToSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h1>
        <SignUpComponent onSignupFinished={redirectToSignIn} />
        <p className="text-sm text-slate-300 mt-4 text-center">
          Already have an account? <Link to="/signin" className="text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;