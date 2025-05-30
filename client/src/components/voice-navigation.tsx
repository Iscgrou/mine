/**
 * Accessibility Enhanced Voice Navigation System
 * Persian voice commands for MarFanet CRM navigation
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommand {
  patterns: string[];
  action: () => void;
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'accessibility';
}

interface VoiceNavigationProps {
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function VoiceNavigation({ enabled = false, onToggle }: VoiceNavigationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Persian voice commands for MarFanet navigation
  const voiceCommands: VoiceCommand[] = [
    // Navigation Commands
    {
      patterns: ['داشبورد', 'صفحه اصلی', 'خانه', 'برو به داشبورد'],
      action: () => setLocation('/csdfjkjfoascivomrm867945'),
      description: 'رفتن به داشبورد',
      category: 'navigation'
    },
    {
      patterns: ['نمایندگان', 'لیست نمایندگان', 'برو به نمایندگان'],
      action: () => setLocation('/representatives'),
      description: 'مشاهده نمایندگان',
      category: 'navigation'
    },
    {
      patterns: ['فاکتورها', 'صورتحساب ها', 'برو به فاکتورها'],
      action: () => setLocation('/invoices'),
      description: 'مشاهده فاکتورها',
      category: 'navigation'
    },
    {
      patterns: ['آنالیز', 'گزارش', 'تحلیل', 'برو به آنالیز'],
      action: () => setLocation('/analytics'),
      description: 'مشاهده تحلیل و گزارش',
      category: 'navigation'
    },
    {
      patterns: ['تنظیمات', 'برو به تنظیمات'],
      action: () => setLocation('/settings'),
      description: 'رفتن به تنظیمات',
      category: 'navigation'
    },
    {
      patterns: ['پنل ادمین', 'برو به پنل ادمین', 'ادمین'],
      action: () => setLocation('/ciwomplefoadm867945'),
      description: 'رفتن به پنل ادمین',
      category: 'navigation'
    },

    // Action Commands
    {
      patterns: ['جستجو کن', 'پیدا کن', 'سرچ'],
      action: () => focusSearchInput(),
      description: 'فعال کردن جستجو',
      category: 'search'
    },
    {
      patterns: ['فاکتور جدید', 'ایجاد فاکتور', 'ساخت فاکتور'],
      action: () => toast({ title: 'دستور صوتی', description: 'در حال ایجاد فاکتور جدید...' }),
      description: 'ایجاد فاکتور جدید',
      category: 'actions'
    },
    {
      patterns: ['نماینده جدید', 'افزودن نماینده', 'ثبت نماینده'],
      action: () => toast({ title: 'دستور صوتی', description: 'در حال افزودن نماینده جدید...' }),
      description: 'افزودن نماینده جدید',
      category: 'actions'
    },

    // Accessibility Commands
    {
      patterns: ['متن بزرگتر', 'بزرگ کن', 'فونت بزرگتر'],
      action: () => adjustFontSize('increase'),
      description: 'بزرگ کردن متن',
      category: 'accessibility'
    },
    {
      patterns: ['متن کوچکتر', 'کوچک کن', 'فونت کوچکتر'],
      action: () => adjustFontSize('decrease'),
      description: 'کوچک کردن متن',
      category: 'accessibility'
    },
    {
      patterns: ['حالت تاریک', 'تم تاریک', 'دارک مود'],
      action: () => toggleDarkMode(),
      description: 'تغییر به حالت تاریک',
      category: 'accessibility'
    },
    {
      patterns: ['حالت روشن', 'تم روشن', 'لایت مود'],
      action: () => toggleLightMode(),
      description: 'تغییر به حالت روشن',
      category: 'accessibility'
    },
    {
      patterns: ['راهنما', 'کمک', 'دستورات صوتی'],
      action: () => showVoiceCommandsHelp(),
      description: 'نمایش راهنمای دستورات صوتی',
      category: 'accessibility'
    },
    {
      patterns: ['توقف', 'خاموش کن', 'بستن صدا'],
      action: () => stopListening(),
      description: 'توقف دستورات صوتی',
      category: 'accessibility'
    }
  ];

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fa-IR'; // Persian language
      
      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: 'دستورات صوتی فعال',
          description: 'در حال گوش دادن به دستورات شما...',
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        setCurrentCommand('');
        if (enabled) {
          // Auto-restart if still enabled
          setTimeout(() => {
            if (enabled && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 1000);
        }
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentCommand(interimTranscript || finalTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        toast({
          title: 'خطا در تشخیص صدا',
          description: 'لطفا دوباره تلاش کنید',
          variant: 'destructive'
        });
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (enabled && isSupported && recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    } else if (!enabled && recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [enabled, isSupported]);

  const processVoiceCommand = (transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Find matching command
    const matchedCommand = voiceCommands.find(command =>
      command.patterns.some(pattern => 
        normalizedTranscript.includes(pattern.toLowerCase()) ||
        normalizedTranscript === pattern.toLowerCase()
      )
    );

    if (matchedCommand) {
      toast({
        title: 'دستور اجرا شد',
        description: matchedCommand.description,
      });
      
      // Execute command with small delay for better UX
      setTimeout(() => {
        matchedCommand.action();
      }, 500);
    } else {
      toast({
        title: 'دستور شناخته نشد',
        description: 'برای مشاهده دستورات موجود "راهنما" بگویید',
        variant: 'destructive'
      });
    }
  };

  const toggleVoiceNavigation = () => {
    const newState = !enabled;
    onToggle?.(newState);
    
    if (newState) {
      toast({
        title: 'دستورات صوتی فعال شد',
        description: 'می‌توانید با صدا برنامه را کنترل کنید',
      });
    } else {
      toast({
        title: 'دستورات صوتی غیرفعال شد',
        description: 'کنترل صوتی متوقف شد',
      });
    }
  };

  const stopListening = () => {
    onToggle?.(false);
  };

  const focusSearchInput = () => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="جستجو"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      toast({ title: 'جستجو فعال شد', description: 'می‌توانید تایپ کنید' });
    }
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const root = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(root).fontSize);
    const newSize = direction === 'increase' ? currentSize + 2 : currentSize - 2;
    const clampedSize = Math.max(12, Math.min(24, newSize));
    
    root.style.fontSize = `${clampedSize}px`;
    toast({
      title: direction === 'increase' ? 'متن بزرگ شد' : 'متن کوچک شد',
      description: `اندازه فونت: ${clampedSize}px`
    });
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.add('dark');
    toast({ title: 'حالت تاریک فعال شد' });
  };

  const toggleLightMode = () => {
    document.documentElement.classList.remove('dark');
    toast({ title: 'حالت روشن فعال شد' });
  };

  const showVoiceCommandsHelp = () => {
    const commandsByCategory = voiceCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, VoiceCommand[]>);

    const helpText = Object.entries(commandsByCategory)
      .map(([category, commands]) => {
        const categoryName = {
          navigation: 'ناوبری',
          actions: 'عملیات',
          search: 'جستجو',
          accessibility: 'دسترسی‌پذیری'
        }[category] || category;
        
        return `${categoryName}:\n${commands.map(cmd => `• ${cmd.patterns[0]} - ${cmd.description}`).join('\n')}`;
      })
      .join('\n\n');

    toast({
      title: 'دستورات صوتی موجود',
      description: helpText,
    });
  };

  if (!isSupported) {
    return (
      <div className="voice-navigation-unavailable p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          مرورگر شما از دستورات صوتی پشتیبانی نمی‌کند
        </p>
      </div>
    );
  }

  return (
    <div className="voice-navigation-container">
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Button
          onClick={toggleVoiceNavigation}
          variant={enabled ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          <i className={`fas fa-microphone${enabled ? '' : '-slash'}`}></i>
          {enabled ? 'توقف کنترل صوتی' : 'فعال‌سازی کنترل صوتی'}
        </Button>
        
        {enabled && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isListening ? 'در حال گوش دادن...' : 'آماده دریافت دستور'}
            </span>
          </div>
        )}
        
        <Button
          onClick={showVoiceCommandsHelp}
          variant="ghost"
          size="sm"
          title="راهنمای دستورات صوتی"
        >
          <i className="fas fa-question-circle"></i>
        </Button>
      </div>
      
      {currentCommand && (
        <div className="mt-2 p-2 bg-gray-100 border rounded text-sm">
          <strong>دستور جاری:</strong> {currentCommand}
        </div>
      )}
    </div>
  );
}

// Persian Speech Recognition types extension
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}