'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, convertCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function VaultPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSGD, setShowSGD] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'memories'>('expenses');

  // Create Group Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDestination, setNewGroupDestination] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState(500);
  const [newGroupCurrency, setNewGroupCurrency] = useState('SGD');

  // Add Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Notes state
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({});

  // Balances / Debt Simplification State
  const [debts, setDebts] = useState<any[]>([]);
  const [memberSummary, setMemberSummary] = useState<any[]>([]);

  // Memories State
  const [memories, setMemories] = useState<Record<string, any>>({});

  const router = useRouter();

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      const data = await res.json();
      if (data && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0 && !selectedGroup) {
          loadGroupDetails(data.groups[0].id);
        } else if (selectedGroup) {
          loadGroupDetails(selectedGroup.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, router]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const loadGroupDetails = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (data && data.group) {
        setSelectedGroup(data.group);
        // Load balances & memories for this group
        loadBalances(groupId);
        loadMemories(groupId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBalances = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/balances`);
      const data = await res.json();
      if (data) {
        setDebts(data.debts || []);
        setMemberSummary(data.memberSummary || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMemories = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/memories`);
      const data = await res.json();
      if (data && data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          destination: newGroupDestination,
          targetAmount: Number(newGroupTarget),
          currency: newGroupCurrency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewGroupName('');
        setNewGroupDestination('');
        setShowCreateModal(false);
        // Load and select the new group
        setSelectedGroup(data.group);
        loadGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      let finalTitle = expenseTitle;
      let finalAmount = Number(expenseAmount);
      let uploadedUrl = null;

      if (receiptFile) {
        setUploadingReceipt(true);
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        const uploadRes = await fetch(`/api/groups/${selectedGroup.id}/expenses/upload`, {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.receiptUrl;
          if (uploadData.extracted) {
            finalTitle = uploadData.extracted.merchant || finalTitle;
            finalAmount = uploadData.extracted.total || finalAmount;
          }
        }
        setUploadingReceipt(false);
      }

      const res = await fetch(`/api/groups/${selectedGroup.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle || 'Shared Expense',
          amount: finalAmount,
          currency: selectedGroup.currency,
          category: expenseCategory,
          receiptUrl: uploadedUrl,
        }),
      });

      if (res.ok) {
        setExpenseTitle('');
        setExpenseAmount('');
        setReceiptFile(null);
        loadGroupDetails(selectedGroup.id);
      }
    } catch (err) {
      console.error(err);
      setUploadingReceipt(false);
    }
  };

  const handleSettleDebt = async (debtorId: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: debtorId,
        }),
      });
      if (res.ok) {
        loadGroupDetails(selectedGroup.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (expenseId: string) => {
    const text = newNoteText[expenseId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text }),
      });
      if (res.ok) {
        setNewNoteText(prev => ({ ...prev, [expenseId]: '' }));
        loadGroupDetails(selectedGroup.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-content min-height-100dvh flex justify-center items-center" style={{ background: '#F7F4EF' }}>
        <div className="font-space-mono text-xs uppercase tracking-widest text-[#C0001F] animate-pulse">
          Loading Vaults... 🏦
        </div>
      </div>
    );
  }

  // Fallback calculations for active group
  const activeVault = selectedGroup;
  const progress = activeVault ? Math.min(100, (activeVault.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) / (activeVault.targetAmount || 1)) * 100) : 0;
  const collectedAmount = activeVault ? activeVault.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) : 0;
  const rate = 25.5; // Dummy foreign exchange rate

  const displayAmount = (amount: number) => {
    if (showSGD) return formatCurrency(amount, 'SGD');
    return formatCurrency(convertCurrency(amount, rate), activeVault?.currency === 'SGD' ? 'THB' : 'SGD');
  };

  return (
    <div className="page-content min-height-100dvh py-8 px-4 surface-light" style={{ background: '#F7F4EF', paddingTop: '90px', paddingBottom: '90px' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Group Selector Header */}
        <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-5 box-shadow-[6px_6px_0_0_#1A1A1A] flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1A1A1A] font-outfit uppercase">
              Group <span className="text-[#C0001F]">Vault</span>
            </h1>
            <p className="text-xs font-space-mono text-[#555] mt-1">
              Shared travel budgets and split bills, fr.
            </p>
          </div>
          {groups.length > 0 && (
            <select
              value={selectedGroup?.id || ''}
              onChange={(e) => {
                const grp = groups.find(g => g.id === e.target.value);
                if (grp) loadGroupDetails(grp.id);
              }}
              className="bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] font-space-mono text-xs px-3 py-1.5 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} {g.emoji || '🎒'}</option>
              ))}
            </select>
          )}
        </div>

        {/* Empty State */}
        {!activeVault && (
          <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-10 text-center box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
            <div className="text-4xl">🎒🛫</div>
            <h3 className="font-outfit text-xl font-bold uppercase">No Active Vaults</h3>
            <p className="font-space-mono text-xs text-[#555] max-w-sm mx-auto">
              Vaults help you split travel and everyday group costs dynamically using NETS and simplified billing.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#C0001F] text-white surface-red border-2 border-[#1A1A1A] py-2 px-6 font-space-mono text-xs font-bold uppercase hover:bg-[#A00018] shadow-[4px_4px_0_0_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px]"
            >
              + Create First Vault
            </button>
          </div>
        )}

        {activeVault && (
          <>
            {/* Vault Summary Card */}
            <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1A1A] font-outfit uppercase">
                    {activeVault.name} {activeVault.emoji || '🛫'}
                  </h2>
                  <p className="text-xs font-space-mono text-[#777] mt-1">
                    {activeVault.members?.length || 0} Members · Destination: {activeVault.destination || 'Global'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-space-mono font-bold text-[#C0001F] uppercase">
                    SGD vs {activeVault.currency || 'THB'}
                  </div>
                  <div className="text-[0.65rem] font-mono text-[#777] mt-0.5">
                    Rate: 1 SGD = {rate} {activeVault.currency || 'THB'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between font-space-mono text-xs font-bold">
                  <span>Spent: <strong>SGD {collectedAmount.toFixed(2)}</strong></span>
                  <span className="text-[#C0001F]">Target: <strong>SGD {activeVault.targetAmount.toFixed(2)}</strong></span>
                </div>
                <div className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] h-6 relative overflow-hidden">
                  <div
                    className="bg-[#C0001F] surface-red h-full border-r-2 border-[#1A1A1A]"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-space-mono text-[0.65rem] font-extrabold text-[#1A1A1A] pointer-events-none">
                    {progress.toFixed(0)}% FUNDED
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-[3px] border-[#1A1A1A] bg-white box-shadow-[4px_4px_0_0_#1A1A1A]">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 py-3 text-center font-space-mono text-xs font-bold uppercase border-r-[3px] border-[#1A1A1A] ${activeTab === 'expenses' ? 'bg-[#C0001F] text-white surface-red' : 'bg-white text-[#1A1A1A] surface-white'}`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('balances')}
                className={`flex-1 py-3 text-center font-space-mono text-xs font-bold uppercase border-r-[3px] border-[#1A1A1A] ${activeTab === 'balances' ? 'bg-[#C0001F] text-white surface-red' : 'bg-white text-[#1A1A1A] surface-white'}`}
              >
                Balances
              </button>
              <button
                onClick={() => setActiveTab('memories')}
                className={`flex-1 py-3 text-center font-space-mono text-xs font-bold uppercase ${activeTab === 'memories' ? 'bg-[#C0001F] text-white surface-red' : 'bg-white text-[#1A1A1A] surface-white'}`}
              >
                Memories
              </button>
            </div>

            {/* TAB CONTENT: EXPENSES */}
            {activeTab === 'expenses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Expense Form */}
                <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
                  <h3 className="font-space-mono text-xs font-black uppercase text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-2">
                    Add shared payment
                  </h3>
                  <form onSubmit={handleAddExpense} className="space-y-3.5">
                    <div>
                      <label className="block font-space-mono text-[0.65rem] font-bold text-[#1A1A1A] uppercase mb-1">
                        Expense Description
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chatuchak Souvenirs"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-space-mono text-[0.65rem] font-bold text-[#1A1A1A] uppercase mb-1">
                          Amount (SGD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-space-mono text-[0.65rem] font-bold text-[#1A1A1A] uppercase mb-1">
                          Category
                        </label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-2 py-2.5 font-space-mono text-xs focus:outline-none"
                        >
                          <option value="Food">🍔 Food</option>
                          <option value="Transport">🚕 Transport</option>
                          <option value="Shopping">🛍️ Shopping</option>
                          <option value="Entertainment">🎢 Attractions</option>
                          <option value="Others">💰 Miscellaneous</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-space-mono text-[0.65rem] font-bold text-[#1A1A1A] uppercase mb-1">
                        Receipt OCR scan (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploadingReceipt}
                      className="md:col-span-2 bg-[#1A1A1A] text-white surface-dark py-3 px-6 font-space-mono font-bold uppercase tracking-wider text-xs hover:bg-[#C0001F] disabled:opacity-40 transition-colors"
                    >
                      {uploadingReceipt ? 'Processing Receipt OCR...' : 'Log Expense & Auto Split'}
                    </button>
                  </form>
                </div>

                {/* Expense List */}
                <div className="border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4 surface-dark">
                  <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-2">
                    Expenses ledger
                  </h3>
                  <div className="divide-y-2 divide-[#333] max-h-[400px] overflow-y-auto pr-2">
                    {activeVault.expenses?.length === 0 ? (
                      <p className="text-center font-space-mono text-xs text-muted py-6">No expenses logged yet. Add one above! 💸</p>
                    ) : (
                      activeVault.expenses?.map((e: any) => (
                        <div key={e.id} className="py-4 space-y-2 text-xs font-space-mono">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm text-[#1A1A1A]">{e.title}</div>
                              <div className="text-[0.65rem] text-muted mt-0.5">
                                Paid by: <strong>{e.payer?.name}</strong> · Category: {e.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-sm">{displayAmount(e.amount)}</span>
                              {e.receiptUrl && (
                                <a
                                  href={e.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[0.6rem] text-blue-400 underline font-bold mt-1"
                                >
                                  📄 View Receipt
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="p-2.5 border border-[#1A1A1A] text-[0.7rem] space-y-1.5 surface-light">
                            {e.notes?.map((n: any, idx: number) => (
                              <div key={n.id || idx} className="text-[#1A1A1A]">
                                <strong>{n.user?.name}:</strong> {n.note}
                              </div>
                            ))}
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Add custom context note..."
                                value={newNoteText[e.id] || ''}
                                onChange={(evt) => setNewNoteText(prev => ({ ...prev, [e.id]: evt.target.value }))}
                                className="flex-1 bg-white surface-white border border-[#1A1A1A] px-2 py-0.5 text-[0.65rem] focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddNote(e.id)}
                                className="bg-[#1A1A1A] text-white surface-dark px-2 py-0.5 text-[0.65rem] font-bold"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BALANCES */}
            {activeTab === 'balances' && (
              <div className="space-y-6">
                <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
                  <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-2">
                    ⚖️ Simplified Debts (Greedy Algorithm)
                  </h3>
                  <div className="divide-y-2 divide-[#1A1A1A]">
                    {debts.length === 0 ? (
                      <p className="text-center font-space-mono text-xs text-green-600 font-bold py-6">🎉 Everyone is fully settled!</p>
                    ) : (
                      debts.map((d, idx) => (
                        <div key={idx} className="py-4 flex justify-between items-center text-xs font-space-mono">
                          <div>
                            <strong>{d.fromName}</strong> owes <strong>{d.toName}</strong>
                            <div className="text-[0.65rem] text-muted mt-0.5">Via automated debt simplification</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black">{displayAmount(d.amount)}</span>
                            <button
                              onClick={() => handleSettleDebt(d.toUser)}
                              className="bg-[#10B981] text-white border border-[#1A1A1A] px-2.5 py-1 text-[0.65rem] font-bold hover:bg-[#059669] shadow-[2px_2px_0_0_#1A1A1A] active:translate-x-0"
                            >
                              Settle
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
                  <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-2">
                    User Summary (Net Lending)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {memberSummary.map((m, idx) => (
                      <div key={idx} className="p-3 border-2 border-[#1A1A1A] surface-light flex justify-between items-center">
                        <span className="font-space-mono text-xs font-bold">{m.name}</span>
                        <span className={`font-space-mono text-xs font-black ${m.netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.netBalance >= 0 ? '+' : ''}{displayAmount(m.netBalance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEMORIES */}
            {activeTab === 'memories' && (
              <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-6">
                <div>
                  <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-2">
                    🔮 Travel Memory Feed (AI Curated)
                  </h3>
                  <p className="text-[0.65rem] font-space-mono text-muted mt-1">
                    Summarises settled vault transactions into nostalgic monthly updates using Claude.
                  </p>
                </div>

                <div className="space-y-6">
                  {Object.keys(memories).length === 0 ? (
                    <p className="text-center font-space-mono text-xs text-muted py-6">Log and settle some expenses to unlock your travel memories! 🏞️</p>
                  ) : (
                    Object.entries(memories).map(([month, mem]: [string, any]) => (
                      <div key={month} className="p-4 border-2 border-[#1A1A1A] surface-dark relative overflow-hidden space-y-2 box-shadow-[4px_4px_0_0_#1A1A1A]">
                        <div className="text-[0.6rem] font-space-mono font-bold text-[#FF2D87] uppercase tracking-wider">
                          🗓️ {new Date(month + '-02').toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })}
                        </div>
                        <p className="font-space-mono text-xs italic leading-relaxed">
                          &ldquo;{mem.summary}&rdquo;
                        </p>
                        <div className="text-[0.6rem] font-mono text-muted pt-1">
                          Total spent: SGD {mem.totalSpent?.toFixed(2)} across {mem.expenseCount} transactions.
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Vault Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#C0001F] text-white surface-red border-[3px] border-[#1A1A1A] py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-xs hover:bg-[#A00018] box-shadow-[4px_4px_0_0_#1A1A1A] transition-all"
        >
          + Create New Vault
        </button>

      </div>

      {/* CREATE VAULT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white surface-white border-[3px] border-[#1A1A1A] p-6 max-w-md w-full box-shadow-[8px_8px_0_0_#1A1A1A]">
            <div className="flex justify-between items-center border-b-2 border-[#1A1A1A] pb-3 mb-4">
              <h3 className="font-outfit font-black text-lg uppercase">Create Vault🎒</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-xl font-bold font-mono">×</button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block font-space-mono text-xs font-bold uppercase mb-1">
                  Vault Name / Trip
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangkok Graduation Trip"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-space-mono text-xs font-bold uppercase mb-1">
                  Destination Country
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thailand or Malaysia"
                  value={newGroupDestination}
                  onChange={(e) => setNewGroupDestination(e.target.value)}
                  className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-space-mono text-xs font-bold uppercase mb-1">
                  Target Budget (SGD)
                </label>
                <input
                  type="number"
                  required
                  value={newGroupTarget}
                  onChange={(e) => setNewGroupTarget(Number(e.target.value))}
                  className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-space-mono text-xs font-bold uppercase mb-1">
                  Foreign Currency
                </label>
                <select
                  value={newGroupCurrency}
                  onChange={(e) => setNewGroupCurrency(e.target.value)}
                  className="w-full bg-[#F7F4EF] surface-light border-2 border-[#1A1A1A] px-3 py-2 font-space-mono text-xs focus:outline-none"
                >
                  <option value="SGD">SGD (Singapore Dollar)</option>
                  <option value="MYR">MYR (Malaysian Ringgit)</option>
                  <option value="THB">THB (Thai Baht)</option>
                  <option value="JPY">JPY (Japanese Yen)</option>
                  <option value="IDR">IDR (Indonesian Rupiah)</option>
                  <option value="VND">VND (Vietnamese Dong)</option>
                  <option value="AUD">AUD (Australian Dollar)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1A1A1A] text-white surface-dark py-3 font-space-mono font-bold uppercase tracking-wider text-xs hover:bg-[#C0001F] transition-colors"
              >
                Create Shared Vault
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
