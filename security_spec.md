# Security Specification & Threat Model (TDD)

## 1. Data Invariants
- A user's crop/garden document must reside strictly under `users/{userId}` where `{userId}` matches the authenticated user's `request.auth.uid`.
- Users must only read and write their own documents (no cross-user profile modification or timer snooping).
- The `updatedAt` field must be strictly validated as equal to the server timestamp `request.time`.
- Input fields must be type-safe (e.g. `harvestCount` must be integer, `soundEnabled` must be boolean, `slots` must be list, and `slots` array length must be exactly 6 or empty).
- Email verification checks must be enforced if needed, though simple Google Authentication is the baseline.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads attempt to break access rules, escalate privileges, or corrupt state:

1. **Spoofed Ownership Write**: Write a document to `users/spy_uid` where `uid` in payload is `spy_uid` but auth UID is `victim_uid`.
2. **PII Blanket Scrape**: Read all documents inside `users` collection without user-scoping.
3. **Malicious Admin Escalation**: Attempt to write field `role: "admin"` inside user profile to bypass restrictions.
4. **Invalid Crop Duration Type**: Write a slot duration of "one-million-seconds" as a string instead of representing it as an integer.
5. **Array Over-Sizing Attack**: Writing a `slots` array containing 500 fictitious plants to execute a buffer/memory-overflow or crash browsers on download (exceed stability limits).
6. **Time-Travel Attack (Past Creation)**: Set `updatedAt` to a historical or future timestamp from the client client to bypass timing integrity.
7. **Negative Stats Attack**: Set `harvestCount` to a negative integer `-999`.
8. **Malicious Script Injection**: Injecting raw HTML or Javascript tags (e.g., `<script>alert('hack')</script>`) as the `cropName`.
9. **No-credential Read**: Trying to fetch any user's slots state without a valid Firebase Auth session.
10. **ID Poisoning Attack**: Attempting to target and write to a document with a 2MB non-alphanumeric alphanumeric key.
11. **Immutability Breach**: Create a user garden state and then change the immutable matching `uid` to a different string on update.
12. **Tamper with Notification Checkboxes**: Forcing another user's `isNotified` states to `true` or `false` through raw Firestore writes.

---

## 3. Test Runner Definition (`firestore.rules.test.ts`)
```typescript
// Test runner conceptual outline for standard Jest/Firebase emulator suites
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'pigtownprod',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

test('forbids unauthenticated access', async () => {
  const context = testEnv.unauthenticatedContext();
  const db = context.firestore();
  await expect(getDoc(doc(db, 'users/user_123'))).rejects.toThrow();
});

test('allows read and write strictly to own owner profile', async () => {
  const context = testEnv.authenticatedContext('user_123');
  const db = context.firestore();
  await expect(setDoc(doc(db, 'users/user_123'), {
    uid: 'user_123',
    email: 'test@gmail.com',
    harvestCount: 0,
    slots: [],
    updatedAt: new Date()
  })).resolves.not.toThrow();
  
  await expect(setDoc(doc(db, 'users/user_abc'), {
    uid: 'user_abc',
    email: 'test2@gmail.com',
    harvestCount: 0,
    slots: [],
    updatedAt: new Date()
  })).rejects.toThrow();
});
```
