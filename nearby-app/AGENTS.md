# Application Architecture and Development Guidelines

This document contains critical project-specific rules, design patterns, and constraints. Any AI Agent modifying this codebase **MUST** read, understand, and strictly adhere to these directives to prevent regression and preserve user session data.

---

## 🔐 1. Authentication and Onboarding Flow

To ensure an experience identical to mainstream messaging apps (such as WhatsApp, Instagram, and Facebook), the authentication flow has been strictly engineered with the following state boundaries:

### A. Core Navigation Flags
- **`showLandingMode`**: Controls the welcome/login/signup choice screen. It must default to `false` if the device has a previously saved account on disk (`hasSavedAccountOnDisk`), and `true` only for completely fresh visitors.
- **`showOnboarding`**: Controls whether the registration, name entry, bio, interests, and profile photo selection screen is displayed.
  - **Returning Users**: If a user document exists in Firestore under `/users/{uid}` and has a populated `name` field, `showOnboarding` **MUST** be set to `false`. They must bypass all registration screens and land directly on the Home dashboard.
  - **New Users**: Only show the onboarding steps when the Firebase UID does not have an existing user document in Firestore.
- **Auto-Login Restore**: To bypass sandboxed iframe state restrictions and cookie limits on mobile, the system includes an automatic fallback that attempts a silent restoration of the session using credentials securely cached on-disk. Do not alter `autoLoginAttemptedRef` or the `onAuthStateChanged` hook's auto-restore behavior.

---

## 💾 2. Session and Data Persistence

### A. Firestore Data Integration
All user settings, customized profiles, and historical records **MUST** be fetched from the database on startup and kept in sync:
- **Profile Parameters**: Name, Username, Display Name, Bio, Profile Picture, Cover Photo, Gender, Age, and Interests.
- **Chat Histories**: Direct messages (including voice notes, images, and videos), group logs, and read receipts.
- **User Content**: Posts, Stories (lasting 24 hours), Highlights, Saved Items, Likes, Comments, Friends list, Followers, and system Notifications.

### B. Prevention of State Overwriting
- Under no circumstances should an automatic signup create a blank user document or overwrite an existing profile in Firestore.
- Always verify if `/users/{uid}` exists with actual content before deciding to trigger onboarding or setting initial default fields.

---

## 🎨 3. UI/UX and Component Safety

### A. No Unrequested UI Redesigns
- Unless explicitly requested by the user, **DO NOT** modify the layout, styling, tab structure, typography, theme, or navigation of the app.
- Preserve the existing page components, including:
  - **Radar Map & Safe Meetups**
  - **Chats, Media uploads, and Status Stories**
  - **Social Feed (Posts, Comments, Likes)**
  - **Settings & Help panels**

### B. High-Priority System Banners
Keep the system status banners integrated smoothly inside `src/App.tsx`:
- **Iframe Sandbox Warning Banner**: Alerts users when mobile browsers limit session storage within sandbox previews, providing a quick-link button to open the application in a direct tab.
- **Firestore Quota Exceeded Banner**: Notifies users in safe offline-fallback local mode if the shared daily Firestore limit of 50,000 actions is reached.
- **Google Maps Billing Error Banner**: Informs users if map location services require payment setup.

---

## 🛠️ 4. Code Quality & Integration Rules

- **Types & Enums**: Maintain strict TypeScript interfaces in `src/App.tsx`. Do not use `const enum`. Put all import lines at the top of files.
- **Linter Compliance**: Run `npm run lint` and `npm run build` after modifications to ensure type safety compiles correctly.
