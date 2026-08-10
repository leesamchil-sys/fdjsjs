import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, GitMerge, ChevronRight, Sparkles, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';
import { FLOWER_IMAGE_MAPPING } from '../data/gardening';
import { GardeningItem } from '../types';

interface CrossbreedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GardeningItem | null;
}

interface Formula {
  target: number | number[];
  parents: number[][];
  isRare?: boolean;
  tier: number;
  isGroupCombo?: boolean;
  isRepeat?: boolean;
}

// 상세 교배 데이터 정의 (이미지 기반)
const CROSSBREEDING_DATA: Record<string, Formula[]> = {
  '나팔꽃': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 8, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 9, parents: [[8, 8], [8, 6]], tier: 1 },
  ],
  '백합': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 8, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 9, parents: [[7, 7], [7, 5]], tier: 1 },
    { target: 10, parents: [[8, 9]], tier: 1 },
  ],
  '칼라': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 8, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 9, parents: [[8, 8], [8, 6]], tier: 1 },
  ],
  '팬지': [
    { target: 3, parents: [[1, 2]], tier: 1 },
    { target: 4, parents: [[3, 3], [3, 1]], tier: 1 },
    { target: 5, parents: [[4, 4], [4, 3]], tier: 1 },
    { target: 6, parents: [[5, 5], [5, 4]], tier: 1 },
  ],
  '장미': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 6, parents: [[4, 1], [4, 4]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 8, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 9, parents: [[7, 7], [7, 5]], tier: 1 },
    { target: [10, 11], parents: [[8, 8], [8, 9]], tier: 1 },
    { target: [10, 11], parents: [[9, 9], [9, 8]], tier: 1 },
  ],
  '히아신스': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[3, 1]], tier: 1 },
    { target: 6, parents: [[5, 4]], tier: 1 },
    { target: [8, 9], parents: [[6, 7]], isGroupCombo: true, tier: 1 },
    { target: 10, parents: [[8, 9]], isGroupCombo: true, tier: 1 },
  ],
  '튤립': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 8, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 9, parents: [[7, 7], [7, 5]], tier: 1 },
    { target: 10, parents: [[8, 9],[8, 8]], tier: 1 },
    { target: 10, parents: [[9, 8],[9, 9]], tier: 1 },
  ],
  '데이지': [
    { target: 3, parents: [[1, 2]], tier: 1 },
    { target: 4, parents: [[3, 3], [3, 1]], tier: 1 },
    { target: 5, parents: [[4, 4], [4, 3]], tier: 1 },
    { target: 6, parents: [[5, 5], [5, 4]], tier: 1 },
  ],
  '꽃양귀비': [
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 7, parents: [[6, 6], [6, 4]], tier: 1 },
    { target: 8, parents: [[7, 7], [7, 6]], tier: 1 },
  ],
  '안스리움': [
    { target: 4, parents: [[1, 2]], isGroupCombo: true, tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 6, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 7, parents: [[6, 6], [6, 5]], tier: 1 },
    { target: 8, parents: [[7, 7], [7, 6]], tier: 1 },
  ],
  '호접란': [
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: [6, 7], parents: [[5, 4]], tier: 1 },
    { target: [8, 9], parents: [[6, 7]], isGroupCombo: true, tier: 1 },
    { target: [10, 11], parents: [[8, 9]], isGroupCombo: true, tier: 1 },
  ],
  '카네이션': [
    { target: 5, parents: [[1, 3]], tier: 1 },
    { target: 4, parents: [[1, 2]], tier: 1 },
    { target: 6, parents: [[4, 4], [4, 1]], tier: 1 },
    { target: 7, parents: [[5, 5], [5, 1]], tier: 1 },
    { target: 8, parents: [[7, 7], [7, 5]], tier: 1 },
    { target: 9, parents: [[8, 8], [8, 7]], tier: 1 },
  ],
  '수선화': [
    { target: [4, 5], parents: [[1, 2, 3]], tier: 1 },
    { target: [6, 7], parents: [[4, 5]], isGroupCombo: true, tier: 1 },
    { target: [8, 9], parents: [[6, 7]], isGroupCombo: true, tier: 1 },
    { target: 10, parents: [[8, 9]], isGroupCombo: true, tier: 1 },
  ]
};

type ParentPattern = 
  | { type: 'single'; p1: number; p2: number }
  | { type: 'common_branch'; common: number; others: number[] }
  | { type: 'group_combo'; group: number[] }
  | { type: 'multi_pair'; pairs: [number, number][] };

