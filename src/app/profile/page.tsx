'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { currentUser } from '@/data/user';
import { t, languageNames } from '@/data/translations';
import type { Language } from '@/context/AppContext';

export default function ProfilePage() {
  const { allTransactions, personality, language, setLanguage, theme, setTheme } = useApp();
  const { userName, setUserName } = useApp();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName || currentUser.name);
  const [editBio, setEditBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('nets-quest-avatar');
    if (savedAvatar) setAvatarPreview(savedAvatar);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        localStorage.setItem('nets-quest-avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setUserName(editName);
    setIsEditing(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText('https://nets-quest.vercel.app/friends/sree_sg');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-content">
      {/* Profile Header */}
      <div className="animate-slap" style={{ textAlign: 'center', marginTop: '20px', position: 'relative' }}>
        <div 
          className="profile-avatar-large" 
          onClick={() => setIsEditing(!isEditing)}
          style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative', margin: '0 auto' }}
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--nets-red)', padding: '4px', borderRadius: '50%', color: '#fff', border: '2px solid var(--card-bg)' }}>
            ✏️
          </div>
        </div>
        
        <div className="text-display text-display-lg" style={{ margin: '16px 0 4px' }}>
          {userName || currentUser.name}
        </div>
        <div className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {t('profile.memberSince', language)} {currentUser.memberSince}
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="zine-card animate-slide-up" style={{ marginTop: '16px', border: '2px dashed var(--ink-black)' }}>
          <div className="text-display" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Edit Profile</div>
          
          <div style={{ marginBottom: '12px' }}>
            <label className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Profile Picture</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '0.8rem' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Display Name</label>
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--ink-black)', fontFamily: 'inherit', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>About me (How would you describe your spending life?)</label>
            <textarea 
              value={editBio} 
              onChange={e => setEditBio(e.target.value)} 
              placeholder="e.g. Hawker enthusiast based in Jurong West 🍜"
              maxLength={80}
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--ink-black)', fontFamily: 'inherit', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>NETS member since</label>
            <div className="text-mono-bold" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
              2024
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveProfile} style={{ width: '100%' }}>
            Save Changes
          </button>
        </div>
      )}

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
      <div className="zine-card zine-card-red card-red surface-red animate-slide-up stagger-3 halftone-bg" style={{ transform: 'rotate(-0.5deg)' }}>
        <div className="text-display" style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
          {personality.title}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {personality.traits.map(t => (
            <span key={t.label} className="stamp-tag stamp-tag-outline" style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)' }}>
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
