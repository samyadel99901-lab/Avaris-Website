import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [progress, setProgress] = useState({ active: false, current: 0, total: 0, label: '' });
  const [sending, setSending] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/invoices/eligible');
      // الـ Backend بيرجع invoices كـ array of objects بدون id
      // نضيف id لكل واحدة عشان نقدر نتعامل معاها
      const indexed = response.data.invoices.map((inv, index) => ({
        ...inv,
        id: index + 1,
        customer: inv.customer_name,
        email: inv.customer_email,
        amount: inv.items.reduce((sum, item) => sum + parseFloat(item.amount), 0),
        status: inv.items.some(i => i.status === 'Deposit') ? 'Deposit' : 'Not Sent',
      }));
      setInvoices(indexed);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((i) => i.id)));
    }
  };

  const selectedTotal = invoices
    .filter((i) => selected.has(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);

  const handleSend = async () => {
  if (selected.size === 0) return;
  
  setSending(true);
  setProgress({ active: true, current: 0, total: selected.size, label: 'Sending invoices...' });

  // نطلع الإيميلات بتاعت الفواتير المختارة
  const selectedEmails = invoices
    .filter((inv) => selected.has(inv.id))
    .map((inv) => inv.email);

  try {
    const response = await api.post('/invoices/send', {
      selected_emails: selectedEmails,
    });
    
    const successCount = response.data.summary.successful_count;
    const failedCount = response.data.summary.failed_count;
    
    setProgress({
      active: true,
      current: successCount,
      total: selected.size,
      label: failedCount > 0 
        ? `${successCount} sent, ${failedCount} failed`
        : `${successCount} sent successfully`,
    });
    
    setTimeout(() => {
      fetchInvoices();
      setSelected(new Set());
      setProgress({ active: false, current: 0, total: 0, label: '' });
    }, 2500);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to send invoices');
    setProgress({ active: false, current: 0, total: 0, label: '' });
  } finally {
    setSending(false);
  }
};

  if (loading) {
    return (
      <div className="flex-1 p-7 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading invoices from Monday...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="mb-6">
        <p className="text-[11px] text-purple-accent uppercase tracking-widest font-medium mb-1">
          Dashboard
        </p>
        <h1 className="text-[22px] font-medium text-gray-100">Invoice automation</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review and send eligible invoices from Monday board
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-md">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Eligible" value={invoices.length} />
        <StatCard label="Total" value={`$${totalAmount.toLocaleString()}`} />
        <StatCard label="Selected" value={selected.size} accent />
        <StatCard label="Selected total" value={`$${selectedTotal.toLocaleString()}`} accent />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-purple-accent/8 border border-purple-accent/25 rounded-md text-purple-300 flex items-center gap-1.5 hover:bg-purple-accent/15 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <span className="text-[11px] text-gray-500">From Monday</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            disabled={invoices.length === 0}
            className="text-xs px-3 py-1.5 bg-transparent border border-purple-accent/20 rounded-md text-gray-400 hover:bg-purple-accent/5 transition-colors disabled:opacity-50"
          >
            {selected.size === invoices.length && invoices.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="text-xs px-3.5 py-1.5 bg-gradient-to-br from-purple-accent to-purple-glow rounded-md text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {sending
              ? 'Sending...'
              : selected.size === 0
              ? 'Send selected'
              : `Send ${selected.size} invoice${selected.size > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {progress.active && (
        <div className="bg-purple-accent/6 border border-purple-accent/20 rounded-lg px-4 py-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-300">{progress.label}</span>
            <span className="text-xs text-gray-400 font-mono">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-1 bg-purple-accent/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-accent to-pink-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {invoices.length === 0 && !loading ? (
        <div className="bg-purple-accent/3 border border-purple-accent/10 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400 mb-1">No eligible invoices</p>
          <p className="text-xs text-gray-600">
            All invoices are up to date or marked as Pending in Monday
          </p>
        </div>
      ) : (
        <div className="bg-purple-accent/3 border border-purple-accent/10 rounded-lg overflow-hidden">
          <table className="w-full text-xs table-fixed">
            <thead>
              <tr className="bg-purple-accent/6 border-b border-purple-accent/10">
                <th className="w-8 p-2.5">
                  <input
                    type="checkbox"
                    checked={selected.size === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <Th>Customer</Th>
                <Th>Email</Th>
                <Th center>Items</Th>
                <Th right>Amount</Th>
                <Th center>Status</Th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  isSelected={selected.has(inv.id)}
                  isExpanded={expanded.has(inv.id)}
                  onToggleSelect={() => toggleSelect(inv.id)}
                  onToggleExpand={() => toggleExpand(inv.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="bg-purple-accent/4 border border-purple-accent/12 rounded-lg px-3.5 py-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-[22px] font-medium ${accent ? 'text-purple-300' : 'text-gray-100'}`}>
        {value}
      </p>
    </div>
  );
}

function Th({ children, center, right }) {
  return (
    <th
      className={`p-2.5 font-medium text-gray-500 text-[10px] uppercase tracking-wider ${
        center ? 'text-center' : right ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function InvoiceRow({ invoice, isSelected, isExpanded, onToggleSelect, onToggleExpand }) {
  const statusStyle =
    invoice.status === 'Deposit'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
      : 'bg-indigo-500/12 text-indigo-300 border-indigo-500/25';

  return (
    <>
      <tr
        className={`border-b border-purple-accent/8 last:border-b-0 transition-colors cursor-pointer hover:bg-purple-accent/5 ${
          isSelected ? 'bg-purple-accent/8' : ''
        }`}
        onClick={(e) => {
          if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;
          onToggleExpand();
        }}
      >
        <td className="p-2.5 text-center">
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect} onClick={(e) => e.stopPropagation()} />
        </td>
        <td className="p-2.5 font-medium text-gray-100">{invoice.customer}</td>
        <td className="p-2.5 text-gray-400 truncate">{invoice.email}</td>
        <td className="p-2.5 text-center text-gray-400">{invoice.items.length}</td>
        <td className="p-2.5 text-right font-medium text-gray-100 tabular-nums">
          ${invoice.amount}
        </td>
        <td className="p-2.5 text-center">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium tracking-wide ${statusStyle}`}>
            {invoice.status}
          </span>
        </td>
        <td className="p-2.5 text-center">
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="text-gray-500 hover:text-purple-300">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-purple-accent/3">
          <td colSpan={7} className="px-6 py-2.5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">
              Project breakdown
            </p>
            {invoice.items.map((item, i) => (
              <div key={i} className="flex justify-between py-1 text-[11px]">
                <span className="text-gray-300">
                  {item.project_name}
                  {item.description && (
                    <span className="text-gray-500 font-mono ml-2">{item.description}</span>
                  )}
                </span>
                <span className="text-purple-300 tabular-nums">${item.amount}</span>
              </div>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}