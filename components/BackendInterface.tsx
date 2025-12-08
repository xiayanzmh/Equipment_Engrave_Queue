import React, { useState } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { useAuth } from '../contexts/AuthContext';
import { QueueStatus, QueueEntry } from '../types';
import { 
  Play, 
  CheckCircle, 
  Trash2, 
  Clock, 
  RotateCw, 
  CheckSquare, 
  ClipboardList, 
  Search,
  AlertCircle,
  Download,
  ExternalLink,
  XCircle,
  Filter
} from 'lucide-react';

export const BackendInterface = () => {
  const { queue, updateStatus, stats } = useQueue();
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'name' | 'email'>('all');

  const filteredQueue = queue
    .filter(entry => {
      if (activeTab === 'pending') return entry.status === 'pending';
      if (activeTab === 'processing') return entry.status === 'processing';
      // 'all' includes pending, processing, completed, and cancelled
      return true;
    })
    .filter(entry => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;

      if (searchFilter === 'name') {
        return entry.customerName.toLowerCase().includes(term);
      }
      if (searchFilter === 'email') {
        return entry.email.toLowerCase().includes(term);
      }
      
      // 'all' logic
      return (
        entry.customerName.toLowerCase().includes(term) ||
        entry.email.toLowerCase().includes(term) ||
        entry.id.includes(term) ||
        entry.item.toLowerCase().includes(term) ||
        (entry.engravingText && entry.engravingText.toLowerCase().includes(term))
      );
    })
    // Sort by latest first (descending)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200 decoration-slate-400';
    }
  };

  const getStatusIcon = (status: QueueStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'processing': return <RotateCw className="w-3 h-3 animate-spin-slow" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' });
  };

  // Modified to "Cancel" directly without confirmation
  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Directly update status to 'cancelled'
    await updateStatus(id, 'cancelled');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Customer Name',
      'Email',
      'Type',
      'Item',
      'Engraving Text',
      'Quantity',
      'Status',
      'Submitted At',
      'Completed At',
      'Cost Per Item',
      'Time Per Item (min)'
    ];

    const csvRows = [
      headers.join(','), 
      ...queue.map(row => {
        return [
          row.id,
          `"${row.customerName.replace(/"/g, '""')}"`, 
          `"${row.email.replace(/"/g, '""')}"`,
          row.type,
          row.item,
          row.engravingText ? `"${row.engravingText.replace(/"/g, '""')}"` : '',
          row.quantity,
          row.status,
          row.submittedAt,
          row.completedAt || '',
          row.costPerItem,
          row.timePerItem
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `engraving_queue_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Queue Management</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Database Connected</span>
             </div>
             <span>•</span>
             <a 
               href="https://console.firebase.google.com/project/gen-lang-client-0550598157/firestore/data" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
             >
               View Raw Data <ExternalLink className="w-3 h-3" />
             </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              title="Download CSV for BigQuery"
            >
              <Download className="w-4 h-4" />
              Export History
            </button>
            <div className="flex items-center">
                <div className="relative">
                    <select
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value as any)}
                        className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-l-lg border-r-0 focus:ring-indigo-500 focus:border-indigo-500 block pl-3 pr-8 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <option value="all">All</option>
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <Filter className="w-3 h-3" />
                    </div>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={searchFilter === 'all' ? "Search..." : `Search by ${searchFilter}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 placeholder-slate-400"
                    />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard 
          label="Pending" 
          value={stats.pending} 
          icon={<Clock className="w-5 h-5 text-amber-600" />} 
          color="border-amber-500" 
        />
        <MetricCard 
          label="Processing" 
          value={stats.processing} 
          icon={<RotateCw className="w-5 h-5 text-blue-600" />} 
          color="border-blue-500" 
        />
        <MetricCard 
          label="Completed" 
          value={stats.completed} 
          icon={<CheckCircle className="w-5 h-5 text-green-600" />} 
          color="border-green-500" 
        />
        <MetricCard 
          label="Cancelled" 
          value={stats.cancelled} 
          icon={<XCircle className="w-5 h-5 text-slate-500" />} 
          color="border-slate-400" 
        />
        <MetricCard 
          label="Total Orders" 
          value={stats.total} 
          icon={<ClipboardList className="w-5 h-5 text-slate-600" />} 
          color="border-slate-500" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <TabButton 
            active={activeTab === 'pending'} 
            onClick={() => setActiveTab('pending')} 
            label="Active Queue" 
            count={stats.pending}
            icon={<Clock className="w-4 h-4" />}
          />
          <TabButton 
            active={activeTab === 'processing'} 
            onClick={() => setActiveTab('processing')} 
            label="In Progress" 
            count={stats.processing}
            icon={<RotateCw className="w-4 h-4" />}
          />
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')} 
            label="All Entries" 
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>

        <div className="p-6">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No entries found</h3>
              <p className="text-slate-500">The queue is currently empty for this view.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map(entry => (
                <div key={entry.id} className={`bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow ${entry.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entry.status)} uppercase tracking-wide`}>
                          {getStatusIcon(entry.status)}
                          {entry.status}
                        </span>
                        <h3 className={`font-bold text-slate-900 ${entry.status === 'cancelled' ? 'line-through text-slate-500' : ''}`}>
                            {entry.customerName}
                        </h3>
                        <span className="text-sm text-slate-500 hidden sm:inline">•</span>
                        <span className="text-sm text-slate-500">{entry.email}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Item Details</span>
                           <div className="font-medium text-slate-800">{entry.type} - {entry.item}</div>
                           <div className="text-slate-500">Qty: {entry.quantity}</div>
                           {entry.engravingText && (
                             <div className="text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded mt-1 inline-block text-xs">
                               "{entry.engravingText}"
                             </div>
                           )}
                        </div>
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Timeline</span>
                           <div className="text-slate-700">Sub: {formatTime(entry.submittedAt)}</div>
                           {entry.completedAt && entry.status !== 'cancelled' && (
                               <div className="text-green-600">Done: {formatTime(entry.completedAt)}</div>
                           )}
                        </div>
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Reference</span>
                           <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{entry.id.slice(0, 8)}</code>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                        {entry.status === 'pending' && (
                            <button 
                                onClick={() => updateStatus(entry.id, 'processing')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                            >
                                <Play className="w-4 h-4" /> Start
                            </button>
                        )}
                        {entry.status === 'processing' && (
                            <button 
                                onClick={() => updateStatus(entry.id, 'completed')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                            >
                                <CheckSquare className="w-4 h-4" /> Complete
                            </button>
                        )}
                        
                        {/* Cancel Button - Available for all active statuses */}
                        {entry.status !== 'cancelled' && (
                            <button 
                                type="button"
                                onClick={(e) => handleCancel(e, entry.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Move to Cancelled"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${color} border-y border-r border-slate-200 flex items-center justify-between`}>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
    <div className="p-3 bg-slate-50 rounded-lg">
      {icon}
    </div>
  </div>
);

const TabButton = ({ active, onClick, label, count, icon }: { active: boolean, onClick: () => void, label: string, count?: number, icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
      active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
    {count !== undefined && (
      <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
        {count}
      </span>
    )}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
  </button>
);
