# AVARIS Media Production — Project Brief

> **For Claude Code:** This is the source of truth for this project. Read this first before doing anything. Reference design images in `/design-references/` folder.

---

## 1. Project Overview

**Client:** AVARIS Media Production
**Type:** Premium portfolio website for a video production / media company
**Tagline:** "Storytelling is Everything."
**Established:** 2020
**Markets:** Built in US market, expanding to Middle East
**Tone:** Cinematic, premium, bold, confident

**Contact info (from design):**
- Email: `hello@avarisco.net`
- Website: `www.avarisco.net`
- Social: `@avariscorporation`

---

## 2. Tech Stack (NON-NEGOTIABLE)

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Full-stack, SSR, SEO |
| Language | **TypeScript** (strict mode) | Type safety = security |
| Styling | **Tailwind CSS v4** | Design-system-first |
| Animation | **Framer Motion** + **GSAP** + **Lenis** | Cinematic feel |
| Database | **PostgreSQL** via **Supabase** | Reliable + RLS |
| ORM | **Prisma** | Type-safe queries |
| Auth | **Auth.js (NextAuth v5)** | Standard, secure |
| Validation | **Zod** | Runtime validation |
| Background Jobs | **Inngest** | For future Laravel migration |
| Email | **Resend** | Modern, developer-friendly |
| Forms | **react-hook-form** + Zod | Type-safe forms |
| Icons | **lucide-react** | Clean, consistent |
| Hosting | **Vercel** | Optimized for Next.js |

### Required setup commands:
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install framer-motion gsap @gsap/react lenis lucide-react clsx tailwind-merge
npm install zod react-hook-form @hookform/resolvers
npm install @t3-oss/env-nextjs
npm install -D @types/node
```

---

## 3. Security Requirements (TOP PRIORITY)

The user explicitly requested **highest possible security**. Apply ALL of these:

### Headers (in `next.config.ts`)
- Content Security Policy (strict, with nonces if possible)
- Strict-Transport-Security (HSTS) with preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### Code patterns
- **NO `dangerouslySetInnerHTML`** unless absolutely necessary, and only with DOMPurify
- **All user input validated with Zod** before processing
- **Server Actions** preferred over API routes when possible (CSRF built-in)
- **Rate limiting** on any public mutation endpoint
- **Environment variables** validated at build time with `@t3-oss/env-nextjs`
- **No secrets in client code** — strict separation
- **CSRF tokens** on all forms
- **Honeypot fields** on contact forms
- **Image domain allowlist** in `next.config.ts`

### Dependencies
- Run `npm audit` after install, fix any high/critical issues
- Add `.gitignore` entries for `.env*`, `*.pem`, secrets

---

## 4. Design System

### Colors

```css
/* Backgrounds */
--bg-primary: #0A0D12;        /* Deep dark blue-black (main bg) */
--bg-secondary: #14181F;      /* Slightly lighter dark for cards */
--bg-card-light: #FFFFFF;     /* Testimonial cards */
--bg-card-textured: #0F0F0F;  /* "Middle East deserves better" — paper texture */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #B8B8B8;
--text-muted: #808080;
--text-on-light: #1A1A1A;     /* For white cards */

/* Accent (signature gradient) */
--accent-pink: #EC4899;
--accent-purple: #8B5CF6;
--accent-gradient: linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 100%);

/* Verified review gold */
--gold: #D4A24C;

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-card: rgba(255, 255, 255, 0.12);
```

### Typography

```
Headings:     Anton (Google Fonts) — bold, condensed, all-caps display
              fallback: 'Bebas Neue', 'Oswald', system-ui, sans-serif

Subtitles:    Inter Italic — clean italic for "Feedbacks", "Where We Started" sub-labels

Body:         Inter — clean, readable

Sizes (desktop):
- Hero display:    96-120px, font-weight 800
- Section titles:  56-72px, font-weight 800
- Card titles:     24-32px, font-weight 700
- Body:            16-18px, font-weight 400
- Small text:      14px, font-weight 400

