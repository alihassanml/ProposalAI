# Halify.ai — Design Rules

Follow these rules strictly on every page and component.

## Font
- **Inter** only — no Plus Jakarta Sans, no other fonts
- Applied globally via `font-sans` (CSS variable `--font-sans: 'Inter'`)

## Color theme (light)
All colors come from these Tailwind tokens (defined in `index.css` `@theme {}`):

| Token | Hex | Use |
|---|---|---|
| `bg-background` | `#f6fafe` | Page background |
| `bg-surface-container-lowest` | `#ffffff` | Cards, sidebar, modals |
| `bg-surface-container-low` | `#f0f4f8` | Hover states, input backgrounds |
| `bg-surface-container` | `#eaeef2` | Muted sections |
| `text-primary` / `bg-primary` | `#1d2b3e` | Headings, primary buttons |
| `text-secondary` / `bg-secondary` | `#006a61` | Accent, active nav, links |
| `bg-secondary-container` | `#86f2e4` | Active nav item background |
| `text-on-secondary-container` | `#006f66` | Active nav item text |
| `text-on-surface` | `#171c1f` | Body text |
| `text-on-surface-variant` | `#44474c` | Secondary text, labels |
| `text-outline` | `#75777d` | Placeholder, hint text |
| `border-outline-variant` | `#c5c6cd` | All borders |
| `text-error` | `#ba1a1a` | Error states |

## Card style
```css
.card { 
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
  box-shadow: 0 4px 20px -2px rgba(51, 65, 85, 0.08);
}
```
Use the `.card` utility class on all card elements.

## Rules
- **No dark backgrounds** on any page (`bg-[#050a15]`, `bg-slate-900`, etc. are banned)
- **No sparkle/Zap/AI engine icons** as decorative UI elements
- **No redundant branding** inside tool pages (sidebar handles brand)
- **No extra buttons** — only what's needed for the task
- **Inputs**: white background, `border-outline-variant`, focus ring `ring-secondary/20`
- **Primary button**: `bg-primary text-white rounded-lg`
- **Secondary button / outline**: `border-outline-variant text-primary hover:bg-surface-container-low`
- Active sidebar item: `bg-secondary-container text-on-secondary-container font-semibold`