function parseParentsPattern(
  parents: number[][],
  options?: { isGroupCombo?: boolean; isRepeat?: boolean }
): ParentPattern {
  if (!parents || parents.length === 0) {
    return { type: 'single', p1: 1, p2: 1 };
  }

  const isExplicitGroup = !!(options?.isGroupCombo || options?.isRepeat);

  // 1. Group combo: Explicitly set (isGroupCombo / isRepeat) OR single array with 3+ items
  if (parents.length === 1 && (isExplicitGroup || parents[0].length >= 3)) {
    return { type: 'group_combo', group: parents[0] };
  }

  // 2. Single pair: [[1, 2]]
  if (parents.length === 1 && parents[0].length === 2) {
    return { type: 'single', p1: parents[0][0], p2: parents[0][1] };
  }

  // 3. Common parent branch: e.g. [[1, 2], [1, 3]] where all pairs share a common element
  let commonValue: number | null = null;
  if (parents.length > 1 && parents.every(p => p.length === 2)) {
    for (const val of parents[0]) {
      if (parents.every(pair => pair.includes(val))) {
        commonValue = val;
        break;
      }
    }
  }

  if (commonValue !== null) {
    const others = parents.map(pair => {
      const idx = pair.indexOf(commonValue!);
      return pair[1 - idx];
    });
    return { type: 'common_branch', common: commonValue, others };
  }

  // 4. Multi-pair without common parent: e.g. [[1, 2], [3, 4]]
  const validPairs = parents.map(p => [p[0] || 1, p[1] || 1] as [number, number]);
  return { type: 'multi_pair', pairs: validPairs };
}

// 꽃 색상에 최적화된 고품격 테마 정의 (다크모드 앰비언트 글로우 및 라이트모드 틴트)
interface ThemeConfig {
  primary: string;
  primaryBg: string;
  primaryBgDark: string;
  primaryBorder: string;
  accentText: string;
  cardBg: string;
  cardBgDark: string;
  accentGlow: string;
}

