'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { currentUser } from '@/data/user';
import { t, languageNames } from '@/data/translations';
import type { Language, Theme } from '@/context/AppContext';

export default function ProfilePage() {
  const { allTransactions, personality, language, setLanguage, theme, setTheme } = useApp();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText('https://nets-quest.vercel.app/friends/sree_sg');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-content">
      {/* Profile Header */}
      <div className="animate-slap" style={{ textAlign: 'center', marginTop: '20px' }}>
        <div className="profile-avatar-large">
          {currentUser.avatar}
        </div>
        
        <div className="text-display text-display-lg" style={{ margin: '16px 0 4px' }}>
          {currentUser.name}
        </div>
        <div className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {t('profile.memberSince', language)} {currentUser.memberSince}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="animate-slide-up stagger-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '24px 0' }}>
        <div className="zine-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('profile.lifetimePayments', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--nets-red)' }}>
            1,204
          </div>
        </div>
        <div className="zine-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('profile.memoriesCreated', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--nets-blue)' }}>
            {allTransactions.length + 20}
          </div>
        </div>
        <div className="zine-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('profile.friendsCount', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--dirty-yellow)' }}>
            12
          </div>
        </div>
        <div className="zine-card" style={{ padding: '12px', textAlign: 'center' }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('profile.countriesVisited', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--hot-pink)' }}>
            4
          </div>
        </div>
      </div>

      {/* Share Profile Button */}
      <div className="animate-slide-up stagger-2" style={{ marginBottom: '24px' }}>
        <button className="share-btn" onClick={handleShare}>
          {copied ? t('profile.linkCopied', language) : t('profile.shareProfile', language)}
        </button>
      </div>

      {/* Personality Badge summary */}
      <div className="section-header animate-slide-up stagger-3">{t('profile.personalityType', language)}</div>
      <div className="zine-card zine-card-red card-red animate-slide-up stagger-3 halftone-bg" style={{ transform: 'rotate(-0.5deg)' }}>
        <div className="text-display" style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
          {personality.title}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {personality.traits.map(t => (
            <span key={t.label} className="stamp-tag stamp-tag-outline" style={{ background: 'white', color: '#000', borderColor: '#000' }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* App Settings */}
      <div className="section-header animate-slide-up stagger-4" style={{ marginTop: '32px' }}>
        {t('profile.settings', language)}
      </div>
      
      <div className="settings-group animate-slide-up stagger-4">
        
        {/* Language Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {t('profile.language', language)}
          </div>
          <div className="language-options">
            {(Object.keys(languageNames) as Language[]).map((langCode) => (
              <button
                key={langCode}
                className={`language-option ${language === langCode ? 'active' : ''}`}
                onClick={() => setLanguage(langCode)}
              >
                {languageNames[langCode]}
              </button>
            ))}
          </div>
        </div>

        <div className="divider-dashed" />

        {/* Theme Toggle */}
        <div style={{ marginTop: '16px' }}>
          <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {t('profile.theme', language)}
          </div>
          <div className="theme-toggle">
            <button
              className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              ☀️ {t('profile.lightMode', language)}
            </button>
            <button
              className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              🌙 {t('profile.darkMode', language)}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
