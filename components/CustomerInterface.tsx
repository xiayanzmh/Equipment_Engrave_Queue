import React, { useState, useMemo } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { PRICING_CONFIG } from '../constants';
import { CartItem, WaitTimeEstimate } from '../types';
import { ShoppingCart, Plus, Trash2, CheckCircle, Clock, DollarSign, Info, Users } from 'lucide-react';

export const CustomerInterface = () => {
  const { getPendingCount, addEntries, calculateWaitTime, queue } = useQueue();
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // UI State
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successData, setSuccessData] = useState<{ count: number, waitEstimates: WaitTimeEstimate } | null>(null);

  const pendingCount = getPendingCount();

  const availableTypes = Object.keys(PRICING_CONFIG);
  const availableItems = selectedType ? Object.keys(PRICING_CONFIG[selectedType] || {}) : [];
  
  const currentItemDetails = selectedType && selectedItem 
    ? PRICING_CONFIG[selectedType][selectedItem] 
    : null;

  // Real-time calculation of wait times based on current cart and current queue
  const waitEstimates: WaitTimeEstimate = useMemo(() => {
    return calculateWaitTime(cart);
  }, [cart, queue, calculateWaitTime]);

  const addToCart = () => {
    if (!selectedType || !selectedItem || !currentItemDetails) return;

    const newItem: CartItem = {
      type: selectedType,
      item: selectedItem,
      number: quantity,
      costPerItem: currentItemDetails.cost_per_item,
      timePerItem: currentItemDetails.time_per_item_minutes
    };

    // Check if exists to update quantity
    const existingIndex = cart.findIndex(
      c => c.type === newItem.type && c.item === newItem.item
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].number += newItem.number;
      setCart(newCart);
    } else {
      setCart([...cart, newItem]);
    }

    // Reset item selection
    setSelectedItem('');
    setQuantity(1);
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

  const handleSubmit = () => {
    if (!name || !email || cart.length === 0) return;
    
    // Capture estimates before adding (as adding changes the queue)
    const currentEstimates = calculateWaitTime(cart);
    
    addEntries(name, email, cart);
    
    // Show success
    setSuccessData({
      count: cart.reduce((acc, item) => acc + item.number, 0),
      waitEstimates: currentEstimates
    });
    
    // Reset form
    setCart([]);
    setName('');
    setEmail('');
    setSelectedType('');
    setSelectedItem('');
    setShowConfirmation(false);
  };

  const handleReset = () => {
    setSuccessData(null);
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
            Submit Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Input Form */}
      <div className="lg:col-span-7 space-y-8">
        {/* Status Banner */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Queue Status</h2>
            <p className="text-slate-500 text-sm">Real-time updates</p>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${pendingCount === 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            <Users className="w-5 h-5" />
            <span className="font-semibold">
              {pendingCount === 0 ? 'No Wait' : `${pendingCount} Customers Ahead`}
            </span>
          </div>
        </div>

        {/* Pricing Accordion */}
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

        {/* Main Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">1</div>
            <h3 className="text-lg font-bold text-slate-800">Your Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 pt-4">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">2</div>
            <h3 className="text-lg font-bold text-slate-800">Add Items</h3>
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

          {currentItemDetails && (
             <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>
                  {selectedType} - {selectedItem}: <strong>{currentItemDetails.time_per_item_minutes}m</strong> per item, <strong>${currentItemDetails.cost_per_item.toFixed(2)}</strong> each
                </span>
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
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
             <button
                onClick={addToCart}
                disabled={!selectedItem}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
             >
               <Plus className="w-4 h-4" /> Add to Request
             </button>
          </div>
        </div>
      </div>

      {/* Right Column: Cart / Summary */}
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
                
                {/* Wait Time Estimate */}
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
                disabled={!name || !email}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {!name || !email ? 'Enter Name & Email' : 'Review & Submit'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
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
                    <div className="font-medium text-slate-900">{name}</div>
                    <div className="text-sm text-slate-600 truncate">{email}</div>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Total Cost</span>
                    <div className="font-medium text-green-600 text-lg">${totals.cost.toFixed(2)}</div>
                    <div className="text-sm text-slate-600">{cart.reduce((acc, i) => acc + i.number, 0)} items</div>
                 </div>
              </div>

              {/* Wait Time Breakdown */}
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
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Modify
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};