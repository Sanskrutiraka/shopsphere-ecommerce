import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      toast.success('Account created! Check your email for OTP.');
      setStep(2);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error('Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp/', { email: form.email, otp });
      toast.success('Email verified! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await api.post('/auth/resend-otp/', { email: form.email });
      toast.success('New OTP sent!');
    } catch { toast.error('Failed.'); }
  };

  const inputCls = "neo-input w-full px-4 py-3 text-sm font-medium";
  const labelCls = "block text-sm font-black mb-1.5 uppercase tracking-wide";

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-md neo-card p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#F97316] neo-border neo-shadow mx-auto flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black">Verify Your Email</h1>
            <p className="text-sm text-gray-600 mt-2">
              We sent a 6-digit OTP to<br /><strong>{form.email}</strong>
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-2 neo-border ${s <= step ? 'bg-[#F97316]' : 'bg-gray-200'}`} />
            ))}
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
              placeholder="● ● ● ● ● ●"
              maxLength={6}
              className="neo-input w-full px-4 py-4 text-3xl font-black text-center tracking-[0.8em]"
              required
            />
            <button type="submit" disabled={loading}
              className="neo-btn w-full py-3 bg-[#F97316] text-white font-black text-base disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : <><CheckCircle size={18} /> Verify & Continue</>}
            </button>
          </form>

          <button onClick={resendOTP} className="mt-4 w-full text-sm font-bold text-gray-500 hover:text-[#F97316] transition-colors">
            Didn't get the code? Resend OTP
          </button>
          <button onClick={() => setStep(1)} className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600">
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0A] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F97316] neo-border border-white/30 neo-shadow flex items-center justify-center">
            <Package size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black text-white">ShopSphere</span>
        </div>

        <div>
          <div className="text-5xl font-black text-white leading-tight mb-4">
            Join Thousands<br />of Happy<br /><span className="text-[#F97316]">Shoppers</span>
          </div>
          <div className="space-y-3">
            {[
              'Free account — no credit card needed',
              'Get personalized product recommendations',
              'Track orders in real-time',
              'Exclusive member-only deals',
            ].map(t => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#F97316] flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={12} className="text-white" />
                </div>
                <span className="text-gray-300 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-[#F97316] font-black hover:underline">Sign in</Link>
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-[#F97316] neo-border flex items-center justify-center">
              <Package size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black">Shop<span className="text-[#F97316]">Sphere</span></span>
          </div>

          <h1 className="text-3xl font-black mb-1">Create account</h1>
          <p className="text-gray-500 font-medium mb-6">Fill in your details below</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input type="text" required value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  placeholder="John" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input type="text" required value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Doe" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Phone (Optional)</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters" className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Confirm Password</label>
              <input type="password" required value={form.confirm_password}
                onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                placeholder="Repeat password" className={inputCls} />
            </div>

            <button type="submit" disabled={loading}
              className="neo-btn w-full py-3 bg-[#F97316] text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-[#F97316] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
