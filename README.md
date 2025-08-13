# 🛒 Grocery App - Smart Family Shopping Companion

<div align="center">

<img src="public/icon512_rounded.png" alt="Grocery App Logo" width="120" height="120" />

**A modern, feature-rich grocery shopping app designed for families**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://grocery-list-gilt-nine.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

</div>

## 🚀 Live Demo

**Try the app now:** [https://grocery-list-gilt-nine.vercel.app/](https://grocery-list-gilt-nine.vercel.app/)

Experience all the features including:

- Shopping list management
- AI recipe generation
- Voice input functionality
- Family collaboration
- PWA installation

---

## 📱 App Overview

Grocery App is a comprehensive family shopping companion that seamlessly connects shopping lists, recipes, and family members in one beautiful, modern interface. Built with Next.js 15, React 19, and TypeScript, it offers a native-like experience with offline support, real-time collaboration, and AI-powered features.

### 🎯 Key Benefits

- **Family-Focused Design** - Perfect for household shopping coordination
- **Recipe Integration** - Convert recipes to shopping lists with one click
- **AI-Powered Features** - Generate recipes and smart suggestions
- **Voice & Image Input** - Add items using voice commands or photo OCR
- **Real-time Collaboration** - Live updates across family members
- **Offline Support** - Works without internet connection
- **PWA Ready** - Install as a native app on any device
- **Push Notifications** - Smart reminders and shopping alerts

---

## ✨ Core Features

### 🏠 **Shopping Lists Management**

- **Smart List Creation** - Create and organize multiple shopping lists
- **Item Management** - Add, edit, complete, and remove items with quantities
- **Progress Tracking** - Visual progress indicators for list completion
- **Smart Suggestions** - AI-powered item suggestions based on categories
- **Voice Input** - Add items using natural voice commands
- **Image OCR** - Extract items from photos of receipts or handwritten lists
- **List Sharing** - Share lists with family members for collaborative shopping
- **Reminders** - Set custom reminders for shopping trips

### 👨‍🍳 **Recipe Management**

- **Recipe Collection** - Save and organize your favorite recipes
- **AI Recipe Generation** - Generate recipes from simple prompts using GPT-4
- **One-Click Shopping** - Convert recipe ingredients to shopping lists instantly
- **Recipe Sharing** - Share recipes with family members
- **Image Import** - Import recipe instructions from photos using OCR
- **Cooking Time & Servings** - Track preparation time and serving sizes
- **Ingredient Management** - Detailed ingredient lists with quantities and units

### 👨‍👩‍👧‍👦 **Family & Household Management**

- **Family Profiles** - Manage family members with custom avatars
- **Dietary Preferences** - Set dietary restrictions and allergies per member
- **Role Management** - Assign shopping responsibilities and permissions
- **Household Sharing** - Share lists and recipes within your household
- **Collaborative Shopping** - Real-time updates across all family members

### 🤖 **AI & Smart Features**

- **AI Recipe Generation** - Create recipes from text prompts
- **Smart Item Suggestions** - Context-aware grocery item recommendations
- **Voice Recognition** - Natural language processing for voice input
- **Image Text Extraction** - OCR technology for photo-based input
- **Smart Reminders** - Intelligent shopping reminder system

### 📱 **Progressive Web App (PWA)**

- **Native App Experience** - Install on home screen like a native app
- **Offline Functionality** - Full offline support with data synchronization
- **Push Notifications** - Real-time notifications for reminders and updates
- **Background Sync** - Automatic data synchronization when online
- **Cross-Platform** - Works on iOS, Android, and desktop

### 🔄 **Real-time Collaboration**

- **Live Updates** - Real-time synchronization across devices
- **Pusher Integration** - Instant updates for family members
- **Conflict Resolution** - Smart handling of simultaneous edits
- **Activity Tracking** - Monitor changes and updates in real-time

### 🔔 **Smart Notifications**

- **Push Notifications** - Browser-based push notifications
- **Shopping Reminders** - Customizable reminder system
- **Family Alerts** - Notify family members of list changes
- **Cron Jobs** - Automated reminder processing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Google Cloud Vision API** (for OCR features)
- **OpenAI API** (for AI recipe generation)
- **Pusher** (for real-time features)
- **VAPID Keys** (for push notifications)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/lenhattan2313/grocery-list.git
   cd grocery-list
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables in `.env.local`:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/grocery_app"

   # Authentication
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"

   # AI Services
   GITHUB_TOKEN="your-openai-api-key"

   # Google Cloud Vision (OCR)
   GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

   # Real-time (Pusher)
   PUSHER_APP_ID="your-pusher-app-id"
   PUSHER_SECRET="your-pusher-secret"
   NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
   NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"

   # Push Notifications
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
   VAPID_PRIVATE_KEY="your-vapid-private-key"
   VAPID_SUBJECT="mailto:your-email@example.com"

   # Cron Jobs
   CRON_SECRET_TOKEN="your-cron-secret"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📱 App Screenshots

<div align="center">

### Shopping Lists & Recipe Management

|                                          Shopping Lists                                           |                                  Recipe Management                                  |
| :-----------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------: |
| <img src="public/screenshots/shopping-lists.png" alt="Shopping Lists" width="280" height="560" /> | <img src="public/screenshots/recipes.png" alt="Recipes" width="280" height="560" /> |

### Family Profile & Voice Input

|                                   Family Profile                                    |                                         Voice Input                                         |
| :---------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
| <img src="public/screenshots/profile.png" alt="Profile" width="280" height="560" /> | <img src="public/screenshots/voice-input.png" alt="Voice Input" width="280" height="560" /> |

### AI Recipe Generation

<img src="public/screenshots/ai-recipes.png" alt="AI Recipes" width="280" height="560" />

</div>

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Real-time**: Pusher for live updates
- **AI Services**: OpenAI GPT-4 for recipe generation
- **OCR**: Google Cloud Vision API
- **PWA**: Next-PWA with service workers
- **State Management**: Zustand + React Query
- **Push Notifications**: Web Push API with VAPID

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   ├── api/               # API routes
│   └── actions/           # Server actions
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── lists/            # Shopping list components
│   ├── recipes/          # Recipe components
│   └── profile/          # Profile components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create and apply migrations

# Analysis
npm run build:analyze    # Analyze bundle size
```

### Key Development Features

- **Hot Reload** - Instant updates during development
- **Type Safety** - Full TypeScript coverage
- **ESLint** - Code quality and consistency
- **Prettier** - Automatic code formatting
- **Bundle Analysis** - Monitor app performance
- **Prisma Studio** - Visual database management

---

## 🚀 Deployment

### Vercel (Recommended)

This app is currently deployed on Vercel: [https://grocery-list-gilt-nine.vercel.app/](https://grocery-list-gilt-nine.vercel.app/)

To deploy your own instance:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on every push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **DigitalOcean** - App Platform
- **AWS** - Amplify or EC2
- **Google Cloud** - Cloud Run

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive tests
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Vercel** - For hosting and deployment
- **Shadcn/ui** - For beautiful UI components
- **OpenAI** - For AI-powered features
- **Google Cloud** - For OCR capabilities

---
