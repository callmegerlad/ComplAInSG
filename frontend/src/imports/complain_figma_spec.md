# ComplAIn — Figma Design Specification
### Complete Build Guide with HTML/CSS Reference Values

---

## HOW TO USE THIS DOCUMENT

Every measurement, color, font, and spacing value below maps directly to the accompanying `complain_reference.html` file. Open that file in a browser while building in Figma — it is your live source of truth. Every component has been tested at 390px width (iPhone 14/15 standard).

---

## 1. FOUNDATIONS

### 1.1 Color Tokens — Set Up as Figma Variables

Create a Variable Collection: **"ComplAIn Tokens"** with two modes: **Light** and **Dark**.

#### Light Mode
| Variable Name | Hex | CSS Class |
|---|---|---|
| `color/bg/primary` | `#F4F6FA` | `bg-background-light` |
| `color/bg/secondary` | `#EAECF2` | — |
| `color/surface/1` | `#FFFFFF` | `bg-white` |
| `color/surface/2` | `#EDF1F7` | — |
| `color/border/subtle` | `#D4D9E5` | `border-slate-200` |
| `color/border/strong` | `#B0BAD0` | — |
| `color/text/primary` | `#1B2A41` | `text-slate-900` |
| `color/text/secondary` | `#4A5B78` | `text-slate-500` |
| `color/text/disabled` | `#9AAABF` | `text-slate-400` |
| `color/accent/primary` | `#507DBC` | `text-[#507DBC]` / `bg-[#507DBC]` |
| `color/accent/hover` | `#3F6AA8` | `hover:bg-[#3F6AA8]` |
| `color/accent/subtle` | `#D8E4F4` | `bg-[#507DBC]/10` (approx) |
| `color/secondary` | `#E8A838` | `text-[#E8A838]` |
| `color/secondary/subtle` | `#FDF0D5` | — |
| `color/danger` | `#D93A3A` | `bg-[#D93A3A]` |
| `color/danger/subtle` | `#FDEAEA` | `bg-[#D93A3A]/10` |
| `color/success` | `#2EAD76` | `text-[#2EAD76]` |
| `color/success/subtle` | `#D4F3E7` | — |

#### Dark Mode (same variable names, different values)
| Variable Name | Hex |
|---|---|
| `color/bg/primary` | `#0E1621` |
| `color/bg/secondary` | `#131D2E` |
| `color/surface/1` | `#192334` |
| `color/surface/2` | `#1F2D40` |
| `color/border/subtle` | `#263549` |
| `color/border/strong` | `#3A516E` |
| `color/text/primary` | `#E8EDF5` |
| `color/text/secondary` | `#7E95B5` |
| `color/text/disabled` | `#3F5470` |
| `color/accent/primary` | `#507DBC` ← **unchanged** |
| `color/accent/hover` | `#6A95CE` |
| `color/accent/subtle` | `#1C3255` |
| `color/secondary` | `#E8A838` ← **unchanged** |
| `color/secondary/subtle` | `#3A2C0E` |
| `color/danger` | `#E05252` |
| `color/danger/subtle` | `#3B1616` |
| `color/success` | `#35C483` |
| `color/success/subtle` | `#0E3324` |

#### Category Colors (Fixed — never change between modes)
```
Fight/Assault:    #D93A3A
Harassment:       #9B59D0
Crime:            #C0392B
Transport Fault:  #E8A838
Medical Emerg:    #E05C2A
Fire/Hazard:      #E07A2A
```

---

### 1.2 Typography

Import both fonts from Google Fonts before building any text styles.

