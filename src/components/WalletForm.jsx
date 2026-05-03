import React from "react";

export default function WalletForm({
  title,
  children,
  buttonText,
  onSubmit,
  loading,
  error,
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white px-4">
      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-2xl p-6 shadow-xl">

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-4 text-center">
          {title}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-2 rounded mb-3 text-sm text-center">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="flex flex-col gap-3">
          {children}
        </div>

        {/* BUTTON */}
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#2b3139] disabled:text-gray-400 p-3 rounded-xl font-semibold transition-all"
        >
          {loading ? "Please wait..." : buttonText}
        </button>

      </div>
    </div>
  );
}