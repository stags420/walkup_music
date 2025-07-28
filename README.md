# Walk-Up Music Manager

A single-page web application that integrates with Spotify Premium accounts to manage walk-up music for softball batting orders.

## Features

- Spotify Premium authentication using PKCE flow
- Player management with personalized walk-up music
- Batting order creation and management
- Game mode for real-time music playback
- Export/import functionality for data portability
- GitHub Pages deployment ready

## Development Setup

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd walk-up-music-manager
```

2. Run the setup script:
```bash
./scripts/setup.sh
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run deploy` - Deploy to GitHub Pages

### Git Hooks

This project uses git hooks to maintain code quality:

- **Pre-commit hook**: Automatically runs before each commit to:
  - Run ESLint to check for code issues
  - Execute all tests to ensure functionality
  - Verify code formatting with Prettier

If any check fails, the commit will be blocked. To bypass hooks in emergency situations:
```bash
git commit --no-verify
```

The hooks are stored in the `hooks/` directory and are automatically configured by the setup script.

### Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic and API integration
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

## Deployment

The application is configured for automatic deployment to GitHub Pages via GitHub Actions. Push to the `main` branch to trigger deployment.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages

## License

MIT