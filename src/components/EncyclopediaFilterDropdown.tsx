import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, Star, Medal, Sparkle, Eye, EyeOff, Calendar } from 'lucide-react';
import { SEASONAL_EVENTS, getSeasonBadgeStyle } from '../data/seasonal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FilterOption = 'all' | 'collected' | 'uncollected';
type StarFilter = 'all' | 'done' | 'todo';
type MasterFilter = 'all' | 'done' | 'todo';

interface Props {
    isSeasonFilterEnabled?: boolean;
    setIsSeasonFilterEnabled?: (enabled: boolean) => void;
    selectedSeasonFilters?: string[];
    setSelectedSeasonFilters?: (filters: string[]) => void;
    activeSeasonIds?: string[];
    collectionFilter: FilterOption;
    setCollectionFilter: (f: FilterOption) => void;
    starFilter: StarFilter;
    setStarFilter: (f: StarFilter) => void;
    masterFilter: MasterFilter;
    setMasterFilter: (f: MasterFilter) => void;
    activeCategory?: string;
    showPrices?: boolean;
    setShowPrices?: (show: boolean) => void;
}

export default function EncyclopediaFilterDropdown({
    collectionFilter,
    setCollectionFilter,
    starFilter,
    setStarFilter,
    masterFilter,
    setMasterFilter,
    activeCategory,
    showPrices,
    setShowPrices,
    isSeasonFilterEnabled,
    setIsSeasonFilterEnabled,
    selectedSeasonFilters = [],
    setSelectedSeasonFilters,
    activeSeasonIds
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const activeFilterCount = [
        collectionFilter !== 'all',
        starFilter !== 'all',
        masterFilter !== 'all',
        showPrices === true,
        isSeasonFilterEnabled === true
    ].filter(Boolean).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-[40px] sm:h-[42px] px-3 sm:px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] font-bold transition-all border cursor-pointer shadow-sm shrink-0",
                    activeFilterCount > 0
                        ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:border-emerald-700 dark:text-stone-100 dark:hover:bg-emerald-600"
                        : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
                )}
            >
                <div className="relative flex items-center justify-center">
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 sm:hidden flex items-center justify-center min-w-[14px] h-[14px] bg-red-500 text-white rounded-full text-[9px] font-black px-0.5">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <span className="hidden sm:inline">
                    {activeFilterCount > 0 ? `상세필터(${activeFilterCount})` : '상세 필터'}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform hidden sm:block", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl z-50 p-4 space-y-4">
                    {/* Collection */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-stone-500 dark:text-stone-400 uppercase">
                           <Check className="h-3.5 w-3.5" /> 수집 현황
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {['all', 'collected', 'uncollected'].map(opt => (
                                <button key={opt} onClick={() => setCollectionFilter(opt as FilterOption)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", collectionFilter === opt ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-xs" : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300")}>
                                    {opt === 'all' ? '전체' : opt === 'collected' ? '수집완료' : '미수집'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Star */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-stone-500 dark:text-stone-400 uppercase">
                          <Star className="h-3.5 w-3.5" /> 5성 현황
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {['all', 'done', 'todo'].map(opt => (
                                <button key={opt} onClick={() => setStarFilter(opt as StarFilter)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", starFilter === opt ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-xs" : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300")}>
                                    {opt === 'all' ? '전체' : opt === 'done' ? '5성완료' : '5성미완료'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Master */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-stone-500 dark:text-stone-400 uppercase">
                           <Medal className="h-3.5 w-3.5" /> 명인 현황
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {['all', 'done', 'todo'].map(opt => (
                                <button key={opt} onClick={() => setMasterFilter(opt as MasterFilter)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", masterFilter === opt ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-xs" : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300")}>
                                    {opt === 'all' ? '전체' : opt === 'done' ? '명인완료' : '명인미완료'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Season Filter */}
                    {setIsSeasonFilterEnabled && setSelectedSeasonFilters && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-black text-stone-500 dark:text-stone-400 uppercase">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" /> 시즌 도감만 보기
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={() => {
                                        setIsSeasonFilterEnabled(true);
                                        if (selectedSeasonFilters.length === 0 && SEASONAL_EVENTS.length > 0) {
                                            setSelectedSeasonFilters(SEASONAL_EVENTS.map(s => s.id));
                                        }
                                    }}
                                    className={cn(
                                        "px-2.5 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer text-center border",
                                        isSeasonFilterEnabled
                                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 shadow-xs"
                                            : "bg-stone-50 dark:bg-stone-850 border-stone-150/40 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                                    )}
                                >
                                    ON
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSeasonFilterEnabled(false);
                                        setSelectedSeasonFilters([]);
                                    }}
                                    className={cn(
                                        "px-2.5 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer text-center border",
                                        !isSeasonFilterEnabled
                                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 shadow-xs"
                                            : "bg-stone-50 dark:bg-stone-850 border-stone-150/40 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                                    )}
                                >
                                    OFF
                                </button>
                            </div>
                            
                            {/* Season Multi-Select */}
                            {isSeasonFilterEnabled && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 mb-1">표시할 시즌 선택 (다중선택 가능)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SEASONAL_EVENTS.map(season => {
                                            const isSelected = selectedSeasonFilters.includes(season.id);
                                            const isGloballyActive = !activeSeasonIds || activeSeasonIds.includes(season.id);
                                            return (
                                                <button
                                                    key={season.id}
                                                    disabled={!isGloballyActive}
                                                    onClick={() => {
                                                        if (!isGloballyActive) return;
                                                        if (isSelected) {
                                                            setSelectedSeasonFilters(selectedSeasonFilters.filter(id => id !== season.id));
                                                        } else {
                                                            setSelectedSeasonFilters([...selectedSeasonFilters, season.id]);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-2.5 py-1 text-[11px] rounded-full transition-all font-extrabold border inline-flex items-center gap-1.5 w-auto shrink-0 shadow-2xs",
                                                        !isGloballyActive
                                                            ? "bg-stone-100 dark:bg-stone-900 border-stone-200/50 dark:border-stone-850 text-stone-400 dark:text-stone-600 opacity-65 cursor-not-allowed"
                                                            : isSelected
                                                                ? cn(getSeasonBadgeStyle(season.id).bg, getSeasonBadgeStyle(season.id).text, getSeasonBadgeStyle(season.id).border, "cursor-pointer ring-1 ring-current/20")
                                                                : "bg-stone-50 dark:bg-stone-850 border-stone-150/40 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 opacity-70"
                                                    )}
                                                    title={!isGloballyActive ? "시즌 이벤트 도감 설정에서 비활성화된 시즌입니다." : undefined}
                                                >
                                                    {season.emoji && <span className="text-[12px]">{season.emoji}</span>}
                                                    <span>{season.shortName || season.name}</span>
                                                    {!isGloballyActive ? (
                                                        <span className="text-[9px] font-black text-stone-400 dark:text-stone-500">(설정 꺼짐)</span>
                                                    ) : isSelected ? (
                                                        <Check className="h-3 w-3 shrink-0" />
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Prices (Subtle toggle) */}
                    {showPrices !== undefined && setShowPrices !== undefined && (
                        <div className="space-y-2 pt-1 border-t border-dashed border-stone-100 dark:border-stone-800/60">
                            <div className="flex items-center gap-1.5 text-xs font-black text-stone-500 dark:text-stone-400 uppercase">
                               <Eye className="h-3.5 w-3.5" /> 판매 가격 표시
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button 
                                    onClick={() => setShowPrices(true)} 
                                    className={cn(
                                        "px-2.5 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer text-center border", 
                                        showPrices 
                                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 shadow-xs" 
                                            : "bg-stone-50 dark:bg-stone-850 border-stone-150/40 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                                    )}
                                >
                                    전체 표시
                                </button>
                                <button 
                                    onClick={() => setShowPrices(false)} 
                                    className={cn(
                                        "px-2.5 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer text-center border", 
                                        !showPrices 
                                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 shadow-xs" 
                                            : "bg-stone-50 dark:bg-stone-850 border-stone-150/40 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                                    )}
                                >
                                    가격 숨김
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => {
                            setCollectionFilter('all');
                            setStarFilter('all');
                            setMasterFilter('all');
                            if (setShowPrices) setShowPrices(false);
                            if (setIsSeasonFilterEnabled) setIsSeasonFilterEnabled(false);
                            if (setSelectedSeasonFilters) setSelectedSeasonFilters([]);
                        }}
                        className="w-full text-xs text-center text-stone-400 hover:text-stone-600 pt-2 border-t dark:border-stone-800 cursor-pointer"
                    >
                        모든 필터 초기화
                    </button>
                </div>
            )}
        </div>
    );
}