const FLOWER_THEME: Record<string, ThemeConfig> = {
  '데이지': {
    primary: 'text-stone-500 dark:text-amber-500',
    primaryBg: 'bg-stone-100/70 dark:bg-amber-500/10',
    primaryBgDark: 'dark:bg-amber-500/10',
    primaryBorder: 'border-stone-200/60 dark:border-amber-500/30',
    accentText: 'text-stone-600 dark:text-amber-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#1f1d19] dark:border-amber-500/20 dark:hover:bg-[#25221d]',
    accentGlow: 'rgba(245, 158, 11, 0.08)',
  },
  '팬지': {
    primary: 'text-violet-500',
    primaryBg: 'bg-violet-50/70 dark:bg-violet-500/10',
    primaryBgDark: 'dark:bg-violet-500/10',
    primaryBorder: 'border-violet-200 dark:border-violet-500/30',
    accentText: 'text-violet-600 dark:text-violet-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#1c1a22] dark:border-violet-500/20 dark:hover:bg-[#221f2b]',
    accentGlow: 'rgba(139, 92, 246, 0.08)',
  },
  '꽃양귀비': {
    primary: 'text-red-500',
    primaryBg: 'bg-red-50/70 dark:bg-red-500/10',
    primaryBgDark: 'dark:bg-red-500/10',
    primaryBorder: 'border-red-200 dark:border-red-500/30',
    accentText: 'text-red-600 dark:text-red-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#221a1a] dark:border-red-500/20 dark:hover:bg-[#2a1d1d]',
    accentGlow: 'rgba(239, 68, 68, 0.08)',
  },
  '안스리움': {
    primary: 'text-rose-500',
    primaryBg: 'bg-rose-50/70 dark:bg-rose-500/10',
    primaryBgDark: 'dark:bg-rose-500/10',
    primaryBorder: 'border-rose-200 dark:border-rose-500/30',
    accentText: 'text-rose-600 dark:text-rose-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#231a1c] dark:border-rose-500/20 dark:hover:bg-[#2b1d20]',
    accentGlow: 'rgba(244, 63, 94, 0.08)',
  },
  '나팔꽃': {
    primary: 'text-indigo-500',
    primaryBg: 'bg-indigo-50/70 dark:bg-indigo-500/10',
    primaryBgDark: 'dark:bg-indigo-500/10',
    primaryBorder: 'border-indigo-200 dark:border-indigo-500/30',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#1a1b22] dark:border-indigo-500/20 dark:hover:bg-[#20212b]',
    accentGlow: 'rgba(99, 102, 241, 0.08)',
  },
  '칼라': {
    primary: 'text-purple-500',
    primaryBg: 'bg-purple-50/70 dark:bg-purple-500/10',
    primaryBgDark: 'dark:bg-purple-500/10',
    primaryBorder: 'border-purple-200 dark:border-purple-500/30',
    accentText: 'text-purple-600 dark:text-purple-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#201a22] dark:border-purple-500/20 dark:hover:bg-[#271d2b]',
    accentGlow: 'rgba(168, 85, 247, 0.08)',
  },
  '카네이션': {
    primary: 'text-pink-500',
    primaryBg: 'bg-pink-50/70 dark:bg-pink-500/10',
    primaryBgDark: 'dark:bg-pink-500/10',
    primaryBorder: 'border-pink-200 dark:border-pink-500/30',
    accentText: 'text-pink-600 dark:text-pink-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#231a1f] dark:border-pink-500/20 dark:hover:bg-[#2b1d25]',
    accentGlow: 'rgba(236, 72, 153, 0.08)',
  },
  '튤립': {
    primary: 'text-orange-500',
    primaryBg: 'bg-orange-50/70 dark:bg-orange-500/10',
    primaryBgDark: 'dark:bg-orange-500/10',
    primaryBorder: 'border-orange-200 dark:border-orange-500/30',
    accentText: 'text-orange-600 dark:text-orange-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#221c19] dark:border-orange-500/20 dark:hover:bg-[#2a211c]',
    accentGlow: 'rgba(249, 115, 22, 0.08)',
  },
  '백합': {
    primary: 'text-amber-500',
    primaryBg: 'bg-amber-50/70 dark:bg-yellow-500/10',
    primaryBgDark: 'dark:bg-yellow-500/10',
    primaryBorder: 'border-amber-200 dark:border-yellow-500/30',
    accentText: 'text-amber-700 dark:text-yellow-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#212019] dark:border-yellow-500/20 dark:hover:bg-[#29271c]',
    accentGlow: 'rgba(234, 179, 8, 0.08)',
  },
  '장미': {
    primary: 'text-rose-500',
    primaryBg: 'bg-rose-50/70 dark:bg-rose-500/10',
    primaryBgDark: 'dark:bg-rose-500/10',
    primaryBorder: 'border-rose-200 dark:border-rose-500/30',
    accentText: 'text-rose-600 dark:text-rose-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#231a1c] dark:border-rose-500/20 dark:hover:bg-[#2b1d20]',
    accentGlow: 'rgba(244, 63, 94, 0.12)',
  },
  '히아신스': {
    primary: 'text-blue-500',
    primaryBg: 'bg-blue-50/70 dark:bg-blue-500/10',
    primaryBgDark: 'dark:bg-blue-500/10',
    primaryBorder: 'border-blue-200 dark:border-blue-500/30',
    accentText: 'text-blue-600 dark:text-blue-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#1a1d22] dark:border-blue-500/20 dark:hover:bg-[#1f242b]',
    accentGlow: 'rgba(59, 130, 246, 0.08)',
  },
  '호접란': {
    primary: 'text-fuchsia-500',
    primaryBg: 'bg-fuchsia-50/70 dark:bg-fuchsia-500/10',
    primaryBgDark: 'dark:bg-fuchsia-500/10',
    primaryBorder: 'border-fuchsia-200 dark:border-fuchsia-500/30',
    accentText: 'text-fuchsia-600 dark:text-fuchsia-400',
    cardBg: 'bg-stone-50/60 hover:bg-stone-100/80',
    cardBgDark: 'dark:bg-[#211a22] dark:border-fuchsia-500/20 dark:hover:bg-[#291d2c]',
    accentGlow: 'rgba(217, 70, 239, 0.08)',
  }
};

const DEFAULT_THEME: ThemeConfig = {
  primary: 'text-stone-500',
  primaryBg: 'bg-stone-500/10',
  primaryBgDark: 'dark:bg-stone-500/10',
  primaryBorder: 'border-stone-500/20 dark:border-stone-550/30',
  accentText: 'text-stone-600 dark:text-stone-400',
  cardBg: 'bg-stone-50/40 hover:bg-white',
  cardBgDark: 'dark:bg-[#1e1d1c] dark:border-stone-850 dark:hover:bg-[#242322]',
  accentGlow: 'rgba(120, 113, 108, 0.03)',
};

