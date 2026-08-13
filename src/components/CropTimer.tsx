import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Send, 
  Volume2, 
  Volume1,
  Volume,
  VolumeX, 
  Bell, 
  CheckCircle, 
  CheckSquare,
  ShieldCheck, 
  Sprout, 
  Hourglass, 
  Trophy, 
  Flame,
  AlertCircle, 
  Info,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Smartphone,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';
import { TelegramHelpModal } from './TelegramHelpModal';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteField, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { CropPreset, PlantedSlot } from '../types';
import { CROP_PRESETS } from '../data/crops';
import versionData from '../version.json';
import { safeJsonParse } from '../lib/utils';
const APP_VERSION = versionData.version;
import { useBackDismiss } from '../hooks/useBackDismiss';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  };

  throw new Error(JSON.stringify(errInfo));
}

function ensure8Slots(inputSlots: any[] | null | undefined): PlantedSlot[] {
  const result = Array.isArray(inputSlots) ? [...inputSlots] : [];
  for (let i = 0; i < 8; i++) {
    const defaultId = `slot_${i + 1}`;
    if (!result[i]) {
      result[i] = {
        id: defaultId,
        cropId: null,
        cropName: null,
        cropEmoji: null,
        originalStartTime: null,
        originalDuration: null,
        userOffset: 0,
        isNotified: false,
        isFiveStarMode: false
      };
    } else {
      if (!result[i].id) {
        result[i].id = defaultId;
      }
      
      // Migrate old fields if necessary
      if (result[i].originalStartTime === undefined && result[i].startTime !== undefined) {
        result[i].originalStartTime = result[i].startTime;
      }
      if (result[i].originalDuration === undefined && result[i].duration !== undefined) {
        result[i].originalDuration = result[i].duration;
      }
      if (result[i].userOffset === undefined) {
        result[i].userOffset = 0;
      }

      if (result[i].isFiveStarMode === undefined) result[i].isFiveStarMode = false;
      if (result[i].notifiedStages === undefined) result[i].notifiedStages = [];
    }
  }
  return result.slice(0, 8) as PlantedSlot[];
}

function convertSlotsMapToArray(slotsMap: Record<string, any>): PlantedSlot[] {
  return Array.from({ length: 8 }, (_, i) => {
    const id = `slot_${i + 1}`;
    const value = slotsMap && slotsMap[id];
    return value ? {
      id,
      cropId: value.cropId ?? null,
      cropName: value.cropName ?? null,
      cropEmoji: value.cropEmoji ?? null,
      originalStartTime: value.originalStartTime ?? value.startTime ?? null,
      originalDuration: value.originalDuration ?? value.duration ?? null,
      userOffset: value.userOffset ?? 0,
      isNotified: !!value.isNotified,
      isFiveStarMode: !!value.isFiveStarMode,
      notifiedStages: value.notifiedStages || [],
      fiveStarNotificationState: value.fiveStarNotificationState
    } : {
      id,
      cropId: null,
      cropName: null,
      cropEmoji: null,
      originalStartTime: null,
      originalDuration: null,
      userOffset: 0,
      isNotified: false,
      isFiveStarMode: false,
      notifiedStages: []
    };
  });
}

function convertSlotsArrayToMap(slotsArray: PlantedSlot[]): Record<string, any> {
  const map: Record<string, any> = {};
  slotsArray.forEach(slot => {
    map[slot.id] = slot;
  });
  return map;
}

function getTimestampMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val.seconds !== undefined) return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
  if (val instanceof Date) return val.getTime();
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed;
}

function reconstructSlotsFromFarmingSlotsMap(farmingSlots: any): PlantedSlot[] {
  const result = Array.from({ length: 8 }, (_, i) => ({
    id: `slot_${i + 1}`,
    cropId: null,
    cropName: null,
    cropEmoji: null,
    originalStartTime: null,
    originalDuration: null,
    userOffset: 0,
    isNotified: false,
    isFiveStarMode: false,
    instanceId: null,
    updatedAt: 0
  }));

  if (!farmingSlots || typeof farmingSlots !== 'object') {
    return result;
  }

  const slotsById: Record<string, any> = {};
  Object.values(farmingSlots).forEach((slot: any) => {
    if (!slot || !slot.id) return;
    const existing = slotsById[slot.id];
    const slotTime = getTimestampMillis(slot.updatedAt || slot.originalStartTime);
    const existingTime = existing ? getTimestampMillis(existing.updatedAt || existing.originalStartTime) : 0;
    if (!existing || slotTime > existingTime) {
      slotsById[slot.id] = slot;
    }
  });

  Object.values(slotsById).forEach((slot: any) => {
    const idx = parseInt(slot.id.replace('slot_', '')) - 1;
    if (idx >= 0 && idx < 8) {
      result[idx] = {
        ...result[idx],
        ...slot,
        updatedAt: getTimestampMillis(slot.updatedAt || slot.originalStartTime),
        originalStartTime: slot.originalStartTime || slot.startTime || null,
        originalDuration: slot.originalDuration || slot.duration || null,
      };
    }
  });

  return result;
}

function checkIsInAppBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /kakaotalk|instagram|fbav|line|naver|twitter|telegram|webview|micromessenger/i.test(ua) || 
         ( /iphone|ipad|ipod/i.test(ua) && /wv/i.test(ua) ) ||
         ( /android/i.test(ua) && /version\/[0-9.]+/i.test(ua) && !/chrome/i.test(ua) );
}


// Crop configurations are now managed inside /src/data/crops.ts for easier maintenance


// Cozy audio synthesizer to generate physical chimes without downloading assets
let sharedAudioCtx: AudioContext | null = null;

const playCustomSound = (type: string, overrideVolume?: number) => {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioCtx = sharedAudioCtx;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Get volume from override or localStorage (default 100)
    let volPercent = 100;
    if (overrideVolume !== undefined) {
      volPercent = overrideVolume;
    } else {
      const saved = localStorage.getItem('farming_alarm_volume');
      if (saved) volPercent = parseInt(saved, 10);
    }
    const volumeMultiplier = volPercent / 100;

    const playNote = (frequency: number, startTime: number, duration: number, oscType: OscillatorType = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(frequency, startTime);
      
      let volume = 0.20; // Default C5 chime, etc.
      if (oscType === 'sawtooth') volume = 0.12; // Siren should be solid
      if (oscType === 'square') volume = 0.08;   // Beep
      if (oscType === 'triangle') volume = 0.26; // Marimba, cosmic
      
      const finalVolume = volume * volumeMultiplier;
      
      // 극도로 부드럽고 자연스러운 ADSR/Fade 볼륨 엔벨롭 적용 (틱 노이즈 원천 방지)
      const attackTime = 0.015; // 15ms 페이드인으로 첫음 어택 부분 유연화
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, startTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(0.0, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      // 볼륨이 완벽히 0이 된 후 50ms 뒤에 오실레이터를 정지시켜 끝음 끊김 현상을 방지
      osc.stop(startTime + duration + 0.05);
      
      setTimeout(() => {
        osc.disconnect();
        gainNode.disconnect();
      }, (duration + 0.2) * 1000);
    };

    // 브라우저가 오디오 컨텍스트를 활성화(resume)하는 동안 발생하는 딜레이를 감안하여,
    // 현재 시간(currentTime)에 80ms(0.08s)의 버퍼 여유를 두고 재생을 예약합니다.
    // 이를 통해 첫음이 잘리거나 틱 노이즈가 생기는 현상을 완벽히 방지합니다.
    const now = audioCtx.currentTime + 0.08;

    if (type === 'chime') {
      // 맑고 풍성한 4음 윈드차임 아르페지오 (여운을 더 길게)
      playNote(523.25, now, 1.2, 'sine');        // C5
      playNote(659.25, now + 0.2, 1.2, 'sine');   // E5
      playNote(783.99, now + 0.4, 1.5, 'sine');   // G5
      playNote(1046.50, now + 0.6, 1.8, 'sine');  // C6
    } else if (type === 'siren') {
      // 부드러운 웨이브 사이렌: 여운을 늘리고 인터벌 조정
      for (let i = 0; i < 4; i++) {
        const time = now + i * 0.6;
        const freq = i % 2 === 0 ? 783.99 : 880; 
        playNote(freq, time, 0.8, 'triangle'); 
      }
    } else if (type === 'beep') {
      // 소프트 비프: 여운을 늘려 툭 끊기는 느낌 제거
      playNote(1500, now, 0.3, 'sine');
      playNote(1500, now + 0.3, 0.3, 'sine');
      playNote(1500, now + 0.6, 0.6, 'sine');
    } else if (type === 'marimba') {
      // 실로폰 멜로디: 각 음의 잔향을 크게 늘림
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.18, 1.5, 'triangle');
      });
    } else if (type === 'bell') {
      // 프리미엄 벨
      playNote(659.25, now, 2.5, 'sine');
      playNote(987.77, now + 0.02, 2.2, 'sine');
      playNote(1318.51, now + 0.04, 2.0, 'sine');
      
      playNote(523.25, now + 0.8, 3.0, 'sine');
      playNote(783.99, now + 0.82, 2.8, 'sine');
    } else if (type === 'melody') {
      // 미니 화음: 여운을 더 길게
      const notes = [523.25, 659.25, 783.99, 1046.50, 880, 783.99];
      notes.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.22, 1.5, 'sine');
      });
    } else if (type === 'retro') {
      // 레트로 게임: playNote를 사용하여 일관된 페이드 적용
      playNote(440, now, 0.4, 'square');
      playNote(554, now + 0.15, 0.4, 'square');
      playNote(659, now + 0.3, 0.6, 'square');
    } else if (type === 'pulse') {
      // 소프트 펄스: 여운 추가
      [600, 800, 600, 1000].forEach((freq, idx) => {
        playNote(freq, now + idx * 0.3, 0.4, 'sine');
      });
    } else if (type === 'sparkle') {
      // 별가루 반짝임: 여운을 대폭 늘려 영롱함 유지
      const sparkFreqs = [1200, 1500, 1800, 2100, 2400, 2700, 3000];
      sparkFreqs.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.12, 1.2, 'sine');
      });
    } else if (type === 'cosmic') {
      // 극도로 부드럽고 긴 우주 공간 패드 (무한반복 최적화)
      playNote(220.00, now, 3.0, 'triangle'); 
      playNote(329.63, now + 0.2, 2.8, 'triangle');
      playNote(523.25, now + 0.4, 2.5, 'sine');
      playNote(783.99, now + 0.6, 2.2, 'sine');
    } else if (type === 'zen') {
      // 명상하듯 깊고 낮은 젠벨 (매우 긴 여운)
      playNote(196.00, now, 4.0, 'sine');   // G3
      playNote(293.66, now + 0.05, 3.5, 'sine'); // D4
      playNote(392.00, now + 0.1, 3.0, 'sine');  // G4
      playNote(493.88, now + 0.15, 2.5, 'sine'); // B4
    } else if (type === 'healing') {
      // 마음이 편안해지는 따뜻한 화음 (무한반복 최적화)
      const freqs = [349.23, 440.00, 523.25, 659.25]; // F4, A4, C5, E5
      freqs.forEach((f, i) => {
        playNote(f, now + i * 0.3, 3.0, 'triangle');
      });
    }
  } catch (e) {
  }
};

const playHarvestSound = () => {
  const soundType = (localStorage.getItem('farming_general_sound') as any) || 'chime';
  playCustomSound(soundType);
};

function getMs(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num)) return num;
    const date = new Date(val).getTime();
    return isNaN(date) ? null : date;
  }
  if (val && typeof val === 'object') {
    if (typeof val.toMillis === 'function') {
      return val.toMillis();
    }
    if (typeof val.seconds === 'number') {
      return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
    }
    if (val instanceof Date) {
      return val.getTime();
    }
  }
  return null;
}

export function getSlotTimes(slot: any) {
  if (!slot.originalStartTime) return { startTime: 0, targetTime: 0, durationMs: 0 };
  const originalStart = getMs(slot.originalStartTime) || 0;
  const originalDurationSec = slot.originalDuration || 0;
  const userOffsetSec = slot.userOffset || 0;
  
  const currentDurationSec = Math.max(0, originalDurationSec + userOffsetSec);
  const targetTime = originalStart + (currentDurationSec * 1000);
  
  return {
    startTime: originalStart,
    targetTime: targetTime,
    durationMs: currentDurationSec * 1000,
  };
}

interface CropTimerProps {
  onReportClick?: () => void;
  onLoginClick?: () => void;
  onOpenStateChange?: (isOpen: boolean) => void;
  onSyncError?: (errorType: 'permission' | 'quota') => void;
  onLogout?: () => Promise<void>;
  isInitialSyncDone?: boolean;
  isActive?: boolean;
  cropPresets: CropPreset[];
}

// 5성 작물 단계 라벨 컴포넌트
const FiveStarStageLabel = ({ slot, now }: { slot: PlantedSlot; now: number }) => {
  const { startTime, targetTime } = getSlotTimes(slot);
  if (startTime === 0) return null;

  const originalDurationMs = (slot.originalDuration || 0) * 1000;
  const adjustedStartTime = startTime + (slot.userOffset || 0) * 1000;

  const stages = [
    { id: 1, time: adjustedStartTime + (originalDurationMs * 1/3), label: '1차 잡초 제거' },
    { id: 2, time: adjustedStartTime + (originalDurationMs * 2/3), label: '2차 잡초 제거' },
    { id: 3, time: targetTime - 60000, label: '3차 잡초 제거' },
    { id: 4, time: targetTime + 60000, label: '4차 잡초 제거' },
  ].sort((a, b) => a.time - b.time);
  const state = slot.fiveStarNotificationState || {
    1: { preSent: false, actualSent: false, completed: false },
    2: { preSent: false, actualSent: false, completed: false },
    3: { preSent: false, actualSent: false, completed: false },
    4: { preSent: false, actualSent: false, completed: false },
  };
  // Find the next stage that is both NOT completed and in the FUTURE
  const nextStage = stages.find(s => !state[s.id]?.completed && s.time > now);
  
  if (!nextStage) {
    if (now >= targetTime + 60000) return <span className="text-amber-500 font-black">수확 완료 ✨</span>;
    return <span className="text-amber-500 font-black">수확 가능</span>;
  }
  return <span>{nextStage.label}</span>;
};

  const calculateSlotNotificationState = (
    isFiveStar: boolean,
    originalStartMs: number,
    originalDurationSec: number,
    userOffsetSec: number,
    preAlarmMinutes: number,
    now: number,
    existingState?: any
  ) => {
    const adjustedStartMs = originalStartMs + (userOffsetSec * 1000);
    const originalDurationMs = originalDurationSec * 1000;
    const targetTimeMs = adjustedStartMs + originalDurationMs;

    const stages = isFiveStar
      ? [
          { id: 1, time: adjustedStartMs + (originalDurationMs * 1/3) },
          { id: 2, time: adjustedStartMs + (originalDurationMs * 2/3) },
          { id: 3, time: targetTimeMs - 60000 },
          { id: 4, time: targetTimeMs + 60000 },
        ].sort((a, b) => a.time - b.time)
      : [
          { id: 1, time: targetTimeMs }
        ];

    const notificationState: any = existingState ? JSON.parse(JSON.stringify(existingState)) : {};

    stages.forEach((stage: any) => {
      if (!notificationState[stage.id]) {
        notificationState[stage.id] = { preSent: false, actualSent: false, completed: false };
      }
    });

    const preAlarmMs = preAlarmMinutes * 60 * 1000;

    for (const stage of stages) {
      const state = notificationState[stage.id];
      const preTriggerTime = Math.max(adjustedStartMs, stage.time - preAlarmMs);

      // If we went back in time before the pre-trigger time, reset preSent
      if (now < preTriggerTime) {
        state.preSent = false;
      }
      
      // If we went back in time before the actual stage time, reset actualSent and completed
      if (now < stage.time) {
        state.actualSent = false;
        state.completed = false;
      } else {
        // If time passed, the stage is completed (for UI tracking), but we don't automatically set preSent or actualSent to true
        state.completed = true;
      }

      // If preAlarm is disabled, preSent is forcibly false
      if (preAlarmMinutes === 0) {
        state.preSent = false;
      }
    }
    return notificationState;
  };

// 5성 작물 시간 티커 컴포넌트
// 5성 작물 시간 티커 컴포넌트
const FiveStarTicker = ({ slot, now }: { slot: PlantedSlot; now: number }) => {
  const [tickerState, setTickerState] = useState(0); // 0: Next stage remaining, 1: Next stage schedule
  
  useEffect(() => {
    const ticker = setInterval(() => {
      setTickerState(prev => (prev + 1) % 2);
    }, 3000); // 3초마다 롤링
    return () => clearInterval(ticker);
  }, []);

  const { startTime, targetTime } = getSlotTimes(slot);
  if (startTime === 0) return null;

  const originalDurationMs = (slot.originalDuration || 0) * 1000;
  const adjustedStartTime = startTime + (slot.userOffset || 0) * 1000;

  const stages = [
    { id: 1, time: adjustedStartTime + (originalDurationMs * 1/3) },
    { id: 2, time: adjustedStartTime + (originalDurationMs * 2/3) },
    { id: 3, time: targetTime - 60000 },
    { id: 4, time: targetTime + 60000 },
  ].sort((a, b) => a.time - b.time);

  const state = slot.fiveStarNotificationState || {
    1: { preSent: false, actualSent: false, completed: false },
    2: { preSent: false, actualSent: false, completed: false },
    3: { preSent: false, actualSent: false, completed: false },
    4: { preSent: false, actualSent: false, completed: false },
  };
  // Skip past stages to show relevant info after time adjustment
  const nextStage = stages.find(s => !state[s.id]?.completed && s.time > now);

  if (!nextStage) return null;

  const remainingSec = Math.max(0, Math.floor(nextStage.time / 1000) - Math.floor(now / 1000));

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    let hours = d.getHours();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${ampm} ${displayHours}:${minutes} 예정`;
  };

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return '수확 가능';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}시간 ${m}분 ${s}초`;
    if (m > 0) return `${m}분 ${s}초`;
    return `${s}초`;
  };

  const getRenderedContent = () => {
    switch (tickerState) {
      case 1:
        return (
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">
            ⏰ {formatTime(nextStage.time)}
          </span>
        );
      case 0:
      default:
        return (
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
            {formatTimeLeft(remainingSec)} 전
          </span>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tickerState}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-end"
      >
        {getRenderedContent()}
      </motion.div>
    </AnimatePresence>
  );
};

