import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signUp } from "../services/api.js";
import { setToken } from "../authSlice.js";
import { connectWallet } from "../walletSlice.js";
import { Eye, EyeOff } from "lucide-react";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
  { code: "+211", flag: "🇸🇸", name: "South Sudan" },
];

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [countryCode, setCountryCode] = useState("+250");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // OTP state (frontend-only, lightweight)
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const handlePhoneChange = (e) => {
    // Strip everything except digits
    const digits = e.target.value.replace(/\D/g, "");
    setPhone(digits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters long");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!phone || phone.length < 6) {
      return setError("Invalid phone number");
    }

    try {
      setLoading(true);
      setError("");

      const fullPhone = `${countryCode}${phone}`;

      const res = await signUp({
        email,
        password,
        phone: fullPhone
      });

      const token = res.data?.token;
      const user = res.data?.user;

      // ✅ Save session and let App.jsx hierarchy manage the transition
      dispatch(setToken({ token, user }));

      // Show OTP step before final shell hand-off
      setShowOtp(true);

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = () => {
    setOtpError("");

    if (otp.length !== 6) {
      return setOtpError("Enter a 6-digit code");
    }

    // Hand-off to hierarchy automatically (OTP accepted)
    // No manual navigate needed.
  };

  const handleSkipOtp = () => {
    // Hand-off to hierarchy automatically
  };

  // OTP STEP
  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] px-4">
        <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-2xl p-6">

          <h1 className="text-2xl font-bold text-center mb-2">
            Verify Phone
          </h1>
          <p className="text-center text-sm text-gray-400 mb-6">
            Enter the 6-digit code sent to {countryCode} {phone}
          </p>

          {otpError && (
            <div className="bg-red-500/10 text-red-400 p-2 rounded mb-3 text-sm">
              {otpError}
            </div>
          )}

          <input
            type="text"
            maxLength={6}
            className="w-full bg-[#0b0e11] p-3 rounded border border-[#2b3139] text-center text-lg tracking-widest mb-4"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <button
            onClick={handleOtpVerify}
            className="w-full bg-cyan-500 p-3 rounded font-semibold mb-3"
          >
            Verify
          </button>

          <button
            onClick={handleSkipOtp}
            className="w-full bg-transparent p-2 rounded text-gray-400 text-sm hover:text-white transition-colors"
          >
            Skip for now
          </button>

        </div>
      </div>
    );
  }

  // SIGNUP FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] px-4">

      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-2xl p-6">

        <h1 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h1>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            type="email"
            className="bg-[#0b0e11] p-3 rounded border border-[#2b3139]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-[#0b0e11] p-3 rounded border border-[#2b3139] pr-10"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-[#0b0e11] p-3 rounded border border-[#2b3139] pr-10"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* COUNTRY CODE */}
          <div className="flex gap-2">

            <select
              className="bg-[#0b0e11] p-3 border border-[#2b3139] rounded"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>

            <input
              className="bg-[#0b0e11] p-3 border border-[#2b3139] flex-1 rounded"
              placeholder={`${selectedCountry.code} XXX XXX XXX`}
              value={phone}
              onChange={handlePhoneChange}
              inputMode="numeric"
            />
          </div>

          <button className="w-full bg-cyan-500 p-3 rounded font-semibold">
            {loading ? "Creating..." : "Sign Up"}
          </button>

        </form>

        <p className="text-center text-sm mt-4 text-gray-400">
          Already have account?{" "}
          <Link className="text-cyan-400" to="/signin">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