export default function CrossbreedingModal({
  isOpen,
  onClose,
  item
}: CrossbreedingModalProps) {
  const [thuImageFailed, setThuImageFailed] = React.useState(false);

  useEffect(() => {
    setThuImageFailed(false);
  }, [item]);
  const formulas = useMemo(() => {
    if (!item) return [];
    return CROSSBREEDING_DATA[item.name] || [];
  }, [item]);

  // 해당 꽃의 영어 prefix 가져오기
  const prefix = useMemo(() => {
    if (!item) return '';
    return FLOWER_IMAGE_MAPPING[item.name] || '';
  }, [item]);

  // 꽃 색상에 어울리는 최적의 테마 객체 가져오기 (데이지 테마 일괄 적용)
  const theme = useMemo(() => {
    return FLOWER_THEME['데이지'];
  }, []);

  // 티어별로 그룹화
  const tieredFormulas = useMemo(() => {
    const groups: Record<number, Formula[]> = {};
    formulas.forEach(f => {
      if (!groups[f.tier]) groups[f.tier] = [];
      groups[f.tier].push(f);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [formulas]);

  const [isCapturing, setIsCapturing] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll leaking and reset download state when closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsCapturing(false);
    }
    return () => {
      document.body.style.overflow = '';
      setIsCapturing(false);
    };
  }, [isOpen]);

  const convertImagesToBase64 = async (element: HTMLElement) => {
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(async (img) => {
        if (!img.src || img.src.startsWith('data:')) return;
        try {
          if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              img.src = canvas.toDataURL('image/png');
              return;
            }
          }
          const res = await fetch(img.src);
          const blob = await res.blob();
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                img.src = reader.result;
              }
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Image base64 conversion warning:', e);
        }
      })
    );
  };

  const handleDownloadImage = async () => {
    if (!modalContentRef.current || isCapturing) return;
    setIsCapturing(true);

    let cloneContainer: HTMLDivElement | null = null;
    try {
      const originalNode = modalContentRef.current;
      // Force fixed PC desktop standard width (520px) regardless of user device (mobile/PC)
      const captureWidth = 520;

      // Create a wrapper container offscreen so screen layout never shifts or expands
      cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '0';
      cloneContainer.style.width = `${captureWidth}px`;
      cloneContainer.style.zIndex = '-9999';
      cloneContainer.style.pointerEvents = 'none';

      // Yield to main thread before cloning
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Deep clone the modal content (includes header and body)
      const cloneNode = originalNode.cloneNode(true) as HTMLDivElement;

      // Remove capture-ignored elements (download/close buttons, bottom footer, watermark)
      const ignoreElems = cloneNode.querySelectorAll('[data-capture-ignore="true"]');
      ignoreElems.forEach((el) => el.remove());

      // Show capture-only elements (site info)
      const captureOnlyElems = cloneNode.querySelectorAll('[data-capture-only="true"]');
      captureOnlyElems.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.classList.remove('hidden');
          el.style.display = 'block';
        }
      });

      // Expand all scrollable containers in the clone so full height is rendered in full
      cloneNode.style.width = `${captureWidth}px`;
      cloneNode.style.maxHeight = 'none';
      cloneNode.style.height = 'auto';
      cloneNode.style.borderRadius = '24px';
      cloneNode.style.overflow = 'hidden';
      cloneNode.style.position = 'relative';

      const scrollables = cloneNode.querySelectorAll('.overflow-y-auto, .overflow-x-auto, [class*="overflow"]');
      scrollables.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.overflow = 'visible';
          el.style.maxHeight = 'none';
          el.style.height = 'auto';
        }
      });

      cloneContainer.appendChild(cloneNode);
      document.body.appendChild(cloneContainer);

      // Pre-convert images inside clone to base64 data URLs to prevent Netlify/CORS/isTrusted fetch errors
      await convertImagesToBase64(cloneNode);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const isDark = document.documentElement.classList.contains('dark');
      const nodeHeight = cloneNode.offsetHeight || 1000;
      // Calculate row count with generous vertical spacing (~120px) so watermarks are clean and not cluttered
      const rowCount = Math.max(Math.ceil(nodeHeight / 120) + 2, 6);

      // Add clean repeating diagonal zigzag watermark overlay with high z-index over thumbnails
      const watermarkContainer = document.createElement('div');
      watermarkContainer.style.position = 'absolute';
      watermarkContainer.style.top = '-10%';
      watermarkContainer.style.bottom = '-10%';
      watermarkContainer.style.left = '-20%';
      watermarkContainer.style.right = '-20%';
      watermarkContainer.style.pointerEvents = 'none';
      watermarkContainer.style.zIndex = '9999';
      watermarkContainer.style.overflow = 'hidden';
      watermarkContainer.style.display = 'flex';
      watermarkContainer.style.flexDirection = 'column';
      watermarkContainer.style.justifyContent = 'space-around';
      watermarkContainer.style.gap = '80px';
      watermarkContainer.style.transform = 'rotate(-15deg)';
      watermarkContainer.style.opacity = isDark ? '0.06' : '0.045';

      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-around';
        row.style.alignItems = 'center';
        row.style.gap = '80px';
        row.style.whiteSpace = 'nowrap';
        // Stagger/zigzag offset for odd rows to create an asymmetrical modern mesh
        if (rowIdx % 2 !== 0) {
          row.style.transform = 'translateX(90px)';
        }

        for (let colIdx = 0; colIdx < 3; colIdx++) {
          // Show site address pigtown.netlify.app occasionally (1 in 4 slots), mostly show '피그타운'
          const isUrl = (rowIdx * 3 + colIdx) % 4 === 1;
          const text = isUrl ? 'https://pigtown.netlify.app' : '피그타운';
          const mark = document.createElement('span');
          mark.textContent = text;
          mark.style.fontSize = isUrl ? '11px' : '13px';
          mark.style.fontWeight = '800';
          mark.style.color = isDark ? '#ffffff' : '#000000';
          mark.style.letterSpacing = '1.2px';
          mark.style.fontFamily = 'sans-serif';
          row.appendChild(mark);
        }

        watermarkContainer.appendChild(row);
      }

      cloneNode.appendChild(watermarkContainer);

      // Yield to main thread before heavy html2canvas capture
      await new Promise((resolve) => setTimeout(resolve, 0));
      const bgColor = isDark ? '#1e1c1a' : '#ffffff';

      let dataUrl = '';

      try {
        const canvas = await html2canvas(cloneNode, {
          scale: 1.5,
          backgroundColor: bgColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        dataUrl = canvas.toDataURL('image/png');
      } catch (h2cErr) {
        console.warn('html2canvas failed, trying html-to-image fallback:', h2cErr);
        dataUrl = await toPng(cloneNode, {
          quality: 0.9,
          pixelRatio: 1.5,
          backgroundColor: bgColor,
          skipFonts: true,
          cacheBust: false,
        });
      }

      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `[피그타운]${item?.name || '꽃'} 교배 가이드.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to capture guide image:', err);
    } finally {
      if (cloneContainer && document.body.contains(cloneContainer)) {
        document.body.removeChild(cloneContainer);
      }
      setIsCapturing(false);
    }
  };

  // Support for browser back button navigation to close the modal
  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modalId: 'crossbreeding' }, '');

    const handlePopState = (event: PopStateEvent) => {
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalId === 'crossbreeding') {
        window.history.back();
      }
    };
  }, [isOpen]);

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm"
          />

          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[395px] sm:max-w-[460px] max-h-[70vh] bg-white dark:bg-[#1e1c1a] rounded-[30px] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] border border-neutral-200/50 dark:border-stone-800/90 flex flex-col select-none"
            style={{
              boxShadow: `0 32px 80px -16px rgba(0, 0, 0, 0.8), 0 0 40px 0 ${theme.accentGlow}`
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]" data-capture-ignore="true">
              <div className="font-black text-4xl text-stone-300/10 dark:text-stone-700/15 select-none">
                피그타운
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/60 dark:border-stone-800 bg-stone-50/60 dark:bg-[#242220] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-stone-900 rounded-2xl shadow-xs border border-stone-200 dark:border-stone-800 shrink-0 overflow-hidden">
                  {!thuImageFailed ? (
                    <img
                       src={`/images/gardening/${item.name}/${prefix}_Thu.webp`}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1 block dark:opacity-95"
                      onError={() => setThuImageFailed(true)}
                    />
                  ) : (
                    <span className="text-xl drop-shadow-sm select-none">{item.emoji}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 tracking-tight whitespace-nowrap">
                    {item.name} 교배 가이드
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div data-capture-only="true" className="hidden text-right leading-tight select-none">
                  <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 tracking-wider block">
                    피그타운
                  </span>
                  <span className="text-[9px] font-medium text-stone-400 dark:text-stone-500 block">
                    https://pigtown.netlify.app
                  </span>
                </div>
                <div className="flex items-center gap-1.5" data-capture-ignore="true">
                  <button
                    onClick={handleDownloadImage}
                    disabled={isCapturing}
                    title="가이드 이미지로 저장"
                    className="p-2 rounded-full bg-stone-100/80 dark:bg-stone-900/60 text-stone-600 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-all active:scale-90 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Download className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-stone-100/80 dark:bg-stone-900/60 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-250 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-all active:scale-90 cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar-hide sm:custom-scrollbar hover:custom-scrollbar bg-neutral-50/20 dark:bg-[#141312]">
              <div className="p-4 sm:p-5 space-y-4">
                
                {/* Report correction notice banner */}
                <div
                  data-capture-ignore="true"
                  className={cn(
                    "p-3 rounded-2xl border text-left flex gap-2.5 items-start",
                    theme.primaryBg,
                    theme.primaryBgDark,
                    theme.primaryBorder
                  )}
                >
                  <Info className={cn("h-4 w-4 shrink-0 mt-0.5", theme.primary)} />
                  <p className="text-[10px] sm:text-xs font-semibold text-stone-600 dark:text-stone-400 leading-normal whitespace-nowrap">
                    교배 정보가 잘못된경우 <strong className={cn("font-black", theme.accentText)}>제보하기</strong>를 통해 알려주세요!
                  </p>
                </div>

                {/* Visual Image if exist */}
                <div className="relative rounded-2xl overflow-hidden border border-stone-200/60 dark:border-stone-800/80 bg-white/50 dark:bg-stone-900/10 shadow-xs">
                   <img 
                    src={`/images/crossbreeding/${item.name}.webp`}
                    alt={`${item.name} 교배표`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain block mx-auto dark:opacity-90 dark:brightness-95 contrast-95"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {!formulas.length && (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                       <GitMerge className="h-10 w-10 text-stone-300 dark:text-stone-800" />
                       <div className="space-y-1">
                         <p className="text-xs font-black text-stone-400 dark:text-stone-600 uppercase">준비중입니다.</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Tiered Formula List */}
                <div className="space-y-5 pb-1">
                  {tieredFormulas.map(([tier, tierFormulas]) => (
                    <div key={tier} className="relative space-y-2.5">
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
                          theme.primaryBg,
                          theme.primaryBgDark,
                          theme.primaryBorder
                        )}>
                          <span className="text-xs leading-none drop-shadow-xs">{'⭐'.repeat(Number(tier))}</span>
                          <span className={cn("text-[9px] font-black uppercase tracking-wider whitespace-nowrap", theme.accentText)}>
                            {tier === '1' ? '기본 교배' : `${tier}단계 교배`}
                          </span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent dark:from-stone-800/30" />
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {tierFormulas.map((formula, idx) => {
                          const pattern = parseParentsPattern(formula.parents, formula);
                          const isMultiTarget = Array.isArray(formula.target);
                          const isTaller = pattern.type !== 'single' || isMultiTarget;

                          return (
                            <div 
                              key={idx}
                              className={cn(
                                "relative flex items-center justify-between rounded-2xl border transition-all shadow-3xs w-full px-2.5 sm:px-4.5 gap-1.5 sm:gap-2",
                                isTaller ? "py-3.5 sm:py-4.5" : "py-2.5 sm:py-3.5",
                                formula.isRare 
                                  ? "bg-rose-500/5 dark:bg-[#281c1e] border-rose-200 dark:border-rose-500/30 ring-1 ring-rose-500/10" 
                                  : cn(theme.cardBg, theme.cardBgDark, "border-stone-200/50")
                              )}
                            >
                              {/* Left Parent(s) Container */}
                              <div className="flex-1 flex items-center justify-center shrink-0 min-w-0">
                                {pattern.type === 'single' && (
                                  <div className="flex items-center gap-2 sm:gap-3.5 select-none justify-center">
                                    {/* Parent 1 */}
                                    <div className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0">
                                      <img 
                                        src={`/images/gardening/${item.name}/${prefix}_${pattern.p1}.webp`} 
                                        referrerPolicy="no-referrer"
                                        className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                        alt="parent 1"
                                      />
                                    </div>
                                    
                                    {/* Connector × */}
                                    <div className="w-8 sm:w-12 shrink-0 flex items-center justify-center">
                                      <span className="text-xl sm:text-3xl font-black text-stone-400 dark:text-stone-500 select-none">×</span>
                                    </div>

                                    {/* Parent 2 */}
                                    <div className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0">
                                      <img 
                                        src={`/images/gardening/${item.name}/${prefix}_${pattern.p2}.webp`} 
                                        referrerPolicy="no-referrer"
                                        className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                        alt="parent 2"
                                      />
                                    </div>
                                  </div>
                                )}

                                {pattern.type === 'common_branch' && (
                                  <div className="flex items-center gap-1 sm:gap-2.5 select-none justify-center py-0.5">
                                    {/* Common Parent */}
                                    <div className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0">
                                      <img 
                                        src={`/images/gardening/${item.name}/${prefix}_${pattern.common}.webp`} 
                                        referrerPolicy="no-referrer"
                                        className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                        alt="parent common"
                                      />
                                    </div>
                                    
                                    {/* Visual Branch Line SVG */}
                                    <div className="relative w-10 sm:w-16 h-[118px] sm:h-[136px] shrink-0 flex items-center justify-center">
                                      <svg className="absolute inset-0 w-full h-full stroke-stone-300 dark:stroke-stone-600/90 fill-none text-stone-300 dark:text-stone-600">
                                        <line x1="0%" y1="50%" x2="40%" y2="50%" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="40%" y1="20%" x2="40%" y2="80%" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="40%" y1="20%" x2="100%" y2="20%" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="40%" y1="80%" x2="100%" y2="80%" strokeWidth="2" strokeLinecap="round" />
                                      </svg>
                                      
                                      <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1918] border border-stone-200 dark:border-stone-700/80 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-black text-stone-500 dark:text-stone-300 shadow-3xs whitespace-nowrap select-none z-10 flex items-center justify-center leading-none">
                                        교차 가능
                                      </div>
                                    </div>

                                    {/* Branched Others */}
                                    <div className="flex flex-col justify-center gap-1.5 sm:gap-2 h-[118px] sm:h-[136px] items-center">
                                      {pattern.others.map((other, oIdx) => (
                                        <div key={oIdx} className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0 hover:scale-105 transition-transform">
                                          <img 
                                            src={`/images/gardening/${item.name}/${prefix}_${other}.webp`} 
                                            referrerPolicy="no-referrer"
                                            className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs"
                                            alt="parent variant"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {pattern.type === 'group_combo' && (() => {
                                  const groupLen = pattern.group.length;
                                  const heightClass = groupLen <= 2 ? "h-[118px] sm:h-[136px]" : "h-[180px] sm:h-[204px]";
                                  const topFirstPct = `${((0 + 0.5) / groupLen) * 100}%`;
                                  const topLastPct = `${((groupLen - 1 + 0.5) / groupLen) * 100}%`;

                                  return (
                                    <div className="flex items-center gap-1 sm:gap-2.5 select-none justify-center py-0.5">
                                      {/* Left Group Column */}
                                      <div className={cn("flex flex-col justify-center gap-1.5 sm:gap-2 items-center", heightClass)}>
                                        {pattern.group.map((pNum, pIdx) => (
                                          <div key={pIdx} className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0 hover:scale-105 transition-transform">
                                            <img 
                                              src={`/images/gardening/${item.name}/${prefix}_${pNum}.webp`} 
                                              referrerPolicy="no-referrer"
                                              className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                              alt={`parent ${pNum}`}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* Visual Branch Line SVG for Group Combo */}
                                      <div className={cn("relative w-10 sm:w-16 shrink-0 flex items-center justify-center", heightClass)}>
                                        <svg className="absolute inset-0 w-full h-full stroke-stone-300 dark:stroke-stone-600/90 fill-none text-stone-300 dark:text-stone-600">
                                          {/* Left horizontal lines */}
                                          {pattern.group.map((_, pIdx) => {
                                            const yPct = `${((pIdx + 0.5) / groupLen) * 100}%`;
                                            return <line key={`l-h-${pIdx}`} x1="0%" y1={yPct} x2="30%" y2={yPct} strokeWidth="2" strokeLinecap="round" />;
                                          })}
                                          {/* Left vertical joining line */}
                                          <line x1="30%" y1={topFirstPct} x2="30%" y2={topLastPct} strokeWidth="2" strokeLinecap="round" />

                                          {/* Center horizontal line */}
                                          <line x1="30%" y1="50%" x2="70%" y2="50%" strokeWidth="2" strokeLinecap="round" />

                                          {/* Right vertical joining line */}
                                          <line x1="70%" y1={topFirstPct} x2="70%" y2={topLastPct} strokeWidth="2" strokeLinecap="round" />
                                          {/* Right horizontal lines */}
                                          {pattern.group.map((_, pIdx) => {
                                            const yPct = `${((pIdx + 0.5) / groupLen) * 100}%`;
                                            return <line key={`r-h-${pIdx}`} x1="70%" y1={yPct} x2="100%" y2={yPct} strokeWidth="2" strokeLinecap="round" />;
                                          })}
                                        </svg>

                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1918] border border-stone-200 dark:border-stone-700/80 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-black text-stone-500 dark:text-stone-300 shadow-3xs whitespace-nowrap select-none z-10 flex items-center justify-center leading-none">
                                          교차 가능
                                        </div>
                                      </div>

                                      {/* Right Group Column */}
                                      <div className={cn("flex flex-col justify-center gap-1.5 sm:gap-2 items-center", heightClass)}>
                                        {pattern.group.map((pNum, pIdx) => (
                                          <div key={pIdx} className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0 hover:scale-105 transition-transform">
                                            <img 
                                              src={`/images/gardening/${item.name}/${prefix}_${pNum}.webp`} 
                                              referrerPolicy="no-referrer"
                                              className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                              alt={`parent ${pNum}`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {pattern.type === 'multi_pair' && (
                                  <div className="flex items-center gap-1 sm:gap-2.5 select-none justify-center py-0.5">
                                    {/* Left Pair Column */}
                                    <div className="flex flex-col justify-center gap-1.5 sm:gap-2 h-[118px] sm:h-[136px] items-center">
                                      {pattern.pairs.map((pair, pIdx) => (
                                        <div key={pIdx} className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0 hover:scale-105 transition-transform">
                                          <img 
                                            src={`/images/gardening/${item.name}/${prefix}_${pair[0]}.webp`} 
                                            referrerPolicy="no-referrer"
                                            className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                            alt={`parent ${pair[0]}`}
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    {/* Visual Branch Line SVG for Multi Pair */}
                                    <div className="relative w-10 sm:w-16 h-[118px] sm:h-[136px] shrink-0 flex items-center justify-center">
                                      <svg className="absolute inset-0 w-full h-full stroke-stone-300 dark:stroke-stone-600/90 fill-none text-stone-300 dark:text-stone-600">
                                        <line x1="0%" y1="25%" x2="100%" y2="25%" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="0%" y1="75%" x2="100%" y2="75%" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="50%" y1="25%" x2="50%" y2="75%" strokeWidth="2" strokeLinecap="round" />
                                      </svg>

                                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a1918] border border-stone-200 dark:border-stone-700/80 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[11px] font-black text-stone-500 dark:text-stone-300 shadow-3xs whitespace-nowrap select-none z-10 flex items-center justify-center leading-none">
                                        교차 가능
                                      </div>
                                    </div>

                                    {/* Right Pair Column */}
                                    <div className="flex flex-col justify-center gap-1.5 sm:gap-2 h-[118px] sm:h-[136px] items-center">
                                      {pattern.pairs.map((pair, pIdx) => (
                                        <div key={pIdx} className="w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full bg-stone-50 dark:bg-[#1a1918]/95 border border-stone-200/40 dark:border-stone-800 flex items-center justify-center shadow-3xs shrink-0 hover:scale-105 transition-transform">
                                          <img 
                                            src={`/images/gardening/${item.name}/${prefix}_${pair[1]}.webp`} 
                                            referrerPolicy="no-referrer"
                                            className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs select-none"
                                            alt={`parent ${pair[1]}`}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Equals Connector */}
                              <div className="w-6 sm:w-10 flex items-center justify-center shrink-0">
                                <span className="text-xl sm:text-3xl font-black text-stone-400 dark:text-stone-500 select-none">=</span>
                              </div>

                              {/* Right Target Result Section */}
                              <div className="w-[56px] sm:w-16 flex items-center justify-center shrink-0">
                                {isMultiTarget ? (
                                  <div className="flex flex-col justify-center gap-1.5 sm:gap-2 items-center">
                                    {(formula.target as number[]).map((tgtNum, targetIdx) => (
                                      <div key={targetIdx} className="flex flex-col items-center justify-center">
                                        <div className={cn(
                                          "w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border relative select-none shadow-3xs bg-stone-50 dark:bg-[#1a1918]/95 hover:scale-105 transition-transform",
                                          formula.isRare ? "border-rose-300 dark:border-rose-500/30 font-bold" : "border-stone-200/40 dark:border-stone-800"
                                        )}>
                                          <img 
                                            src={`/images/gardening/${item.name}/${prefix}_${tgtNum}.webp`} 
                                            referrerPolicy="no-referrer"
                                            className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs z-10"
                                            alt={`target flower result ${tgtNum}`}
                                          />
                                          {formula.isRare && <Sparkles className="absolute top-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500 fill-rose-450 animate-pulse" />}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "w-[56px] h-[56px] sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border relative select-none shadow-3xs bg-stone-50 dark:bg-[#1a1918]/95 hover:scale-105 transition-transform",
                                    formula.isRare ? "border-rose-300 dark:border-rose-500/30 font-bold" : "border-stone-200/40 dark:border-stone-800"
                                  )}>
                                    <img 
                                      src={`/images/gardening/${item.name}/${prefix}_${formula.target}.webp`} 
                                      referrerPolicy="no-referrer"
                                      className="w-[44px] h-[44px] sm:w-13 sm:h-13 object-contain drop-shadow-xs z-10"
                                      alt="target flower result"
                                    />
                                    {formula.isRare && <Sparkles className="absolute top-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500 fill-rose-450 animate-pulse" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white dark:bg-[#1e1c1a] border-t border-neutral-100 dark:border-stone-800 shrink-0" data-capture-ignore="true">
               <button
                onClick={onClose}
                className={cn(
                  "w-full py-3.5 text-xs font-black rounded-2xl transition-all active:scale-95 cursor-pointer shadow-sm text-center",
                  "bg-slate-900 text-white hover:opacity-90 active:bg-slate-955",
                  "dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
                )}
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
