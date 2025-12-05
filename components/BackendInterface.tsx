import React, { useState } from 'react';
import { useQueue } from '../contexts/QueueContext';
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
  Download
} from 'lucide-react';

export const BackendInterface = () => {
  const { queue, updateStatus, deleteEntry, stats } = useQueue();
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQueue = queue
    .filter(entry => {
      if (activeTab === 'pending') return entry.status === 'pending';
      if (activeTab === 'processing') return entry.status === 'processing';
      return true; // all
    })
    .filter(entry => 
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.includes(searchTerm) ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusIcon = (status: QueueStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'processing': return <RotateCw className="w-3 h-3 animate-spin-slow" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' });
  };

  const handleExportCSV = () => {
    // Define headers
    const headers = [
      'ID',
      'Customer Name',
      'Email',
      'Type',
      'Item',
      'Quantity',
      'Status',
      'Submitted At',
      'Completed At',
      'Cost Per Item',
      'Time Per Item (min)'
    ];

    // Format rows
    const csvRows = [
      headers.join(','), // Header row
      ...queue.map(row => {
        return [
          row.id,
          `"${row.customerName.replace(/"/g, '""')}"`, // Escape quotes
          `"${row.email.replace(/"/g, '""')}"`,
          row.type,
          row.item,
          row.quantity,
          row.status,
          row.submittedAt,
          row.completedAt || '',
          row.costPerItem,
          row.timePerItem
        ].join(',');
      })
    ];

    // Create and download file
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
          <p className="text-slate-500">Manage incoming orders and workflow</p>
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
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search orders..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                />
            </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          label="Total Orders" 
          value={stats.total} 
          icon={<ClipboardList className="w-5 h-5 text-slate-600" />} 
          color="border-slate-500" 
        />
      </div>

      {/* Tabs */}
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
                <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Header / Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entry.status)} uppercase tracking-wide`}>
                          {getStatusIcon(entry.status)}
                          {entry.status}
                        </span>
                        <h3 className="font-bold text-slate-900">{entry.customerName}</h3>
                        <span className="text-sm text-slate-500 hidden sm:inline">•</span>
                        <span className="text-sm text-slate-500">{entry.email}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Item Details</span>
                           <div className="font-medium text-slate-800">{entry.type} - {entry.item}</div>
                           <div className="text-slate-500">Qty: {entry.quantity}</div>
                        </div>
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Timeline</span>
                           <div className="text-slate-700">Sub: {formatTime(entry.submittedAt)}</div>
                           {entry.completedAt && (
                               <div className="text-green-600">Done: {formatTime(entry.completedAt)}</div>
                           )}
                        </div>
                        <div>
                           <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Reference</span>
                           <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{entry.id.slice(0, 8)}</code>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {entry.status !== 'completed' && (
                        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                            {entry.status === 'pending' && (
                                <button 
                                    onClick={() => updateStatus(entry.id, 'processing')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Play className="w-4 h-4" /> Start
                                </button>
                            )}
                            {entry.status === 'processing' && (
                                <button 
                                    onClick={() => updateStatus(entry.id, 'completed')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <CheckSquare className="w-4 h-4" /> Complete
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you sure you want to delete this entry?')) {
                                        deleteEntry(entry.id);
                                    }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Entry"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    
                    {/* Actions for completed (Delete only) */}
                    {entry.status === 'completed' && (
                         <div className="flex items-center justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                            <button 
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
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