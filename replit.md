# Restaurant Management System

## Overview
This is a comprehensive restaurant management system with a React frontend and PHP backend API. The application provides features for menu management, order processing, inventory control, customer management, and detailed reporting.

**Current State**: Successfully configured and running on Replit
**Last Updated**: November 29, 2025

## Project Architecture

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Routing**: Hash-based routing (custom implementation using `useSyncExternalStore`)
- **Authentication**: Firebase Authentication
- **State Management**: React Context API
- **Port**: 5000 (configured for Replit webview)

### Backend
- **API**: PHP backend hosted at `https://souqstart.com/api/`
- **Database**: Remote database (accessed via PHP API)
- **API Endpoints**: Located in `/api/` directory (included in repo but points to remote server)

### Key Features
1. **Menu Management**: Product catalog with categories, tags, and promotions
2. **Order Processing**: Complete order lifecycle from placement to delivery
3. **Admin Panel**: Comprehensive dashboard for managing all aspects of the business
4. **Inventory Management**: Supplier management, purchase invoices, and sales invoices
5. **Reporting**: Sales, profit, customer, product, payment, and delivery reports
6. **User Management**: Role-based access control with custom permissions
7. **Multi-language Support**: Arabic and English (i18n in `/i18n/locales/`)
8. **Push Notifications**: Service worker for push notifications (`sw.js`)

## Directory Structure
```
├── api/                    # PHP API endpoints (points to remote server)
├── components/             # React components
│   ├── admin/             # Admin panel components
│   │   ├── pages/         # Admin page components
│   │   └── reports/       # Reporting components
│   ├── auth/              # Authentication components
│   ├── checkout/          # Checkout flow components
│   └── profile/           # User profile components
├── contexts/              # React Context providers
├── data/                  # Static data and mock data
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization
│   └── locales/           # Translation files (ar, en)
├── icons/                 # Icon assets
├── utils/                 # Utility functions and config
├── App.tsx                # Main application component
├── firebase.ts            # Firebase configuration
├── types.ts               # TypeScript type definitions
└── vite.config.ts         # Vite configuration
```

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: (Optional) Gemini API key referenced in vite.config.ts

### API Configuration
- API base URL is configured in `utils/config.ts`: `https://souqstart.com/api/`
- Firebase config is in `firebase.ts`

### Vite Configuration
- **Port**: 5000 (required for Replit)
- **Host**: 0.0.0.0 (allows external connections)
- **HMR**: Configured for Replit proxy (clientPort: 443, protocol: 'wss')
- **Alias**: `@` points to project root

## Running the Application

### Development
The workflow "Frontend Dev Server" is configured to run:
```bash
npm run dev
```
This starts the Vite development server on port 5000.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment Configuration

### Static Deployment (Production)
The application is configured for **Static Deployment** on Replit:
- **Deployment Target**: `static`
- **Build Command**: `npm run build`
- **Public Directory**: `dist`
- **Run Command**: `npx vite preview --host 0.0.0.0` (for preview only)

This configuration builds the React application into static files that are served directly from the `dist` directory. The application consumes the remote PHP API at `https://souqstart.com/api/` so no backend server is needed in the deployment.

To publish the application, click the "Publish" button in Replit and the static files will be automatically deployed.

## Dependencies

### Main Dependencies
- react: ^19.2.0
- react-dom: ^19.2.0
- react-router-dom: ^7.9.5
- firebase: ^12.4.0

### Dev Dependencies
- vite: ^6.2.0
- @vitejs/plugin-react: ^5.0.0
- typescript: ~5.8.2
- @types/node: ^22.14.0

## Recent Changes
- **November 29, 2025**: Initial Replit setup
  - Configured Vite to use port 5000 for Replit compatibility
  - Added HMR client port configuration
  - Set up Frontend Dev Server workflow
  - Installed Node.js dependencies

## User Preferences
None documented yet.

## Notes
- This is a GitHub import that has been configured for the Replit environment
- The backend API is hosted externally at `https://souqstart.com/api/`
- Firebase is used for authentication only
- The application uses hash-based routing instead of React Router's history API
- All PHP files in `/api/` are included but the application points to the remote API
