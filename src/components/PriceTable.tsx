import { Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { Category } from '../types';

const getPriceForStar = (basePrice: number, star: number, type?: Category) => {
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
    if (star === 4) return Math.floor(basePrice * 4.0);
    if (star === 5) return Math.floor(basePrice * 8.0);
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

export const PriceTable = ({ item, type, hidePrices, variant = 'default' }: { item: any, type?: Category, hidePrices?: boolean, variant?: 'default' | 'compact' }) => {
  const price = item.price ?? item.fiveStarCondition?.price;
  if (price === undefined) return null;

  return (
    <div className={cn(
      variant === 'default' && "pt-2 border-t border-dashed border-neutral-100 dark:border-stone-800", 
      hidePrices && "hidden"
    )}>
      {variant === 'default' && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9.5px] font-black text-stone-400 dark:text-stone-500 tracking-tight uppercase">
            등급별 판매 가격 (골드)
          </span>
        </div>
      )}
      <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((starNum) => {
          const calculatedPrice = getPriceForStar(price, starNum, type);
          const priceString = calculatedPrice.toLocaleString();
          
          const starColor = 
            starNum === 1 ? "text-stone-400 dark:text-stone-500" :
            starNum === 2 ? "text-emerald-500 dark:text-emerald-400" :
            starNum === 3 ? "text-sky-500 dark:text-sky-400" :
            starNum === 4 ? "text-amber-550 dark:text-amber-450" :
            "text-rose-500 dark:text-rose-400";

          const boxStyle = 
            starNum === 1 ? "bg-stone-50/60 dark:bg-stone-900/30 border-stone-100 dark:border-stone-850/50" :
            starNum === 2 ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border-emerald-500/10 dark:border-emerald-500/[0.06]" :
            starNum === 3 ? "bg-sky-500/[0.04] dark:bg-sky-500/[0.02] border-sky-500/10 dark:border-sky-500/[0.06]" :
            starNum === 4 ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.02] border-amber-500/10 dark:border-amber-500/[0.06]" :
            "bg-rose-500/[0.04] dark:bg-rose-500/[0.02] border-rose-500/10 dark:border-rose-500/[0.06]";

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
                <span className="absolute text-[7.5px] font-black text-white dark:text-stone-950 leading-none pt-[0.5px]">
                  {starNum}
                </span>
              </div>
              
              {/* Price below */}
              <span className={cn("font-black whitespace-nowrap w-full px-0.5 text-stone-700 dark:text-stone-300", priceSizeClass)}>
                {priceString}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
