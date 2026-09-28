import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', form);
      login(data.user, { access: data.access, refresh: data.refresh });
      toast.success(`Welcome back, ${data.user.first_name}!`);
      const role = data.user.role;
      navigate(role === 'CUSTOMER' ? '/' : '/admin');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.needs_verification) {
        setNeedsVerification(true);
        toast.error('Please verify your email first.');
      } else {
        toast.error(errData?.error || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp/', { email: form.email, otp });
      login(data.user, { access: data.access, refresh: data.refresh });
      toast.success('Email verified! Welcome to ShopSphere!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await api.post('/auth/resend-otp/', { email: form.email });
      toast.success('New OTP sent to your email.');
    } catch {
      toast.error('Failed to resend OTP.');
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-md neo-card p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#F97316] neo-border neo-shadow mx-auto flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black">Verify Your Email</h1>
            <p className="text-sm text-gray-600 mt-2">
              Enter the 6-digit OTP sent to <strong>{form.email}</strong>
            </p>
          </div>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="neo-input w-full px-4 py-3 text-2xl font-black text-center tracking-[0.5em]"
              required
            />
            <button type="submit" disabled={otpLoading}
              className="neo-btn w-full py-3 bg-[#F97316] text-white font-black text-base disabled:opacity-50">
              {otpLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <button onClick={resendOTP} className="mt-4 w-full text-sm font-bold text-gray-500 hover:text-[#F97316] transition-colors">
            Resend OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#F97316] neo-border border-l-0 border-y-0 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white neo-border neo-shadow flex items-center justify-center">
            <Package size={22} className="text-[#F97316]" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black text-white">ShopSphere</span>
        </div>
        <div>
          <div className="text-5xl font-black text-white leading-tight mb-4">
            Your One-Stop<br />Shopping<br />Destination
          </div>
          <p className="text-orange-100 font-medium text-lg">
            Thousands of products. Unbeatable prices. Fast delivery.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['10K+ Products', 'Free Shipping', '24/7 Support'].map(t => (
            <div key={t} className="bg-white/20 neo-border border-white/40 p-3 text-white text-sm font-bold">
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[#F97316] neo-border flex items-center justify-center">
              <Package size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black">Shop<span className="text-[#F97316]">Sphere</span></span>
          </div>

          <h1 className="text-3xl font-black mb-1">Welcome back</h1>
          <p className="text-gray-500 font-medium mb-8">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-black mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="neo-input w-full px-4 py-3 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-black mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="neo-input w-full px-4 py-3 pr-12 text-sm font-medium"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="neo-btn w-full py-3 bg-[#F97316] text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Signing In...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 neo-border border-[#F97316] p-4 neo-shadow-orange bg-orange-50">
            <p className="text-xs font-black uppercase tracking-wide text-[#F97316] mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs font-mono">
              <div><span className="font-bold">Customer:</span> user@shopsphere.com / User@123</div>
              <div><span className="font-bold">Admin:</span> admin@shopsphere.com / admin123</div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-black text-[#F97316] hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
