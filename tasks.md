

---

## ⚙️ TECH STACK YOU’RE USING

* **Frontend**: React Native + Expo + NativeWind + React Navigation
* **Backend**: Firebase (Firestore + Auth + Functions + Storage if needed)
* **Realtime**: Firestore listeners
* **Push**: Expo Notifications (client) + Firebase Functions (server trigger)

---

## 🚀 PHASE 1: BOOTSTRAP (1 Day)

✅ **Goals**: Initialize repo, app structure, Firebase setup.

### Tasks:

* [ ] Setup React Native with Expo
* [ ] Install: NativeWind, React Navigation, Firebase SDK
* [ ] Initialize Firebase project (Firestore + Auth)
* [ ] Connect app to Firebase
* [ ] Setup folder structure (`screens/`, `components/`, `services/`)

---

## ⚡ PHASE 2: CORE FEATURES (3–5 Days)

✅ **Goal**: Contact Sync + FYI posting & listing with real data.

### 📱 Frontend

* [ ] **Contact Permission & Sync**
  * Ask for permission (react-native-contacts)
  * Extract phone numbers, store locally

* [ ] **Create FYI Screen**
  * Text input (max 80 chars)
  * List of groups + “All” option
  * Submit button → store in Firestore

* [ ] **Home Screen with Tabs**
  * Tabs: All + Group Tabs (from user’s created groups)
  * Display FYIs (real-time listener)
  * Show only **1 active FYI** per sender
  * Show “My FYI” at top (your own current FYI)

* [ ] **Empty state UI + Error handling** (e.g., no internet)
  
### 🔥 Backend (Firebase)

* [ ] Firestore Schema:
  * `/users/{userId}`
  * `/groups/{groupId}`
  * `/fyis/{fyiId}` (+ `seenBy/`, `reactions/` later)

* [ ] **Mutual Contact Logic**
  * When syncing contacts → compare with registered users
  * Update `mutualContacts[]` in `/users/{userId}`

* [ ] **Handle only one FYI per user**:
  * On new FYI post, delete/overwrite previous one (same senderId)

---

## 🔁 PHASE 3: FYI VIEWING + REACTIONS (2–3 Days)

### Frontend:

* [ ] On tap → Show emoji reaction row (❤️ 😂 👍 😮 😢)
* [ ] Send emoji → write to `/reactions/`
* [ ] Show number of views & reactions (if user is sender)

### Backend:

* [ ] Store `seenBy[]` when someone views a FYI
* [ ] Push notification trigger via Firebase Function

  * Triggered on new FYI created
  * Use `expo-server-sdk` to send to mutuals

---

## 📡 PHASE 4: PUSH NOTIFICATIONS (1–2 Days)

* [ ] Setup Expo push tokens per user
* [ ] Save to `/users/{userId}/pushToken`
* [ ] On FYI post, trigger Firebase Cloud Function
* [ ] Function fetches mutuals, sends push individually

---

## 📴 PHASE 5: OFFLINE HANDLING (0.5 Day)

* [ ] Show “No Internet” toast on submit
* [ ] Disable post button without net
* [ ] Firestore caching will help for viewing FYIs

---

## 🧪 PHASE 6: POLISH & TEST (1–2 Days)

* [ ] Verify group logic, tab filters
* [ ] Check edge cases (no mutuals, empty groups, contact denied)
* [ ] Final cleanup, loading spinners, empty states
* [ ] Deploy rules (Firestore security)

---

## 🧱 Bonus Additions (Optional for MVP)

* [ ] Auto-expiry after 24h (use Firebase Scheduled Function)
* [ ] Profile screen (name, pic)
* [ ] App icon / splash screen (polish)

---

## 📅 Estimated Timeline (if focused daily):

| Phase              | Days                           |
| ------------------ | ------------------------------ |
| Bootstrap          | 1                              |
| Core Features      | 4                              |
| Reactions + Read   | 2                              |
| Push Notifications | 2                              |
| Offline + Testing  | 1                              |
| **Total**          | **10 Days** (max 2 weeks solo) |

---

## 🔥 What You Should Do **Today**

* ✅ Setup project in Expo + Firebase
* ✅ Build contact sync logic
* ✅ Build create FYI screen + post to Firestore

Once that’s done, let me know. I’ll walk you through **mutual contact logic** and **group-based tab filtering** next.

You're doing 🔥 Sohail. Just ship and iterate.
