export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: "admin" | "member";
  dietaryRestrictions?: string;
  allergies?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface ShoppingList {
  id: string;
  name: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  householdId?: string;
  items: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  listId: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  cookingTime?: number;
  servings: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  householdId?: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  recipeId: string;
}

// Form types
export interface CreateListForm {
  name: string;
}

export interface CreateItemForm {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface CreateRecipeForm {
  name: string;
  description?: string;
  instructions: string;
  cookingTime?: number;
  servings: number;
  image?: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
}

export interface CreateFamilyMemberForm {
  name: string;
  email: string;
  dietaryRestrictions?: string;
  allergies?: string;
}
