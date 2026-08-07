import { useState, useEffect, useRef } from 'react';
import { safeJsonParse } from '../lib/utils';

export interface FarmingSlot {
  id: number;
  cropId?: string;
  plantedAt?: number;
  wateredAt?: number;
  harvestReadyAt?: number;
  stage?: number;
}

export function useFarmingAndPets() {
  const [farmingSlots, setFarmingSlots] = useState<FarmingSlot[]>(() => {
    const saved = localStorage.getItem('farming_slots');
    return safeJsonParse(saved, [
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
      { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }
    ]);
  });

  const hasFarmingSyncPendingRef = useRef(false);
  const localFarmingWriteLockRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('farming_slots', JSON.stringify(farmingSlots));
      localStorage.setItem('local_farming_updated_at', Date.now().toString());
    }
  }, [farmingSlots]);

  const [pigtownPets, setPigtownPets] = useState<any[]>(() => {
    const saved = localStorage.getItem('pigtown_pets');
    return safeJsonParse(saved, []);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pigtown_pets', JSON.stringify(pigtownPets));
    }
  }, [pigtownPets]);

  return {
    farmingSlots,
    setFarmingSlots,
    hasFarmingSyncPendingRef,
    localFarmingWriteLockRef,
    pigtownPets,
    setPigtownPets,
  };
}
