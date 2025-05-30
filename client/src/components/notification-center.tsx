import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'task' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
}

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
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

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'همین الان';
  if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
  return `${Math.floor(diffInMinutes / 60)} ساعت پیش`;
}

export function NotificationCenter() {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'تیکت جدید دریافت شد',
      message: 'مشتری جدید نیاز به پشتیبانی V2Ray دارد',
      type: 'info',
      priority: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
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
}