Letter-spacing on display fonts: -0.02em (tight)
Line-height on display: 0.95-1.0 (tight)
Line-height on body: 1.6
```

### Spacing & Layout

```
Container max-width: 1440px (1280px content)
Section padding (desktop): 120px vertical
Section padding (mobile): 80px vertical
Card border-radius: 16-24px
Button border-radius: 8px or fully rounded
```

### Logo

The AVARIS logo is a **diamond/X-shape inside a circle** (white outline). Implementation:
- Create as React component using SVG
- Available in white (default) and possibly inverted versions
- Always maintain aspect ratio
- Should appear in top-right of most sections

### Brand voice (in headings)
- "WHERE WE STARTED"
- "THE PROOF"
- "WHAT THEY SAY"
- "THE MIDDLE EAST DESERVES BETTER."
- "YOUR PROJECT DESERVES THIS."

All in **bold uppercase**, condensed font.

---

## 5. Animation Requirements

The site MUST feel cinematic. This is non-negotiable.

### Required animations

| Element | Animation |
|---|---|
| Hero "AVARIS" text | Scale + fade on load, slow reveal |
| Hero "↓" arrow | Subtle bounce loop |
| Section reveals | Fade up + slide on scroll into view |
| Number counters (9000+, 500+, 5+) | Count up from 0 when in viewport |
| Section titles | Text split + stagger reveal |
| Service cards | Scale + lift on hover, smooth |
| Testimonial carousel | Slide transition with depth (3 visible: 1 center + 2 partial sides) |
| Image cards | Subtle parallax on scroll |
| Page background | Smooth gradient/lighting shifts |
| Smooth scrolling | Enable Lenis everywhere |
| Mobile gestures | Swipe for carousels, smooth |

### Performance constraints
- Use `transform` and `opacity` for animations (GPU-accelerated)
- `will-change` hints sparingly
- Reduce motion when user has `prefers-reduced-motion`
- Lazy-load below-the-fold animations

---

## 6. Page Sections (in order)

The homepage is a **single-page scroll experience**. Each section below is a separate component but they live on `/` (root).

### 6.1 Hero
- Full viewport height
- Background: dark photograph with overlay gradient
- AVARIS logo top-center
- Massive "AVARIS" text center
- "MEDIA PRODUCTION" subtitle
- "CREATIVE PORTFOLIO" italic at bottom
- Animated down-arrow indicator

### 6.2 Where We Started
- Section title: "WHERE WE STARTED"
- Two paragraphs (story 1 then story 2)
- Background: dark photograph (same as hero or related)
- Highlighted phrases: "Middle East", "AVARIS", "US market" — subtle accent color

### 6.3 The Proof
- Section title: "THE PROOF" + subtitle "WHERE WE STARTED"
- 3 stat cards in a row (light gray gradient backgrounds):
  - 9,000+ Videos Delivered
  - 500+ Clients Served
  - 5+ Years in the US Market
- Below: white bar with client logos (Hilton, RayWhite, Hyatt, Thompson, Golden Globes, The Ritz-Carlton, etc.)
- Numbers should count up on scroll-into-view

### 6.4 The Middle East Deserves Better
- Background: dark with subtle paper-texture
- Big bold title: "THE MIDDLE EAST DESERVES BETTER."
- 3 outlined cards in a row:
  - **STORYTELLING** — "Great projects. Weak stories. The art of narrative is missing from the market entirely."
  - **TRENDY CONTENT** — "The world is watching short-form. The region is still stuck in outdated formats and formulas."
  - **STANDARDS** — "Production and post-production quality that matches the ambition of the region simply doesn't exist."

### 6.5 Services Overview
- 3-column grid showing:
  - 01. Video Production
  - 02. VFX & 3D Animation
  - 03. Photoshoot & Retouching
- Each column has full-bleed image background, big number, and service name
- Hover: subtle zoom on image, accent color overlay

### 6.6 Service Detail — Video Production
Sub-services (each own slide-like section):
- 01. **Cinematic Edits** — "Story-driven, high-fidelity pacing and mood. Dramatic cuts and color grades that make every frame iconic."
- 02. **Lifestyle Edits** — "Authentic, human-centric narratives. Warm, aspirational cuts that sell the feeling — not just the space."
- 03. **Trendy Edits** — "High-retention, algorithm-optimized short form. Built for maximum reach and engagement."
- 04. **Realtor Videos** — "Establishing authority and corporate identity. Agent intro reels, team videos, and brand storytelling."
- 05. **Branding Videos** — "Elevating properties into premium visual experiences. Walkthroughs, listings, and market updates."

Each has 1-2 portrait video/image previews on the right side.

### 6.7 Service Detail — VFX & 3D Animation
- "We transform raw renders and properties into photorealistic, cinematic productions."
- Tags: Architectural visualization · Product CGI · Virtual staging · Motion graphics · VFX
- Images of architectural visualizations

### 6.8 Service Detail — Photoshoot & Retouching
- "HDR blending · Sky replacement · Object removal · Color correction · Virtual twilight"
- "Delivered within 24 hours. For Every listing. Every agent."
- Multiple before/after style image grids
- This is an image-heavy carousel/gallery

### 6.9 Our Process
4 cards or sections:
- 01. **STORYTELLING** — "Grade and mood setting. Color science matched to your brand aesthetic and vision."
- 02. **CAPTIONS** — "Kinetic, brand-aligned typography. Accurate and styled to increase retention."
- 03. **AI INTEGRATION** — "Smart scaling, audio enhancement, noise removal, and AI generation tools."
- 04. **VFX & EFFECTS** — "Day-to-night transitions, Agent disappear effect, and seamless scene manipulation."

### 6.10 Organic Reach
- Section title: "Organic Reach"
- Display Instagram Insights mockups showing real numbers:
  - 351,245 views
  - 349,482 views
  - 185,605 views
- Circular progress charts (purple/pink gradient ring)
- Below: thumbnail grid of Instagram content with view counts

### 6.11 Testimonials (What They Say)
- Section title: "WHAT THEY SAY" + subtitle "Feedbacks"
- Carousel showing white cards with:
  - Top accent: pink-to-purple gradient bar
  - Avatar (colored circle with initial)
  - Name + handle
  - Platform tag (Instagram/Slack)
  - Review text
  - Bottom: 5 stars + "Verified Client Review"
- Show 1 center card + partial cards on sides for depth
- Left/right arrow navigation
- Auto-advance every 6s, pause on hover
- Reviews to include (5 total):
  1. **Ketch Johnson** (Slack DM Client) — "Guys it's freaking amazing. You did such a good job! Thank you so much. ❤❤❤ Absolutely! I am so beyond impressed. I truly can't thank you enough for being so incredible to work with!"
  2. **Hunter Weeks** (@hunterweeks, Instagram) — "NAILED IT ❤ Love this. So good ❤ I just got you another client. Showed him and he may use your editor full time."
  3. **Vadim Tsygipalo** (Slack DM Client) — "You guys do a great job — coloring and quick turnaround are amazing. I applaud you. Yesss!! Love this version. Great job. Thank you for taking the feedback."
  4. **Frank Garnica** (@frank.garnica, Instagram) — "Amazing thank you! ❤ Next time I will know for the client on delivery. Thank you! Your team is amazing. — After receiving his real estate highlight reel"
  5. **ArmstrongProd** (@armstrongprod, Instagram) — "I just submitted the feedback form, and I also wanted to personally say thank you. I came across you guys and everything started to shift. You blessed me with Class A editing — that moment meant more than you probably realized. I really appreciate you all. Thank you again. ❤"

### 6.12 Final CTA + Contact
- Background: dark with paper-texture
- Left: "YOUR PROJECT DESERVES THIS." (huge bold)
- Subtitle: "Be the first in your market to tell your story at an international level."
- Contact info:
  - EMAIL: hello@avarisco.net
  - WEBSITE: www.avarisco.net
  - SOCIAL: @avariscorporation
- Right side: AVARIS logo (large) + "STORYTELLING IS EVERYTHING." + "EST. 2020"
- Vertical divider line between left and right
- This is also the footer

---

## 7. Phases (Build in this order)

### Phase 1: Foundation (do this first)
1. Initialize Next.js with the exact create-next-app command above
2. Install all dependencies listed in section 2
3. Configure `next.config.ts` with security headers
4. Set up Tailwind config with design tokens from section 4
5. Create `src/lib/utils.ts` with `cn` helper
6. Create base layout with fonts loaded
7. Set up Lenis smooth scroll wrapper
8. Create the AVARIS logo component (SVG)

### Phase 2: Shared Components
1. `Container` — max-width wrapper
2. `Section` — vertical-padded section with optional id
3. `SectionTitle` — animated title with subtitle
4. `Button` — primary/secondary/ghost variants
5. `Card` — base card with optional gradient border
6. `AnimatedNumber` — counts up on scroll-into-view
7. `RevealOnScroll` — wrapper for fade-up animations

### Phase 3: Page Sections (in order from section 6)
Build each section as its own component in `src/components/sections/`. Test each in isolation.

### Phase 4: Mobile Optimization
- Verify all sections at 375px, 768px, 1024px, 1440px
- Touch gestures for carousels
- Reduce animation complexity on mobile

### Phase 5: Performance & SEO
- Optimize images (next/image with proper sizes)
- Add metadata (Open Graph, Twitter cards)
- Lighthouse audit, target 90+ on all metrics
- Add sitemap.xml and robots.txt

### Phase 6 (LATER, after Phase 5 deploys): Laravel Migration
The user has an existing Laravel automation system handling:
- Monday.com integration (board ID 6589241558)
- PayPal invoicing (currently migrating Sandbox → Production)
- Reads 3 columns: Class, Video Type2, Samy's PayPal
- Skips clients with missing fields
- Special handling for "Deposit paid" status

**Do NOT touch this in Phase 1-5.** When ready, the user will provide the Laravel codebase. Migrate logic to Inngest functions + Next.js API routes, with thorough testing in Sandbox before any Production cutover.

---

## 8. File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers)
│   ├── page.tsx                # Homepage (composes all sections)
│   ├── globals.css             # Tailwind + base styles
│   └── api/
│       └── contact/
│           └── route.ts        # Contact form (with rate limiting)
├── components/
│   ├── ui/                     # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   ├── SectionTitle.tsx
│   │   ├── AnimatedNumber.tsx
│   │   └── RevealOnScroll.tsx
│   ├── sections/               # Homepage sections
│   │   ├── Hero.tsx
│   │   ├── WhereWeStarted.tsx
│   │   ├── TheProof.tsx
│   │   ├── DeservesBetter.tsx
│   │   ├── ServicesOverview.tsx
│   │   ├── VideoProduction.tsx
│   │   ├── VFX3D.tsx
│   │   ├── Photoshoot.tsx
│   │   ├── OurProcess.tsx
│   │   ├── OrganicReach.tsx
│   │   ├── Testimonials.tsx
│   │   └── FinalCTA.tsx
│   └── layout/
│       ├── Logo.tsx            # AVARIS diamond logo
│       ├── SmoothScroll.tsx    # Lenis wrapper
│       └── Navbar.tsx          # If needed (optional, design suggests minimal)
├── lib/
│   ├── utils.ts                # cn helper, etc.
│   ├── env.ts                  # Validated env vars
│   └── animations.ts           # Reusable Framer Motion variants
└── data/
    └── testimonials.ts         # Testimonial content
    └── services.ts             # Service descriptions
```

