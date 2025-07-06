
---

# ✅ PHASE 0:

* [x] ✅ **Design ready** (Figma, UI screens)
* [x] ✅ **Login via Msg91 OTP** (already working)

---

# 🚀 PHASE 1: 🔐 Auth & User Initialization

### 1.1 Msg91 Login ✅

* Phone input → OTP → Verify → Navigate to app

### 1.2 Create User in Firestore

* On first login:

  * [ ] Create `/users/{userId}` with:

    ```json
    {
      "phone": "+91xxxxxxxxxx",
      "name": null,
      "profilePicture": null,
      "contacts": [],
      "mutualContacts": []
    }
    ```

---

# 🔗 PHASE 2: 📞 Contact Sync & Mutual Detection

### 2.1 Read Phone Contacts

* [ ] Ask permission
* [ ] Sync contacts: name + phone number

### 2.2 Upload to Firestore

* [ ] Store in `/users/{userId}/contacts[]`

### 2.3 Mutual Detection

* [ ] For each contact:

  * Check if that number also has current user saved
  * If yes → add to `mutualContacts[]`

---

# 🧾 PHASE 3: FYI Creation

### 3.1 Create FYI Screen

* [ ] Input: 80-char max
* [ ] Dropdown: "All" or select group
* [ ] "Post" button (disable if no net)

### 3.2 Firestore Write

* On post:

  * [ ] Save to `/fyis/{fyiId}`
  * Payload:

    ```json
    {
      "senderId": "+91xxxxxxxxxx",
      "text": "your message",
      "target": "All" or groupId,
      "timestamp": serverTimestamp()
    }
    ```

### 3.3 Replace Previous FYI

* [ ] Check if sender has old FYI → delete/overwrite

---

# 👥 PHASE 4: Group System (Contact Folders)

### 4.1 Group Management UI

* [ ] Add/Edit/Delete Group
* [ ] Add/remove contacts to group

### 4.2 Store in Firestore

* [ ] `/groups/{groupId}`:

```json
{
  "ownerId": "+91xxx",
  "groupName": "Family",
  "contactIds": ["+91...", "+91..."]
}
```

---

# 🏠 PHASE 5: Home Screen (Tabs UI)

### 5.1 Layout

