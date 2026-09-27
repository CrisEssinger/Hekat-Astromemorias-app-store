import { useState, useEffect, useMemo, useRef, useCallback, ReactNode, RefObject, FC, ChangeEvent } from 'react';
/**
 * Hekat OS - Oráculo de Astromemórias
 * Versão: 2.2.0-mobile
 * Meta: Sincronização Mobile & Lembretes Diários
 */
import { 
  Moon, 
  MoonStar,
  RefreshCw, 
  Quote,
  BookOpen,
  Send,
  Info,
  ArrowRight,
  RotateCw,
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Check,
  Sun,
  HeartHandshake,
  Smile,
  Zap,
  Compass,
  Award,
  Star,
  ShieldCheck,
  Sparkles,
  Heart,
  Wind,
  Users,
  Gift,
  Clock,
  History,
  Activity,
  Frown,
  Lock,
  Eye,
  Ghost,
  AlertCircle,
  Timer,
  ShieldAlert,
  CloudRain,
  LayoutGrid,
  User as UserIcon,
  Meh,
  Anchor,
  Cloud,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CalendarHeart,
  FileBarChart,
  X,
  Plus,
  Minus,
  MessageCircle,
  Maximize2,
  LogIn,
  LogOut,
  Search,
  Infinity as InfinityIcon,
  UserCheck,
  ShieldOff,
  Fingerprint,
  Hourglass,
  Flower,
  Swords,
  UserX,
  Flame,
  Coffee,
  HandHeart,
  Bird,
  Pause,
  Shuffle,
  Radio,
  Trophy,
  PartyPopper,
  Target,
  BatteryLow,
  ArrowDownUp,
  Upload,
  Download,
  Copy,
  FileText,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';

const isNative = window.location.origin.startsWith('capacitor://') || 
                 window.location.origin.startsWith('ionic://') || 
                 window.location.protocol === 'file:';

const buildTimeAppUrl = (process.env.APP_URL || 'https://ais-pre-757guj3wwj6obi7t5znwrf-410434177490.us-east1.run.app').replace(/\/$/, '');

if (isNative && buildTimeAppUrl) {
  axios.defaults.baseURL = buildTimeAppUrl;
}

const getApiUrl = (path: string): string => {
  if (isNative && buildTimeAppUrl) {
    return `${buildTimeAppUrl}${path}`;
  }
  return path;
};
import { EMOTIONS, ZODIAC_SIGNS, LUNAR_PHASES, CATEGORIES, PHILOSOPHICAL_QUOTES, ZODIAC_PHRASES } from './constants';
import { auth, db, signInWithGoogle, logout, subscribeToAuthChanges } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isColorLight(hex: string) {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

// Gemini API secure backend proxy routes are used for Oráculo and Reports to prevent run-time build errors.

// Icons
const ICON_MAP: Record<string, any> = {
  Sun,
  HeartHandshake,
  Smile,
  Zap,
  Compass,
  Award,
  Star,
  ShieldCheck,
  Sparkles,
  Heart,
  Wind,
  Users,
  Gift,
  Clock,
  History,
  Activity,
  Frown,
  Lock,
  LayoutGrid,
  Eye,
  Ghost,
  AlertCircle,
  Timer,
  ShieldAlert,
  CloudRain,
  User: UserIcon,
  Moon,
  MoonStar,
  Meh,
  Anchor,
  Cloud,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CalendarHeart,
  FileBarChart,
  MessageCircle,
  RefreshCw,
  ArrowRight,
  RotateCw,
  LogIn,
  LogOut,
  Info,
  Send,
  BookOpen,
  Search,
  Infinity: InfinityIcon,
  UserCheck,
  ShieldOff,
  Fingerprint,
  Hourglass,
  Flower,
  Swords,
  UserX,
  Flame,
  Coffee,
  HandHeart,
  Bird,
  Pause,
  Shuffle,
  Radio,
  Trophy,
  PartyPopper,
  Target,
  BatteryLow,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2
};

const LucideIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const IconComponent = ICON_MAP[name] || Moon;
  return <IconComponent size={size} className={className} />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.intensity || data.intensity === 0) return null;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-indigo-100/50 animate-in fade-in zoom-in duration-300">
        <p className="text-[9px] font-black text-indigo-300 uppercase mb-1 tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="text-[11px] font-black text-indigo-950 uppercase tracking-tighter">{data.emotion}</p>
        </div>
      </div>
    );
  }
  return null;
};

const PremiumGuard = ({ children, isPremium, onSubscribe }: { children: ReactNode, isPremium: boolean, onSubscribe: () => void }) => {
  if (isPremium) return <>{children}</>;
  
  return (
    <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] group min-h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 blur-lg pointer-events-none select-none opacity-20 scale-105">
        {children}
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-indigo-600/20 p-4 rounded-full mb-6 ring-1 ring-indigo-500/30 animate-pulse">
          <Lock className="text-indigo-400" size={32} />
        </div>
        <h3 className="text-base sm:text-lg font-black uppercase tracking-[0.2em] text-[#4169E1] mb-2 drop-shadow-sm">Acesso reservado para premium</h3>
        <p className="text-[10px] sm:text-[11px] text-indigo-300/80 font-black uppercase tracking-widest leading-relaxed mb-8 max-w-[240px]">
          Sintonize-se com análises profundas e orientações estratégicas do Oráculo.
        </p>
        <button 
          onClick={onSubscribe}
          className="group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Star size={16} className="text-amber-300" />
          Seja Premium
        </button>
      </div>
    </div>
  );
};

const StarField = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full bg-glow"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

interface WindowProps {
  win: WindowData;
  children: ReactNode;
  width?: string;
  desktopRef: RefObject<HTMLDivElement | null>;
  topZ: number;
  isNight: boolean;
  toggleWindow: (id: string, action: 'open' | 'close' | 'minimize' | 'focus') => void;
  updateWindowPos: (id: string, x: number, y: number) => void;
  isMobile: boolean;
  isTablet?: boolean;
}

const Window: FC<WindowProps> = ({ win, children, width = "480px", desktopRef: _desktopRef, topZ, isNight: _isNight, toggleWindow, updateWindowPos, isMobile, isTablet }) => {
  const controls = useDragControls();
  const isMobileDevice = isMobile;
  const canDrag = !isMobileDevice && !isTablet;

  const initialX = win.pos.x;
  const initialY = win.pos.y;
  const animateX = win.pos.x;
  const animateY = win.pos.y;

  return (
    <AnimatePresence>
      {win.isOpen && !win.isMinimized && (
        <motion.div
          drag={canDrag}
          dragControls={controls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.94, x: initialX, y: initialY + 12 }}
          animate={{ opacity: 1, scale: 1, x: animateX, y: animateY }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
          transition={{ 
            type: "spring", 
            stiffness: 420, 
            damping: 32,
            mass: 0.9
          }}
          onDragEnd={(_, info) => {
            if (canDrag) {
              updateWindowPos(win.id, win.pos.x + info.offset.x, win.pos.y + info.offset.y);
            }
          }}
          onPointerDown={() => toggleWindow(win.id, 'focus')}
          style={{ 
            zIndex: win.zIndex, 
            width: isMobileDevice ? "100%" : `min(${width}, 94vw)`,
            height: isMobileDevice ? "calc(100dvh - 56px - 64px)" : "auto",
            maxHeight: isMobileDevice ? "none" : "calc(100dvh - 72px)",
            position: 'absolute',
            left: 0,
            right: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            top: isMobileDevice ? "56px" : "clamp(56px, calc((100dvh - 660px) / 2), 76px)",
          }}
          className={`window-shadow glass overflow-hidden flex flex-col pointer-events-auto ${
            isMobileDevice 
              ? 'rounded-t-[2rem] rounded-b-none border-x-0 border-b-0' 
              : 'rounded-[2rem] sm:rounded-[2.5rem] border border-white/40'
          } ${win.zIndex >= topZ ? 'ring-2 ring-indigo-500/20 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)]' : ''}`}
        >
          {/* Title Bar */}
          <div 
            onPointerDown={(e) => {
              toggleWindow(win.id, 'focus');
              if (canDrag) {
                controls.start(e);
              }
            }}
            style={{ touchAction: canDrag ? 'none' : 'auto' }}
            className={`bg-white/20 px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center ${canDrag ? 'cursor-move' : 'cursor-default'} select-none border-b border-white/10 active:bg-white/40 transition-colors duration-1000 flex-shrink-0`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-indigo-600 p-2 sm:p-1.5 rounded-lg text-white shadow-sm">
                <LucideIcon name={win.icon} size={18} />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.25em] text-amber-400 uppercase block drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">HEKAT</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#4169E1] truncate max-w-[120px] sm:max-w-none">{win.title}</span>
              </div>
            </div>
            <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); toggleWindow(win.id, 'minimize'); }} className="p-2 sm:p-1.5 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors" title="Minimizar">
                <Minus size={15} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleWindow(win.id, 'close'); }} 
                className="p-2 sm:p-1.5 hover:bg-rose-100 text-slate-500 hover:text-rose-500 rounded-full transition-colors"
                title="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          {/* Content Area */}
          <div 
            className={`p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar-h transition-colors duration-1000 bg-white/5 ${isMobileDevice ? 'h-auto max-h-none min-h-0' : 'max-h-[calc(100dvh-130px)]'}`}
            onPointerDown={() => {
              // Bring window to focus even when clicking content
              toggleWindow(win.id, 'focus');
            }} 
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper functions to safely index elements without throwing NaN / undefined errors
const getZodiacSignSafely = (index: number) => {
  const rounded = Math.floor(index);
  if (isNaN(rounded) || rounded < 0 || rounded >= ZODIAC_SIGNS.length) {
    return ZODIAC_SIGNS[0] || { name: 'Áries', symbol: '♈', element: 'Fogo', mode: 'Cardinal', desc: '' };
  }
  return ZODIAC_SIGNS[rounded];
};

const getSaoPauloDateParts = (d: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(d);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '1970');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1; // 0-indexed month
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  return { year, month, day };
};

const getLunarData = (date: Date = new Date()) => {
  // Garantir que a data recebida seja um objeto válido, se não usar d1 hoje
  const now = (date && !isNaN(date.getTime())) ? date : new Date();
  
  // Âncoras Astronômicas Reais para 2026 usando J2000 em vez de estimativas lineares simplex
  const dVal = (now.getTime() / 86400000) + 2440587.5 - 2451545.0;
  
  const rev = (angle: number) => {
    let a = angle % 360;
    if (a < 0) a += 360;
    return a;
  };
  
  const rad = (deg: number) => (deg * Math.PI) / 180;

  const getSunSignFloat = (dateVal: Date) => {
    const dj = (dateVal.getTime() / 86400000) + 2440587.5 - 2451545.0;
    const L_sun = rev(280.466 + 0.9856474 * dj);
    const g_sun = rev(357.528 + 0.9856003 * dj);
    const lambda_sun = rev(L_sun + 1.915 * Math.sin(rad(g_sun)) + 0.020 * Math.sin(rad(2 * g_sun)));
    return lambda_sun / 30;
  };
  
  const getMoonSignFloat = (dateVal: Date) => {
    const dj = (dateVal.getTime() / 86400000) + 2440587.5 - 2451545.0;
    const g_sun = rev(357.528 + 0.9856003 * dj);
    const L_moon = rev(218.316 + 13.176396 * dj);
    const M_moon = rev(134.963 + 13.064993 * dj);
    const F_moon = rev(93.272 + 13.229350 * dj);
    const D_elong = rev(297.850 + 12.190749 * dj);

    let dl = 0;
    dl += 6.289 * Math.sin(rad(M_moon));
    dl += 1.274 * Math.sin(rad(2 * D_elong - M_moon));
    dl += 0.658 * Math.sin(rad(2 * D_elong));
    dl -= 0.186 * Math.sin(rad(g_sun));
    dl -= 0.114 * Math.sin(rad(2 * F_moon));
    dl += 0.214 * Math.sin(rad(2 * M_moon));
    dl += 0.127 * Math.sin(rad(2 * D_elong - g_sun));
    dl += 0.110 * Math.sin(rad(2 * D_elong + M_moon));
    dl -= 0.057 * Math.sin(rad(2 * D_elong - 2 * M_moon));

    const lambda_moon = rev(L_moon + dl);
    return lambda_moon / 30;
  };

  // Calculate coordinates for today
  const sunSignFloat = getSunSignFloat(now);
  const moonSignFloat = getMoonSignFloat(now);
  const lambda_sun = sunSignFloat * 30;
  const lambda_moon = moonSignFloat * 30;
  
  const phaseAngle = rev(lambda_moon - lambda_sun);
  const illumination = (1 - Math.cos(rad(phaseAngle))) / 2;

  const referenceDate = new Date(Date.UTC(2026, 4, 16, 0, 0, 0)); // 16 de Maio de 2026
  const diffInMs = now.getTime() - referenceDate.getTime();
  const diffInDays = isNaN(diffInMs) ? 0 : diffInMs / (1000 * 60 * 60 * 24);
  
  const LUNAR_MONTH = 29.53059;
  const cycleId = isNaN(diffInDays) ? 1 : Math.floor(diffInDays / LUNAR_MONTH) + 2;
  const cycleStartDate = new Date(referenceDate.getTime() + Math.floor(diffInDays / LUNAR_MONTH) * LUNAR_MONTH * 24 * 60 * 60 * 1000);
  const cycleEndDate = new Date(referenceDate.getTime() + (Math.floor(diffInDays / LUNAR_MONTH) + 1) * LUNAR_MONTH * 24 * 60 * 60 * 1000);

  // Sincronização do Calendário com o fuso brasileiro (America/Sao_Paulo)
  const startParts = getSaoPauloDateParts(cycleStartDate);
  const nowParts = getSaoPauloDateParts(now);
  
  const startDayTime = Date.UTC(startParts.year, startParts.month, startParts.day, 12, 0, 0);
  const nowDayTime = Date.UTC(nowParts.year, nowParts.month, nowParts.day, 12, 0, 0);
  
  const localDiffDays = Math.round((nowDayTime - startDayTime) / (1000 * 60 * 60 * 24));
  const mandalaDay = isNaN(localDiffDays) ? 1 : Math.min(29, Math.max(1, localDiffDays + 1));
  
  const formatDate = (d: Date) => {
    if (!d || isNaN(d.getTime())) return "01/01";
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  };
  
  return {
    day: mandalaDay,
    cycleId: cycleId,
    illumination: isNaN(illumination) ? 0 : illumination * 100,
    cycleRange: `${formatDate(cycleStartDate)} a ${formatDate(cycleEndDate)}`,
    getSignForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const ageForDay = ((safeDay - 1) / 29) * LUNAR_MONTH;
      const dateForDay = new Date(cycleStartDate.getTime() + ageForDay * 24 * 60 * 60 * 1000);
      const resVal = Math.floor(getMoonSignFloat(dateForDay)) % 12;
      return isNaN(resVal) ? 0 : resVal;
    },
    getMoonSignFloatForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const ageForDay = ((safeDay - 1) / 29) * LUNAR_MONTH;
      const dateForDay = new Date(cycleStartDate.getTime() + ageForDay * 24 * 60 * 60 * 1000);
      const resVal = getMoonSignFloat(dateForDay);
      return isNaN(resVal) ? 0 : resVal;
    },
    moonSignFloat: moonSignFloat,
    sunSignFloat: sunSignFloat,
    sunSignIndex: isNaN(sunSignFloat) ? 0 : Math.floor(sunSignFloat) % 12,
    cycleName: getZodiacSignSafely(Math.floor(getSunSignFloat(cycleStartDate)) % 12).name,
    getDateForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const d = new Date(cycleStartDate.getTime() + (safeDay - 1) * 24 * 60 * 60 * 1000);
      const dParts = getSaoPauloDateParts(d);
      return new Date(Date.UTC(dParts.year, dParts.month, dParts.day, 12, 0, 0));
    }
  };
};

interface LogEntry {
  id?: string;
  emotionId: string;
  intensity: number;
  date: string;
  timestamp?: any;
  cycleId: number;
  lunarDay: number;
  note?: string;
}

interface WindowData {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  pos: { x: number, y: number };
}

interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM
  sound: boolean;
  lastNotifiedDate: string | null;
}

// Síntese sonora harmônica celestial (Solfeggio 528Hz & sobretons) via Web Audio API nativo
const playCelestialChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const startTime = ctx.currentTime;
    const harmonicTones = [
      { freq: 528, delay: 0, dur: 2.3, gain: 0.14 },
      { freq: 792, delay: 0.12, dur: 2.1, gain: 0.11 },
      { freq: 1056, delay: 0.24, dur: 2.5, gain: 0.08 }
    ];
    harmonicTones.forEach(({ freq, delay, dur, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + delay);
      gain.gain.setValueAtTime(0.0001, startTime + delay);
      gain.gain.exponentialRampToValueAtTime(vol, startTime + delay + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + delay);
      osc.stop(startTime + delay + dur + 0.1);
    });
  } catch (e) {
    console.warn("Portal Hekat: Sinal sonoro celestial não pôde ser executado:", e);
  }
};

// Despacho de notificações do sistema operacional (Web Notification e PWA Service Worker)
const sendSystemNotification = (title: string, body: string, onOpen?: () => void) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: 'https://ciadoceu.com.br/wp-content/uploads/2026/05/logo_hekat.png.png',
          badge: 'https://ciadoceu.com.br/wp-content/uploads/2026/05/logo_hekat.png.png',
          tag: 'hekat-daily-reminder',
          renotify: true,
          silent: false
        } as any);
      }).catch(() => {
        const notif = new Notification(title, {
          body,
          icon: 'https://ciadoceu.com.br/wp-content/uploads/2026/05/logo_hekat.png.png'
        });
        if (onOpen) {
          notif.onclick = () => {
            window.focus();
            onOpen();
          };
        }
      });
    } else {
      const notif = new Notification(title, {
        body,
        icon: 'https://ciadoceu.com.br/wp-content/uploads/2026/05/logo_hekat.png.png'
      });
      if (onOpen) {
        notif.onclick = () => {
          window.focus();
          onOpen();
        };
      }
    }
  } catch (e) {
    console.warn("Portal Hekat: Notificação de sistema não pôde ser disparada:", e);
  }
};

const MiniMandala = ({ logs, lunarData, size = 180, isNight = true, solarOffset = 0, angleStep = (2 * Math.PI) / 29 }: { logs: Record<number, LogEntry>, lunarData: any, size?: number, isNight?: boolean, solarOffset?: number, angleStep?: number }) => {
  const radius = (size / 350) * 140;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const renderSegments = () => {
    const localSegments = [];
    for (let i = 0; i < 29; i++) {
      const dayNum = i + 1;
      const startAngle = Math.PI - (i * angleStep) - solarOffset;
      const endAngle = Math.PI - ((i + 1) * angleStep) - solarOffset;
      for (let ring = 1; ring <= 5; ring++) {
        const iR = Math.max(0.1, (ring - 1) * (radius / 5));
        const oR = ring * (radius / 5);
        const x1 = centerX + oR * Math.cos(startAngle);
        const y1 = centerY + oR * Math.sin(startAngle);
        const x2 = centerX + oR * Math.cos(endAngle);
        const y2 = centerY + oR * Math.sin(endAngle);
        const x3 = centerX + iR * Math.cos(endAngle);
        const y3 = centerY + iR * Math.sin(endAngle);
        const x4 = centerX + iR * Math.cos(startAngle);
        const y4 = centerY + iR * Math.sin(startAngle);
        const dStr = `M ${x1} ${y1} A ${oR} ${oR} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${iR} ${iR} 0 0 1 ${x4} ${y4} Z`;
        
        const log = logs[dayNum];
        const isFilled = log && ring >= (6 - log.intensity);
        
        let fillColor = '#FFFFFF';
        if (isFilled && log.emotionId) {
          fillColor = EMOTIONS.find(e => e.id === log.emotionId)?.color || '#FFFFFF';
        }

        localSegments.push(
          <path 
            key={`mini-d-${dayNum}-r-${ring}`} 
            d={dStr} 
            fill={fillColor} 
            stroke="#E2E8F0" 
            strokeWidth="0.2" 
            style={{ fillOpacity: isFilled ? 0.9 : 0.1 }}
          />
        );
      }
    }
    return localSegments;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {renderSegments()}
    </svg>
  );
};

