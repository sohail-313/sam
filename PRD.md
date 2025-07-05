# FYI App - Product Requirements Document (PRD)

## 1. Product Overview

**App Name**: FYI  
**Category**: Social Messaging / Status Sharing  
**Platform**: Mobile (React Native/Expo)  
**Target Audience**: Personal contacts network  

### Vision Statement
A WhatsApp Status-like platform where users can share short FYI messages with their contacts, organized through private contact groups.

---

## 2. Core Features

### 2.1 User Management
- **Contact Sync**: Automatically read and sync phone contacts
- **Mutual Contact Detection**: Only mutual contacts can see each other's FYIs
- **Profile Management**: Name, phone number, profile picture

### 2.2 FYI Messages
- **Message Creation**: Short text messages (max 80 characters)
- **Visibility Options**: 
  - Send to "All" (all mutual contacts)
  - Send to specific private group
- **Message Lifecycle**: Auto-expire after 24 hours (future feature)

### 2.3 Private Groups (Contact Folders)
- **Group Creation**: User creates private contact folders (Family, Friends, Work, etc.)
- **Group Management**: Add/remove contacts from groups
- **Group Privacy**: Groups are private to the creator only
- **Group Filtering**: Use groups to filter and organize contact interactions

### 2.4 Social Features
- **Emoji Reactions**: React to FYIs with predefined emojis (👍, 😂, ❤️, 😮, 😢)
- **Read Receipts**: See who has viewed your FYI
- **Status Indicators**: Unread message indicators

---

## 3. User Experience Flow

### 3.1 Home Screen Structure
```
FYI (3) [Header with unread count]
├── My FYI Section [User's own latest FYI]
├── Tabs:
    ├── All [All FYIs from mutual contacts]
    ├── Family [FYIs from Family group members] *
    ├── Friends [FYIs from Friends group members] *
    └── Work [FYIs from Work group members] *

* Group tabs only visible to group owner
```

### 3.2 FYI Visibility Logic

**For Sender:**
- FYI sent to "All" → appears in "All" tab for receivers
- FYI sent to "Family" → appears in sender's "Family" tab + receivers' "All" tab

**For Receivers:**
- See FYIs in "All" tab from all mutual contacts
- See FYIs in own group tabs only if they're the group owner
- Group tabs show FYIs from group members (regardless of sender's target)

### 3.3 Mutual Contact Rules
- User A and User B can see each other's FYIs only if:
  - A has B's phone number in contacts AND
  - B has A's phone number in contacts

---

## 4. Data Architecture

### 4.1 Collections Structure
```
/users/{userId}
├── Basic user info + contacts array + mutualContacts array

/groups/{groupId}
├── Private groups owned by users

/fyis/{fyiId}
├── FYI messages
├── /seenBy/{userId} [Subcollection]
└── /reactions/{reactionId} [Subcollection]
```

### 4.2 Key Data Relationships
- **Mutual Contacts**: Denormalized in user document for performance
- **Group Membership**: Groups store member arrays
- **FYI Targeting**: FYIs reference target groups but don't restrict visibility
- **Engagement**: Reactions and views stored as subcollections

---

## 5. Technical Requirements

### 5.1 Core Technologies
- **Frontend**: React Native + Expo
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: React Navigation (Material Top Tabs)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth (future)

### 5.2 Performance Considerations
- **Contact Sync**: Background sync on app launch
- **FYI Loading**: Load recent messages first
- **Real-time Updates**: Firestore listeners for live message updates
- **Offline Support**: Cache mutual contacts and recent FYIs

---

## 6. User Scenarios

### Scenario 1: Basic Usage
1. Sarah opens FYI app
2. App syncs her contacts in background
3. She sees FYIs from mutual contacts in "All" tab
4. She creates family group with [Mom, Dad, Brother]
5. Now she has "All" and "Family" tabs
6. Family tab shows FYIs from family members only

### Scenario 2: Group Filtering
1. John sends FYI to his "Work" group
2. His work colleague Mike (mutual contact) sees John's FYI in "All" tab
3. Mike doesn't see any "Work" tab (not his group)
4. John sees his FYI in his own "Work" tab

### Scenario 3: Reactions & Engagement
1. Lisa posts "Graduation day! 🎓" to All
2. Friends react with emojis
3. Lisa sees reaction count and who reacted
4. Friends see read receipts showing who viewed the FYI

---

## 7. Future Enhancements

### Phase 2 Features
- **Media Support**: Photos in FYIs
- **Message Expiry**: 24-hour auto-delete
- **Push Notifications**: New FYI alerts
- **Stories Format**: Instagram-like story viewer

### Phase 3 Features
- **Reply to FYIs**: Direct message responses
- **FYI Templates**: Quick message templates
- **Advanced Analytics**: View insights for own FYIs
- **Dark Mode**: Theme customization

---

## 8. Success Metrics

### Engagement Metrics
- Daily Active Users (DAU)
- FYIs posted per user per day
- Reaction rate on FYIs
- Contact sync completion rate

### Retention Metrics
- Day 1, 7, 30 retention rates
- Session frequency and duration
- Feature adoption rates (groups, reactions)

---

This PRD captures your FYI app as a **contact-centric social platform** that combines WhatsApp Status functionality with private contact organization. The key differentiator is the private group system that acts as contact filters rather than traditional group messaging.

**Ready to start Step 1 of implementation?**