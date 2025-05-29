import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatPersianDate } from "@/lib/persian-utils";
import { cn } from "@/lib/utils";

interface VoiceNoteProcessing {
  id: string;
  status: 'recording' | 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  transcription?: string;
  summary?: string;
  extractedTasks?: Array<{
    title: string;
    description: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  sentimentAnalysis?: {
    score: number;
    confidence: number;
    emotions: string[];
  };
  keyTopics?: string[];
  followUpSuggestions?: string[];
  duration?: number;
  fileName?: string;
}

interface Representative {
  id: number;
  fullName: string;
  adminUsername: string;
  phoneNumber?: string;
}

export default function CrmVoiceNotes() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [interactionType, setInteractionType] = useState("");
  const [processingNotes, setProcessingNotes] = useState<VoiceNoteProcessing[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock representatives data - in real implementation, this would come from API
  const representatives: Representative[] = [
    { id: 1, fullName: "احمد رضایی", adminUsername: "ahmad_rep", phoneNumber: "09121234567" },
    { id: 2, fullName: "فاطمه محمدی", adminUsername: "fateme_rep", phoneNumber: "09129876543" },
    { id: 3, fullName: "علی حسینی", adminUsername: "ali_rep", phoneNumber: "09123456789" }
  ];

  // Process voice note with AI
  const processVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.webm');
      formData.append('representativeId', selectedRepId?.toString() || '');
      formData.append('interactionType', interactionType);

      const response = await fetch('/api/crm/process-voice-note', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('خطا در پردازش فایل صوتی');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "موفقیت",
        description: "فایل صوتی با موفقیت پردازش شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/interactions'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در پردازش فایل صوتی",
        variant: "destructive"
      });
    }
  });

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleAudioProcessing(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "خطا",
        description: "دسترسی به میکروفون امکان‌پذیر نیست",
        variant: "destructive"
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle audio processing
  const handleAudioProcessing = (audioBlob: Blob) => {
    const processingId = Date.now().toString();
    const newProcessing: VoiceNoteProcessing = {
      id: processingId,
      status: 'processing',
      duration: recordingTime,
      fileName: `voice-note-${processingId}.webm`
    };

    setProcessingNotes(prev => [newProcessing, ...prev]);

    // Simulate AI processing stages
    setTimeout(() => {
      setProcessingNotes(prev => prev.map(note => 
        note.id === processingId ? { ...note, status: 'transcribing' } : note
      ));
    }, 1000);

    setTimeout(() => {
      setProcessingNotes(prev => prev.map(note => 
        note.id === processingId ? { ...note, status: 'analyzing' } : note
      ));
    }, 3000);

    setTimeout(() => {
      // Simulate completed processing with results
      const completedProcessing: VoiceNoteProcessing = {
        ...newProcessing,
        status: 'completed',
        transcription: "این یک نمونه متن تبدیل شده از گفتار به نوشتار است. در این تماس مشتری مشکلی با اتصال اینترنت داشت و درخواست پشتیبانی فنی کرد. همچنین علاقه‌مندی به ارتقای پلن نشان داد.",
        summary: "تماس پشتیبانی: مشکل اتصال اینترنت و علاقه‌مندی به ارتقای پلن",
        extractedTasks: [
          {
            title: "بررسی مشکل اتصال اینترنت",
            description: "بررسی وضعیت اتصال اینترنت مشتری و رفع مشکل",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high'
          },
          {
            title: "ارائه گزینه‌های ارتقای پلن",
            description: "ارسال اطلاعات پلان‌های جدید و تماس برای فروش",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'medium'
          }
        ],
        sentimentAnalysis: {
          score: -0.2,
          confidence: 0.85,
          emotions: ["نگرانی", "انتظار"]
        },
        keyTopics: ["مشکل اتصال", "پشتیبانی فنی", "ارتقای پلن", "خدمات اینترنت"],
        followUpSuggestions: [
          "تماس پیگیری پس از رفع مشکل",
          "ارسال ایمیل اطلاعاتی درباره پلان‌های جدید",
          "زمان‌بندی جلسه نمایش محصول"
        ]
      };

      setProcessingNotes(prev => prev.map(note => 
        note.id === processingId ? completedProcessing : note
      ));

      // In real implementation, call the actual API
      // processVoiceNoteMutation.mutate(audioBlob);
    }, 6000);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      handleAudioProcessing(file);
    } else {
      toast({
        title: "خطا",
        description: "لطفاً فایل صوتی معتبر انتخاب کنید",
        variant: "destructive"
      });
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = (status: VoiceNoteProcessing['status']) => {
    switch (status) {
      case 'recording': return 'در حال ضبط';
      case 'processing': return 'در حال پردازش';
      case 'transcribing': return 'تبدیل گفتار به نوشتار';
      case 'analyzing': return 'تحلیل هوشمند';
      case 'completed': return 'تکمیل شده';
      case 'error': return 'خطا';
      default: return status;
    }
  };

  // Get sentiment color
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-600";
    if (score < -0.3) return "text-red-600";
    return "text-yellow-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ضبط و تحلیل یادداشت‌های صوتی</h1>
          <p className="text-gray-600">ضبط تماس‌ها و پردازش هوشمند با استفاده از هوش مصنوعی</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recording Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>ضبط یادداشت صوتی</CardTitle>
            <CardDescription>ضبط مکالمه یا ارسال فایل صوتی</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Representative Selection */}
            <div>
              <label className="text-sm font-medium">نماینده</label>
              <Select value={selectedRepId?.toString()} onValueChange={(value) => setSelectedRepId(parseInt(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="انتخاب نماینده" />
                </SelectTrigger>
                <SelectContent>
                  {representatives.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>
                      {rep.fullName} ({rep.adminUsername})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interaction Type */}
            <div>
              <label className="text-sm font-medium">نوع تعامل</label>
              <Select value={interactionType} onValueChange={setInteractionType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="انتخاب نوع تعامل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call_inbound">تماس ورودی</SelectItem>
                  <SelectItem value="call_outbound">تماس خروجی</SelectItem>
                  <SelectItem value="meeting">جلسه</SelectItem>
                  <SelectItem value="demo">نمایش محصول</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recording Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="text-center">
                {isRecording ? (
                  <div className="space-y-3">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <i className="fas fa-microphone text-white text-2xl"></i>
                    </div>
                    <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
                    <Button onClick={stopRecording} variant="destructive">
                      <i className="fas fa-stop ml-2"></i>
                      توقف ضبط
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <i className="fas fa-microphone text-gray-500 text-2xl"></i>
                    </div>
                    <Button 
                      onClick={startRecording} 
                      disabled={!selectedRepId || !interactionType}
                      className="w-full"
                    >
                      <i className="fas fa-microphone ml-2"></i>
                      شروع ضبط
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">یا</span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">آپلود فایل صوتی</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={!selectedRepId || !interactionType}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>نتایج پردازش هوشمند</CardTitle>
              <CardDescription>تحلیل خودکار یادداشت‌های صوتی با هوش مصنوعی</CardDescription>
            </CardHeader>
            <CardContent>
              {processingNotes.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-brain text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">هنوز هیچ یادداشت صوتی پردازش نشده است</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {processingNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Badge variant={note.status === 'completed' ? 'default' : 'secondary'}>
                            {getStatusText(note.status)}
                          </Badge>
                          {note.duration && (
                            <span className="text-sm text-gray-500">
                              مدت: {formatTime(note.duration)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatPersianDate(new Date().toISOString())}
                        </span>
                      </div>

                      {note.status !== 'completed' && (
                        <div className="space-y-2">
                          <Progress value={
                            note.status === 'processing' ? 25 :
                            note.status === 'transcribing' ? 50 :
                            note.status === 'analyzing' ? 75 : 100
                          } />
                          <p className="text-sm text-gray-600 text-center">
                            {getStatusText(note.status)}...
                          </p>
                        </div>
                      )}

                      {note.status === 'completed' && (
                        <div className="space-y-4">
                          {/* Transcription */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">متن تبدیل شده</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              {note.transcription}
                            </div>
                          </div>

                          {/* Summary */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">خلاصه هوشمند</h4>
                            <p className="text-sm text-gray-600">{note.summary}</p>
                          </div>

                          {/* Sentiment Analysis */}
                          {note.sentimentAnalysis && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">تحلیل احساسات</h4>
                              <div className="flex items-center space-x-4 space-x-reverse">
                                <span className={cn("text-sm", getSentimentColor(note.sentimentAnalysis.score))}>
                                  امتیاز: {note.sentimentAnalysis.score.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  اطمینان: {(note.sentimentAnalysis.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {note.sentimentAnalysis.emotions.map((emotion, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extracted Tasks */}
                          {note.extractedTasks && note.extractedTasks.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">وظایف استخراج شده</h4>
                              <div className="space-y-2">
                                {note.extractedTasks.map((task, index) => (
                                  <div key={index} className="border rounded p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-sm">{task.title}</h5>
                                      <Badge className={getPriorityColor(task.priority)}>
                                        {task.priority === 'high' ? 'فوری' : 
                                         task.priority === 'medium' ? 'متوسط' : 'عادی'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                                    {task.dueDate && (
                                      <p className="text-xs text-gray-500">
                                        مهلت: {formatPersianDate(task.dueDate)}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Topics */}
                          {note.keyTopics && note.keyTopics.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">موضوعات کلیدی</h4>
                              <div className="flex flex-wrap gap-1">
                                {note.keyTopics.map((topic, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up Suggestions */}
                          {note.followUpSuggestions && note.followUpSuggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">پیشنهادات پیگیری</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {note.followUpSuggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button size="sm" variant="outline">
                              <i className="fas fa-tasks ml-1"></i>
                              ایجاد وظایف
                            </Button>
                            <Button size="sm" variant="outline">
                              <i className="fas fa-calendar-plus ml-1"></i>
                              زمان‌بندی پیگیری
                            </Button>
                            <Button size="sm" variant="outline">
                              <i className="fas fa-share ml-1"></i>
                              اشتراک‌گذاری
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}