const getClientFallbackOracle = (
  sunSignName?: string, 
  moonSignName?: string, 
  philosophicalPhrase?: string, 
  userName?: string, 
  aspectDesc?: string
): string => {
  const sunRaw = (sunSignName || 'Touro').trim();
  const moonRaw = (moonSignName || 'Peixes').trim();
  const sun = sunRaw.toLowerCase();
  const moon = moonRaw.toLowerCase();
  const nameIntro = userName ? `${userName}, ` : '';
  
  // Arquétipos astrológicos naturais e acolhedores
  const archetypes: Record<string, string> = {
    'áries': 'a coragem e a iniciativa de Áries',
    'aries': 'a coragem e a iniciativa de Áries',
    'touro': 'a persistência e o valor real de Touro',
    'gêmeos': 'a mente curiosa e a comunicação de Gêmeos',
    'gemeos': 'a mente curiosa e a comunicação de Gêmeos',
    'câncer': 'o afeto acolhedor e as raízes de Câncer',
    'cancer': 'o afeto acolhedor e as raízes de Câncer',
    'leão': 'o brilho nobre e a generosidade de Leão',
    'leao': 'o brilho nobre e a generosidade de Leão',
    'virgem': 'o discernimento lúcido e o cuidado de Virgem',
    'libra': 'a busca de harmonia e ponderação de Libra',
    'escorpião': 'a profundidade e o poder de transformação de Escorpião',
    'escorpiao': 'a profundidade e o poder de transformação de Escorpião',
    'sagitário': 'a visão ampla e o entusiasmo de Sagitário',
    'sagitario': 'a visão ampla e o entusiasmo de Sagitário',
    'capricórnio': 'a maturidade serena e a paciência de Capricórnio',
    'capricornio': 'a maturidade serena e a paciência de Capricórnio',
    'aquário': 'a liberdade de pensamento e a renovação de Aquário',
    'aquario': 'a liberdade de pensamento e a renovação de Aquário',
    'peixes': 'a sensibilidade empática e a intuição de Peixes'
  };

  const getElement = (sign: string): 'FOGO' | 'TERRA' | 'AR' | 'ÁGUA' => {
    if (['áries', 'leão', 'sagitário', 'aries', 'leao', 'sagitario'].includes(sign)) return 'FOGO';
    if (['touro', 'virgem', 'capricórnio', 'capricornio'].includes(sign)) return 'TERRA';
    if (['gêmeos', 'gemeos', 'libra', 'aquário', 'aquario'].includes(sign)) return 'AR';
    return 'ÁGUA';
  };

  const sunElement = getElement(sun);
  const moonElement = getElement(moon);

  const sunArch = archetypes[sun] || `a força essencial de ${sunRaw}`;
  const moonArch = archetypes[moon] || `a presença de ${moonRaw}`;

  // Frase inicial harmonizando os arquétipos
  let archetypesIntro = '';
  if (sun === moon) {
    archetypesIntro = `acolha com integridade ${sunArch}.`;
  } else {
    archetypesIntro = `sintonize ${sunArch} com ${moonArch}.`;
  }

  // Síntese dos elementos com palavras-chave mandatórias incorporadas com simplicidade e fluidez:
  // FOGO: faísca, irradiação, vontade, despertar, chama.
  // TERRA: maturação, substância, colheita.
  // AR: fluxo, sopro, síntese, aprendizado, percepção, palavras.
  // ÁGUA: maré, reflexo, emoção, sentimentos, intuição, mergulho, fluir.
  const elementMap: Record<string, string> = {
    'FOGO_FOGO': 'A faísca da sua vontade desperta com intensidade, irradiando uma chama viva que dissipa dúvidas e impulsiona a sua ação com coragem.',
    'FOGO_TERRA': 'A faísca da sua vontade ganha substância real quando respeita o tempo de maturação para gerar uma colheita consistente.',
    'FOGO_AR': 'A chama criativa da vontade ganha fluxo no sopro das ideias, onde as palavras certas trazem síntese ao aprendizado e clareiam a percepção.',
    'FOGO_ÁGUA': 'A faísca da sua vontade encontra as marés do sentir, unindo o mergulho no reflexo das emoções à intuição que guia os seus passos.',
    'TERRA_FOGO': 'A substância do que você constrói ganha presença fértil quando a faísca da vontade desperta a coragem necessária para uma colheita fecunda.',
    'TERRA_TERRA': 'A substância do real exige presença e paciência, honrando o ritmo natural da maturação para assegurar uma colheita fecunda e segura.',
    'TERRA_AR': 'A clareza prática ganha síntese através do sopro do aprendizado, unindo o fluxo de boas palavras à maturação de uma colheita com substância.',
    'TERRA_ÁGUA': 'A maturação interna se fortalece com afeto e serenidade, permitindo que as marés da alma e o reflexo das emoções enriqueçam a sua colheita.',
    'AR_FOGO': 'O fluxo mental recebe um sopro renovador, enquanto a faísca do despertar irradia a sua vontade de expandir horizontes com entusiasmo.',
    'AR_TERRA': 'O fluxo das palavras ganha substância ao encontrar sustento na realidade, permitindo que a percepção amadureça com tempo e paciência.',
    'AR_AR': 'O fluxo do pensamento e o sopro das ideias trazem síntese lúcida, onde o aprendizado e as palavras certas ampliam a sua percepção.',
    'AR_ÁGUA': 'O fluxo das palavras se harmoniza com a intuição, onde o reflexo de águas serenas acalma a mente e pacifica os sentimentos.',
    'ÁGUA_FOGO': 'As marés do sentir acolhem a faísca da vontade, acendendo o reflexo de emoções que despertam a coragem de agir com nobreza.',
    'ÁGUA_TERRA': 'As marés da sensibilidade ganham estabilidade e substância quando o respeito à maturação interna constrói um alicerce seguro para o sentir.',
    'ÁGUA_AR': 'O reflexo das emoções encontra síntese no sopro do aprendizado, permitindo que as palavras comuniquem a intuição com suavidade.',
    'ÁGUA_ÁGUA': 'As marés íntimas fluem em harmonia com a sua sensibilidade, onde o mergulho interior acalma as correntezas e acolhe os sentimentos com verdade.'
  };

  const elemKey = `${sunElement}_${moonElement}`;
  const elementText = elementMap[elemKey] || elementMap['TERRA_TERRA'];

  // Qualidade do aspecto sem citar termos técnicos e conselho final integrado sem rótulos
  let aspectClause = '';
  let aspectAdvice = '';

  const descLower = (aspectDesc || '').toLowerCase();
  if (descLower.includes('conjunção') || descLower.includes('conjuncao') || descLower.includes('impulso') || descLower.includes('autenticidade')) {
    aspectClause = 'Este impulso de fusão pede autenticidade em síntese com a sua verdade interior.';
    aspectAdvice = 'Sustente a firmeza ética dos seus atos hoje, alinhando a vontade consciente ao seu propósito essencial.';
  } else if (descLower.includes('oposição') || descLower.includes('oposicao') || descLower.includes('polaridades') || descLower.includes('equilíbrio') || descLower.includes('equilibrio')) {
    aspectClause = 'Diante de polaridades em diálogo, acolha a dúvida fértil para encontrar o equilíbrio entre forças complementares.';
    aspectAdvice = 'Busque a ponderação serena diante de visões contrastantes, harmonizando os opostos antes de firmar a sua postura.';
  } else if (descLower.includes('quadratura') || descLower.includes('tensaõ') || descLower.includes('tensão') || descLower.includes('conflito') || descLower.includes('turva')) {
    aspectClause = 'Diante de qualquer tensão emocional ou conflito, exercite a paciência e a espera — jamais permita que a emoção turve a razão.';
    aspectAdvice = 'Preserve a serenidade interior e aguarde a turbulência passar antes de tomar atitudes definitivas hoje.';
  } else if (descLower.includes('trígono') || descLower.includes('trigono') || descLower.includes('soluções') || descLower.includes('criatividade')) {
    aspectClause = 'Caminhe com leveza sob o fluxo harmônico de soluções criativas e clareza espontânea.';
    aspectAdvice = 'Confie no curso natural dos acontecimentos e deixe a sua sabedoria interior orientar as escolhas de hoje.';
  } else {
    aspectClause = 'Mantenha a mente receptiva para aprender com simplicidade e aplicar o que já foi assimilado com maturidade.';
    aspectAdvice = 'Aplique com sobriedade o discernimento ético nas situações que exigirem o seu posicionamento hoje.';
  }

  return `${nameIntro}${archetypesIntro} ${elementText} ${aspectClause} ${aspectAdvice}`;
};

// Helper to serialize lunarData without function properties for Firestore and local consistency
const serializeLunarData = (data: any) => {
  if (!data) return null;
  return {
    day: typeof data.day === 'number' ? data.day : 1,
    cycleId: typeof data.cycleId === 'number' ? data.cycleId : 1,
    illumination: typeof data.illumination === 'number' ? data.illumination : 0,
    cycleRange: typeof data.cycleRange === 'string' ? data.cycleRange : "",
    moonSignFloat: typeof data.moonSignFloat === 'number' ? data.moonSignFloat : 0,
    sunSignFloat: typeof data.sunSignFloat === 'number' ? data.sunSignFloat : 0,
    sunSignIndex: typeof data.sunSignIndex === 'number' ? data.sunSignIndex : 0,
    cycleName: typeof data.cycleName === 'string' ? data.cycleName : ""
  };
};

function parseClientLogData(logData?: string) {
  if (!logData || !logData.trim()) {
    return {
      hasLogs: false,
      count: 0,
      dominant: 'recolhimento',
      secondary: '',
      notesSummary: '',
      emotionsList: [] as string[]
    };
  }

  const lines = logData.split('\n').filter(l => l.trim().length > 0);
  const emotionCounts: Record<string, number> = {};
  const notes: string[] = [];

  for (const line of lines) {
    const matchEmotion = line.match(/Sentimento\s+([A-Za-zÀ-ÿ\s]+?)(?:\s*\(|\s*,|$)/i) || line.match(/Sentimento\s+([A-Za-zÀ-ÿ]+)/i);
    if (matchEmotion) {
      const em = matchEmotion[1].trim();
      emotionCounts[em] = (emotionCounts[em] || 0) + 1;
    }
    const matchNote = line.match(/Notas?:\s*"([^"]+)"/i) || line.match(/Anotações?:\s*"([^"]+)"/i);
    if (matchNote && matchNote[1].trim()) {
      notes.push(matchNote[1].trim());
    }
  }

  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] || 'recolhimento e auto-observação';
  const secondary = sorted[1]?.[0] || '';
  const notesSummary = notes.length > 0 ? ` As anotações trazem à tona reflexões como "${notes.slice(0, 2).join('" e "')}", revelando a sinceridade do seu processo íntimo.` : '';

  return {
    hasLogs: lines.length > 0,
    count: lines.length,
    dominant,
    secondary,
    notesSummary,
    emotionsList: sorted.map(s => `${s[0]} (${s[1]}x)`)
  };
}

const getClientFallbackReport = (
  period: string, 
  logData?: string, 
  userName?: string
): string => {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : '';
  const info = parseClientLogData(logData);

  if (isWeekly) {
    const emotionClause = info.hasLogs
      ? (info.secondary 
          ? `uma tônica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}, acompanhada de manifestações de ${info.secondary.toLowerCase()}`
          : `uma tônica de sentimentos voltada predominantemente a ${info.dominant.toLowerCase()}`)
      : `uma tônica de sentimentos voltada à busca por recolhimento e discernimento profundo`;

    return `${nameIntro}identifico em sua caminhada de registros diários ${emotionClause}. A sua linha de pensamento predominante girou em torno de integrar essas percepções e harmonizar os movimentos da mente com a sabedoria do sentir.${info.notesSummary} O padrão dominante que unifica esses dias revela momentos de auto-observação honesta e busca por clareza. Como sua mentora sábia e amiga próxima de caminhada, ressalto que as oscilações emocionais e a autocrítica são pontos de sombra que demandam sua gentil atenção e zelo protetor para que não sufoquem sua clareza. Em contrapartida, a constância em registrar a verdade do seu sentir e acolher seus próprios ritmos funcionam como pontos luminosos de grande expansão e força. Sustente seus passos com postura ética e resgate o centramento dócil para conduzir os próximos movimentos da alma. O conselho prático para este momento é cultivar uma pausa intencional antes de responder a qualquer provocação externa, permitindo que a quietude revele o próximo passo com nobreza e dignidade.`;
  } else if (isMonthly) {
    const emotionClause = info.hasLogs
      ? (info.secondary 
          ? `uma tônica ancorada em ${info.dominant.toLowerCase()} e ${info.secondary.toLowerCase()}`
          : `uma tônica ancorada em ${info.dominant.toLowerCase()}`)
      : `uma tônica voltada à consolidação, aterramento e organização de prioridades`;

    return `${nameIntro}ao sintetizar os pontos recorrentes das suas anotações ao longo dos últimos 28 dias do ciclo lunar, percebo ${emotionClause}, estruturando sua caminhada de maturação e centramento.${info.notesSummary} O padrão dominante revela momentos de colheita sincera alternados com períodos em que a mente pede paciência para assimilar as transformações necessárias. Como sua mentora, amiga querida e companheira de jornada, destaco que a pressa ou a rigidez diante dos desdobramentos da vida são sombras que requerem sua atenção vigilante para não represar o fluxo do seu desenvolvimento. Em contrapartida, a constância em observar-se com afeto e o respeito solene ao tempo de gestação dos seus ideais são pontos luminosos de grande expansão. Para guiar seus passos na condução dos movimentos da alma com postura e clareza, finalize o que ficou pendente e abra espaço para o novo florescer.

Lista de Tarefas:
- Iniciado: Reconhecimento consciente dos padrões de ${info.dominant.toLowerCase()} e escuta atenta das marés internas.
- Dar continuidade: Prática diária de escrita de astromemórias e sustentação da clareza mental.
- Finalizado: Integração das oscilações passadas e encerramento de dinâmicas internas de autocobrança.`;
  } else if (isCorrelation) {
    const subtitle = `Sentimento Predominante nos Últimos 3 Ciclos: ${info.dominant}`;
    const emotionContext = info.hasLogs
      ? ` Os registros apontam que sentimentos como ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ''} dialogam diretamente com as oscilações de luz do céu.`
      : '';
    return `${subtitle}\n\n${nameIntro}as suas mandalas revelam uma correspondência íntima entre as fases lunares e sua energia emocional interna ao longo dos ciclos registrados.${emotionContext} Na fase de Lua Nova, o sentimento prioritário identificado é o acolhimento reflexivo, convidando ao recolhimento e plantio de intenções. Na fase Crescente, sobressai o ânimo renovador e o entusiasmo para estruturar novos passos. Na fase Cheia, destaca-se a sensibilidade expandida e a expressividade, elevando as emoções ao seu ponto mais alto. E na fase Minguante, o desapego e a síntese tornam-se prioritários para encerrar o ciclo com sabedoria. Use essa correspondência direta como um mapa pessoal de autoconhecimento, aprendendo a respeitar os momentos em que a alma pede para agir com coragem e quando é o tempo de simplesmente fluir e descansar.`;
  } else {
    // Quarterly / Trimestral
    const emotionContext = info.hasLogs 
      ? ` Em seus registros deste trimestre, sobressaíram sentimentos de ${info.dominant.toLowerCase()}${info.secondary ? ` e ${info.secondary.toLowerCase()}` : ''}, marcando momentos cruciais de tomada de consciência.` 
      : '';
    return `${nameIntro}identifico na análise desta Estação da Alma, que compreende este último trimestre, eventos significativos e datas específicas onde os padrões emocionais se tornaram evidentes.${emotionContext} Em episódios de sobrecarga ou cansaço acumulado, reações de hesitação e ansiedade emergiram de forma mais marcante, resultando em oscilações do foco. Como sua amiga próxima e mentora sábia nesta caminhada, lembro-lhe de que essas reatividades são sombras naturais que nos indicam onde a autonomia precisa ser reforçada com maturidade. Os sentimentos predominantes de busca por segurança e centramento mostram o seu desejo sincero de evolução. O conselho para lidar com essa reatividade e conduzir seu processo de transformação permanente é cultivar uma pausa intencional antes de responder a estímulos externos, usando a respiração profunda como alicerce para desarmar a reatividade, permitindo que a clareza mental guie suas decisões com nobreza e dignidade.`;
  }
};

