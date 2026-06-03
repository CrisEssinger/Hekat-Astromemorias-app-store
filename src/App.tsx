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
  User as UserIcon,
  Meh,
  Anchor,
  Cloud,
  LayoutDashboard,
  CalendarDays,
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
  Radio
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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
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
  Radio
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
  
  // Âncoras Astronômicas Reais para 2026 usando Date.UTC para compatibilidade universal 
  // e evitar falhas de interpretação de fuso/String em navegadores Mobile antigos ou Safari.
  const referenceDate = new Date(Date.UTC(2026, 4, 16, 0, 0, 0)); // 16 de Maio de 2026
  
  // Ponto de Referência Zodiacal (Lua): Calibrada com precisão para a Lua a 17 graus de Sagitário em 31 de Maio de 2026 às 23:05:05 UTC
  const zodiacAnchorDate = new Date(Date.UTC(2026, 3, 21, 23, 2, 51));
  
  // Ponto de Referência Zodiacal (Sol): Calibrada com precisão para o Sol a 10 graus de Gêmeos em 31 de Maio de 2026 às 23:05:05 UTC
  const sunAnchorDate = new Date(Date.UTC(2026, 2, 21, 22, 37, 16));
  
  const diffInMs = now.getTime() - referenceDate.getTime();
  const diffInDays = isNaN(diffInMs) ? 0 : diffInMs / (1000 * 60 * 60 * 24);
  
  // Idade da Lua (dias desde a última Lua Nova)
  const LUNAR_MONTH = 29.53059;
  let moonAge = diffInDays % LUNAR_MONTH;
  if (moonAge < 0) moonAge += LUNAR_MONTH;
  if (isNaN(moonAge)) moonAge = 0;
  
  const moonPhaseAngle = (moonAge / LUNAR_MONTH) * 2 * Math.PI;
  const illumination = isNaN(moonPhaseAngle) ? 0 : (1 - Math.cos(moonPhaseAngle)) / 2;
  
  // Mapeamento proporcional de 29.53 dias para 28 segmentos da mandala
  const mandalaDayFloat = (moonAge / LUNAR_MONTH) * 28;
  const mandalaDay = isNaN(mandalaDayFloat) ? 1 : Math.min(28, Math.max(1, Math.floor(mandalaDayFloat) + 1));
  
  const getSunSignFloat = (dateVal: Date) => {
    const timestamp = (dateVal && !isNaN(dateVal.getTime())) ? dateVal.getTime() : now.getTime();
    const d = (timestamp - sunAnchorDate.getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(d)) return 0;
    let pos = (d * 360 / 365.2422) / 30; // 30 graus por signo
    pos = pos % 12;
    if (pos < 0) pos += 12;
    return isNaN(pos) ? 0 : pos;
  };
  
  const getMoonSignFloat = (dateVal: Date) => {
    const timestamp = (dateVal && !isNaN(dateVal.getTime())) ? dateVal.getTime() : now.getTime();
    const d = (timestamp - zodiacAnchorDate.getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(d)) return 0;
    let pos = (d * 360 / 27.32158) / 30; // 30 graus por signo (ciclo tropical lunar)
    pos = (pos + 3) % 12; // Começou em Câncer (index 3)
    if (pos < 0) pos += 12;
    return isNaN(pos) ? 0 : pos;
  };
  
  const sunSignFloat = getSunSignFloat(now);
  const cycleId = isNaN(diffInDays) ? 1 : Math.floor(diffInDays / LUNAR_MONTH) + 2;
  
  const safeDiffInDays = isNaN(diffInDays) ? 0 : diffInDays;
  const cycleStartDate = new Date(referenceDate.getTime() + Math.floor(safeDiffInDays / LUNAR_MONTH) * LUNAR_MONTH * 24 * 60 * 60 * 1000);
  const cycleEndDate = new Date(referenceDate.getTime() + (Math.floor(safeDiffInDays / LUNAR_MONTH) + 1) * LUNAR_MONTH * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : "01/01";
  
  return {
    day: mandalaDay,
    cycleId: cycleId,
    illumination: isNaN(illumination) ? 0 : illumination * 100,
    cycleRange: `${formatDate(cycleStartDate)} a ${formatDate(cycleEndDate)}`,
    getSignForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const ageForDay = ((safeDay - 1) / 28) * LUNAR_MONTH;
      const dateForDay = new Date(cycleStartDate.getTime() + ageForDay * 24 * 60 * 60 * 1000);
      const resVal = Math.floor(getMoonSignFloat(dateForDay)) % 12;
      return isNaN(resVal) ? 0 : resVal;
    },
    getMoonSignFloatForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const ageForDay = ((safeDay - 1) / 28) * LUNAR_MONTH;
      const dateForDay = new Date(cycleStartDate.getTime() + ageForDay * 24 * 60 * 60 * 1000);
      const resVal = getMoonSignFloat(dateForDay);
      return isNaN(resVal) ? 0 : resVal;
    },
    moonSignFloat: getMoonSignFloat(now),
    sunSignFloat: sunSignFloat,
    sunSignIndex: isNaN(sunSignFloat) ? 0 : Math.floor(sunSignFloat) % 12,
    cycleName: getZodiacSignSafely(Math.floor(getSunSignFloat(cycleStartDate)) % 12).name,
    getDateForDay: (day: number) => {
      const safeDay = isNaN(day) ? 1 : day;
      const ageForDay = ((safeDay - 1) / 28) * LUNAR_MONTH;
      return new Date(cycleStartDate.getTime() + ageForDay * 24 * 60 * 60 * 1000);
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

const MiniMandala = ({ logs, lunarData, size = 180, isNight = true, solarOffset = 0, angleStep = (2 * Math.PI) / 28 }: { logs: Record<number, LogEntry>, lunarData: any, size?: number, isNight?: boolean, solarOffset?: number, angleStep?: number }) => {
  const radius = (size / 350) * 140;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const renderSegments = () => {
    const localSegments = [];
    for (let i = 0; i < 28; i++) {
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
  const sun = sunSignName || 'Sol';
  const moon = moonSignName || 'Lua';
  const tonica = philosophicalPhrase ? `"${philosophicalPhrase}"` : 'da quietude e do autocuidado';
  const nameIntro = userName ? `${userName}, ` : '';
  const aspectSuffix = aspectDesc ? ` Como postura de vida, a atitude essencial neste momento pede para ${aspectDesc.charAt(0).toLowerCase() + aspectDesc.slice(1)}` : '';

  const messages = [
    `${nameIntro}há um convite transcendente ao recolhimento e à introspecção: o cosmos pulsa em sintonia com os novos começos. A tônica pede para sintonizar a força pura da sua intenção — dando o primeiro passo com postura resoluta e coragem intocável.${aspectSuffix}`,
    `${nameIntro}na quietude do agora, a tônica de sua essência convida você a silenciar os ecos do exterior. A orientação definitiva é ancorar seu centro na permanência pacífica do presente: sustente sua integridade diante de qualquer impermanência da jornada.${aspectSuffix}`,
    `${nameIntro}acolha as transições da mente e do coração com a flexibilidade das águas tranquilas: a sabedoria reside em fluir com suavidade, adaptando seus passos diante dos obstáculos e mantendo inteira sua bússola de vida.${aspectSuffix}`,
    `Que bom ter você aqui${userName ? `, ${userName}` : ''}. Neste clima de clareza essencial: a postura mais fecunda é receber as circunstâncias exatamente como se revelam, pois a estabilidade verdadeira nasce da aceitação desperta e lúcida.${aspectSuffix}`
  ];

  const hashString = `${sun}-${moon}-${tonica}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0; 
  }
  const index = Math.abs(hash) % messages.length;
  return messages[index];
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
    return `${nameIntro}ao avaliar seus sentimentos nos últimos dias, vemos como você navegou por suas marés internas. A orientação para os próximos dias é cultivar a presença calma e o desapego das expectativas exageradas. Seja forte para dar novos passos ou recuar, agindo de acordo com a sabedoria de cada instante.`;
  } else if (isMonthly) {
    return `${nameIntro}observar como suas emoções mudaram ao longo das fases mostra que sua sensibilidade é um guia constante. A reflexão deste ciclo convida você a aceitar as transições com a flexibilidade de quem acolhe o vento, compreendendo que o recolhimento e o desabrochar são faces da mesma impermanência.`;
  } else if (isCorrelation) {
    return `${nameIntro}as mandalas de cada mês revelam uma correspondência íntima entre os ciclos da natureza e sua energia interna. Use essa percepção como um mapa de autoconhecimento, aprendendo as horas certas de iniciar movimentos com coragem, as horas de perseverar em equilíbrio ou quando é o instante de apenas fruir com leveza.`;
  } else {
    return `${nameIntro}registrar e se escutar é um exercício contínuo de sabedoria e coragem silenciosa. O aprendizado desse período convida você a ancorar seu centro no presente absoluto, sustentando seus valores de maneira firme, mas mantendo a mente aberta e maleável diante das correntes da vida.`;
  }
};

export default function App() {
  console.log("Hekat App mounting...");
  const desktopRef = useRef<HTMLDivElement>(null);
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

  // Ticker para atualizar sincronia a cada minuto
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(new Date());
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
    if (!currentUser || allLogs.length === 0 || migrationInProgress.current) return;
    
    // Referência astronômica universal (16 de Maio de 2026 UTC)
    const refDateMs = Date.UTC(2026, 4, 16, 0, 0, 0);
    const LUNAR_MONTH = 29.53059;
    
    // Identificar logs que estão no ciclo errado baseado na data real ou matemática de recalibração
    const logsToFix = allLogs.filter(log => {
      if (!log.id) return false;
      
      const logTime = log.timestamp?.toDate?.()?.getTime() || 0;
      
      // Heurística Hekat: Se o log diz ser Dia 28+ do Ciclo 2, mas estamos no início do Ciclo 2,
      // é uma memória do Ciclo 1 que foi deslocada.
      const isHighDayInNewCycle = (log.cycleId === 2 && log.lunarDay >= 26 && lunarData.day <= 5);
      
      if (isHighDayInNewCycle) return true;
      if (!logTime) return false;
      
      // Determinação universal de ciclo correto usando a fórmula astronômica do app
      const diffInDays = (logTime - refDateMs) / (1000 * 60 * 60 * 24);
      const shouldBeCycle = isNaN(diffInDays) ? 1 : Math.floor(diffInDays / LUNAR_MONTH) + 2;
      
      return log.cycleId !== shouldBeCycle;
    });
    
    if (logsToFix.length > 0) {
      migrationInProgress.current = true;
      console.log(`Hekat: Recalibrando ${logsToFix.length} memórias.`);
      
      const migrate = async () => {
        try {
          for (const log of logsToFix) {
            const logTime = log.timestamp?.toDate?.()?.getTime() || 0;
            
            // Determinar o ciclo correto:
            let newCycleId: number;
            
            if (log.cycleId === 2 && log.lunarDay >= 26 && lunarData.day <= 5) {
              newCycleId = 1;
            } else if (logTime) {
              const diffInDays = (logTime - refDateMs) / (1000 * 60 * 60 * 24);
              newCycleId = isNaN(diffInDays) ? 1 : Math.floor(diffInDays / LUNAR_MONTH) + 2;
            } else {
              continue; // Não mexe se não tiver certeza
            }
            
            const logRef = doc(db, 'users', currentUser.uid, 'logs', log.id!);
            await updateDoc(logRef, {
              cycleId: newCycleId,
              userId: currentUser.uid,
              intensity: Number(log.intensity),
              lunarDay: Number(log.lunarDay),
              emotionId: String(log.emotionId)
            });
          }
        } catch (e) {
          console.error("Erro na restauração Hekat:", e);
        } finally {
          // Permitimos novas verificações se novos logs chegarem
          migrationInProgress.current = false;
        }
      };
      
      migrate();
    }
  }, [currentUser, allLogs, lunarData.day]);

  // PagBank State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Limpeza automática da mandala no Dia 1 do ciclo (Desativada a destruição, mantida apenas a lógica de UI)
  useEffect(() => {
    if (lunarData.day === 1) {
      // Apenas garantimos que o seletor de visualização aponte para o ciclo atual no dia 1
      if (viewingCycleId !== null && viewingCycleId !== lunarData.cycleId) {
         // Se o usuário já mudou de ciclo cronológico, mas o seletor estava no passado, 
         // não forçamos a mudança para não interromper a navegação, mas se estiver "nulo" ou "preso", sincronizamos.
      }
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
    
    // Preparar dados atuais para o Gemini
    const logData = (Object.entries(logs) as [string, LogEntry][]).map(([day, log]) => {
      const emotion = EMOTIONS.find(e => e.id === log.emotionId)?.name;
      return `Dia ${day}: ${emotion} (Intensidade ${log.intensity}${log.note ? `, Nota: ${log.note}` : ''})`;
    }).join('\n');

    // Contexto de meses anteriores para continuidade e padrões
    const previousLogsData = allLogs
      .filter(log => log.cycleId < lunarData.cycleId)
      .slice(-40) // Ajustado para incluir notas sem exceder limites práticos
      .map(log => `Ciclo ${log.cycleId}, Dia ${log.lunarDay}: ${EMOTIONS.find(e => e.id === log.emotionId)?.name} (${log.intensity})${log.note ? ` - Nota: ${log.note}` : ''}`)
      .join('\n');

    // Agrupar todos os logs (atuais + anteriores) por fase lunar para correlação de padrões através das mandalas sucessivas
    const currentLogList = (Object.entries(logs) as [string, LogEntry][]).map(([day, log]) => ({
      ...log,
      lunarDay: parseInt(day),
    }));
    const combinedLogs = [...allLogs.filter(l => l.cycleId !== lunarData.cycleId), ...currentLogList];
    
    const getPhaseName = (day: number) => {
      const ph = LUNAR_PHASES.slice().reverse().find(p => day >= p.startDay) || LUNAR_PHASES[0];
      return ph.name;
    };

    const phaseGroups: Record<string, Record<string, number>> = {};
    combinedLogs.forEach(l => {
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

    let prompt = "";
    if (period === 'weekly') {
      prompt = `Analise os últimos registros e forneça um relatório semanal conciso focando em tendências e um conselho místico de postura. Máximo 4 linhas.`;
    } else if (period === 'monthly') {
      prompt = `Realize uma síntese deste ciclo lunar (Astromemória). 
               DADOS ATUAIS:\n${logData || 'Nenhum dado atual.'}\n
               HISTÓRICO RECENTE:\n${previousLogsData || 'Primeiro ciclo registrado.'}\n
               TAREFA: Compare o ciclo atual com o histórico. Identifique estados emocionais que se repetem (padrões). 
               Sintetize como esses padrões moldam a realidade da usuária, dando continuidade à avaliação do mês passado. Máximo 6 linhas.`;
    } else if (period === 'correlation') {
      prompt = `Analise a correlação das fases da lua com as emoções da usuária com base nas mandalas mensais. Padrões acumulados:\n${correlationData}\nMáximo 6 linhas.`;
    } else {
      prompt = `Realize uma análise profunda desta 'Estação da Alma' (Trimestre).
                HISTÓRICO E CICLO ATUAL:\n${previousLogsData}\n${logData}\n
                TAREFA: Identifique pontuações de estados emocionais que se repetem nos últimos 3 meses. 
                Sintetize esses padrões recorrentes e ofereça uma bússola estratégica centrada em evolução pessoal. Máximo 8 linhas.`;
    }

    try {
      console.log(`Gerando relatório ${period} com Gemini...`);
      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';

      const response = await fetch("/api/reports", {
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
      setReports(prev => ({ 
        ...prev, 
        [period]: { 
          text: text || "Os astros não revelaram nada hoje.",
          logs: { ...logs }, // Captura o estado atual da mandala
          meta: { solarOffset, lunarData: { ...lunarData } } // Captura metadados para renderização histórica
        } 
      }));
    } catch (error: any) {
      console.error(`Erro ao gerar relatório ${period}:`, error);
      
      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';
      const fallbackText = getClientFallbackReport(period, logData, formattedName);
      
      setReports(prev => ({ 
        ...prev, 
        [period]: { 
          text: fallbackText,
          logs: { ...logs }, // Captura o estado atual da mandala mesmo se no fallback
          meta: { solarOffset, lunarData: { ...lunarData } } // Captura metadados para renderização histórica mesmo no fallback
        } 
      }));
    } finally {
      setIsReportLoading(null);
    }
  };
  const isNight = true;

  const [selectedDay, setSelectedDay] = useState(lunarData.day);
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
    const moonIdx = lunarData.getSignForDay(selectedDay);
    const cacheKey = `sun_${sunIdx}_moon_${moonIdx}`;
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
  const [showDomainHelp, setShowDomainHelp] = useState(false);

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
        setShowDomainHelp(true);
      } else {
        setLoginError("Não foi possível abrir o portal. Erro: " + (err.message || "Conexão instável"));
        // Se parecer um erro de configuração de origem/OAuth do Firebase, sugere ajuda
        if (err.message && (err.message.includes('auth') || err.message.includes('permission') || err.message.includes('API'))) {
          setShowDomainHelp(true);
        }
      }
    }
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim() || !currentUser) return;
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
          if (auth.currentUser) {
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
        const isMobile = window.innerWidth < 768;
        toggleWindow(isMobile ? 'mandala' : 'journal', 'open');
      }
    }
  }, [currentUser, isAuthLoading]);

  const handleCheckout = async () => {
    if (!currentUser) return;
    setIsProcessingPayment(true);
    try {
      const response = await fetch("/api/checkout", {
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
        if (isFirstEver) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, { hasSeenGuide: true, uid: currentUser.uid, email: currentUser.email, updatedAt: serverTimestamp() }, { merge: true }).catch(e => console.error("Erro ao persistir guia:", e));
        }
        return;
      }

      const timer = setTimeout(() => {
        if (isFirstEver) {
          toggleWindow('guide', 'open');
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, { hasSeenGuide: true, uid: currentUser.uid, email: currentUser.email, updatedAt: serverTimestamp() }, { merge: true }).catch(e => console.error("Erro ao persistir guia:", e));
        } else {
          toggleWindow('journal', 'open');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isAuthLoading, userData]);

  // Sync Logs with Firebase
  useEffect(() => {
    if (!currentUser) { setAllLogs([]); return; }
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
        
        logsArray.push({
          id: doc.id,
          emotionId: normalizedEmotionId,
          intensity: Number(data.intensity) || 3,
          note: data.note || "",
          cycleId: isNaN(cycleIdNum) ? 0 : cycleIdNum,
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

  // Oracle Fetch Logic with Ref Caching and Robust Error Detection
  useEffect(() => {
    let isMounted = true;
    const fetchOracle = async () => {
      const sunIdx = lunarData.sunSignIndex;
      const moonIdx = selectedDay === lunarData.day 
        ? Math.floor(lunarData.moonSignFloat) % 12 
        : lunarData.getSignForDay(selectedDay);
      const cacheKey = `sun_${sunIdx}_moon_${moonIdx}`;

      if (oracleCache.current[cacheKey]) {
        setOracleText(oracleCache.current[cacheKey]);
        return;
      }

      setIsOracleLoading(true);
      const sun = getZodiacSignSafely(sunIdx);
      const moon = getZodiacSignSafely(moonIdx);
      const phrase = (moonIdx >= 0 && moonIdx < PHILOSOPHICAL_QUOTES.length) ? PHILOSOPHICAL_QUOTES[moonIdx] : PHILOSOPHICAL_QUOTES[0];
      
      const rawName = userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
      const formattedName = rawName ? rawName.trim() : '';

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

        const response = await fetch("/api/oracle", {
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
  }, [selectedDay, lunarData.sunSignIndex, Math.floor(lunarData.moonSignFloat) % 12, oracleTrigger]);

  const [topZ, setTopZ] = useState(100);

  // Constants for geometry
  const angleStep = (2 * Math.PI) / 28;
  const zodAngleStep = (2 * Math.PI) / 12;
  const solarOffset = (lunarData.sunSignFloat) * zodAngleStep;

  // Window System State
  const [windows, setWindows] = useState<WindowData[]>([
    { id: 'mandala', title: 'Mandala Lunar', icon: 'CalendarDays', isOpen: true, isMinimized: false, zIndex: 105, pos: { x: 0, y: 56 } },
    { id: 'journal', title: 'Astromemorias', icon: 'MessageCircle', isOpen: false, isMinimized: false, zIndex: 104, pos: { x: 0, y: 56 } },
    { id: 'oraculo', title: 'Oráculo Diário', icon: 'Sparkles', isOpen: false, isMinimized: false, zIndex: 103, pos: { x: 0, y: 56 } },
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
      
      const ww = id === 'history' ? 600 : id === 'mandala' ? 420 : 500;
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
    return Array.from({ length: 28 }, (_, i) => {
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

    for (let i = 0; i < 28; i++) {
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

  return (
    <>
      <AnimatePresence>
        {mountError ? (
          <div className="h-screen w-screen flex items-center justify-center bg-rose-50 p-6 text-center z-[9999]" key="error">
           <div className="max-w-sm">
             <h2 className="text-rose-500 font-black uppercase tracking-widest mb-4">Erro de Inicialização</h2>
             <p className="text-slate-600 text-sm mb-6">{mountError}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Recarregar</button>
           </div>
        </div>
      ) : (isAuthLoading || !currentUser || isLoggingIn) ? (
        <div 
          key="landing"
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
                  {isLoggingIn ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <LogIn size={18} />
                  )}
                  {isLoggingIn ? 'Invocando Ritual...' : 'Entrar no Portal'}
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
                     <button
                       onClick={() => setShowDomainHelp(prev => !prev)}
                       className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-indigo-200 underline cursor-pointer block"
                     >
                       {showDomainHelp ? "Ocultar Guia de Ajuda" : "Como autorizar no Firebase?"}
                     </button>
                  </motion.div>
                )}

                {showDomainHelp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-slate-900/90 border border-white/10 rounded-2xl text-left space-y-3 shadow-2xl backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#BF8A10]">
                        Guia de Autorização Hekat
                      </span>
                      <button 
                        onClick={() => setShowDomainHelp(false)}
                        className="text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
                      >
                        [Fechar]
                      </button>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Para efetuar o login com o Google em domínios de visualização ou no celular, é preciso autorizar as URLs em dois locais fundamentais:
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider">Etapa 1: Console do Firebase</p>
                        <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1 leading-relaxed">
                          <li>
                            Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">Console do Firebase</a>.
                          </li>
                          <li>
                            Vá em <strong>Authentication</strong> &rarr; aba <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>.
                          </li>
                          <li>
                            Clique em <strong>Add domain</strong> e insira estes domínios:
                            <div className="mt-1 p-2 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] text-emerald-400 space-y-1 select-all">
                              <p>ais-dev-757guj3wwj6obi7t5znwrf-410434177490.us-east1.run.app</p>
                              <p>ais-pre-757guj3wwj6obi7t5znwrf-410434177490.us-east1.run.app</p>
                            </div>
                          </li>
                        </ol>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider">Etapa 2: Google Cloud Console (MUITO IMPORTANTE)</p>
                        <ol className="list-decimal list-inside text-slate-300 text-[11px] space-y-1 leading-relaxed">
                          <li>
                            Abra o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">Google Cloud Console</a> com a mesma conta.
                          </li>
                          <li>
                            Selecione o projeto do seu Firebase no topo da página.
                          </li>
                          <li>
                            No menu esquerdo, vá em <strong>APIs e Serviços</strong> &rarr; <strong>Credenciais</strong>.
                          </li>
                          <li>
                            Em <strong>IDs de cliente OAuth 2.0</strong>, clique para editar o <strong>Web client (auto-created by Google Service)</strong>.
                          </li>
                          <li>
                            Role até <strong>Origens JavaScript autorizadas</strong> e adicione as duas URLs completas:
                            <div className="mt-1 p-2 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] text-indigo-300 space-y-1 select-all">
                              <p>https://ais-dev-757guj3wwj6obi7t5znwrf-410434177490.us-east1.run.app</p>
                              <p>https://ais-pre-757guj3wwj6obi7t5znwrf-410434177490.us-east1.run.app</p>
                            </div>
                          </li>
                          <li>
                            Verifique se as URIs de redirecionamento autorizadas incluem o link do seu handler Firebase (como <code>https://SEU-PROJETO.firebaseapp.com/__/auth/handler</code>) e salve as alterações. <em>Nota: Esta propagação pelo Google pode demorar alguns minutos.</em>
                          </li>
                        </ol>
                      </div>
                    </div>
                    <div className="pt-2 text-[9.5px] font-bold text-amber-500/70 border-t border-white/5">
                      💡 No celular, se o popup for bloqueado pelo navegador, mude a chave de bloqueio de popups nas configurações do Safari ou Chrome para permitir que se comuniquem.
                    </div>
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
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 opacity-40">
                    <ShieldCheck size={12} /> Acesso Seguro via Google
                 </p>
                 <button 
                   onClick={() => setShowDomainHelp(prev => !prev)}
                   className="text-[9.5px] font-black uppercase tracking-widest text-[#BF8A10] opacity-80 hover:opacity-100 transition-opacity cursor-pointer underline"
                 >
                   Ajuda com o login / Tutorial de Domínios
                 </button>
              </div>
           </motion.div>
        </div>
      </div>
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
                           {selectedDay === lunarData.day ? 'Tônica do Agora' : `Influência do Dia ${selectedDay}`}: {getZodiacSignSafely(selectedMoonSignIndex).name} • {oracleData.moonDegreeForDay}°
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
                        <h3 className="text-[11px] sm:text-[12.5px] font-black text-[#4169E1] uppercase tracking-tighter whitespace-nowrap">Fase {phase.name} • Dia {selectedDay} do Ciclo Lunar</h3>
                        <p className="text-[11px] sm:text-[10px] leading-relaxed text-indigo-300/70 font-medium mt-1 italic text-left whitespace-normal break-words overflow-visible">
                           {phase.tasks}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedDay(p => Math.max(1, p-1))} className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200/25 hover:bg-indigo-500 transition-colors active:scale-95">
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => setSelectedDay(p => Math.min(28, p+1))} className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200/25 hover:bg-indigo-500 transition-colors active:scale-95">
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
                    <span className="text-[10px] font-black text-white uppercase block tracking-wider">Ciclo {(viewingCycleId || lunarData.cycleId)}</span>
                    {(viewingCycleId || lunarData.cycleId) === lunarData.cycleId ? (
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">Ciclo Atual</span>
                    ) : (
                      <span className="text-[8px] font-black text-amber-400/80 uppercase tracking-tighter">Memória Gravada</span>
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
                        <p className="text-sm sm:text-base leading-relaxed text-white font-medium text-center max-w-[90%] sm:max-w-[80%] pb-4">
                          "{oracleText}"
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
                      <span className="text-[10px] font-black text-white uppercase block tracking-widest">Ciclo {(viewingCycleId || lunarData.cycleId)}</span>
                      {(viewingCycleId || lunarData.cycleId) === lunarData.cycleId ? (
                        <span className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Dados em Tempo Real</span>
                      ) : (
                        <span className="text-[7px] font-black text-amber-400/80 uppercase tracking-tighter">Memória Consultada</span>
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
                    <h3 className="text-[10px] font-black uppercase text-[#4169E1] tracking-[0.2em]">Trilogia de Memória: Ciclos 1, 2 e 3</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map(cycleId => {
                      const cycleLogs: Record<number, LogEntry> = {};
                      allLogs.filter(l => l.cycleId === cycleId).forEach(l => cycleLogs[l.lunarDay] = l);
                      const hasData = Object.keys(cycleLogs).length > 0;
                      
                      return (
                        <button 
                          key={`trilogy-${cycleId}`}
                          onClick={() => hasData && setViewingCycleId(cycleId)}
                          className={`relative p-3 rounded-[2rem] border transition-all duration-700 flex flex-col items-center gap-3 overflow-hidden
                            ${viewingCycleId === cycleId 
                              ? 'bg-gradient-to-b from-indigo-500/20 to-transparent border-indigo-500 shadow-[0_20px_40px_rgba(79,70,229,0.2)] scale-105 z-10' 
                              : hasData 
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]' 
                                : 'bg-transparent border-dashed border-white/5 opacity-25 grayscale cursor-not-allowed'
                            }`}
                        >
                          <div className="flex items-center justify-between w-full px-1">
                            <span className="text-[8px] font-black text-white/40 uppercase">Ciclo {cycleId}</span>
                            {hasData && viewingCycleId === cycleId && <Activity size={8} className="text-emerald-400" />}
                          </div>
                          <div className="pointer-events-none transform scale-[0.6] sm:scale-[0.55] origin-top h-[60px] flex items-center justify-center">
                             {hasData ? (
                               <MiniMandala logs={cycleLogs} lunarData={{ day: 28 }} size={140} />
                             ) : (
                               <div className="w-12 h-12 border border-dashed border-white/20 rounded-full flex items-center justify-center">
                                 <Plus size={12} className="text-white/10" />
                               </div>
                             )}
                          </div>
                          <span className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${viewingCycleId === cycleId ? 'text-indigo-200' : 'text-indigo-300/40'}`}>
                            {hasData ? (viewingCycleId === cycleId ? 'Ciclo Focado' : 'Ver Ciclo') : 'Sem Dados'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center mt-4">
                     <p className="text-[7px] font-black uppercase text-indigo-300/40 tracking-[0.3em]">Navegue pela jornada das três primeiras luas</p>
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
                                <h4 className="text-[11px] font-black uppercase text-[#4169E1] tracking-tighter">DIA {log.lunarDay} • {emotion?.name}</h4>
                                <span className="text-[8px] font-black text-indigo-300/60 uppercase">Ciclo {log.cycleId}</span>
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
                                className="text-[11px] sm:text-[13px] leading-relaxed text-white font-medium italic text-justify"
                              >
                                "{reports[item.id as keyof typeof reports].text}"
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
                    "Há um padrão de respostas emocionais que seguimos sem nos aperceber dele. É um 'Plano Piloto Emocional' que atua diretamente do inconsciente, mas podemos identificar e o reconhecer pelo ciclo lunar de 28 dias."
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
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">O Ciclo Completo: revelação do padrão formado pela soma dos 28 dias em ressonância com as fases lunares.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-indigo-950/20 rounded-3xl border border-indigo-400/10">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl h-fit"><Sparkles size={16} className="text-emerald-400" /></div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-indigo-100 tracking-widest">Visão Trimestral</h4>
                          <p className="text-xs text-indigo-100/80 font-medium leading-normal mt-1 small-caps">Perspectiva de Médio Prazo: essencial para notar que os mesmos sentimentos se repetem em diferentes lunações.</p>
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
                            {EMOTIONS.filter(e => e.category === cat).map(emo => {
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
                                  style={{ backgroundColor: emo.color }}
                                  className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer p-1 ${
                                    currentEmotion === emo.id 
                                      ? `ring-2 ${ringClass} shadow-xl scale-105 z-10` 
                                      : 'opacity-90 hover:opacity-[0.98] hover:scale-105 hover:z-20 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
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
                width={win.id === 'history' ? "600px" : win.id === 'mandala' ? "420px" : "500px"}
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
                  {win.title === 'Mandala Lunar' ? 'Mandala' : win.title === 'Astromemorias' ? 'Diário' : win.title === 'Oráculo Diário' ? 'Oráculo' : win.title === 'Relatórios' ? 'Relatórios' : 'Histórico'}
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
