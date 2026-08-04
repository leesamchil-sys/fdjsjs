import { Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { Category } from '../types';

export const getPriceForStar = (basePrice: number, star: number, type?: Category | string, item?: any) => {
  if (type === 'oceanCleaning' || type === 'ocean_cleaning' || item?.category === '바다청소') {
    if (star === 1) return basePrice;
    if (star === 2) return basePrice * 2;
    if (star === 3) return basePrice * 3;
    if (star === 4) return basePrice * 4;
    if (star === 5) return basePrice * 5;
    return basePrice;
  }

  if (type === 'birds') {
    if (star === 1) return basePrice;
    const star2 = Math.round((basePrice * 4) / 10) * 10;
    if (star === 2) return star2;
    if (star === 3) return star2 * 2;
    if (star === 4) return star2 * 4;
    if (star === 5) return star2 * 8;
    return basePrice;
  }
  
  if (type === 'gardening') {
    if (star === 1) return basePrice;
    if (star === 2) return Math.floor(basePrice * 1.5);
    if (star === 3) return Math.floor(basePrice * 2.0);
    if (star === 4) return Math.floor(basePrice * 2.5);
    if (star === 5) return Math.floor(basePrice * 4.0);
    return basePrice;
  }

  if (type === 'crops') {
    if (star === 1) return basePrice;
    if (star === 2) return Math.round(basePrice * 1.333);
    if (star === 3) return Math.round(basePrice * 1.667);
    if (star === 4) return Math.round(basePrice * 2);
    if (star === 5) return Math.round(basePrice * 3);
    return basePrice;
  }

  const multipliers: Record<number, number> = {
    1: 1,
    2: 1.5,
    3: 2,
    4: 4,
    5: 8
  };
  return Math.floor(basePrice * (multipliers[star] || 1));
};

export const PriceTable = ({ item, type, hidePrices, variant = 'default', forceDark = false }: { item: any, type?: Category | string, hidePrices?: boolean, variant?: 'default' | 'compact', forceDark?: boolean }) => {
  const price = item.price ?? item.fiveStarCondition?.price;
  if (price === undefined) {
    return (
      <div className={cn(
        "flex items-center justify-center py-2 px-2 text-stone-400 dark:text-stone-500 font-bold text-[10.5px]",
        hidePrices && "hidden",
        forceDark && "dark"
      )}>
        확인중입니다.
      </div>
    );
  }

  const rawMaxStars = item.maxStars ?? 5;
  const maxStars = rawMaxStars > 0 ? rawMaxStars : 1;
  const starList = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className={cn(
      variant === 'default' && "pt-2 border-t border-dashed border-neutral-100 dark:border-stone-800", 
      hidePrices && "hidden",
      forceDark && "dark"
    )}>
      {variant === 'default' && (
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 text-[9px] font-black text-stone-700 bg-stone-100 dark:text-stone-200 dark:bg-stone-800 rounded-md tracking-tight uppercase">
            등급별 판매 가격 (골드)
          </span>
        </div>
      )}
      <div className={cn(
        "grid gap-0.5 sm:gap-1",
        starList.length === 1 ? "grid-cols-1 max-w-[72px]" :
        starList.length === 2 ? "grid-cols-2 max-w-[144px]" :
        starList.length === 3 ? "grid-cols-3 max-w-[216px]" :
        starList.length === 4 ? "grid-cols-4 max-w-[288px]" :
        "grid-cols-5"
      )}>
        {starList.map((starNum) => {
          const calculatedPrice = getPriceForStar(price, starNum, type, item);
          const priceString = calculatedPrice.toLocaleString();
          
          const starColor = 
            starNum === 1 ? "text-stone-500 dark:text-stone-400" :
            starNum === 2 ? "text-emerald-600 dark:text-emerald-400" :
            starNum === 3 ? "text-sky-600 dark:text-sky-400" :
            starNum === 4 ? "text-amber-500 dark:text-amber-400" :
            "text-rose-600 dark:text-rose-400";

          const boxStyle = 
            starNum === 1 ? "bg-white border-stone-200 dark:bg-stone-800/50 dark:border-stone-700" :
            starNum === 2 ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30" :
            starNum === 3 ? "bg-sky-50 border-sky-100 dark:bg-sky-900/20 dark:border-sky-800/30" :
            starNum === 4 ? "bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30" :
            "bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30";

          const priceColor = 
            starNum === 1 ? "text-stone-800 dark:text-stone-100" :
            starNum === 2 ? "text-emerald-900 dark:text-emerald-100" :
            starNum === 3 ? "text-sky-900 dark:text-sky-100" :
            starNum === 4 ? "text-amber-900 dark:text-amber-100" :
            "text-rose-900 dark:text-rose-100";

          // 자릿수에 따른 글꼴 크기 및 자간 미세 조절 (말줄임 방지)
          let priceSizeClass = "text-[9.5px] tracking-tight";
          if (priceString.length >= 6) {
            priceSizeClass = "text-[7.5px] tracking-[-0.05em]";
          } else if (priceString.length >= 5) {
            priceSizeClass = "text-[8.5px] tracking-[-0.03em]";
          }

          return (
            <div
              key={`price-info-${item.id}-${starNum}`}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-0 rounded-xl border text-center min-w-0 transition-all",
                boxStyle
              )}
            >
              {/* Star with number inside */}
              <div className="relative flex items-center justify-center shrink-0 mb-1 select-none">
                <Star className={cn("h-4 w-4 fill-current", starColor)} />
                <span className="absolute text-[7.5px] font-black text-white leading-none pt-[0.5px]">
                  {starNum}
                </span>
              </div>
              
              {/* Price below */}
              <span className={cn("font-black whitespace-nowrap w-full px-0.5", priceColor, priceSizeClass)}>
                {priceString}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