const FiveStarSchedule = ({ slot }: { slot: PlantedSlot }) => {
  const [expanded, setExpanded] = useState(false);
  const { startTime, targetTime } = getSlotTimes(slot);
  const originalDurationMs = (slot.originalDuration || 0) * 1000;
  const adjustedStartTime = startTime + (slot.userOffset || 0) * 1000;

  const stages = [
    { id: 1, label: '1차 알림', time: adjustedStartTime + (originalDurationMs * 1/3) },
    { id: 2, label: '2차 알림', time: adjustedStartTime + (originalDurationMs * 2/3) },
    { id: 3, label: '3차 알림', time: targetTime - 60000 },
    { id: 4, label: '4차 알림', time: targetTime + 60000 },
  ];

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    let hours = d.getHours();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${ampm} ${displayHours}:${minutes}`;
  };

  return (
    <div className="text-[11px] rounded-lg border border-neutral-100 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-neutral-500 dark:text-stone-500 hover:text-neutral-900 dark:hover:text-stone-300 transition-colors"
      >
        <span className="font-semibold">알림 시간표</span>
        {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
      </button>
      {expanded && (
        <div className="px-2 pb-2 border-t border-neutral-100 dark:border-stone-800 space-y-0.5 pt-1">
          {stages.map((stage) => (
            <div key={stage.id} className="flex justify-between font-mono text-neutral-700 dark:text-stone-300">
              <span className="font-medium">{stage.label}</span>
              <span>{formatTime(stage.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface NotificationEvent {
  slot: any;
  stage?: number;
  isPre: boolean;
  isFresh: boolean; // within 5 minutes
}

export function checkNotificationEvents(
  slot: any,
  now: number,
  lastCheckTime: number,
  preAlarmMinutes: number
): { events: NotificationEvent[], updatedSlot: any, changed: boolean } {
  const { startTime, targetTime } = getSlotTimes(slot);
  if (startTime === 0) return { events: [], updatedSlot: slot, changed: false };

  let events: NotificationEvent[] = [];
  let changed = false;
  let newSlot = { ...slot };

  const checkFresh = (time: number) => {
    return (now - time) <= 5 * 60 * 1000;
  };

  const isCrossed = (time: number) => {
    return lastCheckTime < time && time <= now;
  };

  // An event should only trigger notifications if it crossed the threshold during this exact tick,
  // OR if it's fresh (within 5 mins) to catch up on recent misses.
  // We don't want to blast 10-hour old notifications when opening the app.
  const shouldNotify = (time: number) => {
    return isCrossed(time) && checkFresh(time);
  };

  const originalDurationMs = (newSlot.originalDuration || 0) * 1000;
  const adjustedStartTime = startTime + (newSlot.userOffset || 0) * 1000;

  const stages = newSlot.isFiveStarMode
    ? [
        { id: 1, time: adjustedStartTime + (originalDurationMs * 1/3) },
        { id: 2, time: adjustedStartTime + (originalDurationMs * 2/3) },
        { id: 3, time: targetTime - 60000 },
        { id: 4, time: targetTime + 60000 }
      ].sort((a, b) => a.time - b.time)
    : [
        { id: 1, time: targetTime }
      ];

  let state = newSlot.fiveStarNotificationState 
    ? JSON.parse(JSON.stringify(newSlot.fiveStarNotificationState)) 
    : {};

  if (!newSlot.fiveStarNotificationState) changed = true;

  // Ensure all stage structures exist in state mapping
  stages.forEach((stage: any) => {
    if (!state[stage.id]) {
      state[stage.id] = { preSent: false, actualSent: false, completed: false };
      changed = true;
    }
  });

  const preAlarmMs = preAlarmMinutes * 60 * 1000;

  for (const stage of stages) {
    const st = state[stage.id];

    // Pre-notification
    if (preAlarmMs > 0 && !st.preSent) {
      const preTriggerTime = Math.max(startTime, stage.time - preAlarmMs);
      if (now >= preTriggerTime) {
        if (shouldNotify(preTriggerTime)) {
          events.push({ slot: newSlot, stage: stage.id, isPre: true, isFresh: true });
        }
        st.preSent = true;
        changed = true;
      }
    }

    // Actual notification
    if (!st.completed) {
      if (now >= stage.time) {
        st.completed = true;
        changed = true;
        
        if (!st.preSent) {
          if (shouldNotify(stage.time)) {
            events.push({ slot: newSlot, stage: stage.id, isPre: false, isFresh: true });
          }
        }
        st.actualSent = true;
      }
    }
  }

  newSlot.fiveStarNotificationState = state;

  // Final completion check
  const finalStageId = newSlot.isFiveStarMode ? 4 : 1;
  const actualTarget = newSlot.isFiveStarMode ? targetTime + 60000 : targetTime;
  if (!newSlot.isNotified && now >= actualTarget && state[finalStageId]?.completed) {
    newSlot.isNotified = true;
    changed = true;
  }

  return { events, updatedSlot: newSlot, changed };
}

export default function CropTimer({ 
  onReportClick, 
  onLoginClick, 
  onOpenStateChange, 
  onSyncError, 
  onLogout,
  isInitialSyncDone: isGlobalSyncDone = true,
  isActive = true,
  cropPresets
}: CropTimerProps) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [slots, setSlots] = useState<PlantedSlot[]>(() => {
    const saved = localStorage.getItem('farming_slots');
    return ensure8Slots(safeJsonParse(saved, null));
  });



  // Telegram settings
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem('tg_chat_id') || '');
  const [gasWebappUrl, setGasWebappUrl] = useState(() => localStorage.getItem('tg_gas_url') || '');
  const [isTelegramConfigured, setIsTelegramConfigured] = useState<boolean>(() => {
    return localStorage.getItem('is_tg_configured') === 'true';
  });
  const [isGasConfigured, setIsGasConfigured] = useState<boolean>(() => {
    return localStorage.getItem('is_gas_configured') === 'true';
  });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [showTgDiscardConfirm, setShowTgDiscardConfirm] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('farming_sound_enabled');
    return safeJsonParse(saved, true);
  });

  const [generalSoundType, setGeneralSoundType] = useState<string>(() => {
    return localStorage.getItem('farming_general_sound') || 'chime';
  });
  const [fiveStarSoundType, setFiveStarSoundType] = useState<string>(() => {
    return localStorage.getItem('farming_fivestar_sound') || 'chime';
  });
  const [generalRepeat, setGeneralRepeat] = useState<boolean>(() => {
    return localStorage.getItem('farming_general_repeat') === 'true';
  });
  const [fiveStarRepeat, setFiveStarRepeat] = useState<boolean>(() => {
    const saved = localStorage.getItem('farming_fivestar_repeat');
    return saved === null ? false : saved === 'true';
  });
  const [fiveStarPreMinutes, setFiveStarPreMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('farming_fivestar_pre_minutes');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [alarmVolume, setAlarmVolume] = useState<number>(() => {
    const saved = localStorage.getItem('farming_alarm_volume');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);
  const [ringingType, setRingingType] = useState<'general' | 'fivestar' | null>(null);
  const [ringingMessage, setRingingMessage] = useState<string>('');
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState<boolean>(false);
  const [soundSettingsTab, setSoundSettingsTab] = useState<'general' | 'fivestar'>('general');
  const alarmIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isAlarmRinging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isAlarmRinging]);

  const generalSoundTypeRef = useRef(generalSoundType);
  const fiveStarSoundTypeRef = useRef(fiveStarSoundType);
  const generalRepeatRef = useRef(generalRepeat);
  const fiveStarRepeatRef = useRef(fiveStarRepeat);
  const fiveStarPreMinutesRef = useRef(fiveStarPreMinutes);
  const alarmVolumeRef = useRef(alarmVolume);

  useEffect(() => { generalSoundTypeRef.current = generalSoundType; }, [generalSoundType]);
  useEffect(() => { fiveStarSoundTypeRef.current = fiveStarSoundType; }, [fiveStarSoundType]);
  useEffect(() => { generalRepeatRef.current = generalRepeat; }, [generalRepeat]);
  useEffect(() => { fiveStarRepeatRef.current = fiveStarRepeat; }, [fiveStarRepeat]);
  useEffect(() => { fiveStarPreMinutesRef.current = fiveStarPreMinutes; }, [fiveStarPreMinutes]);
  useEffect(() => { alarmVolumeRef.current = alarmVolume; }, [alarmVolume]);

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarmRinging(false);
    setRingingType(null);
    setRingingMessage('');
  };

  const triggerAlarm = (type: 'general' | 'fivestar', message: string = '') => {
    if (!soundEnabled) return;
    
    // Stop existing alarm if any
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    const soundType = type === 'general' ? generalSoundTypeRef.current : fiveStarSoundTypeRef.current;
    const isRepeat = type === 'general' ? generalRepeatRef.current : fiveStarRepeatRef.current;

    // Play immediately
    playCustomSound(soundType);

    // Always show popup
    setIsAlarmRinging(true);
    setRingingType(type);
    setRingingMessage(message);

    if (isRepeat) {
      const intervalMs = 5000;
      alarmIntervalRef.current = setInterval(() => {
        playCustomSound(soundType);
      }, intervalMs);
    }
  };

  const handleUpdateGeneralSoundType = (type: string) => {
    setGeneralSoundType(type);
    localStorage.setItem('farming_general_sound', type);
  };
  const handleUpdateFiveStarSoundType = (type: string) => {
    setFiveStarSoundType(type);
    localStorage.setItem('farming_fivestar_sound', type);
  };
  const handleUpdateGeneralRepeat = (repeat: boolean) => {
    setGeneralRepeat(repeat);
    localStorage.setItem('farming_general_repeat', repeat ? 'true' : 'false');
  };
  const handleUpdateFiveStarRepeat = (repeat: boolean) => {
    setFiveStarRepeat(repeat);
    localStorage.setItem('farming_fivestar_repeat', repeat ? 'true' : 'false');
  };
  const handleUpdateFiveStarPreMinutes = (mins: number) => {
    setFiveStarPreMinutes(mins);
    localStorage.setItem('farming_fivestar_pre_minutes', String(mins));
    
    // Recalculate notification states for all active slots immediately
    const now = Date.now() + timeOffset;
    const updatedSlots = slotsRef.current.map(slot => {
      if (!slot.cropName || !slot.originalStartTime) return slot;
      const { startTime } = getSlotTimes(slot);
      
      const newNotificationState = calculateSlotNotificationState(
        !!slot.isFiveStarMode,
        getMs(slot.originalStartTime) || 0,
        slot.originalDuration || 0,
        slot.userOffset || 0,
        mins,
        now,
        slot.fiveStarNotificationState
      );
      
      const finalStageId = slot.isFiveStarMode ? 4 : 1;
      return {
        ...slot,
        isNotified: newNotificationState?.[finalStageId]?.completed || false,
        fiveStarNotificationState: newNotificationState
      };
    });
    
    updateGardenState(updatedSlots);
  };
  const handleUpdateAlarmVolume = (vol: number) => {
    setAlarmVolume(vol);
    localStorage.setItem('farming_alarm_volume', String(vol));
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [timeAdjustSlotId, setTimeAdjustSlotId] = useState<string | null>(null);
  const [adjustHours, setAdjustHours] = useState('0');
  const [adjustMinutes, setAdjustMinutes] = useState('0');
  const [adjustSeconds, setAdjustSeconds] = useState('0');

  const slotsRef = useRef(slots);
  const prevUserRef = useRef<any>(null);
  const lastSyncedSlotsRef = useRef<string>('');
  const lastSyncedPresetsRef = useRef<string>(localStorage.getItem('user_notification_presets') || '[]');
  const gardenSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const farmingSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presetsSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFarmingSyncSlotsRef = useRef<PlantedSlot[]>(slots);
  const localWriteLockRef = useRef<number>(0);
  const lastCheckTimeRef = useRef<number>(0);
  const isFarmingInitialSyncDoneRef = useRef(false);
  const hasPromptedForNotifRef = useRef(false);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    return () => {
        if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current);
        }
        if (farmingSyncTimerRef.current) {
            clearTimeout(farmingSyncTimerRef.current);
        }
        if (presetsSyncTimerRef.current) {
            clearTimeout(presetsSyncTimerRef.current);
        }
    };
  }, []);

  // UI interaction states
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const isAnyModalOpen = !!selectedSlotId || !!timeAdjustSlotId || isHelpModalOpen || isTelegramOpen || isSoundSettingsOpen;

  useEffect(() => {
    if (onOpenStateChange) {
      onOpenStateChange(isAnyModalOpen);
    }
  }, [isAnyModalOpen, onOpenStateChange]);

  const [pendingHarvestSlotId, setPendingHarvestSlotId] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [customCropName, setCustomCropName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [tgTestStatus, setTgTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [tgTestErrorDetail, setTgTestErrorDetail] = useState<string | null>(null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loginWarningType, setLoginWarningType] = useState<'webview' | 'iframe' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showNotifWarningModal, setShowNotifWarningModal] = useState(false);
  const [tgTab, setTgTab] = useState<'basic' | 'gas'>('basic');
  const [showTargetTime, setShowTargetTime] = useState(false);
  const [modalTab, setModalTab] = useState<'crop' | 'custom'>('crop');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isFiveStarMode, setIsFiveStarMode] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [skipModeSelection, setSkipModeSelection] = useState<boolean>(() => {
    return localStorage.getItem('skip_crop_mode_selection') === 'true';
  });
  const [defaultAlarmMode, setDefaultAlarmMode] = useState<'normal' | 'fivestar'>(() => {
    return (localStorage.getItem('default_crop_alarm_mode') as 'normal' | 'fivestar') || 'normal';
  });
  const [fiveStarPendingData, setFiveStarPendingData] = useState<{
    type: 'preset' | 'custom';
    slotId: string;
    preset?: CropPreset;
  } | null>(null);
  const [saveToPresets, setSaveToPresets] = useState(false);
  const [userPresets, setUserPresets] = useState<CropPreset[]>(() => {
    const saved = localStorage.getItem('user_notification_presets');
    return safeJsonParse(saved, []);
  });

  useEffect(() => {
    const presetsStr = JSON.stringify(userPresets);
    localStorage.setItem('user_notification_presets', presetsStr);
    
    // Always call debounced function, it will handle the check.
    if (user && isGlobalSyncDone) {
        triggerDebouncedPresetsSync(userPresets);
    }
  }, [userPresets, user, isGlobalSyncDone]);

  // 뒤로가기 키(Back Key) 모바일 닫기 연동 훅
  useBackDismiss(!!selectedSlotId, () => setSelectedSlotId(null), 'selectedSlotId');
  useBackDismiss(!!timeAdjustSlotId, () => setTimeAdjustSlotId(null), 'timeAdjustSlotId');
  useBackDismiss(showCustomForm, () => setShowCustomForm(false), 'showCustomForm');
  useBackDismiss(showTgDiscardConfirm, () => setShowTgDiscardConfirm(false), 'showTgDiscardConfirm');
  useBackDismiss(showLogoutConfirm, () => setShowLogoutConfirm(false), 'showLogoutConfirm');
  useBackDismiss(showNotifWarningModal, () => setShowNotifWarningModal(false), 'showNotifWarningModal');
  useBackDismiss(!!deletingSlotId, () => setDeletingSlotId(null), 'deletingSlotId');
  useBackDismiss(isSoundSettingsOpen, () => setIsSoundSettingsOpen(false), 'isSoundSettingsOpen');
  useBackDismiss(!!fiveStarPendingData, () => setFiveStarPendingData(null), 'fiveStarPendingData');

  // Modal state reset effect: when closing the main slot selection modal
  useEffect(() => {
    if (!selectedSlotId) {
      // Small delay to allow exit animations to complete before resetting states
      const timer = setTimeout(() => {
        setModalTab('crop');
        setShowCustomForm(false);
        setIsFiveStarMode(false);
        setShowModeSelection(false);
        setCustomCropName('');
        setCustomHours('');
        setCustomMinutes('');
        setCustomSeconds('');
        setCustomEmoji('🌲');
        setEditingSlotId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedSlotId]);

  // Body scroll lock
  useEffect(() => {
    if (selectedSlotId || timeAdjustSlotId || isHelpModalOpen || isTelegramOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSlotId, timeAdjustSlotId, isHelpModalOpen, isTelegramOpen]);

  const GAS_CODE_TEMPLATE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var userProperties = PropertiesService.getUserProperties();
    var key = "user_" + data.telegramChatId;
    userProperties.setProperty(key, JSON.stringify({
      telegramToken: data.telegramToken,
      telegramChatId: data.telegramChatId,
      preAlarmMinutes: data.preAlarmMinutes || 0,
      keepActualNotify: data.keepActualNotify || false,
      slots: data.slots,
      updatedAt: new Date().getTime()
    }));
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function pigtown() {
  var userProperties = PropertiesService.getUserProperties();
  var keys = userProperties.getKeys();
  var now = new Date().getTime();
  
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf("user_") !== 0) continue;
    var userDataStr = userProperties.getProperty(key);
    if (!userDataStr) continue;
    
    var userData = JSON.parse(userDataStr);
    var token = userData.telegramToken;
    var chatId = userData.telegramChatId;
    var preAlarmMinutes = userData.preAlarmMinutes || 0;
    var keepActualNotify = false;
    var slots = userData.slots;
    var updated = false;
    
    for (var j = 0; j < slots.length; j++) {
      var slot = slots[j];
      if (!slot.cropName || !slot.originalStartTime) continue;
      
      var originalStart = slot.originalStartTime || 0;
      var originalDurationSec = slot.originalDuration || 0;
      var userOffsetSec = slot.userOffset || 0;
      var currentDurationSec = Math.max(0, originalDurationSec + userOffsetSec);
      
      var targetTime = originalStart + (currentDurationSec * 1000);
      var startTime = originalStart;
      
      var isFiveStar = slot.isFiveStarMode;
      var preAlarmMs = preAlarmMinutes * 60000;
      var events = [];
      
      var state = slot.fiveStarNotificationState;
      if (!state) {
        state = {};
        slot.fiveStarNotificationState = state;
        updated = true;
      }
      
      var originalDurationMs = originalDurationSec * 1000;
      var adjustedStartTime = originalStart + (userOffsetSec * 1000);
      var stages = isFiveStar
        ? [
            { id: 1, time: adjustedStartTime + (originalDurationMs * 1/3) },
            { id: 2, time: adjustedStartTime + (originalDurationMs * 2/3) },
            { id: 3, time: targetTime - 60000 },
            { id: 4, time: targetTime + 60000 }
          ].sort(function(a, b) { return a.time - b.time; })
        : [
            { id: 1, time: targetTime }
          ];
      
      for (var sIdx = 0; sIdx < stages.length; sIdx++) {
        var stageId = stages[sIdx].id;
        if (!state[stageId]) {
          state[stageId] = { preSent: false, actualSent: false, completed: false };
          updated = true;
        }
      }
      
      for (var k = 0; k < stages.length; k++) {
        var stage = stages[k];
        var st = state[stage.id];
        
        if (preAlarmMs > 0 && !st.preSent) {
          var preTime = Math.max(startTime, stage.time - preAlarmMs);
          if (now >= preTime) {
            events.push({ isPre: true, stage: stage.id });
            st.preSent = true;
            updated = true;
          }
        }
        
        if (!st.completed && now >= stage.time) {
          st.completed = true;
          updated = true;
          if (!st.preSent) {
            events.push({ isPre: false, stage: stage.id });
          }
          st.actualSent = true;
        }
      }
      
      var finalStageId = isFiveStar ? 4 : 1;
      var actualTarget = isFiveStar ? targetTime + 60000 : targetTime;
      if (!slot.isNotified && now >= actualTarget && state[finalStageId] && state[finalStageId].completed) {
        slot.isNotified = true;
        updated = true;
      }
      
      for (var e = 0; e < events.length; e++) {
        sendOfflineTelegramNotification(token, chatId, slot, slots, now, events[e].isPre, events[e].stage, preAlarmMinutes);
      }
    }
    
    if (updated) {
      userProperties.setProperty(key, JSON.stringify(userData));
    }
  }
}

function sendOfflineTelegramNotification(token, chatId, triggeringSlot, allSlots, currentTime, isPre, stageId, preAlarmMinutes) {
  var name = triggeringSlot.cropName || '알림';
  var emoji = triggeringSlot.cropEmoji || '🌱';
  var title = "";
  var text = "";
  
  var prefixOffline = "[오프라인 발송] ";
  
  if (triggeringSlot.isFiveStarMode && stageId) {
    var titlePrefix = isPre ? "⏳ [사전알림] #" + name : "🚨 #" + name;
    if (stageId === 4 && !isPre) titlePrefix = "✨ #" + name;
    
    var stageLabel = "";
    if (stageId === 1) stageLabel = isPre ? "(잡초 1차)" : "[잡초 제거 1/4]";
    else if (stageId === 2) stageLabel = isPre ? "(잡초 2차)" : "[잡초 제거 2/4]";
    else if (stageId === 3) stageLabel = isPre ? "(잡초 3차)" : "[잡초 제거 3/4]";
    else if (stageId === 4) stageLabel = isPre ? "(4차/완료)" : "[4차 잡초 / 완료]";
    
    text += "<b>" + prefixOffline + titlePrefix + " " + stageLabel + "</b>\\n\\n";
    
    if (isPre) {
      if (stageId === 4) {
        text += "잡초 제거 " + preAlarmMinutes + "분 전 알림입니다!\\n성공 확률을 위해 잡초를 먼저 뽑고 수확해 주세요!\\n\\n";
      } else {
        text += "잡초 제거 " + preAlarmMinutes + "분 전 알림입니다!\\n미리 준비해 주세요!\\n\\n";
      }
    } else { // isPre가 아님 (정시 알림)
      if (stageId === 4) {
        text += "잡초 제거할 시간이에요! 성공 확률을 위해 마지막 잡초를 먼저 뽑고 수확해 주세요!\\n\\n";
      } else {
        text += "잡초 제거할 시간이에요!\\n\\n";
      }
    }
  } else {
    if (isPre) {
      text += "⏳ <b>" + prefixOffline + "[사전알림] #" + name + "</b>\\n\\n수확 " + preAlarmMinutes + "분 전 알림입니다!\\n미리 준비해 주세요!\\n\\n";
    } else {
      var isCrop = triggeringSlot.cropId && (triggeringSlot.cropId !== 'custom');
      if (isCrop) {
        text += "🌱 <b>" + prefixOffline + "#" + name + " [성장 완료]</b>\\n\\n성장이 완료되었습니다!\\n\\n";
      } else {
        text += "🔔 <b>" + prefixOffline + "#" + name + " [시간 완료]</b>\\n\\n시간이 완료되었습니다!\\n\\n";
      }
    }
  }
  
  var completed = [];
  var upcoming = [];
  
  for (var i = 0; i < allSlots.length; i++) {
    var s = allSlots[i];
    if (s.cropName && s.originalStartTime) {
      var sDuration = Math.max(0, (s.originalDuration || 0) + (s.userOffset || 0));
      var sTargetTime = s.originalStartTime + (sDuration * 1000);
      var sStartTime = s.originalStartTime;
      var actualTarget = s.isFiveStarMode ? sTargetTime + 60000 : sTargetTime;
      
      if (currentTime >= actualTarget) {
        completed.push(s);
      } else {
        upcoming.push({ slot: s, targetTime: sTargetTime, startTime: sStartTime, durationMs: sDuration * 1000 });
      }
    }
  }
  
  var completedText = "";
  for (var k = 0; k < completed.length; k++) {
    var s = completed[k];
    if (s.id !== triggeringSlot.id) {
      completedText += "- " + (s.cropEmoji || '🔔') + " " + s.cropName + "\\n";
    }
  }
  
  if (completedText !== "") {
    text += "<b>✅ 완료된 다른 항목들:</b>\\n" + completedText + "\\n";
  }
  
  function getRemGas(t, stgId, slotId) {
    if (slotId === triggeringSlot.id && stgId === stageId) return null;
    if (currentTime >= t) return null;
    var remMs = t - currentTime;
    var remMinsTotal = Math.floor(remMs / 60000);
    var h = Math.floor(remMinsTotal / 60);
    var mins = remMinsTotal % 60;
    
    var currDate = new Date(currentTime + 9 * 3600000); // KST Offset
    var targetDate = new Date(t + 9 * 3600000);
    var isTomorrow = currDate.getUTCDate() !== targetDate.getUTCDate() || currDate.getUTCMonth() !== targetDate.getUTCMonth();
    
    var timeStr = "";
    if (h > 0 && mins === 0) timeStr = h + "시간 후";
    else if (h > 0) timeStr = h + "시간 " + mins + "분 후";
    else timeStr = mins + "분 후";
    
    var targetH = targetDate.getUTCHours();
    var targetM = targetDate.getUTCMinutes();
    var targetHStr = targetH < 10 ? "0" + targetH : targetH;
    var targetMStr = targetM < 10 ? "0" + targetM : targetM;
    var absoluteTimeStr = isTomorrow ? "(내일 " + targetHStr + ":" + targetMStr + ")" : "(" + targetHStr + ":" + targetMStr + ")";
    
    return timeStr + absoluteTimeStr;
  }

  var upcomingText = "";
  for (var m = 0; m < upcoming.length; m++) {
    var up = upcoming[m];
    var s = up.slot;
    var cropLines = "";
    
    if (s.isFiveStarMode) {
      var durationMs = up.durationMs;
      var st1 = up.startTime + (durationMs * 1 / 3);
      var st2 = up.startTime + (durationMs * 2 / 3);
      var st3 = up.targetTime - 60000;
      var st4 = up.targetTime + 60000;
      
      var rem1 = getRemGas(st1, 1, s.id);
      var rem2 = getRemGas(st2, 2, s.id);
      var rem3 = getRemGas(st3, 3, s.id);
      var rem4 = getRemGas(st4, 4, s.id);
      
      if (rem1) cropLines += "- 1차 알림: " + rem1 + "\\n";
      if (rem2) cropLines += "- 2차 알림: " + rem2 + "\\n";
      if (rem3) cropLines += "- 3차 알림: " + rem3 + "\\n";
      if (rem4) cropLines += "- 4차 알림: " + rem4 + "\\n";
    } else {
      var rem = getRemGas(up.targetTime, null, s.id);
      if (rem) cropLines += "- 수확: " + rem + "\\n";
    }
    
    if (cropLines !== "") {
      upcomingText += (s.cropEmoji || '⌛') + " " + s.cropName + "\\n" + cropLines;
    }
  }
  
  if (upcomingText !== "") {
    text += "<b>⏳ 남은 항목들:</b>\\n" + upcomingText;
  }
  
  text += "\\n지금 즉시 확인해 보세요! 🥳";
  
  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var payload = {
    "chat_id": chatId,
    "text": text,
    "parse_mode": "HTML"
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  UrlFetchApp.fetch(url, options);
}`;

  const copyGasCodeToClipboard = () => {
    // Strip comments: single line // and multi-line /** */
    const cleanCode = GAS_CODE_TEMPLATE
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
      .split('\n')
      .map(line => {
        // Strip single line comments but ignore URLs (http:// or https://)
        const commentIdx = line.indexOf('//');
        if (commentIdx === -1) return line;
        
        // Check if // is part of a URL
        const isUrl = line.slice(0, commentIdx).match(/https?:$/);
        if (isUrl) return line;
        
        return line.slice(0, commentIdx);
      })
      .join('\n')
      .replace(/\n\s*\n/g, '\n') // Remove empty lines caused by stripped comments
      .trim();

    navigator.clipboard.writeText(cleanCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Synchronize server time on load and on tab focus/visibility change
  useEffect(() => {
    async function syncTime() {
      try {
        const start = Date.now();
        // Send a very lightweight, quick HEAD request to the origin
        const response = await fetch('/index.html', { method: 'HEAD', cache: 'no-store' });
        const end = Date.now();
        const dateHeader = response.headers.get('Date');
        if (dateHeader) {
          const serverDate = new Date(dateHeader).getTime();
          const rtt = end - start;
          const adjustedServerTime = serverDate + (rtt / 2);
          const offset = adjustedServerTime - end;
          setTimeOffset(offset);
        }
      } catch (e) {

        try {
          const start = Date.now();
          const response = await fetch('/api/proxy/time');
          const data = await response.json();
          if (data && data.utc_datetime) {
            const serverDate = new Date(data.utc_datetime).getTime();
            const end = Date.now();
            const rtt = end - start;
            const adjustedServerTime = serverDate + (rtt / 2);
            const offset = adjustedServerTime - end;
            setTimeOffset(offset);
          }
        } catch (err) {

        }
      }
    }

    syncTime();

    // Re-sync on window focus or visibility change to ensure accuracy
    const handleFocus = () => syncTime();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTime();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen to custom local-backup-imported event to dynamically sync guest imported data without page reload
  useEffect(() => {
    const handleBackupImport = () => {
      const savedSlots = localStorage.getItem('farming_slots');
      let finalSlots = slotsRef.current;
      if (savedSlots) {
        const parsed = safeJsonParse(savedSlots, null);
        if (parsed) {
          const ensured = ensure8Slots(parsed);
          setSlots(ensured);
          slotsRef.current = ensured;
          finalSlots = ensured;
        }
      }

      setTelegramToken(localStorage.getItem('tg_bot_token') || '');
      setTelegramChatId(localStorage.getItem('tg_chat_id') || '');
      setGasWebappUrl(localStorage.getItem('tg_gas_url') || '');

      const isTg = localStorage.getItem('is_tg_configured') === 'true';
      const isGas = localStorage.getItem('is_gas_configured') === 'true';
      setIsTelegramConfigured(isTg);
      setIsGasConfigured(isGas);
      
      let finalSound = true;
      const savedSound = localStorage.getItem('farming_sound_enabled');
      if (savedSound) {
        finalSound = safeJsonParse(savedSound, true);
        setSoundEnabled(finalSound);
      }

      let finalKeepActualNotify = false;
      const savedKeepActual = localStorage.getItem('farming_keep_actual_notify');
      if (savedKeepActual) {
        finalKeepActualNotify = savedKeepActual === 'true';
      }

      let finalPresets: CropPreset[] = [];
      const savedPresets = localStorage.getItem('user_notification_presets');
      if (savedPresets) {
        finalPresets = safeJsonParse(savedPresets, []);
        setUserPresets(finalPresets);
      }
    };

    window.addEventListener('local-backup-imported', handleBackupImport);
    window.addEventListener('storage', handleBackupImport);
    return () => {
      window.removeEventListener('local-backup-imported', handleBackupImport);
      window.removeEventListener('storage', handleBackupImport);
    };
  }, []);

  // 1. Subscribe to Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Real-time Cloud Synchronization with Bidirectional Merge and Logout Clear
  useEffect(() => {
    // DO NOT race with App.tsx's conflict resolution modal. 
    // Wait until App.tsx finishes its initial sync and conflict merging.
    if (user && !isGlobalSyncDone) {
      return;
    }

    if (user && !isActive) {
      return;
    }

    const wasResolved = prevUserRef.current && localStorage.getItem('sync_resolved_uid') === prevUserRef.current.uid;
    if (!user) {
      isFarmingInitialSyncDoneRef.current = false;
      if (prevUserRef.current && wasResolved) {
        const prevUid = prevUserRef.current.uid;
        // CLEAR local guest storage on logout ONLY if the session was successfully synced (resolved)
        // This prevents wiping guest progress if a user cancels login at the conflict popup.
        localStorage.removeItem('farming_slots');
        localStorage.removeItem('tg_bot_token');
        localStorage.removeItem('tg_chat_id');
        localStorage.removeItem('tg_gas_url');
        localStorage.removeItem('is_tg_configured');
        localStorage.removeItem('is_gas_configured');
        localStorage.removeItem('local_farming_updated_at');
        localStorage.removeItem('farming_write_lock_at');
        localStorage.removeItem('user_notification_presets');

        // Also clean user-specific keys to thoroughly initialize/clear sensitive values on logout
        localStorage.removeItem(`tg_bot_token_user_${prevUid}`);
        localStorage.removeItem(`tg_chat_id_user_${prevUid}`);
        localStorage.removeItem(`tg_gas_url_user_${prevUid}`);
        localStorage.removeItem(`is_tg_configured_user_${prevUid}`);
        localStorage.removeItem(`is_gas_configured_user_${prevUid}`);
        
        const emptySlots = Array.from({ length: 8 }, (_, i) => ({
          id: `slot_${i + 1}`,
          cropId: null,
          cropName: null,
          cropEmoji: null,
          startTime: null,
          duration: null,
          targetTime: null,
          isNotified: false
        }));
        setSlots(emptySlots);
        slotsRef.current = emptySlots;
        setTelegramToken('');
        setTelegramChatId('');
        setGasWebappUrl('');
        setIsTelegramConfigured(false);
        setIsGasConfigured(false);
        setUserPresets([]);
      } else if (prevUserRef.current) {
        // Restore from local if not resolved (e.g. logout from conflict popup)
        // OR reset to empty if it was a normal logout and localStorage is empty
        const emptySlots = Array.from({ length: 8 }, (_, i) => ({
          id: `slot_${i + 1}`,
          cropId: null,
          cropName: null,
          cropEmoji: null,
          startTime: null,
          duration: null,
          targetTime: null,
          isNotified: false
        }));
        const savedSlots = localStorage.getItem('farming_slots');
        if (savedSlots) {
          const parsed = safeJsonParse(savedSlots, null);
          if (parsed) {
            setSlots(parsed);
            slotsRef.current = parsed;
          } else {
            setSlots(emptySlots);
            slotsRef.current = emptySlots;
          }
        } else {
          setSlots(emptySlots);
          slotsRef.current = emptySlots;
        }

        setTelegramToken(localStorage.getItem('tg_bot_token') || '');
        setTelegramChatId(localStorage.getItem('tg_chat_id') || '');
        setGasWebappUrl(localStorage.getItem('tg_gas_url') || '');
        setIsTelegramConfigured(localStorage.getItem('is_tg_configured') === 'true');
        setIsGasConfigured(localStorage.getItem('is_gas_configured') === 'true');
        setUserPresets(safeJsonParse(localStorage.getItem('user_notification_presets'), []));
      }
      prevUserRef.current = null;
      return;
    }

    prevUserRef.current = user;
    isFarmingInitialSyncDoneRef.current = false;
 
    // Smart guest-to-user migration: if guest has configured details, they will be carried over seamlessly when logging in
    const guestToken = localStorage.getItem('tg_bot_token') || '';
    const guestChatId = localStorage.getItem('tg_chat_id') || '';
    const guestGasUrl = localStorage.getItem('tg_gas_url') || '';
    const guestIsTgStr = localStorage.getItem('is_tg_configured');
    const guestIsGasStr = localStorage.getItem('is_gas_configured');

    let userToken = localStorage.getItem(`tg_bot_token_user_${user.uid}`);
    let userChatId = localStorage.getItem(`tg_chat_id_user_${user.uid}`);
    let userGasUrl = localStorage.getItem(`tg_gas_url_user_${user.uid}`);
    let userIsTgStr = localStorage.getItem(`is_tg_configured_user_${user.uid}`);
    let userIsGasStr = localStorage.getItem(`is_gas_configured_user_${user.uid}`);

    // If the user configuration is omitted or clean/empty, migrate guest-constructed details
    if ((userToken === null || userToken === '') && guestToken !== '') {
      userToken = guestToken;
      localStorage.setItem(`tg_bot_token_user_${user.uid}`, guestToken);
    } else if (userToken === null) {
      userToken = '';
    }

    if ((userChatId === null || userChatId === '') && guestChatId !== '') {
      userChatId = guestChatId;
      localStorage.setItem(`tg_chat_id_user_${user.uid}`, guestChatId);
    } else if (userChatId === null) {
      userChatId = '';
    }

    if ((userGasUrl === null || userGasUrl === '') && guestGasUrl !== '') {
      userGasUrl = guestGasUrl;
      localStorage.setItem(`tg_gas_url_user_${user.uid}`, guestGasUrl);
    } else if (userGasUrl === null) {
      userGasUrl = '';
    }

    if ((userIsTgStr === null || userIsTgStr === 'false') && guestIsTgStr === 'true') {
      userIsTgStr = 'true';
      localStorage.setItem(`is_tg_configured_user_${user.uid}`, 'true');
    } else if (userIsTgStr === null) {
      userIsTgStr = JSON.stringify(userToken.trim() !== '' && userChatId.trim() !== '');
    }

    if ((userIsGasStr === null || userIsGasStr === 'false') && guestIsGasStr === 'true') {
      userIsGasStr = 'true';
      localStorage.setItem(`is_gas_configured_user_${user.uid}`, 'true');
    } else if (userIsGasStr === null) {
      userIsGasStr = JSON.stringify(userGasUrl.trim() !== '');
    }

    setTelegramToken(userToken);
    setTelegramChatId(userChatId);
    setGasWebappUrl(userGasUrl);
    
    localStorage.setItem('tg_bot_token', userToken);
    localStorage.setItem('tg_chat_id', userChatId);
    localStorage.setItem('tg_gas_url', userGasUrl);
 
    const userIsTg = userIsTgStr === 'true';
    const userIsGas = userIsGasStr === 'true';
 
    setIsTelegramConfigured(userIsTg);
    setIsGasConfigured(userIsGas);
 
    localStorage.setItem('is_tg_configured', JSON.stringify(userIsTg));
    localStorage.setItem('is_gas_configured', JSON.stringify(userIsGas));
    localStorage.setItem(`is_tg_configured_user_${user.uid}`, JSON.stringify(userIsTg));
    localStorage.setItem(`is_gas_configured_user_${user.uid}`, JSON.stringify(userIsGas));

    const userDocRef = doc(db, 'users', user.uid);
    let gardenUnsubscribe: any = null;

    // Run one-off initial fetch & migration
    const runInitialSync = async () => {
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          // Cloud doc exists! Priority: Cloud
          const data = docSnap.data();
          let cloudSlots: PlantedSlot[] = [];
          if (data.farmingSlots) {
            cloudSlots = reconstructSlotsFromFarmingSlotsMap(data.farmingSlots);
          } else if (data.slots) {
            cloudSlots = ensure8Slots(data.slots);
            cloudSlots.forEach(s => {
              if (s && s.cropId !== null) {
                if (!s.instanceId) s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                if (!s.updatedAt) s.updatedAt = s.originalStartTime || Date.now();
              }
            });
            // Upgrade legacy slots to farmingSlots on the fly
            const upgradePayload: any = {};
            cloudSlots.forEach(s => {
              if (s && s.cropId !== null && s.instanceId) upgradePayload[s.instanceId] = s;
            });
            if (Object.keys(upgradePayload).length > 0) {
              console.count("[WRITE] setDoc");
              console.log({
                function: "runFarmingSync_upgrade_legacy",
                reason: "farmingSlotsUpgrade",
                path: userDocRef.path,
                time: new Date().toISOString()
              });
              await setDoc(userDocRef, {
                farmingSlots: upgradePayload,
                slots: deleteField(),
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          } else {
            cloudSlots = ensure8Slots([]);
          }

          const finalSlotsToUse = cloudSlots;

          setSlots(finalSlotsToUse);
          slotsRef.current = finalSlotsToUse;
          localStorage.setItem('farming_slots', JSON.stringify(finalSlotsToUse));
          const cloudUpdatedAt = data.updatedAt ? data.updatedAt.toDate().getTime() : Date.now();
          localStorage.setItem('local_farming_updated_at', cloudUpdatedAt.toString());

          if (data.userPresets && Array.isArray(data.userPresets)) {
            const cloudPresetsStr = JSON.stringify(data.userPresets);
            lastSyncedPresetsRef.current = cloudPresetsStr;
            setUserPresets(data.userPresets);
            localStorage.setItem('user_notification_presets', cloudPresetsStr);
          }
          if (data.soundEnabled !== undefined) {
            setSoundEnabled(data.soundEnabled);
            localStorage.setItem('farming_sound_enabled', JSON.stringify(data.soundEnabled));
          }
          if (data.keepActualNotify !== undefined) {
            localStorage.setItem('farming_keep_actual_notify', data.keepActualNotify ? 'true' : 'false');
          }
        } else {
          // Cloud doc does not exist (New user)! Migrate localStorage -> Firestore once.
          const savedLocal = localStorage.getItem('farming_slots');
          const localSlots = ensure8Slots(safeJsonParse(savedLocal, null));
          const farmingSlotsPayload: any = {};
          localSlots.forEach(s => {
            if (s && s.cropId !== null) {
              if (!s.instanceId) s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              if (!s.updatedAt) s.updatedAt = Date.now();
              farmingSlotsPayload[s.instanceId] = s;
            }
          });

          console.count("[WRITE] setDoc");
          console.log({
            function: "runFarmingSync_new_user",
            reason: "farmingSlotSetup",
            path: userDocRef.path,
            time: new Date().toISOString()
          });
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || null,
            farmingSlots: farmingSlotsPayload,
            isTelegramConfigured: userIsTg,
            isGasConfigured: userIsGas,
            userPresets: userPresets,
            soundEnabled: soundEnabled,
            keepActualNotify: false,
            lastAppVersion: APP_VERSION,
            updatedAt: serverTimestamp()
          }, { merge: true });

          setSlots(localSlots);
          slotsRef.current = localSlots;
          localStorage.setItem('farming_slots', JSON.stringify(localSlots));
        }
      } catch (err) {
        console.error("Farming Initial Sync Error:", err);
      } finally {
        isFarmingInitialSyncDoneRef.current = true;
        // Start real-time READ-ONLY updates subscription
        subscribeToRealtimeUpdates();
      }
    };

    const subscribeToRealtimeUpdates = () => {
      gardenUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
        console.log(`[SNAPSHOT] farming (garden) - path: ${userDocRef.path}, exists: ${snapshot.exists()}, hasPendingWrites: ${snapshot.metadata.hasPendingWrites}`);
        try {
          if (snapshot.metadata.hasPendingWrites) {
            return;
          }

          const nowTime = Date.now();
          const globalLock = parseInt(localStorage.getItem('farming_write_lock_at') || '0', 10);
          const timeSinceLastLocalWrite = nowTime - globalLock;
          const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
          if (isFarmingInitialSyncDoneRef.current && hasUnsynced && timeSinceLastLocalWrite < 6000) {
            return;
          }

          if (snapshot.exists()) {
            const data = snapshot.data();
            const cloudUpdatedAt = data.updatedAt ? data.updatedAt.toDate().getTime() : 0;
            
            if (data.userPresets && Array.isArray(data.userPresets)) {
              const cloudPresetsStr = JSON.stringify(data.userPresets);
              const localPresets = localStorage.getItem('user_notification_presets');
              if (cloudPresetsStr !== localPresets) {
                lastSyncedPresetsRef.current = cloudPresetsStr;
                setUserPresets(data.userPresets);
                localStorage.setItem('user_notification_presets', cloudPresetsStr);
              }
            }
            
            let rawCloudSlots: any[] = [];
            if (data.farmingSlots) {
              rawCloudSlots = reconstructSlotsFromFarmingSlotsMap(data.farmingSlots);
            } else if (data.slots) {
              rawCloudSlots = Array.isArray(data.slots) ? data.slots : convertSlotsMapToArray(data.slots);
            }
            const cloudSlots = ensure8Slots(rawCloudSlots);
            
            const cloudSlotsStr = JSON.stringify(cloudSlots);
            const isDataActuallyDifferent = JSON.stringify(slotsRef.current) !== cloudSlotsStr;

            // CRITICAL DEFENSE: If data is identical, ignore the update to avoid trigger loops
            if (isDataActuallyDifferent === false && isFarmingInitialSyncDoneRef.current) {
              return;
            }

            // Update lastSyncedSlotsRef
            lastSyncedSlotsRef.current = cloudSlotsStr;

            const finalIsTelegramConfigured = (data.isTelegramConfigured === true);
            const finalIsGasConfigured = (data.isGasConfigured === true);

            // Only update config state if different
            if (isTelegramConfigured !== finalIsTelegramConfigured) setIsTelegramConfigured(finalIsTelegramConfigured);
            if (isGasConfigured !== finalIsGasConfigured) setIsGasConfigured(finalIsGasConfigured);

            localStorage.setItem('is_tg_configured', JSON.stringify(finalIsTelegramConfigured));
            localStorage.setItem('is_gas_configured', JSON.stringify(finalIsGasConfigured));
            localStorage.setItem(`is_tg_configured_user_${user.uid}`, JSON.stringify(finalIsTelegramConfigured));
            localStorage.setItem(`is_gas_configured_user_${user.uid}`, JSON.stringify(finalIsGasConfigured));

            if (isDataActuallyDifferent) {
              setSlots(cloudSlots);
              slotsRef.current = cloudSlots;
              localStorage.setItem('farming_slots', JSON.stringify(cloudSlots));
              localStorage.setItem('local_farming_updated_at', cloudUpdatedAt.toString());
            }

            isFarmingInitialSyncDoneRef.current = true;
          }
        } catch (error: any) {
          console.error("실시간 크롭 가든 스냅샷 처리 중 오류:", error);
        }
      }, (error) => {
        console.error("Firestore 크롭 가든 동기화 오류:", error);
        const errStr = String(error).toLowerCase();
        if (error?.code === 'permission-denied' || errStr.includes('permission')) {
          onSyncError?.('permission');
        } else if (error?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
          onSyncError?.('quota');
        }
      });
    };

    runInitialSync();

    return () => {
      if (gardenUnsubscribe) gardenUnsubscribe();
    };
  }, [user, isGlobalSyncDone, isActive]);

  // 3. Fallback: Save pots configuration to local storage if user is a guest (offline)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('farming_slots', JSON.stringify(slots));
    }
  }, [slots]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('farming_sound_enabled', JSON.stringify(soundEnabled));
    }
  }, [soundEnabled]);

  // 4. Centralized State Mutators to handle snappy local response + Firestore upload
  const markFarmingModified = () => {
    if (user && !isGlobalSyncDone) {
      console.log("[Farming Sync] Bypassing markFarmingModified because initial global sync is not complete yet.");
      return;
    }
    const now = Date.now();
    localStorage.setItem('local_farming_updated_at', now.toString());
    localStorage.setItem('farming_write_lock_at', now.toString());
    localStorage.setItem('has_unsynced_changes', 'true');
    window.dispatchEvent(new Event('sync-status-changed'));
    localWriteLockRef.current = now;
  };

  const getCompactedSlots = (currentSlots: PlantedSlot[]): PlantedSlot[] => {
    // CRITICAL FIX: Do NOT sort or compact slots. Keep the 8 fixed slots intact in their original positions.
    // This ensures that when a user plants on a specific slot (e.g. Slot 3), it stays on Slot 3 immediately.
    return ensure8Slots(currentSlots);
  };

  const syncWithGas = async (currentSlots: PlantedSlot[], token: string = telegramToken, chatId: string = telegramChatId, url: string = gasWebappUrl) => {
    if (!url || !token || !chatId) return;
    try {
      const payload = {
        telegramToken: token,
        telegramChatId: chatId,
        preAlarmMinutes: fiveStarPreMinutesRef.current || 0,
        keepActualNotify: false,
        slots: currentSlots.map(s => ({
          id: s.id,
          cropName: s.cropName,
          cropEmoji: s.cropEmoji,
          originalStartTime: s.originalStartTime,
          originalDuration: s.originalDuration,
          userOffset: s.userOffset,
          isNotified: s.isNotified,
          isFiveStarMode: s.isFiveStarMode,
          fiveStarNotificationState: s.fiveStarNotificationState || {
            1: { preSent: false, actualSent: false, completed: false },
            2: { preSent: false, actualSent: false, completed: false },
            3: { preSent: false, actualSent: false, completed: false },
            4: { preSent: false, actualSent: false, completed: false }
          }
        }))
      };
      
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {

    }
  };

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const forceManualCloudSync = async () => {
    if (!user) {
      alert("서버와 동기화를 진행하려면 먼저 로그인을 해주세요!");
      return;
    }
    setCloudSyncStatus('syncing');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const farmingSlotsPayload: any = {};
      
      const allKnownInstanceIds = new Set<string>();
      const lastSynced = safeJsonParse(lastSyncedSlotsRef.current, []);
      if (Array.isArray(lastSynced)) {
        lastSynced.forEach((s: any) => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }
      slots.forEach((s: any) => {
        if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
      });
      if (Array.isArray(slotsRef.current)) {
        slotsRef.current.forEach((s: any) => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }

      const activeInstanceIds = new Set(
        slots.filter(s => s && s.cropId !== null && s.instanceId).map(s => s.instanceId)
      );

      allKnownInstanceIds.forEach(id => {
        if (!activeInstanceIds.has(id)) {
          farmingSlotsPayload[id] = deleteField();
        }
      });

      slots.forEach(s => {
        if (s && s.cropId !== null) {
          if (!s.instanceId) {
            s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          }
          if (!s.updatedAt) {
            s.updatedAt = Date.now();
          }
          farmingSlotsPayload[s.instanceId] = {
            ...s,
            instanceId: s.instanceId,
            updatedAt: serverTimestamp()
          };
        }
      });

      console.count("[WRITE] setDoc");
      console.log({
        function: "forceManualCloudSync",
        reason: "manualSync",
        path: userDocRef.path,
        time: new Date().toISOString()
      });
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || null,
        farmingSlots: farmingSlotsPayload,
        slots: deleteField(),
        lastAppVersion: APP_VERSION,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setCloudSyncStatus('success');
      localStorage.removeItem('has_unsynced_changes');
      window.dispatchEvent(new Event('sync-status-changed'));
      alert("🎉 백업되었습니다.");
      setTimeout(() => setCloudSyncStatus('idle'), 2000);
    } catch (err: any) {
      console.error("클라우드 백업 실패:", err);
      setCloudSyncStatus('error');
      const errStr = String(err).toLowerCase();
      if (err?.code === 'permission-denied' || errStr.includes('permission')) {
        onSyncError?.('permission');
      } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
        onSyncError?.('quota');
      }
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
    }
  };

  const syncFarmingStateToFirestore = async (newSlots: PlantedSlot[], oldSlots: PlantedSlot[] = []) => {
    if (!user || !isGlobalSyncDone) return;
    try {
      const farmingSlotsPayload: any = {};
      
      const allKnownInstanceIds = new Set<string>();
      
      const lastSynced = safeJsonParse(lastSyncedSlotsRef.current, []);
      if (Array.isArray(lastSynced)) {
        lastSynced.forEach((s: any) => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }
      
      if (Array.isArray(oldSlots)) {
        oldSlots.forEach(s => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }

      if (Array.isArray(newSlots)) {
        newSlots.forEach(s => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }

      if (Array.isArray(slotsRef.current)) {
        slotsRef.current.forEach(s => {
          if (s && s.instanceId) allKnownInstanceIds.add(s.instanceId);
        });
      }

      const activeInstanceIds = new Set(
        newSlots.filter(s => s && s.cropId !== null && s.instanceId).map(s => s.instanceId)
      );

      allKnownInstanceIds.forEach(id => {
        if (!activeInstanceIds.has(id)) {
          farmingSlotsPayload[id] = deleteField();
        }
      });

      newSlots.forEach(newSlot => {
        if (newSlot && newSlot.cropId !== null) {
          if (!newSlot.instanceId) {
            newSlot.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          }
          if (!newSlot.updatedAt) {
            newSlot.updatedAt = Date.now();
          }

          farmingSlotsPayload[newSlot.instanceId] = {
            ...newSlot,
            instanceId: newSlot.instanceId,
            updatedAt: serverTimestamp()
          };
        }
      });

      if (Object.keys(farmingSlotsPayload).length > 0) {
        const userDocRef = doc(db, 'users', user.uid);
        console.count("[WRITE] setDoc");
        console.log({
          function: "syncFarmingStateToFirestore",
          reason: "farmingSlotUpdated",
          path: userDocRef.path,
          time: new Date().toISOString()
        });
        await setDoc(userDocRef, {
          farmingSlots: farmingSlotsPayload,
          slots: deleteField(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        lastSyncedSlotsRef.current = JSON.stringify(newSlots);
        localStorage.removeItem('has_unsynced_changes');
        window.dispatchEvent(new Event('sync-status-changed'));
      } else {
        localStorage.removeItem('has_unsynced_changes');
        window.dispatchEvent(new Event('sync-status-changed'));
      }
    } catch (err: any) {
      console.error("[Farming Sync Error] Failed to update Firestore:", err);
      const errStr = String(err).toLowerCase();
      if (err?.code === 'permission-denied' || errStr.includes('permission')) {
        onSyncError?.('permission');
      } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
        onSyncError?.('quota');
      }
    }
  };

  const triggerDebouncedFarmingSync = (newSlots: PlantedSlot[]) => {
    if (!isFarmingInitialSyncDoneRef.current) {
      console.warn("[Farming Sync] Skipped triggerDebouncedFarmingSync because initial sync is not complete.");
      return;
    }
    if (farmingSyncTimerRef.current) {
      clearTimeout(farmingSyncTimerRef.current);
    }
    
    farmingSyncTimerRef.current = setTimeout(async () => {
      const oldSlots = lastFarmingSyncSlotsRef.current;
      await syncFarmingStateToFirestore(newSlots, oldSlots);
      lastFarmingSyncSlotsRef.current = newSlots;
    }, 2000);
  };

  const triggerDebouncedPresetsSync = (presets: CropPreset[]) => {
    if (presetsSyncTimerRef.current) {
      clearTimeout(presetsSyncTimerRef.current);
    }
    
    presetsSyncTimerRef.current = setTimeout(async () => {
        if (!user || !isGlobalSyncDone) return;
        const presetsStr = JSON.stringify(presets);
        if (presetsStr === lastSyncedPresetsRef.current) return;
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          userPresets: presets
        }, { merge: true }).catch(() => {});
        lastSyncedPresetsRef.current = presetsStr;
    }, 2000);
  };

  const updateGardenState = async (newSlots: PlantedSlot[]) => {
    if (user && !isFarmingInitialSyncDoneRef.current) {
      console.warn("[Farming Sync] updateGardenState ignored because initial sync is not complete.");
      return;
    }
    const compacted = getCompactedSlots(newSlots);
    const oldSlots = [...slotsRef.current];
    slotsRef.current = compacted;
    setSlots(compacted);
    
    // Sync with GAS
    syncWithGas(compacted);

    // Save to localStorage for instant persist
    localStorage.setItem('farming_slots', JSON.stringify(compacted));
    markFarmingModified();

    // Firestore Sync (Debounced)
    if (user && isGlobalSyncDone) {
      triggerDebouncedFarmingSync(compacted);
    }
  };

  const updateSingleSlotState = async (slotId: string, updatedSlot: PlantedSlot) => {
    if (user && !isFarmingInitialSyncDoneRef.current) {
      console.warn("[Farming Sync] updateSingleSlotState ignored because initial sync is not complete.");
      return;
    }
    // Generate instanceId and updatedAt if missing
    if (updatedSlot.cropId !== null) {
      if (!updatedSlot.instanceId) {
        updatedSlot.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
      updatedSlot.updatedAt = Date.now();
    }

    const baseNextSlots = slotsRef.current.map(s => s.id === slotId ? updatedSlot : s);
    const nextSlots = getCompactedSlots(baseNextSlots);
    const oldSlots = [...slotsRef.current];
    slotsRef.current = nextSlots;
    setSlots(nextSlots);

    // Sync with GAS
    syncWithGas(nextSlots);

    // Save to localStorage
    localStorage.setItem('farming_slots', JSON.stringify(nextSlots));
    markFarmingModified();

    // Firestore Sync (Debounced)
    if (user && isGlobalSyncDone) {
      triggerDebouncedFarmingSync(nextSlots);
    }
  };

  const updateSettings = async (updates: { soundEnabled?: boolean; telegramToken?: string; telegramChatId?: string; gasWebappUrl?: string }) => {
    if (updates.soundEnabled !== undefined) {
      setSoundEnabled(updates.soundEnabled);
      localStorage.setItem('farming_sound_enabled', JSON.stringify(updates.soundEnabled));
    }
    if (updates.telegramToken !== undefined) {
      setTelegramToken(updates.telegramToken);
      localStorage.setItem('tg_bot_token', updates.telegramToken);
      if (user) {
        localStorage.setItem(`tg_bot_token_user_${user.uid}`, updates.telegramToken);
      }
    }
    if (updates.telegramChatId !== undefined) {
      setTelegramChatId(updates.telegramChatId);
      localStorage.setItem('tg_chat_id', updates.telegramChatId);
      if (user) {
        localStorage.setItem(`tg_chat_id_user_${user.uid}`, updates.telegramChatId);
      }
    }
    if (updates.gasWebappUrl !== undefined) {
      setGasWebappUrl(updates.gasWebappUrl);
      localStorage.setItem('tg_gas_url', updates.gasWebappUrl);
      if (user) {
        localStorage.setItem(`tg_gas_url_user_${user.uid}`, updates.gasWebappUrl);
      }
    }

    // Determine configuration metrics
    const nextToken = updates.telegramToken !== undefined ? updates.telegramToken : telegramToken;
    const nextChatId = updates.telegramChatId !== undefined ? updates.telegramChatId : telegramChatId;
    const nextGasUrl = updates.gasWebappUrl !== undefined ? updates.gasWebappUrl : gasWebappUrl;

    const isTgReady = nextToken.trim() !== '' && nextChatId.trim() !== '';
    const isGasReady = nextGasUrl.trim() !== '';

    if (updates.telegramToken !== undefined || updates.telegramChatId !== undefined) {
      setIsTelegramConfigured(isTgReady);
      localStorage.setItem('is_tg_configured', JSON.stringify(isTgReady));
      if (user) {
        localStorage.setItem(`is_tg_configured_user_${user.uid}`, JSON.stringify(isTgReady));
      }
    }

    if (updates.gasWebappUrl !== undefined) {
      setIsGasConfigured(isGasReady);
      localStorage.setItem('is_gas_configured', JSON.stringify(isGasReady));
      if (user) {
        localStorage.setItem(`is_gas_configured_user_${user.uid}`, JSON.stringify(isGasReady));
      }
    }

    if (user) {
      if (settingsSyncTimerRef.current) clearTimeout(settingsSyncTimerRef.current);
      
      settingsSyncTimerRef.current = setTimeout(async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const updatePayload: any = {
            lastAppVersion: APP_VERSION,
            updatedAt: serverTimestamp()
          };
          if (updates.telegramToken !== undefined || updates.telegramChatId !== undefined) {
            updatePayload.isTelegramConfigured = isTgReady;
          }
          if (updates.gasWebappUrl !== undefined) {
            updatePayload.isGasConfigured = isGasReady;
          }
          if (updates.soundEnabled !== undefined) {
            updatePayload.soundEnabled = updates.soundEnabled;
          }
          
          // Only perform write if payload has actual fields besides updatedAt and version
          if (Object.keys(updatePayload).length > 2) {
            console.count("[WRITE] setDoc");
            console.log({
              function: "updateSettings",
              reason: "settingChanged",
              path: userDocRef.path,
              time: new Date().toISOString()
            });
            await setDoc(userDocRef, updatePayload, { merge: true });
          }
        } catch (err: any) {
          const errStr = String(err).toLowerCase();
          if (err?.code === 'permission-denied' || errStr.includes('permission')) {
            onSyncError?.('permission');
          } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
            onSyncError?.('quota');
          }
        }
      }, 3000); // 3 second debounce for settings
    }
  };

  const handleGoogleLogin = async (bypassCheck: boolean = false) => {
    const isIFrame = window.self !== window.top;
    const isWebView = checkIsInAppBrowser();

    if (bypassCheck !== true) {
      if (isWebView) {
        setLoginWarningType('webview');
        return;
      }
      if (isIFrame) {
        setLoginWarningType('iframe');
        return;
      }
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Log the full error for debugging

      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      // If it's just user closing the popup or cancelling, don't show an intrusive alert
      if (
        errorCode === 'auth/popup-closed-by-user' || 
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        return;
      }

      // If we are in an iframe and hadn't shown the warning yet, show it.
      if (isIFrame && !bypassCheck) {
        setLoginWarningType('iframe');
      } else {
        alert(`로그인 중 오류가 발생했습니다.\n\n사유: ${errorMessage || errorCode || '알 수 없는 오류'}\n\n만약 미리보기(iFrame) 중이라면 상단의 [새 창에서 열기] 버튼을 눌러 접속해 보세요!`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await signOut(auth);
      }
      setShowLogoutConfirm(false);
    } catch (err) {
      console.error("[Sync] CropTimer handleLogout failed:", err);
    }
  };

  // Telegram creds check
  useEffect(() => {
    const timer = setInterval(() => {
      setShowTargetTime(prev => !prev);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Keep countdown smooth using 1sec ticker
  useEffect(() => {
    const timer = setInterval(() => {
      // If user is logged in, wait until farming initial sync is done to avoid evaluating/saving stale localStorage
      if (user && !isFarmingInitialSyncDoneRef.current) {
        return;
      }

      const now = Date.now() + timeOffset;
      
      const isInitialTick = (lastCheckTimeRef.current === 0);
      let lastCheckTime = lastCheckTimeRef.current;
      if (lastCheckTime === 0) {
        const saved = localStorage.getItem('gardenLastCheckTime');
        if (saved) {
          lastCheckTime = parseInt(saved, 10);
        } else {
          lastCheckTime = now - 1000;
        }
      }
      lastCheckTimeRef.current = now;
      localStorage.setItem('gardenLastCheckTime', now.toString());

      setCurrentTime(now);

      // Evaluate timers checking completed ones
      const prevSlots = slotsRef.current;
      
      let newlyCompletedSlots: { slot: PlantedSlot; stage?: number; isPre?: boolean; isFresh?: boolean }[] = [];
      let hasSilentlyCompleted = false;
      
      const updatedSlots = prevSlots.map(slot => {
        if (!slot.cropName) return slot;
        
        const { events, updatedSlot, changed } = checkNotificationEvents(
          slot, 
          now, 
          lastCheckTime, 
          fiveStarPreMinutesRef.current || 0
        );

        if (events.length > 0) {
          events.forEach(e => {
            newlyCompletedSlots.push({
              slot: e.slot,
              stage: e.stage,
              isPre: e.isPre,
              isFresh: e.isFresh
            });
          });
        }
        
        if (changed) {
          // If we had no events but it changed, it was a silent completion
          if (events.length === 0) hasSilentlyCompleted = true;
          return updatedSlot;
        }

        return slot;
      });

      if (newlyCompletedSlots.length > 0) {
        if (isInitialTick) {
          // On first load, catch up silently to avoid duplicate notifications or alarm spam for offline-completed events
          const nextSlots = getCompactedSlots(updatedSlots);
          updateGardenState(updatedSlots);
          slotsRef.current = nextSlots;
        } else {
            // Trigger completion alert!
          if (soundEnabled) {
            const fiveStarSlot = newlyCompletedSlots.find(s => s.slot.isFiveStarMode);
            if (fiveStarSlot) {
              const preMins = fiveStarPreMinutesRef.current || 0;
              const prePrefix = fiveStarSlot.isPre ? `${preMins}분 전` : '정시';
              triggerAlarm('fivestar', `잡초 뽑기 ${prePrefix} 알림`);
            } else {
              const firstSlot = newlyCompletedSlots[0].slot;
              triggerAlarm('general', `${firstSlot.cropName} 수확 시간입니다.`);
            }
          }

          // Browser Notification
          if (notificationPermission === 'granted' && typeof Notification !== 'undefined') {
            newlyCompletedSlots.forEach(async ({ slot, stage, isPre }) => {
              let title = `🌱 ${slot.cropName} 성장 완료!`;
              let body = '지금 즉시 수확해 보세요! 🥳';

              if (slot.isFiveStarMode && stage) {
                const preMins = fiveStarPreMinutesRef.current || 0;
                const prePrefix = isPre ? `[${preMins}분 전] ` : '';
                if (stage === 1) { title = `${prePrefix}🌿 ${slot.cropName} [잡초 1/4]`; body = `1차 잡초 제거 시간 ${isPre ? `${preMins}분 전` : '정시'} 알림입니다! 미리 준비해 주세요.`; }
                else if (stage === 2) { title = `${prePrefix}🌿 ${slot.cropName} [잡초 2/4]`; body = `2차 잡초 제거 시간 ${isPre ? `${preMins}분 전` : '정시'} 알림입니다! 미리 준비해 주세요.`; }
                else if (stage === 3) { title = `${prePrefix}⏳ ${slot.cropName} [잡초 3/4]`; body = `3차 잡초 제거 시간 ${isPre ? `${preMins}분 전` : '정시'} 알림입니다! 성장이 곧 완료됩니다.`; }
                else if (stage === 4) { 
                  title = `${prePrefix}✨ ${slot.cropName} [잡초 제거]`; 
                  body = isPre ? `잡초 제거 ${preMins}분전이에요! 미리 대기해주세요` : `잡초 제거할 시간이에요!`; 
                }
              } else if (isPre) {
                const preMins = fiveStarPreMinutesRef.current || 0;
                title = `⏳ [사전알림] ${slot.cropName}`;
                body = `수확 ${preMins}분 전 알림입니다! 미리 준비해 주세요.`;
              } else {
                title = `🔔 [수확알림] ${slot.cropName}`;
                body = `${slot.cropName} 수확할 시간이에요!`;
              }

              const options = {
                body,
                icon: '/images/new_logo.png',
                badge: '/images/new_logo.png',
                vibrate: [200, 100, 200],
                tag: `crop-${slot.id}-${stage || 'done'}`,
                renotify: true,
                data: { url: window.location.href }
              };

              try {
                if ('serviceWorker' in navigator) {
                  const reg = await navigator.serviceWorker.getRegistration();
                  if (reg && reg.showNotification) {
                    reg.showNotification(title, options);
                  } else {
                    new Notification(title, options);
                  }
                } else {
                  new Notification(title, options);
                }
              } catch (err) {
              }
            });
          }

          const nextSlots = getCompactedSlots(updatedSlots);

          // State Update + Persist
          updateGardenState(updatedSlots);
          slotsRef.current = nextSlots;

          // Trigger Telegram Msg if credentials exist and completion is fresh
          if (telegramToken && telegramChatId) {
            if (newlyCompletedSlots.length > 0) {
              sendTelegramMsg(newlyCompletedSlots[0].slot, nextSlots, telegramToken, telegramChatId, now, newlyCompletedSlots[0].stage, newlyCompletedSlots[0].isPre);
            }
          }
        }
      } else if (hasSilentlyCompleted) {
        // Only silently completed slots (long ago) -> update state & persist without triggers
        const nextSlots = getCompactedSlots(updatedSlots);
        updateGardenState(updatedSlots);
        slotsRef.current = nextSlots;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [telegramToken, telegramChatId, soundEnabled, user, timeOffset, notificationPermission]);

  const sendTelegramMsg = async (triggeringSlot: PlantedSlot, allSlots: PlantedSlot[], token: string, chatId: string, currentTime: number, stage?: number, isPre?: boolean) => {
    try {
      const completed = allSlots.filter(s => {
          if (!s.cropName) return false;
          const { targetTime } = getSlotTimes(s);
          if (targetTime === 0) return false;
          const actualTarget = s.isFiveStarMode ? targetTime + 60000 : targetTime;
          return currentTime >= actualTarget;
      });

      const upcoming = allSlots.filter(s => {
          if (!s.cropName) return false;
          const { targetTime } = getSlotTimes(s);
          if (targetTime === 0) return false;
          const actualTarget = s.isFiveStarMode ? targetTime + 60000 : targetTime;
          return currentTime < actualTarget;
      });

      let text = "";

      // Format triggering crop specially
      const name = triggeringSlot.cropName || '알림';
      
      if (triggeringSlot.isFiveStarMode && stage) {
          const preMins = fiveStarPreMinutesRef.current || 0;
          let titlePrefix = isPre ? `⏳ [사전알림] #${name}` : `🚨 #${name}`;
          if (stage === 4 && !isPre) titlePrefix = `✨ #${name}`;
          
          let stageLabel = "";
          if (stage === 1) stageLabel = isPre ? "(잡초 1차)" : "[잡초 제거 1/4]";
          else if (stage === 2) stageLabel = isPre ? "(잡초 2차)" : "[잡초 제거 2/4]";
          else if (stage === 3) stageLabel = isPre ? "(잡초 3차)" : "[잡초 제거 3/4]";
          else if (stage === 4) stageLabel = isPre ? "(4차/완료)" : "[4차 잡초 / 완료]";

          text += `<b>${titlePrefix} ${stageLabel}</b>\n\n`;

          if (isPre) {
              if (stage === 4) {
                  text += `잡초 제거 ${preMins}분 전 알림입니다!\n성공 확률을 위해 잡초를 먼저 뽑고 수확해 주세요!\n\n`;
              } else {
                  text += `잡초 제거 ${preMins}분 전 알림입니다!\n미리 준비해 주세요!\n\n`;
              }
          } else { // isPre가 아님 (정시 알림)
              if (stage === 4) {
                  text += `잡초 제거할 시간이에요! 성공 확률을 위해 마지막 잡초를 먼저 뽑고 수확해 주세요!\n\n`;
              } else {
                  text += `잡초 제거할 시간이에요!\n\n`;
              }
          }
      } else {
          if (isPre) {
              const preMins = fiveStarPreMinutesRef.current || 0;
              text += `⏳ <b>[사전알림] #${name}</b>\n\n수확 ${preMins}분 전 알림입니다!\n미리 준비해 주세요!\n\n`;
          } else {
              const isCrop = triggeringSlot.cropId && cropPresets.find(p => p.id === triggeringSlot.cropId && p.category === 'crop');
              if (isCrop) {
                  text += `🌱 <b>#${name} [성장 완료]</b>\n\n성장이 완료되었습니다!\n\n`;
              } else {
                  text += `🔔 <b>#${name} [시간 완료]</b>\n\n시간이 완료되었습니다!\n\n`;
              }
          }
      }

      const completedItems = completed.filter(s => s.id !== triggeringSlot.id);
      if (completedItems.length > 0) {
          text += `<b>✅ 완료된 다른 항목들:</b>\n`;
          completedItems.forEach(s => text += `- ${s.cropEmoji} ${s.cropName}\n`);
          text += `\n`;
      }

      const getRem = (t: number, stgId: number | null, slotId: string) => {
          if (slotId === triggeringSlot.id && stgId === stage) return null;
          if (currentTime >= t) return null;
          
          const remMs = t - currentTime;
          const remMinsTotal = Math.floor(remMs / 60000);
          const h = Math.floor(remMinsTotal / 60);
          const m = remMinsTotal % 60;
          
          const currDate = new Date(currentTime);
          const targetDate = new Date(t);
          const isTomorrow = currDate.getDate() !== targetDate.getDate() || currDate.getMonth() !== targetDate.getMonth() || currDate.getFullYear() !== targetDate.getFullYear();
          
          let timeStr = "";
          if (h > 0 && m === 0) timeStr = `${h}시간 후`;
          else if (h > 0) timeStr = `${h}시간 ${m}분 후`;
          else timeStr = `${m}분 후`;
          
          const targetH = targetDate.getHours().toString().padStart(2, '0');
          const targetM = targetDate.getMinutes().toString().padStart(2, '0');
          const absoluteTimeStr = isTomorrow ? `(내일 ${targetH}:${targetM})` : `(${targetH}:${targetM})`;
          
          return `${timeStr}${absoluteTimeStr}`;
      };

      let upcomingText = "";
      upcoming.forEach(s => {
          let cropLines = "";
          const { startTime, targetTime, durationMs } = getSlotTimes(s);
          if (startTime === 0) return;
          if (s.isFiveStarMode) {
              const originalDurationMs = (s.originalDuration || 0) * 1000;
              const adjustedStartTime = startTime + (s.userOffset || 0) * 1000;
              const st1 = adjustedStartTime + (originalDurationMs * 1/3);
              const st2 = adjustedStartTime + (originalDurationMs * 2/3);
              const st3 = targetTime - 60000;
              const st4 = targetTime + 60000;

              const rem1 = getRem(st1, 1, s.id);
              const rem2 = getRem(st2, 2, s.id);
              const rem3 = getRem(st3, 3, s.id);
              const rem4 = getRem(st4, 4, s.id);

              if (rem1) cropLines += `- 1차 알림: ${rem1}\n`;
              if (rem2) cropLines += `- 2차 알림: ${rem2}\n`;
              if (rem3) cropLines += `- 3차 알림: ${rem3}\n`;
              if (rem4) cropLines += `- 4차 알림: ${rem4}\n`;
          } else {
              const rem = getRem(targetTime, null, s.id);
              if (rem) cropLines += `- 수확: ${rem}\n`;
          }
          if (cropLines) {
              upcomingText += `${s.cropEmoji || '⌛'} ${s.cropName}\n${cropLines}`;
          }
      });

      if (upcomingText) {
          text += `<b>⏳ 남은 항목들:</b>\n${upcomingText}`;
      }

      text += `\n지금 즉시 확인해 보세요! 🥳`;

      await fetch('/api/proxy/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
    } catch (e) {
    }
  };

  const testTelegramConnection = async () => {
    setTgTestErrorDetail(null);
    let cleanToken = telegramToken.trim();
    
    // Most robust cleaning to handle all common copy-paste errors
    // 1. Remove optional bot prefix if present
    if (cleanToken.toLowerCase().startsWith('bot')) {
      cleanToken = cleanToken.slice(3).trim();
    }
    // 2. If user pasted the whole URL: https://api.telegram.org/bot123:abc/sendMessage
    if (cleanToken.includes('api.telegram.org')) {
      const match = cleanToken.match(/bot([^/]+)/i);
      if (match && match[1]) {
        cleanToken = match[1].trim();
      }
    }
    
    const cleanChatId = telegramChatId.trim();
    const cleanGasUrl = gasWebappUrl ? gasWebappUrl.trim() : '';

    if (!cleanToken || !cleanChatId) {
      setTgTestStatus('error');
      setTgTestErrorDetail('봇 토큰과 Chat ID를 모두 올바르게 입력해 주세요.');
      return;
    }
    if (!cleanToken.includes(':')) {
      setTgTestStatus('error');
      setTgTestErrorDetail('봇 토큰 형식이 올바르지 않습니다. 반드시 숫자가 포함되고 콜론(:)이 들어간 형태여야 합니다. (예: 123456:ABC-DEF...)');
      return;
    }
    setTgTestStatus('sending');
    try {
      const text = `🔔 <b>[PIGTOWN] 텔레그램 연동 테스트입니다.</b>`;
      const res = await fetch('/api/proxy/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cleanToken,
          chat_id: cleanChatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      if (res.ok) {
        setTgTestStatus('success');
        setTelegramToken(cleanToken);
        setTelegramChatId(cleanChatId);
        setGasWebappUrl(cleanGasUrl);
        localStorage.setItem('tg_bot_token', cleanToken);
        localStorage.setItem('tg_chat_id', cleanChatId);
        localStorage.setItem('tg_gas_url', cleanGasUrl);
        updateSettings({ telegramToken: cleanToken, telegramChatId: cleanChatId, gasWebappUrl: cleanGasUrl });
        // Trigger a sync too so GAS gets the data immediately when they test connection successfully!
        syncWithGas(slots, cleanToken, cleanChatId, cleanGasUrl);
      } else {
        setTgTestStatus('error');
        try {
          const data = await res.json();
          if (data && data.description) {
            let userFriendlyMsg = data.description;
            if (data.description.includes("chat not found")) {
              userFriendlyMsg = '채팅방을 찾을 수 없습니다. 봇 채팅방 우측 상단의 [시작(Start)] 버튼을 누르셨는지 확인해 주세요.';
            } else if (data.description.includes("bot can't initiate conversation")) {
              userFriendlyMsg = '봇이 메시지를 먼저 보낼 수 없습니다. 봇 채팅방에서 꼭 [시작(Start)]을 누르셨는지 확인해 주세요.';
            } else if (data.description.includes("unauthorized") || data.description.includes("Unauthorized")) {
              userFriendlyMsg = '토큰 정보가 잘못되었습니다. 봇 토큰 값을 정확히 다시 입력해 주세요.';
            } else if (res.status === 404) {
              userFriendlyMsg = '요청한 경로를 찾을 수 없습니다(404). 봇 토큰이 올바른 형식인지 확인해 주세요. (예: 123456:ABC-DEF...)';
            }
            setTgTestErrorDetail(userFriendlyMsg);
          } else {
            setTgTestErrorDetail(`전송 실패 (HTTP 상태코드: ${res.status})`);
          }
        } catch {
          setTgTestErrorDetail(`전송 실패 (HTTP 상태코드: ${res.status})`);
        }
      }
    } catch (e: any) {
      setTgTestStatus('error');
      setTgTestErrorDetail(e.message || '네트워크 연결 오류가 발생했습니다.');
    }
  };

  const checkNotificationOnPlant = () => {
    if (typeof Notification !== 'undefined' && notificationPermission === 'default' && !hasPromptedForNotifRef.current) {
      setShowNotifWarningModal(true);
      hasPromptedForNotifRef.current = true;
    }
  };

  const requestNotificationPermission = () => {
    if (typeof Notification === 'undefined') {
      alert('이 브라우저는 알림 기능을 지원하지 않습니다.');
      return;
    }
    setShowNotifWarningModal(true);
  };

  const requestNotificationPermissionActual = async () => {
    if (window.self !== window.top) {
      alert('⚠️ 현재 미리보기(iFrame) 모드에서는 브라우저 보안 정책상 알림이 제한될 수 있습니다. 상단의 [새 창에서 열기] 버튼을 눌러 접속하시면 정상적으로 알림을 받으실 수 있습니다.');
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      const title = '🔔 PIG TOWN 알림 활성화';
      const options = {
        body: '이제 등록한 시간이나 작물 성장이 완료되면 알려드릴게요!',
        icon: '/images/new_logo.png',
        badge: '/images/new_logo.png',
        vibrate: [100, 50, 100],
        tag: 'welcome-notif',
        renotify: true
      };

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            reg.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        } else {
          new Notification(title, options);
        }
      } catch (err) {
      }
    } else if (permission === 'denied') {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.');
    }
  };

  const executePlantPreset = (slotId: string, preset: CropPreset) => {
    checkNotificationOnPlant();
    const now = Math.floor((Date.now() + timeOffset) / 1000) * 1000;
    const initialNotificationState = calculateSlotNotificationState(
      isFiveStarMode,
      now,
      preset.defaultTime,
      0,
      fiveStarPreMinutes,
      now,
      undefined
    );

    const updatedSlot: PlantedSlot = {
      id: slotId,
      cropId: preset.id,
      cropName: preset.name,
      cropEmoji: preset.emoji,
      originalStartTime: now,
      originalDuration: preset.defaultTime,
      userOffset: 0,
      isNotified: false,
      isFiveStarMode: isFiveStarMode,
      notifiedStages: [],
      fiveStarNotificationState: initialNotificationState
    };
    updateSingleSlotState(slotId, updatedSlot);
    setSelectedSlotId(null);
    setEditingSlotId(null);
    setPendingHarvestSlotId(null);
    setIsConfigExpanded(false);
  };

  const handlePlantPreset = (slotId: string, preset: CropPreset) => {
    if (isFiveStarMode) {
      setFiveStarPendingData({ type: 'preset', slotId, preset });
    } else {
      executePlantPreset(slotId, preset);
    }
  };

  const executePlantCustomNameAndTime = (slotId: string) => {
    checkNotificationOnPlant();
    const parsedMinutes = Math.max(0, parseInt(customMinutes) || 0);
    const parsedHours = Math.max(0, parseInt(customHours) || 0);
    const parsedSeconds = Math.max(0, parseInt(customSeconds) || 0);
    const totalSeconds = (parsedHours * 3600) + (parsedMinutes * 60) + parsedSeconds;

    if (totalSeconds <= 0) return;

    const resolvedName = customCropName.trim() || '커스텀 알림';
    const now = Math.floor((Date.now() + timeOffset) / 1000) * 1000;
    const currentCropId = editingSlotId ? (slotsRef.current.find(s => s.id === slotId)?.cropId || 'custom') : 'custom';
    const initialNotificationState = calculateSlotNotificationState(
      isFiveStarMode,
      now,
      totalSeconds,
      0,
      fiveStarPreMinutes,
      now,
      undefined
    );

    const updatedSlot: PlantedSlot = {
      id: slotId,
      cropId: currentCropId,
      cropName: resolvedName,
      cropEmoji: customEmoji,
      originalStartTime: now,
      originalDuration: totalSeconds,
      userOffset: 0,
      isNotified: false,
      isFiveStarMode: isFiveStarMode,
      notifiedStages: [],
      fiveStarNotificationState: initialNotificationState
    };
    updateSingleSlotState(slotId, updatedSlot);
    setSelectedSlotId(null);
    setEditingSlotId(null);
    setPendingHarvestSlotId(null);
    setIsConfigExpanded(false);
  };

  const handlePlantCustomNameAndTime = (slotId: string) => {
    const parsedMinutes = Math.max(0, parseInt(customMinutes) || 0);
    const parsedHours = Math.max(0, parseInt(customHours) || 0);
    const parsedSeconds = Math.max(0, parseInt(customSeconds) || 0);
    const totalSeconds = (parsedHours * 3600) + (parsedMinutes * 60) + parsedSeconds;

    if (totalSeconds <= 0) return;

    if (isFiveStarMode) {
      setFiveStarPendingData({ type: 'custom', slotId });
    } else {
      executePlantCustomNameAndTime(slotId);
    }
  };

  const handleCancelModalAndEmptyIfPending = () => {
    setPendingHarvestSlotId(null);
    setSelectedSlotId(null);
    setEditingSlotId(null);
    setShowModeSelection(false);
  };

  const adjustTime = (slotId: string, secondsChange: number) => {
    const slot = slotsRef.current.find(s => s.id === slotId);
    if (slot && slot.originalStartTime) {
      const now = Date.now() + timeOffset;
      const { startTime, targetTime, durationMs } = getSlotTimes(slot);
      const newTarget = targetTime + (secondsChange * 1000);
      
      const actualRemaining = Math.max(0, (newTarget - now) / 1000);
      
      const newOffset = (slot.userOffset || 0) + secondsChange;

      const fiveStarNotificationState = calculateSlotNotificationState(
        !!slot.isFiveStarMode,
        getMs(slot.originalStartTime) || 0,
        slot.originalDuration || 0,
        newOffset,
        fiveStarPreMinutes,
        now,
        slot.fiveStarNotificationState
      );

      const finalStageId = slot.isFiveStarMode ? 4 : 1;
      const updatedSlot: PlantedSlot = {
        ...slot,
        userOffset: newOffset,
        isNotified: fiveStarNotificationState?.[finalStageId]?.completed || false,
        fiveStarNotificationState: fiveStarNotificationState
      };
      updateSingleSlotState(slotId, updatedSlot);
      setIsConfigExpanded(false);
    }
  };

  const forceComplete = (slotId: string) => {
    const slot = slotsRef.current.find(s => s.id === slotId);
    if (slot && slot.originalStartTime) {
      const now = Date.now() + timeOffset;
      const { targetTime } = getSlotTimes(slot);
      const timeRemainingMs = targetTime - now;
      const offsetReductionSec = Math.floor(timeRemainingMs / 1000) + 1; // subtract remaining time
      
      const updatedSlot: PlantedSlot = {
        ...slot,
        userOffset: (slot.userOffset || 0) - offsetReductionSec,
        isNotified: false
      };
      updateSingleSlotState(slotId, updatedSlot);
      setIsConfigExpanded(false);
    }
  };

  const handleEditClick = (slot: PlantedSlot) => {
    setEditingSlotId(slot.id);
    setSelectedSlotId(slot.id);
    setShowModeSelection(false);
    setIsFiveStarMode(slot.isFiveStarMode || false);
    setCustomCropName('');
    setCustomEmoji('');
    setCustomHours('');
    setCustomMinutes('');
    setCustomSeconds('');
  };

  const handleHarvestAndReplant = (slotId: string) => {
    stopAlarm();
    if (soundEnabled) {
      playHarvestSound();
    }
    const slot = slotsRef.current.find(s => s.id === slotId);
    if (slot) {
      const now = Math.floor((Date.now() + timeOffset) / 1000) * 1000;
      const prevDuration = slot.originalDuration || 60;
      const fiveStarNotificationState = calculateSlotNotificationState(
        !!slot.isFiveStarMode,
        now,
        prevDuration,
        0,
        fiveStarPreMinutes,
        now,
        undefined
      );

      const finalStageId = slot.isFiveStarMode ? 4 : 1;
      const updatedSlot: PlantedSlot = {
        ...slot,
        originalStartTime: now,
        userOffset: 0,
        isNotified: fiveStarNotificationState?.[finalStageId]?.completed || false,
        notifiedStages: [],
        fiveStarNotificationState: fiveStarNotificationState
      };
      updateSingleSlotState(slotId, updatedSlot);
      setIsConfigExpanded(false);
    }
  };

  const handleModifyTime = () => {
    if (!timeAdjustSlotId) return;
    const slot = slotsRef.current.find(s => s.id === timeAdjustSlotId);
    if (!slot || !slot.originalStartTime) return;

    const parsedMinutes = Math.max(0, Math.floor(Number(adjustMinutes) || 0));
    const parsedHours = Math.max(0, Math.floor(Number(adjustHours) || 0));
    const parsedSeconds = Math.max(0, Math.floor(Number(adjustSeconds) || 0));
    const totalSeconds = (parsedHours * 3600) + (parsedMinutes * 60) + parsedSeconds;

    if (totalSeconds <= 0) return;

    const now = Math.floor((Date.now() + timeOffset) / 1000) * 1000;
    const { startTime } = getSlotTimes(slot);
    
    // We want to calculate the new offset required to make the time remaining equal to totalSeconds
    // remaining = targetTime - now => new targetTime = now + totalSeconds
    // targetTime = startTime + originalDuration + newOffset
    // => newTargetTime = targetTime = now + totalSeconds
    // => newOffset = (newTargetTime - startTime - originalDuration) / 1000
    const isFiveStar = !!slot.isFiveStarMode;
    const newTargetTime = now + (totalSeconds * 1000);
    const newOffset = (newTargetTime - startTime - ((slot.originalDuration || 0) * 1000)) / 1000;
    
    const fiveStarNotificationState = calculateSlotNotificationState(
      isFiveStar,
      getMs(slot.originalStartTime) || 0,
      slot.originalDuration || 0,
      newOffset,
      fiveStarPreMinutes,
      now,
      slot.fiveStarNotificationState
    );

    const finalStageId = isFiveStar ? 4 : 1;
    const updatedSlot: PlantedSlot = {
      ...slot,
      userOffset: newOffset,
      isNotified: fiveStarNotificationState?.[finalStageId]?.completed || false,
      fiveStarNotificationState: fiveStarNotificationState
    };

    updateSingleSlotState(timeAdjustSlotId, updatedSlot);
    setTimeAdjustSlotId(null);
    setIsConfigExpanded(false);
  };

  const incrementHarvestCountOnly = async (nextCount: number) => {
    // Removed implementation as requested
  };

  const handleHarvestAndChange = (slotId: string) => {
    stopAlarm();
    if (soundEnabled) {
      playHarvestSound();
    }
    setPendingHarvestSlotId(slotId);
    setCustomCropName('');
    setCustomEmoji('');
    setCustomHours('');
    setCustomMinutes('');
    setCustomSeconds('');
    
    const skip = localStorage.getItem('skip_crop_mode_selection') === 'true';
    const defaultMode = localStorage.getItem('default_crop_alarm_mode') || 'normal';
    
    if (skip) {
      setShowModeSelection(false);
      setIsFiveStarMode(defaultMode === 'fivestar');
    } else {
      setShowModeSelection(true);
      setIsFiveStarMode(false);
    }
    
    setSelectedSlotId(slotId);
    setIsConfigExpanded(false);
  };
  const handleHarvest = (slotId: string) => {
    stopAlarm();
    // Play sound
    if (soundEnabled) {
      playHarvestSound();
    }

    // Empty the pot slot
    const updatedSlot: PlantedSlot = {
      id: slotId,
      cropId: null,
      cropName: null,
      cropEmoji: null,
      originalStartTime: null,
      originalDuration: null,
      userOffset: 0,
      isNotified: false,
      isFiveStarMode: false,
      notifiedStages: []
    };
    updateSingleSlotState(slotId, updatedSlot);
    setIsConfigExpanded(false);
  };

  const handleUproot = (slotId: string) => {
    stopAlarm();
    setDeletingSlotId(slotId);
    setIsConfigExpanded(false);
  };

  const saveTgCredentials = () => {
    let cleanToken = telegramToken.trim();
    if (cleanToken.toLowerCase().startsWith('bot')) {
      cleanToken = cleanToken.slice(3).trim();
    }
    if (cleanToken.includes('api.telegram.org')) {
      const match = cleanToken.match(/bot([^/]+)/i);
      if (match && match[1]) {
        cleanToken = match[1].trim();
      }
    }
    const cleanChatId = telegramChatId.trim();
    const cleanGasUrl = gasWebappUrl ? gasWebappUrl.trim() : '';

    setTelegramToken(cleanToken);
    setTelegramChatId(cleanChatId);
    setGasWebappUrl(cleanGasUrl);

    localStorage.setItem('tg_bot_token', cleanToken);
    localStorage.setItem('tg_chat_id', cleanChatId);
    localStorage.setItem('tg_gas_url', cleanGasUrl);
    updateSettings({ telegramToken: cleanToken, telegramChatId: cleanChatId, gasWebappUrl: cleanGasUrl });
    // Force an immediate sync with GAS to test if everything connects beautifully
    try {
      syncWithGas(slots, cleanToken, cleanChatId, cleanGasUrl);
    } catch (err) {
      // Fail silently
    }
    setIsTelegramOpen(false);
  };

  const handleCloseTelegramModal = () => {
    const originalToken = localStorage.getItem('tg_bot_token') || '';
    const originalChatId = localStorage.getItem('tg_chat_id') || '';
    const originalGasUrl = localStorage.getItem('tg_gas_url') || '';

    if (
      telegramToken !== originalToken ||
      telegramChatId !== originalChatId ||
      gasWebappUrl !== originalGasUrl
    ) {
      setShowTgDiscardConfirm(true);
    } else {
      setIsTelegramOpen(false);
    }
  };

  const discardTgChanges = () => {
    setTelegramToken(localStorage.getItem('tg_bot_token') || '');
    setTelegramChatId(localStorage.getItem('tg_chat_id') || '');
    setGasWebappUrl(localStorage.getItem('tg_gas_url') || '');
    setShowTgDiscardConfirm(false);
    setIsTelegramOpen(false);
  };

  return (
    <div className="space-y-5 max-w-[1240px] mx-auto w-full px-1 py-2">
      <TelegramHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Collapsible Notification & Sound Settings Panel */}
      <div className={cn(
        "bg-white dark:bg-stone-900 rounded-3xl border shadow-xs overflow-hidden mt-2 transition-all duration-500",
        isConfigExpanded 
          ? "border-sky-200 dark:border-sky-900/50 shadow-md ring-4 ring-sky-50/30 dark:ring-sky-950/20" 
          : "border-neutral-200/50 dark:border-stone-800 shadow-xs"
      )}>
        {/* Accordion Trigger Header */}
        <button
          type="button"
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className={cn(
            "w-full flex items-center justify-between px-5 py-4 transition-all text-left border-b cursor-pointer",
            isConfigExpanded 
              ? "bg-sky-50/60 hover:bg-sky-100/50 border-sky-100/50 dark:bg-stone-950/40 dark:hover:bg-stone-950/60 dark:border-sky-900/40" 
              : "bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 dark:bg-stone-950/30 dark:hover:bg-stone-950/50 dark:border-indigo-900/40"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-500",
              isConfigExpanded 
                ? "bg-sky-500 text-white border-transparent shadow-sm" 
                : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-transparent"
            )}>
              <motion.div
                animate={{ rotate: isConfigExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Settings className="h-4 w-4" />
              </motion.div>
            </div>
            <div>
              <h3 className={cn(
                "text-[13px] font-black tracking-tight font-sans transition-colors duration-300",
                isConfigExpanded ? "text-sky-950 dark:text-sky-300" : "text-indigo-950 dark:text-indigo-200"
              )}>알림 및 타이머 설정</h3>
              <p className={cn(
                "text-[10px] font-bold mt-0.5 font-sans transition-colors duration-300",
                isConfigExpanded ? "text-sky-700 dark:text-sky-400" : "text-indigo-600 dark:text-indigo-400"
              )}>작물의 성장이 완료되거나 직접 등록한 알림 시간이 되면 알려드립니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isConfigExpanded && (
              <span className="hidden sm:inline-flex items-center text-[11px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 px-2 py-0.5 rounded-md animate-pulse font-sans">설정하기</span>
            )}
            <ChevronDown className={cn("h-4 w-4 text-stone-400 transition-transform duration-300", isConfigExpanded && "rotate-180")} />
          </div>
        </button>

        {/* Collapsible Body using framer-motion */}
        <AnimatePresence initial={false}>
          {isConfigExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-neutral-50/10"
            >
              <div className="p-5 md:p-6 space-y-4">
                {/* 1. 환경 설정 조작부 (Sound enabled, Browser push, Telegram setup - Grid of 3 columns) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {/* Sound Toggle */}
                  <div
                    onClick={() => updateSettings({ soundEnabled: !soundEnabled })}
                    className={cn(
                      "relative group cursor-pointer transition-all border rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-white dark:bg-stone-900 active:scale-[0.98] select-none shadow-xs",
                      soundEnabled 
                        ? 'border-amber-300 dark:border-amber-400/50 shadow-sm bg-amber-50 dark:bg-amber-400/10 hover:border-amber-400 dark:hover:border-amber-300' 
                        : 'border-neutral-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700'
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSoundSettingsOpen(true);
                      }}
                      className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 sm:p-1.5 rounded-full bg-stone-50 hover:bg-neutral-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 border border-neutral-200/60 dark:border-stone-700/80 shadow-xs transition-all hover:scale-110 hover:rotate-45 duration-300 z-10"
                      title="효과음 세부 설정"
                    >
                      <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className={cn(
                      "p-2 sm:p-3 rounded-xl transition-all duration-300 shrink-0",
                      soundEnabled 
                        ? "bg-amber-100/40 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300" 
                        : "bg-stone-100 dark:bg-stone-850 text-stone-400 dark:text-stone-500 group-hover:bg-stone-200/60 dark:group-hover:bg-stone-800/80"
                    )}>
                      {soundEnabled ? <Volume2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 animate-pulse" /> : <VolumeX className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
                    </div>
                    <div className="flex flex-col items-center w-full gap-1 text-center">
                      <h4 className="text-[11px] sm:text-[13px] font-black text-neutral-900 dark:text-stone-50 font-sans leading-tight break-keep">알림 효과음</h4>
                      <span className={cn(
                        "inline-block text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md leading-none font-sans shadow-xs",
                        soundEnabled 
                          ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border border-amber-200 dark:border-amber-800" 
                          : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-700"
                      )}>
                        {soundEnabled ? '켜짐' : '꺼짐'}
                      </span>
                    </div>
                  </div>

                  {/* Browser Push */}
                  <div
                    onClick={requestNotificationPermission}
                    className={cn(
                      "relative group cursor-pointer transition-all border rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-white dark:bg-stone-900 active:scale-[0.98] select-none shadow-xs",
                      notificationPermission === 'granted'
                        ? 'border-emerald-300 dark:border-emerald-400/50 shadow-sm bg-emerald-50 dark:bg-emerald-400/10 hover:border-emerald-400 dark:hover:border-emerald-300'
                        : 'border-neutral-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotifWarningModal(true);
                      }}
                      className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 sm:p-1.5 rounded-full bg-stone-50 hover:bg-neutral-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 border border-neutral-200/60 dark:border-stone-700/80 shadow-xs transition-all hover:scale-110 hover:rotate-45 duration-300 z-10"
                      title="브라우저 알림 설정"
                    >
                      <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className={cn(
                      "p-2 sm:p-3 rounded-xl transition-all duration-300 shrink-0",
                      notificationPermission === 'granted'
                        ? "bg-emerald-100/40 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                        : "bg-stone-100 dark:bg-stone-850 text-stone-400 dark:text-stone-500 group-hover:bg-stone-200/60 dark:group-hover:bg-stone-800/80"
                    )}>
                      <Smartphone className="h-4.5 w-4.5 sm:h-5 sm:w-5 dark:text-emerald-400" />
                    </div>
                    <div className="flex flex-col items-center w-full gap-1 text-center">
                      <h4 className="text-[11px] sm:text-[13px] font-black text-neutral-900 dark:text-stone-50 font-sans leading-tight break-keep">브라우저 알림</h4>
                      <span className={cn(
                        "inline-block text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md leading-none font-sans shadow-xs",
                        notificationPermission === 'granted'
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-700"
                      )}>
                        {notificationPermission === 'granted' ? '켜짐' : '꺼짐'}
                      </span>
                    </div>
                  </div>

                  {/* Telegram Toggle Button */}
                  <div
                    onClick={() => setIsTelegramOpen(true)}
                    className={cn(
                      "relative group cursor-pointer transition-all border rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-white dark:bg-stone-900 active:scale-[0.98] select-none shadow-xs",
                      (telegramToken && telegramChatId)
                        ? 'border-emerald-300 dark:border-emerald-400/50 shadow-sm bg-emerald-50 dark:bg-emerald-400/10 hover:border-emerald-400 dark:hover:border-emerald-300'
                        : 'border-neutral-200 dark:border-stone-800 hover:border-slate-400 dark:hover:border-stone-500'
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTelegramOpen(true);
                      }}
                      className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 sm:p-1.5 rounded-full bg-stone-50 hover:bg-neutral-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 border border-neutral-200/60 dark:border-stone-700/80 shadow-xs transition-all hover:scale-110 hover:rotate-45 duration-300 z-10"
                      title="텔레그램 봇 설정"
                    >
                      <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className={cn(
                      "p-2 sm:p-3 rounded-xl transition-all duration-300 shrink-0",
                      (telegramToken && telegramChatId)
                        ? "bg-emerald-100/40 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                        : "bg-stone-100 dark:bg-stone-850 text-stone-500 dark:text-stone-400 group-hover:bg-stone-200/60 dark:group-hover:bg-stone-800/80"
                    )}>
                      <Bell className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5 dark:text-emerald-400", (telegramToken && telegramChatId) ? "animate-bounce" : "")} />
                    </div>
                    <div className="flex flex-col items-center w-full gap-1 text-center">
                      <h4 className="text-[11px] sm:text-[13px] font-black text-neutral-900 dark:text-stone-50 font-sans leading-tight break-keep">텔레그램 알림</h4>
                      <span className={cn(
                        "inline-block text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md leading-none font-sans shadow-xs",
                        (telegramToken && telegramChatId)
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-850 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-250 dark:border-stone-700"
                      )}>
                        {(telegramToken && telegramChatId) ? '켜짐' : '꺼짐'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 알림 수신 조건 안내팁 */}
                <div className="bg-neutral-100/50 dark:bg-stone-850 border border-neutral-200/40 dark:border-stone-800 p-4 rounded-2xl text-[11px] text-neutral-500 dark:text-stone-400 leading-relaxed font-semibold text-left space-y-1.5 shadow-2xs font-sans">
                  <p className="flex items-center gap-1.5 text-neutral-700 dark:text-stone-300 font-extrabold text-xs font-sans">
                    <span className="text-amber-500 shrink-0 text-sm">💡</span>
                    <span>알림 수신 조건 안내</span>
                  </p>
                  <div className="pl-4.5 space-y-1 text-neutral-500 dark:text-stone-400 font-medium leading-relaxed font-sans">
                    <p>• <strong className="text-neutral-750 dark:text-stone-300 font-sans">브라우저 알림 &amp; 1단계:</strong> 현재 보고 계신 이 인터넷 페이지 창(탭)이 활성화되어 켜져 있는 동안에만 알림이 발송됩니다.</p>
                    <p>• <strong className="text-emerald-700 dark:text-emerald-400 font-sans">텔레그램 2단계 (권장):</strong> PC/휴대폰이 오프라인 상태여도 알림을 실시간으로 받으실 수 있습니다.</p>
                  </div>
                </div>

                {/* Telegram Configuration Expandable Form (Now managed in global Modal further down) */}
                <AnimatePresence>
                  {false && isTelegramOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-neutral-50 dark:bg-stone-850 rounded-2xl border border-neutral-200 dark:border-stone-800 p-4 md:p-6 space-y-6 mt-4 animate-fadeIn">
                        
                        {/* Tabs for Telegram setup */}
                        <div className="flex border-b border-neutral-200 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => setTgTab('basic')}
                            className={cn(
                              "px-5 py-2.5 text-xs font-black transition-all border-b-2 -mb-px flex items-center gap-1.5",
                              tgTab === 'basic'
                                ? "border-slate-900 text-slate-900 font-extrabold"
                                : "border-transparent text-neutral-400 hover:text-neutral-600"
                            )}
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                            1단계: 실시간 화면 알림 (기본)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTgTab('gas')}
                            className={cn(
                              "px-5 py-2.5 text-xs font-black transition-all border-b-2 -mb-px flex items-center gap-1.5",
                              tgTab === 'gas'
                                ? "border-emerald-600 text-emerald-800 font-extrabold"
                                : "border-transparent text-neutral-400 hover:text-neutral-600"
                            )}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            2단계: 백그라운드 알림 (선택)
                          </button>
                        </div>

                        {/* Tab Content */}
                        {tgTab === 'basic' ? (
                          <div className="space-y-4">
                            {/* 중요 알림 수신 조건 경고판 */}
                            <div className="bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/50 dark:border-amber-900/30 p-4 rounded-2xl space-y-1.5 text-left">
                              <h6 className="text-[11px] font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 font-sans">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                                ⚠️ 꼭 확인해 주세요 (전송 수신 방식)
                              </h6>
                              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed font-semibold pl-5.5 break-keep font-sans">
                                1단계(기본 연동) 방식은 <strong className="text-amber-900 dark:text-amber-200 border-b border-amber-400 dark:border-amber-800 font-sans">스마트폰 화면이나 인터넷 브라우저 창(탭)이 켜져 있는 동안에만</strong> 작물 완료 타이머를 감지하여 텔레그램 메시지를 발송합니다. 브라우저 창을 아예 닫아둔 상태에서도 실시간 전송을 원하시면 꼭 상단의 <strong className="text-emerald-800 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-950 dark:hover:text-emerald-300 font-sans" onClick={() => setTgTab('gas')}>'2단계: 백그라운드 알림 (선택)'</strong> 설정을 마쳐 주시기 바랍니다.
                              </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 space-y-3 shadow-sm flex items-center justify-between">
                              <h5 className="text-[13px] font-black text-neutral-800 flex items-center gap-1.5 font-sans font-sans">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                백그라운드 알림 연동
                              </h5>
                              <button 
                                type="button"
                                onClick={() => setIsHelpModalOpen(true)}
                                className="text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-sans"
                              >
                                도움말 보기
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              <div className="space-y-2 relative">
                                <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-wider block font-sans">텔레그램 봇 토큰 (Bot Token)</label>
                                <div className="relative">
                                  <input
                                    type="password"
                                    placeholder="예: 123456789:ABC..."
                                    value={telegramToken}
                                    onChange={(e) => setTelegramToken(e.target.value)}
                                    className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-3.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs pr-10 text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                                  />
                                   {telegramToken && (
                                     <button onClick={() => setTelegramToken('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600">
                                       <X className="h-4 w-4" />
                                     </button>
                                   )}
                                </div>
                              </div>
                              <div className="space-y-2 relative">
                                <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-wider block font-sans font-sans">Chat ID</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="예: 987654321"
                                    value={telegramChatId}
                                    onChange={(e) => setTelegramChatId(e.target.value)}
                                    className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-3.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs pr-10 text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                                  />
                                   {telegramChatId && (
                                     <button onClick={() => setTelegramChatId('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600">
                                       <X className="h-4 w-4" />
                                     </button>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {/* High Quality visual step guide */}
                            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-neutral-200 dark:border-stone-800 p-4 md:p-5 space-y-4 shadow-xs">
                              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-stone-850 pb-2.5 font-sans font-sans">
                                <h5 className="text-[13px] font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse font-sans">
                                  <Check className="h-4 w-4 bg-emerald-600 text-white rounded-full p-0.5" />
                                  자동화용 구글 스크립트
                                </h5>
                                <button
                                  type="button"
                                  onClick={copyGasCodeToClipboard}
                                  className={cn(
                                    "px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 shadow-xs font-sans",
                                    isCopied 
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                      : "bg-neutral-50 dark:bg-stone-850 hover:bg-neutral-100 dark:hover:bg-stone-800 border-neutral-200 dark:border-stone-700 text-neutral-600 dark:text-stone-400"
                                  )}
                                >
                                  <Copy className="h-3 w-3" />
                                  {isCopied ? '코드 복사 완료!' : '스크립트 코드 복사'}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                                <div className="space-y-3 md:pr-4 md:border-r border-neutral-200/60 dark:border-stone-800 font-sans">
                                  <p className="font-extrabold text-neutral-700 dark:text-stone-300 flex items-center gap-1 font-sans">
                                    <span className="text-[10px] w-4 h-4 rounded-full bg-neutral-200 dark:bg-stone-800 border border-neutral-300 dark:border-stone-700 inline-flex items-center justify-center text-neutral-600 dark:text-stone-400 font-mono">1</span>
                                    구글 서비스 등록
                                  </p>
                                  <ol className="list-decimal pl-4.5 space-y-2 text-neutral-500 leading-relaxed font-semibold font-sans font-sans">
                                    <li>
                                      <a 
                                        href="https://script.google.com" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-emerald-700 underline font-bold hover:text-emerald-800 inline-flex items-center gap-0.5"
                                      >
                                        구글 앱스 스크립트 콘솔 <ExternalLink className="h-3 w-3" />
                                      </a> 에 로그인합니다.
                                    </li>
                                    <li>
                                      왼쪽 상단의 <strong className="text-neutral-800 font-bold">[새 프로젝트 (New Project)]</strong>를 클릭합니다.
                                    </li>
                                    <li>
                                      기존 에디터에 적혀있는 기본 코드를 완전히 다 드래그해서 지우고, 위의 <strong className="text-emerald-800 font-extrabold">우측 상단에 스크립트 코드</strong>를 눌러서 전체 붙여넣기 하세요.
                                    </li>
                                    <li>
                                      상단 툴바의 <strong className="text-neutral-800 font-bold">저장 아이콘(Ctrl + S)</strong>을 눌러 프로젝트를 저장합니다.
                                    </li>
                                  </ol>
                                </div>

                                <div className="space-y-3 font-sans">
                                  <p className="font-extrabold text-neutral-700 flex items-center gap-1 font-sans">
                                    <span className="text-[10px] w-4 h-4 rounded-full bg-neutral-200 border border-neutral-300 inline-flex items-center justify-center text-neutral-600 font-mono">2</span>
                                    배포 및 트리거 생성
                                  </p>
                                  <ol className="list-decimal pl-4.5 space-y-2 text-neutral-500 leading-relaxed font-semibold font-sans font-sans">
                                    <li>
                                      우측 상단 파란색 <strong className="text-neutral-800 font-bold font-sans">[배포 (Deploy)]</strong> 버튼 클릭 {"→"} <strong className="text-neutral-800 font-bold font-sans">[새 배포]</strong> 선택
                                    </li>
                                    <li>
                                      왼쪽 기어 모양 설정을 눌러 유형을 <strong className="text-neutral-800 font-bold font-sans">웹 앱 (Web App)</strong>으로 설정합니다.
                                      <ul className="list-disc pl-4 text-neutral-450 leading-relaxed font-semibold mt-1 font-sans">
                                        <li>설명: 공백도 가능</li>
                                        <li>웹 앱을 실행할 사용자: <strong className="text-neutral-800">나 (본인 이메일)</strong></li>
                                        <li>액세스할 수 있는 사용자: <strong className="text-rose-600 font-sans">모든 사용자 (Anyone)</strong></li>
                                      </ul>
                                    </li>
                                    <li>
                                      하단 배포를 진행한 뒤 <strong className="text-neutral-800 font-bold font-sans">웹 앱 URL</strong> 주소를 복사해 아래 입력 창에 등록해 줍니다.
                                    </li>
                                    <li>
                                      프로젝트 좌측 메뉴 바의 <strong className="text-emerald-700 font-bold font-sans">시계 모양(트리거) 아이콘</strong> 클릭 → <strong className="text-emerald-700 font-bold font-sans">[+ 트리거 추가]</strong> 버튼 클릭 후 아래 설정 저장:
                                      <ul className="list-disc pl-4 text-neutral-450 text-[11px] mt-0.5 space-y-0.5 font-sans">
                                        <li>실행함수: <span className="text-neutral-750 font-extrabold font-sans">pigtown</span></li>
                                        <li>이벤트 소스 선택: <span className="text-neutral-750 font-extrabold font-sans">시간 기반</span> / 트리거 기반 시간 유형 선택: <span className="text-neutral-750 font-extrabold font-sans">분 단위 타이머</span> / 분 간격 선택: <span className="text-neutral-750 font-extrabold font-sans">1분마다</span></li>
                                      </ul>
                                    </li>
                                  </ol>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black text-emerald-800 block font-sans uppercase tracking-wider font-sans">
                                Google Apps Script 웹 앱 배포 URL 주소
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  placeholder="https://script.google.com/macros/s/...exec"
                                  value={gasWebappUrl}
                                  onChange={(e) => setGasWebappUrl(e.target.value)}
                                  className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-3.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all shadow-xs pr-10 text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                                />
                                {gasWebappUrl && (
                                  <button onClick={() => setGasWebappUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600">
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Setting Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 dark:border-stone-800 pt-4">
                          <div className="flex items-center gap-2">
                            {tgTestStatus === 'sending' && (
                              <span className="text-xs text-neutral-500 flex items-center gap-1.5 font-sans">
                                <Hourglass className="h-4 w-4 animate-spin text-slate-400" /> 테스트 메시지를 전송하고 있습니다...
                              </span>
                            )}
                            {tgTestStatus === 'success' && (
                              <span className="text-xs text-slate-900 font-extrabold flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm font-sans">
                                <Check className="h-3.5 w-3.5 border-2 border-slate-900 rounded-full flex items-center justify-center text-[8px] font-black" /> 성공! 테스트 메시지가 전송 되었습니다.
                              </span>
                            )}
                            {tgTestStatus === 'error' && (
                              <div className="flex flex-col items-start gap-1 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 shadow-sm font-sans max-w-sm text-left">
                                <div className="text-xs text-rose-500 font-extrabold flex items-center gap-1.5">
                                  <AlertCircle className="h-4 w-4 shrink-0" /> 실패했습니다. 토큰 정보와 채팅방을 다시 확인해 주세요.
                                </div>
                                {tgTestErrorDetail && (
                                  <div className="text-[11px] font-bold text-rose-600 leading-tight pl-5.5">
                                    ⚠️ {tgTestErrorDetail}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={testTelegramConnection}
                              className="px-4 py-2.5 text-xs font-black bg-slate-900 border border-slate-900 dark:bg-stone-100 dark:border-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-slate-800 dark:hover:bg-stone-200 transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Send className="h-3 w-3" /> 테스트 발송
                            </button>
                            <button
                              type="button"
                              onClick={saveTgCredentials}
                              className={cn(
                                "px-4 py-2.5 text-xs border rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer",
                                (telegramToken.trim() && telegramChatId.trim())
                                  ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white font-black dark:bg-emerald-650 dark:hover:bg-emerald-550 dark:border-emerald-650"
                                  : "border-neutral-200 dark:border-stone-800 text-neutral-400 dark:text-stone-500 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-150 cursor-not-allowed font-bold"
                              )}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Pots (Slots) Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
        {slots.map((slot, index) => {
          const { startTime: calculatedStartTime, targetTime: calculatedTargetTime, durationMs: calculatedDurationMs } = getSlotTimes(slot);
          const targetTimeMs = calculatedTargetTime > 0 ? calculatedTargetTime : null;
          const isPlanted = slot.cropName !== null;
          let remainingSeconds = 0;
          let percent = 0;

          if (isPlanted && targetTimeMs) {
            let actualTarget = slot.isFiveStarMode ? targetTimeMs + 60000 : targetTimeMs;
            let actualDurationSec = (calculatedDurationMs / 1000) + (slot.isFiveStarMode ? 60 : 0);
            remainingSeconds = Math.max(0, Math.floor(actualTarget / 1000) - Math.floor(currentTime / 1000));
            if (actualDurationSec > 0) {
              percent = Math.max(0, Math.min(100, Math.floor(((actualDurationSec - remainingSeconds) / actualDurationSec) * 100)));
            }
          }

          const isFruited = slot.isFiveStarMode 
            ? isPlanted && (slot.isNotified || (targetTimeMs && currentTime >= targetTimeMs + 60000))
            : remainingSeconds === 0 && isPlanted;
          const isSlotCrop = !!(slot.cropId && cropPresets.find(p => p.id === slot.cropId && p.category === 'crop'));

          // Determine current growth stage details
          let stageLabel = '빈 흙 상태';
          let stageEmoji = '🟤';
          let stateStyle = 'bg-neutral-50 border-neutral-200/80 dark:bg-stone-950/40 dark:border-stone-850 dark:text-stone-300';
          
          if (isPlanted) {
            if (isFruited) {
              stageLabel = slot.isFiveStarMode ? '🌿 4차 잡초 제거 필수!' : (isSlotCrop ? '수확 가능' : '타이머 완료');
              stageEmoji = slot.cropEmoji || '🌟';
              stateStyle = slot.isFiveStarMode
                ? 'bg-gradient-to-br from-amber-50 via-yellow-50/70 to-orange-50 border-amber-400 ring-4 ring-amber-500/20 shadow-lg text-amber-950 dark:from-amber-950/45 dark:via-yellow-950/10 dark:to-orange-950/25 dark:border-amber-700 dark:ring-amber-950/35 dark:text-amber-200'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 ring-4 ring-emerald-500/10 shadow-md text-emerald-900 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800 dark:ring-emerald-950/15 dark:text-emerald-300';
            } else if (percent < 30) {
              stageLabel = '진행 중';
              stageEmoji = slot.cropEmoji || '🌱';
              stateStyle = slot.isFiveStarMode
                ? 'bg-gradient-to-br from-amber-50/20 to-white border-amber-300/80 dark:from-amber-950/10 dark:to-stone-900 dark:border-amber-800/80 dark:text-stone-100 shadow-sm'
                : 'bg-white border-neutral-200 shadow-sm dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100';
            } else if (percent < 65) {
              stageLabel = '진행 중';
              stageEmoji = slot.cropEmoji || '🌿';
              stateStyle = slot.isFiveStarMode
                ? 'bg-gradient-to-br from-amber-50/20 to-white border-amber-300/80 dark:from-amber-950/10 dark:to-stone-900 dark:border-amber-800/80 dark:text-stone-100 shadow-sm'
                : 'bg-white border-neutral-200 shadow-sm dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100';
            } else {
              if (slot.isFiveStarMode && percent === 100) {
                stageLabel = '최종 성장 중';
                stageEmoji = slot.cropEmoji || '✨';
              } else {
                stageLabel = '완료 임박';
                stageEmoji = slot.cropEmoji || '🌸';
              }
              stateStyle = slot.isFiveStarMode
                ? 'bg-gradient-to-br from-amber-50/20 to-white border-amber-300/80 dark:from-amber-950/10 dark:to-stone-900 dark:border-amber-800/80 dark:text-stone-100 shadow-sm'
                : 'bg-white border-neutral-200 shadow-sm dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100';
            }
          }

          return (
            <div 
              key={slot.id} 
              className={`relative overflow-hidden rounded-2xl border p-4 pb-4 transition-all flex flex-col justify-between min-h-[300px] h-auto ${stateStyle} hover:shadow-md`}
            >
              {/* 5-Star Background Sparkles (Across upper/middle card, except bottom controls) */}
              {slot.isFiveStarMode && (
                <div className="absolute inset-x-0 top-0 h-[190px] pointer-events-none overflow-hidden select-none z-0">
                  <motion.span
                    animate={{ opacity: [0.15, 0.75, 0.15], scale: [0.6, 1.1, 0.6], y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute left-[12%] top-[15%] text-amber-400 dark:text-amber-300 text-[11px]"
                  >
                    ★
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.5, 1, 0.5], y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                    className="absolute right-[10%] top-[18%] text-yellow-400 dark:text-yellow-300 text-[10px]"
                  >
                    ✦
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.1, 0.65, 0.1], scale: [0.4, 0.9, 0.4], y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 1.1 }}
                    className="absolute left-[22%] top-[45%] text-amber-300 text-[9px]"
                  >
                    ✦
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.15, 0.8, 0.15], scale: [0.7, 1.2, 0.7], y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 0.2 }}
                    className="absolute right-[18%] top-[40%] text-amber-500 text-[12px]"
                  >
                    ★
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.1, 0.7, 0.1], scale: [0.5, 1.1, 0.5], y: [0, -2.5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.7 }}
                    className="absolute left-[8%] top-[65%] text-yellow-400/80 text-[10px]"
                  >
                    ✦
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.6, 1, 0.6], y: [0, -3.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut", delay: 1.4 }}
                    className="absolute right-[12%] top-[60%] text-amber-400/90 text-[11px]"
                  >
                    ✦
                  </motion.span>
                </div>
              )}

              {/* Inline Uproot Cancel Confirmation Overlay */}
              {deletingSlotId === slot.id && (
                <div className="absolute inset-0 bg-neutral-950/95 dark:bg-stone-950/98 z-30 p-4 flex flex-col justify-between text-center animate-fadeIn rounded-xl text-white">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setDeletingSlotId(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center space-y-2 my-auto">
                    <span className="text-3xl animate-bounce">🪓</span>
                    <h5 className="font-extrabold text-neutral-200 text-sm">항목 제거하기</h5>
                    <p className="text-[11px] text-neutral-400 max-w-[200px] leading-relaxed">
                      정말 <span className="text-amber-400 font-bold">{slot.cropName}</span>를 삭제하시겠습니까?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setDeletingSlotId(null)}
                      className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      계속 키우기
                    </button>
                    <button
                      onClick={() => {
                        // Confirm delete
                        const updatedSlot: PlantedSlot = {
                          id: slot.id,
                          cropId: null,
                          cropName: null,
                          cropEmoji: null,
                          originalStartTime: null,
                          originalDuration: null,
                          userOffset: 0,
                          isNotified: false,
                          isFiveStarMode: false
                        };
                        updateSingleSlotState(slot.id, updatedSlot);
                        setDeletingSlotId(null);
                      }}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      삭제하기
                    </button>
                  </div>
                </div>
              )}

              {/* Slot ID Badge */}
              <div className="flex items-center justify-between">
                {slot.isFiveStarMode ? (
                  <span className="text-[11px] font-black text-amber-700 bg-amber-100 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Flame className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    5성 도전 중 #{index + 1}
                  </span>
                ) : (
                  <span className="text-[11px] font-black text-neutral-400 bg-neutral-100 dark:bg-stone-850 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    알림 #{index + 1}
                  </span>
                )}

                {isPlanted && !isFruited && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleUproot(slot.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Plant Visual Center Block */}
              <div className="flex flex-col items-center justify-center py-1.5 text-center space-y-1 my-auto">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={isPlanted ? (slot.cropEmoji || stageEmoji) : 'empty_pot'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: isFruited ? [1, 1.1, 1] : 1, 
                      opacity: 1,
                      rotate: isFruited ? [-3, 3, -3, 0] : 0
                    }}
                    transition={{
                      scale: { repeat: isFruited ? Infinity : 0, duration: 2, ease: "easeInOut" },
                      rotate: { repeat: isFruited ? Infinity : 0, duration: 2, ease: "easeInOut" }
                    }}
                    className={cn(
                      "select-none relative flex items-center justify-center min-h-[60px]",
                      isFruited 
                        ? (slot.isFiveStarMode 
                            ? 'text-4xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.35)] animate-bounce' 
                            : 'text-4xl drop-shadow-[0_4px_10px_rgba(16,185,129,0.25)] animate-bounce')
                        : 'text-4xl'
                    )}
                  >
                    {!isPlanted ? (
                      <div className="flex flex-col items-center justify-center text-4xl select-none opacity-40 hover:opacity-60 transition-opacity">
                        💬
                      </div>
                    ) : (
                      slot.cropEmoji || stageEmoji
                    )}
                    
                    {/* Pulsing halo around completed crops/timers */}
                    {isFruited && (
                      <span className={cn(
                        "absolute -inset-2 rounded-full blur-sm -z-10 animate-ping",
                        slot.isFiveStarMode ? "bg-amber-400/30" : "bg-emerald-400/20"
                      )} />
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="space-y-0.5">
                  <h4 className={cn(
                    "font-bold text-base", 
                    isFruited 
                      ? (slot.isFiveStarMode ? "text-amber-950 dark:text-amber-200" : "text-emerald-900 dark:text-emerald-300") 
                      : "text-neutral-800 dark:text-stone-200"
                  )}>
                    {isPlanted ? `${slot.cropEmoji} ${slot.cropName}` : '비어 있음'}
                  </h4>
                  {isPlanted && (
                    <div className="text-[11px] font-medium text-neutral-400 dark:text-stone-400 flex flex-col items-center justify-center gap-2 pb-3">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full opacity-0", 
                          isFruited 
                            ? (slot.isFiveStarMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500") 
                            : "bg-slate-300 dark:bg-stone-600"
                        )} />
                        {isFruited ? (
                          <span className="flex items-center gap-1">
                            {formatCompletionTime(slot.isFiveStarMode ? (targetTimeMs as number) + 60000 : (targetTimeMs as number), true, true)}
                          </span>
                        ) : (
                          <span>{percent}% 완료</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5-Star completed 4th weeding check notification */}
                {slot.isFiveStarMode && isFruited && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 animate-pulse">⚠️</span>
                    <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                      4차 잡초 제거 후 수확하세요!
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Action and Timing control block */}
              <div className="space-y-2">
                {isPlanted ? (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-1 relative">
                      <div className="flex justify-between gap-4 text-[11px] font-mono font-medium text-neutral-500 dark:text-stone-400 h-5 items-center px-0.5">
                        <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                          {slot.isFiveStarMode && !isFruited && <FiveStarStageLabel slot={slot} now={currentTime} />}
                        </div>
                        <div className="flex-1 flex justify-end">
                          <AnimatePresence mode="wait">
                            {!isFruited && (
                              slot.isFiveStarMode ? (
                                <FiveStarTicker slot={slot} now={currentTime} />
                              ) : (
                                (showTargetTime && remainingSeconds > 60) ? (
                                  <motion.span
                                    key="target"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={cn("text-emerald-600 dark:text-emerald-400 font-medium")}
                                  >
                                    {formatCompletionTime(slot.isFiveStarMode ? (targetTimeMs as number) + 60000 : (targetTimeMs as number), true, false)}
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="remaining"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                  >
                                    {formatTimeLeft(remainingSeconds)} 남음
                                  </motion.span>
                                )
                              )
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-stone-850 rounded-full overflow-hidden relative">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000 ease-out rounded-full relative z-10", 
                            isFruited 
                              ? (slot.isFiveStarMode ? "bg-amber-500" : "bg-emerald-500") 
                              : (slot.isFiveStarMode ? "bg-amber-600 dark:bg-amber-400" : "bg-slate-900 dark:bg-stone-100")
                          )}
                          style={{ width: `${percent}%` }}
                        />
                        {/* 5-Star Mode Dividers */}
                        {slot.isFiveStarMode && (calculatedDurationMs > 0) && (
                          <div className="absolute inset-0 z-20 pointer-events-none">
                            <div className="absolute top-0 bottom-0 border-r border-white/60 dark:border-stone-900/60" style={{ left: `${(((calculatedDurationMs / 1000) / 3) / ((calculatedDurationMs / 1000) + 60)) * 100}%` }} />
                            <div className="absolute top-0 bottom-0 border-r border-white/60 dark:border-stone-900/60" style={{ left: `${(((calculatedDurationMs / 1000) * 2 / 3) / ((calculatedDurationMs / 1000) + 60)) * 100}%` }} />
                            <div className="absolute top-0 bottom-0 border-r border-white/60 dark:border-stone-900/60" style={{ left: `${(Math.max(0, (calculatedDurationMs / 1000) - 60) / ((calculatedDurationMs / 1000) + 60)) * 100}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {slot.isFiveStarMode && !isFruited && <FiveStarSchedule slot={slot} />}

                    {isFruited ? (
                      <div className="flex flex-col gap-1 w-full">
                          <button
                            onClick={() => handleHarvestAndReplant(slot.id)}
                            className={cn(
                              "w-full py-2 rounded-xl text-[11px] font-black shadow-lg flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer",
                              slot.isFiveStarMode 
                                ? "bg-amber-500 text-amber-950 hover:bg-amber-600 shadow-amber-500/10" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                          >
                            {slot.isFiveStarMode ? "✨ 도전 재시작" : "다시알림"}
                          </button>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            <button
                              onClick={() => handleHarvest(slot.id)}
                              className={cn(
                                "py-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer",
                                slot.isFiveStarMode
                                  ? "bg-white hover:bg-amber-50 border-amber-200 text-amber-900 dark:bg-stone-900 dark:hover:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                                  : "bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-stone-900 dark:hover:bg-emerald-950/20 dark:border-emerald-850/80 dark:text-emerald-400"
                              )}
                            >
                              {"알림 끄기"}
                            </button>
                            <button
                              onClick={() => handleHarvestAndChange(slot.id)}
                              className={cn(
                                "py-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer",
                                slot.isFiveStarMode
                                  ? "bg-white hover:bg-amber-50 border-amber-200 text-amber-900 dark:bg-stone-900 dark:hover:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                                  : "bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-stone-900 dark:hover:bg-emerald-950/20 dark:border-emerald-855 dark:text-emerald-400"
                              )}
                            >
                              항목 교체
                            </button>
                          </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 bg-neutral-50 dark:bg-stone-950 p-1.5 rounded-xl border border-neutral-200 dark:border-stone-850">
                        <button
                          onClick={() => {
                            setTimeAdjustSlotId(slot.id);
                            const { targetTime: calculatedTargetTime } = getSlotTimes(slot);
                            const targetTimeMs = calculatedTargetTime > 0 ? calculatedTargetTime : null;
                            const rem = targetTimeMs ? Math.max(0, Math.floor(targetTimeMs / 1000) - Math.floor(currentTime / 1000)) : 0;
                            const mins = Math.floor(rem / 60);
                            const hrs = Math.floor(mins / 60);
                            setAdjustHours(String(hrs));
                            setAdjustMinutes(String(mins % 60));
                            setAdjustSeconds(String(rem % 60));
                          }}
                          className="py-2 bg-white hover:bg-stone-50 text-slate-900 border border-neutral-200 hover:border-slate-300 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-100 dark:border-stone-800 dark:hover:border-stone-700 rounded-lg text-[10px] sm:text-[11px] font-black transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          시간 조정
                        </button>
                        <button
                          onClick={() => handleHarvestAndChange(slot.id)}
                          className="py-2 bg-white hover:bg-stone-50 text-slate-900 border border-neutral-200 hover:border-slate-300 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-100 dark:border-stone-800 dark:hover:border-stone-700 rounded-lg text-[10px] sm:text-[11px] font-black transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          항목 교체
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSlotId(null);
                      const skip = localStorage.getItem('skip_crop_mode_selection') === 'true';
                      const defaultMode = localStorage.getItem('default_crop_alarm_mode') || 'normal';
                      
                      if (skip) {
                        setShowModeSelection(false);
                        setIsFiveStarMode(defaultMode === 'fivestar');
                      } else {
                        setShowModeSelection(true);
                        setIsFiveStarMode(false);
                      }
                      
                      setSelectedSlotId(slot.id);
                      setCustomCropName('');
                      setCustomEmoji('');
                      setCustomHours('');
                      setCustomMinutes('');
                      setCustomSeconds('');
                    }}
                    className="w-full py-9 rounded-2xl border-2 border-dashed border-stone-300 hover:border-slate-800 hover:bg-stone-50 dark:border-stone-700 dark:hover:border-stone-500 dark:hover:bg-stone-950 text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-stone-100 transition-all flex flex-col items-center justify-center gap-2 active:scale-[0.98] font-bold cursor-pointer"
                  >
                    <Plus className="h-6 w-6" />
                    알림/작물 추가
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Telegram Modal Overlay */}
      <AnimatePresence>
        {isTelegramOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseTelegramModal}
              className="fixed inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 15 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 15 }}
               className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-stone-900 p-5 md:p-6 shadow-2xl flex flex-col max-h-[90svh] overflow-hidden border border-neutral-100 dark:border-stone-800 animate-zoomIn z-[310]"
             >
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100 rounded-lg">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left animate-fadeIn">
                    <h3 className="font-extrabold text-sm md:text-base text-neutral-900 dark:text-stone-100">
                      텔레그램 알림 봇 연동 설정
                    </h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold font-sans mt-0.5">실시간 또는 백그라운드 메시지 전송 및 관리</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseTelegramModal}
                  className="p-1 px-1.5 hover:bg-neutral-100 dark:hover:bg-stone-800 rounded-lg text-neutral-500 dark:text-stone-400 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Tabs for Telegram setup - now static and persistent, avoiding scroll intersection whitespace */}
              <div className="flex border-b border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-900 z-10 py-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setTgTab('basic')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-black transition-all border-b-2 -mb-px flex items-center justify-center gap-1.5 cursor-pointer",
                    tgTab === 'basic'
                      ? "border-slate-900 dark:border-white text-slate-900 dark:text-stone-100 font-extrabold"
                      : "border-transparent text-neutral-400 dark:text-stone-500 hover:text-neutral-600 dark:hover:text-stone-300"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  1단계: 실시간 화면 알림 (기본)
                </button>
                <button
                  type="button"
                  onClick={() => setTgTab('gas')}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-black transition-all border-b-2 -mb-px flex items-center justify-center gap-1.5 cursor-pointer",
                    tgTab === 'gas'
                      ? "border-emerald-600 dark:border-emerald-400 text-emerald-800 dark:text-emerald-400 font-extrabold"
                      : "border-transparent text-neutral-400 dark:text-stone-500 hover:text-neutral-600 dark:hover:text-stone-300"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  2단계: 백그라운드 알림 (선택)
                </button>
              </div>

              {/* Scrollable Setup Guides & Form inputs */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 font-sans">
                {/* Tab Content */}
                {tgTab === 'basic' ? (
                  <div className="space-y-4 text-left">
                    {/* 중요 알림 수신 조건 경고판 */}
                    <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/40 p-4 rounded-2xl space-y-1.5">
                      <h6 className="text-[11px] font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 font-sans">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                        ⚠️ 꼭 확인해 주세요 (전송 수신 방식)
                      </h6>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-semibold pl-5.5 break-keep font-sans">
                        1단계(기본 연동) 방식은 <strong className="text-amber-900 dark:text-amber-200 border-b border-amber-400 dark:border-stone-800 font-sans">스마트폰 화면이나 인터넷 브라우저 창(탭)이 켜져 있는 동안에만</strong> 작물 완료 타이머를 감지하여 텔레그램 메시지를 발송합니다. 브라우저 창을 아예 닫아둔 상태에서도 실시간 전송을 원하시면 꼭 상단의 <strong className="text-emerald-805 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-950 dark:hover:text-emerald-300 font-sans" onClick={() => setTgTab('gas')}>'2단계: 백그라운드 알림 (선택)'</strong> 설정을 마쳐 주시기 바랍니다.
                      </p>
                    </div>


                    <div className="bg-neutral-50 dark:bg-stone-950/40 rounded-2xl border border-neutral-200/60 dark:border-stone-800 p-4 shadow-xs flex items-center justify-between">
                      <h5 className="text-[13px] font-black text-neutral-800 dark:text-stone-100 flex items-center gap-2 font-sans select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-stone-100 shrink-0" />
                        텔레그램 연동 가이드
                      </h5>
                      <button 
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        className="text-[11px] bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 text-neutral-700 dark:text-stone-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-sans"
                      >
                        도움말 보기
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2 relative">
                        <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-wider block font-sans">텔레그램 봇 토큰 (Bot Token)</label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="예: 123456789:ABC..."
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-200 p-3.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs pr-10"
                          />
                           {telegramToken && (
                             <button onClick={() => setTelegramToken('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200">
                               <X className="h-4 w-4" />
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-wider block font-sans">Chat ID</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="예: 987654321"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-200 p-3.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs pr-10"
                          />
                           {telegramChatId && (
                             <button onClick={() => setTelegramChatId('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200">
                               <X className="h-4 w-4" />
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 text-left animate-fadeIn">
                    {/* High Quality visual step guide */}
                    <div className="bg-neutral-50 dark:bg-stone-950/40 rounded-2xl border border-neutral-200 dark:border-stone-800 p-4 md:p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-stone-800 pb-2.5 font-sans">
                        <h5 className="text-[13px] font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse font-sans">
                          <Check className="h-4 w-4 bg-emerald-600 text-white rounded-full p-0.5" />
                          자동화용 구글 스크립트
                        </h5>
                        <button
                          type="button"
                          onClick={copyGasCodeToClipboard}
                          className={cn(
                            "px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 shadow-xs font-sans",
                            isCopied 
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450"
                              : "bg-white dark:bg-stone-905 hover:bg-neutral-100 dark:hover:bg-stone-800 border-neutral-200 dark:border-stone-800 text-neutral-600 dark:text-stone-300"
                          )}
                        >
                          <Copy className="h-3 w-3" />
                          {isCopied ? '코드 복사 완료!' : '스크립트 코드 복사'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                        <div className="space-y-3 md:pr-4 md:border-r border-neutral-200/60 dark:border-stone-800 font-sans">
                          <p className="font-extrabold text-neutral-700 dark:text-stone-300 flex items-center gap-1 font-sans">
                            <span className="text-[10px] w-4 h-4 rounded-full bg-neutral-200 dark:bg-stone-800 border border-neutral-300 dark:border-stone-700 inline-flex items-center justify-center text-neutral-600 dark:text-stone-350 font-mono">1</span>
                            구글 서비스 등록
                          </p>
                          <ol className="list-decimal pl-4.5 space-y-2 text-neutral-500 dark:text-stone-400 leading-relaxed font-semibold font-sans">
                            <li>
                              <a 
                                href="https://script.google.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-emerald-700 dark:text-emerald-400 underline font-bold hover:text-emerald-800 inline-flex items-center gap-0.5"
                              >
                                구글 앱스 스크립트 콘솔 <ExternalLink className="h-3 w-3" />
                              </a> 에 로그인합니다.
                            </li>
                            <li>
                              왼쪽 상단의 <strong className="text-neutral-800 dark:text-stone-300 font-bold">[새 프로젝트 (New Project)]</strong>를 클릭합니다.
                            </li>
                            <li>
                              기존 에디터에 적혀있는 기본 코드를 완전히 다 드래그해서 지우고, 위의 <strong className="text-emerald-805 dark:text-emerald-400 font-extrabold">우측 상단에 스크립트 코드</strong>를 눌러서 전체 붙여넣기 하세요.
                            </li>
                            <li>
                              상단 툴바의 <strong className="text-neutral-800 dark:text-stone-300 font-bold">저장 아이콘(Ctrl + S)</strong>을 눌러 프로젝트를 저장합니다.
                            </li>
                          </ol>
                        </div>

                        <div className="space-y-3 font-sans">
                          <p className="font-extrabold text-neutral-700 dark:text-stone-300 flex items-center gap-1 font-sans">
                            <span className="text-[10px] w-4 h-4 rounded-full bg-neutral-200 dark:bg-stone-800 border border-neutral-300 dark:border-stone-700 inline-flex items-center justify-center text-neutral-600 dark:text-stone-350 font-mono">2</span>
                            배포 및 트리거 생성
                          </p>
                          <ol className="list-decimal pl-4.5 space-y-2 text-neutral-500 dark:text-stone-400 leading-relaxed font-semibold font-sans">
                            <li>
                              우측 상단 파란색 <strong className="text-neutral-800 dark:text-stone-300 font-bold font-sans">[배포 (Deploy)]</strong> 버튼 클릭 {"→"} <strong className="text-neutral-800 dark:text-stone-300 font-bold font-sans">[새 배포]</strong> 선택
                            </li>
                            <li>
                              왼쪽 기어 모양 설정을 눌러 유형을 <strong className="text-neutral-800 dark:text-stone-300 font-bold font-sans">웹 앱 (Web App)</strong>으로 설정합니다.
                              <ul className="list-disc pl-4 text-neutral-450 dark:text-stone-500 leading-relaxed font-semibold mt-1 font-sans">
                                <li>설명: 공백도 가능</li>
                                <li>웹 앱을 실행할 사용자: <strong className="text-neutral-800 dark:text-stone-300">나 (본인 이메일)</strong></li>
                                <li>액세스할 수 있는 사용자: <strong className="text-rose-600 dark:text-rose-450 font-sans">모든 사용자 (Anyone)</strong></li>
                              </ul>
                            </li>
                            <li>
                              하단 배포를 진행한 뒤 <strong className="text-neutral-800 dark:text-stone-300 font-bold font-sans">웹 앱 URL</strong> 주소를 복사해 아래 입력 창에 등록해 줍니다.
                            </li>
                            <li>
                              프로젝트 좌측 메뉴 바의 <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-sans">시계 모양(트리거) 아이콘</strong> 클릭 → <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-sans">[+ 트리거 추가]</strong> 버튼 클릭 후 아래 설정 저장:
                              <ul className="list-disc pl-4 text-neutral-450 dark:text-stone-500 text-[11px] mt-0.5 space-y-0.5 font-sans">
                                <li>실행함수: <span className="text-neutral-750 dark:text-stone-350 font-extrabold font-sans">pigtown</span></li>
                                <li>이벤트 소스 선택: <span className="text-neutral-750 dark:text-stone-350 font-extrabold font-sans">시간 기반</span> / 트리거 기반 시간 유형 선택: <span className="text-neutral-750 dark:text-stone-350 font-extrabold font-sans">분 단위 타이머</span> / 분 간격 선택: <span className="text-neutral-750 dark:text-stone-350 font-extrabold font-sans">1분마다</span></li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-emerald-800 dark:text-emerald-400 block font-sans uppercase tracking-wider">
                        Google Apps Script 웹 앱 배포 URL 주소
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="https://script.google.com/macros/s/...exec"
                          value={gasWebappUrl}
                          onChange={(e) => setGasWebappUrl(e.target.value)}
                          className="w-full text-xs font-mono rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-3.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs pr-10"
                        />
                        {gasWebappUrl && (
                          <button onClick={() => setGasWebappUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Footer holding Save and Test buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 dark:border-stone-800 pt-4 shrink-0 bg-white dark:bg-stone-900 z-10 w-full mt-2">
                <div className="flex items-center gap-2 text-left justify-start w-full sm:w-auto">
                  {tgTestStatus === 'sending' && (
                    <span className="text-xs text-neutral-500 dark:text-stone-400 flex items-center gap-1.5 font-sans">
                      <Hourglass className="h-4 w-4 animate-spin text-slate-400" /> 테스트 중...
                    </span>
                  )}
                  {tgTestStatus === 'success' && (
                    <span className="text-xs text-slate-800 dark:text-stone-200 font-extrabold flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full border border-slate-200 dark:border-stone-700 shadow-sm font-sans animate-scaleIn">
                      <Check className="h-3.5 w-3.5 border-2 border-slate-900 dark:border-stone-100 rounded-full flex items-center justify-center text-[8px] font-black" /> 성공! 테스트 메시지 발송 완료
                    </span>
                  )}
                  {tgTestStatus === 'error' && (
                    <div className="flex flex-col items-start gap-1 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/40 shadow-sm font-sans max-w-sm">
                      <div className="text-xs text-rose-500 dark:text-rose-450 font-extrabold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" /> 실패! 입력한 정보를 확인해 주세요.
                      </div>
                      {tgTestErrorDetail && (
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-tight pl-5.5">
                          ⚠️ {tgTestErrorDetail}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={testTelegramConnection}
                    className="flex-grow sm:flex-grow-0 px-5 py-3 text-xs font-black bg-slate-900 border border-slate-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-900 rounded-xl hover:bg-slate-800 dark:hover:bg-stone-200 transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer font-sans"
                  >
                    <Send className="h-3 w-3" /> 테스트 발송
                  </button>
                  <button
                    type="button"
                    onClick={saveTgCredentials}
                    className={cn(
                      "flex-1 sm:flex-initial px-5 py-3 text-xs border rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer font-sans",
                      (telegramToken.trim() && telegramChatId.trim())
                        ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white font-black dark:bg-emerald-650 dark:hover:bg-emerald-550 dark:border-emerald-650"
                        : "border-neutral-200 dark:border-stone-800 text-neutral-400 dark:text-stone-500 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-150 cursor-not-allowed font-bold"
                    )}
                  >
                    저장
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discard Confirmation Modal Overlay */}
      <AnimatePresence>
        {showTgDiscardConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTgDiscardConfirm(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-neutral-100 dark:border-stone-850 shrink-0 font-sans z-[510] text-left"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450 rounded-xl shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm md:text-base text-neutral-900 dark:text-stone-100 leading-snug">
                    변경사항 저장 안 됨
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-stone-400 font-semibold mt-1.5 leading-relaxed break-keep">
                    저장되지 않은 설정 변경사항이 있습니다. 정말 저장하지 않고 창을 닫으시겠습니까?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowTgDiscardConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold border border-neutral-200 dark:border-stone-800 hover:border-neutral-300 dark:hover:border-stone-700 text-neutral-600 dark:text-stone-400 bg-neutral-50 dark:bg-stone-800 rounded-xl transition-all font-sans cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={discardTgChanges}
                  className="flex-1 px-4 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md font-sans cursor-pointer m-0"
                >
                  저장 안 함
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preset Custom Selections Modal / Overlay popover */}
      <AnimatePresence>
        {selectedSlotId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                handleCancelModalAndEmptyIfPending();
                setModalTab('crop');
                setShowCustomForm(false);
              }}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={cn(
                "relative w-full rounded-3xl bg-white dark:bg-stone-900 px-4 pt-4 pb-7 sm:p-6 shadow-2xl flex flex-col max-h-[80svh] sm:max-h-[85svh] overflow-hidden border border-neutral-100 dark:border-stone-800 animate-zoomIn",
                showModeSelection ? "max-w-md" : "max-w-lg"
              )}
            >
              {showModeSelection && (
                <button 
                  onClick={() => {
                    handleCancelModalAndEmptyIfPending();
                    setModalTab('crop');
                    setShowCustomForm(false);
                  }}
                  className="absolute top-4 right-4 z-[330] p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-neutral-500 dark:text-stone-400 rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5 rotate-45" />
                </button>
              )}

              {!showModeSelection && (
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                  <div className="flex items-center gap-2">
                    {!editingSlotId && (showCustomForm || !showModeSelection) ? (
                      <button 
                        onClick={() => {
                          if (showCustomForm) {
                            setShowCustomForm(false);
                          } else {
                            setShowModeSelection(true);
                          }
                        }}
                        className="p-1 -ml-1 bg-transparent hover:bg-neutral-100 dark:hover:bg-stone-800 rounded-lg text-neutral-600 dark:text-stone-300 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    ) : (
                      <div className="p-1.5 bg-stone-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100 rounded-lg">
                        <Sprout className="h-5 w-5" />
                      </div>
                    )}
                    <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-stone-100">
                      {editingSlotId 
                        ? "알림 및 타이머 수정" 
                        : (showCustomForm 
                            ? (isFiveStarMode ? "5성 도전 알림 직접 추가" : "일반 알림 직접 추가")
                            : (isFiveStarMode ? "5성 작물 도전 알림(BETA)" : "일반 작물 알림")
                          )
                      }
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      handleCancelModalAndEmptyIfPending();
                      setModalTab('crop');
                      setShowCustomForm(false);
                    }}
                    className="p-1 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-full text-neutral-500 dark:text-stone-400 transition-colors"
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </button>
                </div>
              )}

              <div className={cn(
                "flex-1 overflow-y-auto px-1 pt-3 pb-8 sm:pb-4 space-y-4 sm:space-y-5",
                showModeSelection ? "min-h-0" : "min-h-[410px] sm:min-h-[485px]"
              )}>
                {showModeSelection ? (
                  <div className="py-6 px-2 animate-fadeIn flex flex-col justify-center items-center h-full">
                    <div className="w-full max-w-sm text-left space-y-1.5 mb-6 px-1">
                      <h4 className="text-lg font-extrabold text-neutral-850 dark:text-stone-100">알림 모드 선택</h4>
                      <p className="text-xs text-neutral-400 dark:text-stone-500 font-bold leading-relaxed break-keep">
                        등록하실 알림 유형을 선택해 주세요.<br />
                        5성 모드는 팝업 내에서도 언제든 켜고 끌 수 있습니다.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5 w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFiveStarMode(false);
                          setShowModeSelection(false);
                          if (skipModeSelection) {
                            localStorage.setItem('skip_crop_mode_selection', 'true');
                            localStorage.setItem('default_crop_alarm_mode', 'normal');
                            setDefaultAlarmMode('normal');
                          } else {
                            localStorage.setItem('skip_crop_mode_selection', 'false');
                          }
                        }}
                        className="aspect-square w-full rounded-3xl border-2 border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/5 hover:bg-sky-50 dark:hover:bg-sky-950/15 hover:border-sky-400 dark:hover:border-sky-800 flex flex-col items-center justify-center p-5 transition-all duration-300 group active:scale-[0.96] cursor-pointer shadow-md shadow-sky-500/[0.02]"
                      >
                        <div className="p-3.5 bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 rounded-2xl group-hover:scale-108 transition-transform duration-300 mb-4 shadow-sm">
                          <Sprout className="h-8 w-8" />
                        </div>
                        <span className="font-extrabold text-sm text-sky-950 dark:text-sky-100">일반 작물 알림</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsFiveStarMode(true);
                          setShowModeSelection(false);
                          if (skipModeSelection) {
                            localStorage.setItem('skip_crop_mode_selection', 'true');
                            localStorage.setItem('default_crop_alarm_mode', 'fivestar');
                            setDefaultAlarmMode('fivestar');
                          } else {
                            localStorage.setItem('skip_crop_mode_selection', 'false');
                          }
                        }}
                        className="aspect-square w-full rounded-3xl border-2 border-amber-300 dark:border-amber-900/50 bg-amber-500/[0.04] dark:bg-amber-950/10 hover:bg-amber-500/[0.08] dark:hover:bg-amber-950/20 hover:border-amber-500 dark:hover:border-amber-700 flex flex-col items-center justify-center p-5 transition-all duration-300 group active:scale-[0.96] cursor-pointer shadow-md shadow-amber-500/[0.03] relative"
                      >
                        <span className="absolute top-3 right-3 text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">BETA</span>
                        <div className="p-3.5 bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 rounded-2xl group-hover:scale-108 transition-transform duration-300 mb-4 shadow-sm">
                          <Trophy className="h-8 w-8" />
                        </div>
                        <span className="font-extrabold text-sm text-amber-950 dark:text-amber-100">5성 도전 알림</span>
                      </button>
                    </div>

                    <div className="mt-8 flex flex-col items-start gap-2.5 w-full max-w-sm border-t border-neutral-100 dark:border-stone-800/80 pt-5">
                      <label className="flex items-start gap-2.5 cursor-pointer group select-none text-left">
                        <input
                          type="checkbox"
                          checked={skipModeSelection}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSkipModeSelection(val);
                            localStorage.setItem('skip_crop_mode_selection', val ? 'true' : 'false');
                          }}
                          className="w-4 h-4 rounded-md border-stone-300 dark:border-stone-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
                        />
                        <span className="text-[11.5px] font-black text-neutral-600 dark:text-stone-400 group-hover:text-neutral-800 dark:group-hover:text-stone-200 transition-colors leading-tight">
                          선택한 모드를 기본값으로 설정하기
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Modal Tabs */}
                    {(!showCustomForm) && (
                      <div className="flex p-1 bg-neutral-100 dark:bg-stone-850 rounded-2xl gap-1 mx-3">
                    <button
                      onClick={() => { setModalTab('crop'); setShowCustomForm(false); }}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                        modalTab === 'crop' 
                          ? "bg-white dark:bg-stone-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-300"
                      )}
                    >
                      🥬 작물 알림
                    </button>
                    <button
                      onClick={() => setModalTab('custom')}
                      className={cn(
                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                        modalTab === 'custom' 
                          ? "bg-white dark:bg-stone-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-300"
                      )}
                    >
                      🔔 커스텀 알림
                    </button>
                  </div>
                )}

                {/* Mode 1: Crop Presets */}
                {modalTab === 'crop' && (
                  <div className="space-y-3 animate-fadeIn px-3 scrollbar-hide overflow-y-auto">
                    {/* 5-Star Mode Toggle */}
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl space-y-2 mb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black text-amber-900 dark:text-amber-100 leading-tight">5성 작물 도전 모드</h4>
                            <p className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 leading-tight">잡초 제거 시점마다 알림을 받습니다.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsFiveStarMode(!isFiveStarMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            isFiveStarMode ? "bg-amber-500" : "bg-neutral-200 dark:bg-stone-800"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isFiveStarMode ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {cropPresets.filter(p => p.category === 'crop').map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handlePlantPreset(selectedSlotId, preset)}
                          className="group p-2.5 min-h-[92px] sm:min-h-[96px] border border-neutral-200 dark:border-stone-800 bg-neutral-50/80 dark:bg-stone-950 hover:bg-neutral-100 dark:hover:bg-stone-850 hover:border-slate-300 dark:hover:border-stone-700 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                        >
                          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                          <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-800 dark:text-stone-200 truncate w-full">{preset.name}</span>
                          <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-500 dark:text-stone-400 mt-0.5">
                            {formatTimeLeft(preset.defaultTime)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 2: Custom Tab */}
                {modalTab === 'custom' && (
                  <div className="animate-fadeIn px-3 h-full flex flex-col">
                    {!showCustomForm ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-4">
                        <button
                          onClick={() => {
                            const emojis = [
                              '🌲', '⏰', '⚔️', '🛡️', '📦', '📜', '⚖️',
                              '💎', '💰', '🔑', '🧨', '🧪', '🏹', '🔥',
                              '🏰', '🗺️', '🔔', '✨', '⚡', '🌟', '🧺',
                              '🌿', '🪓', '🌱'
                            ];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            setCustomEmoji(randomEmoji);
                            setShowCustomForm(true);
                          }}
                          className="group p-2.5 border-2 border-dashed border-indigo-200/60 hover:border-indigo-350 dark:border-stone-700/60 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-xs min-h-[92px] sm:min-h-[96px] w-full"
                        >
                          <div className="p-1 px-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-full mb-1 group-hover:scale-105 transition-transform">
                            <Plus className="h-4 w-4 text-indigo-550 dark:text-indigo-450" />
                          </div>
                          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">알림 직접 추가</span>
                        </button>

                        {/* GENERAL PRESETS (Wood, Truffle, etc.) */}
                        {cropPresets.filter(p => p.category === 'general').map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => handlePlantPreset(selectedSlotId, preset)}
                            className="group p-2.5 min-h-[92px] sm:min-h-[96px] border border-neutral-200 dark:border-stone-800 bg-neutral-50/80 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-850 hover:border-slate-300 dark:hover:border-stone-700 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                          >
                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                            <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-800 dark:text-stone-200 truncate w-full">{preset.name}</span>
                            <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-500 dark:text-stone-400 mt-0.5">
                              {formatTimeLeft(preset.defaultTime)}
                            </span>
                          </button>
                        ))}

                        {/* USER-SAVED PRESETS */}
                        {userPresets.map(preset => (
                          <div key={preset.id} className="relative group/btn w-full">
                            <button
                              onClick={() => handlePlantPreset(selectedSlotId, preset)}
                              className="w-full min-h-[92px] sm:min-h-[96px] p-2.5 border border-neutral-200 dark:border-stone-800 bg-neutral-50/80 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-850 hover:border-slate-300 dark:hover:border-stone-700 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-xs"
                            >
                              <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">{preset.emoji}</span>
                              <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-800 dark:text-stone-200 truncate w-full">{preset.name}</span>
                              <span className="text-[10.5px] font-extrabold tracking-tight text-neutral-500 dark:text-stone-400 mt-0.5">
                                {formatTimeLeft(preset.defaultTime)}
                              </span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserPresets(prev => prev.filter(p => p.id !== preset.id));
                              }}
                              className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-white dark:bg-stone-800 border border-neutral-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 rounded-full flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/30 shadow-sm z-10"
                            >
                              <Plus className="h-3 w-3 rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* CUSTOM INPUT FORM - REDESIGNED */
                      <div className="flex flex-col h-full animate-fadeIn justify-between">
                        <div className="flex-1 space-y-2.5 sm:space-y-3.5 pb-2 sm:pb-3">
                          {/* Step 1: Emoji Grid */}
                          <div className="space-y-1">
                            <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-widest px-1">상징 이모지 선택</label>
                            <div className="bg-neutral-50/50 dark:bg-stone-900/30 border border-neutral-100 dark:border-stone-800 rounded-xl p-1.5 sm:p-2 shadow-inner">
                              <div className="grid grid-cols-7 sm:grid-cols-10 gap-1">
                                {[
                                  '🌲', '⏰', '⚔️', '🛡️', '📦', '📜', '⚖️',
                                  '💎', '💰', '🔑', '🧨', '🧪', '🏹', '🔥',
                                  '🏰', '🗺️', '🔔', '✨', '⚡', '🌟', '🧺',
                                  '🌿', '🪓', '🌱'
                                ].map(emo => (
                                  <button
                                    key={emo} type="button" onClick={() => setCustomEmoji(emo)}
                                    className={cn(
                                      "aspect-square text-sm sm:text-base flex items-center justify-center rounded-lg transition-all active:scale-90",
                                      customEmoji === emo 
                                        ? "bg-slate-900 dark:bg-stone-100 shadow-md text-white dark:text-stone-900 scale-105 animate-zoomIn" 
                                        : "bg-white dark:bg-stone-950 hover:bg-neutral-100 dark:hover:bg-stone-800 text-neutral-400 dark:text-stone-600"
                                    )}
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
 
                          {/* Step 2: Name Input (Full Width) */}
                          <div className="space-y-1">
                            <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-widest px-1">알림 이름</label>
                            <div className="relative group">
                              <input 
                                type="text" value={customCropName} onChange={(e) => setCustomCropName(e.target.value)}
                                className="w-full text-base font-black rounded-xl border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-2 sm:py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-neutral-400/50 dark:placeholder:text-stone-600/60 text-neutral-900 dark:text-stone-100 shadow-sm transition-all focus:border-sky-500"
                                placeholder="무엇을 알려드릴까요?"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-neutral-100 dark:bg-stone-900 rounded-lg pointer-events-none">
                                <span className="text-lg">{customEmoji}</span>
                              </div>
                            </div>
                          </div>
 
                          {/* Step 3: Time Settings (Discrete blocks horizontally) */}
                          <div className="space-y-2">
                            {/* 5-Star Mode Toggle for Custom */}
                            <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-[11px] font-black text-amber-900 dark:text-amber-100 uppercase tracking-widest">5성 알림 모드</span>
                              </div>
                              <button 
                                onClick={() => setIsFiveStarMode(!isFiveStarMode)}
                                className={cn(
                                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                  isFiveStarMode ? "bg-amber-500" : "bg-neutral-200 dark:bg-stone-800"
                                )}
                              >
                                <span className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  isFiveStarMode ? "translate-x-4" : "translate-x-0"
                                )} />
                              </button>
                            </div>

                            <label className="text-xs font-black text-neutral-500 dark:text-stone-400 uppercase tracking-widest px-1">시간 설정 (숫자만 입력)</label>
                            <div className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-stone-900/30 border border-neutral-100 dark:border-stone-800 rounded-xl px-4 py-2 sm:py-2.5">
                              <div className="flex items-center gap-2 flex-1 justify-center">
                                <input 
                                  type="number" min="0" value={customHours} onChange={(e) => setCustomHours(e.target.value)}
                                  className="w-16 text-center text-lg font-mono font-black bg-white dark:bg-stone-950 border border-neutral-250 dark:border-stone-800 rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-neutral-900 dark:text-stone-100 placeholder:text-neutral-400/30 dark:placeholder:text-stone-700/50 shadow-sm"
                                  placeholder="0"
                                />
                                <span className="text-xs font-black text-neutral-600 dark:text-stone-400 shrink-0">시간</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-center">
                                <input 
                                  type="number" min="0" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)}
                                  className="w-16 text-center text-lg font-mono font-black bg-white dark:bg-stone-950 border border-neutral-250 dark:border-stone-800 rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-neutral-900 dark:text-stone-100 placeholder:text-neutral-400/30 dark:placeholder:text-stone-700/50 shadow-sm"
                                  placeholder="0"
                                />
                                <span className="text-xs font-black text-neutral-600 dark:text-stone-400 shrink-0">분</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-center">
                                <input 
                                  type="number" min="0" max="59" value={customSeconds} onChange={(e) => setCustomSeconds(e.target.value)}
                                  className="w-16 text-center text-lg font-mono font-black bg-white dark:bg-stone-950 border border-neutral-250 dark:border-stone-800 rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-neutral-900 dark:text-stone-100 placeholder:text-neutral-400/30 dark:placeholder:text-stone-700/50 shadow-sm"
                                  placeholder="0"
                                />
                                <span className="text-xs font-black text-neutral-600 dark:text-stone-400 shrink-0">초</span>
                              </div>
                            </div>
                          </div>
 
                          {/* Save Option */}
                          <div className="flex items-center px-1 pt-4 sm:pt-5.5">
                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                              <div className="relative flex items-center">
                                <input type="checkbox" checked={saveToPresets} onChange={(e) => setSaveToPresets(e.target.checked)} className="peer sr-only" />
                                <div className={cn(
                                  "w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center",
                                  saveToPresets 
                                    ? "border-sky-500 bg-sky-500 text-white" 
                                    : "border-neutral-300 dark:border-stone-700 group-hover:border-sky-500"
                                )}>
                                  {saveToPresets && <Check className="h-3.5 w-3.5 text-white stroke-[3.5] animate-zoomIn" />}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-neutral-700 dark:text-stone-200 group-hover:text-sky-600 transition-colors uppercase leading-none">이 설정을 목록에 저장하기</span>
                                <span className="text-[10px] font-extrabold text-neutral-400 dark:text-stone-500 mt-1 leading-tight">자주 쓰는 타이머 항목에 추가됩니다</span>
                              </div>
                            </label>
                          </div>
                        </div>
 
                        {/* Action Button - Placed at the bottom for balance */}
                        <div className="pt-3 pb-4 sm:pb-2">
                          <button
                            onClick={() => {
                              if (saveToPresets) {
                                const h = parseInt(customHours || '0');
                                const m = parseInt(customMinutes || '0');
                                const s = parseInt(customSeconds || '0');
                                const total = h * 3600 + m * 60 + s;
                                const newPreset: CropPreset = {
                                  id: 'user_' + Date.now(),
                                  name: customCropName.trim() || '알림',
                                  emoji: customEmoji,
                                  defaultTime: total,
                                  color: 'sky',
                                  category: 'general'
                                };
                                setUserPresets(prev => [...prev, newPreset]);
                                setSaveToPresets(false);
                              }
                              handlePlantCustomNameAndTime(selectedSlotId);
                            }}
                            disabled={(!customCropName.trim()) || (parseInt(customHours || '0') <= 0 && parseInt(customMinutes || '0') <= 0 && parseInt(customSeconds || '0') <= 0)}
                            className="w-full py-3 sm:py-3.5 bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xl shadow-sky-500/10 hover:bg-slate-800 dark:hover:bg-stone-200 transition-all font-black flex items-center justify-center gap-2 rounded-xl active:scale-95 disabled:opacity-30 disabled:grayscale"
                          >
                            <Bell className="h-4.5 w-4.5" /> {editingSlotId ? "알림 수정 완료" : "시작하기"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Change Time Modal */}
      <AnimatePresence>
        {timeAdjustSlotId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTimeAdjustSlotId(null)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-neutral-100 dark:border-stone-800 animate-zoomIn"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100 rounded-lg">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-neutral-900 dark:text-stone-100">
                    ⏱️ 성장 시간 직접 변경
                  </h3>
                </div>
                <button 
                  onClick={() => setTimeAdjustSlotId(null)}
                  className="p-1 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-full text-neutral-500 dark:text-stone-400 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 rotate-45" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-[11px] text-neutral-600 dark:text-stone-400 leading-relaxed font-bold">
                  등록한 항목의 남은 시간을 직접 입력해 주세요. 입력하신 시간으로 타이머가 재설정됩니다.
                </p>

                <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-stone-850 p-3.5 rounded-2xl border border-neutral-200 dark:border-stone-800 font-sans">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 dark:text-stone-500 block">시간 (Hours)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={adjustHours}
                      onChange={(e) => setAdjustHours(e.target.value)}
                      className="w-full text-xs font-mono font-bold rounded-xl border border-neutral-200 dark:border-stone-700 bg-white dark:bg-stone-950 p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-stone-100 text-neutral-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 dark:text-stone-500 block">분 (Minutes)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={adjustMinutes}
                      onChange={(e) => setAdjustMinutes(e.target.value)}
                      className="w-full text-xs font-mono font-bold rounded-xl border border-neutral-200 dark:border-stone-700 bg-white dark:bg-stone-950 p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-stone-100 text-neutral-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 dark:text-stone-500 block">초 (Seconds)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={adjustSeconds}
                      onChange={(e) => setAdjustSeconds(e.target.value)}
                      className="w-full text-xs font-mono font-bold rounded-xl border border-neutral-200 dark:border-stone-700 bg-white dark:bg-stone-950 p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-stone-100 text-neutral-900 dark:text-stone-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 dark:border-stone-800">
                <button
                  onClick={() => setTimeAdjustSlotId(null)}
                  className="py-2 text-center text-xs font-bold text-neutral-600 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-xl transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  onClick={handleModifyTime}
                  disabled={parseInt(adjustHours || '0') <= 0 && parseInt(adjustMinutes || '0') <= 0 && parseInt(adjustSeconds || '0') <= 0}
                  className="py-2.5 text-center text-xs font-black text-white bg-slate-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-slate-800 dark:hover:bg-stone-200 disabled:opacity-50 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  시간 변경 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Login Webview/IFrame Warning Modal */}
      <AnimatePresence>
        {loginWarningType && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setLoginWarningType(null);
                setIsCopied(false);
              }}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoomIn border border-neutral-100 dark:border-stone-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-neutral-950 dark:text-stone-100">
                    {loginWarningType === 'webview' ? '구글 로그인 오류 방지 안내' : '구글 로그인 미리보기 제한 안내'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setLoginWarningType(null);
                    setIsCopied(false);
                  }}
                  className="p-1 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-full text-neutral-500 dark:text-stone-400 transition-colors shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3.5 space-y-4 text-xs text-neutral-700 dark:text-stone-400 leading-relaxed">
                {loginWarningType === 'webview' ? (
                  <>
                    <div className="bg-rose-50/50 dark:bg-rose-500/10 rounded-xl p-3 border border-rose-100 dark:border-rose-500/20 text-rose-950 dark:text-rose-300 font-medium font-sans">
                      현재 <strong>카카오톡, 텔레그램 등의 인앱 브라우저(WebView)</strong>에서 접속 중인 것으로 판단됩니다.
                    </div>
                    
                    <p>
                      구글은 사용자 정보 도용 방지 정책(disallowed_useragent)에 의거하여 <strong>인앱 브라우저 내부에서의 구글 OAuth 로그인을 원천 차단</strong>하고 있습니다.
                    </p>

                    <div className="space-y-2 bg-neutral-50 dark:bg-stone-850 p-3.5 rounded-xl border border-neutral-100 dark:border-stone-800">
                      <h4 className="font-extrabold text-neutral-900 dark:text-stone-100 text-[11px] uppercase tracking-wider">🛠️ 해결 방법</h4>
                      <ol className="list-decimal pl-4 space-y-1.5 text-neutral-600 dark:text-stone-400 font-medium">
                        <li>화면 우측/좌측 상단 또는 하단 메뉴 버튼(<span className="font-extrabold">`⋮`</span> 혹은 공유 버튼 <span className="font-extrabold">`⎋`</span>)을 누릅니다.</li>
                        <li><strong className="text-neutral-950 dark:text-stone-100">'다른 브라우저로 열기'</strong> 또는 <strong className="text-neutral-950 dark:text-stone-100">'Safari로 열기 / Chrome으로 열기'</strong>를 선택해 주세요!</li>
                        <li> 그 외의 경우, 아래 버튼을 눌러 인터넷 주소를 복사하신 후 스마트폰의 <strong>기본 브라우저(Safari, Chrome, 삼성 인터넷 등)</strong> 주소창에 직접 붙여넣어 접속해 보세요!</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-100 dark:border-amber-500/20 text-amber-950 dark:text-amber-300 font-medium font-sans">
                      현재 화면은 <strong>'미리보기(iFrame) 프레임'</strong> 상태입니다.
                    </div>
                    
                    <p>
                      구글 보안 로그인은 외부 도메인의 iFrame에서 실행되는 팝업 인증을 허용하지 않거나, 쿠키 차단으로 인해 <strong>지속적으로 오류가 발생할 수 있습니다</strong>.
                    </p>

                    <div className="space-y-2 bg-neutral-50 dark:bg-stone-850 p-3.5 rounded-xl border border-neutral-100 dark:border-stone-800">
                      <h4 className="font-extrabold text-neutral-900 dark:text-stone-100 text-[11px] uppercase tracking-wider">🛠️ 해결 방법</h4>
                      <ol className="list-decimal pl-4 space-y-1.5 text-neutral-600 dark:text-stone-400 font-medium">
                        <li>화면 우측 상단에 있는 <strong className="text-neutral-950 dark:text-stone-100">'새 창에서 열기'</strong> 버튼을 클릭하여 완전한 창에서 테스트해 보세요.</li>
                        <li>아래 버튼을 눌러 주소를 복사한 후 일반 크롬 브라우저 창에서 독립적으로 접속하셔도 정상 로그인 가능합니다.</li>
                      </ol>
                    </div>
                  </>
                )}

                {/* Copy URL Section */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-stone-500 block uppercase tracking-wider">접속 중인 주소</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={window.location.href}
                      className="flex-1 bg-neutral-50 dark:bg-stone-950 rounded-lg border border-neutral-200 dark:border-stone-800 p-2 text-[10px] font-mono select-all text-neutral-600 dark:text-stone-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(window.location.href);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        } catch (e) {
                          alert(`주소 복사에 실패했습니다. 아래 주소를 직접 전체 복사해 주세요:\n${window.location.href}`);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                        isCopied ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'bg-neutral-900 dark:bg-stone-800 text-white dark:text-stone-200 hover:bg-neutral-800 dark:hover:bg-stone-700'
                      }`}
                    >
                      {isCopied ? '복사 완료! 📋' : '주소 복사 🔗'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 dark:border-stone-800">
                  <button
                    onClick={() => {
                      setLoginWarningType(null);
                      setIsCopied(false);
                    }}
                    className="py-1.5 text-center font-bold text-neutral-600 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      setLoginWarningType(null);
                      setIsCopied(false);
                      handleGoogleLogin(true); // Bypass validation check and try anyways
                    }}
                    className="py-1.5 text-center font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg border border-rose-100 dark:border-rose-500/30 transition-colors cursor-pointer"
                  >
                    무시하고 계속 진행
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Browser Notification Warning Modal */}
      <AnimatePresence>
        {showNotifWarningModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifWarningModal(false)}
              className="fixed inset-0 bg-neutral-900/45 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-[24px] bg-white dark:bg-stone-900 p-6 shadow-2xl flex flex-col border border-neutral-100/80 dark:border-stone-800 animate-zoomIn z-[510]"
            >
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-[15px] text-neutral-950 dark:text-stone-100 font-sans tracking-tight">
                  작물 성장 시 알려드릴까요?
                </h3>
              </div>

              <div className="py-4 text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold text-left space-y-3">
                <p className="text-neutral-800 dark:text-stone-200 break-keep font-extrabold text-[13px]">
                  성장이 완료되면 알림을 보내드립니다.
                </p>
                
                <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200/50 dark:border-amber-500/20 space-y-2 font-sans font-medium text-[12px] text-amber-800 dark:text-amber-400 leading-normal break-keep">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      <strong>주의사항: </strong>
                      브라우저 알림은 이 창(탭)이 켜져있어야만 수신 가능합니다. 브라우저를 닫으면 알림을 받을 수 없습니다.
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-stone-850 p-3 rounded-xl border border-neutral-200/50 dark:border-stone-800 space-y-1.5 font-sans font-medium text-[11px] text-neutral-500 dark:text-stone-400 leading-normal break-keep">
                  <p>• 브라우저가 꺼지거나 다른 앱을 사용하는 도중에도 알림을 받고 싶으시다면, <strong>텔레그램 알림 설정</strong>을 해주세요.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3.5 border-t border-neutral-100 dark:border-stone-800">
                <button
                  onClick={async () => {
                    setShowNotifWarningModal(false);
                    await requestNotificationPermissionActual();
                  }}
                  className="py-3 w-full text-center text-[13px] font-black text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  브라우저 알림 켜기
                </button>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setShowNotifWarningModal(false)}
                    className="py-2.5 text-center text-xs font-bold text-neutral-600 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    설정 안함
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifWarningModal(false);
                      setIsTelegramOpen(true);
                    }}
                    className="py-2.5 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    텔레그램으로 설정
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl flex flex-col border border-neutral-100 dark:border-stone-800 z-[510]"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="p-1.5 bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-400 rounded-lg shrink-0">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-extrabold text-xs text-neutral-950 dark:text-stone-100">
                  로그아웃 확인
                </h3>
              </div>

              <div className="py-4 text-xs text-neutral-700 dark:text-stone-400 leading-relaxed">
                <p className="font-medium text-neutral-600 dark:text-stone-300">
                  정말 로그아웃 하시겠습니까?
                </p>
                <p className="mt-1 text-neutral-400 dark:text-stone-500 text-[11px]">
                  로그아웃 시 설정 정보 및 알림 상태 동기화가 해제되며, 기기에 저장되어 있던 로컬 정보로 전환됩니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 dark:border-stone-800">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-1.5 text-center font-bold text-neutral-600 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleLogout}
                  className="py-1.5 text-center font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg border border-rose-100 dark:border-rose-500/30 transition-colors cursor-pointer"
                >
                  로그아웃 하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5-Star Challenge Start Notice Modal */}
      <AnimatePresence>
        {fiveStarPendingData && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiveStarPendingData(null)}
              className="fixed inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-[24px] bg-white dark:bg-stone-900 p-6 shadow-2xl flex flex-col border border-neutral-100 dark:border-stone-800 animate-zoomIn z-[5001] text-left font-sans"
            >
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 animate-pulse">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-[13px] text-amber-950 dark:text-stone-100 font-sans tracking-tight">
                  ✨ 5성 도전 모드 시작!
                </h3>
              </div>

              <div className="py-4 text-xs text-neutral-600 dark:text-stone-400 leading-relaxed font-semibold space-y-2.5">
                <p className="text-neutral-800 dark:text-stone-200 font-extrabold text-[11px] bg-amber-500/[0.03] p-3 rounded-xl border border-amber-500/15">
                  5성 작물에 도전하기 전, 아래 팁을 확인해 보세요.
                </p>
                <div className="bg-neutral-50 dark:bg-stone-850 p-3.5 rounded-xl border border-neutral-200/50 dark:border-stone-800 space-y-1.5 font-sans font-medium text-[11px] text-neutral-500 dark:text-stone-400 leading-normal break-keep">
                  <p className="text-amber-600 dark:text-amber-400 font-bold">• 최상급 비료를 꼭 밭에 미리 뿌려주세요!</p>
                  <p>• 잡초가 자랄 시점에 알림이 전송됩니다.</p>
                  <p>• 알림이 울릴 때마다 최대한 빠르게 잡초 제거를 하시면 성공 확률이 높아집니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3.5 border-t border-neutral-100 dark:border-stone-800">
                <button
                  onClick={() => setFiveStarPendingData(null)}
                  className="py-2.5 text-center text-xs font-bold text-neutral-600 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (fiveStarPendingData.type === 'preset' && fiveStarPendingData.preset) {
                      executePlantPreset(fiveStarPendingData.slotId, fiveStarPendingData.preset);
                    } else if (fiveStarPendingData.type === 'custom') {
                      executePlantCustomNameAndTime(fiveStarPendingData.slotId);
                    }
                    setFiveStarPendingData(null);
                  }}
                  className="py-2.5 text-center text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 m-0"
                >
                  도전 시작하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Looping Alarm Stop Alert Banner */}
      <AnimatePresence>
        {isAlarmRinging && (
          <div className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 border border-neutral-200 dark:border-stone-700 shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center gap-4 max-w-xs w-full relative z-[5001]"
            >
              <div className="relative h-16 w-16 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-rose-400/30"
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <div className="relative z-10 h-16 w-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center text-3xl">
                  🚨
                </div>
              </div>
              <div className="font-sans space-y-1">
                <h4 className="text-lg font-black text-rose-900 dark:text-rose-100">
                  {ringingMessage || (ringingType === 'fivestar' ? '잡초를 뽑을 시간이에요!' : '작물이 모두 성장했어요!')}
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {(ringingType === "fivestar" ? fiveStarRepeat : generalRepeat) 
                    ? "확인 전까지 알림이 계속 울립니다." 
                    : "작물 상태를 확인해 주세요."}
                </p>
              </div>
              <button
                onClick={stopAlarm}
                className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                확인
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 알림 효과음 세부 설정 모달 */}
      <AnimatePresence>
        {isSoundSettingsOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSoundSettingsOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-[24px] bg-white dark:bg-stone-900 p-6 shadow-2xl flex flex-col border border-neutral-100 dark:border-stone-800 z-[5001] overflow-hidden font-sans max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[14px] text-neutral-950 dark:text-stone-100 tracking-tight">
                      알림 및 효과음 설정
                    </h3>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold mt-0.5">
                      사전 알림, 반복 재생 및 알림 테마를 맞춤형으로 설정합니다.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSoundSettingsOpen(false)}
                  className="p-1 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5 text-left scrollbar-thin">
                
                {/* 1. 5성 작물 사전 알림 설정 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-neutral-850 dark:text-stone-200">
                      ⭐ 5성 작물 사전 알림 설정
                    </span>
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded-sm">
                      추천
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-normal">
                    정시 대비 몇 분 전에 알려드릴까요? 미리 대기할 시간을 확보할 수 있습니다.
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[0, 1, 2, 3, 5].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleUpdateFiveStarPreMinutes(mins)}
                        className={cn(
                          "py-2 text-[11px] font-black rounded-lg border transition-all text-center cursor-pointer active:scale-95",
                          fiveStarPreMinutes === mins
                            ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 shadow-2xs"
                            : "border-neutral-150 dark:border-stone-800 bg-neutral-50 dark:bg-stone-850 hover:bg-neutral-100 dark:hover:bg-stone-800 text-neutral-600 dark:text-stone-400"
                        )}
                      >
                        {mins === 0 ? "정시" : `${mins}분 전`}
                      </button>
                    ))}
                  </div>
                </div>



                {/* 2. 알림 마스터 볼륨 설정 */}
                <div className="border-t border-neutral-100 dark:border-stone-800/60 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-850 dark:text-stone-200 flex items-center gap-1.5">
                      {alarmVolume === 0 ? (
                        <VolumeX className="h-4 w-4 text-stone-400" />
                      ) : alarmVolume < 50 ? (
                        <Volume className="h-4 w-4 text-amber-500" />
                      ) : alarmVolume < 130 ? (
                        <Volume1 className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-amber-500 animate-pulse" />
                      )}
                      🔊 마스터 볼륨 설정
                    </span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-md",
                      alarmVolume === 0 
                        ? "bg-neutral-100 dark:bg-stone-800 text-stone-500"
                        : alarmVolume > 120 
                          ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold animate-pulse"
                          : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    )}>
                      {alarmVolume === 0 ? "음소거" : alarmVolume === 100 ? "기본 (100%)" : `${alarmVolume}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-normal">
                    알림 소리의 크기를 직접 조절합니다. 소리가 너무 작다면 최대 200%까지 임의로 키울 수 있습니다.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-stone-400 font-bold shrink-0">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={alarmVolume}
                      onChange={(e) => handleUpdateAlarmVolume(parseInt(e.target.value, 10))}
                      onMouseUp={() => {
                        const soundType = soundSettingsTab === 'general' ? generalSoundType : fiveStarSoundType;
                        playCustomSound(soundType, alarmVolume);
                      }}
                      onTouchEnd={() => {
                        const soundType = soundSettingsTab === 'general' ? generalSoundType : fiveStarSoundType;
                        playCustomSound(soundType, alarmVolume);
                      }}
                      className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-stone-400 font-bold shrink-0">200%</span>
                  </div>
                </div>

                {/* 3. 알림 무한 반복 설정 */}
                <div className="border-t border-neutral-100 dark:border-stone-800/60 pt-4 space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-black text-neutral-850 dark:text-stone-200">
                      🔁 알림 무한 반복 재생
                    </span>
                  </div>
                  
                  {/* 일반 알림 반복 */}
                  <div className="flex items-center justify-between bg-neutral-50 dark:bg-stone-850/60 p-3 rounded-xl border border-neutral-100 dark:border-stone-800/60">
                    <div className="text-left">
                      <span className="text-xs font-black text-neutral-750 dark:text-stone-300 block">
                        🌱 일반 알림 무한 반복
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-normal block mt-0.5">
                        사용자가 직접 소리를 꺼야 재생이 중단됩니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateGeneralRepeat(!generalRepeat)}
                      className={cn(
                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0",
                        generalRepeat ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300",
                          generalRepeat ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* 5성 알림 반복 */}
                  <div className="flex items-center justify-between bg-neutral-50 dark:bg-stone-850/60 p-3 rounded-xl border border-neutral-100 dark:border-stone-800/60">
                    <div className="text-left">
                      <span className="text-xs font-black text-neutral-750 dark:text-stone-300 block">
                        ⭐ 5성 알림 무한 반복
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-normal block mt-0.5">
                        각 잡초 제거 단계에서 쉴틈없이 울립니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateFiveStarRepeat(!fiveStarRepeat)}
                      className={cn(
                        "w-11 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0",
                        fiveStarRepeat ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300",
                          fiveStarRepeat ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* 4. 알림 효과음 설정 */}
                <div className="border-t border-neutral-100 dark:border-stone-800/60 pt-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-neutral-850 dark:text-stone-200">
                      🎵 알림 소리 테마 설정
                    </span>
                    
                    {/* Sub segmented control */}
                    <div className="flex bg-neutral-100 dark:bg-stone-800 rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSoundSettingsTab('general')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer",
                          soundSettingsTab === 'general'
                            ? "bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-300 shadow-2xs"
                            : "text-stone-400 hover:text-stone-600 dark:text-stone-400"
                        )}
                      >
                        일반알림음
                      </button>
                      <button
                        type="button"
                        onClick={() => setSoundSettingsTab('fivestar')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer",
                          soundSettingsTab === 'fivestar'
                            ? "bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-300 shadow-2xs"
                            : "text-stone-400 hover:text-stone-600 dark:text-stone-400"
                        )}
                      >
                        5성알림음
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-normal">
                    {soundSettingsTab === 'general' ? '일반 알림 발생 시 재생할 효과음을 선택하세요.' : '5성 단계별 알림 발생 시 재생할 효과음을 선택하세요.'}
                  </p>

                  {/* Radio Items Grid/List */}
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto border border-neutral-100 dark:border-stone-800/60 rounded-xl p-2 bg-neutral-50/50 dark:bg-stone-850/20 scrollbar-thin">
                    {[
                      { id: 'chime', label: '풍성한 차임벨 🎵', desc: '여운이 길어진 윈드차임' },
                      { id: 'healing', label: '힐링 코드 🌿', desc: '마음이 편안해지는 따뜻한 화음 (추천)' },
                      { id: 'zen', label: '명상 종소리 🧘', desc: '깊은 울림과 긴 여운의 젠벨 (추천)' },
                      { id: 'bell', label: '프리미엄 벨 🔔', desc: '웅장하고 클래식한 종소리' },
                      { id: 'marimba', label: '실로폰 멜로디 🎼', desc: '부드러운 마린바 아르페지오' },
                      { id: 'cosmic', label: '신비로운 우주 🌌', desc: '공간감이 느껴지는 따뜻한 패드' },
                      { id: 'sparkle', label: '별가루 반짝임 ✨', desc: '영롱한 신디사이저 반짝임' },
                      { id: 'melody', label: '미니 화음 🎶', desc: '경쾌하고 귀여운 상승 멜로디' },
                      { id: 'pulse', label: '소프트 펄스 ⚡', desc: '부드럽게 통통 튀는 전자 펄스' },
                      { id: 'beep', label: '소프트 비프 🔔', desc: '선명하지만 자극적이지 않은 비프' },
                      { id: 'siren', label: '웨이브 사이렌 🚨', desc: '부드럽게 다듬은 주의 알림' },
                      { id: 'retro', label: '레트로 게임 👾', desc: '오락실 스타일 8비트 주파수' },
                    ].map((sound) => {
                      const isSelected = soundSettingsTab === 'general'
                        ? generalSoundType === sound.id
                        : fiveStarSoundType === sound.id;
                      
                      return (
                        <div
                          key={sound.id}
                          onClick={() => {
                            if (soundSettingsTab === 'general') {
                              handleUpdateGeneralSoundType(sound.id);
                            } else {
                              handleUpdateFiveStarSoundType(sound.id);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none text-left",
                            isSelected
                              ? "border-amber-400 bg-amber-500/5 dark:bg-amber-500/10 text-neutral-900 dark:text-stone-100"
                              : "border-transparent bg-transparent hover:bg-neutral-100/70 dark:hover:bg-stone-800/40 text-neutral-600 dark:text-stone-400"
                          )}
                        >
                          {/* Radio Button & Label */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                              isSelected ? "border-amber-500 text-amber-500" : "border-stone-300 dark:border-stone-600"
                            )}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11.5px] font-black block truncate leading-tight">
                                {sound.label}
                              </span>
                              <span className="text-[9.5px] text-stone-400 dark:text-stone-500 font-medium block truncate mt-0.5">
                                {sound.desc}
                              </span>
                            </div>
                          </div>

                          {/* Preview Speaker Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playCustomSound(sound.id);
                            }}
                            title="미리듣기"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-neutral-200/50 dark:border-stone-700/50 text-neutral-600 dark:text-stone-300 transition-all shrink-0 active:scale-90 cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Bottom Complete Button */}
              <div className="pt-4 border-t border-neutral-100 dark:border-stone-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSoundSettingsOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  설정 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Seconds formatter helper for UI: hh:mm:ss or mm:ss
function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return '수확 가능';
  if (seconds < 60) return `${Math.floor(seconds)}초`;
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) {
    return `${h}시간 ${m}분`;
  }
  return `${m}분`;
}

function formatCompletionTime(timestamp: number, showLabel: boolean, isCompleted: boolean): string {
  const target = new Date(timestamp);
  
  const m = target.getMonth() + 1;
  const d = target.getDate();
  const h = target.getHours();
  const min = target.getMinutes();
  const ampm = h >= 12 ? '오후' : '오전';
  const h12 = h % 12 || 12;
  const timeStr = `${ampm} ${h12}:${min < 10 ? '0' + min : min}`;

  if (isCompleted) {
    return `${m}/${d} ${timeStr} 완료됨`;
  }

  if (!showLabel) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  
  if (targetDateOnly.getTime() === today.getTime()) {
    return `${timeStr} 완료 예정`;
  } else if (targetDateOnly.getTime() === tomorrow.getTime()) {
    return `내일 ${timeStr} 완료 예정`;
  } else {
    return `${m}/${d} ${timeStr} 완료 예정`;
  }
}

function translateWeather(weather: string): string {
  if (weather === 'Clear') return '맑음';
  if (weather === 'RainSnow') return '비/눈';
  if (weather === 'Rainbow') return '무지개';
  if (weather === 'Meteor') return '유성우';
  if (weather === 'Heatwave') return '폭염';
  if (weather === 'Unknown') return '날씨정보 없음';
  return '날씨정보 없음';
}

function WeatherIcon({ weather, className }: { weather: string; className?: string }) {
  if (weather === 'Clear') return <Sun className={`${className} text-amber-500`} />;
  if (weather === 'RainSnow') return <CloudRain className={`${className} text-slate-400`} />;
  if (weather === 'Rainbow') return <span className={`${className} text-sm select-none`}>🌈</span>;
  if (weather === 'Meteor') return <span className={`${className} text-sm select-none`}>☄️</span>;
  if (weather === 'Heatwave') return <span className={`${className} text-sm select-none`}>🌡️</span>;
  if (weather === 'Unknown') return <Cloud className={`${className} text-neutral-300`} />;
  return <Cloud className={`${className} text-neutral-300`} />;
}
