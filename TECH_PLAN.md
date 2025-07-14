# 🛠️ Grocery List App - Tech Plan

## 📋 Tech Stack

### **Frontend**

- **Next.js 15** - Latest App Router with Server Components
- **React 19** - Latest React version
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui + Radix UI** - Accessible component library
- **Lucide React** - Modern icon library

### **Authentication**

- **NextAuth.js v5** - Authentication framework
- **Google OAuth** - Sign in with Google account
- **JWT Sessions** - Stateless session management

### **Database & Backend**

- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Production database
- **Next.js API Routes** - Backend endpoints

### **State Management**

- **Zustand** - Global state management
- **React Hook Form** - Form state handling
- **Zod** - Schema validation

### **Development Tools**

- **ESLint + Prettier** - Code quality
- **TypeScript** - Type checking
- **Prisma Studio** - Database management

---

## 🚀 Core Features Plan

### **1. Authentication System**

- Google OAuth sign-in/sign-out
- Protected routes for authenticated users
- User session management
- Profile data from Google account

### **2. Database Models**

- **User** - Basic user information from Google
- **Household** - Family group management
- **ShoppingList** - User's shopping lists
- **ShoppingItem** - Individual items in lists
- **Recipe** - User's saved recipes
- **RecipeIngredient** - Ingredients for each recipe

### **3. Three Main Pages**

- **Lists Page** - Grid of shopping list cards
- **Recipes Page** - Grid of recipe cards with "Add to List" function
- **Profile Page** - Family member management and user settings

### **4. Key Functionality**

- Create/edit/delete shopping lists
- Add/remove/complete items in lists
- Save and manage recipes
- One-click recipe-to-shopping-list conversion
- Family sharing of lists and recipes
- Progress tracking for shopping lists

---

## 📱 App Structure

```
src/
├── app/
│   ├── (auth)/          # Sign in/out pages
│   ├── (dashboard)/     # Main app (3 pages)
│   └── api/             # Backend endpoints
├── components/
│   ├── ui/              # Shadcn components
│   ├── lists/           # List components
│   ├── recipes/         # Recipe components
│   └── profile/         # Profile components
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Database client
│   └── utils.ts         # Utilities
├── stores/
│   ├── lists-store.ts   # Lists state
│   ├── recipes-store.ts # Recipes state
│   └── profile-store.ts # Profile state
└── types/
    └── index.ts         # TypeScript interfaces
```

---

## 🚀 Detailed Phase Plan

### **Phase 1: Project Setup & Foundation** (Week 1)

**Goal:** Get the basic project structure ready

- Initialize Next.js 15 project with TypeScript, Tailwind, ESLint
- Install and configure Shadcn/ui components
- Setup Prisma with PostgreSQL database
- Configure NextAuth.js v5 with Google OAuth
- Create organized folder structure for components, lib, stores

**Deliverables:**

- Working Next.js 15 project
- Database connection established
- Google OAuth configured
- Basic project structure in place

### **Phase 2: Database Models & Schema** (Week 1-2)

**Goal:** Define all database models and relationships

- Create User, Account, Session models for NextAuth
- Create Household, ShoppingList, ShoppingItem models
- Create Recipe, RecipeIngredient models
- Generate Prisma client and run database migrations

**Deliverables:**

- Complete database schema
- All models properly related
- Database migrations working

### **Phase 3: Authentication System** (Week 2)

**Goal:** Implement secure user authentication

- Create NextAuth configuration file with Google provider
- Create sign-in and sign-out pages
- Setup middleware for protected routes

**Deliverables:**

- Working Google OAuth login/logout
- Protected routes for authenticated users
- Session management working

### **Phase 4: Layout & Navigation** (Week 2-3)

**Goal:** Create the main app layout and navigation

- Create main dashboard layout with navigation
- Create mobile-responsive bottom navigation
- Create user avatar component with sign-out functionality

**Deliverables:**

- Main app layout complete
- Mobile navigation working
- User can navigate between 3 main pages

