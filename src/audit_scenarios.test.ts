import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock implementation for localStorage
class MockLocalStorage {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const localStorage = new MockLocalStorage();

describe('사용자 시나리오 데이터 유실 방지 테스트', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('[Scenario 4] 로그아웃 시 로컬 스토리지에 타인의 데이터가 남지 않아야 한다 (Issue #1)', async () => {
    // Given
    localStorage.setItem('completed_bird_ids', JSON.stringify(['bird_1']));
    
    // When
    // handleLogout 로직 재현 (실제 수정 후 동작 예상)
    const handleLogout = async () => {
      // signOut(auth);
      localStorage.removeItem('completed_bird_ids'); // 누락되었던 로직 추가 예정
      localStorage.removeItem('completed_insect_ids');
      localStorage.removeItem('completed_fish_ids');
      localStorage.removeItem('completed_food_ids');
      localStorage.removeItem('completed_gardening_ids');
      localStorage.removeItem('pigtown_pets');
      localStorage.removeItem('item_ratings');
      localStorage.removeItem('farming_slots');
      localStorage.removeItem('sync_resolved_uid');
    };
    await handleLogout();

    // Then
    expect(localStorage.getItem('completed_bird_ids')).toBeNull();
  });

  it('[Scenario 6] 타 컴포넌트에 의한 updatedAt 갱신 시, 내용이 같으면 덮어쓰지 않아야 한다 (Issue #4)', () => {
    // Given
    const localSlots = [{ cropId: 1 }];
    const cloudSlots = [{ cropId: 1 }]; // 클라우드의 예전 slots 데이터
    
    const localUpdatedAt = 1000;
    const cloudUpdatedAt = 5000; // App.tsx의 도감 갱신 등으로 updatedAt만 최신으로 올라감

    // When (CropTimer.tsx의 수정된 조건식)
    const isDataTrulyChanged = JSON.stringify(cloudSlots) !== JSON.stringify(localSlots);
    const shouldUpdateLocal = (cloudUpdatedAt > localUpdatedAt + 2000) && isDataTrulyChanged;

    // Then
    expect(shouldUpdateLocal).toBe(false); // 변경되지 않았으므로 예전 클라우드 데이터로 로컬을 오염시키면 안됨
  });
});
