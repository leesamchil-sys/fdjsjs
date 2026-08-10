import { memo } from 'react';
import { ItemCard } from './ItemCard';
import { Category, GameWeather } from '../types';

interface ItemListProps {
  items: any[];
  activeCategory: Category;
  completedIds: Set<string>;
  masterIds: Set<string>;
  ratings: Record<string, number>;
  toggleCompletion: (id: string, cat?: Category) => void;
  toggleMaster: (id: string, cat?: Category) => void;
  handleRate: (id: string, name: string, rating: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
  currentHour?: number;
  currentGameWeather?: GameWeather;
  onLocationClick?: (locationName: string, itemName: string) => void;
  handleOpenIngredientModal: (name: string) => void;
  isRecommend?: boolean;
  showPrices: boolean;
}

export const EncyclopediaItemList = memo(({
  items,
  activeCategory,
  completedIds,
  masterIds,
  ratings,
  toggleCompletion,
  toggleMaster,
  handleRate,
  favorites,
  toggleFavorite,
  currentHour,
  currentGameWeather,
  onLocationClick,
  handleOpenIngredientModal,
  isRecommend = false,
  showPrices,
}: ItemListProps) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 sm:gap-6 px-1.5 sm:px-4 lg:px-6 max-w-[1240px] mx-auto w-full select-none">
      {items.map((item) => (
        <div
          key={`${activeCategory}-${item.id}`}
          id={`card-${item.name}`}
          className="h-full transition-all duration-700 p-1.5"
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: '0 280px',
          }}
        >
          <ItemCard
            item={item}
            type={activeCategory}
            isCompleted={completedIds.has(item.id)}
            onToggle={() => toggleCompletion(item.id, activeCategory)}
            isMaster={masterIds.has(item.id)}
            onToggleMaster={() => toggleMaster(item.id, activeCategory)}
            isFavorite={favorites[item.id] || false}
            onToggleFavorite={() => toggleFavorite(item.id)}
            rating={ratings[item.name] || 0}
            onRate={(name, r) => handleRate(item.id, name, r)}
            hidePrices={!showPrices}
            currentHour={currentHour}
            currentGameWeather={currentGameWeather}
            onLocationClick={onLocationClick}
            onIngredientClick={handleOpenIngredientModal}
            isRecommend={isRecommend}
          />
        </div>
      ))}
    </div>
  );
});

EncyclopediaItemList.displayName = 'EncyclopediaItemList';