---

## 9. Design Reference Images

Design mockups are in `/design-references/` (41 PowerPoint slide exports).

| Slide # | Section |
|---|---|
| 1 | Hero |
| 2-3 | Where We Started |
| 4 | The Proof |
| 5-9 | Testimonials |
| 10-11 | (Black transitions — IGNORE, not real sections) |
| 12 | Cinematic Edits |
| 13-16 | Organic Reach |
| 17 | Middle East Deserves Better |
| 18, 28 | Services Overview |
| 19-22 | (Black transitions — IGNORE) |
| 23, 29 | VFX & 3D Animation |
| 24 | Lifestyle Edits |
| 25 | Trendy Edits |
| 26 | Realtor Videos |
| 27 | Branding Videos |
| 30, 32, 36 | Photoshoot & Retouching variants |
| 33-35 | (Black transitions — IGNORE) |
| 37 | Storytelling (process) |
| 38 | Captions (process) |
| 39 | AI Integration (process) |
| 40 | VFX & Effects (process) |
| 41 | Final CTA + Contact |

**IMPORTANT:** Black slides are intentional design transitions in the PowerPoint version. On the web, these become **smooth scroll spacing** between sections — do NOT create empty black sections.

---

## 10. Workflow for Claude Code

1. **Read this brief in full first.**
2. Browse `/design-references/` to understand visual style.
3. Confirm your understanding by listing the phases you'll execute.
4. Start with **Phase 1** only. Do not skip ahead.
5. After each phase: stop and confirm with the user before moving on.
6. Run `npm run dev` after each major change so user can preview.
7. Commit to git after each phase with clear messages.
8. **Never** push to a remote unless explicitly told to.
9. **Never** add real `.env` values — use `.env.example` only.

---

## 11. User Context (Important)

- User: Samy
- Comfortable in Arabic and English (responds in both)
- Has Laravel/PHP background but is **not strong in backend**
- Will rely on Claude Code for ALL backend code
- Currently has working Laravel AVARIS automation system (PayPal + Monday.com) that should NOT be touched until Phase 6
- Prefers visual previews and incremental commits over big-bang releases
- Values: **security, performance, cinematic feel** (in that order of priority for tradeoffs)

---

**End of brief. Begin with Phase 1 only.**