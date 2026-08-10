import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  RotateCcw, 
  Tag, 
  Shirt, 
  Grid,
  Sparkles,
  Layers,
  HelpCircle,
  Heart,
  Filter,
  Download,
  Loader2,
  X
} from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';

interface TrendItem {
  id: string;
  category: string;
  name: string;
  url: string;
}

export const TrendChecklist: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [captureScope, setCaptureScope] = useState<string>('all');
  const [isCapturing, setIsCapturing] = useState(false);
  const captureTargetRef = useRef<HTMLDivElement>(null);

  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('trend_checklist_checked_ids');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        let migrated = false;
        const newIds = parsed.map(id => {
          if (id === '긴 옷_1') {
            migrated = true;
            return '점프수트_1';
          }
          if (id === '긴 옷_2') {
            migrated = true;
            return '점프수트_2';
          }
          return id;
        });
        const uniqueIds = Array.from(new Set(newIds));
        if (migrated || uniqueIds.length !== parsed.length) {
          localStorage.setItem('trend_checklist_checked_ids', JSON.stringify(uniqueIds));
        }
        return uniqueIds;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Dynamically load images from /public/images/event1 folder using Vite import.meta.glob
  const trendItems = useMemo<TrendItem[]>(() => {
    try {
      const images = import.meta.glob([
        '/public/images/event1/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP}'
      ]);

      const parsedItems: TrendItem[] = Object.keys(images).map(path => {
        const filenameWithExt = path.split('/').pop() || '';
        const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
        
        let category = '기타';
        let name = filename;
        
        if (filename.includes('_')) {
          const parts = filename.split('_');
          category = parts[0].trim();
          name = parts.slice(1).join('_').trim();
        }
        
        // Convert public path to browser URL
        const url = `/images/event1/${filenameWithExt}`;
        
        return {
          id: filename,
          category,
          name,
          url
        };
      });

      // If no items are found in the directory, return empty list
      if (parsedItems.length === 0) {
        return [];
      }

      return parsedItems;
    } catch (e) {
      return [];
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('trend_checklist_checked_ids', JSON.stringify(checkedIds));
  }, [checkedIds]);

  // Sync state when backup is restored or updated externally
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('trend_checklist_checked_ids');
        if (saved) {
          setCheckedIds(JSON.parse(saved));
        } else {
          setCheckedIds([]);
        }
      } catch (e) {
        console.error("Failed to sync trend checklist from localStorage:", e);
      }
    };

    window.addEventListener('trend_checklist_changed', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('trend_checklist_changed', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Extract distinct categories sorted by specified priority and then added order
  const categories = useMemo(() => {
    // Collect distinct categories in the order they first appear in trendItems (added order)
    const orderInItems: string[] = [];
    trendItems.forEach(item => {
      if (!orderInItems.includes(item.category)) {
        orderInItems.push(item.category);
      }
    });

    const priorityOrder = ['상의', '하의', '점프수트', '모자', '신발', '액세서리', '가구', '펫 의류', '퍼즐'];

    return [...orderInItems].sort((a, b) => {
      const idxA = priorityOrder.indexOf(a);
      const idxB = priorityOrder.indexOf(b);

      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      if (idxA !== -1) {
        return -1;
      }
      if (idxB !== -1) {
        return 1;
      }

      // Both are outside priority list, sort by order of appearance in trendItems
      return orderInItems.indexOf(a) - orderInItems.indexOf(b);
    });
  }, [trendItems]);

  // Filter items based on checked/unchecked status
  const filteredItems = useMemo(() => {
    let items = trendItems;
    if (statusFilter === 'checked') {
      items = items.filter(item => checkedIds.includes(item.id));
    } else if (statusFilter === 'unchecked') {
      items = items.filter(item => !checkedIds.includes(item.id));
    }
    return items;
  }, [trendItems, statusFilter, checkedIds]);

  // Toggle checklist item
  const handleToggleItem = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Reset checked list
  const handleReset = () => {
    setShowResetModal(true);
  };

  // Items grouped by category for "전체" display
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: TrendItem[] } = {};
    
    // Initialize groups for all recognized categories
    categories.forEach(cat => {
      groups[cat] = [];
    });

    // Populate groups
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems, categories]);

  // Overall statistics
  const totalCount = trendItems.length;
  const checkedCount = trendItems.filter(item => checkedIds.includes(item.id)).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const convertImagesToBase64 = async (element: HTMLElement) => {
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(async (img) => {
        try {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:')) return;
          
          const response = await fetch(src);
          const blob = await response.blob();
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                img.src = reader.result as string;
              }
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          // Keep original src on error
        }
      })
    );
  };

  const handleDownloadImage = async (scope: string = 'all') => {
    if (isCapturing) return;
    setIsCapturing(true);

    setCaptureScope(scope);

    // Give React time to re-render captureTargetRef with the updated captureScope
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Yield to main thread
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (!captureTargetRef.current) {
      setIsCapturing(false);
      return;
    }

    let cloneContainer: HTMLDivElement | null = null;
    try {
      const originalNode = captureTargetRef.current;
      const captureWidth = 960;

      // Create a wrapper container offscreen
      cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '0';
      cloneContainer.style.width = `${captureWidth}px`;
      cloneContainer.style.zIndex = '-9999';
      cloneContainer.style.pointerEvents = 'none';

      // Yield to main thread before cloning
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Deep clone the capture target node
      const cloneNode = originalNode.cloneNode(true) as HTMLDivElement;

      // Remove any data-capture-ignore elements
      const ignoreElems = cloneNode.querySelectorAll('[data-capture-ignore="true"]');
      ignoreElems.forEach((el) => el.remove());

      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#1c1917' : '#ffffff';
      const textColor = isDark ? '#f5f5f4' : '#1c1917';

      // Explicitly set dark mode class and styles on clone root
      if (isDark) {
        cloneNode.classList.add('dark');
      } else {
        cloneNode.classList.remove('dark');
      }

      cloneNode.style.position = 'relative';
      cloneNode.style.left = '0';
      cloneNode.style.top = '0';
      cloneNode.style.width = `${captureWidth}px`;
      cloneNode.style.height = 'auto';
      cloneNode.style.borderRadius = '24px';
      cloneNode.style.backgroundColor = bgColor;
      cloneNode.style.color = textColor;
      cloneNode.style.overflow = 'hidden';
      cloneNode.style.pointerEvents = 'auto';
      cloneNode.style.zIndex = '1';

      cloneContainer.appendChild(cloneNode);
      document.body.appendChild(cloneContainer);

      // Pre-convert images inside clone to base64 data URLs
      await convertImagesToBase64(cloneNode);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const nodeHeight = Math.max(cloneNode.offsetHeight, cloneNode.scrollHeight, 600);
      const rowCount = Math.max(Math.ceil(nodeHeight / 120) + 2, 6);

      // Add clean repeating diagonal zigzag watermark overlay
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
      watermarkContainer.style.opacity = isDark ? '0.08' : '0.065';

      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-around';
        row.style.alignItems = 'center';
        row.style.gap = '80px';
        row.style.whiteSpace = 'nowrap';

        if (rowIdx % 2 !== 0) {
          row.style.transform = 'translateX(90px)';
        }

        for (let colIdx = 0; colIdx < 3; colIdx++) {
          const isUrl = (rowIdx * 3 + colIdx) % 2 === 1;
          const text = isUrl ? 'https://pigtown.netlify.app' : '피그타운';
          const mark = document.createElement('span');
          mark.textContent = text;
          mark.style.fontSize = isUrl ? '12px' : '14px';
          mark.style.fontWeight = '800';
          mark.style.color = isDark ? '#ffffff' : '#000000';
          mark.style.letterSpacing = '1.2px';
          mark.style.fontFamily = 'sans-serif';
          row.appendChild(mark);
        }

        watermarkContainer.appendChild(row);
      }

      cloneNode.appendChild(watermarkContainer);

      let dataUrl = '';
      try {
        const canvas = await html2canvas(cloneNode, {
          scale: 1.0, // Reduced for speed
          backgroundColor: bgColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: captureWidth,
          height: nodeHeight,
          windowWidth: captureWidth,
          windowHeight: nodeHeight,
        });
        dataUrl = canvas.toDataURL('image/png');
      } catch (h2cErr) {
        console.warn('html2canvas failed, trying html-to-image fallback:', h2cErr);
        dataUrl = await toPng(cloneNode, {
          quality: 0.9,
          pixelRatio: 1.0, // Reduced for speed
          backgroundColor: bgColor,
          skipFonts: true,
          cacheBust: false,
          width: captureWidth,
          height: nodeHeight,
        });
      }

      if (dataUrl) {
        const scopeLabel = scope === 'all' ? '전체' : scope;
        const link = document.createElement('a');
        link.download = `[피그타운]수집체크리스트_${scopeLabel}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to capture trend checklist image:', err);
    } finally {
      if (cloneContainer && document.body.contains(cloneContainer)) {
        document.body.removeChild(cloneContainer);
      }
      setIsCapturing(false);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 md:px-6 py-6 font-sans select-none animate-in fade-in duration-300 relative">
      {/* Background Watermark */}
      <div data-capture-ignore="true" className="fixed inset-y-0 right-0 left-0 lg:left-64 top-16 pointer-events-none select-none flex items-center justify-center z-0 opacity-[0.03] dark:opacity-[0.02] font-sans">
        <span className="text-[12vw] md:text-[8vw] font-black tracking-[0.2em] text-stone-900 dark:text-stone-100">피그타운</span>
      </div>

      {/* Title Header */}
      <div className="flex flex-col gap-4 mb-8 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-indigo-100/80 dark:border-stone-800 shadow-xs relative overflow-hidden">
        {/* Header Title Area */}
        <div className="flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <Shirt className="h-5 w-5 animate-bounce" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">트렌드상점 수집율</h2>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-bold mt-0.5">TREND SHOP COLLECTION PROGRESS</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedCategory === 'all') {
                handleDownloadImage('all');
              } else {
                setShowDownloadModal(true);
              }
            }}
            disabled={isCapturing}
            data-capture-ignore="true"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
            title="체크리스트 이미지로 저장"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Download className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="hidden sm:inline">{isCapturing ? '저장 중...' : '체크리스트 저장'}</span>
            <span className="sm:hidden">{isCapturing ? '저장 중...' : '저장'}</span>
          </button>
        </div>

        {/* Progress label aligned left, right above the bar's start */}
        <div className="flex items-baseline gap-2 z-10 mt-1">
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">{progressPercent}%</span>
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap leading-none">
            ({checkedCount}/{totalCount})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-neutral-100 dark:bg-stone-800/80 rounded-full overflow-hidden shadow-inner border border-neutral-200/10 dark:border-stone-700/20 z-10">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Simple Warning Info */}
        <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/5 dark:bg-amber-500/10 px-3 py-2.5 rounded-xl border border-amber-500/10 w-full leading-relaxed z-10">
          <span className="shrink-0 text-xs">⚠️</span>
          <span>수집 정보는 기기 브라우저에만 저장됩니다. 브라우저 캐시를 삭제하면 복구할 수 없으니 주의해주세요.</span>
        </div>
      </div>

      {/* Control Actions Panel (Category Filter + Status Filter) */}
      
      {/* 1. PC Layout (Visible on medium screens and up) */}
      <div className="hidden md:flex items-center justify-between gap-4 bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-4 mb-8 shadow-sm">
        {/* Left Side: Category Horizontal List */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border",
                selectedCategory === 'all'
                  ? "bg-stone-900 border-stone-900 dark:bg-stone-100 dark:border-stone-100 text-white dark:text-stone-900 shadow-sm font-black"
                  : "bg-stone-50/50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200/60 dark:border-stone-800 shadow-xs"
              )}
            >
              <span>전체</span>
            </button>

            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 text-white shadow-sm font-black"
                      : "bg-stone-50/50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200/60 dark:border-stone-800 shadow-xs"
                  )}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-stone-200 dark:bg-stone-800" />

        {/* Right Side Status Filter (No Count, filter icon on left) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 mr-1 select-none whitespace-nowrap">
            <Filter className="h-4 w-4" />
          </div>
          <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200/40 dark:border-stone-850 shadow-inner">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === 'all'
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('checked')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1",
                statusFilter === 'checked'
                  ? "bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              <Check className="h-3 w-3" />
              <span>체크완료</span>
            </button>
            <button
              onClick={() => setStatusFilter('unchecked')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === 'unchecked'
                  ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              미완료
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mobile Layout (Visible below medium screens) */}
      <div className="bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3.5 shadow-sm flex flex-col gap-3.5 md:hidden mb-6">
        {/* Category section */}
        <div className="w-full">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border",
                selectedCategory === 'all'
                  ? "bg-stone-900 border-stone-900 dark:bg-stone-100 dark:border-stone-100 text-white dark:text-stone-900 font-black shadow-sm"
                  : "bg-stone-50/50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200/60 dark:border-stone-800 shadow-xs"
              )}
            >
              <span>전체</span>
            </button>

            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 text-white font-black shadow-sm"
                      : "bg-stone-50/50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200/60 dark:border-stone-800 shadow-xs"
                  )}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider line */}
        <div className="h-[1px] w-full bg-stone-100 dark:bg-stone-850" />

        {/* Filter section with icon and segmented control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 select-none shrink-0 pl-1">
            <Filter className="h-4 w-4" />
          </div>
          <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200/40 dark:border-stone-800/80 shadow-inner flex-1 justify-between font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 text-center",
                statusFilter === 'all'
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('checked')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 flex-1 text-center",
                statusFilter === 'checked'
                  ? "bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              <Check className="h-3 w-3" />
              <span>체크완료</span>
            </button>
            <button
              onClick={() => setStatusFilter('unchecked')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 text-center",
                statusFilter === 'unchecked'
                  ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 shadow-xs font-black"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              )}
            >
              미완료
            </button>
          </div>
        </div>
      </div>

      {/* Main Checklist Display Grid */}
      <div className="space-y-8 min-h-[300px]">
        {filteredItems.length === 0 || (selectedCategory !== 'all' && filteredItems.filter(item => item.category === selectedCategory).length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-neutral-200 dark:border-stone-800 p-6 shadow-xs">
            <HelpCircle className="h-10 w-10 text-neutral-300 dark:text-stone-700 mb-3" />
            <p className="text-sm font-bold text-neutral-500 dark:text-stone-400">조건에 맞는 아이템을 찾을 수 없어요.</p>
            <p className="text-xs text-neutral-400 dark:text-stone-500 mt-1 font-medium">선택하신 카테고리와 필터를 다시 한번 확인해 보세요! ✨</p>
          </div>
        ) : selectedCategory === 'all' ? (
          /* Render grouped list with sections */
          categories.map(cat => {
            const groupList = groupedItems[cat] || [];
            if (groupList.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-stone-800 pb-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-black text-neutral-700 dark:text-stone-200 uppercase tracking-wider">
                    {cat} <span className="text-xs font-semibold text-neutral-400 dark:text-stone-500 ml-1">({groupList.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
                  {groupList.map(item => {
                    const isChecked = checkedIds.includes(item.id);
                    return (
                      <CheckCard 
                        key={item.id} 
                        item={item} 
                        isChecked={isChecked} 
                        onToggle={() => handleToggleItem(item.id)} 
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          /* Render single category grid */
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-stone-800 pb-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              <h3 className="text-sm font-black text-neutral-700 dark:text-stone-200 uppercase tracking-wider">
                {selectedCategory} <span className="text-xs font-semibold text-neutral-400 dark:text-stone-500 ml-1">({filteredItems.filter(item => item.category === selectedCategory).length})</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
              {filteredItems
                .filter(item => item.category === selectedCategory)
                .map(item => {
                  const isChecked = checkedIds.includes(item.id);
                  return (
                    <CheckCard 
                      key={item.id} 
                      item={item} 
                      isChecked={isChecked} 
                      onToggle={() => handleToggleItem(item.id)} 
                    />
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Adorable Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.35 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-700 text-center z-10 overflow-hidden"
            >
              {/* Cute Decorative Sparkles or Waves in background */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500" />
              
              <div className="mx-auto w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-4 animate-bounce">
                <Heart className="h-7 w-7 fill-indigo-500 stroke-indigo-500 dark:fill-indigo-400 dark:stroke-indigo-400" />
              </div>
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100 mb-2">정말 초기화할까요?</h3>
              <p className="text-xs text-stone-500 dark:text-stone-300 font-bold leading-relaxed mb-6">
                체크하신 소장 기록이 모두 사라지게 됩니다.<br />
                다시 처음부터 채워보고 싶다면 확인을 눌러주세요! 🎀
              </p>
              
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer active:scale-95 transition-all"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckedIds([]);
                    setShowResetModal(false);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-black shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 cursor-pointer active:scale-95 transition-all"
                >
                  초기화
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Download Scope Selection Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDownloadModal(false)}
              className="absolute inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.35 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-700 text-left z-10 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                    <Download className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                    이미지 저장 범위 선택
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-xl cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 font-bold leading-relaxed">
                현재 <span className="text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-700/60 font-black">'{selectedCategory}'</span> 카테고리가 선택되어 있습니다. 저장할 방식을 선택해 주세요!
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={async () => {
                    await handleDownloadImage('all');
                    setShowDownloadModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/90 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 active:scale-98 transition-all cursor-pointer group disabled:opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-stone-500 dark:text-stone-300" />
                    ) : (
                      <Layers className="h-4 w-4 text-stone-500 group-hover:text-stone-800 dark:text-stone-300 dark:group-hover:text-white" />
                    )}
                    <span className="text-xs font-black text-stone-800 dark:text-stone-100">
                      {isCapturing ? '이미지 저장 중...' : '전체 리스트 저장'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-400">모든 카테고리</span>
                </button>

                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={async () => {
                    await handleDownloadImage(selectedCategory);
                    setShowDownloadModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/80 active:scale-98 transition-all cursor-pointer group disabled:opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Shirt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-200">
                      {isCapturing ? '이미지 저장 중...' : `'${selectedCategory}' 목록만 저장`}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-300">선택 카테고리만</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}


      </AnimatePresence>

      {/* Offscreen Capture Target Element (Dynamically scoped based on captureScope) */}
      {(() => {
        const scopeItems = captureScope === 'all' 
          ? trendItems 
          : trendItems.filter(item => item.category === captureScope);
        const scopeCheckedCount = scopeItems.filter(item => checkedIds.includes(item.id)).length;
        const scopeTotalCount = scopeItems.length;
        const scopeProgressPercent = scopeTotalCount > 0 ? Math.round((scopeCheckedCount / scopeTotalCount) * 100) : 0;
        const scopeCategories = captureScope === 'all' ? categories : categories.filter(c => c === captureScope);

        return (
          <div
            ref={captureTargetRef}
            style={{ position: 'fixed', left: '-9999px', top: 0, width: '960px', zIndex: -9999, pointerEvents: 'none' }}
            className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-8 space-y-8 font-sans"
          >
            {/* Collection Progress Card */}
            <div className="flex flex-col gap-4 bg-stone-50/90 dark:bg-stone-800/90 p-6 rounded-2xl border border-indigo-200/80 dark:border-stone-700/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <Shirt className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight whitespace-nowrap">
                      트렌드상점 수집율
                    </h2>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5 whitespace-nowrap">TREND SHOP COLLECTION PROGRESS</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">피그타운</span>
                  <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">https://pigtown.netlify.app</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">{scopeProgressPercent}%</span>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap leading-none">
                  ({scopeCheckedCount}/{scopeTotalCount})
                </span>
              </div>

              <div className="w-full h-3.5 bg-stone-200/80 dark:bg-stone-700/80 rounded-full overflow-hidden border border-stone-300/30 dark:border-stone-600/30">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-full"
                  style={{ width: `${scopeProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Category Overview Bar inside Capture Target */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-50/90 dark:bg-stone-800/80 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5 w-full">
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap shadow-2xs",
                  captureScope === 'all'
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 font-black"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
                )}>
                  전체
                </div>
                {categories.map(cat => {
                  const isSelectedScope = captureScope === cat;
                  return (
                    <div
                      key={cat}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap shadow-2xs",
                        isSelectedScope
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-black"
                          : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
                      )}
                    >
                      <span>{cat}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist Grouped by Category */}
            <div className="space-y-7">
              {scopeCategories.map(cat => {
                const catItems = trendItems.filter(item => item.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-2 border-b-2 border-stone-200 dark:border-stone-800 pb-2">
                      <span className="w-2 h-4 bg-indigo-500 rounded-full shrink-0" />
                      <h3 className="text-sm font-black text-stone-800 dark:text-stone-100 uppercase tracking-wider whitespace-nowrap">
                        {cat}
                      </h3>
                    </div>

                    <div className="grid grid-cols-10 gap-2.5">
                      {catItems.map(item => {
                        const isChecked = checkedIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "relative rounded-2xl border overflow-hidden p-1 shadow-xs aspect-square",
                              isChecked
                                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500"
                                : "bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80"
                            )}
                          >
                            <div className="w-full h-full rounded-xl bg-stone-100/60 dark:bg-stone-900/60 flex items-center justify-center overflow-hidden relative">
                              <img
                                src={item.url}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className={cn(
                                  "w-[85%] h-[85%] object-contain",
                                  isChecked ? "scale-[0.88] opacity-85" : ""
                                )}
                              />
                              {isChecked && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-stone-900">
                                    <Check className="h-3 w-3 stroke-[4]" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

interface CheckCardProps {
  item: TrendItem;
  isChecked: boolean;
  onToggle: () => void;
}

const CheckCard: React.FC<CheckCardProps> = ({ item, isChecked, onToggle }) => {
  return (
    <motion.div
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative rounded-2xl bg-white dark:bg-stone-900 border overflow-hidden cursor-pointer transition-all duration-200 select-none group p-1.5 shadow-xs aspect-square",
        isChecked
          ? "border-indigo-300 dark:border-indigo-500/60 ring-2 ring-indigo-300/15 bg-indigo-50/5 dark:bg-indigo-950/5"
          : "border-neutral-200 dark:border-stone-800/80 hover:border-neutral-300 dark:hover:border-stone-700"
      )}
    >
      {/* Card Image Area with Checked overlay */}
      <div className="w-full h-full rounded-xl bg-neutral-50/50 dark:bg-stone-950/40 flex items-center justify-center overflow-hidden relative">
        <img
          src={item.url}
          alt={item.name}
          referrerPolicy="no-referrer"
          className={cn(
            "w-[85%] h-[85%] object-contain transition-all duration-300",
            isChecked ? "scale-[0.9] opacity-85" : "group-hover:scale-[1.05]"
          )}
          onError={(e) => {
            // Replace with beautiful clothes placeholder if image file is broken/missing
            e.currentTarget.style.display = 'none';
            const placeholder = e.currentTarget.parentElement?.querySelector('.fallback-placeholder');
            if (placeholder) {
              placeholder.classList.remove('hidden');
            }
          }}
        />

        {/* Fallback clothes placeholder icon */}
        <div className="fallback-placeholder hidden absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
          <Shirt className="h-8 w-8 text-neutral-300 dark:text-stone-700" />
          <span className="text-[10px] font-black text-neutral-400 dark:text-stone-600 mt-1 uppercase tracking-widest">{item.category}</span>
        </div>

        {/* Unchecked interactive overlay indicator */}
        {!isChecked && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full border-2 border-dashed border-neutral-300 dark:border-stone-700/80 bg-white/50 dark:bg-stone-900/50 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all">
            <Check className="h-3.5 w-3.5 text-neutral-400 dark:text-stone-500 stroke-[3.5]" />
          </div>
        )}

        {/* Cute sticker check badge in top-right corner */}
        {isChecked && (
          <div className="absolute top-2 right-2 z-10">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-stone-900">
              <Check className="h-3.5 w-3.5 stroke-[4]" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

