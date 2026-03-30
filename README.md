# Massage Therapy Service Landing Page

A professional static landing page for a massage therapy service company designed to showcase services, provide essential business information, and encourage customer inquiries. The page serves as the primary web presence to attract new clients and establish credibility in the wellness industry.

## Overview

This landing page features a modern, wellness-focused design with:
- Scroll-triggered reveals for engaging content presentation
- Social proof integration with testimonials
- Photography-centric design with professional wellness imagery
- Minimalist typography with ample whitespace
- Morphing button interactions for premium feel
- Skeleton loading states for optimal perceived performance

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development Commands

### Start Development Server

```bash
npm run dev
```

This launches a live-reload development server at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This command:
- Optimizes CSS with PostCSS (autoprefixer, minification)
- Minifies and bundles JavaScript files
- Copies HTML and assets to the `dist/` directory

### Lint JavaScript

```bash
npm run lint
```

Checks JavaScript files for code quality issues using ESLint.

## Project Structure

```
massage-therapy-service-landing-page/
├── index.html              # Main landing page
├── styles/
│   ├── base.css           # CSS reset, variables, typography
│   ├── components.css     # Reusable component styles
│   └── animations.css     # Animation keyframes and transitions
├── scripts/
│   ├── main.js            # Core initialization
│   ├── animations.js      # Scroll-triggered animations
│   └── interactions.js    # User interactions and form handling
├── assets/                # Images and media files
├── dist/                  # Production build output
└── package.json           # Project dependencies and scripts
```

## Features

- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Accessibility**: ARIA labels, keyboard navigation, reduced motion support
- **Performance**: Optimized images, lazy loading, efficient animations
- **SEO Ready**: Semantic HTML, meta tags, structured data
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Deployment Process

The `dist/` directory contains production-ready files after running `npm run build`. Deploy this directory to any static hosting service:

- **Netlify**: Drag and drop `dist/` folder or connect Git repository
- **Vercel**: Import project and set build command to `npm run build`
- **GitHub Pages**: Push `dist/` contents to `gh-pages` branch
- **Traditional Hosting**: Upload `dist/` contents via FTP/SFTP

## Configuration

### PostCSS Configuration

PostCSS processes CSS files with autoprefixer and cssnano. Configuration is in `postcss.config.js`.

### ESLint Configuration

ESLint checks JavaScript code quality. Configuration can be customized in `.eslintrc.js` or `eslint.config.js`.

## Browser Compatibility

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## Contributing

This is a production landing page project. For modifications:

1. Create a feature branch
2. Make your changes
3. Test thoroughly (npm run dev)
4. Build production files (npm run build)
5. Submit for review

## License

MIT License - See LICENSE file for details

## Support

For questions or issues with the landing page, please contact the development team.
