import { useState } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('orders'); // 'orders' or 'payments'
  const [format, setFormat] = useState('excel');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleDownload = async () => {
    setLoading(true);
    try {
      const endpoint = reportType === 'orders' ? '/reports/orders/' : '/reports/payments/';
      const params = new URLSearchParams({ file_format: format });
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await api.get(`${endpoint}?${params.toString()}`, { responseType: 'blob' });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${ext}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to generate report');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center neo-border">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Export Reports</h1>
          <p className="text-sm text-gray-500 font-medium">Generate Excel or PDF reports for orders and payments.</p>
        </div>
      </div>

      <div className="neo-card bg-white p-8">
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase mb-2">Report Data</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="radio" value="orders" checked={reportType==='orders'} onChange={()=>setReportType('orders')} className="w-4 h-4 accent-[#F97316]" /> Orders Report
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="radio" value="payments" checked={reportType==='payments'} onChange={()=>setReportType('payments')} className="w-4 h-4 accent-[#F97316]" /> Payments Report
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase mb-2">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="radio" value="excel" checked={format==='excel'} onChange={()=>setFormat('excel')} className="w-4 h-4 accent-green-600" /> Excel (.xlsx)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="radio" value="pdf" checked={format==='pdf'} onChange={()=>setFormat('pdf')} className="w-4 h-4 accent-red-600" /> PDF (.pdf)
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 neo-border border-dashed space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2"><Filter size={16}/> Date Filter (Optional)</h3>
            <div>
              <label className="block text-xs font-bold mb-1 border-gray-400">Start Date</label>
              <input type="date" value={dateRange.start} onChange={e=>setDateRange({...dateRange, start:e.target.value})} className="neo-input w-full p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 border-gray-400">End Date</label>
              <input type="date" value={dateRange.end} onChange={e=>setDateRange({...dateRange, end:e.target.value})} className="neo-input w-full p-2 text-sm" />
            </div>
          </div>
          
        </div>
        
        <div className="mt-8 pt-6 border-t-2 border-[#0A0A0A]">
          <button 
            onClick={handleDownload} 
            disabled={loading}
            className="neo-btn bg-[#0A0A0A] text-white py-4 px-8 font-black text-lg w-full flex items-center justify-center gap-3 disabled:opacity-75"
          >
            <Download size={20} />
            {loading ? 'Generating Report...' : `Download ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`}
          </button>
        </div>
      </div>
    </div>
  );
}
