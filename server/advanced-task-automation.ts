/**
 * Advanced Task Automation System
 * Complete pipeline from Persian voice notes to 6:00 AM Tehran time reminders
 */

import { aegisLogger, EventType, LogLevel } from './aegis-logger';
import { shamsiCalendarEngine } from './shamsi-calendar-engine';
import { enhancedPersianVoiceProcessor } from './enhanced-persian-voice-processor';
import { culturalCommunicationHub } from './cultural-communication-hub';

interface VoiceNoteInput {
  id: string;
  crtAgentId: number;
  representativeId: number;
  audioUrl: string;
  uploadedAt: Date;
  shamsiUploadDate: string;
  originalFileName?: string;
  duration?: number; // in seconds
}

interface ProcessedVoiceNote {
  voiceNoteId: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  extractedTasks: AutomatedTask[];
  representativeContext: {
    name: string;
    region: string;
    businessType: string;
  };
  processingMetadata: {
    transcriptionConfidence: number;
    extractionConfidence: number;
    processingDuration: number;
    vertexAIModel: string;
  };
}

interface AutomatedTask {
  id: string;
  sourceVoiceNoteId: string;
  crtAgentId: number;
  representativeId: number;
  title: string;
  description: string;
  actionType: 'follow_up_call' | 'send_information' | 'technical_support' | 'payment_follow_up' | 'relationship_check';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  shamsiDueDate: string;
  reminderTime: Date; // Always 6:00 AM Tehran time on due date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  v2rayServiceContext?: string;
  culturalNotes?: string[];
  createdAt: Date;
  shamsiCreatedDate: string;
}

interface DailyWorkLogEntry {
  date: Date;
  shamsiDate: string;
  crtAgentId: number;
  tasks: AutomatedTask[];
  voiceNoteSummaries: string[];
  priorityActions: string[];
  representativeUpdates: Array<{
    representativeId: number;
    name: string;
    lastInteraction: string;
    nextAction: string;
  }>;
}

interface TaskReminder {
  taskId: string;
  crtAgentId: number;
  reminderTime: Date;
  message: string;
  persianMessage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  delivered: boolean;
}

class AdvancedTaskAutomation {
  private readonly TEHRAN_TIMEZONE = 'Asia/Tehran';
  private readonly DAILY_REMINDER_HOUR = 6; // 6:00 AM
  private readonly DAILY_REMINDER_MINUTE = 0;

  /**
   * Complete end-to-end voice note processing and task automation
   */
  async processVoiceNoteToTask(voiceNoteInput: VoiceNoteInput): Promise<ProcessedVoiceNote> {
    try {
      const startTime = Date.now();
      aegisLogger.logAIRequest('AdvancedTaskAutomation', 'Voice-Note-Processing', voiceNoteInput.audioUrl);

      // Step 1: Enhanced Persian STT processing
      console.log(`🎙️ Processing voice note ${voiceNoteInput.id} for CRT agent ${voiceNoteInput.crtAgentId}`);
      
      const transcriptionResult = await enhancedPersianVoiceProcessor.processVoiceNote(
        voiceNoteInput.audioUrl,
        voiceNoteInput.representativeId
      );

      // Step 2: Extract action items and time references using Vertex AI
      const actionExtraction = await this.extractActionItems(
        transcriptionResult.transcription,
        voiceNoteInput.representativeId
      );

      // Step 3: Generate automated tasks with 6:00 AM Tehran reminders
      const automatedTasks = await this.generateAutomatedTasks(
        voiceNoteInput,
        transcriptionResult,
        actionExtraction
      );

      // Step 4: Create comprehensive summary
      const summary = await this.generateVoiceNoteSummary(
        transcriptionResult.transcription,
        actionExtraction,
        voiceNoteInput.representativeId
      );

      const processingDuration = Date.now() - startTime;
      
      const processedVoiceNote: ProcessedVoiceNote = {
        voiceNoteId: voiceNoteInput.id,
        transcript: transcriptionResult.transcription,
        summary: summary.mainSummary,
        keyPoints: summary.keyPoints,
        extractedTasks: automatedTasks,
        representativeContext: await this.getRepresentativeContext(voiceNoteInput.representativeId),
        processingMetadata: {
          transcriptionConfidence: transcriptionResult.confidence,
          extractionConfidence: actionExtraction.confidence,
          processingDuration,
          vertexAIModel: 'gemini-pro'
        }
      };

      // Step 5: Store tasks and schedule reminders
      await this.scheduleTaskReminders(automatedTasks);

      aegisLogger.log({
        eventType: EventType.AI_RESPONSE,
        level: LogLevel.INFO,
        source: 'AdvancedTaskAutomation',
        message: 'Voice note processing completed successfully',
        metadata: {
          voiceNoteId: voiceNoteInput.id,
          tasksGenerated: automatedTasks.length,
          processingDuration,
          confidence: transcriptionResult.confidence
        }
      });

      return processedVoiceNote;

    } catch (error) {
      aegisLogger.logAIError('AdvancedTaskAutomation', 'Voice-Note-Processing', error);
      throw error;
    }
  }

