import { useState, useEffect } from 'react';
import { Users, Shield, UserX, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/admin/users/');
      setUsers(data.results || data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/auth/admin/users/${id}/action/`, { action });
      toast.success(`User updated (${action})`);
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-500 text-white flex items-center justify-center neo-border">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">User Management</h1>
          <p className="text-sm text-gray-500 font-medium">
            {currentUser?.role === 'SUPERADMIN'
              ? 'Manage customer, admin, and super admin accounts.'
              : 'Manage customer accounts only.'}
          </p>
        </div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="p-4 border-r-2 border-white/20">User Details</th>
                <th className="p-4 border-r-2 border-white/20">Role</th>
                <th className="p-4 border-r-2 border-white/20">Status</th>
                <th className="p-4 border-r-2 border-white/20">Joined Date</th>
                <th className="p-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.map(u => {
                const isSelf = currentUser?.id === u.id;
                return (
                <tr key={u.id} className="border-b-2 border-gray-100 hover:bg-purple-50">
                  <td className="p-4 border-r-2 border-gray-100">
                    <div className="font-black flex items-center gap-2">
                      {u.first_name} {u.last_name}
                      {u.is_verified && <CheckCircle size={14} className="text-green-500" title="Verified Email" />}
                    </div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <span className={`neo-badge px-2 py-0.5 text-[10px] ${u.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800' : u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <span className={`px-2 py-1 text-xs font-bold border-2 ${u.status === 'ACTIVE' ? 'border-green-500 text-green-700 bg-green-50' : u.status === 'SUSPENDED' ? 'border-red-500 text-red-700 bg-red-50' : 'border-gray-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100 text-xs text-gray-500">
                    {format(new Date(u.date_joined), 'MMM dd, yyyy')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                       {isSelf ? (
                         <span className="text-xs font-bold text-gray-400">Current account</span>
                       ) : u.status === 'ACTIVE' ? (
                         <button onClick={() => handleAction(u.id, 'block')} className="neo-btn bg-red-100 text-red-700 px-3 py-1 text-xs flex items-center gap-1"><UserX size={12}/> Block</button>
                       ) : u.status === 'BLOCKED' ? (
                         <button onClick={() => handleAction(u.id, 'unblock')} className="neo-btn bg-green-100 text-green-700 px-3 py-1 text-xs flex items-center gap-1"><CheckCircle size={12}/> Unblock</button>
                       ) : u.status === 'PENDING' ? (
                         <button onClick={() => handleAction(u.id, 'approve')} className="neo-btn bg-blue-100 text-blue-700 px-3 py-1 text-xs flex items-center gap-1"><CheckCircle size={12}/> Approve</button>
                       ) : null}

                       {!isSelf && currentUser?.role === 'SUPERADMIN' && u.role === 'CUSTOMER' && (
                         <button onClick={() => handleAction(u.id, 'make_admin')} className="neo-btn bg-purple-100 text-purple-700 px-3 py-1 text-xs flex items-center gap-1"><Shield size={12}/> Make Admin</button>
                       )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
