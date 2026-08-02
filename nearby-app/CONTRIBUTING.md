# Contributing to Nearby

Welcome to the Nearby contributor guide. To ensure that the codebase remains clean, highly decoupled, and easily maintainable, all contributors must strictly adhere to the following coding conventions, structural boundaries, and development workflows.

---

## 🛠️ File Organization & Feature Boundaries

Nearby uses a **Feature-Based Architecture**. All new features or logic must be placed inside modular directories under `/src/features/` rather than creating sprawling, monolithic components or mixed folders.

### 1. Folder Conventions
Each feature directory must contain the following standardized folder structure:
- `components/` — Self-contained visual sub-views and layouts.
- `hooks/` — Custom hooks controlling states, listeners, and queries specific to this feature.
- `services/` — Database access wrappers or state-mutating actions (no direct database queries in components).
- `types/` — Type files detailing local state models or response structures.
- `utils/` — Non-reactive helper functions specific to the feature.

### 2. Isolation Rules
- **No Cross-Feature Direct Imports**: A component inside `features/chat/components/` must never import a hook or helper directly from `features/radar/hooks/`.
- **Decoupled Communication**: If features need to communicate, they must do so via shared React context providers, general utilities, or global services under `/src/services/` or types defined in `/src/types/`.

---

## 📐 Coding Conventions & Naming

Write clean, type-safe, and self-documenting TypeScript:

### 1. Naming Rules
- **React Components**: Use PascalCase (e.g., `PremiumChatRoom.tsx`, `LandingScreen.tsx`).
- **Hooks**: Prefix with `use` and use camelCase (e.g., `useRadar.ts`, `useAuth.ts`).
- **Services/Utils**: Use camelCase (e.g., `chatService.ts`, `imageCompressor.ts`).
- **Directories**: Use lowercase or camelCase (e.g., `safeMeetups/`, `authentication/`).

### 2. TypeScript & Type Safety
- **Avoid `any`**: Ensure props, state, and callbacks are explicitly typed.
- **Top-Level Imports**: Put all `import` statements at the very top of the file. Use named imports instead of wildcards or object destructuring where possible.
- **No `const enum`**: Always declare standard `enum` types to ensure runtime reliability across build configurations.

### 3. Styling & Negative Space
- **Tailwind Only**: Write standard, utility-based Tailwind CSS classes. Do not write custom `.css` stylesheets or inline `style={...}` attributes.
- **Aesthetic Densities**: Ensure responsive padding and margins match the project's pristine light-slate style guidelines. Utilize generous negative space rather than cluttering margins with mock telemetry, system coordinates, or port indicators.

---

## 🧪 Testing and Verification Expectations

Before pushing any changes or requesting a deploy, you must verify the code passes the absolute quality gates:

1. **Linter Validation**: Run the TypeScript compile-check to capture type mismatch or syntax warnings early:
   ```bash
   npm run lint
   ```
2. **Build Success**: Ensure that the application bundles correctly for production:
   ```bash
   npm run build
   ```
3. **Smoke Tests & Verification**:
   - Verify that the app's initial onboarding and restoration flows function seamlessly.
   - Run a clean build and verify that all lazily-loaded tabs resolve correctly without white-screen or missing chunk issues.

---

## 🚀 How to Make Future Changes

When tasked with implementing a new feature or solving an issue:
1. **Analyze Dependencies**: Confirm if a similar hook, helper, or component already exists in `src/shared/` or `src/utils/` to avoid duplication.
2. **Modularize First**: Avoid dumping multiple visual layouts or heavy handlers into a single file. Move distinct segments into clean sub-components or custom hooks.
3. **Verify Compliance**: Run the linter and compiler before committing to prevent regression.
