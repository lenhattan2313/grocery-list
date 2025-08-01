// Dynamic schema loader to reduce Zod bundle size

// Lazy load Zod resolver
let zodResolver: unknown = null;
let zodResolverPromise: Promise<unknown> | null = null;

export async function getZodResolver() {
  if (zodResolver) {
    return zodResolver;
  }

  if (zodResolverPromise) {
    return zodResolverPromise;
  }

  zodResolverPromise = import("@hookform/resolvers/zod").then((module) => {
    zodResolver = module.zodResolver;
    return zodResolver;
  });

  return zodResolverPromise;
}

// Dynamic form components that load Zod only when needed
export const DynamicForm = {
  AddItemForm: dynamic(() =>
    import("@/components/lists/list-details/add-item-form").then((mod) => ({
      default: mod.AddItemForm,
    }))
  ),
  RecipeForm: dynamic(() =>
    import("@/components/recipes/recipe-form-drawer").then((mod) => ({
      default: mod.RecipeFormDrawer,
    }))
  ),
  FamilyMemberForm: dynamic(() =>
    import("@/components/profile/family-member-dialog").then((mod) => ({
      default: mod.FamilyMemberDialog,
    }))
  ),
};

// Preload schemas when user is about to use forms
export function preloadSchemas() {
  if (typeof window !== "undefined") {
    getZodResolver();
  }
}

// Helper function for dynamic imports
function dynamic(importFn: () => Promise<unknown>) {
  return importFn;
}
