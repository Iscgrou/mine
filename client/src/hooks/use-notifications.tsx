import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import type { Notification } from '@/components/notification-center';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  urgentCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  // Fetch system notifications from the server
  const { data: systemNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
    select: (data: any[]) => data?.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      priority: item.priority || 'medium',
      timestamp: new Date(item.createdAt),
      read: item.read || false,
      actionRequired: item.actionRequired || false,
      relatedEntity: item.relatedEntity,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
    })) || []
  });

  // Merge system notifications with local notifications
  useEffect(() => {
    if (systemNotifications) {
      setNotifications(prev => {
        const localNotifications = prev.filter(n => !n.id.startsWith('sys_'));
        return [...systemNotifications, ...localNotifications];
      });
    }
  }, [systemNotifications]);

  // Listen for real-time events to create notifications
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          addNotification({
            title: data.title,
            message: data.message,
            type: data.notificationType || 'info',
            priority: data.priority || 'medium',
            actionRequired: data.actionRequired || false,
            relatedEntity: data.relatedEntity
          });
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: nanoid(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-dismiss low priority notifications after 10 seconds
    if (notification.priority === 'low') {
      setTimeout(() => {
        dismiss(notification.id);
      }, 10000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // If it's a system notification, update on server
    if (id.startsWith('sys_')) {
      fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        .catch(error => console.error('Failed to mark notification as read:', error));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Update all system notifications on server
    fetch('/api/notifications/mark-all-read', { method: 'POST' })
      .catch(error => console.error('Failed to mark all notifications as read:', error));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));

    // If it's a system notification, dismiss on server
    if (id.startsWith('sys_')) {
      fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        .catch(error => console.error('Failed to dismiss notification:', error));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    
    // Clear all system notifications on server
    fetch('/api/notifications', { method: 'DELETE' })
      .catch(error => console.error('Failed to clear all notifications:', error));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  // Generate contextual notifications based on data changes
  useEffect(() => {
    // Listen for query cache updates to generate smart notifications
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.data) {
        const queryKey = event.query.queryKey[0] as string;
        
        // Generate notifications for specific data changes
        if (queryKey === '/api/invoices') {
          const invoices = event.query.state.data as any[];
          const overdueInvoices = invoices?.filter(invoice => 
            invoice.status === 'overdue' || 
            (invoice.dueDate && new Date(invoice.dueDate) < new Date())
          );
          
          if (overdueInvoices?.length > 0) {
            addNotification({
              title: 'فاکتورهای معوق',
              message: `${overdueInvoices.length} فاکتور دارای تاریخ سررسید گذشته است`,
              type: 'warning',
              priority: 'high',
              actionRequired: true,
              relatedEntity: {
                type: 'invoice',
                id: 'overdue',
                name: 'فاکتورهای معوق'
              }
            });
          }
        }
        
        if (queryKey === '/api/representatives') {
          const representatives = event.query.state.data as any[];
          const inactiveReps = representatives?.filter(rep => rep.status === 'inactive');
          
          if (inactiveReps?.length > 5) {
            addNotification({
              title: 'نمایندگان غیرفعال',
              message: `${inactiveReps.length} نماینده غیرفعال شده‌اند`,
              type: 'info',
              priority: 'medium',
              relatedEntity: {
                type: 'representative',
                id: 'inactive',
                name: 'نمایندگان غیرفعال'
              }
            });
          }
        }
      }
    });

    return unsubscribe;
  }, [queryClient, addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    unreadCount,
    urgentCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Utility hooks for specific notification types
export function useTaskNotifications() {
  const { addNotification } = useNotifications();
  
  const notifyTaskDue = (taskTitle: string, dueDate: Date, representativeName?: string) => {
    addNotification({
      title: 'یادآوری کار',
      message: `کار "${taskTitle}" در تاریخ ${dueDate.toLocaleDateString('fa-IR')} سررسید دارد`,
      type: 'task',
      priority: 'high',
      actionRequired: true,
      relatedEntity: representativeName ? {
        type: 'representative',
        id: 'task',
        name: representativeName
      } : undefined
    });
  };

  const notifyTaskOverdue = (taskTitle: string, representativeName?: string) => {
    addNotification({
      title: 'کار عقب‌افتاده',
      message: `کار "${taskTitle}" از موعد مقرر عقب افتاده است`,
      type: 'urgent',
      priority: 'urgent',
      actionRequired: true,
      relatedEntity: representativeName ? {
        type: 'representative',
        id: 'overdue-task',
        name: representativeName
      } : undefined
    });
  };

  return { notifyTaskDue, notifyTaskOverdue };
}

export function useSystemNotifications() {
  const { addNotification } = useNotifications();
  
  const notifySystemStatus = (status: 'healthy' | 'warning' | 'error', message: string) => {
    addNotification({
      title: 'وضعیت سیستم',
      message,
      type: status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'error',
      priority: status === 'error' ? 'urgent' : status === 'warning' ? 'high' : 'low',
      relatedEntity: {
        type: 'system',
        id: 'status',
        name: 'سیستم MarFanet'
      }
    });
  };

  const notifyAIProcessing = (type: 'started' | 'completed' | 'failed', description: string) => {
    addNotification({
      title: 'پردازش هوش مصنوعی',
      message: description,
      type: type === 'completed' ? 'success' : type === 'failed' ? 'error' : 'info',
      priority: type === 'failed' ? 'high' : 'medium',
      relatedEntity: {
        type: 'system',
        id: 'ai',
        name: 'سیستم هوش مصنوعی'
      }
    });
  };

  return { notifySystemStatus, notifyAIProcessing };
}