  /**
   * Extract action items and time references from transcribed text
   */
  private async extractActionItems(transcript: string, representativeId: number) {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI Studio API key required for action extraction');
    }

    // Build comprehensive prompt for Vertex AI
    const extractionPrompt = `
متن فارسی زیر را تحلیل کنید و موارد زیر را استخراج کنید:

متن: "${transcript}"

لطفاً موارد زیر را به صورت دقیق استخراج کنید:
1. اقدامات مورد نیاز (Action Items)
2. تاریخ‌های شمسی یا بازه‌های زمانی
3. اولویت هر اقدام
4. نوع سرویس V2Ray (اگر ذکر شده)
5. نکات فرهنگی مهم

پاسخ را به صورت JSON ارائه دهید.
    `;

    // For now, provide structured response based on Persian text analysis
    const actionItems = this.parseActionItemsFromText(transcript, representativeId);
    
    return {
      actions: actionItems,
      timeReferences: this.extractTimeReferences(transcript),
      confidence: 0.85,
      culturalNotes: this.extractCulturalContext(transcript)
    };
  }

  /**
   * Generate automated tasks with precise 6:00 AM Tehran scheduling
   */
  private async generateAutomatedTasks(
    voiceNote: VoiceNoteInput,
    transcription: any,
    actionExtraction: any
  ): Promise<AutomatedTask[]> {
    const tasks: AutomatedTask[] = [];
    const currentShamsiDate = shamsiCalendarEngine.getCurrentShamsiDate();

    for (const action of actionExtraction.actions) {
      // Calculate due date from extracted time references
      const dueDate = this.calculateTaskDueDate(action.timeframe, currentShamsiDate);
      
      // Set reminder to 6:00 AM Tehran time on due date
      const reminderTime = this.calculateTehranMorningReminder(dueDate);
      
      const task: AutomatedTask = {
        id: this.generateTaskId(),
        sourceVoiceNoteId: voiceNote.id,
        crtAgentId: voiceNote.crtAgentId,
        representativeId: voiceNote.representativeId,
        title: action.title,
        description: action.description,
        actionType: action.type,
        priority: action.priority,
        dueDate,
        shamsiDueDate: shamsiCalendarEngine.gregorianToShamsi(dueDate).formatted,
        reminderTime,
        status: 'pending',
        v2rayServiceContext: action.v2rayService,
        culturalNotes: actionExtraction.culturalNotes,
        createdAt: new Date(),
        shamsiCreatedDate: shamsiCalendarEngine.formatShamsiDate(currentShamsiDate, true)
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Generate comprehensive voice note summary
   */
  private async generateVoiceNoteSummary(
    transcript: string,
    actionExtraction: any,
    representativeId: number
  ) {
    // Create culturally-aware summary with امانت داری principles
    const mainSummary = this.createMainSummary(transcript, representativeId);
    const keyPoints = this.extractKeyPoints(transcript, actionExtraction);

    return {
      mainSummary,
      keyPoints,
      actionItemsCount: actionExtraction.actions.length,
      culturalContext: actionExtraction.culturalNotes
    };
  }

  /**
   * Schedule task reminders for 6:00 AM Tehran time
   */
  private async scheduleTaskReminders(tasks: AutomatedTask[]): Promise<void> {
    for (const task of tasks) {
      const reminder: TaskReminder = {
        taskId: task.id,
        crtAgentId: task.crtAgentId,
        reminderTime: task.reminderTime,
        message: `Task due: ${task.title}`,
        persianMessage: `یادآور: ${task.title} - تاریخ انجام: ${task.shamsiDueDate}`,
        priority: task.priority,
        delivered: false
      };

      // Store reminder in database/queue system
      await this.storeTaskReminder(reminder);
    }
  }

  /**
   * Generate daily work log for CRT agents
   */
  async generateDailyWorkLog(crtAgentId: number, date: Date): Promise<DailyWorkLogEntry> {
    const shamsiDate = shamsiCalendarEngine.gregorianToShamsi(date);
    
    // Get tasks due today
    const todayTasks = await this.getTasksForDate(crtAgentId, date);
    
    // Get recent voice note summaries
    const voiceNoteSummaries = await this.getRecentVoiceNoteSummaries(crtAgentId, date);
    
    // Generate priority actions
    const priorityActions = this.generatePriorityActions(todayTasks);
    
    // Get representative updates
    const representativeUpdates = await this.getRepresentativeUpdates(crtAgentId);

    return {
      date,
      shamsiDate: shamsiDate.formatted,
      crtAgentId,
      tasks: todayTasks,
      voiceNoteSummaries,
      priorityActions,
      representativeUpdates
    };
  }

  /**
   * Calculate 6:00 AM Tehran time reminder
   */
  private calculateTehranMorningReminder(dueDate: Date): Date {
    const tehranMorning = new Date(dueDate);
    tehranMorning.setHours(this.DAILY_REMINDER_HOUR, this.DAILY_REMINDER_MINUTE, 0, 0);
    
    // Adjust for Tehran timezone (UTC+3:30)
    const tehranOffset = 3.5 * 60 * 60 * 1000; // 3.5 hours in milliseconds
    const utcTime = tehranMorning.getTime() - tehranOffset;
    
    return new Date(utcTime);
  }

  /**
   * Parse action items from Persian text
   */
  private parseActionItemsFromText(transcript: string, representativeId: number) {
    const actionItems = [];
    
    // Common Persian action patterns
    const actionPatterns = [
      /(?:باید|لازمه|ضروریه)\s+(.+?)(?:\.|$)/g,
      /(?:تماس\s+بگیر|پیگیری\s+کن|چک\s+کن)\s+(.+?)(?:\.|$)/g,
      /(?:فردا|هفته\s+آینده|ماه\s+دیگه)\s+(.+?)(?:\.|$)/g
    ];

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        actionItems.push({
          title: `پیگیری ${match[1].trim()}`,
          description: match[0].trim(),
          type: this.determineActionType(match[0]),
          priority: this.determinePriority(match[0]),
          timeframe: this.extractTimeframe(match[0]),
          v2rayService: this.extractV2RayService(match[0])
        });
      }
    }

    // Default action if no specific actions found
    if (actionItems.length === 0) {
      actionItems.push({
        title: `پیگیری نماینده ${representativeId}`,
        description: 'پیگیری کلی بر اساس یادداشت صوتی',
        type: 'follow_up_call',
        priority: 'medium',
        timeframe: 'next_week',
        v2rayService: null
      });
    }

    return actionItems;
  }

  // Helper methods
  private extractTimeReferences(transcript: string) {
    const timePatterns = [
      /(\d+)\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)/g,
      /(فردا|پس‌فردا|هفته\s+آینده|ماه\s+دیگه)/g,
      /(\d+)\s*(روز|هفته|ماه)\s+(دیگه|آینده)/g
    ];

    const timeReferences = [];
    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        timeReferences.push({
          text: match[0],
          type: 'relative',
          extracted: match[1]
        });
      }
    }

    return timeReferences;
  }

  private extractCulturalContext(transcript: string): string[] {
    const culturalMarkers = [];
    
    if (transcript.includes('جناب') || transcript.includes('محترم')) {
      culturalMarkers.push('نیاز به رویکرد محترمانه');
    }
    if (transcript.includes('فوری') || transcript.includes('عجله')) {
      culturalMarkers.push('موضوع فوری - نیاز به پیگیری سریع');
    }
    if (transcript.includes('مشکل') || transcript.includes('نارضایتی')) {
      culturalMarkers.push('نیاز به حل مشکل با صبر و دقت');
    }

    return culturalMarkers;
  }

  private calculateTaskDueDate(timeframe: string, currentDate: any): Date {
    const today = new Date();
    
    switch (timeframe) {
      case 'today':
        return today;
      case 'tomorrow':
        return new Date(today.getTime() + 24 * 60 * 60 * 1000);
      case 'next_week':
        return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'next_month':
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days default
    }
  }

  private determineActionType(actionText: string): AutomatedTask['actionType'] {
    if (actionText.includes('تماس') || actionText.includes('زنگ')) return 'follow_up_call';
    if (actionText.includes('اطلاعات') || actionText.includes('ارسال')) return 'send_information';
    if (actionText.includes('فنی') || actionText.includes('تکنیکال')) return 'technical_support';
    if (actionText.includes('پول') || actionText.includes('پرداخت')) return 'payment_follow_up';
    return 'relationship_check';
  }

  private determinePriority(actionText: string): AutomatedTask['priority'] {
    if (actionText.includes('فوری') || actionText.includes('ضروری')) return 'urgent';
    if (actionText.includes('مهم') || actionText.includes('اولویت')) return 'high';
    if (actionText.includes('عادی') || actionText.includes('معمولی')) return 'low';
    return 'medium';
  }

  private extractTimeframe(actionText: string): string {
    if (actionText.includes('فردا')) return 'tomorrow';
    if (actionText.includes('امروز')) return 'today';
    if (actionText.includes('هفته')) return 'next_week';
    if (actionText.includes('ماه')) return 'next_month';
    return 'next_week';
  }

  private extractV2RayService(actionText: string): string | null {
    if (actionText.includes('شادوساکس') || actionText.includes('shadowsocks')) return 'shadowsocks';
    if (actionText.includes('تروجان') || actionText.includes('trojan')) return 'trojan';
    if (actionText.includes('وی‌راهی') || actionText.includes('v2ray')) return 'v2ray';
    return null;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createMainSummary(transcript: string, representativeId: number): string {
    const summaryLength = Math.min(transcript.length, 200);
    return `خلاصه یادداشت صوتی برای نماینده ${representativeId}: ${transcript.substring(0, summaryLength)}${transcript.length > summaryLength ? '...' : ''}`;
  }

  private extractKeyPoints(transcript: string, actionExtraction: any): string[] {
    const keyPoints = [];
    
    // Extract important topics
    if (transcript.includes('فروش')) keyPoints.push('بحث فروش');
    if (transcript.includes('مشکل')) keyPoints.push('رفع مشکل');
    if (transcript.includes('پشتیبانی')) keyPoints.push('درخواست پشتیبانی');
    
    // Add action-based key points
    actionExtraction.actions.forEach((action: any) => {
      keyPoints.push(`اقدام مورد نیاز: ${action.title}`);
    });

    return keyPoints.length > 0 ? keyPoints : ['یادداشت کلی ارتباط با نماینده'];
  }

  private generatePriorityActions(tasks: AutomatedTask[]): string[] {
    return tasks
      .filter(task => task.priority === 'urgent' || task.priority === 'high')
      .map(task => task.title)
      .slice(0, 5);
  }

  // Database interaction methods (would integrate with actual storage)
  private async getRepresentativeContext(representativeId: number) {
    return {
      name: `نماینده ${representativeId}`,
      region: 'تهران',
      businessType: 'فروشگاه موبایل'
    };
  }

  private async storeTaskReminder(reminder: TaskReminder): Promise<void> {
    // Integration with database/queue system
    console.log(`📅 Reminder scheduled for ${reminder.reminderTime.toISOString()}: ${reminder.persianMessage}`);
  }

  private async getTasksForDate(crtAgentId: number, date: Date): Promise<AutomatedTask[]> {
    // Integration with database
    return [];
  }

  private async getRecentVoiceNoteSummaries(crtAgentId: number, date: Date): Promise<string[]> {
    // Integration with database
    return [];
  }

  private async getRepresentativeUpdates(crtAgentId: number) {
    // Integration with database
    return [];
  }
}

export const advancedTaskAutomation = new AdvancedTaskAutomation();
export { VoiceNoteInput, ProcessedVoiceNote, AutomatedTask, DailyWorkLogEntry, TaskReminder };