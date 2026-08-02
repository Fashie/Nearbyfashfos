# NEARBY DESIGN SYSTEM

Every future redesign of the Nearby application **MUST** follow this document strictly.

---

## 🎨 Nearby Design Philosophy

Nearby is not just another social media platform. It is a **Human Connection Platform**. Every visual decision, interaction pattern, and architectural layout must reinforce this identity.

### Core Experience Values
- ✔ **Calm**
- ✔ **Premium**
- ✔ **Warm**
- ✔ **Friendly**
- ✔ **Luxurious**
- ✔ **Modern**
- ✔ **Emotional**
- ✔ **Trustworthy**
- ✔ **Apple-Level Simplicity**

### What to Avoid
- ❌ **Cluttered UI**
- ❌ **Color overload (busy or colorful everywhere)**
- ❌ **Boxy or rigid borders**
- ❌ **Cheap, high-contrast, or raw neon gradients**
- ❌ **AI-generated look and feel**

---

## 🎨 Color Palette

Instead of using random colors, Nearby must maintain a strict, cohesive identity. Always avoid harsh pure black (`#000000`) or pure white (`#ffffff`).

| Palette Role | Theme Usage | HEX / Tailwind Equivalent |
| :--- | :--- | :--- |
| **Primary** | **Deep Emerald** | `#0f5132` / `emerald-900` |
| **Secondary** | **Ocean Blue** | `#0d6efd` / `blue-600` |
| **Accent** | **Warm Coral** | `#f06c50` / `coral-500` |
| **Light BG** | **Soft White** | `#fafaf9` / `stone-50` |
| **Dark BG** | **Matte Black** | `#121212` / `zinc-900` |

---

## 📐 Layout & Radius Rules

To keep the application feeling organic, friendly, and smooth, everything must have generous rounding:

- 🎴 **Cards**: `20px` (`rounded-[20px]`)
- 🔘 **Buttons**: `18px` (`rounded-[18px]`)
- 📥 **Inputs**: `18px` (`rounded-[18px]`)
- 📑 **Bottom Sheets**: `28px` (`rounded-t-[28px]`)
- 👤 **Images / Avatars**: **Perfect circles** (`rounded-full`)

---

## 🌗 Shadows & Depth

Use **only soft, atmospheric shadows** to mimic physical material stacking, similar to modern Apple OS surfaces.
- Avoid legacy, harsh, dark Android-2017 shadows.
- Prefer wide-ambient blur values over dark offset spreads.

---

## 🏃 Animations & Micro-Interactions

Every single state change, modal entry, and interactive hover state must run a smooth, responsive transition:
- **Duration**: `200ms`
- **Easing**: `ease-in-out` / standard cubic-bezier
- **Feel**: Never abrupt or jarring. Micro-animations should guide human eyes rather than distract them.

---

## 🔤 Typography

Nearby uses **Inter** only. 
- Pair standard sans-serif with monospace accents only where structural data requires visual distinction.
- Avoid complex display font families to preserve the ultra-clean, minimalist presentation.

---

## 🧭 Navigation

- **Floating Bottom Navigation Bar**:
  - The navigation layout must be fully floating off the bottom of the viewport screen.
  - Avoid attaching the navigation directly to the viewport edge.
  - Designed to match premium, modern fintech/creative web application structures.
