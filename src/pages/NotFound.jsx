import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center">

        <div className="flex justify-center mb-8">
          <Logo size={80} />
        </div>

        <div className="mb-6 relative inline-block">
          <FileQuestion size={100} className="text-[#2b3139] animate-bounce" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-cyan-500">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Page Not Found
        </h1>

        <p className="text-[#848e9c] mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#1e2329] border border-[#2b3139] hover:bg-[#2b3139] text-white font-bold rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl transition-all active:scale-95"
          >
            <Home size={20} />
            Back to Home
          </button>

        </div>
      </div>
    </div>
  );
}