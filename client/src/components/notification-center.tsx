import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'task' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionRequired?: boolean;
  relatedEntity?: {
    type: 'representative' | 'invoice' | 'task' | 'payment' | 'system';
    id: string;
    name: string;
  };
  expiresAt?: Date;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onActionClick?: (notification: Notification) => void;
}

const priorityColors = {
  low: 'bg-gray-100 border-gray-300 text-gray-700',
  medium: 'bg-blue-50 border-blue-300 text-blue-700',
  high: 'bg-orange-50 border-orange-300 text-orange-700',
  urgent: 'bg-red-50 border-red-300 text-red-700'
};

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  task: Clock,
  urgent: AlertTriangle
};

const typeColors = {
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  task: 'text-purple-500',
  urgent: 'text-red-600'
};

// Simple standalone component for CRM dashboard
export function NotificationCenter() {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'تیکت جدید دریافت شد',
      message: 'مشتری جدید نیاز به پشتیبانی V2Ray دارد',
      type: 'info',
      priority: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      actionRequired: true,
      relatedEntity: { type: 'representative', id: '1', name: 'احمد محمدی' }
    },
    {
      id: '2',
      title: 'یادآوری پیگیری',
      message: 'زمان تماس با مشتری رسیده است',
      type: 'task',
      priority: 'medium',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    }
  ]);

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const IconComponent = typeIcons[notification.type];
        return (
          <div
            key={notification.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1.5 rounded-full bg-gray-100">
                <IconComponent className={cn("h-4 w-4", typeColors[notification.type])} />
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {notification.priority === 'high' ? 'مهم' : 'متوسط'}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(notification.timestamp)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'همین الان';
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
    return `${Math.floor(diffInMinutes / 60)} ساعت پیش`;
  }
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onActionClick
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  useEffect(() => {
    // Auto-animate new notifications
    const newNotifications = notifications.filter(n => !n.read && !animatingIds.has(n.id));
    if (newNotifications.length > 0) {
      setAnimatingIds(prev => new Set([...prev, ...newNotifications.map(n => n.id)]));
      
      // Remove animation after 3 seconds
      setTimeout(() => {
        setAnimatingIds(prev => {
          const newSet = new Set(prev);
          newNotifications.forEach(n => newSet.delete(n.id));
          return newSet;
        });
      }, 3000);
    }
  }, [notifications, animatingIds]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'همین الان';
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ساعت پیش`;
    return `${Math.floor(diffInMinutes / 1440)} روز پیش`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionRequired && onActionClick) {
      onActionClick(notification);
    }
  };

  const sortedNotifications = notifications.sort((a, b) => {
    // Sort by priority first, then by timestamp
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center",
              urgentCount > 0 && "animate-pulse"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute left-0 top-full mt-2 w-96 max-h-96 overflow-hidden shadow-lg border z-50 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">اعلان‌ها</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    علامت‌گذاری همه به‌عنوان خوانده‌شده
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {sortedNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>اعلانی وجود ندارد</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedNotifications.map((notification) => {
                    const IconComponent = typeIcons[notification.type];
                    const isAnimating = animatingIds.has(notification.id);
                    
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50",
                          !notification.read && "bg-blue-50",
                          priorityColors[notification.priority],
                          isAnimating && "animate-pulse",
                          notification.actionRequired && "border-l-4 border-l-blue-500"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 p-1.5 rounded-full",
                            notification.priority === 'urgent' ? 'bg-red-100' : 'bg-gray-100'
                          )}>
                            <IconComponent 
                              className={cn(
                                "h-4 w-4",
                                typeColors[notification.type],
                                notification.priority === 'urgent' && isAnimating && "animate-bounce"
                              )} 
                            />
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={cn(
                                "text-sm font-medium truncate",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    notification.priority === 'urgent' && "border-red-400 text-red-600",
                                    notification.priority === 'high' && "border-orange-400 text-orange-600",
                                    notification.priority === 'medium' && "border-blue-400 text-blue-600"
                                  )}
                                >
                                  {notification.priority === 'urgent' && 'فوری'}
                                  {notification.priority === 'high' && 'مهم'}
                                  {notification.priority === 'medium' && 'متوسط'}
                                  {notification.priority === 'low' && 'کم'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                              
                              {notification.relatedEntity && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-20">
                                    {notification.relatedEntity.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {notification.actionRequired && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onActionClick?.(notification);
                                  }}
                                >
                                  مشاهده جزئیات
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}