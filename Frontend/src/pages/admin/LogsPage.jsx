import { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async (pageNumber) => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/admin/logs/', { params: { page: pageNumber } });
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setLogs(list);
      setHasNext(Boolean(data?.next));
      setHasPrev(Boolean(data?.previous));
      setTotalCount(data?.count || list.length);
    } catch {
      toast.error('Failed to load logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center neo-border">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1">Activity Logs</h1>
            <p className="text-sm text-gray-500 font-medium">Track admin actions across the platform.</p>
          </div>
        </div>
        <div className="text-xs font-black uppercase text-gray-500">Total {totalCount}</div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="p-4 border-r-2 border-white/20">When</th>
                <th className="p-4 border-r-2 border-white/20">Admin</th>
                <th className="p-4 border-r-2 border-white/20">Action</th>
                <th className="p-4 border-r-2 border-white/20">Entity</th>
                <th className="p-4">Description</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No logs found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b-2 border-gray-100 hover:bg-gray-50 align-top">
                  <td className="p-4 border-r-2 border-gray-100 text-xs text-gray-500">
                    {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm a') : '-'}
                  </td>
                  <td className="p-4 border-r-2 border-gray-100 font-black text-sm">{log.admin_email || 'System'}</td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <span className="inline-flex w-28 items-center justify-center px-2 py-1 text-[10px] font-black uppercase bg-orange-100 text-orange-800 neo-border border-orange-300 text-center whitespace-nowrap">
                      {String(log.action || 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100 text-xs text-gray-600">{log.model_name || '-'}</td>
                  <td className="p-4 text-xs text-gray-700 max-w-120 whitespace-normal wrap-break-word">{log.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t-2 border-gray-100 bg-gray-50">
          <div className="text-xs font-bold text-gray-500">Page {page}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev || loading}
              className="neo-btn px-3 py-1.5 text-xs font-black bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || loading}
              className="neo-btn px-3 py-1.5 text-xs font-black bg-[#0A0A0A] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