const getLogDate = (log: LogEntry): Date => {
  if (log.timestamp?.toDate) return log.timestamp.toDate();
  if (log.timestamp instanceof Date) return log.timestamp;
  if (typeof log.timestamp === 'string' || typeof log.timestamp === 'number') {
    const d = new Date(log.timestamp);
    if (!isNaN(d.getTime())) return d;
  }
  if (log.date) {
    const d = new Date(log.date);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export default function App() {
  console.log("Hekat App mounting...");
  const desktopRef = useRef<HTMLDivElement>(null);
  
  // Sincronização e Calibração de Relógio com o Servidor (UTC/2026)
  const serverOffsetRef = useRef<number>(0);
  const clientClockSyncDoneRef = useRef<boolean>(false);
  const [now, setNow] = useState(new Date());
  const [mountError, setMountError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w <= 1180);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    window.addEventListener('orientationchange', checkScreen);
    return () => {
      window.removeEventListener('resize', checkScreen);
      window.removeEventListener('orientationchange', checkScreen);
    };
  }, []);

  // Ticker para atualizar sincronia a cada minuto usando o offset do servidor
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(new Date(Date.now() + serverOffsetRef.current));
    }, 60000); // 1 minuto
    return () => clearInterval(ticker);
  }, []);

  const baseLunarData = useMemo(() => getLunarData(now), [now]);
  const todayCalendarDate = useMemo(() => now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }), [now]);
  
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [viewingCycleId, setViewingCycleId] = useState<number | null>(null);

  // States for real Swiss Ephemeris data from server
  const [realAstronomyData, setRealAstronomyData] = useState<{
    sun: { longitude: number; signIndex: number; signName: string; degrees: number };
    moon: { longitude: number; signIndex: number; signName: string; degrees: number };
    phaseAngle: number;
    illumination: number;
    serverTime?: string;
  } | null>(null);

  const [realCycleData, setRealCycleData] = useState<{
    startDate: string;
    cycleName: string;
    days: {
      lunarDay: number;
      dateString: string;
      isoDate: string;
      sun: { longitude: number; signIndex: number; signName: string; degrees: number };
      moon: { longitude: number; signIndex: number; signName: string; degrees: number };
      phaseAngle: number;
      illumination: number;
    }[];
  } | null>(null);

  // Fetch real-time high-performance astronomy calculations
  useEffect(() => {
    let active = true;
    const fetchRealData = async () => {
      try {
        const response = await axios.post("/api/astronomy/calculate", { date: now.toISOString() });
        if (response.data?.success && active) {
          setRealAstronomyData(response.data);
          
          // Sincronizar o relógio do cliente se houver desvio ou o ano estiver errado
          if (response.data.serverTime && !clientClockSyncDoneRef.current) {
            const serverDateVal = new Date(response.data.serverTime);
            const offset = serverDateVal.getTime() - Date.now();
            serverOffsetRef.current = offset;
            clientClockSyncDoneRef.current = true;
            
            if (Math.abs(offset) > 5000) {
              console.log(`Hekat: Ajustando relógio de acordo com o servidor. Desvio: ${offset}ms`);
              setNow(new Date(Date.now() + offset));
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch real-time Swiss Ephemeris data. Using high-precision math anchors.", err);
      }
    };
    fetchRealData();
    return () => { active = false; };
  }, [now]);

  // Fetch real-time 28-day cycle data
  useEffect(() => {
    let active = true;
    const fetchCycleData = async () => {
      try {
        const refStart = baseLunarData.getDateForDay(1); // Date of Lunar Day 1
        const response = await axios.post("/api/astronomy/cycle", { startDate: refStart.toISOString() });
        if (response.data?.success && active) {
          setRealCycleData(response.data);
        }
      } catch (err) {
        console.warn("Could not fetch real-time cycle data. Using high-precision math anchors.", err);
      }
    };
    fetchCycleData();
    return () => { active = false; };
  }, [baseLunarData.cycleId]);

  const lunarData = useMemo(() => {
    const base = { ...baseLunarData };
    
    if (realAstronomyData) {
      base.moonSignFloat = realAstronomyData.moon.signIndex + (realAstronomyData.moon.degrees / 30);
      base.sunSignFloat = realAstronomyData.sun.signIndex + (realAstronomyData.sun.degrees / 30);
      base.sunSignIndex = realAstronomyData.sun.signIndex;
      base.illumination = realAstronomyData.illumination;
    }
    
    if (realCycleData) {
      base.cycleName = realCycleData.cycleName;
      base.getSignForDay = (day: number) => {
        const dData = realCycleData.days[day - 1];
        return dData ? dData.moon.signIndex : baseLunarData.getSignForDay(day);
      };
      base.getMoonSignFloatForDay = (day: number) => {
        const dData = realCycleData.days[day - 1];
        return dData ? dData.moon.signIndex + (dData.moon.degrees / 30) : baseLunarData.getMoonSignFloatForDay(day);
      };
    }
    
    return base;
  }, [baseLunarData, realAstronomyData, realCycleData]);

  const logs = useMemo(() => {
    const mandalaMap: Record<number, LogEntry> = {};
    const targetCycle = viewingCycleId || lunarData.cycleId;
    allLogs.forEach(log => {
      if (log.cycleId === targetCycle) {
        mandalaMap[log.lunarDay] = log;
      }
    });
    return mandalaMap;
  }, [allLogs, viewingCycleId, lunarData.cycleId]);

  // Consolidação dos registros dos últimos 3 ciclos lunares para o relatório de Correlação Lunar
  const correlationConsolidatedLogData = useMemo(() => {
    const currentCycle = viewingCycleId || lunarData.cycleId || 1;
    const cycleIds = Array.from(new Set<number>(allLogs.map(l => Number(l.cycleId)).filter(c => !isNaN(c) && c > 0))).sort((a, b) => a - b);
    const targetCycles = cycleIds.length > 0 
      ? Array.from(new Set<number>([...cycleIds.filter(c => c <= currentCycle).slice(-3), currentCycle]))
      : [currentCycle];

    const sortedDescLogs = [...allLogs].sort((a, b) => {
      const dateA = getLogDate(a).getTime();
      const dateB = getLogDate(b).getTime();
      if (Math.abs(dateB - dateA) > 60000) return dateB - dateA;
      if (b.cycleId !== a.cycleId) return b.cycleId - a.cycleId;
      return b.lunarDay - a.lunarDay;
    });

    const correlationLogs = sortedDescLogs.filter(l => targetCycles.includes(l.cycleId));
    const finalLogs = (correlationLogs.length > 0 ? correlationLogs.slice(0, 87) : sortedDescLogs.slice(0, 87)).reverse();

    const formatLine = (log: LogEntry) => {
      const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || log.emotionId || 'Neutro';
      const dateStr = log.date || getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Anotações: "${log.note}"` : ''}`;
    };

    return finalLogs.map(formatLine).join('\n');
  }, [allLogs, viewingCycleId, lunarData.cycleId]);

  // Síntese de dados e sentimento predominante dos últimos 3 ciclos usando o padrão parseClientLogData
  const correlationSummary = useMemo(() => {
    return parseClientLogData(correlationConsolidatedLogData);
  }, [correlationConsolidatedLogData]);

  // Sincronizar ciclo de visualização com o atual ao carregar app
  useEffect(() => {
    if (viewingCycleId === null && lunarData.cycleId) {
      setViewingCycleId(lunarData.cycleId);
    }
  }, [lunarData.cycleId]);
  
  // Firebase State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ isPremium?: boolean } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    console.log("Hekat App mounted successfully. Auth state:", { isAuthLoading, currentUserId: currentUser?.uid });
  }, [isAuthLoading, currentUser]);

  // Migração de Dados (Ajuste de Numeração de Ciclos)
  const migrationInProgress = useRef(false);
  useEffect(() => {
    // Carregamento bypassando a migração destrutiva para preservar os históricos de ciclo 1 e ciclo 2
    return;
  }, [currentUser, allLogs, lunarData.day]);

  // PagBank State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Nova Lunação / Dia 1 do Ciclo: inicia novo ciclo apresentando a Mandala Vazia, preservando o histórico anterior
  useEffect(() => {
    if (lunarData.day === 1 && lunarData.cycleId) {
      // Sintonizar a visualização com o ciclo atual para apresentar a mandala vazia para o ciclo que se inicia
      setViewingCycleId(lunarData.cycleId);
      console.log(`[Hekat] Novo ciclo lunar detectado (Ciclo ${lunarData.cycleId}). Apresentando Mandala Vazia. Histórico do ciclo anterior totalmente preservado no Firestore.`);
    }
  }, [lunarData.day, lunarData.cycleId]);

  // Analista Hekat Logic
  const [reports, setReports] = useState<{
    weekly: { text: string | null; logs: Record<number, LogEntry> | null; meta: any | null };
    monthly: { text: string | null; logs: Record<number, LogEntry> | null; meta: any | null };
    quarterly: { text: string | null; logs: Record<number, LogEntry> | null; meta: any | null };
    correlation: { text: string | null; logs: Record<number, LogEntry> | null; meta: any | null };
  }>({ 
    weekly: { text: null, logs: null, meta: null }, 
    monthly: { text: null, logs: null, meta: null }, 
    quarterly: { text: null, logs: null, meta: null },
    correlation: { text: null, logs: null, meta: null }
  });
  const [isReportLoading, setIsReportLoading] = useState<string | null>(null);
  const [isUpdatingAllReports, setIsUpdatingAllReports] = useState(false);

  const generateReport = async (period: 'weekly' | 'monthly' | 'quarterly' | 'correlation') => {
    setIsReportLoading(period);
    
    // Helper para obter a data correta de cada log
    const getLogDate = (log: LogEntry): Date => {
      if (log.timestamp?.toDate) return log.timestamp.toDate();
      if (log.timestamp instanceof Date) return log.timestamp;
      if (typeof log.timestamp === 'string' || typeof log.timestamp === 'number') {
        const d = new Date(log.timestamp);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    };

    // Ordenação decrescente: do mais recente para o mais antigo
    const sortedDescLogs = [...allLogs].sort((a, b) => {
      const dateA = getLogDate(a).getTime();
      const dateB = getLogDate(b).getTime();
      if (Math.abs(dateB - dateA) > 60000) return dateB - dateA;
      if (b.cycleId !== a.cycleId) return b.cycleId - a.cycleId;
      return b.lunarDay - a.lunarDay;
    });

    const formatLogLine = (log: LogEntry) => {
      const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || log.emotionId || 'Neutro';
      const dateStr = log.date || getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Anotações: "${log.note}"` : ''}`;
    };

    // Preparar dados atuais filtrando adequadamente por período
    let logData = "";
    if (period === 'weekly') {
      const finalWeeklyLogs = sortedDescLogs.slice(0, 7).reverse();
      logData = finalWeeklyLogs.map(formatLogLine).join('\n');
    } else if (period === 'monthly') {
      const finalMonthlyLogs = sortedDescLogs.slice(0, 29).reverse();
      logData = finalMonthlyLogs.map(formatLogLine).join('\n');
    } else if (period === 'quarterly') {
      const finalQuarterlyLogs = sortedDescLogs.slice(0, 90).reverse();
      logData = finalQuarterlyLogs.map(formatLogLine).join('\n');
    } else {
      // correlation: use consolidated logs of the last 3 cycles
      logData = correlationConsolidatedLogData;
    }

    // Contexto de meses anteriores para continuidade e padrões
    const previousLogsData = allLogs
      .filter(log => log.cycleId < (viewingCycleId || lunarData.cycleId))
      .slice(-40) // Ajustado para incluir notas sem exceder limites práticos
      .map(log => `Ciclo ${log.cycleId}, Dia ${log.lunarDay}: ${EMOTIONS.find(e => e.id === log.emotionId)?.name || log.emotionId} (${log.intensity})${log.note ? ` - Nota: ${log.note}` : ''}`)
      .join('\n');

    const getPhaseName = (day: number) => {
      const ph = LUNAR_PHASES.slice().reverse().find(p => day >= p.startDay) || LUNAR_PHASES[0];
      return ph.name;
    };

    const phaseGroups: Record<string, Record<string, number>> = {};
    allLogs.forEach(l => {
      const phaseName = getPhaseName(l.lunarDay);
      const emotionName = EMOTIONS.find(e => e.id === l.emotionId)?.name || 'Outro';
      if (!phaseGroups[phaseName]) {
        phaseGroups[phaseName] = {};
      }
      phaseGroups[phaseName][emotionName] = (phaseGroups[phaseName][emotionName] || 0) + 1;
    });
    const correlationData = Object.entries(phaseGroups).map(([phaseName, emotionCounts]) => {
      const countsStr = Object.entries(emotionCounts)
        .map(([emo, count]) => `${emo}: ${count}x`)
        .join(', ');
      return `Na ${phaseName} acumulada dos meses: ${countsStr}`;
    }).join('\n');

    const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    const formattedName = rawName ? rawName.trim() : '';

    let prompt = "";
    if (period === 'weekly') {
      prompt = `Realize a análise do Relatório Semanal com base nos registros dos últimos 7 dias.
               DADOS DE CORREÇÃO (7 DIAS):
               ${logData || 'Nenhum dado registrado nos últimos 7 dias.'}
               
               TAREFA EXCLUSIVA:
               1. Use os dados inseridos pela usuária no período dos últimos 7 dias para definir a tônica dos sentimentos e a linha de pensamento predominante do período, apresentando um parecer analítico estruturado de forma fluida.
               2. Una os dados das informações disponíveis para revelar um padrão dominante identificado nos registros.
               3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia, amiga querida e mentora (Hekat é do gênero feminino), mantendo a sobriedade indispensável e evitando gírias, tons excessivamente informais ou superlativos sintéticos.
               4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usuária pelo nome "${formattedName}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
               5. Destaque de forma nítida tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou oscilações) quanto os pontos positivos que geram expansão de consciência.
               6. Finalize o relatório com um conselho prático e útil centrado em postura, ética e clareza mental para conduzir os movimentos da alma.
               7. NÃO se restrinja a 4 linhas. Desenvolva um texto reflexivo, consistente e profundo.
               8. Formato: O texto deve ser composto por um parágrafo único integralmente JUSTIFICADO (sem recuos de página, sem bullets, sem títulos, sem subseções, sem aspas externas desnecessárias).`;
    } else if (period === 'monthly') {
      prompt = `Realize a análise do Relatório Mensal com base nos registros dos últimos 29 dias do ciclo lunar.
               DADOS DE CORTE (29 DIAS):
               ${logData || 'Nenhum dado registrado neste ciclo lunar de 29 dias.'}
               HISTÓRICO RECENTE:
               ${previousLogsData || 'Primeiro ciclo registrado.'}
               
               TAREFA EXCLUSIVA:
               1. Use os dados inseridos pela usuária no período dos últimos 29 dias para definir de forma nítida a tônica dos sentimentos e a linha de pensamento predominante do período, apresentando um parecer analítico estruturado de forma fluida.
               2. Una os dados disponíveis para revelar os padrões de sentimentos dominantes identificados nos registros, comparando-os e conectando-os se houver histórico.
               3. Use uma linguagem acolhedora e fraterna, aproximando-se com a postura de uma sábia, amiga querida e mentora (Hekat é do gênero feminino), mantendo a sobriedade indispensável e evitando gírias, tons informais ou superlativos sintéticos.
               4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usuária pelo nome "${formattedName}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
               5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou resistências que a paralisam) quanto os pontos positivos que geram expansão de consciência.
               6. Apresente uma síntese clara dos pontos recorrentes ao longo do período de 29 dias, ressaltando o que precisa ser finalizado.
               7. Gere obrigatoriamente uma lista de tarefas estruturada e clara ao final, classificada exatamente nestas três classes de forma limpa:
                  - Iniciado: [tarefas iniciadas no período]
                  - Dar continuidade: [atividades ou processos para dar continuidade]
                  - Finalizado: [processos ou tarefas finalizadas ou a finalizar neste ciclo]
               8. NÃO se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo, seguido de forma espaçada pela lista de tarefas.
               9. Formato: O texto de análise deve ser justificado, seguido pela seção da lista de tarefas estruturada de forma limpa e visível.`;
    } else if (period === 'correlation') {
      const dominantSentiment = correlationSummary.dominant;
      prompt = `Realize uma análise de correlação entre as fases da lua e os padrões de sentimentos/dados inseridos pela usuária.
               DADOS DE CORRELAÇÃO DOS ÚLTIMOS 3 CICLOS (de 29 dias cada):\n${correlationData || 'Nenhum dado acumulado disponível ainda.'}\n
               HISTÓRICO INTEGRADO:\n${previousLogsData || ''}\n${logData || ''}
               
               TAREFA EXCLUSIVA:
               1. A frase inicial do relatório deve ser obrigatoriamente um subtítulo dinâmico que apresente o sentimento predominante detectado nos 3 últimos ciclos lunares, exatamente no formato:
               "Sentimento Predominante nos Últimos 3 Ciclos: ${dominantSentiment}"
               2. Faça uma correlação nítida e direta das fases da Lua (Nova, Crescente, Cheia, Minguante) com a repetição de padrões de sentimentos e dados inseridos pela usuária.
               3. Destaque obrigatoriamente um sentimento prioritário identificado em cada uma das quatro fases lunares considerando os 3 últimos ciclos lunares de 29 dias.
               4. Use uma linguagem acolhedora, fraterna, dócil e sábia de uma mentora sábia (Hekat é do gênero feminino). Evite superlativos sintéticos.
               5. Logo após o subtítulo dinâmico na primeira linha isolada, inicie o texto chamando a usuária pelo nome "${formattedName}" para trazer proximidade de forma natural (ex: "${formattedName}, ...").
               6. Formato: O relatório deve iniciar com o subtítulo dinâmico na primeira linha, seguido pelo texto fluido, reflexivo e consistente.`;
    } else {
      prompt = `Realize uma análise profunda desta 'Estação da Alma' (Relatório Trimestral).
               HISTÓRICO E CICLO ATUAL:\n${previousLogsData}\n${logData}\n
               
               TAREFA EXCLUSIVA:
               1. Analise o histórico dos últimos 90 dias (trimestre).
               2. Identifique e pontue datas e eventos específicos mencionados nos registros que estejam relacionados com padrões emocionais reativos.
               3. Ressalte com clareza quais foram os sentimentos predominantes detectados ao longo do trimestre.
               4. Destaque tanto os pontos negativos que necessitam de sua atenção cuidadosa quanto os pontos positivos que propiciam a expansão de consciência.
               5. Traga um conselho profundo e útil centrado em postura, ética e clareza mental para lidar com os sentimentos reativos e guiar seu processo de transformação permanente.
               6. Use uma linguagem acolhedora, fraterna e sábia de sua mentora Hekat (gênero feminino). Evite superlativos sintéticos.
               7. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${formattedName}" no início exato. Não use variações de "ao olhar seu trimestre" ou "ao avaliar seus sentimentos".
               8. Formato: Um texto corrido, reflexivo e consistente.`;
    }

    try {
      console.log(`Gerando relatório ${period} com Gemini...`);

      const response = await fetch(getApiUrl("/api/reports"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          logData,
          previousLogsData,
          correlationData,
          userName: formattedName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Portal de Inteligência offline.");
      }

      const data = await response.json();
      let text = data.text;

      if (period === 'correlation' && text && !text.toLowerCase().includes('sentimento predominante')) {
        text = `Sentimento Predominante nos Últimos 3 Ciclos: ${correlationSummary.dominant}\n\n${text}`;
      }
      
      console.log(`Relatório ${period} recebido:`, text);
      const updatedReport = { 
        text: text || "Os astros não revelaram nada hoje.",
        logs: { ...logs },
        meta: { solarOffset, lunarData: serializeLunarData(lunarData) }
      };

      setReports(prev => {
        const updated = { 
          ...prev, 
          [period]: updatedReport
        };

        if (currentUser) {
          if (currentUser.uid === 'guest_user') {
            localStorage.setItem(`hekat_guest_report_${period}`, JSON.stringify(updatedReport));
          } else if (db) {
            const reportDocRef = doc(db, 'users', currentUser.uid, 'reports', period);
            setDoc(reportDocRef, {
              text: text || "Os astros não revelaram nada hoje.",
              logs: { ...logs },
              meta: { solarOffset, lunarData: serializeLunarData(lunarData) },
              updatedAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reports/${period}`));
          }
        }

        return updated;
      });
    } catch (error: any) {
      console.error(`Erro ao gerar relatório ${period}:`, error);
      
      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';
      const fallbackText = getClientFallbackReport(period, logData, formattedName);
      const fallbackReport = { 
        text: fallbackText,
        logs: { ...logs },
        meta: { solarOffset, lunarData: serializeLunarData(lunarData) }
      };
      
      setReports(prev => {
        const updated = { 
          ...prev, 
          [period]: fallbackReport
        };

        if (currentUser) {
          if (currentUser.uid === 'guest_user') {
            localStorage.setItem(`hekat_guest_report_${period}`, JSON.stringify(fallbackReport));
          } else if (db) {
            const reportDocRef = doc(db, 'users', currentUser.uid, 'reports', period);
            setDoc(reportDocRef, {
              text: fallbackText,
              logs: { ...logs },
              meta: { solarOffset, lunarData: serializeLunarData(lunarData) },
              updatedAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reports/${period}`));
          }
        }

        return updated;
      });
    } finally {
      setIsReportLoading(null);
    }
  };

  const updateAllReports = async () => {
    if (isUpdatingAllReports || isReportLoading) return;
    setIsUpdatingAllReports(true);
    try {
      for (const p of ['weekly', 'monthly', 'quarterly', 'correlation'] as const) {
        await generateReport(p);
      }
    } catch (e) {
      console.error("Erro ao sincronizar todos os relatórios:", e);
    } finally {
      setIsUpdatingAllReports(false);
    }
  };
  const isNight = true;

  const [selectedDay, setSelectedDay] = useState(lunarData.day);

  // Sincronizar o dia selecionado com o dia real do ciclo quando este atualizar
  useEffect(() => {
    if (lunarData.day) {
      setSelectedDay(lunarData.day);
    }
  }, [lunarData.day]);

  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(1);
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [syncTab, setSyncTab] = useState<'transfer' | 'cloud'>('transfer');
  const [importInputText, setImportInputText] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [hasCopied, setHasCopied] = useState(false);
  
  const oracleCache = useRef<Record<string, string>>({});
  const [oracleText, setOracleText] = useState<string>("Invocando a sabedoria dos astros...");
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleTrigger, setOracleTrigger] = useState(0);

  const triggerOracleRefresh = () => {
    const sunIdx = lunarData.sunSignIndex;
    const moonIdx = selectedDay === lunarData.day 
      ? Math.floor(lunarData.moonSignFloat) % 12 
      : lunarData.getSignForDay(selectedDay);
    
    const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    const formattedName = rawName ? rawName.trim() : '';
    const cacheKey = `sun_${sunIdx}_moon_${moonIdx}_day_${selectedDay}_name_${formattedName}`;
    
    delete oracleCache.current[cacheKey];
    setOracleText("Invocando a sabedoria dos astros...");
    setIsOracleLoading(true);
    setOracleTrigger(prev => prev + 1);
  };

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (currentUser && !isAuthLoading && userData) {
      if (!userData.name) {
        setShowNameModal(true);
      }
    }
  }, [currentUser, isAuthLoading, userData]);

  const handleSaveName = async () => {
    if (!nameInput.trim() || !currentUser) return;
    setIsSavingName(true);
    try {
      if (currentUser.uid === 'guest_user') {
        localStorage.setItem('hekat_guest_name', nameInput.trim());
        setUserData(prev => prev ? { ...prev, name: nameInput.trim() } : { name: nameInput.trim(), isPremium: true, hasSeenGuide: true });
        setShowNameModal(false);
        return;
      }
      if (!db) {
        console.error("Firestore is not initialized.");
        return;
      }
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Se por algum motivo o perfil não estiver inicializado ou sem uid, cria-se o perfil completo para satisfazer o allow create
      if (!userData || !userData.uid) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          name: nameInput.trim(),
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      } else {
        await setDoc(userRef, { name: nameInput.trim() }, { merge: true });
      }
      
      setShowNameModal(false);
    } catch (err) {
      console.error("Erro ao salvar identificação:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsSavingName(false);
    }
  };

  // Feedback Logic
  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Sistema de Lembretes Diários
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    try {
      const saved = localStorage.getItem('hekat_reminder_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enabled ?? true,
          time: parsed.time || '20:00',
          sound: parsed.sound ?? true,
          lastNotifiedDate: parsed.lastNotifiedDate || null
        };
      }
    } catch (e) {
      console.warn("Erro ao carregar lembretes locais:", e);
    }
    return {
      enabled: true,
      time: '20:00',
      sound: true,
      lastNotifiedDate: null
    };
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showInAppReminder, setShowInAppReminder] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  // Sincronizar configurações salvas no perfil da usuária
  useEffect(() => {
    if (userData && (userData as any).reminderSettings) {
      const cloudSettings = (userData as any).reminderSettings as ReminderSettings;
      setReminderSettings(prev => {
        const merged = { ...prev, ...cloudSettings };
        try {
          localStorage.setItem('hekat_reminder_settings', JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
    }
  }, [userData]);

  const updateReminderSettings = (newSettings: Partial<ReminderSettings>) => {
    setReminderSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('hekat_reminder_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn("Erro ao salvar localStorage:", e);
      }
      if (currentUser && currentUser.uid !== 'guest_user' && db) {
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, { reminderSettings: updated }, { merge: true }).catch(err => {
          console.warn("Erro ao sincronizar lembretes no Firestore:", err);
        });
      }
      return updated;
    });
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    } catch (e) {
      console.error("Erro ao solicitar permissão de notificações:", e);
      return Notification.permission;
    }
  };

  // Verificação de registro de hoje
  const hasLoggedToday = useMemo(() => {
    const curCycle = lunarData.cycleId;
    const curDay = lunarData.day;
    return allLogs.some(l => {
      const isCycleDayMatch = Number(l.cycleId) === Number(curCycle) && Number(l.lunarDay) === Number(curDay);
      if (isCycleDayMatch) return true;
      if (l.date && (l.date === todayCalendarDate || l.date.startsWith(todayCalendarDate))) return true;
      return false;
    });
  }, [allLogs, lunarData.cycleId, lunarData.day, todayCalendarDate]);

  const isTodayLogged = useMemo(() => {
    return Boolean(hasLoggedToday || (lunarData.cycleId && logs[lunarData.day]));
  }, [hasLoggedToday, logs, lunarData.day, lunarData.cycleId]);

  const todayLogEntry = useMemo(() => {
    const curCycle = lunarData.cycleId;
    const curDay = lunarData.day;
    return allLogs.find(l => {
      if (Number(l.cycleId) === Number(curCycle) && Number(l.lunarDay) === Number(curDay)) return true;
      if (l.date && (l.date === todayCalendarDate || l.date.startsWith(todayCalendarDate))) return true;
      return false;
    }) || (lunarData.day ? logs[lunarData.day] : null);
  }, [allLogs, lunarData.cycleId, lunarData.day, logs, todayCalendarDate]);

  const handleOpenJournalForToday = () => {
    setSelectedDay(lunarData.day);
    if (lunarData.cycleId) {
      setViewingCycleId(lunarData.cycleId);
    }
    setShowInAppReminder(false);
    toggleWindow('journal', 'open');
  };

  const handleSnooze = () => {
    setSnoozeUntil(Date.now() + 30 * 60 * 1000); // 30 minutos de soneca
    setShowInAppReminder(false);
  };

  const handleDismissToday = () => {
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    updateReminderSettings({ lastNotifiedDate: todayKey });
    setShowInAppReminder(false);
  };

  const triggerTestReminder = () => {
    if (reminderSettings.sound) {
      playCelestialChime();
    }
    setShowInAppReminder(true);
    sendSystemNotification(
      "Hekat Astromemórias 🌙 (Teste de Lembrete)",
      `Lembrete diário ativo! Este aviso tocará pontualmente às ${reminderSettings.time} quando você ainda não tiver registrado o sentir do Dia Lunar ${lunarData.day}.`,
      () => {
        handleOpenJournalForToday();
      }
    );
  };

  // Monitor contínuo a cada minuto para disparo do lembrete diário no mesmo horário
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    // Se a usuária já fez o registro hoje, recolhe o aviso e não notifica
    if (isTodayLogged) {
      if (showInAppReminder) setShowInAppReminder(false);
      return;
    }

    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Já disparou hoje?
    if (reminderSettings.lastNotifiedDate === todayKey) return;

    // Em modo soneca?
    if (snoozeUntil && Date.now() < snoozeUntil) return;

    // Se atingiu ou passou do horário programado
    if (currentTimeStr >= reminderSettings.time) {
      setShowInAppReminder(true);
      if (reminderSettings.sound) {
        playCelestialChime();
      }
      sendSystemNotification(
        "Hekat Astromemórias 🌙",
        `Hora do seu registro diário: você ainda não anotou suas astromemórias do Dia Lunar ${lunarData.day}. Reserve um instante para escutar seu sentir.`,
        () => {
          handleOpenJournalForToday();
        }
      );
      updateReminderSettings({ lastNotifiedDate: todayKey });
    }
  }, [now, reminderSettings, isTodayLogged, snoozeUntil, lunarData.day]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      console.log("Portal Hekat: Iniciando ritual de acesso...");
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Erro no login:", err);
      setIsLoggingIn(false);
      if (err.code === 'auth/popup-blocked') {
        setLoginError("O portal foi bloqueado pelo seu navegador. Por favor, permita popups ou abra este portal em uma nova aba para maior clareza.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setLoginError("O ritual de acesso foi interrompido.");
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.toLowerCase().includes('unauthorized-domain'))) {
        setLoginError("Este domínio ('" + window.location.hostname + "') não está autorizado no console do Firebase. Adicione este domínio no console do Firebase ou acesse como Visitante abaixo.");
      } else {
        setLoginError("Não foi possível abrir o portal. Erro: " + (err.message || "Conexão instável"));
      }
    }
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim() || !currentUser) return;
    if (!db) {
      console.error("Firestore is not initialized.");
      return;
    }
    setIsSendingFeedback(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'feedback'), {
        userId: currentUser.uid,
        message: feedback,
        createdAt: serverTimestamp()
      });
      setFeedback("");
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const safetyTimer = setTimeout(() => {
      if (isAuthLoading) {
        console.warn("Hekat: Auth timeout reached, forcing load state.");
        setIsAuthLoading(false);
      }
    }, 8000); // A bit more time for slow connections

    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      clearTimeout(safetyTimer);
      setCurrentUser(user);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (user) {
        if (user.uid === 'guest_user') {
          const localName = localStorage.getItem('hekat_guest_name') || '';
          setUserData({
            name: localName || '',
            isPremium: true,
            hasSeenGuide: true
          });
          setIsLoggingIn(false);
          setIsAuthLoading(false);
          return;
        }
        if (!db) {
          console.warn("Hekat: Firestore is not initialized.");
          setUserData({ isPremium: false });
          setIsLoggingIn(false);
          setIsAuthLoading(false);
          return;
        }
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          const data = docSnap.exists() ? (docSnap.data() as any) : null;
          setUserData(data || { isPremium: false });
          setIsLoggingIn(false);
          setIsAuthLoading(false);
        }, (error) => {
          // Fallback if snapshots fail
          setUserData({ isPremium: false });
          setIsLoggingIn(false);
          setIsAuthLoading(false);
          if (auth?.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        });
      } else {
        setUserData(null);
        setIsAuthLoading(false);
        setIsLoggingIn(false);
      }
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Ensure a window is open when entering app mode
  useEffect(() => {
    if (currentUser && !isAuthLoading) {
      const anyOpen = windows.some(w => w.isOpen && !w.isMinimized);
      if (!anyOpen) {
        toggleWindow('mandala', 'open');
      }
    }
  }, [currentUser, isAuthLoading]);

  const handleCheckout = async () => {
    if (!currentUser) return;
    setIsProcessingPayment(true);
    try {
      const response = await fetch(getApiUrl("/api/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.uid, planId: "HEKAT_FULL_PASS" }),
      });
      const data = await response.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else throw new Error("Falha ao gerar link de pagamento");
    } catch (error) {
      console.error("Erro no checkout:", error);
      setLoginError("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (!currentUser || isAuthLoading || !userData) return;
    const isMobile = window.innerWidth < 768;
    const hasStartedOnce = sessionStorage.getItem(`hekat_started_${currentUser.uid}`);
    if (!hasStartedOnce) {
      sessionStorage.setItem(`hekat_started_${currentUser.uid}`, 'true');
      const isFirstEver = !userData.hasSeenGuide;

      // No celular, não abrimos outras janelas automaticamente, mantendo só a mandala lunar
      if (isMobile) {
        if (isFirstEver && db) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, { hasSeenGuide: true, uid: currentUser.uid, email: currentUser.email, updatedAt: serverTimestamp() }, { merge: true }).catch(e => console.error("Erro ao persistir guia:", e));
        }
        return;
      }

      const timer = setTimeout(() => {
        if (isFirstEver) {
          toggleWindow('guide', 'open');
          if (db) {
            const userRef = doc(db, 'users', currentUser.uid);
            setDoc(userRef, { hasSeenGuide: true, uid: currentUser.uid, email: currentUser.email, updatedAt: serverTimestamp() }, { merge: true }).catch(e => console.error("Erro ao persistir guia:", e));
          }
        } else {
          toggleWindow('mandala', 'open');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isAuthLoading, userData]);

  // Sync Logs with Firebase
  useEffect(() => {
    if (!currentUser) { setAllLogs([]); return; }
    if (currentUser.uid === 'guest_user') {
      const localLogs = localStorage.getItem('hekat_guest_logs');
      if (localLogs) {
        try {
          setAllLogs(JSON.parse(localLogs));
        } catch (e) {
          console.error("Erro ao carregar logs locais do visitante:", e);
        }
      } else {
        setAllLogs([]);
      }
      return;
    }
    if (!db) {
      console.warn("Hekat: Firestore is not initialized. Operating in local-only mode.");
      return;
    }

    // Se o usuário possuía registros locais de visitante neste navegador, sincronizar com a nuvem
    const guestLogsStr = localStorage.getItem('hekat_guest_logs');
    if (guestLogsStr) {
      try {
        const guestLogs = JSON.parse(guestLogsStr);
        if (Array.isArray(guestLogs) && guestLogs.length > 0) {
          console.log(`Hekat: Migrando ${guestLogs.length} memórias locais do visitante para a nuvem de ${currentUser.uid}...`);
          guestLogs.forEach(async (log: any) => {
            if (log.lunarDay && log.emotionId) {
              const cId = Number(log.cycleId) || 1;
              const logId = `cycle_${cId}_day_${log.lunarDay}`;
              const docRef = doc(db, 'users', currentUser.uid, 'logs', logId);
              await setDoc(docRef, {
                emotionId: log.emotionId,
                intensity: Number(log.intensity) || 3,
                note: log.note || "",
                cycleId: cId,
                lunarDay: Number(log.lunarDay),
                userId: currentUser.uid,
                date: serverTimestamp()
              }, { merge: true }).catch(err => console.warn("Hekat auto-migration warning:", err));
            }
          });
        }
      } catch (e) {
        console.error("Erro ao migrar memórias locais:", e);
      }
    }

    const logsRef = collection(db, 'users', currentUser.uid, 'logs');
    const q = query(logsRef, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray: LogEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const cycleIdNum = typeof data.cycleId === 'number' ? data.cycleId : Number(data.cycleId || 0);
        const logDate = data.date?.toDate?.() || new Date();
        const rawEmotionId = data.emotionId;
        const normalizedEmotionId = rawEmotionId === 'clarity' ? 'clareza' : rawEmotionId === 'challenge' ? 'desafio' : rawEmotionId;
        
        // Extract cycleId directly from the doc.id prefix if it conforms to cycle_X_day_Y format
        let cycleIdVal = isNaN(cycleIdNum) ? 0 : cycleIdNum;
        if (doc.id.startsWith("cycle_")) {
          const parts = doc.id.split("_");
          const extractedCycle = Number(parts[1]);
          if (!isNaN(extractedCycle)) {
            cycleIdVal = extractedCycle;
          }
        }

        logsArray.push({
          id: doc.id,
          emotionId: normalizedEmotionId,
          intensity: Number(data.intensity) || 3,
          note: data.note || "",
          cycleId: cycleIdVal,
          lunarDay: Number(data.lunarDay),
          timestamp: data.date,
          date: logDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
        });
      });
      setAllLogs(logsArray);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/logs`);
    });
    return () => unsubscribe();
  }, [currentUser, lunarData.cycleId]);

  // Sync Reports with Firebase
  useEffect(() => {
    if (!currentUser) { 
      setReports({ 
        weekly: { text: null, logs: null, meta: null }, 
        monthly: { text: null, logs: null, meta: null }, 
        quarterly: { text: null, logs: null, meta: null },
        correlation: { text: null, logs: null, meta: null }
      }); 
      return; 
    }
    if (currentUser.uid === 'guest_user') {
      const updatedReports: any = {
        weekly: { text: null, logs: null, meta: null }, 
        monthly: { text: null, logs: null, meta: null }, 
        quarterly: { text: null, logs: null, meta: null },
        correlation: { text: null, logs: null, meta: null }
      };
      const periods = ['weekly', 'monthly', 'quarterly', 'correlation'];
      periods.forEach(p => {
        const saved = localStorage.getItem(`hekat_guest_report_${p}`);
        if (saved) {
          try {
            updatedReports[p] = JSON.parse(saved);
          } catch (e) {
            console.error(`Erro ao analisar relatório local ${p}:`, e);
          }
        }
      });
      setReports(updatedReports);
      return;
    }
    if (!db) {
      console.warn("Hekat: Firestore is not initialized for reports.");
      return;
    }
    const reportsRef = collection(db, 'users', currentUser.uid, 'reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const updatedReports: any = {
        weekly: { text: null, logs: null, meta: null }, 
        monthly: { text: null, logs: null, meta: null }, 
        quarterly: { text: null, logs: null, meta: null },
        correlation: { text: null, logs: null, meta: null }
      };
      snapshot.forEach((doc) => {
        const data = doc.data();
        const periodId = doc.id as 'weekly' | 'monthly' | 'quarterly' | 'correlation';
        if (updatedReports[periodId]) {
          updatedReports[periodId] = {
            text: data.text || null,
            logs: data.logs || null,
            meta: data.meta || null
          };
        }
      });
      setReports(updatedReports);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/reports`);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Oracle Fetch Logic with Ref Caching and Robust Error Detection
  useEffect(() => {
    let isMounted = true;
    const fetchOracle = async () => {
      const sunIdx = lunarData.sunSignIndex;
      const moonIdx = selectedDay === lunarData.day 
        ? Math.floor(lunarData.moonSignFloat) % 12 
        : lunarData.getSignForDay(selectedDay);

      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';
      const cacheKey = `sun_${sunIdx}_moon_${moonIdx}_day_${selectedDay}_name_${formattedName}`;

      if (oracleCache.current[cacheKey]) {
        setOracleText(oracleCache.current[cacheKey]);
        return;
      }

      setIsOracleLoading(true);
      const sun = getZodiacSignSafely(sunIdx);
      const moon = getZodiacSignSafely(moonIdx);
      const phrase = (moonIdx >= 0 && moonIdx < PHILOSOPHICAL_QUOTES.length) ? PHILOSOPHICAL_QUOTES[moonIdx] : PHILOSOPHICAL_QUOTES[0];

      // Calculate aspect locally to ensure we have the correct aspect mapping to pass to the API
      const diff = Math.abs(sunIdx - moonIdx);
      const dist = diff > 6 ? 12 - diff : diff;
      let aspect = { name: 'Conjunção', desc: 'impulso, autenticidade, fusão em síntese das simbologias dos signos envolvidos.' };
      if (dist === 1 || dist === 2) aspect = { name: 'Sextil', desc: 'abertura para aprender e aplicar com simplicidade o que já foi assimilado com sabedoria prática.' };
      else if (dist === 3) aspect = { name: 'Quadratura', desc: 'tensão emocional, conflitos, espera, paciência, emoção turva a razão.' };
      else if (dist === 4) aspect = { name: 'Trígono', desc: 'soluções, harmonia, fluidez, clareza, criatividade.' };
      else if (dist === 5 || dist === 6) aspect = { name: 'Oposição', desc: 'dúvida, equilíbrio das polaridades, complementariedade.' };

      try {
        console.log("Invocando Oráculo Gemini...");

        const response = await fetch(getApiUrl("/api/oracle"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sunSignName: sun.name,
            moonSignName: moon.name,
            philosophicalPhrase: phrase,
            userName: formattedName,
            aspectName: aspect.name,
            aspectDesc: aspect.desc,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Alinhamento celestial indisponível.");
        }

        const data = await response.json();
        if (!isMounted) return;
        const text = data.text;
        oracleCache.current[cacheKey] = text;
        setOracleText(text);
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Erro no Oráculo:", error);
        // Fallback para oráculo local garantindo que o usuário tenha orientação sob qualquer condição de rede móvel
        const fallback = getClientFallbackOracle(sun.name, moon.name, phrase, formattedName, aspect.desc);
        oracleCache.current[cacheKey] = fallback;
        setOracleText(fallback);
      } finally {
        if (isMounted) setIsOracleLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchOracle, 500); // Evita chamadas excessivas ao navegar rápido
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [selectedDay, lunarData.sunSignIndex, Math.floor(lunarData.moonSignFloat) % 12, oracleTrigger, userData?.name, currentUser?.displayName]);

  const [topZ, setTopZ] = useState(100);

  // Constants for geometry
  const angleStep = (2 * Math.PI) / 29;
  const zodAngleStep = (2 * Math.PI) / 12;
  const solarOffset = (lunarData.sunSignFloat) * zodAngleStep;

  // Window System State
  const [windows, setWindows] = useState<WindowData[]>([
    { id: 'mandala', title: 'Mandala Lunar', icon: 'CalendarDays', isOpen: true, isMinimized: false, zIndex: 105, pos: { x: 0, y: 0 } },
    { id: 'journal', title: 'Astromemorias', icon: 'MessageCircle', isOpen: false, isMinimized: false, zIndex: 104, pos: { x: 0, y: 0 } },
    { id: 'oraculo', title: 'Oráculo Diário', icon: 'Sparkles', isOpen: false, isMinimized: false, zIndex: 103, pos: { x: 0, y: 0 } },
    { id: 'calendar', title: 'Calendário do Ciclo', icon: 'CalendarHeart', isOpen: false, isMinimized: false, zIndex: 100, pos: { x: 0, y: 0 } },
    { id: 'reports', title: 'Relatórios', icon: 'FileBarChart', isOpen: false, isMinimized: false, zIndex: 101, pos: { x: 0, y: 0 } },
    { id: 'history', title: 'Histórico', icon: 'History', isOpen: false, isMinimized: false, zIndex: 102, pos: { x: 0, y: 0 } },
    { id: 'reminders', title: 'Lembretes Diários', icon: 'Bell', isOpen: false, isMinimized: false, zIndex: 101, pos: { x: 0, y: 0 } },
    { id: 'guide', title: 'Informativo App', icon: 'Info', isOpen: false, isMinimized: false, zIndex: 106, pos: { x: 0, y: 0 } },
    { id: 'backup', title: 'Resgate & Backup', icon: 'ArrowDownUp', isOpen: false, isMinimized: false, zIndex: 102, pos: { x: 0, y: 0 } },
  ]);

  // Helper to center a window in the viewport
  const getWindowCenter = (_id: string) => {
    return { x: 0, y: 0 };
  };

  // Keep windows centered on screen resize or orientation change
  useEffect(() => {
    const handleResize = () => {
      setWindows(prev => prev.map(w => ({
        ...w,
        pos: { x: 0, y: 0 }
      })));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const chartData = useMemo(() => {
    return Array.from({ length: 29 }, (_, i) => {
      const day = i + 1;
      const log = logs[day];
      return {
        name: `Dia ${day}`,
        intensity: log ? log.intensity : 0,
        emotion: log ? EMOTIONS.find(e => e.id === log.emotionId)?.name : 'Nenhum',
        color: log ? EMOTIONS.find(e => e.id === log.emotionId)?.color : '#cbd5e1'
      };
    });
  }, [logs]);

  useEffect(() => {
    const log = logs[selectedDay];
    if (log) {
      setCurrentEmotion(log.emotionId);
      setIntensity(log.intensity);
      setNote(log.note || "");
    } else {
      setCurrentEmotion(null);
      setIntensity(1);
      setNote("");
    }
  }, [selectedDay, logs]);

  // Optimized Error Handling for Gemini
  const getFriendlyGeminiError = (error: any, type: 'oracle' | 'report') => {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isQuotaError = errorStr.includes("429") || 
                         errorStr.includes("quota") || 
                         errorStr.includes("resource_exhausted") ||
                         errorStr.includes("rate_limit");

    if (isQuotaError) {
      return type === 'oracle' 
        ? "O Oráculo atingiu o limite de sua visão mística por agora. Aguarde o realinhamento dos astros antes de solicitar nova orientação."
        : "O Analista Hekat está em retiro contemplativo (limite de quota). Aguarde um momento para que a clareza retorne.";
    }

    const message = error?.message || "Erro de conexão astral";
    // Evita exibir JSON bruto no UI
    if (message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message);
        return `A névoa impede a visão: ${parsed.error?.message || 'Oscilação no éter'}`;
      } catch {
        return "A névoa impede a visão clara: oscilação no éter.";
      }
    }
    
    return `As estrelas estão em silêncio: ${message}`;
  };

  const handleSave = async () => {
    if (!currentEmotion) return;
    
    const activeCycleId = viewingCycleId || lunarData.cycleId;
    
    // Optimistic update for instant feedback
    const newEntry: LogEntry = { 
      emotionId: currentEmotion, 
      intensity, 
      note, 
      cycleId: activeCycleId,
      lunarDay: selectedDay,
      date: todayCalendarDate 
    };
    const updatedLogs = [...allLogs.filter(l => !(l.cycleId === activeCycleId && l.lunarDay === selectedDay)), newEntry];
    setAllLogs(updatedLogs);
    
    if (currentUser) {
      if (currentUser.uid === 'guest_user') {
        localStorage.setItem('hekat_guest_logs', JSON.stringify(updatedLogs));
      } else if (!db) {
        console.warn("Hekat: Firestore is not initialized. Operating in local-only mode.");
      } else {
        // Id único baseado em ciclo e dia para permitir histórico
        const logId = `cycle_${activeCycleId}_day_${selectedDay}`;
        const logRef = doc(db, 'users', currentUser.uid, 'logs', logId);
        
        try {
          await setDoc(logRef, {
            emotionId: currentEmotion,
            intensity,
            note,
            lunarDay: selectedDay,
            cycleId: activeCycleId,
            userId: currentUser.uid,
            date: serverTimestamp()
          });
        } catch (error) {
          console.error("Erro ao salvar no Firebase:", error);
        }
      }
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      toggleWindow('journal', 'close');
      toggleWindow('mandala', 'open');
    }, 1500);

    // Atualizar análise semanal em segundo plano com o novo registro diário
    setTimeout(() => {
      generateReport('weekly').catch(e => console.warn("Atualização automática semanal:", e));
    }, 600);
  };

  const handleReset = async () => {
    if (currentUser) {
      // No Firebase, deletamos um por um ou limpamos a coleção (regras permitem delete)
      // Por enquanto, apenas fecha o modal e orienta o usuário
      setIsResetOpen(false);
    } else {
      setAllLogs([]);
      setIsResetOpen(false);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopyBackup = () => {
    const backupData = {
      version: "1.0",
      app: "Hekat Astromemorias",
      exportDate: new Date().toISOString(),
      userName: userData?.name || currentUser?.displayName || '',
      totalLogs: allLogs.length,
      logs: allLogs
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 3000);
      }).catch(() => {
        fallbackCopyTextToClipboard(jsonStr);
      });
    } else {
      fallbackCopyTextToClipboard(jsonStr);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      version: "1.0",
      app: "Hekat Astromemorias",
      exportDate: new Date().toISOString(),
      userName: userData?.name || currentUser?.displayName || '',
      totalLogs: allLogs.length,
      logs: allLogs
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hekat_astromemorias_backup_${todayCalendarDate.replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLogs = (textOrJson: string) => {
    try {
      setSyncStatus({ type: null, message: '' });
      let logsToImport: any[] = [];
      const trimmed = textOrJson.trim();
      if (!trimmed) {
        throw new Error("Por favor, cole o texto de backup ou selecione um arquivo.");
      }
      
      let parsed: any;
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        throw new Error("Formato inválido. Certifique-se de colar o código JSON completo do backup.");
      }

      if (Array.isArray(parsed)) {
        logsToImport = parsed;
      } else if (parsed && Array.isArray(parsed.logs)) {
        logsToImport = parsed.logs;
      } else {
        throw new Error("Estrutura não reconhecida. O arquivo precisa conter a lista de astromemórias.");
      }

      if (logsToImport.length === 0) {
        throw new Error("Nenhuma astromemória encontrada no backup.");
      }

      const validLogs: LogEntry[] = [];
      for (const item of logsToImport) {
        if (!item.lunarDay || !item.emotionId) continue;
        const cycleIdNum = Number(item.cycleId) || 1;
        validLogs.push({
          emotionId: item.emotionId,
          intensity: Number(item.intensity) || 3,
          note: item.note || "",
          cycleId: cycleIdNum,
          lunarDay: Number(item.lunarDay),
          date: item.date || todayCalendarDate
        });
      }

      if (validLogs.length === 0) {
        throw new Error("Nenhum registro com campos válidos (dia lunar e emoção) foi encontrado.");
      }

      // Mesclagem segura: preserva registros atuais e adiciona/atualiza com os importados
      const map = new Map<string, LogEntry>();
      allLogs.forEach(l => map.set(`c${l.cycleId}_d${l.lunarDay}`, l));
      validLogs.forEach(l => map.set(`c${l.cycleId}_d${l.lunarDay}`, l));

      const merged = Array.from(map.values());
      setAllLogs(merged);

      if (currentUser?.uid === 'guest_user') {
        localStorage.setItem('hekat_guest_logs', JSON.stringify(merged));
      } else if (currentUser && db) {
        validLogs.forEach(async (l) => {
          const logId = `cycle_${l.cycleId}_day_${l.lunarDay}`;
          const logRef = doc(db, 'users', currentUser.uid, 'logs', logId);
          await setDoc(logRef, {
            emotionId: l.emotionId,
            intensity: l.intensity,
            note: l.note,
            cycleId: l.cycleId,
            lunarDay: l.lunarDay,
            userId: currentUser.uid,
            date: serverTimestamp()
          }, { merge: true }).catch(err => console.warn("Erro ao salvar log importado no Firestore:", err));
        });
      }

      setSyncStatus({ 
        type: 'success', 
        message: `${validLogs.length} astromemória(s) resgatada(s) e mescladas com sucesso! Total atual: ${merged.length} memórias.` 
      });
      setImportInputText('');
    } catch (err: any) {
      setSyncStatus({ 
        type: 'error', 
        message: err.message || "Falha ao importar dados. Verifique o formato." 
      });
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleImportLogs(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteLog = async (dayToDelete: number) => {
    const activeCycleId = viewingCycleId || lunarData.cycleId;
    const logId = `cycle_${activeCycleId}_day_${dayToDelete}`;

    // Atualização otimista do estado local
    setAllLogs(prev => {
      const updated = prev.filter(l => !(l.cycleId === activeCycleId && l.lunarDay === dayToDelete));
      if (currentUser && currentUser.uid === 'guest_user') {
        localStorage.setItem('hekat_guest_logs', JSON.stringify(updated));
      }
      return updated;
    });

    if (currentUser) {
      if (currentUser.uid !== 'guest_user' && db) {
        const logRef = doc(db, "users", currentUser.uid, "logs", logId);
        try {
          await deleteDoc(logRef);
        } catch (error) {
          console.error("Erro ao deletar no Firebase:", error);
          handleFirestoreError(error, OperationType.DELETE, `users/${currentUser.uid}/logs/${logId}`);
        }
      }
    }
  };

  const updateWindowPos = (id: string, x: number, y: number) => {
    setWindows(prev => prev.map(win => win.id === id ? { ...win, pos: { x, y } } : win));
  };

  const toggleWindow = (id: string, action: 'open' | 'close' | 'minimize' | 'focus') => {
    const isMobileDevice = window.innerWidth < 768; // Standard tablet/mobile breakpoint
    
    setWindows(prev => {
      const currentWin = prev.find(w => w.id === id);
      if (!currentWin) return prev;
      
      const newTopZ = topZ + 1;
      setTopZ(newTopZ);

      const mapped = prev.map(win => {
        if (win.id === id) {
          let pos = win.pos;
          if ((action === 'open' || action === 'focus') && (!win.isOpen || win.isMinimized)) {
            pos = getWindowCenter(id);
          }

          if (action === 'open') return { ...win, isOpen: true, isMinimized: false, zIndex: newTopZ, pos };
          if (action === 'close') return { ...win, isOpen: false };
          if (action === 'minimize') return { ...win, isMinimized: true };
          if (action === 'focus') return { ...win, isOpen: true, isMinimized: false, zIndex: newTopZ, pos };
        } else {
          // Close other windows if we are opening or focusing one
          if (action === 'open' || action === 'focus') {
            return { ...win, isOpen: false };
          }
        }
        return win;
      });

      if (isMobileDevice && (action === 'close' || action === 'minimize')) {
        const anyOpen = mapped.some(w => w.isOpen && !w.isMinimized);
        if (!anyOpen) {
          return mapped.map(w => w.id === 'mandala' ? { ...w, isOpen: true, isMinimized: false, zIndex: newTopZ, pos: getWindowCenter('mandala') } : w);
        }
      }

      return mapped;
    });
  };

  const renderMandala = () => {
    const radius = 140; 
    const centerX = 175;
    const centerY = 175;
    const segments = [];
    
    const zodRadiusInner = 145;
    const zodRadiusOuter = 165;

    for (let i = 0; i < 12; i++) {
      const startAngle = Math.PI - (i * zodAngleStep);
      const endAngle = startAngle - zodAngleStep;
      const midAngle = startAngle - zodAngleStep / 2;
      const x1 = centerX + zodRadiusOuter * Math.cos(startAngle);
      const y1 = centerY + zodRadiusOuter * Math.sin(startAngle);
      const x2 = centerX + zodRadiusOuter * Math.cos(endAngle);
      const y2 = centerY + zodRadiusOuter * Math.sin(endAngle);
      const x3 = centerX + zodRadiusInner * Math.cos(endAngle);
      const y3 = centerY + zodRadiusInner * Math.sin(endAngle);
      const x4 = centerX + zodRadiusInner * Math.cos(startAngle);
      const y4 = centerY + zodRadiusInner * Math.sin(startAngle);
      const pathStr = `M ${x1} ${y1} A ${zodRadiusOuter} ${zodRadiusOuter} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${zodRadiusInner} ${zodRadiusInner} 0 0 1 ${x4} ${y4} Z`;
      const isMoon = i === Math.floor(lunarData.moonSignFloat) % 12;
      const isSun = i === lunarData.sunSignIndex;
      const isSel = i === selectedMoonSignIndex;
      const high = isSel || isMoon || isSun;

      segments.push(
        <g key={`zod-${i}`}>
          <path d={pathStr} fill={high ? "#FDF4FF" : "none"} stroke="#E2E8F0" strokeWidth="0.5" />
          <text 
            x={centerX + (zodRadiusInner + 10) * Math.cos(midAngle)} 
            y={centerY + (zodRadiusInner + 10) * Math.sin(midAngle)} 
            textAnchor="middle" 
            alignmentBaseline="middle" 
            className={`text-[11px] select-none ${high ? 'fill-indigo-600 font-bold' : 'fill-slate-400 opacity-40'}`}
          >
            {ZODIAC_SIGNS[i].symbol}
          </text>
          {isSun && (
            <g transform={`translate(${centerX + (zodRadiusOuter + 18) * Math.cos(Math.PI - (lunarData.sunSignFloat * zodAngleStep))}, ${centerY + (zodRadiusOuter + 18) * Math.sin(Math.PI - (lunarData.sunSignFloat * zodAngleStep))})`}>
               <circle r="8" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1" className="animate-pulse" />
               {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                 <line 
                   key={deg}
                   x1="0" y1="0" 
                   x2={13 * Math.cos(deg * Math.PI / 180)} 
                   y2={13 * Math.sin(deg * Math.PI / 180)} 
                   stroke="#F59E0B" 
                   strokeWidth="1.5"
                   strokeLinecap="round"
                 />
               ))}
               <circle r="5" fill="#FBBF24" />
            </g>
          )}
          {isMoon && (
            <g transform={`translate(${centerX + (zodRadiusOuter + 18) * Math.cos(Math.PI - (lunarData.moonSignFloat * zodAngleStep))}, ${centerY + (zodRadiusOuter + 18) * Math.sin(Math.PI - (lunarData.moonSignFloat * zodAngleStep))})`}>
               <g transform="translate(-8, -8)">
                 <Moon 
                   size={16} 
                   className={isNight ? "text-indigo-100" : "text-indigo-600"} 
                   style={{ filter: 'drop-shadow(0 0 8px rgba(165, 180, 252, 0.5))' }}
                 />
               </g>
               <circle r="10" fill="transparent" stroke={isNight ? "#818CF8" : "#7C3AED"} strokeWidth="0.5" strokeDasharray="1 2" className="opacity-20" />
            </g>
          )}
        </g>
      );
    }

    for (let i = 0; i < 29; i++) {
      const dayNum = i + 1;
      const startAngle = Math.PI - (i * angleStep) - solarOffset;
      const endAngle = Math.PI - ((i + 1) * angleStep) - solarOffset;
      for (let ring = 1; ring <= 5; ring++) {
        const iR = Math.max(0.1, (ring - 1) * (radius / 5)); // Avoid 0 radius arcs
        const oR = ring * (radius / 5);
        const x1 = centerX + oR * Math.cos(startAngle);
        const y1 = centerY + oR * Math.sin(startAngle);
        const x2 = centerX + oR * Math.cos(endAngle);
        const y2 = centerY + oR * Math.sin(endAngle);
        const x3 = centerX + iR * Math.cos(endAngle);
        const y3 = centerY + iR * Math.sin(endAngle);
        const x4 = centerX + iR * Math.cos(startAngle);
        const y4 = centerY + iR * Math.sin(startAngle);
        const dStr = `M ${x1} ${y1} A ${oR} ${oR} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${iR} ${iR} 0 0 1 ${x4} ${y4} Z`;
        
        const log = logs[dayNum];
        const emotion = log && EMOTIONS.find(e => e.id === log.emotionId);
        const emotionName = emotion ? emotion.name : '';
        const isToday = lunarData.day === dayNum;
        const isSelected = selectedDay === dayNum;
        
        // Intensity logic: higher intensity fills more rings
        // intensity 1: fills ring 5 (outer)
        // intensity 5: fills all rings 1-5
        const isFilled = log && ring >= (6 - log.intensity);
        const isTarget = (isToday || isSelected) && !logs[dayNum];
        
        let fillColor = isSelected ? '#F1F5F9' : (isToday ? '#FDF4FF' : '#FFFFFF');
        if (isFilled && log.emotionId) {
          fillColor = `url(#grad-${log.emotionId})`;
        }

        segments.push(
          <path 
            key={`d-${dayNum}-r-${ring}`} 
            d={dStr} 
            fill={fillColor} 
            stroke={isSelected ? '#4F46E5' : (isToday ? '#D946EF' : '#E2E8F0')} 
            strokeWidth={isSelected ? '2' : '0.5'} 
            className={`cursor-pointer transition-all duration-300 ${isTarget ? 'animate-pulse' : ''}`} 
            style={{ 
              fillOpacity: isFilled ? 0.9 : 1,
              strokeOpacity: isSelected || isToday ? 1 : 0.4,
              pointerEvents: 'auto',
              filter: isTarget ? 'drop-shadow(0 0 8px rgba(79, 70, 229, 0.4))' : 'none'
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedDay(dayNum);
            }} 
          >
            {emotionName && (
              <title>{`Dia ${dayNum}: ${emotionName}`}</title>
            )}
            {!emotionName && (
              <title>{`Dia ${dayNum}: Sem registro`}</title>
            )}
          </path>
        );
      }

      // Add an even more prominent pulsing indicator for the target day
      if ((lunarData.day === dayNum || selectedDay === dayNum) && !logs[dayNum]) {
        const midAngle = Math.PI - (dayNum - 0.5) * angleStep - solarOffset;
        const pulseRadius = radius * 0.92;
        const px = centerX + pulseRadius * Math.cos(midAngle);
        const py = centerY + pulseRadius * Math.sin(midAngle);
        
        segments.push(
          <g key={`pulse-indicator-${dayNum}`} pointerEvents="none">
            <circle 
              cx={px} cy={py} r="20" 
              fill="rgba(79, 70, 229, 0.2)" 
              className="animate-ping" 
              style={{ animationDuration: '2s' }}
            />
            <circle 
              cx={px} cy={py} r="8" 
              fill="rgba(79, 70, 229, 0.4)" 
              className="animate-pulse" 
              style={{ animationDuration: '1.5s' }}
            />
            <circle 
              cx={px} cy={py} r="4" 
              fill="#4F46E5" 
              className="shadow-lg" 
            />
          </g>
        );
      }
    }
    return segments;
  };

  const sunSign = getZodiacSignSafely(lunarData.sunSignIndex);
  const sunDegree = Math.floor((lunarData.sunSignFloat % 1) * 30);
  
  const moonSignIndex = Math.floor(lunarData.moonSignFloat);
  const todaySign = getZodiacSignSafely(moonSignIndex);
  const moonDegree = Math.floor((lunarData.moonSignFloat % 1) * 30);

  const selectedMoonSignIndex = selectedDay === lunarData.day
    ? Math.floor(lunarData.moonSignFloat) % 12
    : lunarData.getSignForDay(selectedDay);

  const phase = LUNAR_PHASES.slice().reverse().find(p => selectedDay >= p.startDay) || LUNAR_PHASES[0];
  const todayPhase = LUNAR_PHASES.slice().reverse().find(p => lunarData.day >= p.startDay) || LUNAR_PHASES[0];

  const oracleData = useMemo(() => {
    const sunIdx = lunarData.sunSignIndex;
    const moonIdx = selectedMoonSignIndex;
    const sun = getZodiacSignSafely(sunIdx);
    const moon = getZodiacSignSafely(moonIdx);
    
    const moonSignFloat = selectedDay === lunarData.day
      ? lunarData.moonSignFloat
      : lunarData.getMoonSignFloatForDay(selectedDay);
    const moonDegreeForDay = Math.floor((moonSignFloat % 1) * 30);
    
    // Aspect calculation
    const diff = Math.abs(sunIdx - moonIdx);
    const dist = diff > 6 ? 12 - diff : diff;
    
    let aspect = { name: 'Conjunção', type: 'potent', icon: 'Sparkles', desc: 'impulso, autenticidade, fusão em síntese das simbologias dos signos envolvidos.' };
    if (dist === 1 || dist === 2) aspect = { name: 'Sextil', type: 'fluency', icon: 'Compass', desc: 'Estar aberto para aprender e aplicar o que já foi assimilado em experiências.' };
    else if (dist === 3) aspect = { name: 'Quadratura', type: 'tension', icon: 'Zap', desc: 'tensão emocional, conflitos, espera, paciência, emoção turva a razão.' };
    else if (dist === 4) aspect = { name: 'Trígono', type: 'fluency', icon: 'Star', desc: 'soluções, harmonia, fluidez, clareza, criatividade.' };
    else if (dist === 5 || dist === 6) aspect = { name: 'Oposição', type: 'tension', icon: 'RefreshCw', desc: 'dúvida, equilíbrio das polaridades, complementariedade.' };

    return { sun, moon, moonDegreeForDay, aspect };
  }, [selectedDay, lunarData.sunSignIndex]);

  const currentMoonDegree1to30 = oracleData.moonDegreeForDay + 1;
  const currentMoonModalityName = currentMoonDegree1to30 <= 10 
    ? "Ação" 
    : currentMoonDegree1to30 <= 20 
      ? "Maturação" 
      : "Conclusão";

  return (
    <>
      <AnimatePresence>
        {mountError ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-screen flex items-center justify-center bg-rose-50 p-6 text-center z-[9999]"
          >
           <div className="max-w-sm">
             <h2 className="text-rose-500 font-black uppercase tracking-widest mb-4">Erro de Inicialização</h2>
             <p className="text-slate-600 text-sm mb-6">{mountError}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Recarregar</button>
           </div>
        </motion.div>
      ) : (isAuthLoading || !currentUser || isLoggingIn) ? (
        <motion.div 
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`h-screen w-screen flex flex-col items-center justify-center ${isNight ? 'night-bg text-white' : 'day-bg text-slate-900'} overflow-hidden p-4 sm:p-6 text-center z-[5000]`}
        >
          {isNight && <StarField />}
           <div className="w-full max-w-sm flex flex-col items-center relative z-10">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="w-full flex flex-col items-center"
             >
              {/* Central Logo Container */}
              <div className="relative mb-8 sm:mb-12">
                <motion.div 
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(65,105,225,0.2)", "0 0 50px rgba(65,105,225,0.4)", "0 0 20px rgba(65,105,225,0.2)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-44 h-44 sm:w-56 sm:h-56 bg-white rounded-full flex items-center justify-center overflow-hidden relative border-4 border-[#BF8A10]/20 p-0"
                >
                    <img 
                      src="https://ciadoceu.com.br/wp-content/uploads/2026/05/logo_hekat.png.png" 
                      alt="Hekat Logo" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => { e.currentTarget.src = '/icon.svg'; e.currentTarget.onerror = null; }}
                    />
                </motion.div>
                
                {/* Decorative Elements */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-dashed border-[#BF8A10]/20 rounded-full pointer-events-none"
                />
              </div>

              {/* Textual Branding */}
              <div className="space-y-2 mb-8 sm:mb-12">
                <h1 className="text-5xl sm:text-6xl font-black text-[#BF8A10] tracking-tighter">Hekat</h1>
                <h2 className="text-sm sm:text-base font-bold text-[#BF8A10] uppercase tracking-[0.4em]">ASTROMEMORIAS</h2>
                <div className="w-12 h-0.5 bg-[#BF8A10]/30 mx-auto mt-4" />
              </div>
              
              <div className="max-w-md w-full mb-8 sm:mb-10 text-center px-1">
                <div className={`${isNight ? 'text-indigo-200/80' : 'text-[#888888]'} text-[10.5px] min-[360px]:text-[11.5px] min-[390px]:text-[12.5px] sm:text-sm leading-relaxed font-medium text-center space-y-1 tracking-tight sm:tracking-normal whitespace-nowrap`}>
                  <p>Anote suas emoções e acompanhe os ciclo lunares.</p>
                  <p>Reconheça seu padrão emocional cíclico mensal.</p>
                  <p>Descubra como se equilibrar, dias críticos e dias positivos.</p>
                </div>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={() => {
                    const guestUser = {
                      uid: 'guest_user',
                      displayName: '',
                      email: 'guest@hekat.com'
                    };
                    setCurrentUser(guestUser as any);
                    const localName = localStorage.getItem('hekat_guest_name') || '';
                    setUserData({
                      name: localName || '',
                      isPremium: true,
                      hasSeenGuide: true
                    });
                  }}
                  className="w-full group relative flex items-center justify-center gap-3 px-8 py-5 bg-[#BF8A10] hover:bg-[#a6770d] text-[#0d0d0d] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#BF8A10]/20 transition-all active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    <LogIn size={18} />
                    <span>ACESSAR</span>
                  </span>
                </button>

                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-left"
                  >
                     <p className="text-rose-400 text-[10px] font-black uppercase tracking-wider leading-relaxed">
                       {loginError}
                     </p>
                  </motion.div>
                )}

                {isAuthLoading && !isLoggingIn && (
                  <div className="flex flex-col items-center gap-3">
                     <div className="flex gap-1.5">
                       {[0, 1, 2].map((i) => (
                         <motion.div
                           key={i}
                           animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                           transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                           className="w-1.5 h-1.5 rounded-full bg-[#BF8A10]/40"
                         />
                       ))}
                     </div>
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BF8A10]/40 italic">
                        Sincronizando Portal...
                     </span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col items-center gap-1.5">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 opacity-50">
                    <ShieldCheck size={12} /> Acesso Seguro via Google
                 </p>
              </div>
           </motion.div>
        </div>
      </motion.div>
    ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          ref={desktopRef} 
          className={`h-[100dvh] w-screen overflow-hidden relative font-sans transition-all duration-1000 ${isNight ? 'night-bg text-white' : 'day-bg text-slate-900'}`}
        >
      {isNight && <StarField />}
      
      {/* Status Bar / Integrated Dock */}
      <header className={`fixed top-0 left-0 right-0 h-14 sm:h-12 flex items-center px-1.5 sm:px-4 z-[2000] border-b transition-colors duration-1000 ${isNight ? 'glass-dark border-white/5 shadow-lg' : 'glass border-indigo-100 shadow-md'}`}>
        {/* Left: App Title and Phase */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1 shrink-0">
            <span className="text-xs text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">{todayPhase.icon}</span> 
            <span className="hidden sm:inline-block">{todayPhase.name}</span>
            <span className="text-[7px] text-amber-400/80 ml-0.5 hidden xs:inline">{Math.round(lunarData.illumination)}%</span>
          </span>
        </div>

        {/* Center: Branding or Window Switcher based on responsive layout */}
        {isMobile ? (
          <div className="flex-1 flex justify-center">
            <span className="font-serif italic text-base text-[#BF8A10] font-black uppercase tracking-[0.3em] select-none leading-none pt-0.5">
              Hekat
            </span>
          </div>
        ) : (
          /* Center: Window Switcher (Dock integrated) */
          <div className="flex-1 flex justify-center px-0.5 min-w-0">
            <div className="flex items-center gap-0 bg-white/10 p-0.5 rounded-2xl border border-white/5 max-w-full overflow-x-auto no-scrollbar pointer-events-auto mx-auto shadow-inner touch-pan-x">
               {windows.map(win => (
                <button
                  key={win.id}
                  onClick={() => {
                    toggleWindow(win.id, win.isOpen && !win.isMinimized ? 'minimize' : 'focus');
                  }}
                  className={`group relative p-2 px-2.5 sm:p-2 sm:px-3 rounded-xl transition-all hover:bg-white/10 opacity-70 hover:opacity-100 flex-shrink-0 cursor-pointer active:scale-90`}
                >
                  <LucideIcon name={win.icon} size={18} className={`${win.isOpen && !win.isMinimized ? 'text-indigo-300 opacity-100' : 'text-slate-400'}`} />
                  {win.isOpen && (
                    <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-full ${win.isMinimized ? 'bg-slate-500 opacity-40' : 'bg-indigo-300'}`} />
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2 py-1 bg-indigo-950/95 text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 hidden sm:group-hover:block transition-opacity pointer-events-none whitespace-nowrap shadow-2xl border border-white/10 z-[3000]">
                    {win.title}
                  </div>
                </button>
              ))}
              <div className="h-4 w-[1px] bg-white/10 mx-0.5 sm:mx-1.5 flex-shrink-0" />
              <button 
                onClick={() => setIsResetOpen(true)}
                className="p-2 px-2.5 sm:p-2 sm:px-3 text-indigo-300 hover:text-indigo-200 transition-all hover:bg-indigo-500/10 rounded-xl flex-shrink-0 cursor-pointer active:scale-90"
                title="Formatar Ciclo"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Right: Astro Info & Auth */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-3 px-1 sm:px-3 py-1 bg-black/10 rounded-full border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-0.5 sm:gap-1.5 group cursor-default">
                <Sun size={11} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] shrink-0" />
                <span className="text-[7.5px] sm:text-[10px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                  {sunDegree}° <span className="text-[9px] sm:text-xs leading-none">{sunSign.symbol}</span>
                </span>
             </div>
             <div className="w-[1px] h-3 bg-white/10" />
             <div className="flex items-center gap-0.5 sm:gap-1.5 group cursor-default">
                <span className="text-xs text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] leading-none shrink-0">{todayPhase.icon}</span>
                <span className="text-[7.5px] sm:text-[10px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-indigo-300 transition-colors">
                  {moonDegree}° <span className="text-[9px] sm:text-xs leading-none">{todaySign.symbol}</span>
                </span>
             </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 text-slate-100 font-bold text-[9px] sm:text-[11px]">
                  <span className="tabular-nums bg-indigo-500/10 text-indigo-200 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg border border-indigo-500/15 leading-none shadow-sm">{todayCalendarDate}</span>
                  <span className="tabular-nums bg-white/5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg border border-white/5 text-indigo-300/80 leading-none hidden xs:inline-block">{now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Botão de Lembretes Diários */}
              <button 
                onClick={() => toggleWindow('reminders', 'open')}
                className={`relative flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 group shrink-0 ${
                  reminderSettings.enabled
                    ? isTodayLogged
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300/60 border-white/5'
                }`}
                title={
                  reminderSettings.enabled
                    ? isTodayLogged
                      ? `Lembrete diário ativo (${reminderSettings.time}) • Astromemória de hoje já gravada ✨`
                      : `Lembrete diário programado para às ${reminderSettings.time} • Registro de hoje pendente 🌙`
                    : 'Configurar Lembretes Diários'
                }
              >
                <div className="relative flex items-center">
                  <Bell size={13} className={reminderSettings.enabled && !isTodayLogged ? 'animate-bounce text-amber-400' : ''} />
                  {reminderSettings.enabled && !isTodayLogged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-bold hidden sm:inline">
                  {reminderSettings.enabled ? reminderSettings.time : 'Lembretes'}
                </span>
              </button>

              {currentUser ? (
                <button 
                  onClick={logout}
                  className="flex items-center gap-1 bg-indigo-500/10 hover:bg-rose-500/20 text-indigo-300 hover:text-rose-300 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-white/5 transition-all group shrink-0"
                  title="Sair do Portal"
                >
                  <LogOut size={13} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:inline">Sair</span>
                </button>
              ) : (
                <div className="relative">
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className={`flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-50 hover:text-indigo-950 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 group ${isLoggingIn ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isLoggingIn ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                    )}
                    <span className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                      {isLoggingIn ? '...' : 'Entrar'}
                    </span>
                  </button>
                  {loginError && (
                    <motion.div 
                      key="login-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 p-3 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl shadow-2xl z-[3000] w-64 text-center border border-white/20 backdrop-blur-md"
                    >
                      <AlertCircle className="inline-block mb-1" size={14} />
                      <p className="leading-relaxed">{loginError}</p>
                      <button 
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="mt-2 text-[8px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
                      >
                        Tentar em Nova Aba
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
          </div>
        </div>
      </header>

      {/* Windows Layer */}
      <div className="absolute inset-0 z-[1000] pointer-events-none">
        <div className="relative w-full h-full p-0">
          {windows.map(win => {
            const Component = win.id === 'mandala' ? (
              <div className="flex flex-col items-center">
                {/* Frase / Tônica do Agora */}
                <div className="w-full mb-2.5 flex-shrink-0">
                   <div className="bg-indigo-900/5 p-3.5 sm:p-3 rounded-2xl border border-indigo-900/10 backdrop-blur-sm relative group transition-all hover:bg-indigo-900/[0.07] min-h-fit">
                      <Quote className="absolute top-2 left-2 text-indigo-200/40" size={12} />
                       <p id="phrase-quote" className="text-sm sm:text-[12px] text-indigo-300 leading-relaxed font-semibold text-center px-4 italic whitespace-normal break-words overflow-visible">
                         {ZODIAC_PHRASES[selectedMoonSignIndex]?.[Math.min(2, Math.max(0, Math.floor(oracleData.moonDegreeForDay / 10)))] || PHILOSOPHICAL_QUOTES[selectedMoonSignIndex] || PHILOSOPHICAL_QUOTES[0]}
                       </p>
                       <div className="mt-2 flex justify-center items-center gap-2">
                         <div className="h-[0.5px] w-3 bg-indigo-200/30" />
                         <span className="text-[9px] sm:text-[7.5px] font-black uppercase tracking-[0.35em] text-indigo-300/60 text-center">
                           {selectedDay === lunarData.day ? 'Tônica do Agora' : `Influência do Dia ${selectedDay}`}
                         </span>
                         <div className="h-[0.5px] w-3 bg-indigo-200/30" />
                       </div>
                    </div>
                </div>

                {/* Painel de Informações do Dia do Ciclo */}
                <div className="w-full mb-3">
                   <div className="flex justify-between items-center bg-indigo-950/20 p-3 rounded-2xl border border-white/5 transition-colors duration-1000 gap-4 sm:gap-6">
                      <div className="flex-1 mr-4 sm:mr-5 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5 mb-1">
                          <span className="text-[11px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-widest block leading-none">
                            {lunarData.getDateForDay(selectedDay).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          {selectedDay === lunarData.day && (viewingCycleId || lunarData.cycleId) === lunarData.cycleId ? (
                            <span className="px-1.5 py-0.5 text-[8.5px] sm:text-[7.5px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/15 uppercase leading-none shadow-sm">
                              Hoje
                            </span>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedDay(lunarData.day);
                                setViewingCycleId(lunarData.cycleId);
                              }} 
                              className="px-1.5 py-0.5 text-[8.5px] sm:text-[7.5px] font-black tracking-widest bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/20 uppercase hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95 leading-none inline-flex items-center gap-1 shadow-sm"
                              title="Voltar para o dia de hoje"
                            >
                              <RotateCcw size={8} /> Ir para Hoje
                            </button>
                          )}
                        </div>
                        <h3 className="text-[11px] sm:text-[12.5px] font-black text-[#4169E1] uppercase tracking-tighter whitespace-nowrap">{`Fase ${phase.name} • Dia ${selectedDay} do Ciclo Lunar`}</h3>
                        <p className="text-[11px] sm:text-[10px] leading-relaxed text-indigo-300/70 font-medium mt-1 italic text-left whitespace-normal break-words overflow-visible">
                           {phase.tasks}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedDay(p => Math.max(1, p-1))} className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200/25 hover:bg-indigo-500 transition-colors active:scale-95">
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => setSelectedDay(p => Math.min(29, p+1))} className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200/25 hover:bg-indigo-500 transition-colors active:scale-95">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                   </div>
                </div>

                {/* Seletor de Ciclo para Visualização e Backup */}
                <div className="flex items-center justify-between gap-2 w-full max-w-[350px] mb-3">
                  <div className="flex items-center gap-1.5 bg-indigo-950/40 p-1 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm">
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.max(1, (prev || lunarData.cycleId) - 1))}
                      className="p-1 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors active:scale-90"
                      title="Ciclo anterior"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <div className="px-2.5 text-center min-w-[85px]">
                      <span className="text-[10px] font-black text-white uppercase block tracking-wider">
                        {`Ciclo ${viewingCycleId || lunarData.cycleId}`}
                      </span>
                      {(viewingCycleId || lunarData.cycleId) === lunarData.cycleId ? (
                        <span key="ciclo-atual-indicator" className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">Ciclo Atual</span>
                      ) : (
                        <span key="memoria-gravada-indicator" className="text-[8px] font-black text-amber-400/80 uppercase tracking-tighter">Memória Gravada</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.min(lunarData.cycleId, (prev || lunarData.cycleId) + 1))}
                      disabled={(viewingCycleId || lunarData.cycleId) >= lunarData.cycleId}
                      className="p-1 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors disabled:opacity-20 active:scale-90"
                      title="Próximo ciclo"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                <svg viewBox="-25 -25 400 400" className="w-full max-w-[350px] aspect-square drop-shadow-2xl">
                  <defs>
                    {EMOTIONS.map(emo => (
                      <radialGradient key={`g-${emo.id}`} id={`grad-${emo.id}`} cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor={emo.color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={emo.color} />
                      </radialGradient>
                    ))}
                    <path id="lunar-circle-path" d="M 175, 175 m -182, 0 a 182, 182 0 1, 0 364, 0 a 182, 182 0 1, 0 -364, 0" />
                  </defs>
                  {renderMandala()}
                  <g className={`text-[8.5px] font-black uppercase tracking-[0.4em] pointer-events-none select-none ${isNight ? 'fill-indigo-300/60' : 'fill-indigo-900/60'}`}>
                    {[
                      { name: 'Lua Nova', day: 0 },
                      { name: 'Crescente', day: 7 },
                      { name: 'Lua Cheia', day: 14 },
                      { name: 'Minguante', day: 21 }
                    ].map((p, idx) => {
                      const angle = Math.PI - (p.day * angleStep) - solarOffset;
                      
                      let normalizedAngle = (angle % (2 * Math.PI));
                      if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
                      
                      let offsetPercent = ((Math.PI - normalizedAngle) / (2 * Math.PI)) * 100;
                      if (offsetPercent < 0) offsetPercent += 100;
                      if (offsetPercent > 100) offsetPercent -= 100;
                      
                      return (
                        <text key={idx}>
                          <textPath href="#lunar-circle-path" startOffset={`${offsetPercent}%`} textAnchor="middle">
                            {p.name}
                          </textPath>
                        </text>
                      );
                    })}
                  </g>
                </svg>

                {/* Conjunto de Botões de Atalho */}
                <div className="flex gap-2.5 mt-6 justify-center pointer-events-auto">
                    <button
                      onClick={() => toggleWindow('journal', 'open')}
                      className="p-4 bg-indigo-500/10 text-indigo-300 rounded-3xl shadow-lg hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      title="Registrar Diário"
                    >
                      <BookOpen size={20} />
                    </button>
                    <button
                      onClick={() => toggleWindow('oraculo', 'open')}
                      className="p-4 bg-indigo-500/10 text-indigo-300 rounded-3xl shadow-lg hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      title="Consultar Oráculo"
                    >
                      <Sparkles size={20} />
                    </button>
                    <button
                      onClick={() => toggleWindow('reports', 'open')}
                      className="p-4 bg-indigo-500/10 text-indigo-300 rounded-3xl shadow-lg hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      title="Ver Relatórios"
                    >
                      <FileBarChart size={20} />
                    </button>
                    <button
                      onClick={() => toggleWindow('history', 'open')}
                      className="p-4 bg-indigo-500/10 text-indigo-300 rounded-3xl shadow-lg hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      title="Ver Histórico"
                    >
                      <LayoutDashboard size={20} />
                    </button>
                    <button
                      onClick={() => logs[selectedDay] && handleDeleteLog(selectedDay)}
                      disabled={!logs[selectedDay]}
                      className="p-4 bg-rose-500/10 hover:bg-rose-500/20 disabled:hover:scale-100 disabled:hover:bg-rose-500/10 text-rose-300 disabled:opacity-20 rounded-3xl shadow-lg transition-all hover:scale-105 active:scale-95 font-black text-xs min-w-[52px] inline-flex items-center justify-center cursor-pointer"
                      title="Deletar registro do dia selecionado"
                    >
                      DEL
                    </button>
                </div>
              </div>
            ) : win.id === 'oraculo' ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 bg-indigo-950/10 relative overflow-hidden w-full flex items-center justify-center transition-all duration-700 ${isOracleLoading ? 'animate-pulse' : ''}`}>
                    <div className="absolute top-3 left-4 sm:top-4 sm:left-6 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-300 animate-ping" />
                      <span className="text-[6px] font-black uppercase text-[#4169E1]/60 tracking-[0.3em]">Conexão Sideral Ativa</span>
                    </div>
                    {isOracleLoading ? (
                      <div className="flex flex-col items-center gap-3">
                         <RefreshCw className="animate-spin text-indigo-300" size={20} />
                         <span className="text-[9px] font-black uppercase text-[#4169E1] tracking-widest">Invocando Sabedoria...</span>
                      </div>
                    ) : (
                      <>
                        <p id="oracle-text-container" className="text-sm sm:text-base leading-relaxed text-white font-medium text-justify whitespace-pre-line max-w-[90%] sm:max-w-[80%] pb-4 hyphens-auto">
                          {oracleText}
                        </p>
                        <button 
                          onClick={triggerOracleRefresh} 
                          className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-indigo-300 rounded-xl transition-all cursor-pointer z-[10] border border-white/5"
                          title="Reconsultar Astros"
                        >
                          <RefreshCw size={10} className={isOracleLoading ? "animate-spin" : ""} />
                          <span className="text-[8px] font-black uppercase tracking-wider">Reconsultar</span>
                        </button>
                      </>
                    )}
                    <Sparkles className="absolute top-4 right-4 text-indigo-200/40 opacity-30 sm:opacity-100" size={20} />
                    <Moon className="absolute bottom-4 left-4 text-indigo-200/40 opacity-30 sm:opacity-100" size={20} />
                  </div>
                </div>
            ) : win.id === 'history' ? (
              <div className="space-y-6">
                {/* Seletor de Ciclo Global no Histórico */}
                <div className="flex items-center justify-between bg-indigo-950/40 p-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.max(1, (prev || lunarData.cycleId) - 1))}
                      className="p-2 hover:bg-white/10 rounded-xl text-indigo-300 transition-colors active:scale-90"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="text-left min-w-[120px]">
                      <span className="text-[10px] font-black text-white uppercase block tracking-widest">
                        {`Ciclo ${viewingCycleId || lunarData.cycleId}`}
                      </span>
                      {(viewingCycleId || lunarData.cycleId) === lunarData.cycleId ? (
                        <span key="real-time-indicator" className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Dados em Tempo Real</span>
                      ) : (
                        <span key="consulted-memory-indicator" className="text-[7px] font-black text-amber-400/80 uppercase tracking-tighter">Memória Consultada</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.min(lunarData.cycleId, (prev || lunarData.cycleId) + 1))}
                      disabled={(viewingCycleId || lunarData.cycleId) >= lunarData.cycleId}
                      className="p-2 hover:bg-white/10 rounded-xl text-indigo-300 transition-colors disabled:opacity-20 active:scale-90"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pr-2 border-l border-white/5 pl-4">
                    <History size={16} className="text-indigo-400/60" />
                    <span className="text-[9px] font-black text-indigo-300/40 uppercase tracking-widest whitespace-nowrap">Registro Temporal</span>
                  </div>
                </div>

                <div className="bg-indigo-950/20 p-6 rounded-3xl border border-white/5 transition-all duration-1000">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div>
                      <h3 className="text-xs font-black uppercase text-[#4169E1] tracking-widest">Fluxo de Intensidade</h3>
                      <p className="text-[8px] text-indigo-300 font-bold uppercase">Análise visual do ciclo selecionado</p>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6366f1', fontSize: 10 }} interval={6} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6366f1', fontSize: 10 }} domain={[0, 5]} ticks={[1, 3, 5]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="intensity" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorIntensity)" animationDuration={1000} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-indigo-950/20 p-6 rounded-[2.5rem] border border-white/5 transition-all duration-1000">
                  <div className="flex items-center gap-2 mb-6">
                    <History size={16} className="text-[#4169E1]" />
                    <h3 className="text-[10px] font-black uppercase text-[#4169E1] tracking-[0.2em]">Jornada de Memória: Ciclos 1 a 6</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3, 4, 5, 6].map(cycleId => {
                      const cycleLogs: Record<number, LogEntry> = {};
                      allLogs.filter(l => l.cycleId === cycleId).forEach(l => cycleLogs[l.lunarDay] = l);
                      const hasData = Object.keys(cycleLogs).length > 0;
                      
                      const referenceDate = new Date(Date.UTC(2026, 4, 16, 0, 0, 0)); // 16 de Maio de 2026
                      const LUNAR_MONTH = 29.53059;
                      const cycleStart = new Date(referenceDate.getTime() + (cycleId - 2) * LUNAR_MONTH * 24 * 60 * 60 * 1000);
                      const sunSignFloatAtStart = getLunarData(cycleStart).sunSignFloat;
                      const cycleSolarOffset = sunSignFloatAtStart * ((2 * Math.PI) / 12);

                      return (
                        <button 
                          key={`trilogy-${cycleId}`}
                          onClick={() => setViewingCycleId(cycleId)}
                          className={`relative p-3 rounded-[2rem] border transition-all duration-700 flex flex-col items-center gap-3 overflow-hidden
                            ${viewingCycleId === cycleId 
                              ? 'bg-gradient-to-b from-indigo-500/20 to-transparent border-indigo-500 shadow-[0_20px_40px_rgba(79,70,229,0.2)] scale-105 z-10' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                            }`}
                        >
                          <div className="flex items-center justify-between w-full px-1">
                            <span className="text-[8px] font-black text-white/40 uppercase">
                              {`Ciclo ${cycleId}`}
                            </span>
                            {viewingCycleId === cycleId && <Activity size={8} className="text-emerald-400" />}
                          </div>
                          <div className="pointer-events-none transform scale-[0.6] sm:scale-[0.55] origin-top h-[60px] flex items-center justify-center">
                             <MiniMandala logs={cycleLogs} lunarData={{ day: 29 }} size={140} solarOffset={cycleSolarOffset} />
                          </div>
                          <span className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${viewingCycleId === cycleId ? 'text-indigo-200' : 'text-indigo-300/40'}`}>
                            {viewingCycleId === cycleId ? 'Ciclo Focado' : hasData ? 'Ver Ciclo' : 'Ciclo Vazio'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center mt-4">
                     <p className="text-[7px] font-black uppercase text-indigo-300/40 tracking-[0.3em]">Navegue pela jornada dos ciclos de 1 a 6</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {allLogs
                    .sort((a, b) => b.cycleId - a.cycleId || b.lunarDay - a.lunarDay)
                    .map((log) => {
                      const emotion = EMOTIONS.find(e => e.id === log.emotionId);
                      return (
                        <div key={`${log.cycleId}-${log.lunarDay}`} className="p-4 rounded-[2rem] border flex flex-col gap-3 transition-all duration-1000 bg-indigo-950/10 border-white/5 hover:bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: emotion?.color }}>
                              <LucideIcon name={emotion?.icon || 'Smile'} size={18} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-start">
                                <h4 className="text-[11px] font-black uppercase text-[#4169E1] tracking-tighter">{`DIA ${log.lunarDay} • ${emotion?.name || ''}`}</h4>
                                <span className="text-[8px] font-black text-indigo-300/60 uppercase">{`Ciclo ${log.cycleId}`}</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < log.intensity ? 'bg-indigo-600' : 'bg-indigo-950/5'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          {log.note && (
                            <div className="bg-indigo-950/5 p-3 rounded-2xl border border-indigo-950/5">
                              <p className="text-[10px] text-white/80 leading-relaxed italic font-medium">"{log.note}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : win.id === 'reports' ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Barra Superior de Sincronização com Registros Diários */}
                  <div className="p-4 sm:p-5 rounded-[2rem] bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-inner">
                        <Sparkles size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-100">Sincronização com Registros Diários</h4>
                        <p className="text-[10px] text-indigo-300/80 font-medium">
                          {allLogs.length > 0 
                            ? `${allLogs.length} anotação(ões) diária(s) registrada(s) no seu mapa lunar` 
                            : 'Nenhum registro ainda — anote na Mandala para alimentar a análise'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={updateAllReports}
                      disabled={isUpdatingAllReports || !!isReportLoading}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <RotateCw size={14} className={isUpdatingAllReports ? "animate-spin" : ""} />
                      <span>{isUpdatingAllReports ? "Atualizando Todos..." : "Atualizar Todos com Meus Registros"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {[
                      { id: 'weekly', title: 'Relatório Semanal', icon: 'Clock', color: 'bg-amber-100/20 text-amber-500' },
                      { id: 'monthly', title: 'Análise Mensal', icon: 'RotateCw', color: 'bg-indigo-500/10 text-indigo-300' },
                      { id: 'quarterly', title: 'Visão Trimestral', icon: 'Sparkles', color: 'bg-emerald-100/20 text-emerald-400' },
                      { id: 'correlation', title: 'Correlação Lunar', icon: 'MoonStar', color: 'bg-purple-100/20 text-purple-400' }
                    ].map(item => (
                      <div key={item.id} className="p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-indigo-950/20 border border-white/5 backdrop-blur-md shadow-lg group hover:bg-white/5 transition-all duration-500">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`p-2 sm:p-3 rounded-2xl ${item.color} shadow-inner`}>
                              <LucideIcon name={item.icon} size={18} />
                            </div>
                            <div>
                              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#4169E1]">{item.title}</h3>
                              <p className="text-[8px] sm:text-[9px] text-indigo-300 font-bold uppercase">
                                {item.id === 'weekly' 
                                  ? 'Análise de Dados 7 dias' 
                                  : item.id === 'monthly' 
                                  ? 'Análise de Dados 28 dias' 
                                  : item.id === 'correlation' 
                                  ? (correlationSummary.hasLogs ? `Ritmo 3 Ciclos • Predominante: ${correlationSummary.dominant}` : 'Ritmo Ciclos & Fases') 
                                  : 'Análise de Dados 90 dias'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => generateReport(item.id as any)}
                            disabled={!!isReportLoading || isUpdatingAllReports}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                            title="Atualizar relatório com dados diários"
                          >
                            {isReportLoading === item.id ? <RotateCw className="animate-spin" size={12} /> : <Activity size={12} />}
                            <span>{isReportLoading === item.id ? "Atualizando..." : (reports[item.id as keyof typeof reports].text ? "Atualizar" : "Gerar")}</span>
                          </button>
                        </div>
                        
                        <div className="min-h-[60px] sm:min-h-[80px] bg-indigo-950/5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-indigo-950/5 relative overflow-hidden">
                          {reports[item.id as keyof typeof reports].text ? (
                            <div className="space-y-4">
                              {(item.id === 'monthly' || item.id === 'quarterly') && reports[item.id as keyof typeof reports].logs && (
                                <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-3xl border border-white/5 animate-in fade-in zoom-in duration-1000">
                                  <div className="relative">
                                    <MiniMandala 
                                      logs={reports[item.id as keyof typeof reports].logs!} 
                                      lunarData={reports[item.id as keyof typeof reports].meta?.lunarData || lunarData} 
                                      size={140} 
                                      isNight={isNight} 
                                      solarOffset={reports[item.id as keyof typeof reports].meta?.solarOffset || solarOffset} 
                                      angleStep={angleStep} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-10 h-10 rounded-full bg-indigo-600/10 animate-pulse blur-xl" />
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center gap-1 mt-2">
                                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-indigo-400/60">Síntese Geométrica do Ciclo</span>
                                    <div className="flex items-center gap-1 bg-indigo-500/20 px-2 py-0.5 rounded-full ring-1 ring-white/10">
                                      <Check size={8} className="text-indigo-300" />
                                      <span className="text-[6px] font-black uppercase tracking-tighter text-indigo-200">Imagem Gravada nos Registros</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[11px] sm:text-[13px] leading-relaxed text-white font-medium italic text-justify whitespace-pre-line"
                              >
                                {item.id === 'correlation' ? (
                                  (() => {
                                    const rawText = reports.correlation.text || "";
                                    const dominantSentiment = correlationSummary.dominant;
                                    const defaultSubtitle = `Sentimento Predominante nos Últimos 3 Ciclos: ${dominantSentiment}`;
                                    const hasSubtitle = rawText.toLowerCase().includes("sentimento predominante");
                                    const fullText = hasSubtitle ? rawText : `${defaultSubtitle}\n\n${rawText}`;
                                    const paragraphs = fullText.split(/\n\s*\n/);
                                    const isFirstParagraphSubtitle = paragraphs[0]?.toLowerCase().includes("sentimento predominante");

                                    if (isFirstParagraphSubtitle) {
                                      return (
                                        <div className="space-y-3">
                                          <div className="not-italic font-black text-indigo-200 text-xs sm:text-sm tracking-wide pb-2 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
                                            <span>{paragraphs[0]}</span>
                                            {correlationSummary.hasLogs && (
                                              <span className="text-[8px] sm:text-[9px] text-indigo-300 font-semibold uppercase tracking-wider bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                {correlationSummary.count} {correlationSummary.count === 1 ? 'registro' : 'registros'}
                                              </span>
                                            )}
                                          </div>
                                          <p className="whitespace-pre-line">{paragraphs.slice(1).join("\n\n")}</p>
                                        </div>
                                      );
                                    }
                                    return <p className="whitespace-pre-line">{fullText}</p>;
                                  })()
                                ) : (
                                  <p className="whitespace-pre-line">{reports[item.id as keyof typeof reports].text}</p>
                                )}
                              </motion.div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 text-indigo-900">
                              <LucideIcon name={item.icon} size={20} className="mb-1 opacity-20" />
                              <p className="text-[9px] sm:text-[9px] font-black uppercase tracking-tighter">Invoque a análise</p>
                            </div>
                          )}
                          <Sparkles className="absolute -bottom-2 -right-2 text-indigo-200/20" size={32} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            ) : win.id === 'guide' ? (
              <div className="space-y-12 pb-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-300">
                      <Compass size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#4169E1] border-b-2 border-indigo-500/20 pb-1">Guia de Navegação</h3>
                  </div>
                  
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4 text-justify">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleWindow('mandala', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Mandala Lunar:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">O coração do app. Uma visão circular onde você observa o ciclo atual, as fases lunares e a distribuição de seus sentimentos ao longo dos dias.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('journal', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Astromemórias:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Seu diário de clareza. Aqui você registra o sentimento do dia e a intensidade, criando o rastro da sua história.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('oraculo', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Oráculo Diário:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Uma pausa para se sintonizar. Receba conselhos simples e acolhedores alinhados com a energia do dia para trazer mais leveza e clareza aos seus passos.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('reports', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Relatórios:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Para entender seu ritmo. Veja de forma simples como as fases da lua afetam o seu humor e descubra padrões que te ajudam a se conhecer melhor.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('history', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Histórico:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Sua linha do tempo e arquivos de dados. Acompanhe a curva de marés de suas flutuações de energia e o arquivo completo de todos seus registros passados.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('reminders', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Lembretes Diários:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Avisos no mesmo horário para manter sua constância de auto-observação, notificando você caso ainda não tenha anotado suas astromemórias no dia.</span>
                        </button>
                        <button 
                          onClick={() => toggleWindow('guide', 'open')}
                          className="w-full text-justify p-3.5 rounded-2xl border border-transparent bg-indigo-950/20 hover:bg-indigo-900/40 hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer block"
                        >
                          <strong className="text-white group-hover:text-[#4169E1] transition-colors">• Informativo App:</strong>{' '}
                          <span className="text-sm text-indigo-100/80 leading-relaxed font-medium">Este guia de aprendizagem. Encontre o manual de orientação operacional, conceitos do caminho da lua e envie feedbacks diretamente para nós.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-indigo-950/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-300">
                      <BookOpen size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#4169E1] border-b-2 border-indigo-500/20 pb-1">aprendendo o caminho da lua</h3>
                  </div>
                  <p className="text-[16px] leading-relaxed text-indigo-300 font-black italic text-justify">
                    "Há um padrão de respostas emocionais que seguimos sem nos aperceber dele. É um 'Plano Piloto Emocional' que atua diretamente do inconsciente, mas podemos identificar e o reconhecer pelo ciclo lunar de 29 dias."
                  </p>
                  <div className="bg-indigo-900/10 p-6 rounded-[2.5rem] border border-indigo-400/10 space-y-5 text-justify">
                    <p className="text-sm leading-relaxed text-indigo-100/80 font-medium">
                      Sendo a Lua a grande governante do reino dos sentimentos, nossas "ondas emocionais" aumentam e diminuem conforme as fases lunares: nova, crescent, cheia e minguante. O objetivo desta ferramenta é criar um <strong>diário visual do seu mundo interior</strong>, permitindo que você observe padrões e entenda como suas emoções flutuam ao longo de um ciclo.
                    </p>
                    <p className="text-sm leading-relaxed text-indigo-100/80 font-medium border-l-2 border-indigo-500/30 pl-3">
                      Através deste Mapeamento das Emoções, você poderá identificar seu ciclo emocional e obter mais domínio sobre suas reações, evitando projeções externas que geram equívocos e conflitos decorrentes de certas predisposições sentimentais unicamente suas.
                    </p>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-indigo-950/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-500">
                      <Compass size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#4169E1] border-b-2 border-amber-500/20 pb-1">Análise e Relatórios</h3>
                  </div>
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-6 text-justify">
                    <div className="p-5 bg-indigo-900/5 rounded-3xl border-2 border-dashed border-indigo-500/20">
                      <h4 className="text-xs font-black uppercase text-indigo-300 mb-3 tracking-widest text-center">A Alma do Processo: Anotações Diárias</h4>
                      <p className="text-sm text-indigo-100/80 leading-relaxed text-justify">
                        Sem as suas anotações, a mandala é apenas arte. Ao registrar o <strong>Evento de Impacto</strong> e suas notas pessoais, você dá contexto aos dados. É essa união entre o <em>sentir</em> (cor e intensidade) e o <em>viver</em> (fatos do dia) que permite identificar quais gatilhos externos acionam suas predisposições sentimentais unicamente suas.
                      </p>
                    </div>

                    <p className="text-sm text-indigo-100/80 leading-relaxed">
                      Para que o seu <strong>Mapeamento Emocional</strong> seja preciso, oferecemos três níveis de análise que transformam seus registros em auto observação consciente gerando compreensões e orientações ao longo do tempo:
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex gap-4 p-4 bg-indigo-950/20 rounded-3xl border border-indigo-400/10">
                        <div className="p-2.5 bg-amber-500/10 rounded-xl h-fit"><Clock size={16} className="text-amber-500" /></div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-100 tracking-widest">Relatórios Semanais</h4>
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">Ajuste de curso: visão de curto prazo para identificar flutuações imediatas de energia e humor.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-indigo-950/20 rounded-3xl border border-indigo-400/10">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl h-fit"><RotateCw size={16} className="text-indigo-300" /></div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-100 tracking-widest">Análise Mensal (Mandala)</h4>
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">O Ciclo Completo: revelação do padrão formado pela soma dos 29 dias em ressonância com as fases lunares.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-indigo-950/20 rounded-3xl border border-indigo-400/10">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl h-fit"><Sparkles size={16} className="text-emerald-400" /></div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-100 tracking-widest">Visão Trimestral</h4>
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">Perspectiva de Médio Prazo: essencial para notar que os mesmos sentimentos se repetem em diferentes lunações.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-indigo-950/20 rounded-3xl border border-indigo-400/10">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl h-fit"><LucideIcon name="MoonStar" size={16} className="text-purple-400" /></div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-100 tracking-widest">Correlação Lunar</h4>
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">Sintonia das Estações da Alma: Identifica os sentimentos recorrentes prioritários associados a cada uma das quatro grandes fases lunares de forma integrada ao longo de 3 ciclos completos de anotações.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>



                <section className="space-y-6 pt-6 border-t border-indigo-950/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-500">
                      <MessageCircle size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#4169E1] border-b-2 border-emerald-500/20 pb-1">Conexão & Sugestões</h3>
                  </div>
                  <p className="text-sm text-indigo-300 font-medium text-justify">
                    Hekat Astromemorias é um organismo em evolução. Sinta-se à vontade para compartilhar sugestões, dúvidas ou apenas um pensamento sobre sua jornada.
                  </p>
                  
                  <div className="relative px-1">
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Escreva aqui sua luz ou sua dúvida..."
                      className="w-full h-32 p-6 rounded-[2rem] bg-indigo-950/5 border border-indigo-950/5 text-indigo-300 text-base sm:text-sm placeholder:text-indigo-900/30 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    />
                    <button 
                      onClick={handleSendFeedback}
                      disabled={isSendingFeedback || !feedback.trim()}
                      className="absolute bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {isSendingFeedback ? <RotateCw className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                    {feedbackSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-8 right-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest"
                      >
                         Mensagem enviada ✨
                      </motion.div>
                    )}
                  </div>
                </section>
                
                <div className="text-center pb-6 space-y-1">
                   <p className="text-[8px] font-black uppercase text-indigo-200/40 tracking-widest">Hekat Astromemorias • Sabedoria Milenar</p>
                   <p className="text-[8px] font-medium uppercase text-indigo-300/30 tracking-widest italic">Astromemória Estelar</p>
                </div>
              </div>
            ) : win.id === 'calendar' ? (
              <div className="space-y-4">
                <div className="text-center mb-1">
                  <h2 className="text-xl font-serif italic font-medium text-[#4169E1]">Calendário do Ciclo Lunar - Dia 1 Lua Nova</h2>
                  <p className="text-[10px] text-indigo-300/70 font-medium">Mapeamento de sentimentos e eventos significativos do ciclo atual</p>
                </div>

                {/* Seletor de Ciclo */}
                <div className="flex justify-between items-center bg-indigo-950/20 p-2.5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-indigo-300 tracking-wider">Ciclo:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-600/20 border border-indigo-500/20 text-xs font-black text-indigo-200">
                      Ciclo {viewingCycleId || lunarData.cycleId}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.max(1, (prev || lunarData.cycleId) - 1))}
                      className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors active:scale-95 cursor-pointer"
                      title="Ciclo Anterior"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={() => setViewingCycleId(prev => Math.min(lunarData.cycleId, (prev || lunarData.cycleId) + 1))}
                      disabled={(viewingCycleId || lunarData.cycleId) >= lunarData.cycleId}
                      className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Próximo Ciclo"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Tabela do Calendário (Grade 4x7 com cabeçalhos de linhas e colunas) */}
                <div className="overflow-x-auto no-scrollbar">
                  <div className="min-w-[280px] sm:min-w-0 w-full space-y-1.5 sm:space-y-2">
                    {/* Cabeçalho das Colunas */}
                    <div className="grid grid-cols-8 gap-1 sm:gap-1.5 text-center">
                      <div className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-300/40 tracking-wider flex items-center justify-center">
                        <span className="hidden sm:inline">Semana</span>
                        <span className="inline sm:hidden">Sem.</span>
                      </div>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-300/60 tracking-wider py-1 bg-white/5 rounded-lg border border-white/5">
                          <span className="hidden sm:inline">Dia </span>{i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Linhas (Semanas) */}
                    {Array.from({ length: 4 }).map((_, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-8 gap-1 sm:gap-1.5">
                        {/* Indicador de Semana */}
                        {(() => {
                          const startDayNum = weekIndex * 7 + 1;
                          const endDayNum = weekIndex * 7 + 7;
                          const startCellDate = lunarData.getDateForDay(startDayNum);
                          const endCellDate = lunarData.getDateForDay(endDayNum);
                          const dateRangeStr = `${startCellDate.getDate()}/${startCellDate.getMonth() + 1} a ${endCellDate.getDate()}/${endCellDate.getMonth() + 1}`;
                          return (
                            <div className="flex flex-col items-center justify-center bg-indigo-950/40 rounded-xl sm:rounded-2xl border border-white/5 text-[8px] sm:text-[9px] font-black uppercase text-indigo-300/60 tracking-tight sm:tracking-widest text-center p-0.5 sm:p-1">
                              <span>S{weekIndex + 1}</span>
                              <span className="text-[5.5px] sm:text-[6.5px] text-indigo-300/40 font-semibold tracking-tighter leading-none mt-0.5">{dateRangeStr}</span>
                            </div>
                          );
                        })()}

                        {/* 7 Dias da Semana */}
                        {Array.from({ length: 7 }).map((_, dayOfWeekIndex) => {
                          const lunarDayNum = weekIndex * 7 + dayOfWeekIndex + 1;
                          const log = logs[lunarDayNum];
                          const emotion = log ? EMOTIONS.find(e => e.id === log.emotionId) : null;
                          const isSelected = selectedDay === lunarDayNum;
                          const cellDate = lunarData.getDateForDay(lunarDayNum);
                          const cellDayOfMonth = cellDate.getDate();

                          return (
                            <button
                              key={lunarDayNum}
                              onClick={() => setSelectedDay(lunarDayNum)}
                              className={`aspect-square p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border flex flex-col justify-between items-center transition-all duration-300 cursor-pointer text-left relative group ${
                                isSelected 
                                  ? 'ring-2 ring-indigo-500 bg-indigo-900/40 border-indigo-500' 
                                  : 'bg-indigo-950/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                              }`}
                            >
                              {/* Dia do Mês */}
                              <span className="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-[7.5px] sm:text-[8.5px] font-black text-slate-400">
                                {cellDayOfMonth}
                              </span>

                              {/* Conteúdo do Registro */}
                              {log ? (
                                <div className="flex flex-col items-center justify-center flex-1 w-full pt-2.5 pb-0.5 sm:pt-3 sm:pb-1">
                                  {/* Círculo do Sentimento */}
                                  <div 
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: emotion?.color || '#cbd5e1' }}
                                    title={emotion?.name || 'Sentimento'}
                                  >
                                    <LucideIcon name={emotion?.icon || 'Smile'} size={10} />
                                  </div>
                                  <span className="text-[7.5px] font-bold tracking-tighter text-slate-300 truncate max-w-full mt-1 hidden sm:block">
                                    {emotion?.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex-1 flex items-center justify-center w-full pt-1.5 sm:pt-2">
                                  <Plus size={9} className="text-slate-500/60 group-hover:text-slate-400 group-hover:scale-125 transition-all" />
                                </div>
                              )}

                              {/* Indicador de Nota/Evento */}
                              {log?.note && (
                                <span className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400 animate-pulse" title="Tem anotação" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalhes do Dia Selecionado */}
                <div className="bg-indigo-950/30 rounded-3xl sm:rounded-[2.5rem] border border-white/5 p-4 sm:p-5 space-y-3 relative overflow-hidden transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Cabeçalho do Detalhe */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
                        Anotações do Dia
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-[#4169E1] uppercase tracking-tight flex flex-wrap items-center gap-1 sm:gap-1.5">
                        {lunarData.getDateForDay(selectedDay).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' })}
                        <span className="text-[9px] sm:text-[10px] text-slate-400 lowercase font-medium">
                          (Dia {selectedDay} do Ciclo)
                        </span>
                      </h4>
                    </div>
                    {logs[selectedDay] && (
                      <span className="text-[8px] font-black uppercase text-indigo-300/40 tracking-wider">
                        Registrado
                      </span>
                    )}
                  </div>

                  {/* Detalhes do Sentimento & Nota */}
                  {logs[selectedDay] ? (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                          style={{ backgroundColor: EMOTIONS.find(e => e.id === logs[selectedDay].emotionId)?.color || '#cbd5e1' }}
                        >
                          <LucideIcon name={EMOTIONS.find(e => e.id === logs[selectedDay].emotionId)?.icon || 'Smile'} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-100 uppercase tracking-wide">
                              {EMOTIONS.find(e => e.id === logs[selectedDay].emotionId)?.name || 'Desconhecido'}
                            </span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400">
                              Intensidade: {logs[selectedDay].intensity}/5
                            </span>
                          </div>
                          {/* Desenha estrelinhas / pontos de intensidade */}
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < logs[selectedDay].intensity 
                                    ? 'bg-indigo-400' 
                                    : 'bg-white/10'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Nota de Evento Significativo */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase text-indigo-300/50 tracking-wider flex items-center gap-1">
                          <BookOpen size={10} /> Evento Significativo do Dia
                        </span>
                        <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-white/5 text-xs text-slate-300/90 leading-relaxed text-justify whitespace-pre-wrap italic">
                          {logs[selectedDay].note || "O portal está aberto, mas não há notas narrativas gravadas para este dia."}
                        </div>
                      </div>

                      {/* Botão para Editar */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            toggleWindow('journal', 'open');
                          }}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/15"
                        >
                          <LucideIcon name="MessageCircle" size={12} /> Editar Astromemória
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center justify-center text-center space-y-3.5">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                        <Plus size={18} />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <p className="text-xs font-black text-slate-200 uppercase tracking-wide">Sem registro para este dia</p>
                        <p className="text-[10px] text-slate-400/80 leading-relaxed">Nenhum sentimento ou evento significativo foi mapeado para o Dia {selectedDay} deste ciclo.</p>
                      </div>
                      <button
                        onClick={() => {
                          toggleWindow('journal', 'open');
                        }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-4.5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/15"
                      >
                        <Plus size={12} /> Anotar Sentimento & Evento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : win.id === 'journal' ? (
              <div className="space-y-3">
                <div className="text-center mb-1">
                    <h2 className="text-xl font-serif italic font-medium text-[#4169E1]">Qual o sentimento mais presente hoje?</h2>
                </div>

                <div className="relative group">
                  <div id="category-scroll" className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar-h scroll-smooth snap-x snap-mandatory">
                      {CATEGORIES.map(cat => (
                        <div key={cat} className="flex-shrink-0 space-y-4 w-full snap-center p-4 rounded-3xl border transition-all duration-1000 bg-indigo-950/20 border-white/5">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-200/60">{cat}</h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                            {EMOTIONS.filter(e => e.category === cat)
                              .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                              .map(emo => {
                              const isLight = isColorLight(emo.color);
                              const textColorClass = isLight ? 'text-indigo-950 font-extrabold' : 'text-white font-black';
                              const textShadowClass = isLight ? '' : 'drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]';
                              const iconColorClass = isLight ? 'text-indigo-950/90' : 'text-white';
                              const ringClass = isLight ? 'ring-indigo-950/60' : 'ring-white';
                              
                              const nameLength = emo.name.length;
                              // Dynamic font sizing based on length to fit button sizes on mobile screens perfectly
                              const fontSizeClass = nameLength > 15 
                                ? 'text-[6.5px] min-[380px]:text-[7.5px] sm:text-[7.5px] leading-[1]' 
                                : nameLength > 10 
                                  ? 'text-[7.5px] min-[380px]:text-[8px] sm:text-[8px] leading-[1.1]' 
                                  : 'text-[9.2px] min-[380px]:text-[9.5px] sm:text-[8px] leading-tight';
                              
                              const iconSize = nameLength > 15 ? 14 : 18;

                              return (
                                <button 
                                  key={emo.id} 
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setCurrentEmotion(emo.id);
                                  }}
                                  style={{ 
                                    backgroundColor: emo.color,
                                    boxShadow: currentEmotion === emo.id ? `0 0 25px ${emo.color}, inset 0 0 10px rgba(255,255,255,0.3)` : undefined
                                  }}
                                  className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer p-1 ${
                                    currentEmotion === emo.id 
                                      ? 'ring-4 ring-white ring-offset-2 ring-offset-indigo-950 scale-[1.08] z-20 shadow-2xl opacity-100' 
                                      : 'opacity-85 hover:opacity-[0.98] hover:scale-105 hover:z-10 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                                  }`}
                                  title={emo.name}
                                >
                                  <LucideIcon 
                                    name={emo.icon} 
                                    size={iconSize} 
                                    className={`${iconColorClass} drop-shadow-md group-hover:scale-110 transition-transform mb-1`} 
                                  />
                                  <span className={`${fontSizeClass} uppercase text-center px-0.5 transition-all w-full flex items-center justify-center min-h-[2.4em] tracking-wide ${textColorClass} ${textShadowClass}`}>
                                    {emo.name}
                                  </span>
                                  <div className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/40 transition-colors" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* Floating Scroll Buttons */}
                  <button 
                    onClick={() => {
                      const el = document.getElementById('category-scroll');
                      if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-indigo-900 border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('category-scroll');
                      if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-indigo-900 border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] sm:text-[9px] font-black uppercase text-indigo-300/60">
                      <span className="text-[#4169E1]">Evento de Impacto do Dia</span>
                    </div>
                    <textarea 
                      placeholder="O que marcou o seu dia hoje? (Postura, acontecimento, lição...)"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full h-24 p-4 rounded-2xl bg-white/20 border border-white/20 text-white text-base sm:text-[11px] placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-400 custom-scrollbar-h resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] sm:text-[9px] font-black uppercase text-indigo-300/60">
                      <span className="text-[#4169E1]">Intensidade: Nível {intensity}</span>
                    </div>
                    <input type="range" min="1" max="5" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="slider-feel bg-slate-100" />
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSave();
                    }} 
                    disabled={!currentEmotion || showSuccess} 
                    className={`flex-1 py-4 sm:py-3 rounded-3xl font-black text-white text-base sm:text-xs shadow-xl transition-all active:scale-95 ${currentEmotion && !showSuccess ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed opacity-60'}`}
                  >
                      {showSuccess ? "Memória Gravada ✨" : "Gravar Sentimento"}
                  </button>
                </div>

                {/* Status Rápido do Lembrete Diário */}
                <div className="pt-1 flex items-center justify-between px-3.5 py-2.5 bg-indigo-950/40 rounded-2xl border border-white/5 text-[10px] text-indigo-300/80">
                  <div className="flex items-center gap-2">
                    <Bell size={12} className={reminderSettings.enabled ? 'text-amber-400' : 'text-slate-500'} />
                    <span>Lembrete Diário: <strong className="text-white">{reminderSettings.enabled ? `Ativo às ${reminderSettings.time}` : 'Desativado'}</strong></span>
                  </div>
                  <button 
                    onClick={() => toggleWindow('reminders', 'open')}
                    className="text-[#4169E1] hover:text-indigo-200 font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            ) : win.id === 'backup' ? (
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-1 border-b border-white/10">
                  <h3 className="text-sm font-black text-[#BF8A10] uppercase tracking-wider">Resgate e Migração de Astromemórias</h3>
                  <p className="text-slate-300/80 text-[11px] leading-relaxed">
                    Faça backup de suas memórias para transferir entre dispositivos ou sincronize com sua conta.
                  </p>
                </div>

                {/* Status do Dispositivo */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300/70 tracking-wider block">Neste dispositivo</span>
                    <span className="font-extrabold text-white text-sm">
                      {allLogs.length} astromemória(s) salva(s)
                    </span>
                    {allLogs.length > 0 && (
                      <span className="text-[10px] text-indigo-400 block mt-0.5">
                        Ciclos: {[...new Set(allLogs.map(l => l.cycleId))].sort((a, b) => Number(a) - Number(b)).join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-indigo-300/70 tracking-wider block">Conta / Modo</span>
                    <span className="font-bold text-amber-300 text-xs">
                      {currentUser?.uid === 'guest_user' ? 'Modo Visitante (Local)' : (currentUser?.email || 'Conectado')}
                    </span>
                  </div>
                </div>

                {/* Seletor de Abas: Manual vs Nuvem */}
                <div className="flex bg-white/10 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setSyncTab('transfer')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${syncTab === 'transfer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Arquivo / Código
                  </button>
                  <button
                    onClick={() => setSyncTab('cloud')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${syncTab === 'cloud' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Nuvem Google
                  </button>
                </div>

                {syncTab === 'transfer' ? (
                  <div className="space-y-4">
                    {/* Passo 1: Exportar */}
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#BF8A10] font-black uppercase text-[11px] tracking-wider">
                          <Download size={14} />
                          <span>1. Gerar Cópia de Segurança</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-300/70 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {allLogs.length} gravadas
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Copie o código das suas memórias ou baixe o arquivo .json para salvar em segurança ou transferir para outro aparelho:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleCopyBackup}
                          className="flex-1 py-2.5 px-3 bg-indigo-600/80 hover:bg-indigo-600 active:scale-95 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {hasCopied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                          <span>{hasCopied ? "Copiado com Sucesso!" : "Copiar Astromemórias"}</span>
                        </button>
                        <button
                          onClick={handleDownloadBackup}
                          className="py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-indigo-200 hover:text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
                        >
                          <Download size={14} />
                          <span>Baixar .json</span>
                        </button>
                      </div>
                    </div>

                    {/* Passo 2: Importar */}
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-white/10 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#BF8A10] font-black uppercase text-[11px] tracking-wider">
                        <Upload size={14} />
                        <span>2. Restaurar ou Importar Memórias</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Cole o código copiado do outro aparelho ou carregue o arquivo .json baixado para integrar suas memórias imediatamente:
                      </p>
                      <textarea
                        value={importInputText}
                        onChange={(e) => setImportInputText(e.target.value)}
                        placeholder="Cole aqui o código de backup gerado no celular ou tablet..."
                        className="w-full h-20 p-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-100 text-[11px] placeholder:text-slate-500 font-mono outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleImportLogs(importInputText)}
                          disabled={!importInputText.trim()}
                          className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Restaurar & Integrar Dados
                        </button>
                        <label className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-indigo-200 hover:text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/5">
                          <FileText size={14} />
                          <span>Subir Arquivo</span>
                          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Conteúdo Aba Nuvem */
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-[#BF8A10] font-black uppercase text-[11px] tracking-wider">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>Sincronização em Nuvem via Google</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Ao conectar sua conta Google no celular, tablet e computador:
                      </p>
                      <ul className="list-disc list-inside text-slate-300/90 text-[11px] space-y-1.5 pl-1">
                        <li>Todas as memórias anotadas em qualquer tela sobem de forma segura para a nuvem.</li>
                        <li>Ao abrir o tablet ou computador e entrar com a mesma conta, tudo é sincronizado automaticamente.</li>
                        <li>Você não precisa se preocupar com transferências manuais.</li>
                      </ul>

                      {currentUser?.uid === 'guest_user' || !currentUser ? (
                        <div className="pt-2">
                          <button
                            onClick={handleLogin}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <LogIn size={16} />
                            <span>Conectar com Google Agora</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                          <Check size={16} className="text-emerald-400 shrink-0" />
                          <span>Você está conectado com {currentUser?.email}. Seus dados sincronizam na nuvem.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mensagem de Feedback de Status */}
                {syncStatus.type && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs font-bold ${syncStatus.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'}`}
                  >
                    {syncStatus.message}
                  </motion.div>
                )}
              </div>
            ) : win.id === 'reminders' ? (
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-1 border-b border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <BellRing size={20} className="text-amber-400" />
                    <h3 className="text-sm font-black text-[#BF8A10] uppercase tracking-wider">Lembretes Diários de Astromemórias</h3>
                  </div>
                  <p className="text-slate-300/80 text-[11px] leading-relaxed max-w-md mx-auto">
                    Receba um aviso no mesmo horário todos os dias para manter a constância do seu sentir, caso ainda não tenha registrado.
                  </p>
                </div>

                {/* Card de Status do Dia Atual */}
                {isTodayLogged ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                          Astromemória de Hoje Concluída ✨
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Dia Lunar {lunarData.day}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      Seu registro diário está em dia. O próximo lembrete soará amanhã pontualmente às {reminderSettings.time}.
                    </p>
                    {todayLogEntry && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-slate-200">
                          Sentimento gravado: <strong className="text-emerald-300">{EMOTIONS.find(e => e.id === todayLogEntry.emotionId)?.name || 'Registrado'}</strong> (Intensidade {todayLogEntry.intensity}/5)
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDay(lunarData.day);
                            toggleWindow('journal', 'open');
                          }}
                          className="text-[10px] text-emerald-300 hover:text-white font-bold uppercase tracking-wider underline cursor-pointer"
                        >
                          Ver no Diário
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellRing size={18} className="text-amber-400 animate-pulse shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                          Registro de Hoje Pendente 🌙
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Dia Lunar {lunarData.day}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed">
                      {now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) >= reminderSettings.time
                        ? `O horário programado das ${reminderSettings.time} já chegou hoje. Reserve um instante para escutar o seu sentir.`
                        : `O seu lembrete diário soará hoje pontualmente às ${reminderSettings.time}. Você também pode registrar agora mesmo.`}
                    </p>
                    <button
                      onClick={handleOpenJournalForToday}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageCircle size={15} />
                      <span>Anotar Astromemória de Hoje</span>
                    </button>
                  </div>
                )}

                {/* Configurações Principais */}
                <div className="space-y-3 bg-black/25 p-4 rounded-2xl border border-white/5">
                  {/* Ativar/Desativar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Ativar Lembretes Diários</span>
                      <span className="text-[10px] text-slate-400 block">Notifica você todos os dias no mesmo horário caso não tenha registrado</span>
                    </div>
                    <button
                      onClick={() => updateReminderSettings({ enabled: !reminderSettings.enabled })}
                      className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                        reminderSettings.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <motion.div
                        layout
                        className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform ${
                          reminderSettings.enabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Seletor de Horário */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-400" /> Horário Diário
                      </span>
                      <input
                        type="time"
                        value={reminderSettings.time}
                        onChange={(e) => updateReminderSettings({ time: e.target.value })}
                        className="bg-indigo-950/60 border border-white/15 px-3 py-1.5 rounded-xl text-white text-sm font-black tracking-widest focus:outline-none focus:border-amber-400/50 cursor-pointer text-center"
                      />
                    </div>
                    {/* Botões rápidos de horários */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { time: '08:00', label: '08:00 Despertar' },
                        { time: '13:00', label: '13:00 Meio-dia' },
                        { time: '19:00', label: '19:00 Crepúsculo' },
                        { time: '20:00', label: '20:00 Noite' },
                        { time: '21:00', label: '21:00 Serenidade' },
                        { time: '22:00', label: '22:00 Recolhimento' }
                      ].map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => updateReminderSettings({ time: slot.time })}
                          className={`text-[9.5px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                            reminderSettings.time === slot.time
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                              : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Som Celestial */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {reminderSettings.sound ? <Volume2 size={14} className="text-indigo-400" /> : <VolumeX size={14} className="text-slate-500" />}
                        Sinal Sonoro Celestial
                      </span>
                      <span className="text-[10px] text-slate-400 block">Sinos harmônicos na frequência regenerativa 528Hz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={playCelestialChime}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-indigo-300 border border-white/10 cursor-pointer active:scale-95"
                        title="Ouvir amostra do som"
                      >
                        Ouvir Som
                      </button>
                      <button
                        onClick={() => updateReminderSettings({ sound: !reminderSettings.sound })}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                          reminderSettings.sound ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                      >
                        <motion.div
                          layout
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform ${
                            reminderSettings.sound ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notificações no Dispositivo (Web / Celular) */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Avisos no Dispositivo
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : notificationPermission === 'denied'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {notificationPermission === 'granted' ? 'Ativo no Navegador' : notificationPermission === 'denied' ? 'Bloqueado' : 'Aguardando Permissão'}
                    </span>
                  </div>

                  {notificationPermission === 'granted' ? (
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Seu navegador está autorizado a emitir lembretes no horário selecionado, mesmo se você estiver em outra aba ou aplicativo.
                    </p>
                  ) : notificationPermission === 'denied' ? (
                    <p className="text-[10px] text-rose-300/80 leading-relaxed">
                      As notificações foram bloqueadas nas permissões do seu navegador. Você pode reativá-las nas configurações do site no cadeado da barra de endereço. O app continuará exibindo avisos visuais na tela.
                    </p>
                  ) : (
                    <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        Autorize o envio de notificações para receber o lembrete diário no seu aparelho.
                      </p>
                      <button
                        onClick={requestNotificationPermission}
                        className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                      >
                        Autorizar no Aparelho
                      </button>
                    </div>
                  )}

                  {/* Botão de Teste */}
                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      onClick={triggerTestReminder}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Simular disparo de lembrete agora"
                    >
                      <Bell size={12} /> Testar Lembrete Agora
                    </button>
                  </div>
                </div>
              </div>
            ) : null;

            const windowWidth = 
              win.id === 'history' || win.id === 'calendar' || win.id === 'reports' || win.id === 'backup' 
                ? "620px" 
                : win.id === 'mandala' 
                  ? "430px" 
                  : "520px";

            return (
              <Window 
                key={win.id} 
                win={win} 
                desktopRef={desktopRef} 
                topZ={topZ} 
                isNight={isNight}
                toggleWindow={toggleWindow} 
                updateWindowPos={updateWindowPos}
                width={windowWidth}
                isMobile={isMobile}
                isTablet={isTablet}
              >
                {Component}
              </Window>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 h-16 flex items-center gap-1 px-2 z-[1500] border-t pointer-events-auto transition-colors duration-1000 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x ${
          isNight ? 'glass bg-slate-950/90 border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]' : 'glass bg-white/90 border-indigo-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]'
        }`}>
          {windows.filter(win => win.id !== 'guide').map(win => {
            const isActive = win.isOpen && !win.isMinimized;
            return (
              <button
                key={win.id}
                onClick={() => {
                  toggleWindow(win.id, isActive ? 'minimize' : 'focus');
                }}
                className="flex flex-col items-center justify-center min-w-[58px] shrink-0 h-14 rounded-2xl transition-all active:scale-90"
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600/20 text-indigo-300 scale-110 shadow-sm' 
                    : 'text-slate-400 hover:text-indigo-300'
                }`}>
                  <LucideIcon name={win.icon} size={20} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 truncate max-w-[54px] ${
                  isActive ? 'text-indigo-300' : 'text-slate-500'
                }`}>
                  {win.title === 'Mandala Lunar' ? 'Mandala' 
                    : win.title === 'Astromemorias' ? 'Diário' 
                    : win.title === 'Oráculo Diário' ? 'Oráculo' 
                    : win.title === 'Relatórios' ? 'Relatórios' 
                    : win.title === 'Histórico' ? 'Histórico' 
                    : win.title === 'Calendário do Ciclo' ? 'Calendário' 
                    : win.title === 'Lembretes Diários' ? 'Lembretes' 
                    : win.title === 'Resgate & Backup' ? 'Resgate' 
                    : 'Informativo'}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Reset Modal */}
      <AnimatePresence>
        {isResetOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-indigo-900">Formatar Ciclo?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Isso apagará todas as memórias emocionais deste ciclo lunar de forma permanente e reiniciará o Hekat OS.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsResetOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600">Cancelar</button>
                <button onClick={handleReset} className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-200">Resetar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Onboarding Modal */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-indigo-950/80 border border-white/10 p-8 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6 backdrop-blur-xl relative"
            >
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              </div>
              
              <div className="w-16 h-16 bg-indigo-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                <Compass className="text-[#BF8A10]" size={28} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#BF8A10] uppercase tracking-wider">Qual seu nome?</h3>
                <p className="text-xs text-indigo-200/60 leading-relaxed font-semibold text-justify">
                  O Oráculo e seus Relatórios usarão esta identificação para guiar você neste caminho de Auto observação acompanhando os Ciclos Lunares.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Seu nome ou apelido..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameInput.trim()) {
                      handleSaveName();
                    }
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-black/30 border border-white/15 focus:border-[#BF8A10]/50 text-white placeholder-indigo-300/30 text-center text-sm font-bold tracking-wide outline-none transition-all shadow-inner uppercase"
                  maxLength={25}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSaveName}
                  disabled={!nameInput.trim() || isSavingName}
                  className={`w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                    ${nameInput.trim() && !isSavingName 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:opacity-90 cursor-pointer shadow-indigo-900/30' 
                      : 'bg-indigo-950/40 text-indigo-300/20 border border-white/5 cursor-not-allowed opacity-40'}`}
                >
                  {isSavingName ? "Registrando..." : "Entrar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating In-App Daily Reminder Alert */}
      <AnimatePresence>
        {showInAppReminder && !isTodayLogged && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${isMobile ? 'bottom-20 left-3 right-3' : 'bottom-6 right-6 max-w-md w-full'} z-[3000] pointer-events-auto p-4 sm:p-5 rounded-3xl bg-slate-950/95 border border-amber-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(251,191,36,0.18)] backdrop-blur-2xl`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <BellRing size={20} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Lembrete Diário</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">Dia {lunarData.day}</span>
                  </div>
                  <button
                    onClick={handleDismissToday}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Dispensar por hoje"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-sm font-serif italic text-white font-medium mt-1">Hora do seu registro de astromemórias</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed mt-1">
                  Você ainda não registrou o seu sentir sob o ritmo de hoje. Reserve um instante para escutar e anotar suas marés internas.
                </p>
                <div className="flex items-center gap-2 mt-3 pt-1">
                  <button
                    onClick={handleOpenJournalForToday}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={14} /> Registrar Agora
                  </button>
                  <button
                    onClick={handleSnooze}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Lembrar novamente em 30 minutos"
                  >
                    Soneca (30m)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
   )}
  </AnimatePresence>
</>
  );
}
