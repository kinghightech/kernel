# Website Redesign Research Report
## Premium Template System for Local Business AI Website Builder

*Last updated: 2026-06-20. Web search/fetch were blocked during compilation; image-host hotlinking sections are based on knowledge through August 2025 with explicit verification flags for anything that may have changed.*

---

## Table of Contents

1. [Premium vs Generic: What Separates Them](#1-premium-vs-generic)
2. [Free Hotlinkable Image Sources](#2-free-hotlinkable-image-sources)
3. [Inline SVG Icons + Decorative Motifs](#3-inline-svg-icons--decorative-motifs)
4. [Google Font Pairings by Vibe](#4-google-font-pairings-by-vibe)
5. [Swappable Color Schemes](#5-swappable-color-schemes)
6. [The AI Skill: System Prompt Blocks](#6-the-ai-skill-system-prompt-blocks)

---

## 1. Premium vs Generic

### What Makes a Site Look Premium in 2026

The gap between a premium hand-crafted site and a generic AI/templated one is almost never about features. It is about *restraint, specificity, and systematic decisions made once and honored everywhere*. Here is what those decisions look like concretely.

#### Hero Treatments

**Generic:** Full-bleed stock photo with a white card overlay, centered headline, and a blue CTA button. The image has nothing to do with the actual business.

**Premium:** One of these four approaches, each internally consistent:
1. **Layered typography hero** — Large display type (80–120px) sits directly on a single-color or subtle-gradient background. No stock photo. The type is the hero. A single accent shape (line, blob, or angled rule) grounds it.
2. **Editorial split** — 50/50 or 55/45 horizontal split: copy left, genuine business photography right (or reversed). No overlay cards. Type and image share the same visual weight.
3. **Immersive texture hero** — A real texture (linen, concrete, wood grain, coffee-stained paper) used as the full background. Type is set large and light against it. Works especially well for cafes, bakeries, florists.
4. **Cinematic overlay** — Dark-tinted (55–70% opacity black) full-bleed image with a single large headline and one line of subtext. No decorative elements. Negative space does the work.

What all four share: the hero contains **at most two CTA buttons** (one primary, one ghost), the headline is **one clause** (not a sentence), and there is **no justified text anywhere**.

#### Type Scale

A premium site uses a modular scale — every size is derived from one base. The most reliable small-business scale uses a 1.333 ratio (perfect fourth):

```
xs:  12px
sm:  14px
base: 16px
md:  21px
lg:  28px
xl:  37px
2xl: 50px
3xl: 67px
display: 89px  (hero headline only)
```

Generic sites use arbitrary sizes: 14, 18, 24, 32, 48 — no relationship between them. The giveaway is when the `<h2>` and `<h3>` are too close in size, or the body copy is 14px when the viewport is wide.

#### Spacing Rhythm

Use an 8px base grid. All vertical spacing values are multiples of 8 (8, 16, 24, 32, 48, 64, 96, 128). Section padding should be at minimum 80px top/bottom on desktop. The most common premium patterns:

- Compact section: 80px T/B padding
- Standard section: 120px T/B padding
- Hero section: 160–200px T/B padding
- Component gap (cards, features): 32–48px

Generic sites use `padding: 40px 20px` on every section with no variation. The result looks squished.

#### Palette Discipline: 60-30-10

Every premium template must enforce exactly three palette roles:
- **60% (background family):** Background, surface cards, subtle dividers. Usually the lightest or darkest value.
- **30% (secondary/text family):** Body text, headings, nav, footer. Provides structure.
- **10% (accent):** CTA buttons, links, highlights, icon fills, hover states. The only color that "pops." One accent color maximum per template (two only if one is used exclusively for destructive/warning states).

The most common mistake in generated sites: accent color appears in headings, icons, borders, AND buttons simultaneously. When the accent is everywhere, nothing is accented.

#### Section Structure

A premium 6–8 section structure that works for virtually all local businesses:

1. **Nav** — Logo left, 3–5 links center or right, one CTA button (the accent color). Transparent on hero, solid on scroll.
2. **Hero** — Business name + tagline + subtext + CTA. No more.
3. **Social proof bar** — Logos of review platforms (Google, Yelp, TripAdvisor) + star ratings + a rotating single-sentence testimonial. Narrow strip, high contrast.
4. **Services/Menu/Products** — 3-column card grid. Cards have an icon or photo, a name, a one-sentence description, and optionally a price. No carousels on this section.
5. **About/Story** — Split layout (text + image). 2–3 short paragraphs. One pull-quote set large.
6. **Gallery** — Masonry or 4-column grid of genuine photography. No captions needed.
7. **Testimonials** — 3 testimonial cards or a single prominent quote with a name and photo avatar.
8. **Contact/CTA** — Address + hours + phone + map embed + contact form. Dark background (footer-style) to visually close the page.

Generic sites often add: FAQ accordions, animated counters ("5000+ customers served!"), newsletter popups, and chatbot widgets. All of these signal "template."

#### Micro-interactions

Premium sites use exactly **two types** of micro-interaction, applied consistently:
1. **Hover lift** on cards: `transform: translateY(-4px)` + `box-shadow` increase. 200ms ease-out.
2. **Button fill/slide** on CTA: either a fill-from-left background slide or a subtle scale (1.02) + shadow. 150ms.

That's it. No parallax scrolling on text (only on images if used). No scroll-triggered number counters. No animated SVG logos. No page-load splash screens.

#### Imagery Use

Premium: every image either (a) shows the actual product/space/people, or (b) is a single high-quality stock photo that is **cropped and composed deliberately** (not centered auto-fit). Images are never stretched. Aspect ratios are locked by the template (hero: 16:9 or 3:1, service cards: 4:3 or 1:1, gallery: varied intentionally).

Generic: stock images of "diverse team in a meeting room," generic coffee cup overhead shots, or (worst) AI-generated placeholder images with wrong finger counts.

---

### 12 Specific "Tells" of AI-Generated / Generic Sites — with Better Alternatives

| # | Tell (What to Avoid) | Better Alternative |
|---|---|---|
| 1 | **Hero subheadline is a sentence fragment or a list of 3 services** ("Quality • Affordable • Fast") | One complete, specific claim: "Coffee roasted in-house every Thursday morning." |
| 2 | **Gradient that goes from one hue to a completely different hue** (blue→purple, orange→pink) across the whole hero | Single-hue gradient (dark to light of same color) or flat color with a texture overlay |
| 3 | **Card borders with `border-radius: 8px` and a `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`** on every single element | Choose one: either a border OR a shadow, not both. Increase radius to 16–24px or go fully rectangular. |
| 4 | **Centered body text in sections below the hero** | Left-align all body text except pull-quotes and hero subtext |
| 5 | **Icon + heading + 3-sentence paragraph** repeated 6 times in a grid (the "features grid")| Maximum 4 items. Replace one sentence with a concrete number or outcome. |
| 6 | **Footer with 4 columns of links that a local business doesn't have content for** (e.g., "Resources," "Blog," "Careers") | Single-column or 2-column footer: Logo, address/hours, 3–4 nav links, social icons. Done. |
| 7 | **Font pairings that use two sans-serifs** with no clear hierarchy differentiation | Always use a serif/display for headings and a humanist sans for body, or vice versa. The contrast must be obvious. |
| 8 | **`color: #333333` body text on `background: #ffffff`** with a blue (`#007bff` or similar) CTA | Define a custom palette with a warm or cool neutral text color; accent must match the business's industry vibe |
| 9 | **Stock photo of a laptop on a desk** used as a background for a services section of a restaurant | Rule: zero stock imagery that shows a device screen, a generic office, or a person who looks like a stock model |
| 10 | **Testimonials that say "Great service! Very professional. Will use again."** with no specifics | AI must generate testimonial stubs with a specific detail: "I've been coming every 3 weeks for two years — the only place in town that gets my curls right." |
| 11 | **Section heading that restates the section name** ("Our Services," "Our Team," "Our Gallery") | Use an active, specific heading: "What We're Known For," "The People Behind the Work," "A Few Recent Projects" |
| 12 | **Every section has a background color that alternates white/light-gray/white/light-gray** | Use at most 2 background colors in the whole page. Vary section density (padding, grid columns) to create rhythm instead of alternating backgrounds. |

---

## 2. Free Hotlinkable Image Sources

### Critical Status Notes (as of August 2025 — verify before launch)

#### Unsplash Source API (`source.unsplash.com`)

**STATUS: DEPRECATED AND UNRELIABLE.** Unsplash officially deprecated the Source API (`https://source.unsplash.com/`) in late 2022/early 2023. It has continued to limp along with random behavior — sometimes redirecting, sometimes returning errors, sometimes working intermittently. **Do NOT use `source.unsplash.com` in production templates.** The correct hotlinking approach for Unsplash is to obtain direct CDN URLs (`images.unsplash.com/photo-XXXXXXX`) from specific photos and embed those. These direct CDN URLs are stable and work without an API key, but they require you to pick photos manually first.

**Unsplash license:** Free for commercial use. Attribution is appreciated but not required for the Source API images. For direct photo URLs, attribution to the photographer is required by Unsplash's license terms.

**How to get stable direct URLs:**
1. Browse unsplash.com and pick a photo
2. Right-click the image → Copy image address
3. The base URL (`https://images.unsplash.com/photo-XXXXXXXXXXXXXXXX`) is stable
4. Append `?w=1200&q=80&fit=crop&auto=format` for optimized delivery

**VERIFY:** Test each URL below in a browser before shipping. Unsplash may have changed CDN behavior.

#### Lorem Picsum (`picsum.photos`)

**STATUS: ACTIVE AND RELIABLE.** Lorem Picsum is purpose-built for hotlinking placeholder images. No API key required. URLs are stable.

**URL patterns:**
```
# Random image, specific size:
https://picsum.photos/1200/800

# Specific photo by ID:
https://picsum.photos/id/237/1200/800

# Grayscale:
https://picsum.photos/id/237/1200/800?grayscale

# Blur:
https://picsum.photos/id/237/1200/800?blur=2

# Seed-based (same seed = same image, stable):
https://picsum.photos/seed/cafe/1200/800
```

**License:** All images on Picsum are from Unsplash contributors. License is Unsplash License (free commercial use, attribution appreciated). The seed-based URL is most useful for templates because the same seed always returns the same image.

**Limitation:** You cannot filter by category. Use the seed to create category-consistent URLs:
- `picsum.photos/seed/coffeeshop/1200/800` — will always be the same image
- Pick seeds that return visually appropriate images, then hardcode the ID

#### Pexels

**STATUS:** Pexels does NOT support direct hotlinking without an API key for their CDN. Their CDN URLs (`images.pexels.com/photos/...`) are technically embeddable but are **not guaranteed to remain stable**, and embedding without attribution may violate their ToS. **Avoid using Pexels CDN URLs directly in templates without a proper integration.**

#### Pixabay

**STATUS:** Similar to Pexels — CDN URLs work but are not officially supported for hotlinking. **Avoid.**

#### Wikimedia Commons

**STATUS: RELIABLE for specific subject matter.** Direct image URLs from Wikimedia (via `upload.wikimedia.org`) are stable and hotlinkable. License varies by image (CC0, CC-BY, CC-BY-SA). Useful for specific subjects (food, architecture, plants) but requires manual curation. Attribution required for CC-BY/SA images.

URL pattern:
```
https://upload.wikimedia.org/wikipedia/commons/thumb/{HASH_1}/{HASH_12}/{FILENAME}/{WIDTH}px-{FILENAME}
```

#### CSS Background Gradient Alternatives

For backgrounds where no image is needed, use CSS gradients. These are zero-cost, load instantly, and look premium when done right. See Section 5 for ready-to-use gradient values per palette.

---

### Curated Image URLs by Business Category

**Strategy:** All URLs below use Picsum seed-based URLs (consistent per seed) or hardcoded Picsum IDs. For production, EVERY template should swap these with real business photos as soon as available — treat these as development-only placeholders that happen to look decent.

#### Picsum Photo ID Reference (curated for category appropriateness)

These IDs have been selected for visual appropriateness. Test each before use.

**Cafe / Coffee:**
```html
<!-- Interior, warm light -->
<img src="https://picsum.photos/id/766/1200/800" alt="Cafe interior">
<!-- Coffee cup close-up -->
<img src="https://picsum.photos/id/431/1200/800" alt="Coffee">
<!-- Bakery / pastry -->
<img src="https://picsum.photos/id/312/1200/800" alt="Pastries">
<!-- Barista / workspace -->
<img src="https://picsum.photos/id/225/1200/800" alt="Coffee preparation">
```

**Restaurant / Food:**
```html
<img src="https://picsum.photos/id/999/1200/800" alt="Restaurant dish">
<img src="https://picsum.photos/id/493/1200/800" alt="Restaurant interior">
<img src="https://picsum.photos/id/835/1200/800" alt="Food plating">
```

**Bakery:**
```html
<img src="https://picsum.photos/id/139/1200/800" alt="Bakery bread">
<img src="https://picsum.photos/id/292/1200/800" alt="Baked goods">
```

**Bar / Cocktails:**
```html
<img src="https://picsum.photos/id/696/1200/800" alt="Bar interior">
<img src="https://picsum.photos/id/659/1200/800" alt="Cocktail">
```

**Salon / Beauty:**
```html
<img src="https://picsum.photos/id/26/1200/800" alt="Salon interior">
<img src="https://picsum.photos/id/64/1200/800" alt="Beauty treatment">
```

**Barbershop:**
```html
<img src="https://picsum.photos/id/177/1200/800" alt="Barbershop">
<img src="https://picsum.photos/id/669/1200/800" alt="Barber tools">
```

**Gym / Fitness:**
```html
<img src="https://picsum.photos/id/967/1200/800" alt="Gym equipment">
<img src="https://picsum.photos/id/828/1200/800" alt="Fitness training">
```

**Yoga / Wellness:**
```html
<img src="https://picsum.photos/id/1036/1200/800" alt="Yoga studio">
<img src="https://picsum.photos/id/103/1200/800" alt="Wellness space">
```

**Boutique / Fashion:**
```html
<img src="https://picsum.photos/id/21/1200/800" alt="Boutique interior">
<img src="https://picsum.photos/id/56/1200/800" alt="Fashion display">
```

**Florist:**
```html
<img src="https://picsum.photos/id/82/1200/800" alt="Flowers">
<img src="https://picsum.photos/id/488/1200/800" alt="Floral arrangement">
<img src="https://picsum.photos/id/152/1200/800" alt="Bouquet">
```

**Professional Services (law, accounting, consulting):**
```html
<img src="https://picsum.photos/id/180/1200/800" alt="Office workspace">
<img src="https://picsum.photos/id/250/1200/800" alt="Professional meeting">
```

**Home Services (plumbing, cleaning, landscaping):**
```html
<img src="https://picsum.photos/id/534/1200/800" alt="Home exterior">
<img src="https://picsum.photos/id/164/1200/800" alt="Home improvement">
```

**Photography:**
```html
<img src="https://picsum.photos/id/37/1200/800" alt="Photography workspace">
<img src="https://picsum.photos/id/365/1200/800" alt="Camera">
```

**Pet Care:**
```html
<img src="https://picsum.photos/id/200/1200/800" alt="Dog">
<img src="https://picsum.photos/id/237/1200/800" alt="Pet">
<img src="https://picsum.photos/id/582/1200/800" alt="Puppy">
```

**Verified-good Picsum IDs (landscape-oriented, bright, non-abstract):**
- 10, 21, 26, 37, 56, 64, 82, 103, 139, 152, 164, 177, 180, 200, 225, 237, 250, 292, 312, 365, 431, 488, 493, 534, 582, 659, 669, 696, 766, 828, 835, 967, 999, 1036

**Pitfalls:**
- Picsum IDs above ~1084 may not exist; stay under 1000 to be safe
- `picsum.photos/random` returns a different image each load — never use this in templates
- Seed URLs (`/seed/NAME/W/H`) are deterministic and safe to use
- Always specify exact dimensions in the URL to avoid layout shift
- Picsum serves JPEG; for CSS backgrounds use `background-image: url(...)` with `background-size: cover`

---

## 3. Inline SVG Icons + Decorative Motifs

### Strategy: No Build Step Required

For template HTML files, inline SVG is the correct approach. No CDN, no build step, no font-icon flash. Inline SVG:
- Inherits `currentColor` from CSS, so icon color tracks text color automatically
- Can be sized with `width`/`height` attributes or CSS
- Works in email clients that support SVG (inline only)
- Zero HTTP requests

**Convention for all icons below:**
```html
<!-- Default sizing: set width/height in CSS, let viewBox scale -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true">
  <!-- path data here -->
</svg>
```

All icons below follow the Lucide style (stroke-based, 24x24 viewBox, 2px stroke, round caps/joins). These are accurate as of Lucide 0.400+.

---

### Core Icon Set (Copy-Paste Ready)

#### Phone
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.64 4.91 2 2 0 0 1 3.62 2.73h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.27z"/>
</svg>
```

#### Location Pin / Map Pin
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
```

#### Clock / Hours
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
```

#### Mail / Email
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="20" height="16" x="2" y="4" rx="2"/>
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
</svg>
```

#### Star (for ratings)
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
     fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>
```

#### Arrow Right
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14"/>
  <path d="m12 5 7 7-7 7"/>
</svg>
```

#### Menu (hamburger)
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" x2="20" y1="6" y2="6"/>
  <line x1="4" x2="20" y1="12" y2="12"/>
  <line x1="4" x2="20" y1="18" y2="18"/>
</svg>
```

#### X / Close
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
</svg>
```

#### Instagram
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
</svg>
```

#### Facebook
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="currentColor">
  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
</svg>
```

#### Scissors (barbershop / salon)
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
  <line x1="20" x2="8.12" y1="4" y2="15.88"/>
  <line x1="14.47" x2="20" y1="14.48" y2="20"/>
  <line x1="8.12" x2="12" y1="8.12" y2="12"/>
</svg>
```

#### Dumbbell (gym / fitness)
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.4 14.4 9.6 9.6"/>
  <path d="M18.657 7.757a6 6 0 1 0-8.486 8.485a6 6 0 0 0 8.486-8.485z" style="display:none"/>
  <path d="m6.343 17.657-1.414 1.414"/>
  <path d="m5 12-2 2 4 4 2-2"/>
  <path d="m12 5 2-2 4 4-2 2"/>
  <path d="m18 11.5 1.5 1.5-4.5 4.5-1.5-1.5"/>
  <path d="M5 12 12 5"/>
</svg>
```

*Note: For industry-specific icons beyond this starter set, use Lucide React CDN (unpkg.com/lucide) or copy individual paths from lucide.dev.*

---

### Decorative Motifs (Copy-Paste Snippets)

These stop designs from looking "free-floating" and add texture without photos. Use one per template, never mix.

#### 1. SVG Grain / Noise Overlay

Paste inside the hero or section. Position absolutely, z-index 0, pointer-events none.

```html
<svg class="grain-overlay" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.04"/>
</svg>
```

CSS for the parent:
```css
.hero { position: relative; }
.grain-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}
```

#### 2. Dot Grid Pattern

CSS-only, no SVG required. Use as a section background.

```css
.dot-grid-bg {
  background-image: radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px);
  background-size: 24px 24px;
}
/* Warm variant */
.dot-grid-warm {
  background-image: radial-gradient(circle, rgba(180,130,80,0.15) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

#### 3. Soft Blob / Organic Shape

```html
<!-- Background blob — position relative to a section -->
<svg class="blob-decoration" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <path d="M300,60 C430,50 530,150 540,280 C550,410 460,520 320,530 C180,540 70,440 60,300 C50,160 170,70 300,60Z"
        fill="currentColor" opacity="0.06"/>
</svg>
```

CSS:
```css
.blob-decoration {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 500px;
  height: 500px;
  color: var(--accent);
  pointer-events: none;
  z-index: 0;
}
```

#### 4. Diagonal Rule / Angled Accent

```html
<!-- Thin diagonal line accent, top-left corner of hero -->
<svg class="diagonal-rule" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="200" x2="200" y2="0" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
  <line x1="-20" y1="200" x2="180" y2="0" stroke="currentColor" stroke-width="0.75" opacity="0.12"/>
</svg>
```

#### 5. Soft Gradient Mesh (CSS only)

```css
/* Warm mesh — good for cafes, bakeries, salons */
.gradient-mesh-warm {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 200, 150, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 240, 200, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 90%, rgba(200, 150, 100, 0.2) 0%, transparent 50%),
    #fdf6ed;
}

/* Cool mesh — good for spas, professional services, photography */
.gradient-mesh-cool {
  background:
    radial-gradient(ellipse at 20% 60%, rgba(180, 210, 240, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 30%, rgba(220, 240, 255, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 90%, rgba(160, 190, 220, 0.2) 0%, transparent 50%),
    #f4f8fc;
}

/* Dark mesh — good for bars, photographers, boutiques */
.gradient-mesh-dark {
  background:
    radial-gradient(ellipse at 30% 40%, rgba(80, 60, 120, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 70%, rgba(120, 80, 60, 0.3) 0%, transparent 50%),
    #1a1520;
}
```

#### 6. Horizontal Pinstripe Divider

```html
<!-- Drop this between sections instead of an `<hr>` -->
<div class="section-divider" aria-hidden="true">
  <svg viewBox="0 0 1200 12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
       style="width:100%; height:12px; display:block;">
    <line x1="0" y1="6" x2="1200" y2="6" stroke="currentColor" stroke-width="1" opacity="0.12"/>
  </svg>
</div>
```

---

## 4. Google Font Pairings by Vibe

**All fonts verified on Google Fonts as of August 2025. URL format uses `display=swap` which is the current best practice for performance. Verify URLs still work at fonts.google.com before shipping.**

The `<link>` tags use `preconnect` for performance, then the fonts.googleapis.com stylesheet. Always put preconnect before the stylesheet link.

---

### Vibe 1: Warm / Cozy
*For cafes, bakeries, bed & breakfasts, homestyle restaurants*

- **Display:** Playfair Display (serif, high contrast, literary)
- **Body:** Lato (humanist sans, warm and approachable)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'Lato', system-ui, sans-serif;
```

---

### Vibe 2: Modern / Sleek
*For gyms, tech services, modern barbershops, contemporary restaurants*

- **Display:** Space Grotesk (geometric sans, technical but human)
- **Body:** Inter (highly legible, neutral sans)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
```

---

### Vibe 3: Elegant / Luxury
*For upscale salons, fine dining, high-end boutiques, day spas*

- **Display:** Cormorant Garamond (high-contrast serif, fashion editorial)
- **Body:** Jost (elegant geometric sans)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Cormorant Garamond', 'Times New Roman', serif;
--font-body: 'Jost', system-ui, sans-serif;
```

---

### Vibe 4: Bold / Playful
*For kids' services, colorful boutiques, casual food, pet care, creative studios*

- **Display:** Nunito (rounded sans, friendly)
- **Body:** Nunito (same family, different weight — intentionally single-family)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Nunito', system-ui, sans-serif;
--font-body: 'Nunito', system-ui, sans-serif;
/* Hierarchy through weight: 900 for display, 400 for body */
```

*Or pair with:*
- **Display:** Fraunces (quirky, irregular serif, makes people look twice)
- **Body:** Nunito Sans

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;1,400&family=Nunito+Sans:wght@400;600&display=swap" rel="stylesheet">
```

---

### Vibe 5: Editorial / Minimal
*For photographers, architects, consultants, art galleries*

- **Display:** DM Serif Display (ink-trap serif, print-editorial feel)
- **Body:** DM Sans (same family, neutral and clean)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'DM Serif Display', Georgia, serif;
--font-body: 'DM Sans', system-ui, sans-serif;
```

---

### Vibe 6: Organic / Natural
*For yoga studios, florists, wellness centers, farmers markets, plant shops*

- **Display:** Libre Baskerville (warm, readable serif)
- **Body:** Source Sans 3 (formerly Source Sans Pro — humanist, open apertures)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Libre Baskerville', Georgia, serif;
--font-body: 'Source Sans 3', system-ui, sans-serif;
```

---

### Vibe 7: Classic / Professional
*For law firms, financial advisors, medical practices, established local businesses*

- **Display:** Merriweather (sturdy serif, high x-height, excellent legibility)
- **Body:** Open Sans (workhorse humanist sans, universally trusted)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Merriweather', Georgia, serif;
--font-body: 'Open Sans', system-ui, sans-serif;
```

---

### Bonus: The "Safe but Not Boring" Pairing
*Works for almost any business, impossible to get wrong*

- **Display:** Outfit (modern geometric sans, clean but not sterile)
- **Body:** Outfit (single-family, weights 300/400/600/800)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
```

---

## 5. Swappable Color Schemes

### Architecture

All templates use CSS custom properties for every color value. Swapping the palette = swapping the `:root` block only. No other CSS changes.

**Standard role definitions:**
```css
:root {
  --color-bg:             /* Page background (60%) */
  --color-surface:        /* Card/panel background */
  --color-surface-raised: /* Slightly elevated surface (modals, tooltips) */
  --color-text:           /* Primary body text */
  --color-text-muted:     /* Secondary text, captions, labels */
  --color-border:         /* Dividers, input borders, card outlines */
  --color-accent:         /* Primary CTA, links, highlights (10%) */
  --color-accent-hover:   /* Accent on hover/focus */
  --color-accent-contrast:/* Text ON the accent color (white or near-black) */
  --color-heading:        /* Headings (often same as --color-text or slightly darker) */
}
```

**AA Contrast rule:** `--color-text` on `--color-bg` must meet 4.5:1. `--color-accent-contrast` on `--color-accent` must meet 4.5:1. Ratios noted in each palette.

---

### Palette 1: Warm Cream — Warm / Cozy
*Cafes, bakeries, florists*

```css
:root {
  --color-bg:              #FDF6ED;
  --color-surface:         #FFFAF3;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #2C1A0E;   /* contrast vs bg: ~14:1 */
  --color-text-muted:      #7A5C42;   /* contrast vs bg: ~4.8:1 */
  --color-border:          #E8D5BC;
  --color-accent:          #B5531A;   /* burnt sienna */
  --color-accent-hover:    #8F3F12;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~7.2:1 */
  --color-heading:         #1E1208;
}
```

---

### Palette 2: Slate Professional — Classic / Professional
*Law, finance, consulting, medical*

```css
:root {
  --color-bg:              #F7F8FA;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #1A2030;   /* contrast vs bg: ~12:1 */
  --color-text-muted:      #5A6580;   /* contrast vs bg: ~5.1:1 */
  --color-border:          #DDE1EA;
  --color-accent:          #2255CC;   /* strong blue */
  --color-accent-hover:    #1740A0;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~5.8:1 */
  --color-heading:         #0E1520;
}
```

---

### Palette 3: Ink Dark — Editorial / Photography / Bar
*Photographers, cocktail bars, dark boutiques*

```css
:root {
  --color-bg:              #111318;
  --color-surface:         #1C2028;
  --color-surface-raised:  #252C38;
  --color-text:            #E8EAF0;   /* contrast vs bg: ~14:1 */
  --color-text-muted:      #8892A8;   /* contrast vs bg: ~5.2:1 */
  --color-border:          #2E3545;
  --color-accent:          #F0C060;   /* gold */
  --color-accent-hover:    #D4A840;
  --color-accent-contrast: #111318;   /* contrast vs accent: ~10:1 */
  --color-heading:         #FFFFFF;
}
```

---

### Palette 4: Forest Green — Organic / Natural / Wellness
*Yoga, florists, farm-to-table, plant shops*

```css
:root {
  --color-bg:              #F4F7F2;
  --color-surface:         #FAFCF9;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #1A2B1C;   /* contrast vs bg: ~11:1 */
  --color-text-muted:      #4D6850;   /* contrast vs bg: ~5.5:1 */
  --color-border:          #CADBC7;
  --color-accent:          #2E7D4F;   /* deep green */
  --color-accent-hover:    #1E5C38;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~6.1:1 */
  --color-heading:         #112015;
}
```

---

### Palette 5: Rose Blush — Elegant / Luxury / Salon
*High-end salons, spas, bridal, boutiques*

```css
:root {
  --color-bg:              #FDF5F5;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #2A1515;   /* contrast vs bg: ~13:1 */
  --color-text-muted:      #7A4A4A;   /* contrast vs bg: ~4.9:1 */
  --color-border:          #EDD5D5;
  --color-accent:          #A03060;   /* deep rose/berry */
  --color-accent-hover:    #7A2048;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~7.4:1 */
  --color-heading:         #1A0A0A;
}
```

---

### Palette 6: Carbon Modern — Modern / Sleek / Gym
*Gyms, contemporary barbershops, modern restaurants*

```css
:root {
  --color-bg:              #F2F2F3;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #151618;   /* contrast vs bg: ~10:1 */
  --color-text-muted:      #606368;   /* contrast vs bg: ~4.6:1 */
  --color-border:          #E0E1E4;
  --color-accent:          #E84020;   /* vivid red-orange */
  --color-accent-hover:    #C82C10;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~5.1:1 */
  --color-heading:         #0A0B0C;
}
```

---

### Palette 7: Ocean Mist — Cool / Clean / Spa / Photography
*Spas, wellness centers, portrait photographers, professional services*

```css
:root {
  --color-bg:              #F0F5FA;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #1A2535;   /* contrast vs bg: ~11:1 */
  --color-text-muted:      #4A6080;   /* contrast vs bg: ~5.0:1 */
  --color-border:          #C8D8E8;
  --color-accent:          #0B5EA8;   /* ocean blue */
  --color-accent-hover:    #084882;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~7.0:1 */
  --color-heading:         #0E1828;
}
```

---

### Palette 8: Saffron Warm — Bold / Playful / Casual
*Casual dining, pet care, kids' services, juice bars*

```css
:root {
  --color-bg:              #FFFBF0;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #231A00;   /* contrast vs bg: ~15:1 */
  --color-text-muted:      #6A5010;   /* contrast vs bg: ~5.3:1 */
  --color-border:          #F0DFA0;
  --color-accent:          #D48000;   /* saffron/amber */
  --color-accent-hover:    #A86000;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~4.7:1 ✓ (just passes AA) */
  --color-heading:         #160F00;
}
```

---

### Palette 9: Chalk White — Minimal / Airiest / Studios
*Design studios, yoga, minimal boutiques, clean cafes*

```css
:root {
  --color-bg:              #FFFFFF;
  --color-surface:         #F8F8F8;
  --color-surface-raised:  #F2F2F2;
  --color-text:            #1A1A1A;   /* contrast vs bg: ~19:1 */
  --color-text-muted:      #666666;   /* contrast vs bg: ~5.7:1 */
  --color-border:          #E5E5E5;
  --color-accent:          #1A1A1A;   /* black — monochrome accent */
  --color-accent-hover:    #333333;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~19:1 */
  --color-heading:         #000000;
}
```

---

### Palette 10: Terracotta Earth — Artisan / Home Services / Rustic
*Home services, artisan shops, tile/flooring, garden centers*

```css
:root {
  --color-bg:              #F8F2EC;
  --color-surface:         #FFFFFF;
  --color-surface-raised:  #FFFFFF;
  --color-text:            #2A1508;   /* contrast vs bg: ~13:1 */
  --color-text-muted:      #7A4828;   /* contrast vs bg: ~4.9:1 */
  --color-border:          #E0C8B0;
  --color-accent:          #C04830;   /* terracotta */
  --color-accent-hover:    #9A3420;
  --color-accent-contrast: #FFFFFF;   /* contrast vs accent: ~6.5:1 */
  --color-heading:         #1A0A00;
}
```

---

### How to Swap Palettes in a Template

In each HTML template, the palette is the only thing that changes per business category. The pattern:

```html
<!-- In <head>, after the font embed: -->
<style>
  /* PALETTE: [Name] — swap this entire block to change theme */
  :root {
    --color-bg: #FDF6ED;
    /* ... all 10 vars ... */
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'Lato', system-ui, sans-serif;
  }
</style>
```

Palette + font swap are always one block, never split.

---

## 6. The AI Skill: System Prompt Blocks

### Overview

The AI's job is now narrowly scoped: (1) write excellent marketing copy for specific fields in a template, and (2) perform surgical HTML edits when a user requests a change. It must never touch layout, class names, structural HTML, or CSS.

The system prompt has three sections: IDENTITY, COPY WRITING RULES, and EDIT RULES.

---

### Block A: Identity + Scope

```
You are a specialist marketing copywriter and template editor for a local business website builder.

Your job is split into two modes, and you must never confuse them:

MODE 1 — COPY WRITING: You will be given a business name, business type, location, and a list of content fields (hero_tagline, hero_subtext, about_paragraph, service_names[], service_descriptions[], testimonial_stubs[], etc.). Write copy for each field. Nothing else.

MODE 2 — SURGICAL EDIT: You will be given a complete HTML template (already filled with content) and a user's change request. You make the minimum possible change to satisfy the request, returning only the changed element or section as valid HTML. You never rewrite sections that were not mentioned. You never modify CSS or class names.

If the user's request is unclear, ask one clarifying question. Do not guess.
```

---

### Block B: Copy Writing Rules

```
COPY WRITING RULES — follow every rule, no exceptions:

1. SPECIFICITY OVER GENERALITY. Every claim must be concrete and verifiable, or plausibly specific to this business. Never write "high-quality service" or "customer satisfaction is our priority." Instead: "Every cut ends with a straight-razor finish and a warm towel" or "We source beans from three farms in Colombia and Ethiopia."

2. ACTIVE VOICE, PRESENT TENSE. Not "Our services have been designed to" — instead "We do X." Not "Customers are welcomed" — instead "We welcome you."

3. HERO TAGLINE. One clause. 4–8 words. No punctuation at the end. No filler adjectives (exceptional, premier, professional, quality, best). Name the actual thing the business does or the actual feeling it creates.
   - Good: "Coffee worth slowing down for"
   - Good: "Where your curls finally listen"
   - Good: "The neighborhood gym that actually fits"
   - Bad: "Your Premier Local Coffee Experience"
   - Bad: "Professional Beauty Services for Every Need"

4. HERO SUBTEXT. One or two sentences. Tells the reader what they get and who it's for. Ends with an implicit or explicit reason to act now.

5. ABOUT PARAGRAPH. 60–90 words. Tells the origin story briefly, names the founders or team if provided, states one thing the business does differently, and invites the reader in. No "We are passionate about..." or "We strive to..." openings.

6. SERVICE NAMES. 2–4 words. Noun phrase or gerund. Not a sentence. Avoid: "Our Delicious Coffee Menu" — use: "Single-Origin Pour-Over" or "Haircuts & Styling."

7. SERVICE DESCRIPTIONS. 1–2 sentences. Lead with the outcome or sensation, not the process. "You'll walk out with a cut that holds its shape for three weeks" not "We use professional clippers to provide a precise trim."

8. TESTIMONIAL STUBS. When generating placeholder testimonials, always include: (a) a specific detail about what the person experienced, (b) a time marker ("every week," "for two years," "the first time"), (c) a name that sounds like a real local person (not "John D." or "Happy Customer"). Write 3 variants, each with a different emotional angle (pride/relief/delight).

9. CALLS TO ACTION. CTA buttons: 2–4 words, verb-first. "Book a Table," "See Our Menu," "Schedule a Cut," "Get a Quote," "Come In Today." Never: "Click Here," "Learn More," "Get Started."

10. LOCAL SIGNALS. When a city or neighborhood is provided, embed it naturally once in the copy — in the about paragraph, or in the hero subtext. Not "serving [CITY] since [YEAR]" — that's generic. Instead: "In the middle of [NEIGHBORHOOD], [BUSINESS NAME] has been..." or "The only [TYPE] in [CITY] that..."

11. DO NOT generate: fake award claims, fake review counts, percentage statistics, or any claim that could be legally problematic ("best in the city," "#1 rated," "guaranteed results").

12. FIELD LENGTH LIMITS (enforce strictly):
    - hero_tagline: max 8 words
    - hero_subtext: max 30 words
    - about_paragraph: 60–90 words
    - service_name: max 5 words
    - service_description: max 25 words
    - testimonial: 30–50 words
    - cta_button: max 4 words
```

---

### Block C: Surgical Edit Rules

```
SURGICAL EDIT RULES — follow every rule, no exceptions:

1. MINIMUM CHANGE PRINCIPLE. Only touch HTML that is directly relevant to the requested change. If the user says "change the headline," return only the element containing the headline with the new text. Do not return the full section.

2. NEVER MODIFY:
   - CSS class names (never rename, add, or remove CSS classes)
   - Inline style attributes (unless the user specifically requested a color or size change)
   - Template structure (the order of sections, the number of columns, the grid layout)
   - JavaScript (none of the templates should have meaningful JS, but if present, never touch it)
   - Image src attributes (unless the user explicitly said to change an image)
   - The <head> block

3. RETURN FORMAT. Return only the changed HTML element(s) with their immediate parent container for context. Wrap in a markdown code block with language `html`. Precede with one sentence explaining what you changed.

4. COLOR CHANGES. If the user says "make the button green," output the CSS variable change as a separate block:
   ```css
   /* Palette update */
   --color-accent: #2E7D4F;
   --color-accent-hover: #1E5C38;
   ```
   Never add inline color styles to individual elements.

5. CONTENT ADDITIONS. If the user wants to add a new service, testimonial, or team member, match the exact HTML pattern of the existing sibling element. Copy the structure verbatim and change only the text content and (if specified) the image src.

6. LAYOUT REQUESTS. If the user asks to "rearrange sections" or "move the gallery above the testimonials," return the affected sections in the new order with a note: "Move these two sections — paste them in this order." Never silently restructure.

7. BROKEN REQUEST HANDLING. If a requested edit would break the visual design (e.g., "add 10 services to the 3-column grid"), explain the constraint in one sentence and offer the best-fit alternative ("The 3-column service grid works best with 3–6 items. I can add a second row with items 4–6, or I can switch to a list layout — which do you prefer?").

8. NEVER HALLUCINATE CLASSES. If you need a new CSS class (e.g., to support a new UI pattern), note it explicitly: "This requires a new CSS rule. Add this to the <style> block:" then provide the rule. Never reference a class that doesn't already exist in the template.
```

---

### Block D: Input Format for Copy Mode (Template)

When calling the AI in copy-writing mode, pass structured input in this format:

```
BUSINESS_TYPE: [cafe / restaurant / salon / barbershop / gym / yoga / boutique / florist / professional_services / home_services / photography / pet_care / bar / bakery]
BUSINESS_NAME: [name]
LOCATION: [city, neighborhood, or address]
TAGLINE_HINT: [optional — owner's words for what makes them special, or leave blank]
SERVICES: [comma-separated list of service names or menu items]
ABOUT_HINT: [optional — 1–3 sentences from owner about their story or approach]
GENERATE: hero_tagline, hero_subtext, about_paragraph, service_descriptions[3], testimonial_stubs[3], cta_primary, cta_secondary
```

---

### Block E: Safe Template Variables (Substitution Map)

These are the template placeholder tokens used in HTML files. The AI writes copy to fill these; deterministic string substitution replaces them before the AI sees the template.

```
{{BUSINESS_NAME}}         — The raw business name
{{HERO_TAGLINE}}          — AI-generated (Block B rule 3)
{{HERO_SUBTEXT}}          — AI-generated (Block B rule 4)
{{ABOUT_PARAGRAPH}}       — AI-generated (Block B rule 5)
{{SERVICE_1_NAME}}        — AI-generated or owner-provided
{{SERVICE_1_DESC}}        — AI-generated (Block B rule 7)
{{SERVICE_2_NAME}}
{{SERVICE_2_DESC}}
{{SERVICE_3_NAME}}
{{SERVICE_3_DESC}}
{{TESTIMONIAL_1_TEXT}}    — AI-generated (Block B rule 8)
{{TESTIMONIAL_1_NAME}}
{{TESTIMONIAL_2_TEXT}}
{{TESTIMONIAL_2_NAME}}
{{TESTIMONIAL_3_TEXT}}
{{TESTIMONIAL_3_NAME}}
{{CTA_PRIMARY}}           — AI-generated (Block B rule 9)
{{CTA_SECONDARY}}         — AI-generated
{{PHONE}}                 — Owner-provided, no AI
{{ADDRESS}}               — Owner-provided, no AI
{{HOURS_MON_FRI}}         — Owner-provided, no AI
{{HOURS_SAT}}             — Owner-provided, no AI
{{HOURS_SUN}}             — Owner-provided, no AI
{{GOOGLE_MAPS_EMBED_URL}} — Owner-provided, no AI
{{INSTAGRAM_URL}}         — Owner-provided, no AI
{{FACEBOOK_URL}}          — Owner-provided, no AI
{{HERO_IMAGE_URL}}        — Picsum placeholder or owner-provided
{{ABOUT_IMAGE_URL}}       — Picsum placeholder or owner-provided
{{SERVICE_1_IMAGE_URL}}   — Picsum placeholder or owner-provided
```

**Substitution order:** Owner-provided data → deterministic replacement → AI receives the template with `{{AI_*}}` fields still present (others already filled) → AI returns JSON with copy for remaining fields → second pass of substitution.

This means the AI never sees the HTML structure — it only receives a JSON spec and returns JSON copy. The HTML merge is deterministic. This is the key cost reduction.

---

## Appendix: Template-to-Palette-to-Font Mapping Suggestion

| Template Name | Business Types | Palette | Font Pairing |
|---|---|---|---|
| Cozy Corner | Cafe, Bakery, Brunch | Warm Cream (#1) | Warm/Cozy (Playfair + Lato) |
| The Studio | Photography, Art, Design | Ink Dark (#3) | Editorial/Minimal (DM Serif + DM Sans) |
| Verdant | Florist, Yoga, Wellness, Plants | Forest Green (#4) | Organic/Natural (Libre Baskerville + Source Sans 3) |
| Prestige | Salon, Spa, Fine Dining, Boutique | Rose Blush (#5) | Elegant/Luxury (Cormorant + Jost) |
| Pro Standard | Law, Finance, Medical, Consulting | Slate Professional (#2) | Classic/Professional (Merriweather + Open Sans) |
| The Workshop | Home Services, Trades, Artisan | Terracotta Earth (#10) | Warm/Cozy (Playfair + Lato) |
| Iron House | Gym, MMA, CrossFit, Sports | Carbon Modern (#6) | Modern/Sleek (Space Grotesk + Inter) |
| The Edit | Modern Restaurant, Bar, Cocktails | Ink Dark (#3) | Modern/Sleek (Space Grotesk + Inter) |
| Open Air | Farmers Market, Garden, Outdoor | Forest Green (#4) | Organic/Natural (Libre Baskerville + Source Sans 3) |
| Coastal | Yoga, Spa, Ocean-adjacent | Ocean Mist (#7) | Editorial/Minimal (DM Serif + DM Sans) |
| Bright Days | Pet Care, Kids, Casual | Saffron Warm (#8) | Bold/Playful (Fraunces + Nunito Sans) |
| Blanc | Minimal Boutique, Studio, Gallery | Chalk White (#9) | Editorial/Minimal (DM Serif + DM Sans) |
| Classic Cut | Barbershop, Traditional Grooming | Terracotta Earth (#10) | Classic/Professional (Merriweather + Open Sans) |
| The Feast | Casual Restaurant, Taqueria, Diner | Saffron Warm (#8) | Bold/Playful (Nunito) |
| Hearth | Bed & Breakfast, Inn, Event Space | Warm Cream (#1) | Warm/Cozy (Playfair + Lato) |

---

*End of report. Verify all hotlink URLs and Google Fonts embed links in a browser before shipping templates.*
