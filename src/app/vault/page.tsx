'use client';

import { useState } from 'react';
import { getActiveVault, getCompletedVaults } from '@/data/vaults';
import { formatCurrency, convertCurrency } from '@/lib/utils';

export default function VaultPage() {
  const [showSGD, setShowSGD] = useState(true);
  const activeVault = getActiveVault();
  const completedVaults = getCompletedVaults();

  if (!activeVault) return null;

  const progress = (activeVault.collectedAmount / activeVault.targetAmount) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const rate = activeVault.exchangeRate || 1;

  const displayAmount = (amount: number) => {
    if (showSGD) return formatCurrency(amount, 'SGD');
    return formatCurrency(convertCurrency(amount, rate), activeVault.foreignCurrency || 'THB');
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="animate-slap" style={{ margin: '20px 0 0' }}>
        <div
          className="stamp-tag stamp-tag-blue"
          style={{
            fontSize: '0.7rem',
            padding: '6px 12px',
            transform: 'rotate(-1.5deg)',
            display: 'inline-block',
          }}
        >
          GROUP VAULT
        </div>
      </div>

      <div className="animate-slide-up stagger-1" style={{ margin: '12px 0' }}>
        <div className="text-display" style={{ fontSize: '1.8rem', lineHeight: '0.95' }}>
          {activeVault.name} {activeVault.emoji}
        </div>
        <div className="text-mono" style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
          {activeVault.members.length} PEOPLE · {activeVault.destination.toUpperCase()}
        </div>
      </div>

      {/* Currency Toggle */}
      <div className="currency-toggle animate-slide-up stagger-2" style={{ marginBottom: '16px' }}>
        <button
          className={`currency-toggle-btn ${showSGD ? 'active' : ''}`}
          onClick={() => setShowSGD(true)}
        >
          SGD $
        </button>
        <button
          className={`currency-toggle-btn ${!showSGD ? 'active' : ''}`}
          onClick={() => setShowSGD(false)}
        >
          {activeVault.foreignCurrency} {activeVault.foreignCurrency === 'THB' ? '฿' : '$'}
        </button>
      </div>

      {/* Progress Ring + Amount */}
      <div
        className="zine-card zine-card-blue card-dark animate-slide-up stagger-3"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          transform: 'rotate(-0.5deg)',
        }}
      >
        {/* SVG Progress Ring */}
        <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
          <svg width="110" height="110" viewBox="0 0 110 110" className="vault-progress-ring">
            <circle className="vault-progress-bg" cx="55" cy="55" r="45" />
            <circle
              className="vault-progress-fill"
              cx="55"
              cy="55"
              r="45"
              stroke={progress >= 100 ? 'var(--stamp-green)' : 'var(--nets-red)'}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(90deg)',
            textAlign: 'center',
          }}>
            <div className="text-display" style={{ fontSize: '1.3rem', color: 'var(--nets-red)' }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div>
          <div className="text-mono" style={{ fontSize: '0.6rem', color: '#999' }}>COLLECTED</div>
          <div className="text-display" style={{ fontSize: '1.6rem' }}>
            {displayAmount(activeVault.collectedAmount)}
          </div>
          <div className="text-mono" style={{ fontSize: '0.65rem', color: '#999', marginTop: '2px' }}>
            of {displayAmount(activeVault.targetAmount)} target
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className="stamp-tag stamp-tag-yellow" style={{ fontSize: '0.55rem' }}>
              {displayAmount(activeVault.targetAmount - activeVault.collectedAmount)} TO GO
            </span>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="section-header animate-slide-up stagger-4">MEMBERS</div>
      <div className="zine-card card-dark animate-slide-up stagger-4" style={{ transform: 'rotate(0.5deg)' }}>
        {activeVault.members.map((member) => (
          <div key={member.friendId} className="vault-member">
            <div
              className="vault-member-avatar"
              style={{
                background: member.status === 'paid' ? 'var(--dirty-yellow)' : 'var(--paper-grey)',
              }}
            >
              {member.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.name}</div>
              <div className="text-mono" style={{ fontSize: '0.7rem', color: '#999' }}>
                {displayAmount(member.contribution)}
              </div>
            </div>
            <span
              className={`stamp-tag ${member.status === 'paid' ? 'stamp-tag-green' : 'stamp-tag-outline'}`}
              style={{ transform: `rotate(${member.status === 'paid' ? '-1' : '1'}deg)` }}
            >
              {member.status === 'paid' ? '✓ PAID' : 'PENDING'}
            </span>
          </div>
        ))}

        <button
          className="btn-secondary"
          style={{ marginTop: '12px', fontSize: '0.65rem' }}
        >
          + ADD MEMBERS
        </button>
      </div>

      {/* Transaction Log */}
      <div className="section-header animate-slide-up stagger-5">VAULT TRANSACTIONS</div>
      <div className="zine-card animate-slide-up stagger-5" style={{ transform: 'rotate(-0.3deg)' }}>
        {activeVault.transactions.map((txn) => (
          <div key={txn.id} className="vault-txn">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{txn.merchant}</div>
              <div className="text-mono" style={{ fontSize: '0.6rem', color: '#999' }}>
                {txn.triggeredBy} · {txn.date}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-mono-bold" style={{ fontSize: '0.82rem', color: 'var(--nets-red)' }}>
                -{displayAmount(txn.amount)}
              </div>
              {txn.foreignAmount && !showSGD && (
                <div className="text-mono" style={{ fontSize: '0.6rem', color: '#999' }}>
                  ({formatCurrency(txn.foreignAmount, txn.foreignCurrency || 'THB')})
                </div>
              )}
              {txn.foreignAmount && showSGD && (
                <div className="text-mono" style={{ fontSize: '0.6rem', color: '#999' }}>
                  ({formatCurrency(txn.foreignAmount, txn.foreignCurrency || 'THB')})
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completed Vaults */}
      {completedVaults.length > 0 && (
        <>
          <div className="section-header animate-slide-up stagger-6">COMPLETED VAULTS</div>
          {completedVaults.map((vault) => (
            <div
              key={vault.id}
              className="zine-card animate-slide-up stagger-7"
              style={{
                transform: 'rotate(0.8deg)',
                opacity: 0.7,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>
                    {vault.name} {vault.emoji}
                  </div>
                  <div className="text-mono" style={{ fontSize: '0.65rem', color: '#999' }}>
                    {vault.members.length} people · {formatCurrency(vault.targetAmount)}
                  </div>
                </div>
                <span
                  className="stamp-tag stamp-tag-green"
                  style={{
                    transform: 'rotate(-3deg)',
                    fontSize: '0.7rem',
                    padding: '4px 10px',
                  }}
                >
                  ✓ COMPLETED
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Create New Vault */}
      <button className="btn-primary animate-slide-up stagger-8" style={{ marginTop: '20px' }}>
        + CREATE NEW VAULT
      </button>

      {/* Footer */}
      <div style={{ textAlign: 'center', margin: '20px 0 8px' }}>
        <div className="text-mono" style={{ fontSize: '0.55rem', color: '#bbb' }}>
          VAULT&apos;S LOOKING HEALTHY FR — NETS QUEST 2026
        </div>
      </div>
    </div>
  );
}
