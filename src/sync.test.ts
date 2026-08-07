import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeJsonParse } from './lib/utils';

// Mock storage implementation to simulate localStorage in node environment
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

  get length() {
    return Object.keys(this.store).length;
  }
}

const localStorage = new MockLocalStorage();

// Interface for simulation states
interface SyncState {
  user: { uid: string; email: string } | null;
  isInitialSyncDone: boolean;
  syncConflict: any | null;
  localState: {
    birds: Set<string>;
    ratings: Record<string, number>;
    pets: any[];
    localUpdatedAt: number;
    hasUnsyncedChanges: boolean;
    syncResolvedUid: string | null;
  };
  firestoreDB: Record<string, {
    uid: string;
    completedBirdNames: string[];
    ratings: Record<string, number>;
    pets: any[];
    updatedAt: number;
  }>;
}

// Emulate Sync Engine Logic extracted from App.tsx
class SyncEngine {
  state: SyncState;

  constructor(initialState: SyncState) {
    this.state = initialState;
  }

  // Simulate local action (e.g., user checks a bird item)
  checkLocalBird(birdId: string, birdName: string) {
    this.state.localState.birds.add(birdId);
    this.state.localState.localUpdatedAt = Date.now();
    this.state.localState.hasUnsyncedChanges = true;
    localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(this.state.localState.birds)));
    localStorage.setItem('local_collections_updated_at', String(this.state.localState.localUpdatedAt));
    localStorage.setItem('has_unsynced_changes', 'true');
  }

  // Simulate onAuthStateChanged inside React
  async onAuthStateChanged(newUser: { uid: string; email: string } | null) {
    const prevUser = this.state.user;
    this.state.user = newUser;

    if (newUser?.uid !== prevUser?.uid) {
      this.state.isInitialSyncDone = false;
      this.state.syncConflict = null;
    }

    if (newUser) {
      await this.runLoginSyncFlow(newUser);
    }
  }

  // Core Login Sync Logic aligning with App.tsx
  async runLoginSyncFlow(loggedInUser: { uid: string; email: string }) {
    const cloudDoc = this.state.firestoreDB[loggedInUser.uid];
    
    // Read local storage sets
    const localBirdsStr = localStorage.getItem('completed_bird_ids');
    const localBirds = new Set<string>(safeJsonParse(localBirdsStr, []));

    if (!cloudDoc) {
      // Scenario A: Guest -> New account (No cloud data)
      // Automatically push local guest progress to cloud
      this.state.firestoreDB[loggedInUser.uid] = {
        uid: loggedInUser.uid,
        completedBirdNames: Array.from(localBirds),
        ratings: this.state.localState.ratings,
        pets: this.state.localState.pets,
        updatedAt: Date.now(),
      };
      this.state.isInitialSyncDone = true;
      this.state.localState.hasUnsyncedChanges = false;
      this.state.localState.syncResolvedUid = loggedInUser.uid;
      localStorage.setItem('sync_resolved_uid', loggedInUser.uid);
      localStorage.removeItem('has_unsynced_changes');
      return;
    }

    // Scenario B: Existing cloud user
    const cloudBirds = new Set<string>(cloudDoc.completedBirdNames || []);
    
    // Check if there is local progress to merge/conflict
    const hasLocalProgress = localBirds.size > 0;
    
    if (!hasLocalProgress) {
      // Cloud has data, Local is empty -> Fast adopt cloud
      this.state.localState.birds = new Set(cloudBirds);
      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
      this.state.isInitialSyncDone = true;
      this.state.localState.syncResolvedUid = loggedInUser.uid;
      localStorage.setItem('sync_resolved_uid', loggedInUser.uid);
      localStorage.removeItem('has_unsynced_changes');
      return;
    }

    // Both local & cloud have data -> Check if they differ
    const isDifferent = Array.from(localBirds).some(b => !cloudBirds.has(b)) || 
                        Array.from(cloudBirds).some(b => !localBirds.has(b));

    if (isDifferent) {
      // Trigger data conflict popup to let the user choose
      this.state.syncConflict = {
        cloudCount: cloudBirds.size,
        localCount: localBirds.size,
        resolve: (choice: 'cloud' | 'local' | 'merge') => {
          if (choice === 'cloud') {
            // Restore Cloud, overwrite local
            this.state.localState.birds = new Set(cloudBirds);
            localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
          } else if (choice === 'local') {
            // Overwrite cloud with local
            this.state.firestoreDB[loggedInUser.uid] = {
              uid: loggedInUser.uid,
              completedBirdNames: Array.from(localBirds),
              ratings: this.state.localState.ratings,
              pets: this.state.localState.pets,
              updatedAt: Date.now(),
            };
          } else if (choice === 'merge') {
            // Merge local and cloud sets
            const mergedBirds = new Set([...localBirds, ...cloudBirds]);
            this.state.localState.birds = mergedBirds;
            localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(mergedBirds)));
            this.state.firestoreDB[loggedInUser.uid] = {
              uid: loggedInUser.uid,
              completedBirdNames: Array.from(mergedBirds),
              ratings: this.state.localState.ratings,
              pets: this.state.localState.pets,
              updatedAt: Date.now(),
            };
          }
          this.state.isInitialSyncDone = true;
          this.state.localState.hasUnsyncedChanges = false;
          this.state.localState.syncResolvedUid = loggedInUser.uid;
          localStorage.setItem('sync_resolved_uid', loggedInUser.uid);
          localStorage.removeItem('has_unsynced_changes');
          this.state.syncConflict = null;
        }
      };
    } else {
      // Same data -> auto-resolve
      this.state.isInitialSyncDone = true;
      this.state.localState.syncResolvedUid = loggedInUser.uid;
      localStorage.setItem('sync_resolved_uid', loggedInUser.uid);
      localStorage.removeItem('has_unsynced_changes');
    }
  }

  // Simulate onSnapshot passive real-time sync with Outdated checks
  handlePassiveSnapshotUpdate(snapshotData: any) {
    if (!this.state.user || !this.state.isInitialSyncDone) {
      return; // Passive sync strictly locked before initial sync completes
    }

    const cloudUpdatedAt = snapshotData.updatedAt || 0;
    const localUpdatedAt = parseInt(localStorage.getItem('local_collections_updated_at') || '0', 10);

    // Outdated localStorage Safety: If cloud update is older than local edit timestamp (-1500ms),
    // we ignore it to prevent overwriting newer offline/unsynced edits.
    if (cloudUpdatedAt < localUpdatedAt - 1500) {
      console.log("[Test Log] Outdated snapshot ignored. Preserving newer local edits.");
      return;
    }

    // Convert and adopt
    const cloudBirds = new Set<string>(snapshotData.completedBirdNames || []);
    const localBirdsStr = localStorage.getItem('completed_bird_ids');
    const localBirds = new Set<string>(safeJsonParse(localBirdsStr, []));

    let dataActuallyChanged = false;
    if (cloudBirds.size !== localBirds.size || Array.from(cloudBirds).some(b => !localBirds.has(b))) {
      dataActuallyChanged = true;
    }

    if (dataActuallyChanged) {
      this.state.localState.birds = cloudBirds;
      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
      localStorage.setItem('local_collections_updated_at', String(cloudUpdatedAt));
    }
  }
}

