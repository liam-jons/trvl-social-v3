// Service Worker for handling background notifications
// This runs in the background even when the app is closed

const CACHE_NAME = 'trvl-notifications-v1';
const NOTIFICATION_TAG = 'trvl-notification';

// Install event - cache notification assets
self.addEventListener('install', (event) => {
  console.log('Notification service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/icon-192.png',
        '/icon-512.png',
        '/badge-72.png',
        '/icons/offer.png',
        '/icons/booking.png',
        '/icons/group.png',
        '/icons/match.png',
        '/icons/reminder.png',
        '/icons/payment.png'
      ]).catch((err) => {
        // Ignore cache errors for now
        console.warn('Could not cache notification assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Notification service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('trvl-notifications-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'TRVL Social',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: false,
    actions: []
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.error('Error parsing push data:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {},
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);

  const notification = event.notification;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
      case 'accept':
      case 'pay':
        // Open the app with the specific URL
        event.waitUntil(
          openAppWithUrl(data.url || '/')
        );
        break;
      case 'dismiss':
      case 'decline':
        // Just close the notification (already done above)
        break;
      default:
        console.log('Unknown notification action:', event.action);
    }
  } else {
    // Regular notification click - open the app
    event.waitUntil(
      openAppWithUrl(data.url || '/')
    );
  }
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification);

  // Could send analytics event here
  const data = event.notification.data || {};
  if (data.notificationId) {
    // Track dismissal
    trackNotificationEvent(data.notificationId, 'dismissed');
  }
});

// Helper function to open the app with a specific URL
async function openAppWithUrl(url = '/') {
  try {
    // Get all window clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // If there's an existing window, focus it and navigate
    if (clients.length > 0) {
      const client = clients[0];
      await client.focus();

      // Navigate to the URL if it's different
      if (client.url !== url) {
        return client.navigate(url);
      }
      return client;
    }

    // Otherwise, open a new window
    return self.clients.openWindow(url);
  } catch (error) {
    console.error('Error opening app window:', error);
    // Fallback - just open the root URL
    return self.clients.openWindow('/');
  }
}

// Helper function to track notification events
function trackNotificationEvent(notificationId, eventType) {
  try {
    // Send message to main app for analytics tracking
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_EVENT',
          payload: {
            notificationId,
            eventType,
            timestamp: Date.now()
          }
        });
      });
    });
  } catch (error) {
    console.error('Error tracking notification event:', error);
  }
}

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);

  if (event.tag === 'notification-sync') {
    event.waitUntil(
      syncNotifications()
    );
  }
});

// Helper function to sync notifications when back online
async function syncNotifications() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();

    // Notify clients to sync notifications
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_NOTIFICATIONS'
      });
    });
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}