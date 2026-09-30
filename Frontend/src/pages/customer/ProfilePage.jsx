import { useState, useEffect } from 'react';
import { User, MapPin, Lock, Save, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Address state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ 
    label: 'Home', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false 
  });
  
  // Password state
  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
    }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = () => {
    api.get('/auth/addresses/')
      .then(r => setAddresses(normalizeListResponse(r.data)))
      .catch(() => setAddresses([]));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile/', profileForm);
      updateUser(data);
      toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/addresses/', addrForm);
      toast.success('Address saved');
      setShowAddressForm(false);
      setAddrForm({ label: 'Home', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
      fetchAddresses();
    } catch { toast.error('Failed to save address'); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/auth/addresses/${id}/`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch { toast.error('Failed to delete'); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      toast.error('New passwords do not match'); return;
    }
    setSavingPass(true);
    try {
      await api.post('/auth/change-password/', passForm);
      toast.success('Password changed successfully');
      setPassForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setSavingPass(false); }
  };

  const inputCls = "neo-input w-full px-3 py-2 text-sm font-medium";
  const labelCls = "block text-xs font-black mb-1 uppercase tracking-wide";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8">My Account</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 grid grid-cols-3 md:flex md:flex-col gap-2 flex-shrink-0">
          <button onClick={() => setActiveTab('profile')} className={`text-center md:text-left px-3 sm:px-4 py-2.5 sm:py-3 font-black text-xs sm:text-sm flex flex-col md:flex-row items-center gap-1.5 md:gap-3 transition-colors neo-border cursor-pointer ${activeTab === 'profile' ? 'bg-[#F97316] text-white neo-shadow border-[#0A0A0A]' : 'bg-white hover:bg-orange-50'}`}>
            <User size={18} /> <span>Profile</span>
          </button>
          <button onClick={() => setActiveTab('addresses')} className={`text-center md:text-left px-3 sm:px-4 py-2.5 sm:py-3 font-black text-xs sm:text-sm flex flex-col md:flex-row items-center gap-1.5 md:gap-3 transition-colors neo-border cursor-pointer ${activeTab === 'addresses' ? 'bg-[#F97316] text-white neo-shadow border-[#0A0A0A]' : 'bg-white hover:bg-orange-50'}`}>
            <MapPin size={18} /> <span>Addresses</span>
          </button>
          <button onClick={() => setActiveTab('security')} className={`text-center md:text-left px-3 sm:px-4 py-2.5 sm:py-3 font-black text-xs sm:text-sm flex flex-col md:flex-row items-center gap-1.5 md:gap-3 transition-colors neo-border cursor-pointer ${activeTab === 'security' ? 'bg-[#F97316] text-white neo-shadow border-[#0A0A0A]' : 'bg-white hover:bg-orange-50'}`}>
            <Lock size={18} /> <span>Security</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 neo-card p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg sm:text-xl font-black mb-6 pb-2 border-b-2 border-gray-100">Personal Information</h2>
              <div className="mb-6 p-4 bg-gray-50 neo-border border-dashed text-sm">
                <span className="font-bold">Email:</span> {user?.email} <span className="text-xs text-gray-500 block sm:inline sm:ml-1">(Cannot be changed)</span>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input required value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input required value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+91..." className={inputCls} />
                </div>
                <button type="submit" disabled={savingProfile} className="neo-btn mt-4 px-6 py-2.5 bg-[#0A0A0A] text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                  <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-gray-100">
                <h2 className="text-lg sm:text-xl font-black">Saved Addresses</h2>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm font-bold text-[#F97316] flex items-center gap-1 hover:underline cursor-pointer">
                  <Plus size={16} /> Add New
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddressSave} className="mb-8 p-4 bg-orange-50 neo-border neo-shadow-sm border-[#F97316]">
                  <h3 className="font-black mb-4">New Address</h3>
                  <div className="space-y-3">
                    <div><label className={labelCls}>Label (Home, Work, etc)</label><input required value={addrForm.label} onChange={e=>setAddrForm({...addrForm, label: e.target.value})} className={inputCls}/></div>
                    <div><label className={labelCls}>Address Line 1</label><input required value={addrForm.address_line1} onChange={e=>setAddrForm({...addrForm, address_line1: e.target.value})} className={inputCls}/></div>
                    <div><label className={labelCls}>Address Line 2 (Optional)</label><input value={addrForm.address_line2} onChange={e=>setAddrForm({...addrForm, address_line2: e.target.value})} className={inputCls}/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><label className={labelCls}>City</label><input required value={addrForm.city} onChange={e=>setAddrForm({...addrForm, city: e.target.value})} className={inputCls}/></div>
                      <div><label className={labelCls}>State</label><input required value={addrForm.state} onChange={e=>setAddrForm({...addrForm, state: e.target.value})} className={inputCls}/></div>
                      <div><label className={labelCls}>PIN</label><input required value={addrForm.pincode} onChange={e=>setAddrForm({...addrForm, pincode: e.target.value})} className={inputCls}/></div>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-sm">
                      <input type="checkbox" checked={addrForm.is_default} onChange={e=>setAddrForm({...addrForm, is_default: e.target.checked})} className="w-4 h-4 accent-[#F97316] neo-border"/> Make Default
                    </label>
                    <div className="flex gap-2 mt-4 pt-4 border-t-2 border-orange-200">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="neo-btn px-4 py-2 bg-white font-black text-sm cursor-pointer">Cancel</button>
                      <button type="submit" className="neo-btn px-6 py-2 bg-[#F97316] text-white font-black text-sm cursor-pointer">Save Address</button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div key={a.id} className="p-4 neo-border bg-white relative group">
                    <div className="font-black mb-1 pr-8">{a.label} {a.is_default && <span className="neo-badge bg-[#0A0A0A] text-white px-1.5 ml-2">Default</span>}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {a.address_line1} {a.address_line2}<br/>
                      {a.city}, {a.state} {a.pincode}
                    </div>
                    <button onClick={() => handleDeleteAddress(a.id)} className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1.5 neo-border opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer" aria-label="Delete address">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {addresses.length === 0 && !showAddressForm && (
                  <div className="col-span-1 sm:col-span-2 text-center p-8 text-gray-400 font-medium border-2 border-dashed border-gray-300">
                    No addresses saved yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-black mb-6 pb-2 border-b-2 border-gray-100">Change Password</h2>
              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input type="password" required value={passForm.old_password} onChange={e => setPassForm({...passForm, old_password: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" required minLength={8} value={passForm.new_password} onChange={e => setPassForm({...passForm, new_password: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" required value={passForm.confirm_password} onChange={e => setPassForm({...passForm, confirm_password: e.target.value})} className={inputCls} />
                </div>
                <button type="submit" disabled={savingPass} className="neo-btn mt-4 px-6 py-2 bg-[#0A0A0A] text-white font-black text-sm flex items-center gap-2">
                  <Lock size={16} /> {savingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
