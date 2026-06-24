'use client';

import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';

const mockNotifications = [
  {
    id: 1,
    type: 'payment',
    icon: '💸',
    title: 'Payment Received',
    message: 'Kai paid you $12.50 for Hai Di Lao dinner.',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'vault',
    icon: '🏝️',
    title: 'Vault Reminder',
    message: "Wei still hasn't paid into the Bangkok vault. Time to nudge?",
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'friend',
    icon: '🍜',
    title: 'Friend Activity',
    message: 'Kai just paid at Chinatown Complex.',
    time: '1 day ago',
  },
  {
    id: 4,
    type: 'overseas',
    icon: '✈️',
    title: 'Welcome to Bangkok',
    message: "You've arrived in Bangkok — Overseas Mode activated automatically.",
    time: '2 days ago',
  },
];

export default function NotificationsPage() {
  const { language } = useApp();

  return (
    <div className="page-content">
      {/* Header stamp */}
      <div className="animate-slap" style={{ margin: '20px 0 0' }}>
        <div
          className="stamp-tag stamp-tag-outline"
          style={{
            fontSize: '0.7rem',
            padding: '6px 12px',
            transform: 'rotate(-1.5deg)',
            display: 'inline-block',
          }}
        >
          {t('notifications.feed', language)}
        </div>
      </div>

      <div className="animate-slide-up stagger-1" style={{ margin: '12px 0 16px' }}>
        <div className="text-display" style={{ fontSize: '1.8rem', lineHeight: '0.95' }}>
          {t('notifications.title', language)}
        </div>
      </div>

      <div className="animate-slide-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockNotifications.map((notif, i) => (
          <div 
            key={notif.id} 
            className="notification-item animate-slide-up"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="notification-icon">
              {notif.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {notif.title}
                </div>
                <div className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {notif.time}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                {notif.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
