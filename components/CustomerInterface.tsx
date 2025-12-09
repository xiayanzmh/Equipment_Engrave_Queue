
import React, { useState, useMemo } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { useAuth } from '../contexts/AuthContext';
import { PRICING_CONFIG } from '../constants';
import { CartItem, WaitTimeEstimate, QueueStatus } from '../types';
import { ShoppingCart, Plus, Trash2, CheckCircle, Clock, DollarSign, Info, Users, PenTool, Loader, User, Mail, History, Package, Calendar, XCircle, RotateCw, ExternalLink, ArrowRight, X } from 'lucide-react';

export const CustomerInterface = () => {
  const { getPendingCount, addEntries, calculateWaitTime, queue } = useQueue();
  const { currentUser, logout } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const [selectedType, setSelectedType] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [engravingText, setEngravingText] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ count: number, waitEstimates: WaitTimeEstimate } | null>(null);
  const [showAd, setShowAd] = useState(true);

  // --- ADVERTISEMENT CONFIGURATION ---
  const AD_LINK = "https://www.absolutefencinggear.com/";
  const AD_TITLE = "Absolute Fencing Gear";
  // Updated to use Google's Favicon service which is more reliable than direct linking to .ico files
  const AD_ICON = "https://www.google.com/s2/favicons?domain=www.absolutefencinggear.com&sz=128";
  // -----------------------------------

  const customerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Customer';
  const customerEmail = currentUser?.email || '';

  const pendingCount = getPendingCount();

  const availableTypes = Object.keys(PRICING_CONFIG);
  const availableItems = selectedType ? Object.keys(PRICING_CONFIG[selectedType] || {}) : [];

  const currentItemDetails = selectedType && selectedItem
    ? PRICING_CONFIG[selectedType][selectedItem]
    : null;

  // Filter queue for current customer history
  const myHistory = useMemo(() => {
    return queue
      .filter(entry => entry.email === customerEmail)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [queue, customerEmail]);

  const waitEstimates: WaitTimeEstimate = useMemo(() => {
    return calculateWaitTime(cart);
  }, [cart, queue, calculateWaitTime]);

  // Calculate baseline wait time for the queue itself (0 items in cart)
  const currentQueueWait = useMemo(() => {
    return calculateWaitTime([]);
  }, [queue, calculateWaitTime]);

  const addToCart = () => {
    if (!selectedType || !selectedItem || !currentItemDetails) return;

    // Strict validation for engraving text
    if (!engravingText.trim()) {
      alert("Please enter the text to be engraved.");
      return;
    }

    const newItem: CartItem = {
      type: selectedType,
      item: selectedItem,
      number: quantity,
      costPerItem: currentItemDetails.cost_per_item,
      timePerItem: currentItemDetails.time_per_item_minutes,
      engravingText: engravingText.trim()
    };

    const existingIndex = cart.findIndex(
      c => c.type === newItem.type && c.item === newItem.item && c.engravingText === newItem.engravingText
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].number += newItem.number;
      setCart(newCart);
    } else {
      setCart([...cart, newItem]);
    }

    setSelectedItem('');
    setQuantity(1);
    setEngravingText('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    return cart.reduce((acc, item) => ({
      cost: acc.cost + (item.costPerItem * item.number),
      time: acc.time + (item.timePerItem * item.number)
    }), { cost: 0, time: 0 });
  }, [cart]);

  const handleSubmit = async () => {
    if (cart.length === 0 || !currentUser) return;

    setIsSubmitting(true);
    try {
      const currentEstimates = calculateWaitTime(cart);

      await addEntries(customerName, customerEmail, cart);

      setSuccessData({
        count: cart.reduce((acc, item) => acc + item.number, 0),
        waitEstimates: currentEstimates
      });

      setCart([]);
      setSelectedType('');
      setSelectedItem('');
      setEngravingText('');
      setShowConfirmation(false);
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to submit order. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setActiveTab('history'); // Switch to history tab after success
  };

  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Loader className="w-3 h-3 animate-spin" /> Processing</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"><XCircle className="w-3 h-3" /> Cancelled</span>;
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Successfully Submitted!</h2>
        <p className="text-slate-600 text-lg">
          You have added {successData.count} items to the queue.
        </p>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 inline-block text-left w-full max-w-md space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-slate-500 font-medium text-sm">Queue Position</span>
              <div className="text-lg font-bold text-indigo-600">
                {successData.waitEstimates.entriesAhead > 0
                  ? `${successData.waitEstimates.entriesAhead} people ahead`
                  : "You're next!"}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium text-sm">Total Est. Wait</span>
              <div className="text-lg font-bold text-slate-800">{successData.waitEstimates.totalWaitMinutes} mins</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <span className="block text-slate-400 text-xs uppercase tracking-wide">Queue Delay</span>
              {successData.waitEstimates.aheadProcessingMinutes} mins
            </div>
            <div className="text-right">
              <span className="block text-slate-400 text-xs uppercase tracking-wide">Your Order</span>
              {successData.waitEstimates.userProcessingMinutes} mins
            </div>
          </div>
        </div>

        <div className="pt-8">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Thank you for your order!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative pb-20">
      <div className="lg:col-span-7 space-y-6">

        {/* Header & Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Queue Status</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Clock className="w-4 h-4" />
              <span>Est. Wait Time: <strong>{currentQueueWait.aheadProcessingMinutes} mins</strong></span>
            </div>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${pendingCount === 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            <Users className="w-5 h-5" />
            <span className="font-semibold">
              {pendingCount === 0 ? 'No Wait' : `${pendingCount} Customers Ahead`}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'new'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <History className="w-4 h-4" /> Order History
          </button>
        </div>

        {activeTab === 'new' ? (
          /* New Request Form */
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 hover:bg-slate-50 transition-colors">
                  <span className="flex items-center gap-2 text-slate-800">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    View Pricing & Timing
                  </span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="text-slate-600 border-t border-slate-100 bg-slate-50 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(PRICING_CONFIG).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-slate-800 mb-2">{category}</h4>
                      <ul className="space-y-1 text-sm">
                        {Object.entries(items).map(([name, details]) => (
                          <li key={name} className="flex justify-between">
                            <span>{name}</span>
                            <span className="text-slate-500">${details.cost_per_item} / {details.time_per_item_minutes}m</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-serif text-slate-900">Hello, {customerName}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Mail className="w-3 h-3" />
                    {customerEmail}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-sm text-slate-400 hover:text-red-600 font-medium hover:underline flex items-center gap-1 transition-colors"
                >
                  Not you? Sign Out
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <h3 className="text-xl font-bold text-slate-800">Add Items</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setSelectedItem('');
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select a category...</option>
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    disabled={!selectedType}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Select an item...</option>
                    {availableItems.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-slate-400" />
                  Engraving Text <span className="text-xs text-amber-600 font-normal">(Required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  placeholder="e.g. Initials, Name (Required)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">This text will be engraved on the selected items.</p>
              </div>

              {currentItemDetails && (
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>
                    {selectedType} - {selectedItem}: <strong>{currentItemDetails.time_per_item_minutes}m</strong> per item, <strong>${currentItemDetails.cost_per_item.toFixed(2)}</strong> each
                  </span>
                </div>
              )}


              {/* Product Image Display */}
              {selectedType === 'Foil' && selectedItem === 'Blade' && (
                <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-4">
                  <img
                    src="/images/foil-blade-example.jpg"
                    alt="Foil Blade Example"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {selectedType === 'Foil' && selectedItem === 'Guard' && (
                <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-4">
                  <img
                    src="/images/foil-guard-example.jpg"
                    alt="Foil Guard Example"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button
                  onClick={addToCart}
                  disabled={!selectedItem || !engravingText.trim()}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add to Request
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* History View */
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">My Order History</h3>
                <span className="text-sm text-slate-500">{myHistory.length} Total Orders</span>
              </div>

              {myHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No order history found</p>
                  <p className="text-slate-400 text-sm mt-1">Your past orders will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myHistory.map((order) => (
                    <div key={order.id} className={`border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors ${order.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(order.status)}
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-mono">#{order.id.slice(0, 8)}</span>
                          </div>
                          <div className={`font-semibold text-slate-800 text-lg ${order.status === 'cancelled' ? 'line-through text-slate-500' : ''}`}>
                            {order.type} - {order.item}
                          </div>
                          {order.engravingText && (
                            <div className="text-sm text-indigo-600 mt-0.5">
                              "{order.engravingText}"
                            </div>
                          )}
                          <div className="text-sm text-slate-500 mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" /> Qty: {order.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> ${(order.costPerItem * order.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                          <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.submittedAt).toLocaleDateString()}
                          </div>
                          {order.status === 'completed' && order.completedAt && (
                            <div className="text-xs text-green-600 font-medium mt-2">
                              Completed {new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Your Request
            </h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
              {cart.reduce((acc, i) => acc + i.number, 0)} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Your cart is empty.</p>
              <p className="text-slate-400 text-sm mt-1">Add items to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.item}</span>
                        <span className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                          {item.type}
                        </span>
                      </div>
                      {item.engravingText && (
                        <div className="text-xs text-indigo-600 font-medium mt-1">
                          "{item.engravingText}"
                        </div>
                      )}
                      <div className="text-sm text-slate-500 mt-1">
                        Qty: {item.number} × ${item.costPerItem.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-800">
                        ${(item.costPerItem * item.number).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-red-400 hover:text-red-600 p-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Processing Time</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {totals.time} min
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 text-lg font-bold">
                  <span>Total Cost</span>
                  <span>${totals.cost.toFixed(2)}</span>
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg mt-2 text-sm">
                  <div className="flex justify-between text-indigo-900 font-medium">
                    <span>Estimated Total Wait</span>
                    <span>{waitEstimates.totalWaitMinutes} mins</span>
                  </div>
                  <div className="text-xs text-indigo-600 mt-1">
                    Includes {waitEstimates.aheadProcessingMinutes}m queue delay + {waitEstimates.userProcessingMinutes}m your order
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmation(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all mt-4"
              >
                Review & Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- RECOMMENDATION BAR --- */}
      {showAd && (
        <div
          onClick={() => window.open(AD_LINK, '_blank')}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex items-center justify-center p-3 gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowAd(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 rounded-full border border-slate-100 overflow-hidden bg-white p-0.5">
              <img src={AD_ICON} alt="AF" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">AD: <span className="font-bold">{AD_TITLE}</span></span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
        </div>
      )}
      {/* ------------------------- */}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Confirm Your Request</h3>
              <p className="opacity-90 text-sm mt-1">Please verify your details before submitting.</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Customer</span>
                  <div className="font-medium text-slate-900">{customerName}</div>
                  <div className="text-sm text-slate-600 truncate">{customerEmail}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Total Cost</span>
                  <div className="font-medium text-green-600 text-lg">${totals.cost.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">{cart.reduce((acc, i) => acc + i.number, 0)} items</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Estimated Total Wait</span>
                      <span>{waitEstimates.totalWaitMinutes} mins</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-amber-800">
                      <div className="flex justify-between">
                        <span>Queue Delay ({waitEstimates.entriesAhead} customers ahead)</span>
                        <span>{waitEstimates.aheadProcessingMinutes}m</span>
                      </div>
                      <div className="flex justify-between border-t border-amber-200/50 pt-1 mt-1">
                        <span>Your Processing Time</span>
                        <span>{waitEstimates.userProcessingMinutes}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-3">Items Summary</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between text-sm">
                      <span className="text-slate-700">
                        <span className="font-medium">{item.number}x</span> {item.item}
                        {item.engravingText && (
                          <span className="block text-xs text-indigo-600 mt-1">Text: "{item.engravingText}"</span>
                        )}
                      </span>
                      <span className="text-slate-500">
                        ${(item.costPerItem * item.number).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Modify
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
