# Setup Guide

This guide will help you set up and customize the React template for your project.

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env .env.local
```

Edit `.env.local` with your settings:

```env
VITE_API_URL=http://localhost:8000/api
VITE_PROXY_TARGET=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app.

## Customization Checklist

### Project Information

- [ ] Update `package.json` name and version
- [ ] Update `index.html` title
- [ ] Update `README.md` with your project info
- [ ] Update `APP_NAME` in `src/config/constants.ts`

### Branding

- [ ] Replace favicon in `public/vite.svg`
- [ ] Update theme colors in `tailwind.config.js`
- [ ] Update font family in `tailwind.config.js` (default: Prompt for Thai)
- [ ] Update meta theme color in `index.html`

### API Configuration

- [ ] Update API base URL in `.env` files
- [ ] Configure API endpoints in `src/services/api.ts`
- [ ] Update API types in `src/types/index.ts`

### Authentication

- [ ] Customize User type in `src/types/index.ts`
- [ ] Update login endpoint in `src/services/api.ts`
- [ ] Modify authentication logic if needed in `src/contexts/AuthContext.tsx`

### Routes

- [ ] Add/remove routes in `src/App.tsx`
- [ ] Create new page components in `src/pages/`
- [ ] Update route constants in `src/config/constants.ts`

## Optional Features

### Add Form Handling

Install React Hook Form and Zod:

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Add Data Tables

Install TanStack Table:

```bash
npm install @tanstack/react-table
```

### Add Date Handling

Install date-fns:

```bash
npm install date-fns
```

### Add UI Component Library

Choose one:

**Option 1: NextUI (Recommended)**
```bash
npm install @nextui-org/react framer-motion
```

**Option 2: shadcn/ui**
```bash
npx shadcn-ui@latest init
```

**Option 3: Headless UI**
```bash
npm install @headlessui/react
```

### Add Icons

Install an icon library:

```bash
# Lucide React (Recommended)
npm install lucide-react

# Or React Icons
npm install react-icons
```

### Add Internationalization

Install i18next:

```bash
npm install i18next react-i18next
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t your-app-name .
```

### Run Container

```bash
docker run -p 80:80 your-app-name
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

Run:

```bash
docker-compose up -d
```

## Production Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.yourapp.com/api
VITE_PROXY_TARGET=https://api.yourapp.com
```

### Deploy to Nginx

Copy the `dist/` folder to your nginx server:

```bash
scp -r dist/* user@server:/var/www/html/
```

Nginx configuration example:

```nginx
server {
    listen 80;
    server_name yourapp.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## VSCode Setup (Recommended)

### Extensions

Install these VSCode extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Troubleshooting

### Port already in use

Change port in `vite.config.ts`:

```typescript
server: {
  port: 3000, // Change to any available port
}
```

### Module not found errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors

Clear Vite cache:

```bash
rm -rf node_modules/.vite
npm run build
```

### Type errors

Restart TypeScript server in VSCode:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "TypeScript: Restart TS Server"

## Next Steps

1. Read through the codebase to understand the structure
2. Customize the template to match your needs
3. Add your business logic and components
4. Set up CI/CD pipeline
5. Deploy to production

Happy coding!
