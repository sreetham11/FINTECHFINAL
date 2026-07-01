'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { friends } from '@/data/friends';
import { useRouter } from 'next/navigation';

interface ParsedItem {
  item: string;
  price: number;
}

export default function ScannerPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Which friends are in the split (by ID)
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  
  // Mapping of item index -> array of friend IDs who are splitting this item
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useApp();
  const router = useRouter();

  const handleDemoReceipt = async () => {
    setImageSrc('/receipt-placeholder.jpg'); // Just a visual mock
    setIsScanning(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    setParsedItems([
      { "item": "Chicken Rice", "price": 4.50 },
      { "item": "Teh Tarik", "price": 1.80 },
      { "item": "Char Kway Teow", "price": 5.00 },
      { "item": "Kopi", "price": 1.50 },
      { "item": "Otah", "price": 2.00 }
    ]);
    setIsScanning(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImageSrc(base64);
      setIsScanning(true);

      try {
        const response = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          setParsedItems(data.items);
        } else {
          showToast('Could not read receipt. Try a clearer photo or use the demo receipt.');
          setImageSrc(null);
        }
      } catch {
        showToast('Could not read receipt. Try a clearer photo or use the demo receipt.');
        setImageSrc(null);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFriend = (id: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFriends(newSelected);
    
    // Automatically assign all selected friends to all items initially for convenience
    const newAssignments: Record<number, string[]> = {};
    parsedItems.forEach((_, index) => {
      newAssignments[index] = Array.from(newSelected);
      // Also include the user themselves ('user-sree')
      newAssignments[index].push('user-sree');
    });
    setItemAssignments(newAssignments);
  };

  const toggleItemAssignment = (itemIndex: number, friendId: string) => {
    setItemAssignments(prev => {
      const current = prev[itemIndex] || [];
      if (current.includes(friendId)) {
        return { ...prev, [itemIndex]: current.filter(id => id !== friendId) };
      } else {
        return { ...prev, [itemIndex]: [...current, friendId] };
      }
    });
  };

  // Calculate my share
  let myShare = 0;
  let totalAmount = 0;
  
  parsedItems.forEach((item, index) => {
    totalAmount += item.price;
    const assignees = itemAssignments[index] || ['user-sree']; 
    if (assignees.includes('user-sree') || assignees.length === 0) {
      // If nobody assigned, assume user pays for it. If user is in assignees, split it.
      const divisor = Math.max(1, assignees.length);
      myShare += item.price / divisor;
    }
  });

  const confirmSplit = () => {
    if (parsedItems.length === 0) return;

    showToast('Split saved ✨ Added to Group Vault');
    
    setTimeout(() => {
      addTransaction({
        id: `split-${Date.now()}`,
        merchant: 'Receipt Split',
        category: 'hawker',
        amount: myShare,
        currency: 'SGD',
        location: 'Singapore',
        area: 'Local',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        friendIds: Array.from(selectedFriends),
        mood: 'happy',
        moodEmoji: '🧾',
        memoryLine: `Split a ${totalAmount.toFixed(2)} bill ${selectedFriends.size > 0 ? 'with the squad' : 'by myself'}`,
        isOverseas: false,
        isMemory: true, // Memory integration requirement
      });
      router.push('/');
    }, 1500);
  };

  return (
    <div className="page-content" style={{ paddingBottom: '100px' }}>
      
      {!imageSrc && !parsedItems.length && (
        <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="text-display" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            Scan your receipt to split instantly
          </div>
          
          <div 
            style={{
              border: '2px dashed var(--nets-red)',
              borderRadius: '12px',
              padding: '60px 20px',
              margin: '30px 0',
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--nets-red)" strokeWidth="2">
              <path d="M3 3h18v18H3z" />
              <path d="M8 8h8M8 12h8M8 16h4" />
            </svg>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn-primary" 
                onClick={() => cameraInputRef.current?.click()}
              >
                Take Photo
              </button>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn-secondary" 
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Receipt
              </button>
            </div>
          </div>

          <button 
            className="btn-secondary" 
            onClick={handleDemoReceipt}
            style={{ borderStyle: 'dashed' }}
          >
            Try Demo Receipt
          </button>
        </div>
      )}

      {isScanning && (
        <div className="animate-slap" style={{
          position: 'fixed', inset: 0, background: 'var(--body-bg)', zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            width: '200px', height: '300px', background: '#fff', border: '3px solid var(--ink-black)',
            position: 'relative', overflow: 'hidden', boxShadow: '8px 8px 0 var(--ink-black)'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--nets-red)',
              boxShadow: '0 0 10px var(--nets-red)',
              animation: 'scanLine 2s ease-in-out infinite alternate'
            }} />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.3 }}>
              <div style={{ height: '8px', background: '#ccc', width: '60%' }} />
              <div style={{ height: '8px', background: '#ccc', width: '80%' }} />
              <div style={{ height: '8px', background: '#ccc', width: '40%' }} />
              <div style={{ height: '8px', background: '#ccc', width: '70%' }} />
            </div>
          </div>
          <div className="text-display" style={{ marginTop: '24px', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>
            Claude is reading your receipt...
          </div>
          <style>{`
            @keyframes scanLine {
              0% { transform: translateY(0); }
              100% { transform: translateY(300px); }
            }
          `}</style>
        </div>
      )}

      {parsedItems.length > 0 && !isScanning && (
        <div className="animate-slide-up" style={{ marginTop: '20px' }}>
          
          <div className="section-header">Split with</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', margin: '12px 0 24px' }}>
            {friends.map(friend => {
              const isSelected = selectedFriends.has(friend.id);
              return (
                <div 
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px',
                    border: `2px solid ${isSelected ? friend.color : 'var(--border-color)'}`,
                    borderRadius: '20px',
                    background: isSelected ? 'var(--card-bg)' : 'transparent',
                    opacity: isSelected ? 1 : 0.6,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', background: friend.color, 
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 900
                  }}>
                    {friend.avatar}
                  </div>
                  <span className="text-mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{friend.name}</span>
                </div>
              );
            })}
          </div>

          <div className="zine-card card-dark surface-dark">
            <div className="text-mono" style={{ marginBottom: '16px', fontSize: '0.8rem' }}>Receipt Items</div>
            <div className="divider-dashed" style={{ borderColor: '#333' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {parsedItems.map((item, idx) => {
                const assignees = itemAssignments[idx] || [];
                
                return (
                  <div key={idx} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '12px', 
                    border: '1px solid #333',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-mono-bold">{item.item}</span>
                      <span className="text-mono-bold">${item.price.toFixed(2)}</span>
                    </div>
                    
                    {selectedFriends.size > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                        <div 
                          onClick={() => toggleItemAssignment(idx, 'user-sree')}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--nets-red)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer',
                            opacity: assignees.includes('user-sree') ? 1 : 0.3
                          }}
                        >
                          Me
                        </div>
                        {Array.from(selectedFriends).map(fid => {
                          const f = friends.find(fr => fr.id === fid);
                          if (!f) return null;
                          return (
                            <div 
                              key={fid}
                              onClick={() => toggleItemAssignment(idx, fid)}
                              style={{
                                width: '24px', height: '24px', borderRadius: '50%', background: f.color,
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer',
                                opacity: assignees.includes(fid) ? 1 : 0.3
                              }}
                            >
                              {f.avatar}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="divider-dashed" style={{ borderColor: '#333', marginTop: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <span className="text-mono">Total</span>
              <span className="text-mono-bold">${totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span className="text-display" style={{ fontSize: '1.2rem' }}>Your share</span>
              <span className="text-display" style={{ fontSize: '1.2rem' }}>${myShare.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="btn-primary animate-slap" 
            style={{ width: '100%', marginTop: '24px', fontSize: '1.2rem', padding: '16px' }}
            onClick={confirmSplit}
          >
            Confirm Split
          </button>
        </div>
      )}

      {toastMessage && (
        <div className="animate-slap" style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border-color)',
          boxShadow: '4px 4px 0 var(--ink-black)',
          padding: '12px 24px',
          fontWeight: 800,
          fontSize: '0.9rem',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          color: 'var(--text-primary)'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
