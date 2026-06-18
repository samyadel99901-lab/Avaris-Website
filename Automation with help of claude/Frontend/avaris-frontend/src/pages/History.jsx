import { mockHistory } from '../data/mockData';

export default function History() {
  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="mb-6">
        <p className="text-[11px] text-purple-accent uppercase tracking-widest font-medium mb-1">
          History
        </p>
        <h1 className="text-[22px] font-medium text-gray-100">Sent invoices</h1>
        <p className="text-xs text-gray-500 mt-1">All invoices that have been sent through the system</p>
      </div>

      <div className="bg-purple-accent/3 border border-purple-accent/10 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-purple-accent/6 border-b border-purple-accent/10">
              <th className="p-2.5 text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium">ID</th>
              <th className="p-2.5 text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium">Customer</th>
              <th className="p-2.5 text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium">Email</th>
              <th className="p-2.5 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">Items</th>
              <th className="p-2.5 text-right text-[10px] text-gray-500 uppercase tracking-wider font-medium">Amount</th>
              <th className="p-2.5 text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
              <th className="p-2.5 text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((row) => (
              <tr key={row.id} className="border-b border-purple-accent/8 last:border-b-0 hover:bg-purple-accent/5">
                <td className="p-2.5 text-gray-500 font-mono">#{row.id}</td>
                <td className="p-2.5 font-medium text-gray-100">{row.customer}</td>
                <td className="p-2.5 text-gray-400">{row.email}</td>
                <td className="p-2.5 text-center text-gray-400">{row.items}</td>
                <td className="p-2.5 text-right font-medium text-gray-100 tabular-nums">${row.amount.toLocaleString()}</td>
                <td className="p-2.5 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded border font-medium tracking-wide bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                    {row.status}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 font-mono text-[11px]">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}