export function reconstructSlotsFromFarmingSlotsMap(farmingSlots: any): any[] {
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
    if (!existing || (slot.updatedAt || 0) > (existing.updatedAt || 0)) {
      slotsById[slot.id] = slot;
    }
  });

  Object.values(slotsById).forEach((slot: any) => {
    const idx = parseInt(slot.id.replace('slot_', '')) - 1;
    if (idx >= 0 && idx < 8) {
      result[idx] = {
        ...result[idx],
        ...slot,
        originalStartTime: slot.originalStartTime || slot.startTime || null,
        originalDuration: slot.originalDuration || slot.duration || null,
      };
    }
  });

  return result;
}