### **Phase 5: Lists Page Implementation** (Week 3-4)

**Goal:** Build the main shopping lists functionality

- Create shopping list card component
- Create form to add/edit shopping lists
- Create form to add/edit items in lists
- Create progress bar component for list completion
- Build main lists page with grid layout

**Deliverables:**

- Fully functional lists page
- Users can create, edit, delete lists
- Users can add, complete, remove items
- Progress tracking working

### **Phase 6: Recipes Page Implementation** (Week 4-5)

**Goal:** Build the recipes management system

- Create recipe card component
- Create form to add/edit recipes
- Create ingredient list component
- Build recipes page with grid layout

**Deliverables:**

- Fully functional recipes page
- Users can create, edit, delete recipes
- Recipe cards display properly
- Ingredient management working

### **Phase 7: Profile Page Implementation** (Week 5)

**Goal:** Build family member management

- Create family member card component
- Create form to add/edit family members
- Build profile page with user info and family management

**Deliverables:**

- Profile page complete
- Family member management working
- User can add/edit family members

### **Phase 8: API Routes & Backend** (Week 5-6)

**Goal:** Create all backend endpoints

- Create API routes for shopping lists CRUD operations
- Create API routes for recipes CRUD operations
- Create API routes for household/family management

**Deliverables:**

- All API endpoints working
- Full CRUD operations for lists, recipes, family
- Proper error handling in APIs

### **Phase 9: State Management with Zustand** (Week 6)

**Goal:** Connect frontend with global state management

- Create Zustand store for shopping lists state
- Create Zustand store for recipes state
- Create Zustand store for profile/household state
- Connect all components to Zustand stores

**Deliverables:**

- Global state management working
- All components using Zustand stores
- Optimistic updates implemented

### **Phase 10: Core Features Implementation** (Week 6-7)

**Goal:** Implement key app features

- Implement recipe-to-shopping-list conversion feature
- Implement family sharing for lists and recipes
- Implement progress tracking and completion states

**Deliverables:**

- Recipe-to-list conversion working
- Family sharing functional
- Progress tracking complete

### **Phase 11: Performance & Polish** (Week 7-8)

**Goal:** Optimize and improve user experience

- Optimize app performance and loading states
- Add comprehensive error handling and validation
- Improve mobile user experience and responsive design

**Deliverables:**

- App performance optimized
- Error handling comprehensive
- Mobile experience polished

### **Phase 12: Deployment & Production** (Week 8)

**Goal:** Deploy app to production

- Setup production PostgreSQL database
- Configure production environment variables
- Deploy application to Vercel
- Test all features in production environment

**Deliverables:**

- App deployed to production
- All features working in production
- Production database configured

---

## 📊 Project Timeline

**Total Duration:** 8 weeks (2 months)

### **Week 1:** Foundation & Database

- Phase 1: Project Setup
- Phase 2: Database Models

### **Week 2:** Authentication & Layout

- Phase 3: Authentication System
- Phase 4: Layout & Navigation

### **Week 3-4:** Core Pages

- Phase 5: Lists Page Implementation

### **Week 4-5:** Recipes & Profile

- Phase 6: Recipes Page Implementation
- Phase 7: Profile Page Implementation

### **Week 5-6:** Backend & State

- Phase 8: API Routes & Backend
- Phase 9: State Management

### **Week 6-7:** Features & Integration

- Phase 10: Core Features Implementation

### **Week 7-8:** Polish & Deploy

- Phase 11: Performance & Polish
- Phase 12: Deployment & Production

---

## ✅ Success Criteria

### **MVP (Minimum Viable Product) - Week 6**

- Users can sign in with Google
- Create and manage shopping lists
- Add/edit/complete items in lists
- Create and manage recipes
- Convert recipes to shopping lists

### **Full Feature Set - Week 8**

- Family member management
- Family sharing of lists and recipes
- Progress tracking and completion states
- Mobile-optimized experience
- Production deployment

---

**Made with ❤️ for family grocery shopping**
