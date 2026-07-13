import { useState, useEffect, useMemo, useRef, ReactNode, RefObject, FC } from 'react';
/**
 * Hekat OS - Oráculo de Astromemórias
 * Versão: 2.1.0-fix
 * Meta: Estabilidade de 17/05/2026 restores
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
  BatteryLow
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
  BatteryLow
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
}

const Window: FC<WindowProps> = ({ win, children, width = "450px", desktopRef, topZ, isNight, toggleWindow, updateWindowPos, isMobile }) => {
  const controls = useDragControls();
  const isMobileDevice = isMobile;

  const initialX = isMobileDevice ? 0 : win.pos.x;
  const initialY = isMobileDevice ? 0 : win.pos.y + 15;
  const animateX = isMobileDevice ? 0 : win.pos.x;
  const animateY = isMobileDevice ? 0 : win.pos.y;

  return (
    <AnimatePresence>
      {win.isOpen && !win.isMinimized && (
        <motion.div
          drag={!isMobileDevice}
          dragControls={controls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.92, x: initialX, y: initialY }}
          animate={{ opacity: 1, scale: 1, x: animateX, y: animateY }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            mass: 1
          }}
          onDragEnd={(_, info) => {
            if (!isMobileDevice) {
              updateWindowPos(win.id, win.pos.x + info.offset.x, win.pos.y + info.offset.y);
            }
          }}
          onPointerDown={() => toggleWindow(win.id, 'focus')}
          style={{ 
            zIndex: win.zIndex, 
            width: isMobileDevice ? "100%" : `min(${width}, 95vw)`,
            height: isMobileDevice ? "calc(100dvh - 56px - 64px)" : "auto",
            left: 0,
            top: isMobileDevice ? "56px" : 0,
            position: 'absolute'
          }}
          className={`window-shadow glass overflow-hidden flex flex-col pointer-events-auto ${isMobileDevice ? 'rounded-t-[2rem] rounded-b-none border-x-0 border-b-0' : 'rounded-[2.5rem] border border-white/40'} ${win.zIndex >= topZ ? 'ring-2 ring-indigo-500/20 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)]' : ''}`}
        >
          {/* Title Bar */}
          <div 
            onPointerDown={(e) => {
              toggleWindow(win.id, 'focus');
              if (!isMobileDevice) {
                controls.start(e);
              }
            }}
            style={{ touchAction: isMobileDevice ? 'auto' : 'none' }}
            className="bg-white/20 px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center cursor-move select-none border-b border-white/10 active:bg-white/40 transition-colors duration-1000 flex-shrink-0"
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
            className={`p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar-h transition-colors duration-1000 bg-white/5 ${isMobileDevice ? 'h-auto max-h-none min-h-0' : 'max-h-[74dvh]'}`}
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

  const startDayLocal = new Date(cycleStartDate.getUTCFullYear(), cycleStartDate.getUTCMonth(), cycleStartDate.getUTCDate(), 12, 0, 0);
  const nowDayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const localDiffDays = Math.round((nowDayLocal.getTime() - startDayLocal.getTime()) / (1000 * 60 * 60 * 24));
  const mandalaDay = isNaN(localDiffDays) ? 1 : Math.min(29, Math.max(1, localDiffDays + 1));
  
  const formatDate = (d: Date) => {
    if (!d || isNaN(d.getTime())) return "01/01";
    const dayStr = String(d.getUTCDate()).padStart(2, '0');
    const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dayStr}/${monthStr}`;
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
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
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
  const sun = sunSignName || 'Touro';
  const moon = moonSignName || 'Peixes';
  const nameIntro = userName ? `${userName}, ` : 'Viajante, ';
  
  // Detectar Elementos
  const getElement = (sign: string): 'FOGO' | 'TERRA' | 'AR' | 'ÁGUA' => {
    const s = sign.toLowerCase();
    if (['áries', 'leão', 'sagitário', 'aries', 'leao', 'sagitario'].includes(s)) return 'FOGO';
    if (['touro', 'virgem', 'capricórnio', 'capricornio'].includes(s)) return 'TERRA';
    if (['gêmeos', 'gemeos', 'libra', 'aquário', 'aquario'].includes(s)) return 'AR';
    return 'ÁGUA'; // Câncer, Escorpião, Peixes
  };

  const sunElement = getElement(sun);
  const moonElement = getElement(moon);

  const elementTexts: Record<string, { main: string, advice: string }> = {
    'FOGO_FOGO': {
      main: `sinta a irradiação da chama em seu ser — toda vontade genuína é uma faísca do despertar que convida você a trilhar o seu caminho com coragem.`,
      advice: `Respire fundo e dê o primeiro passo em direção ao seu objetivo hoje.`
    },
    'FOGO_TERRA': {
      main: `ancore a força do seu impulso criativo em bases firmes — toda vontade ardente precisa de um alicerce para maturar e produzir uma colheita real.`,
      advice: `Escreva um plano de ação simples e execute apenas a primeira tarefa.`
    },
    'FOGO_AR': {
      main: `permita que a faísca do entusiasmo se propague no sopro das ideias — as palavras certas trazem síntese ao aprendizado e ampliam a percepção.`,
      advice: `Escreva em poucas palavras o seu principal pensamento do momento.`
    },
    'FOGO_ÁGUA': {
      main: `equilibre o calor da sua vontade com o fluir da sua intuição — o reflexo das emoções na maré do sentir revela o tempo certo para agir.`,
      advice: `Beba um copo de água calmamente e observe o movimento ao seu redor.`
    },
    'TERRA_FOGO': {
      main: `sustente o seu alicerce com dedicação ativa — o calor da vontade traz vitalidade à matéria e impulsiona a maturação dos seus dons.`,
      advice: `Faça um alongamento rápido para trazer presença e vigor ao corpo.`
    },
    'TERRA_TERRA': {
      main: `permaneça firme em seu alicerce com paciência e realismo — respeitar o tempo de maturação interna garante estabilidade e segurança.`,
      advice: `Organize a sua mesa de trabalho para estruturar melhor as suas ideias.`
    },
    'TERRA_AR': {
      main: `traga clareza prática e ordem aos seus pensamentos — o sopro do aprendizado encontra utilidade concreta quando sintonizado com o realismo.`,
      advice: `Anote as três prioridades mais importantes e descarte o restante.`
    },
    'TERRA_ÁGUA': {
      main: `nutra o seu alicerce unindo persistência e sensibilidade — a colheita exige afeto e a compreensão profunda das marés da própria alma.`,
      advice: `Dedique cinco minutos para respirar calmamente em uma postura relaxada.`
    },
    'AR_FOGO': {
      main: `sintonize o fluxo do pensamento com o despertar da sua vontade — as palavras certas agem como faíscas que clareiam os rumos da mente.`,
      advice: `Compartilhe uma ideia construtiva com alguém de sua confiança.`
    },
    'AR_TERRA': {
      main: `busque a síntese entre a flexibilidade mental e a estabilidade prática — a clareza de percepção encontra sustentação no alicerce real da vida.`,
      advice: `Dê uma caminhada curta ao ar livre para clarear os seus pensamentos.`
    },
    'AR_AR': {
      main: `acolha o sopro da leveza e purifique as suas percepções — a síntese mental dissolve os ruídos cotidianos e traz um aprendizado revigorante.`,
      advice: `Feche os olhos e faça três respirações profundas focando no silêncio.`
    },
    'AR_ÁGUA': {
      main: `sintonize o fluxo das palavras com as correntezas da sua intuição — o reflexo do invisível na mente traz harmonia e paz ao seu sentir.`,
      advice: `Anote os seus sentimentos mais fortes e deixe-os fluir livremente.`
    },
    'ÁGUA_FOGO': {
      main: `resgate a faísca viva do seu propósito verdadeiro em suas marés de sensibilidade — o mergulho interno traz coragem para guiar a vontade.`,
      advice: `Lembre-se de um momento de superação pessoal para reacender sua força.`
    },
    'ÁGUA_TERRA': {
      main: `traga segurança e estabilidade às suas marés emocionais — o respeito à maturação interna constrói um alicerce firme na caminhada.`,
      advice: `Respire fundo, sinta o seu corpo e acalme a mente com simplicidade.`
    },
    'ÁGUA_AR': {
      main: `comunique as suas intuições de forma simples e dócil — o sopro do aprendizado traz síntese para compreender o reflexo das suas emoções.`,
      advice: `Reserve dez minutos para registrar as suas reflexões em um diário.`
    },
    'ÁGUA_ÁGUA': {
      main: `flua com leveza em suas marés de sensibilidade — o mergulho interno acalma as correntezas íntimas e revela o mistério do seu próprio sentir.`,
      advice: `Fique alguns minutos em silêncio para cultivar a sua paz interior.`
    }
  };

  const key = `${sunElement}_${moonElement}`;
  const selectedText = elementTexts[key] || elementTexts['TERRA_TERRA'];

  let aspectText = '';
  if (aspectDesc) {
    const descLower = aspectDesc.toLowerCase();
    if (descLower.includes('conjunção') || descLower.includes('conjuncao') || descLower.includes('impulso') || descLower.includes('autenticidade')) {
      aspectText = ` — nobreza e fusão: viva com autêntico impulso este momento em que a clareza se sintetiza com verdade.`;
    } else if (descLower.includes('oposição') || descLower.includes('oposicao') || descLower.includes('polaridades') || descLower.includes('equilíbrio') || descLower.includes('equilibrio')) {
      aspectText = ` — polaridades opostas: busque a dúvida reflexiva para equilibrar e integrar forças complementares na jornada.`;
    } else if (descLower.includes('quadratura') || descLower.includes('tensaõ') || descLower.includes('tensão') || descLower.includes('conflito') || descLower.includes('turva')) {
      aspectText = ` — paciência diante da tensão: abrigue os conflitos emocionais com calma, lembrando que a emoção acumulada nunca deve turvar a razão.`;
    } else if (descLower.includes('trígono') || descLower.includes('trigono') || descLower.includes('soluções') || descLower.includes('criatividade')) {
      aspectText = ` — harmonia e fluxo criativo: caminhe sob a luz das soluções fluidas e da clareza abundante.`;
    } else {
      aspectText = ` — sabedoria prática: esteja aberto para aprender e aplicar com simplicidade o que já foi assimilado com sabedoria prática.`;
    }
  }

  const finalMain = `${nameIntro}${selectedText.main}${aspectText} Conselho prático: ${selectedText.advice}`;

  return finalMain;
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

const getClientFallbackReport = (
  period: string, 
  logData?: string, 
  userName?: string
): string => {
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isCorrelation = period === 'correlation';
  const nameIntro = userName ? `${userName}, ` : '';

  if (isWeekly) {
    return `${nameIntro}ao compreender a jornada emocional descrita em seus registros recentes, identifico uma tônica de sentimentos voltada à busca por recolhimento e discernimento profundo. A sua linha de pensamento predominante girou em torno da necessidade de reorganizar dinâmicas internas e de restabelecer o equilíbrio mental diante de demandas externas. O padrão dominante que unifica esses dias revela uma tendência à oscilação silenciosa, alternando momentos de recolhimento criativo com picos de cansaço ou apreensão. Como amiga e mentora de sua caminhada, ressalto que a impaciência e a autocrítica excessiva são pontos de sombra que demandam sua gentil atenção e zelo protetor para que não sufoquem sua clareza. Em contrapartida, a sua capacidade de auto-observação honesta e a firmeza em acolher seus próprios ritmos funcionam como pontos luminosos de expansão e força. Sustente seus passos com coragem realista e resgate o centramento dócil para conduzir os próximos movimentos da alma.`;
  } else if (isMonthly) {
    return `${nameIntro}ao compreender os ciclos e as marés emocionais que atravessaram seus últimos 28 dias, percebo uma tônica de sentimentos voltada à necessidade de consolidação, aterramento e busca por estabilidade em meio às águas flutuantes da rotina. A sua linha de pensamento predominante concentrou-se na busca por clareza ética e organização de prioridades, tentando definir o que realmente possui valor essencial. O padrão dominante revela momentos de contenção estratégica alternados com uma sutil resistência a mudanças necessárias, o que pode gerar cansaço acumulado. Como sua amiga e mentora nessa jornada, destaco que a rigidez ou a hesitação diante do novo são pontos de sombra que requerem sua atenção vigilante para não represar o fluxo do seu desenvolvimento. Em contrapartida, a paciência madura e o respeito solene ao tempo de gestação dos seus ideais são pontos luminosos de grande expansão. A orientação para guiar seus passos é cultivar o centramento firme com maleabilidade sábia, agindo sempre sob a luz da clareza mental e da verdade interior.`;
  } else if (isCorrelation) {
    return `${nameIntro}as mandalas de cada mês revelam uma correspondência íntima entre os ciclos da natureza e sua energia interna. Use essa percepção como um mapa de autoconhecimento, aprendendo as horas certas de iniciar movimentos com coragem, as horas de perseverar em equilíbrio ou quando é o instante de apenas fruir com leveza.`;
  } else {
    return `${nameIntro}registrar e se escutar é um exercício contínuo de sabedoria e coragem silenciosa. O aprendizado desse período convida você a ancorar seu centro no presente absoluto, sustentando seus valores de maneira firme, mas mantendo a mente aberta e maleável diante das correntes da vida.`;
  }
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ticker para atualizar sincronia a cada minuto usando o offset do servidor
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(new Date(Date.now() + serverOffsetRef.current));
    }, 60000); // 1 minuto
    return () => clearInterval(ticker);
  }, []);

  const baseLunarData = useMemo(() => getLunarData(now), [now]);
  const todayCalendarDate = useMemo(() => now.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }), [now]);
  
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

  const generateReport = async (period: 'weekly' | 'monthly' | 'quarterly' | 'correlation') => {
    setIsReportLoading(period);
    
    // Helper para obter a data correta de cada log
    const getLogDate = (log: LogEntry): Date => {
      if (log.timestamp?.toDate) return log.timestamp.toDate();
      if (log.timestamp instanceof Date) return log.timestamp;
      if (typeof log.timestamp === 'string' || typeof log.timestamp === 'number') return new Date(log.timestamp);
      return new Date();
    };

    // Preparar dados atuais para o Gemini filtrando adequadamente por período
    let logData = "";
    if (period === 'weekly') {
      const nowTime = now.getTime();
      const sevenDaysAgoMs = nowTime - (7 * 24 * 60 * 60 * 1000);
      
      const weeklyLogs = allLogs.filter(log => {
        const logDate = getLogDate(log);
        return logDate.getTime() >= sevenDaysAgoMs && logDate.getTime() <= nowTime;
      });

      const finalWeeklyLogs = weeklyLogs.length > 0 
        ? weeklyLogs 
        : [...allLogs].sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime()).slice(0, 7).reverse();

      logData = finalWeeklyLogs.map(log => {
        const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || 'Neutro';
        const dateStr = getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Notas: "${log.note}"` : ''}`;
      }).join('\n');
    } else if (period === 'monthly') {
      const nowTime = now.getTime();
      const twentyNineDaysAgoMs = nowTime - (29 * 24 * 60 * 60 * 1000);
      
      const monthlyLogs = allLogs.filter(log => {
        const logDate = getLogDate(log);
        return logDate.getTime() >= twentyNineDaysAgoMs && logDate.getTime() <= nowTime;
      });

      const finalMonthlyLogs = monthlyLogs.length > 0 
        ? monthlyLogs 
        : [...allLogs].sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime()).slice(0, 29).reverse();

      logData = finalMonthlyLogs.map(log => {
        const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || 'Neutro';
        const dateStr = getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Notas: "${log.note}"` : ''}`;
      }).join('\n');
    } else if (period === 'quarterly') {
      const nowTime = now.getTime();
      const ninetyDaysAgoMs = nowTime - (90 * 24 * 60 * 60 * 1000);
      
      const quarterlyLogs = allLogs.filter(log => {
        const logDate = getLogDate(log);
        return logDate.getTime() >= ninetyDaysAgoMs && logDate.getTime() <= nowTime;
      });

      const finalQuarterlyLogs = quarterlyLogs.length > 0 
        ? quarterlyLogs 
        : [...allLogs].sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime()).slice(0, 90).reverse();

      logData = finalQuarterlyLogs.map(log => {
        const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || 'Neutro';
        const dateStr = getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Notas: "${log.note}"` : ''}`;
      }).join('\n');
    } else {
      // correlation: use last 3 cycles of 29 days (87 days)
      const nowTime = now.getTime();
      const eightySevenDaysAgoMs = nowTime - (87 * 24 * 60 * 60 * 1000);
      
      const correlationLogs = allLogs.filter(log => {
        const logDate = getLogDate(log);
        return logDate.getTime() >= eightySevenDaysAgoMs && logDate.getTime() <= nowTime;
      });

      const finalCorrelationLogs = correlationLogs.length > 0 
        ? correlationLogs 
        : [...allLogs].sort((a, b) => getLogDate(b).getTime() - getLogDate(a).getTime()).slice(0, 87).reverse();

      logData = finalCorrelationLogs.map(log => {
        const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name || 'Neutro';
        const dateStr = getLogDate(log).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `Data: ${dateStr}, Dia Lunar ${log.lunarDay}, Ciclo ${log.cycleId}: Sentimento ${emotion} (Intensidade ${log.intensity}/5)${log.note ? `, Notas: "${log.note}"` : ''}`;
      }).join('\n');
    }

    // Contexto de meses anteriores para continuidade e padrões
    const previousLogsData = allLogs
      .filter(log => log.cycleId < lunarData.cycleId)
      .slice(-40) // Ajustado para incluir notas sem exceder limites práticos
      .map(log => `Ciclo ${log.cycleId}, Dia ${log.lunarDay}: ${EMOTIONS.find(e => e.id === log.emotionId)?.name} (${log.intensity})${log.note ? ` - Nota: ${log.note}` : ''}`)
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
               4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos sete dias" ou "ao avaliar seus sentimentos". Comece o texto chamando a usuária pelo nome "${formattedName || 'Viajante'}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
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
               4. ATENÇÃO ABSOLUTA: É estritamente proibido usar a palavra ou variação de "ao olhar seus últimos vinte e nove dias", "ao olhar seu ciclo" ou "ao avaliar seus sentimentos/registros". Comece o texto chamando a usuária pelo nome "${formattedName || 'Viajante'}" no início exato para trazer proximidade confiável (ex: "Nome, ...").
               5. Destaque tanto os pontos negativos que requerem atenção da usuária (vulnerabilidades, sombras ou resistências que a paralisam) quanto os pontos positivos que geram expansão de consciência.
               6. Apresente uma síntese clara dos pontos recorrentes ao longo do período de 29 dias, ressaltando o que precisa ser finalizado.
               7. Gere obrigatoriamente uma lista de tarefas estruturada e clara ao final, classificada exatamente nestas três classes de forma limpa:
                  - Iniciado: [tarefas iniciadas no período]
                  - Dar continuidade: [atividades ou processos para dar continuidade]
                  - Finalizado: [processos ou tarefas finalizadas ou a finalizar neste ciclo]
               8. NÃO se restrinja a 4 ou 6 linhas. Desenvolva um texto reflexivo, consistente e profundo, seguido de forma espaçada pela lista de tarefas.
               9. Formato: O texto de análise deve ser justificado, seguido pela seção da lista de tarefas estruturada de forma limpa e visível.`;
    } else if (period === 'correlation') {
      prompt = `Realize uma análise de correlação entre as fases da lua e os padrões de sentimentos/dados inseridos pela usuária.
               DADOS DE CORRELAÇÃO DOS ÚLTIMOS 3 CICLOS (de 29 dias cada):\n${correlationData || 'Nenhum dado acumulado disponível ainda.'}\n
               HISTÓRICO INTEGRADO:\n${previousLogsData || ''}\n${logData || ''}
               
               TAREFA EXCLUSIVA:
               1. Faça uma correlação nítida e direta das fases da Lua (Nova, Crescente, Cheia, Minguante) com a repetição de padrões de sentimentos e dados inseridos pela usuária.
               2. Destaque obrigatoriamente um sentimento prioritário identificado em cada uma das quatro fases lunares considerando os 3 últimos ciclos lunares de 29 dias.
               3. Use uma linguagem acolhedora, fraterna, dócil e sábia de uma mentora sábia (Hekat é do gênero feminino). Evite superlativos sintéticos.
               4. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${formattedName || 'Viajante'}" no início exato para trazer proximidade de forma natural (ex: "Nome, ...").
               5. Formato: Um texto corrido, integrated e orgânico de forma fluida.`;
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
               7. ATENÇÃO ABSOLUTA: Comece o texto chamando a usuária pelo nome "${formattedName || 'Viajante'}" no início exato. Não use variações de "ao olhar seu trimestre" ou "ao avaliar seus sentimentos".
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
      const text = data.text;
      
      console.log(`Relatório ${period} recebido:`, text);
      setReports(prev => {
        const updated = { 
          ...prev, 
          [period]: { 
            text: text || "Os astros não revelaram nada hoje.",
            logs: { ...logs },
            meta: { solarOffset, lunarData: serializeLunarData(lunarData) }
          } 
        };

        if (currentUser && db) {
          const reportDocRef = doc(db, 'users', currentUser.uid, 'reports', period);
          setDoc(reportDocRef, {
            text: text || "Os astros não revelaram nada hoje.",
            logs: { ...logs },
            meta: { solarOffset, lunarData: serializeLunarData(lunarData) },
            updatedAt: serverTimestamp()
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reports/${period}`));
        }

        return updated;
      });
    } catch (error: any) {
      console.error(`Erro ao gerar relatório ${period}:`, error);
      
      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';
      const fallbackText = getClientFallbackReport(period, logData, formattedName);
      
      setReports(prev => {
        const updated = { 
          ...prev, 
          [period]: { 
            text: fallbackText,
            logs: { ...logs },
            meta: { solarOffset, lunarData: serializeLunarData(lunarData) }
          } 
        };

        if (currentUser && db) {
          const reportDocRef = doc(db, 'users', currentUser.uid, 'reports', period);
          setDoc(reportDocRef, {
            text: fallbackText,
            logs: { ...logs },
            meta: { solarOffset, lunarData: serializeLunarData(lunarData) },
            updatedAt: serverTimestamp()
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reports/${period}`));
        }

        return updated;
      });
    } finally {
      setIsReportLoading(null);
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
    const cacheKey = `sun_${sunIdx}_moon_${moonIdx}_name_${formattedName}`;
    
    delete oracleCache.current[cacheKey];
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
    if (!db) {
      console.error("Firestore is not initialized.");
      return;
    }
    setIsSavingName(true);
    try {
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
        setLoginError("Este domínio ('" + window.location.hostname + "') não está autorizado no console do Firebase.");
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
    if (!db) {
      console.warn("Hekat: Firestore is not initialized. Operating in local-only mode.");
      return;
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
        const normalizedEmotionId = rawEmotionId === 'clarity' ? 'clareza' : rawEmotionId;
        
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
          date: logDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
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
      const cacheKey = `sun_${sunIdx}_moon_${moonIdx}_name_${formattedName}`;

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
      if (dist === 1 || dist === 2) aspect = { name: 'Sextil', desc: 'Estar aberto para aprender e aplicar o que já foi assimilado em experiências.' };
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
    { id: 'mandala', title: 'Mandala Lunar', icon: 'CalendarDays', isOpen: true, isMinimized: false, zIndex: 105, pos: { x: 0, y: 56 } },
    { id: 'journal', title: 'Astromemorias', icon: 'MessageCircle', isOpen: false, isMinimized: false, zIndex: 104, pos: { x: 0, y: 56 } },
    { id: 'oraculo', title: 'Oráculo Diário', icon: 'Sparkles', isOpen: false, isMinimized: false, zIndex: 103, pos: { x: 0, y: 56 } },
    { id: 'calendar', title: 'Calendário do Ciclo', icon: 'CalendarHeart', isOpen: false, isMinimized: false, zIndex: 100, pos: { x: 0, y: 56 } },
    { id: 'reports', title: 'Relatórios', icon: 'FileBarChart', isOpen: false, isMinimized: false, zIndex: 101, pos: { x: 0, y: 56 } },
    { id: 'history', title: 'Histórico', icon: 'History', isOpen: false, isMinimized: false, zIndex: 102, pos: { x: 0, y: 56 } },
    { id: 'guide', title: 'Informativo App', icon: 'Info', isOpen: false, isMinimized: false, zIndex: 106, pos: { x: 0, y: 56 } },
  ]);

  // Helper to center a window in the viewport
  const getWindowCenter = (id: string) => {
    if (desktopRef.current) {
      const dw = desktopRef.current.offsetWidth;
      const dh = desktopRef.current.offsetHeight;
      const isMobile = dw < 768;
      
      if (isMobile) {
        return { x: 0, y: 56 };
      }
      
      const ww = id === 'history' || id === 'calendar' ? 600 : id === 'mandala' ? 420 : 500;
      const actualW = Math.min(ww, dw * 0.95);
      const topOffset = 56;
      
      return { x: Math.max(0, (dw - actualW) / 2), y: topOffset };
    }
    return { x: 0, y: 56 };
  };

  // Center all open windows when user logs in or app is ready with a smooth slide effect, and adjust on resize
  useEffect(() => {
    let timer: any = null;
    if (currentUser && !isAuthLoading) {
      timer = setTimeout(() => {
        setWindows(prev => prev.map(w => {
          if (w.isOpen && !w.isMinimized) {
            return { ...w, pos: getWindowCenter(w.id) };
          }
          return w;
        }));
      }, 300);
    }

    const handleResize = () => {
      setWindows(prev => prev.map(w => {
        if (w.isOpen && !w.isMinimized) {
          return { ...w, pos: getWindowCenter(w.id) };
        }
        return w;
      }));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [currentUser, isAuthLoading]);

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
    setAllLogs(prev => [...prev.filter(l => !(l.cycleId === activeCycleId && l.lunarDay === selectedDay)), newEntry]);
    
    if (currentUser) {
      if (!db) {
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

  const handleDeleteLog = async (dayToDelete: number) => {
    const activeCycleId = viewingCycleId || lunarData.cycleId;
    const logId = `cycle_${activeCycleId}_day_${dayToDelete}`;

    // Atualização otimista do estado local
    setAllLogs(prev => prev.filter(l => !(l.cycleId === activeCycleId && l.lunarDay === dayToDelete)));

    if (currentUser) {
      if (db) {
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
          className={`h-screen w-screen flex flex-col items-center justify-center ${isNight ? 'night-bg text-white' : 'day-bg text-slate-900'} overflow-hidden p-6 text-center z-[5000]`}
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
              <div className="relative mb-12">
                <motion.div 
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(65,105,225,0.2)", "0 0 50px rgba(65,105,225,0.4)", "0 0 20px rgba(65,105,225,0.2)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-full flex items-center justify-center overflow-hidden relative border-4 border-[#BF8A10]/20 p-0"
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
              <div className="space-y-2 mb-12">
                <h1 className="text-5xl sm:text-6xl font-black text-[#BF8A10] tracking-tighter">Hekat</h1>
                <h2 className="text-sm sm:text-base font-bold text-[#BF8A10] uppercase tracking-[0.4em]">ASTROMEMORIAS</h2>
                <div className="w-12 h-0.5 bg-[#BF8A10]/30 mx-auto mt-4" />
              </div>
              
              <div className="max-w-[280px] mb-12">
                <p className={`${isNight ? 'text-indigo-200/70' : 'text-[#888888]'} text-[13px] sm:text-sm leading-relaxed font-medium`}>
                  Sintonize suas emoções com os ciclos lunares e reconheça seu padrão emocional.
                </p>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full group relative flex items-center justify-center gap-3 px-8 py-5 bg-[#4169E1] hover:bg-[#3158CF] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    {isLoggingIn ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <LogIn size={18} />
                    )}
                    <span>{isLoggingIn ? 'Invocando Ritual...' : 'Entrar no Portal'}</span>
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
              <div className="hidden lg:flex items-center gap-1.5 text-slate-100 font-bold text-[11px]">
                  <span className="tabular-nums bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{todayCalendarDate}</span>
                  <span className="tabular-nums bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 text-indigo-300">{now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

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
        <div className="relative w-full h-full p-0 sm:p-4">
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
                        <span className="text-[11px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-widest block">{lunarData.getDateForDay(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
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

                {/* Seletor de Ciclo para Visualização */}
                <div className="flex items-center gap-1.5 bg-indigo-950/40 p-1 rounded-xl border border-white/10 mb-3 shadow-lg backdrop-blur-sm">
                  <button 
                    onClick={() => setViewingCycleId(prev => Math.max(1, (prev || lunarData.cycleId) - 1))}
                    className="p-1 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors active:scale-90"
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
                  >
                    <ChevronRight size={12} />
                  </button>
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
                        <p id="oracle-text-container" className="text-sm sm:text-base leading-relaxed text-white font-medium text-justify whitespace-pre-line max-w-[90%] sm:max-w-[80%] pb-4">
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
                                {item.id === 'weekly' ? 'Análise de Dados 7 dias' : item.id === 'monthly' ? 'Análise de Dados 28 dias' : item.id === 'correlation' ? 'Ritmo Ciclos & Fases' : 'Análise de Dados 90 dias'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => generateReport(item.id as any)}
                            disabled={!!isReportLoading}
                            className="p-2.5 sm:p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 font-black"
                          >
                            {isReportLoading === item.id ? <RotateCw className="animate-spin" size={14} /> : <Activity size={14} />}
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
                              <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[11px] sm:text-[13px] leading-relaxed text-white font-medium italic text-justify whitespace-pre-line"
                              >
                                {reports[item.id as keyof typeof reports].text}
                              </motion.p>
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
                  <h2 className="text-xl font-serif italic font-medium text-[#4169E1]">Calendário do Ciclo</h2>
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
                        {lunarData.getDateForDay(selectedDay).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
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
              </div>
            ) : null;

            return (
              <Window 
                key={win.id} 
                win={win} 
                desktopRef={desktopRef} 
                topZ={topZ} 
                isNight={isNight}
                toggleWindow={toggleWindow} 
                updateWindowPos={updateWindowPos}
                width={win.id === 'history' || win.id === 'calendar' ? "600px" : win.id === 'mandala' ? "420px" : "500px"}
                isMobile={isMobile}
              >
                {Component}
              </Window>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around z-[1500] border-t pointer-events-auto transition-colors duration-1000 ${
          isNight ? 'glass bg-slate-950/80 border-white/5 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]' : 'glass bg-white/85 border-indigo-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]'
        }`}>
          {windows.filter(win => win.id !== 'guide').map(win => {
            const isActive = win.isOpen && !win.isMinimized;
            return (
              <button
                key={win.id}
                onClick={() => {
                  toggleWindow(win.id, isActive ? 'minimize' : 'focus');
                }}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90"
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600/20 text-indigo-300 scale-110' 
                    : 'text-slate-400 hover:text-indigo-300'
                }`}>
                  <LucideIcon name={win.icon} size={20} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${
                  isActive ? 'text-indigo-300' : 'text-slate-500'
                }`}>
                  {win.title === 'Mandala Lunar' ? 'Mandala' : win.title === 'Astromemorias' ? 'Diário' : win.title === 'Oráculo Diário' ? 'Oráculo' : win.title === 'Relatórios' ? 'Relatórios' : win.title === 'Histórico' ? 'Histórico' : win.title === 'Calendário do Ciclo' ? 'Calendário' : 'Informativo'}
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
                <p className="text-xs text-indigo-200/60 leading-relaxed font-semibold text-center">
                  O Oráculo e seus Relatórios usarão esta identificação<br />
                  para guiar você neste caminho de Auto observação<br />
                  acompanhando os Ciclos Lunares.
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
    </motion.div>
   )}
  </AnimatePresence>
</>
  );
}