**Font 1:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — weights 400, 500, 600, 700, 400 Italic
**Font 2:** [DM Mono](https://fonts.google.com/specimen/DM+Mono) — weights 400, 500, 700

| Style Name | Font | Weight | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `text/logo` | DM Sans | Bold 700 | 18px | Auto | -0.5px | App wordmark |
| `text/display` | DM Sans | Bold 700 | 28px | 34px | -0.4px | Hero headlines |
| `text/screen-title` | DM Sans | Bold 700 | 20px | 28px | -0.3px | Section headers (matches OneService) |
| `text/card-title` | DM Sans | SemiBold 600 | 15px | 22px | 0 | Incident title |
| `text/body` | DM Sans | Regular 400 | 14px | 22px | 0 | Body text |
| `text/body-medium` | DM Sans | Medium 500 | 14px | 22px | 0 | Emphasized body |
| `text/button` | DM Sans | SemiBold 600 | 15px | Auto | 0.1px | Button labels |
| `text/category-badge` | DM Sans | Bold 700 | 10px | Auto | 0.8px (uppercase) | Category chips |
| `text/caption` | DM Sans | Regular 400 | 12px | 18px | 0.1px | Timestamps, meta |
| `text/ai-summary` | DM Sans | Italic 400 | 13px | 19px | 0 | AI-generated content |
| `text/code` | DM Mono | Regular 400 | 12px | 18px | 0.3px | Report IDs, codes |
| `text/severity` | DM Mono | Bold 700 | 22px | Auto | 0 | Severity scores |
| `text/timestamp` | DM Mono | Regular 400 | 10px | Auto | 0 | Short timestamps |

**Key Rule:** Any AI-generated text (summaries, suspect profiles, verified status) uses `text/ai-summary` — the italic style is a deliberate visual signal to users that this content is machine-generated.

---

### 1.3 Spacing (8pt Grid)

Set up as Figma spacing tokens:

| Token | Value | Usage |
|---|---|---|
| `space/1` | 4px | Inline icon-to-label gaps |
| `space/2` | 8px | Badge internal padding, icon container padding |
| `space/3` | 12px | Grid gap between category cards |
| `space/4` | 16px | Standard card padding, screen horizontal margin |
| `space/5` | 20px | Between list cards |
| `space/6` | 24px | Section content spacing |
| `space/8` | 32px | Between major sections |
| `space/12` | 48px | Large screen margins |

### 1.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius/sm` | 6px | Small badges, tags |
| `radius/md` | 8px | Inputs, icon containers |
| `radius/lg` | 12px | Cards, inner sheet elements |
| `radius/xl` | 16px | Bottom sheets (top corners only), bottom sheets |
| `radius/2xl` | 20px | Large modals |
| `radius/full` | 9999px | Pill buttons, category chips, badges |

### 1.5 Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow/card` | `X:0 Y:2 Blur:12 Spread:0 #1B2A41 8% opacity` | Cards (light mode only) |
| `shadow/record` | `X:0 Y:0 Blur:20 Spread:0 #D93A3A 45% opacity` | Record button glow |
| `shadow/primary-btn` | `X:0 Y:4 Blur:12 Spread:0 #507DBC 30% opacity` | Primary action buttons |

---

## 2. COMPONENT LIBRARY

Build these as master components with variants before building screens.

---

### 2.1 Top Bar

**Frame:** W: fill container, H: 72px. Auto Layout vertical. bg `color/surface/1`.
**Bottom border:** 1px, `color/border/subtle`. No drop shadow.
**Backdrop blur:** 12px (set in effects).

**Row 1 — Logo + Actions:**
- Padding: 16px left, 16px right, 16px top, 8px bottom
- Layout: Horizontal auto layout, space-between, align center

**Logo (Left):**
- Horizontal auto layout, gap: 8px, align center
- Icon mark: 32×32px rectangle, bg `#507DBC`, radius 8px, contains `crisis_alert` Material Symbol white 18px
- Wordmark: text frame "Compl" `#1B2A41`/dark`#E8EDF5` + "AI" `#507DBC` + "n" `#1B2A41`/dark`#E8EDF5`. Font: DM Sans Bold 18px. **To achieve this in Figma: use three separate text layers in a horizontal auto layout frame with 0px gap.**

**Actions (Right):**
- Horizontal auto layout, gap: 8px, align center
- Notification button: 40×40px circle, bg `color/surface/2`, icon `notifications` 20px `color/text/secondary`. Red dot: 8px circle, `#D93A3A`, absolute position top-right (top: 8px, right: 8px).
- Avatar: 36×36px circle, bg `color/accent/subtle`, `color/accent/primary` initials, DM Sans Bold 13px. Border: 2px `#507DBC` 20% opacity.

**Row 2 — Search Bar:**
- Padding: 16px left, 16px right, 0 top, 12px bottom
- Search input container: W: fill, H: 48px, radius: 12px (radius/xl). Border: 1px `#507DBC` 30% opacity. **Focus state border:** 1px `#507DBC` (full opacity).
- Inner: horizontal auto layout. Left icon: `search` 20px slate-400, padding-left 16px. Input text placeholder: "Search incidents or locations", DM Sans Regular 14px `color/text/disabled`. bg: `color/surface/1`.

**Variants:** `has-unread-notification = true/false`

---

### 2.2 Alert Banner

**Frame:** W: fill, H: 52px. bg `#D93A3A` (no dark mode shift — always red).
**Layout:** Horizontal auto layout, padding 16px horizontal, 14px vertical, space-between.

**Left group:** Horizontal auto layout, gap 8px, align center.
- Icon: `warning` Material Symbol, white, 18px
- Text: "Fight reported · 80m away" DM Sans SemiBold 13px white

**Right:** "View" + `chevron_right` icon — DM Sans SemiBold 12px, white 80% opacity.

**Progress bar (below banner):**
- Separate frame: W: fill, H: 2px, bg white 20% opacity
- Inner fill bar: bg white 40% opacity — in prototype: shrinks from 100%→0% width over 8s on smart animate

**Variants:** `severity = high/medium/low`, `type = fight/transport/medical/etc`

---

### 2.3 Category Card

This is the primary reporting card. Matches OneService category grid cells exactly.

**Frame:** W: fill (fits into 2-col grid), radius: 12px (radius/lg).
- Border: 1px `color/border/subtle`
- Background: `color/surface/1`
- Shadow: `shadow/card`
- Padding: 16px all sides
- Auto Layout: Vertical, gap: 12px

**Icon Container:**
- Size: auto (padding 8px all sides), radius: 8px (radius/md)
- Background: `[category-color]` at 10% opacity
- Icon: Material Symbol 24px in `[category-color]`

**Label:**
- DM Sans Bold 14px `color/text/primary`

**Full-Width Variant (col-span-2):**
- Auto layout switches to **Horizontal**, gap 12px, align center
- Same icon container + label side by side

**States:**
- Default: as above
- Pressed/Active: scale 0.95, icon container bg becomes full `[category-color]`, icon becomes white

**Variants:** `category = fight | harassment | crime | transport | medical | fire`, `width = half | full`

---

### 2.4 Incident Card

Directly mirrors the OneService "Recent Reports" card structure.

**Frame:** W: fill, radius: 12px, overflow hidden.
- Border: 1px `color/border/subtle`
- **Left border accent:** 4px `[category-color]` (use a 4px-wide rectangle aligned to left edge, full height, fill = category color — clip with parent frame)
- Background: `color/surface/1`
- Shadow: `shadow/card`

**Inner layout:** Horizontal auto layout, padding 16px, gap 16px, align start.

**Thumbnail (Left):**
- 80×80px, radius 8px, bg `color/surface/2`, flex-shrink: 0 (fixed size)
- Contains category icon 32px in `[category-color]`, centered

**Content Column (Right):** Vertical auto layout, gap 6px, fill width.

**Row 1 — Badges:**
- Horizontal auto layout, gap 8px, align center, wrap enabled
- **Category badge:** Pill, bg `[category-color]` 10% opacity, text `[category-color]`, DM Sans Bold 10px UPPERCASE tracking 0.8px, padding 2px 8px, radius 9999px
- **Severity badge:** Pill, border 1px `[category-color]`, text `[category-color]`, DM Mono Bold 10px, padding 2px 8px, radius 9999px
- **Distance chip:** Pushed to right with spacer. DM Sans Medium 10px `color/text/disabled`

**Row 2 — Title:** DM Sans SemiBold 15px `color/text/primary`. Max 2 lines, truncate.

**Row 3 — AI Summary:** DM Sans Italic 13px `color/text/secondary`. Max 2 lines. **Always italic.**

**Row 4 — Footer:** Horizontal, space-between.
- Left: "● 4 responding" — DM Sans Medium 11px `#2EAD76` (success color)
- Right: timestamp — DM Mono Regular 10px `color/text/disabled`

**Variants:** `category = fight|harassment|crime|transport|medical|fire`, `severity = high|medium|low`

---

### 2.5 Location Card (Map Preview)

Mirrors OneService's map card exactly.

**Frame:** W: fill, radius 12px, overflow hidden, border 1px `color/border/subtle`, shadow `shadow/card`.

**Map Preview Area:**
- H: 128px, W: fill, bg `color/accent/subtle` (light) / `#1C3255` (dark)
- Contains: location_on icon 32px `#507DBC` centered + "Live Map" DM Sans SemiBold 12px `#507DBC` below
- **For Figma:** Use a solid fill rectangle as placeholder; note in spec to replace with Mapbox embed in development.

**Bottom Row:**
- H: 56px, padding 16px, horizontal auto layout, space-between, align center
- Left: Vertical stack — "Current Location" 12px `color/text/secondary` + location name DM Sans Bold 14px `color/text/primary`
- Right: "View Map" button — bg `#507DBC`, text white DM Sans Bold 12px, padding 8px 16px, radius 8px

---

### 2.6 Bottom Nav Bar

**Frame:** W: fill, H: 96px (64px nav + 32px safe area bottom padding).
- Background: `color/surface/1` at 95% opacity
- Backdrop blur: 12px
- Top border: 1px `color/border/subtle`
- Padding: 8px top, 24px bottom (safe area), 16px horizontal

**Inner layout:** Horizontal auto layout, space-between or space-evenly, align end.

**Tab Item (Inactive):**
- Vertical auto layout, gap 4px, align center
- Icon: Material Symbol 24px, `color/text/disabled`
- Label: DM Sans Medium 10px `color/text/disabled`, tracking tight

**Tab Item (Active):**
- Icon: Material Symbol 24px, `#507DBC`, **FILL=1** (in Figma: use the filled icon variant from Material Symbols)
- Label: DM Sans Bold 10px `#507DBC`

**Record Button (Center):**
- Size: 56×56px, circle (radius 9999px)
- Background: `#D93A3A`
- Icon: `videocam` Material Symbol, white, 30px, centered
- Effect: Drop shadow `shadow/record` (0 0 20px rgba(217,58,58,0.45))
- Position: -32px from baseline (use negative top margin / vertical offset)
- **In Figma:** Set the button frame to `position: absolute`, Y offset -32px relative to nav bar top, centered horizontally
- Label below: "Record" DM Sans Medium 10px slate-400, sits at normal baseline

**Tabs (left to right):**
1. Home — `home` icon — label "Home"
2. Feed — `list` icon — label "Feed"
3. Record — `videocam` RED CIRCLE — label "Record"
4. Map — `map` icon — label "Map"
5. Profile — `person` icon — label "Profile"

**Variants:** `active-tab = home | feed | record | map | profile`

---

### 2.7 Section Header

**Frame:** W: fill, H: auto. Padding 24px top 12px bottom 16px horizontal.
**Layout:** Horizontal, space-between, align center.
- Left: DM Sans Bold 20px `color/text/primary` — e.g. "Report an Incident"
- Right: "View all" link — DM Sans SemiBold 14px `#507DBC`

---

## 3. SCREENS

Frame size for all screens: **W: 390px, H: 844px** (iPhone 14 standard).
Apply variable mode at frame level (not component) so Light/Dark swap works globally.

---

### 3.1 Screen: Home (Default Tab)

**Stack order (top to bottom):**

1. **Top Bar component** (sticky, z-index 10) — has-unread-notification: true
2. **Alert Banner component** (conditional, shown when nearby incident active) — bg #D93A3A, full width
3. **Progress bar** (2px below banner)
4. **Scrollable content area** (flex-1, pb 96px for nav bar clearance):
   - **Section Header** — "Report an Incident" + "View all"
   - **Category Grid** — 2 columns, 12px gap, 16px horizontal padding:
     - Row 1: Fight/Assault (half) + Harassment (half)
     - Row 2: Crime (half) + Transport Fault (half)
     - Row 3: Medical Emergency (full-width)
     - Row 4: Fire / Hazard (full-width)
   - **Section Header** — "Live Nearby" (no "View all")
   - **Incident Card** — Fight, HIGH severity (with left red border stripe)
   - **Incident Card** — Transport, MEDIUM severity (with left amber border stripe)
   - **Location Card** — map preview with "View Map" CTA
5. **Bottom Nav Bar** (fixed, z-index 20) — active-tab: home

**Spacing:**
- Between section header bottom and first grid card: 0 (padding handled by section header)
- Between category grid and next section header: 32px top padding on section header
- Between incident cards: 12px gap
- Last card bottom to nav bar: 24px + nav height

---

### 3.2 Screen: Feed (Tab 2)

**Stack:**
1. Top Bar
2. Feed Header: "Live Feed" DM Sans Bold 20px + sort icon `sliders_horizontal` 20px `#507DBC` (right)
3. Scrollable feed list, pb 96px:
   - **Sticky section divider:** "HAPPENING NOW" — DM Sans SemiBold 11px UPPERCASE tracking 1px `#507DBC`, 12px vertical padding, 16px horizontal. Position: sticky under header.
   - **Incident Cards** (full width, 16px horizontal margin, 12px gap)
   - **Sticky section divider:** "LAST HOUR" — same style, `color/text/secondary` color
   - More Incident Cards
   - **Sticky section divider:** "EARLIER TODAY"
   - More cards
4. Bottom Nav Bar — active-tab: feed

**Empty State (no incidents):**
- Centered content in scrollable area
- Illustration placeholder: 120px circle, `color/accent/subtle` bg, `location_off` icon 48px `#507DBC`
- "All clear nearby." DM Sans SemiBold 18px `color/text/primary`, mt 16px
- "You'll be alerted the moment something is reported in your area." DM Sans Regular 14px `color/text/secondary`, mt 8px, max-width 260px, text-center

---

### 3.3 Screen: Record Flow — Step 1 (Category Selection Sheet)

This appears as a bottom sheet overlaid on the Home or Feed screen.

**Overlay:** Full screen dim layer — bg `#0E1621` 60% opacity behind sheet.

**Sheet frame:** W: 390px, H: 520px (60% of 844px).
- Position: pinned to bottom
- Background: `color/surface/1`
- Top corners only: radius 20px (radius/2xl)
- Top shadow: `X:0 Y:-4 Blur:20 Spread:0 rgba(0,0,0,0.15)`

**Handle bar:** W: 36px, H: 4px, radius 9999px, bg `color/border/subtle`, centered horizontally, 12px from top.

**Title:** "What's happening?" DM Sans SemiBold 17px `color/text/primary`, 16px from handle, 16px horizontal padding.

**Category Grid:** 2×3 grid, 12px gap, 16px padding — same CategoryCard component as home screen.

**"Other" link:** DM Sans Regular 13px `color/text/secondary`, centered, 12px below grid.

---

### 3.4 Screen: Record Flow — Step 2 (Camera)

**Full screen camera view (W:390 H:844)**

**Top overlay bar:** W: fill, H: 56px, bg `rgba(14,22,33,0.75)`. Horizontal padding 16px. Items: close X (32px circle, white) | category pill (centered, colored) | flash icon (right, white 24px).

**Bottom overlay panel:**
- W: fill, H: 160px, pinned to bottom
- bg `rgba(14,22,33,0.85)`, backdrop-filter blur 12px
- Vertical auto layout, padding 12px 24px 24px, gap 12px

- **Location strip:** Horizontal auto layout, gap 6px. `map` icon 12px `#2EAD76` + address DM Sans Regular 13px `#E8EDF5`

- **Controls row:** Horizontal auto layout, space-between, align center
  - Left: camera icon (switch to photo) — 44×44px tap target, white 60% opacity
  - Center: **Record button** — 72px circle, bg `#D93A3A`, shadow `shadow/record`, `videocam` icon white 28px
    - **Recording state:** Add outer ring frame 90px circle, bg `#D93A3A` 50%, pulsing animation. Add "● REC" DM Mono Regular 12px `#D93A3A` above button. Add timer DM Mono Regular 14px white at same position.
  - Right: mic icon (audio only) — 44×44px tap target, white 60% opacity

- **Caption:** "Tap to record · Tap again to stop" DM Sans Regular 11px, white 50% opacity, centered

---

### 3.5 Screen: Record Flow — Step 3 (Submission Review)

**Bottom sheet on top of frozen camera frame (last captured frame as bg).**

Sheet: W: 390px, H: 590px (70%), pinned to bottom, bg `color/surface/1`, radius 20px top corners, shadow above.

**Content (vertical auto layout, 16px padding, 16px gap):**

1. **Handle bar** (same as Step 1 sheet)

2. **Media preview:** W: fill, aspect 16:9, radius 12px, bg `color/surface/2`. Contains play icon `play_circle` 48px `#507DBC` centered — represents video thumbnail.

3. **AI verification row:** Horizontal auto layout, gap 8px, align center, 12px vertical padding, radius 12px, bg `color/success/subtle`.
   - **Processing state:** Shimmer effect rectangle full width, animate shimmer left→right on `color/border/subtle` bg
   - **Verified state:** `check_circle` icon 16px `#2EAD76` + "Content verified by AI" DM Sans Medium 13px `#2EAD76`

4. **Details input:** W: fill, min-height 80px, radius 12px, bg `color/surface/2`, border 1px `color/border/subtle`, padding 12px. Placeholder: "Add context — number of people, direction of travel…" DM Sans Regular 14px `color/text/disabled`.

5. **Anonymous toggle row:** Horizontal auto layout, space-between, align center.
   - Left: "Post anonymously" DM Sans Medium 14px `color/text/primary`
   - Right: iOS-style toggle. ON state: `#507DBC` track. Default: **ON**.

6. **Submit button:** W: fill, H: 52px, radius 9999px (pill), bg `#507DBC`, shadow `shadow/primary-btn`.
   - Label: "Submit Report" DM Sans SemiBold 15px white, centered

7. **Caption:** "Will alert people within 250m and notify SPF" DM Sans Regular 12px `color/text/secondary`, text-center.

---

### 3.6 Screen: Map (Tab 4)

**Stack:**
1. Top Bar (same as home)
2. **Map layer** (H: ~500px, full bleed):
   - Figma placeholder: `color/bg/secondary` rectangle with subtle grid SVG
   - User location: 14px circle `#507DBC` fill, white 2px border, outer halo 36px `#507DBC` 30% — absolute center
   - **Incident pins** (place as absolute elements on map):
     - Base: 22px circle, category color fill, white icon 12px inside, white ring 2px
     - Pulse ring: separate 22px circle, category color 50%, scaled to 40px, opacity 0 — for animation
3. **Filter chips** (horizontal scroll, 12px vertical padding, 16px left padding, 8px chip gap) — identical chip style as category badges but with category labels. "All" chip is default active: bg `color/accent/subtle`, border `#507DBC`, text `#507DBC`.
4. **Compact incident list** (remaining height, scrollable, pb 96px):
   - Same IncidentCard component but hide AI Summary row (Row 3) for compact display
5. Bottom Nav Bar — active-tab: map

---

### 3.7 Screen: Profile (Tab 5)

**Stack:**
1. Top Bar (simplified — no search bar. Just logo + dark mode toggle button on right: `dark_mode` icon 20px `#507DBC`)
2. **Scrollable content area:**

**Profile Header Block** (padding 24px, vertical auto layout, align center, gap 12px):
- Avatar: 72px circle, bg `color/accent/subtle`, `#507DBC` initials DM Sans Bold 24px, border 3px `#507DBC` 20% opacity
- Name: DM Sans SemiBold 18px `color/text/primary`
- Verified badge: horizontal auto layout, gap 4px — `verified_user` icon 14px `#507DBC` + "Singpass Verified" DM Sans SemiBold 12px `#507DBC`

**Trust Score Card** (16px horizontal margin, radius 12px, bg `color/surface/1`, shadow `shadow/card`, padding 16px):
- Score number: DM Mono Bold 36px `#507DBC`
- Label: "Community Trust Score" DM Sans Regular 13px `color/text/secondary`
- Progress bar: W: fill, H: 6px, radius 9999px. Track: `color/accent/subtle`. Fill: gradient `#507DBC` → `#2EAD76`.

**Stats Row** (3 equal columns, 12px gap, 16px horizontal margin):
- Each cell: radius 12px, bg `color/surface/1`, padding 12px, align center, vertical auto layout
- Number: DM Mono Bold 22px `color/text/primary`
- Label: DM Sans Regular 12px `color/text/secondary`
- Labels: "Reports" / "Responses" / "Verified"

**Badges Section:**
- Section header: "Badges" DM Sans Bold 16px, 16px margin
- Horizontal scroll, 16px left padding, 12px gap
- Each badge: 60px circle, `color/accent/subtle` bg, icon 24px `#507DBC`, label below 10px `color/text/secondary`

**Dark Mode Toggle Row** (inside settings list):
- `dark_mode` icon 20px `color/text/secondary` + "Dark Mode" DM Sans Regular 14px `color/text/primary` + toggle right (on = `#507DBC`)

**Settings List** (radius 12px card, bg `color/surface/1`, 16px margin, divide `color/border/subtle`):
Standard list rows: icon 20px `color/text/secondary` + label DM Sans Regular 14px `color/text/primary` + `chevron_right` icon right `color/text/disabled`
Rows: Notification Preferences / Privacy Settings / Trusted Contacts / Language / Help & Legal / Sign Out

---

## 4. PROTOTYPE CONNECTIONS

Set up in Figma Prototype panel:

| Trigger | From | To | Animation |
|---|---|---|---|
| Tap "Fight/Assault" category card | Home Screen | Record Step 1 (sheet overlay) | Slide Up, spring |
| Tap any category card | Home Screen | Record Step 1 | Slide Up, spring |
| Tap any category in sheet | Record Step 1 | Record Step 2 (camera) | Dissolve, 200ms |
| Tap Record button | Record Step 2 | Record Step 2 (recording state) | Smart Animate, 300ms |
| Tap Record button again | Record Step 2 (recording) | Record Step 3 (review sheet) | Slide Up, spring |
| Tap "Submit Report" | Record Step 3 | Home Screen (with success toast) | Slide Down, spring |
| Tap incident card | Home/Feed | Incident Detail | Push Left, 300ms |
| Tap "Map" nav tab | Any screen | Map screen | Smart Animate |
| Tap "View Map" on location card | Home | Map screen | Push Left |
| Tap "View" on alert banner | Home | Incident Detail | Push Left |
| Tap nav tab | Any | Corresponding tab | Smart Animate |

---

## 5. FIGMA FILE STRUCTURE

```
ComplAIn/
│
├── 🎨 00 — Foundations/
│   ├── Color Variables (Light + Dark modes)
│   ├── Typography Styles (DM Sans + DM Mono scale)
│   ├── Spacing & Grids
│   ├── Shadows & Effects
│   └── Iconography Notes (Material Symbols Outlined)
│
├── 🧩 01 — Components/
│   ├── TopBar (variants: with/without search, unread dot)
│   ├── AlertBanner (variants: by severity + category)
│   ├── SectionHeader (variants: with/without "View all")
│   ├── CategoryCard (variants: 6 categories × half/full × default/pressed)
│   ├── IncidentCard (variants: 6 categories × 3 severities × full/compact)
│   ├── LocationCard
│   ├── BottomNavBar (variants: 5 active tab states)
│   ├── CategoryChip (variants: all categories × selected/unselected)
│   ├── RecordButton (variants: idle/recording/processing)
│   ├── SubmitButton (variants: default/loading/success)
│   ├── Toggle (variants: on/off × light/dark)
│   └── SettingsRow
│
├── 📱 02 — Screens/
│   ├── 01 Home (Light)
│   ├── 01 Home (Dark)
│   ├── 02 Feed
│   ├── 03 Record — Step 1 Category Sheet
│   ├── 04 Record — Step 2 Camera
│   ├── 05 Record — Step 3 Review
│   ├── 06 Map
│   └── 07 Profile
│
├── 🌗 03 — Mode Previews/
│   ├── All screens — Light
│   └── All screens — Dark
│
└── 🔄 04 — Prototype/
    └── Interactive flow (all connections)
```

---

## 6. ICON REFERENCE

All icons: **Material Symbols Outlined**, stroke weight 400, size 24px (unless specified).
Import via: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1`

| Location | Icon Name | Size | Color |
|---|---|---|---|
| App icon mark | `crisis_alert` | 18px | white |
| Notification bell | `notifications` | 24px | `color/text/secondary` |
| Unread dot (not icon) | — | 8px circle | `#D93A3A` |
| Search | `search` | 24px | `color/text/disabled` |
| Alert banner | `warning` | 18px | white |
| Fight category | `local_police` | 24px | `#D93A3A` |
| Harassment | `report` | 24px | `#9B59D0` |
| Crime | `gavel` | 24px | `#C0392B` |
| Transport | `train` | 24px | `#E8A838` |
| Medical | `emergency` | 24px | `#E05C2A` |
| Fire/Hazard | `local_fire_department` | 24px | `#E07A2A` |
| Record button | `videocam` | 30px | white |
| Camera toggle | `photo_camera` | 24px | white |
| Mic toggle | `mic` | 24px | white |
| Location pin | `location_on` | 12px/24px | `#2EAD76` / `#507DBC` |
| AI verified | `check_circle` | 16px | `#2EAD76` |
| Responding dot | — (● text) | — | `#2EAD76` |
| Map | `map` | 24px | nav color |
| Home | `home` | 24px | nav color |
| Feed | `list` | 24px | nav color |
| Profile | `person` | 24px | nav color |
| Expand | `chevron_right` | 20px | `color/text/disabled` |
| Sort | `tune` | 20px | `#507DBC` |
| Dark mode | `dark_mode` | 20px | `#507DBC` |
| Singpass | `verified_user` | 14px | `#507DBC` |
| SPF notified | `shield` | 16px | `#507DBC` |

---

## 7. LOGO BUILD GUIDE

**Step 1 — Icon Mark:**
- Create a 32×32px rectangle, radius 8px, fill `#507DBC`
- Place `crisis_alert` Material Symbol, 18px, white, centered
- Group as "ComplAIn / Icon Mark"

**Step 2 — Wordmark:**
- Create three separate text frames in a horizontal auto layout, gap 0:
  - "Compl" — DM Sans Bold 18px — bind to `color/text/primary` variable
  - "AI" — DM Sans Bold 18px — fill `#507DBC` (hardcoded, never changes)
  - "n" — DM Sans Bold 18px — bind to `color/text/primary` variable
- Group as "ComplAIn / Wordmark"

**Step 3 — Full Logo:**
- Horizontal auto layout, gap 8px, align center
- Icon Mark (left) + Wordmark (right)

**Reversed variant (for splash screen):**
- Use on `#507DBC` background
- Icon Mark: bg white, icon `#507DBC`
- Wordmark: all white (override variables)

---

## 8. DARK MODE TOGGLE IMPLEMENTATION

In Figma, apply variable modes to switch themes:

1. Select the root screen frame
2. In right panel → Variables → Mode: switch from "Light" to "Dark"
3. All components using variable-bound fills/colors update instantly

The dark mode toggle in the Profile screen: on tap in prototype, trigger a "Change variable mode" interaction from Light → Dark (or vice versa) at the page/frame level.

---

*End of ComplAIn Figma Specification*
*HTML reference file: complain_reference.html*
*Figma frame width: 390px | Height: 844px | Grid: 8pt*
