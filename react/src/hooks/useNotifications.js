import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from './useAuth';

const POLL_INTERVAL = 30_000; // 30 segundos

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data?.count ?? 0);
    } catch {
      // silencia erros de polling
    }
  }, [isAuthenticated]);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getAll();
      setNotifications(data?.notifications ?? []);
    } catch {
      // silencia erros
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id) => {
    await notificationApi.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await notificationApi.delete(id);
    const removed = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (removed && !removed.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Polling do contador
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Busca a lista completa quando abre o dropdown
  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  return {
    unreadCount,
    notifications,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