* [ ] Top Header → Unread count (optional)
* [ ] Tabs:

  * All (mutuals' FYIs)
  * My Groups (user’s folders)

### 5.2 Data Loading

* [ ] Load FYIs in real-time (Firestore listeners)
* [ ] Filter by:

  * All → any mutual contact
  * Group → any contact inside group

---

# 📬 PHASE 6: Reactions + Views

### 6.1 Emoji Reaction

* [ ] Tap reaction → save to `/fyis/{fyiId}/reactions/{userId}`

### 6.2 Read Receipts

* [ ] When viewed → add to `/seenBy/{userId}`

---

# 🕛 PHASE 7: FYI Expiry (After 24 Hours)

### 7.1 Background Cleanup (basic version)

* [ ] Cloud function or local check → delete FYIs older than 24 hrs

---

# 📲 PHASE 8: Push Notifications

### 8.1 Integrate Firebase Cloud Messaging

* [ ] Register device token
* [ ] On new FYI:

  * Send push to all mutual contacts

---

# 🌐 PHASE 9: Offline Handling

### 9.1 Offline Reads

* [ ] Enable Firestore local caching

### 9.2 Offline Posting

* [ ] Disable post button if no net
  OR queue locally and sync later

---

# 🔐 PHASE 10: Security Rules (Post MVP)

* [ ] Restrict read/write only to:

  * Own user data
  * FYIs from mutual contacts
  * Groups owned by self

---

# 📦 FINAL CHECKLIST

* [ ] Full test on real device
* [ ] Deploy rules
* [ ] Clean dummy data
* [ ] Prepare basic privacy page (if needed for upload)
* [ ] APK build for Play Store or internal testing

---

### ✅ You're ready to launch.

If you're working in **2-hour blocks**, let me know your block and I’ll break that part down in detail with suggested tools, sample code, and exact API calls. Just say:

**"Start Block 1"** to begin.
Absolutely, Sohail. Here's your **complete, clear, and step-by-step task breakdown** to take FYI from **auth to full app launch** — solo-friendly and optimized for speed.

---

# ✅ PHASE 0: Pre-Setup (Done or Skip If Ready)

* [x] ✅ **Design ready** (Figma, UI screens)
* [x] ✅ **Login via Msg91 OTP** (already working)

---

# 🚀 PHASE 1: 🔐 Auth & User Initialization

### 1.1 Msg91 Login ✅

* Phone input → OTP → Verify → Navigate to app

### 1.2 Create User in Firestore

* On first login:

  * [ ] Create `/users/{userId}` with:

    ```json
    {
      "phone": "+91xxxxxxxxxx",
      "name": null,
      "profilePicture": null,
      "contacts": [],
      "mutualContacts": []
    }
    ```

---

# 🔗 PHASE 2: 📞 Contact Sync & Mutual Detection

### 2.1 Read Phone Contacts

* [ ] Ask permission
* [ ] Sync contacts: name + phone number

### 2.2 Upload to Firestore

* [ ] Store in `/users/{userId}/contacts[]`

### 2.3 Mutual Detection

* [ ] For each contact:

  * Check if that number also has current user saved
  * If yes → add to `mutualContacts[]`

---

# 🧾 PHASE 3: FYI Creation

### 3.1 Create FYI Screen

* [ ] Input: 80-char max
* [ ] Dropdown: "All" or select group
* [ ] "Post" button (disable if no net)

### 3.2 Firestore Write

* On post:

  * [ ] Save to `/fyis/{fyiId}`
  * Payload:

    ```json
    {
      "senderId": "+91xxxxxxxxxx",
      "text": "your message",
      "target": "All" or groupId,
      "timestamp": serverTimestamp()
    }
    ```

### 3.3 Replace Previous FYI

* [ ] Check if sender has old FYI → delete/overwrite

---

# 👥 PHASE 4: Group System (Contact Folders)

### 4.1 Group Management UI

* [ ] Add/Edit/Delete Group
* [ ] Add/remove contacts to group

### 4.2 Store in Firestore

* [ ] `/groups/{groupId}`:

```json
{
  "ownerId": "+91xxx",
  "groupName": "Family",
  "contactIds": ["+91...", "+91..."]
}
```

---

# 🏠 PHASE 5: Home Screen (Tabs UI)

### 5.1 Layout

* [ ] Top Header → Unread count (optional)
* [ ] Tabs:

  * All (mutuals' FYIs)
  * My Groups (user’s folders)

### 5.2 Data Loading

* [ ] Load FYIs in real-time (Firestore listeners)
* [ ] Filter by:

  * All → any mutual contact
  * Group → any contact inside group

---

# 📬 PHASE 6: Reactions + Views

### 6.1 Emoji Reaction

* [ ] Tap reaction → save to `/fyis/{fyiId}/reactions/{userId}`

### 6.2 Read Receipts

* [ ] When viewed → add to `/seenBy/{userId}`

---

# 🕛 PHASE 7: FYI Expiry (After 24 Hours)

### 7.1 Background Cleanup (basic version)

* [ ] Cloud function or local check → delete FYIs older than 24 hrs

---

# 📲 PHASE 8: Push Notifications

### 8.1 Integrate Firebase Cloud Messaging

* [ ] Register device token
* [ ] On new FYI:

  * Send push to all mutual contacts

---

# 🌐 PHASE 9: Offline Handling

### 9.1 Offline Reads

* [ ] Enable Firestore local caching

### 9.2 Offline Posting

* [ ] Disable post button if no net
  OR queue locally and sync later

---

# 🔐 PHASE 10: Security Rules (Post MVP)

* [ ] Restrict read/write only to:

  * Own user data
  * FYIs from mutual contacts
  * Groups owned by self

---

# 📦 FINAL CHECKLIST

* [ ] Full test on real device
* [ ] Deploy rules
* [ ] Clean dummy data
* [ ] Prepare basic privacy page (if needed for upload)
* [ ] APK build for Play Store or internal testing

---

### ✅ You're ready to launch.

