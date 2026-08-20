# React Template

A modern, production-ready React template with TypeScript, Tailwind CSS, and best practices.
Make sure to always call or context this file when vibe-coding or using AI-Agents

## Features

- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React version with concurrent features
- 🔷 **TypeScript** - Full type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🛣️ **React Router** - Client-side routing
- 🔐 **Authentication** - JWT-based auth with Context API
- 📡 **Axios** - HTTP client with interceptors
- 🎯 **Zustand** - Lightweight state management
- 🧪 **ESLint & Prettier** - Code quality and formatting
- 🐳 **Docker** - Container support

## Architecture Overview

The project follows a layered architecture to separate concerns:

1.  **View Layer (`src/pages`, `src/components`)**: React components responsible for UI and state management.
2.  **Service Layer (`src/services`)**: Centralized API calls. Services import endpoints from configuration and typed responses.
3.  **Configuration Layer (`src/config`)**: Application constants, including centralized API endpoint definitions.
4.  **Type Layer (`src/types`)**: Domain-specific TypeScript definitions (e.g., Auth, Commission, Analytics).

## Project Structure

```
react-template/
├── public/              # Static assets
├── src/
├─── config/             # Global configuration & constants
├─── services/           # API integration modules
│   ├── auth.ts          # Auth services
│   └── [domain].ts      # Domain-specific services
├─── components/         # Shared UI components
├─── contexts/           # Global State (Auth, Theme)
├─── utils/              # Helper functions
├─── types/              # Type definitions
│   ├── auth.ts          # Auth types
│   ├── common.ts        # Shared types (APIResponse, Pagination)
│   └── [domain].ts      # Domain-specific types
├─── pages/              # Feature pages
│   └── Dashboard/       # Dashboard directory
│       ├── index.tsx    # Main page component
│       └── _components/ # Dashboard-specific components
│   └── Login/           # Login directory
│       ├── index.tsx    # Main page component
│       └── _components/ # Login-specific components
│   └── [Feature]/       # Feature directory
│       ├── index.tsx    # Main page component
│       └── _components/ # Feature-specific components
├── .env                 # Development environment variables
├── .env.production      # Production environment variables
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── Dockerfile           # Docker configuration * optional
```


## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or copy this template
2. Install dependencies:

```bash
npm install
```

3. Copy `.env` file and configure your environment variables:

```bash
cp .env .env.local
# Edit .env.local with your settings
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

### Linting & Formatting

Run ESLint:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

## Environment Variables

Create a `.env.local` file based on `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_PROXY_TARGET=http://localhost:8000
```

## Docker

Build the Docker image:

```bash
docker build -t react-template .
```

Run the container:

```bash
docker run -p 80:80 react-template
```

## Tech Stack

### Core
- **React 18.2** - UI library
- **TypeScript 5.2** - Type safety
- **Vite 5** - Build tool

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### Routing & State
- **React Router 6** - Client-side routing
- **Zustand 4** - State management

### HTTP & API
- **Axios 1.6** - HTTP client

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript linting

## Key Features

### Authentication

The template includes a complete authentication flow:

- Login page with form validation
- Protected routes with `ProtectedRoute` component
- JWT token management
- Axios interceptors for automatic token injection
- Auto-redirect on 401 errors

### API Service Layer

Centralized API configuration with:

- Base URL configuration
- Request/response interceptors
- Error handling
- TypeScript types for requests/responses

### Custom Hooks

- `useLocalStorage` - Sync state with localStorage
- `useFetch` - Simplified data fetching

### Utilities

- `format.ts` - Date, number, and currency formatting
- `validation.ts` - Input validation (email, phone, Thai ID)
- `logger.ts` - Structured logging

### Error Handling

- Error Boundary component for catching React errors
- Graceful error display with user-friendly messages

## Path Aliases

The template uses `@/` as an alias for the `src/` directory:

```typescript
// Instead of
import { User } from '../../../types';

