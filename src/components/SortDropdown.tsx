import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownUp, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SortOrder } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
    sortOrder: SortOrder;
    setSortOrder: (s: SortOrder) => void;
    options?: { value: SortOrder; label: string }[];
}

export default function SortDropdown({ sortOrder, setSortOrder, options = [
    { value: 'level', label: '레벨순' },
    { value: 'name', label: '이름순' },
    { value: 'location', label: '위치순' }
] }: Props) {
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-xl text-[10px] sm:text-[11px] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all hover:bg-stone-50 dark:hover:bg-stone-700 font-bold"
            >
                <ArrowDownUp className="h-3.5 w-3.5" />
                <span>{options.find(o => o.value === sortOrder)?.label}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xl z-50 py-1">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setSortOrder(opt.value); setIsOpen(false); }}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold transition-colors",
                                sortOrder === opt.value
                                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                            )}
                        >
                            {opt.label}
                            {sortOrder === opt.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
