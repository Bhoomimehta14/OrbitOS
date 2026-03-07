# OrbitOS

A minimal, futuristic SaaS landing page for **OrbitOS** - a central intelligent workspace for different professional teams.

## Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Font:** Space Grotesk (geometric sans-serif)

## Getting Started

```bash
cd orbitos
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
orbitos/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles, design tokens, noise overlay
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   └── components/
│       ├── HeroSection.tsx   # Hero wrapper with radial glow background
│       ├── HeroTitle.tsx     # OrbitOS title
│       ├── Tagline.tsx       # Subtitle text
│       ├── DomainSelector.tsx # Domain selection with state
│       └── DomainCard.tsx    # Individual selectable card
├── tailwind.config.ts
└── package.json
```