// Use
import { User } from '@/types';
```

## Customization

### Change Theme Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#YOUR_COLOR',
        // ... other shades
      },
    },
  },
}
```

### Add New Routes

1.  **Create the Page Component**:
    *   Create a folder in `src/pages/` (e.g., `src/pages/NewFeature/`).
    *   Create an `index.tsx` for the main page component.
    *   (Optional) Create a `_components` folder for page-specific components.

2.  **Register the Route in `src/App.tsx`**:

    Decide if the route should be **Public** (accessible by anyone) or **Authenticated** (requires login).

    ```tsx
    <Routes>
      {/* --- Public Routes --- */}
      {/* Accessible without logging in */}
      <Route path="/login" element={<Login />} />
      <Route path="/public-page" element={<PublicPage />} />

      {/* --- Authenticated Routes --- */}
      {/* Wrapped in ProtectedRoute, requires authentication */}
      <Route element={<ProtectedRoute />}>
        {/* The ProtectedRoute uses an Outlet to render these child routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    ```

### Add New Component
Global components are self-contained or single use functional UI elements stored in `src/components/` directory.
Local components are self-contained/functional UI elements specific to each pages stored in `src/pages/_components` directory.

***Note***
Once a Global component needs to be customize, it should be moved or duplicated to Local component.

#### Global Component

1. Create a component folder in `src/components/`
2. Create a index.tsx file in the component folder
3. Import the component in the page folder

#### Local Component

1. Create a component folder in `src/pages/_components/`
2. Create a index.tsx file in the component folder
3. Import the component in the page folder



### Add API Endpoints

Add endpoints in `src/services/api.ts`:

```typescript
export const myAPI = {
  getData: async () => {
    const response = await api.get('/my-endpoint');
    return response.data;
  },
};
```

## Best Practices

1. **Use TypeScript strictly** - Enable all strict mode options
2. **Follow component structure** - Separate logic, UI, and types
3. **Use path aliases** - Import with `@/` instead of relative paths
4. **Handle errors gracefully** - Use try-catch and error boundaries
5. **Keep components small** - Split large components into smaller ones
6. **Use custom hooks** - Extract reusable logic into hooks
7. **Type everything** - Avoid `any` types
8. **Format code** - Run Prettier before committing
9. **Do not optimize prematurely.** - Use React.memo and useMemo only when necessary
10. **Do not use class components.** - Use functional components with hooks
11. **Do not use inline styles.** - Use CSS modules or Tailwind CSS
12. **Do not use inline event handlers.** - Use event delegation
13. **Keep index.tsx page modular** - Import logical components from _components directory

### Keep Different UI components separated from each other
In index.js, it might be tempting to keep all the UI code and functions in 1 file until you have 5000+ lines of code.
This is a bad practice and should be avoided.

#### Use Segmentation in the UI
Use Segmentation in the UI to make it easier to read and maintain. Keep files, function, and logic segmented from each other using the UI as a guide.

For Example: 
Dashboard Page can be broken down into 3 components: Header, Statistics, and Data Graph.
These will be store on its own file and imported to be rendered in the index.tsx file in the Dashboard folder.

```
Dashboard/       # Dashboard directory
├── index.tsx    # Main page component
└── _components/ # Dashboard-specific components
    ├── DashboardHeader.tsx
    ├── DashboardStats.tsx
```

```typescript
// index.tsx
import { DashboardHeader } from './_components/DashboardHeader';
import { DashboardStats } from './_components/DashboardStats';

export default function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
    </div>
  );
}
```

#### Use Props to pass data between components
Use Props to pass data between components. Do not use global state management for simple data.

#### When to create useContext
Create useContext when you have complex data that needs to be shared between multiple components.
For Example: User data, Theme, etc.

#### When to create custom hooks
Create custom hooks when you have complex logic that needs to be shared between multiple components.
For Example: API calls, form validation, etc.
