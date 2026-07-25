import { useAppStore } from '@/store';
import { clsx } from 'clsx';

export function NotificationsPanel() {
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const clearNotifications = useAppStore((s) => s.clearNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-stellar-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-full bg-stellar-500/10 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.slice(0, 20).map((notification) => (
            <div
              key={notification.id}
              onClick={() => markNotificationRead(notification.id)}
              className={clsx(
                'p-3 rounded-xl border transition-colors cursor-pointer',
                notification.read
                  ? 'bg-orbit-darker/30 border-orbit-border/30'
                  : 'bg-orbit-darker/50 border-orbit-border/50 hover:border-orbit-border',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    notification.type === 'success' && 'bg-emerald-500/10',
                    notification.type === 'error' && 'bg-red-500/10',
                    notification.type === 'warning' && 'bg-amber-500/10',
                    notification.type === 'info' && 'bg-blue-500/10',
                  )}
                >
                  {notification.type === 'success' && (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {(notification.type === 'warning' || notification.type === 'info') && (
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{notification.message}</p>
                  {notification.txHash && (
                    <a
                      href={notification.explorerUrl || `https://stellar.expert/explorer/testnet/tx/${notification.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-stellar-400 hover:text-stellar-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Transaction ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
