# Frontend Branding & Landing Page Structure

This document outlines the frontend file structure for branding, landing page, and site settings.

---

## 📁 Directory Structure Overview

```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/          # Shared components (buttons, modals, etc.)
│   ├── layout/          # Layout components (Navbar, Footer, Sidebar)
│   └── ...
├── constants/           # Static constants and configuration
├── pages/               # Page components
├── services/            # API service layer
├── styles/              # Global styles and CSS
└── contexts/            # React contexts (Auth, Theme, etc.)
```

---

## 🎨 Branding Files

### Constants (Static Defaults)
| File | Purpose |
|------|---------|
| `src/constants/index.js` | **Main constants file** - Contains `COMPANY_INFO`, `SERVICES`, `WHY_CHOOSE_US`, `NAVIGATION`, `STATS`, CSS classes |

**Key exports from `constants/index.js`:**
- `COMPANY_INFO` - Company name, phone (`+91 6353202177`), email, tagline, IT partner info, founder info
- `SERVICES` - Main and additional services data
- `WHY_CHOOSE_US` - Features list with icons
- `NAVIGATION` - Main nav and services dropdown items
- `STATS` - Statistics for landing page
- `CSS_CLASSES` - Reusable Tailwind class combinations

### Services (Dynamic from Backend)
| File | Purpose |
|------|---------|
| `src/services/siteSettingsService.js` | Fetches site settings from backend API (`/api/site-settings/`) |

**Key functions:**
- `getAllSettings()` - Fetches all site settings
- `getBrandingSettings()` - Logo, company info, phone, social links
- `getThemeSettings()` - Colors, typography
- `getHeroSettings()` - Hero section content
- `getNavbarSettings()` - Navbar configuration
- `getTestimonials()` - Customer testimonials
- `getStatistics()` - Stats for landing page

---

## 🏠 Landing Page

### Main File
| File | Purpose |
|------|---------|
| `src/pages/Landing.jsx` | **Main landing page** (~800 lines) |

### Landing Page Sections (in order)
1. **Floating CTA Bar** - Sticky bottom bar with Book Now, Call Us, WhatsApp buttons
2. **Hero Section** - Main headline, CTA buttons, trust badges, hero image
3. **Statistics Section** - Patients treated, success rate, experts count
4. **Process Section** - How PhysioWay works (4 steps)
5. **Services Section** - Featured services grid
6. **Testimonials Section** - Customer reviews carousel
7. **Why Choose Us Section** - Features grid + AI Integration card
8. **CTA Section** - Final call-to-action

### Landing Page Dependencies
- Uses `useIntersectionObserver` hook for scroll animations
- Fetches data from `siteSettingsService`
- Falls back to `constants/index.js` if backend unavailable

---

## 🧭 Layout Components

| File | Purpose |
|------|---------|
| `src/components/layout/Navbar.jsx` | Top navigation bar with logo, menu, phone, auth buttons |
| `src/components/layout/Footer.jsx` | Footer with links, contact info, CodingBull partner section |
| `src/components/layout/Sidebar.jsx` | Dashboard sidebar navigation |

### Navbar Features
- Dynamic logo from `getBrandingSettings()`
- Phone number from backend or `COMPANY_INFO.phone`
- Services dropdown menu
- Mobile responsive hamburger menu
- Sticky on scroll with blur effect

### Footer Features
- Emergency support banner
- Services, Company, Support link columns
- Contact info (phone, email, working hours)
- **CodingBull Technology Partner** section (premium design)
- Copyright with tech partner credit

---

## 🎯 Common Components

| File | Purpose |
|------|---------|
| `src/components/common/WhatsAppButton.jsx` | Floating WhatsApp button (currently unused - integrated in sticky bar) |

---

## 🔧 Backend API Endpoints (Site Settings)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/site-settings/` | All settings combined |
| `GET /api/site-settings/branding/` | Logo, company info, phone |
| `GET /api/site-settings/navbar/` | Navbar configuration |
| `GET /api/site-settings/hero/` | Hero section content |
| `GET /api/site-settings/theme/` | Colors and typography |
| `GET /api/site-settings/testimonials/` | Customer testimonials |
| `GET /api/site-settings/statistics/` | Stats data |

**Note:** All site-settings endpoints are **public** (no authentication required).

---

## 📱 Key Phone Number Locations

The phone number `+91 63532 02177` is configured in:

1. **Backend Model Default:** `backend/site_settings/models.py` → `BrandingSettings.phone`
2. **Frontend Constant:** `frontend/src/constants/index.js` → `COMPANY_INFO.phone`
3. **Frontend Service Fallback:** `frontend/src/services/siteSettingsService.js` → `DEFAULT_SETTINGS.branding.phone`

---

## 🎨 Styling

| File | Purpose |
|------|---------|
| `src/styles/gradient-text-fix.css` | Fixes for gradient text rendering |
| `tailwind.config.js` | Tailwind CSS configuration with custom colors |

### Color Palette (from Tailwind config)
- **Primary:** Blue shades (`primary-500: #3b82f6`)
- **Secondary:** Orange shades (`secondary-500: #f97316`)

---

## 🔄 Data Flow

```
Backend (Django)
    ↓
/api/site-settings/* endpoints
    ↓
siteSettingsService.js (fetches & caches)
    ↓
Landing.jsx / Navbar.jsx / Footer.jsx
    ↓
Falls back to constants/index.js if API fails
```

---

## 📝 Adding New Branding Elements

1. **Add to Backend Model:** `backend/site_settings/models.py`
2. **Add to Serializer:** `backend/site_settings/serializers.py`
3. **Add to View:** `backend/site_settings/views.py`
4. **Add Frontend Fallback:** `frontend/src/constants/index.js`
5. **Update Service:** `frontend/src/services/siteSettingsService.js`
6. **Use in Components:** Import from service or constants

---

*Last Updated: December 2024*