describe('Pigtown Sync System - Comprehensive Prevention of Data Loss Tests', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    localStorage.clear();
    const initialState: SyncState = {
      user: null,
      isInitialSyncDone: false,
      syncConflict: null,
      localState: {
        birds: new Set(),
        ratings: {},
        pets: [],
        localUpdatedAt: 0,
        hasUnsyncedChanges: false,
        syncResolvedUid: null,
      },
      firestoreDB: {},
    };
    engine = new SyncEngine(initialState);
  });

  // 1. 게스트 → 로그인 (Guest -> Login) Flow Test
  it('Scenario 1: Guest progress is merged successfully when logging in as a brand-new user without cloud progress', async () => {
    // 1. Simulate guest completes some actions offline
    engine.checkLocalBird('cockatiel_id', '왕관앵무');
    expect(localStorage.getItem('completed_bird_ids')).toContain('cockatiel_id');
    expect(localStorage.getItem('has_unsynced_changes')).toBe('true');

    // 2. Log in as a new user (Firestore db has no item under uid)
    const newUser = { uid: 'user_123', email: 'test@example.com' };
    await engine.onAuthStateChanged(newUser);

    // 3. Confirm target outputs
    expect(engine.state.isInitialSyncDone).toBe(true);
    expect(engine.state.firestoreDB['user_123']).toBeDefined();
    expect(engine.state.firestoreDB['user_123'].completedBirdNames).toContain('cockatiel_id');
    expect(localStorage.getItem('sync_resolved_uid')).toBe('user_123');
    expect(localStorage.getItem('has_unsynced_changes')).toBeNull();
  });

  // 2. 로그아웃 → 게스트 → 로그인
  it('Scenario 2: Guest actions made after logging out are correctly evaluated when logging back in', async () => {
    // Presets some existing user cloud data
    engine.state.firestoreDB['user_456'] = {
      uid: 'user_456',
      completedBirdNames: ['pigeon_id'],
      ratings: {},
      pets: [],
      updatedAt: Date.now() - 5000,
    };

    // User is logged out, goes to guest mode, and checks some offline birds
    engine.checkLocalBird('finch_id', '참새');

    // Logs in to user_456 account
    const user = { uid: 'user_456', email: 'verified@example.com' };
    await engine.onAuthStateChanged(user);

    // Since guest progress 'finch_id' and cloud progress 'pigeon_id' are different, conflict modal triggers
    expect(engine.state.syncConflict).toBeDefined();
    expect(engine.state.syncConflict.cloudCount).toBe(1);
    expect(engine.state.syncConflict.localCount).toBe(1);

    // Resolve by MERGE
    engine.state.syncConflict.resolve('merge');

    // Verifies neither cloud nor local data is lost
    expect(engine.state.localState.birds.has('pigeon_id')).toBe(true);
    expect(engine.state.localState.birds.has('finch_id')).toBe(true);
    expect(engine.state.firestoreDB['user_456'].completedBirdNames).toContain('pigeon_id');
    expect(engine.state.firestoreDB['user_456'].completedBirdNames).toContain('finch_id');
  });

  // 3. 클라우드 데이터 존재 + 로컬 데이터 존재 + 데이터 다름 → 충돌 판정 확인
  it('Scenario 3: Triggers popup and allows selective resolutions cleanly without failing', async () => {
    // Cloud has bird A
    engine.state.firestoreDB['user_999'] = {
      uid: 'user_999',
      completedBirdNames: ['crow_id'],
      ratings: {},
      pets: [],
      updatedAt: Date.now() - 10000,
    };

    // Local state has bird B
    engine.checkLocalBird('seagull_id', '갈매기');

    // Login triggers conflict
    await engine.onAuthStateChanged({ uid: 'user_999', email: 'conflict@example.com' });
    expect(engine.state.syncConflict).toBeDefined();

    // Choice A: Overwrite with Cloud
    engine.state.syncConflict.resolve('cloud');
    expect(engine.state.localState.birds.has('crow_id')).toBe(true);
    expect(engine.state.localState.birds.has('seagull_id')).toBe(false);
  });

  // 4. 최신 Firestore 데이터 존재 + 오래된 localStorage 존재 → Firestore 보호 확인
  it('Scenario 4: Firestore Core is protected from outdated localStorage overrides during onSnapshot', async () => {
    // Simulate user has been verified and sync is complete
    engine.state.user = { uid: 'user_777', email: 'source_of_truth@example.com' };
    engine.state.isInitialSyncDone = true;

    // Local updated timestamp is at T1
    const T1 = Date.now() - 10000;
    localStorage.setItem('local_collections_updated_at', String(T1));
    localStorage.setItem('completed_bird_ids', JSON.stringify(['sparrow_id']));
    engine.state.localState.birds = new Set(['sparrow_id']);

    // Recieved a real-time onSnapshot from client, but with outdated Cloud properties (T1 - 5000)
    const staleCloudSnapshot = {
      uid: 'user_777',
      completedBirdNames: ['stale_bird_id'],
      updatedAt: T1 - 5000,
    };

    engine.handlePassiveSnapshotUpdate(staleCloudSnapshot);

    // Local edits remain bird 'sparrow_id', and not overwritten by stale cloud
    expect(engine.state.localState.birds.has('sparrow_id')).toBe(true);
    expect(engine.state.localState.birds.has('stale_bird_id')).toBe(false);
  });

  // 5. onSnapshot 수신 → 데이터 반영 확인
  it('Scenario 5: Automatically adopts remote onSnapshot updates when local data is fully integrated', async () => {
    engine.state.user = { uid: 'user_888', email: 'passive@example.com' };
    engine.state.isInitialSyncDone = true;

    // Local collectionsUpdatedAt is older, or fresh
    const localTime = Date.now() - 5000;
    localStorage.setItem('local_collections_updated_at', String(localTime));
    localStorage.setItem('completed_bird_ids', JSON.stringify(['robin_id']));
    engine.state.localState.birds = new Set(['robin_id']);

    // Remote client writes newer changes at localTime + 10000
    const remoteUpdatesSnapshot = {
      uid: 'user_888',
      completedBirdNames: ['robin_id', 'canary_id'],
      updatedAt: localTime + 10000,
    };

    engine.handlePassiveSnapshotUpdate(remoteUpdatesSnapshot);

    // Passive receiver adopts changes successfully without blocking or user action
    expect(engine.state.localState.birds.has('canary_id')).toBe(true);
    expect(engine.state.localState.birds.has('robin_id')).toBe(true);
    expect(localStorage.getItem('completed_bird_ids')).toContain('canary_id');
  });
});
