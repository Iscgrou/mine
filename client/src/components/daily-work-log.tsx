import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, User, AlertCircle, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: Date;
  scheduledTime?: string;
  representativeId?: number;
  representativeName?: string;
  category: 'followup' | 'call' | 'meeting' | 'document' | 'review' | 'reminder';
  createdAt: Date;
  completedAt?: Date;
}

interface DailyWorkLogProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskView: (task: Task) => void;
  onTaskSnooze?: (taskId: string, newDate: Date) => void;
  compact?: boolean;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-300'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

const categoryIcons = {
  followup: Clock,
  call: User,
  meeting: Calendar,
  document: ArrowRight,
  review: CheckCircle2,
  reminder: AlertCircle
};

export default function DailyWorkLog({ 
  tasks, 
  onTaskComplete, 
  onTaskView, 
  onTaskSnooze,
  compact = false 
}: DailyWorkLogProps) {
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const { addNotification } = useNotifications();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Sort tasks by priority and due time
  const sortedTasks = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => {
      // First by status (overdue first)
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      
      // Then by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by due time
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

  const todayTasks = sortedTasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString();
  });

  const overdueTasks = sortedTasks.filter(task => {
    return task.status === 'overdue' || task.dueDate < currentTime;
  });

  const upcomingTasks = sortedTasks.filter(task => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return task.dueDate > currentTime && task.dueDate < tomorrow;
  });

  const handleTaskComplete = async (taskId: string) => {
    setCompletingTasks(prev => new Set(prev).add(taskId));
    
    try {
      await onTaskComplete(taskId);
      
      // Add success notification
      addNotification({
        title: 'کار تکمیل شد',
        message: 'کار با موفقیت به عنوان انجام شده علامت‌گذاری شد',
        type: 'success',
        priority: 'low'
      });
    } catch (error) {
      addNotification({
        title: 'خطا در تکمیل کار',
        message: 'نتوانستیم کار را به عنوان انجام شده علامت‌گذاری کنیم',
        type: 'error',
        priority: 'medium'
      });
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const formatTime = (date: Date, scheduledTime?: string) => {
    if (scheduledTime) {
      return scheduledTime;
    }
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShamsiDate = (date: Date) => {
    return date.toLocaleDateString('fa-IR');
  };

  const TaskCard = ({ task, showAnimation = false }: { task: Task; showAnimation?: boolean }) => {
    const IconComponent = categoryIcons[task.category];
    const isCompleting = completingTasks.has(task.id);
    
    return (
      <div
        className={cn(
          "group border rounded-lg p-3 transition-all duration-300 hover:shadow-md",
          "bg-white border-gray-200",
          task.status === 'overdue' && "border-red-300 bg-red-50",
          task.priority === 'urgent' && "border-orange-300",
          showAnimation && "animate-pulse",
          isCompleting && "opacity-50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={false}
              disabled={isCompleting}
              onCheckedChange={() => handleTaskComplete(task.id)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-gray-500" />
                <h4 className={cn(
                  "font-medium text-sm truncate",
                  task.status === 'overdue' && "text-red-700"
                )}>
                  {task.title}
                </h4>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline"
                  className={cn("text-xs", priorityColors[task.priority])}
                >
                  {task.priority === 'urgent' && 'فوری'}
                  {task.priority === 'high' && 'مهم'}
                  {task.priority === 'medium' && 'متوسط'}
                  {task.priority === 'low' && 'کم'}
                </Badge>
                
                {task.status === 'overdue' && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    عقب‌افتاده
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && !compact && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(task.dueDate, task.scheduledTime)}
                </span>
                
                <span>
                  {formatShamsiDate(task.dueDate)}
                </span>
              </div>
              
              {task.representativeName && (
                <span className="flex items-center gap-1 truncate max-w-24">
                  <User className="h-3 w-3" />
                  {task.representativeName}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTaskView(task)}
                className="text-xs h-6"
              >
                جزئیات
              </Button>
              
              {onTaskSnooze && task.status !== 'overdue' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    onTaskSnooze(task.id, tomorrow);
                  }}
                  className="text-xs h-6"
                >
                  تعویق
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            کارتابل امروز
            {(overdueTasks.length > 0 || todayTasks.length > 0) && (
              <Badge variant="outline" className="mr-auto">
                {overdueTasks.length + todayTasks.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {overdueTasks.length === 0 && todayTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>همه کارهای امروز انجام شده است</p>
            </div>
          ) : (
            <>
              {overdueTasks.slice(0, 3).map(task => (
                <TaskCard key={task.id} task={task} showAnimation />
              ))}
              {todayTasks.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {overdueTasks.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 animate-pulse" />
              کارهای عقب‌افتاده
              <Badge variant="destructive" className="mr-auto">
                {overdueTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} showAnimation />
            ))}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            کارهای امروز
            {todayTasks.length > 0 && (
              <Badge variant="outline" className="mr-auto">
                {todayTasks.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {todayTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>کاری برای امروز تعریف نشده است</p>
            </div>
          ) : (
            todayTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </CardContent>
      </Card>
      
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              کارهای آینده
              <Badge variant="outline" className="mr-auto">
                {upcomingTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {upcomingTasks.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}