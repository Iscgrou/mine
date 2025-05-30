import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkLogEntry {
  id: string;
  task: string;
  description: string;
  startTime: string;
  endTime?: string;
  status: 'in-progress' | 'completed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  category: 'call' | 'ticket' | 'followup' | 'admin' | 'other';
}

function DailyWorkLog() {
  const [entries, setEntries] = useState<WorkLogEntry[]>([
    {
      id: '1',
      task: 'پیگیری تیکت مشتری',
      description: 'بررسی مشکل اتصال V2Ray مشتری احمدی',
      startTime: '09:30',
      endTime: '10:15',
      status: 'completed',
      priority: 'high',
      category: 'ticket'
    },
    {
      id: '2',
      task: 'تماس با نماینده',
      description: 'هماهنگی برای ارسال فاکتور جدید',
      startTime: '11:00',
      status: 'in-progress',
      priority: 'medium',
      category: 'call'
    }
  ]);

  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const addNewEntry = () => {
    if (!newTask.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    const newEntry: WorkLogEntry = {
      id: Date.now().toString(),
      task: newTask,
      description: newDescription,
      startTime: timeStr,
      status: 'in-progress',
      priority: 'medium',
      category: 'other'
    };

    setEntries([newEntry, ...entries]);
    setNewTask('');
    setNewDescription('');
  };

  const completeTask = (id: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, status: 'completed', endTime: timeStr }
        : entry
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Task Form */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="space-y-3">
          <Input
            placeholder="عنوان کار جدید..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="text-right"
          />
          <Textarea
            placeholder="توضیحات (اختیاری)..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="text-right resize-none"
            rows={2}
          />
          <Button
            onClick={addNewEntry}
            disabled={!newTask.trim()}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            افزودن کار جدید
          </Button>
        </div>
      </div>

      {/* Work Log Entries */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 bg-white"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{entry.task}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", getPriorityColor(entry.priority))}>
                  {entry.priority === 'high' ? 'مهم' : entry.priority === 'medium' ? 'متوسط' : 'کم'}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(entry.status))}>
                  {entry.status === 'completed' ? 'تکمیل شده' : 
                   entry.status === 'in-progress' ? 'در حال انجام' : 'در انتظار'}
                </Badge>
              </div>
            </div>
            
            {entry.description && (
              <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{entry.startTime}</span>
                {entry.endTime && (
                  <>
                    <span>-</span>
                    <span>{entry.endTime}</span>
                  </>
                )}
              </div>
              
              {entry.status === 'in-progress' && (
                <Button
                  onClick={() => completeTask(entry.id)}
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                >
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تکمیل
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>هنوز کاری ثبت نشده است</p>
        </div>
      )}
    </div>
  );
}

export { DailyWorkLog };
export default DailyWorkLog;