"use client";

import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic imports for route components
export const ListsPageClient = dynamic(
  () =>
    import("@/app/(dashboard)/list/list-page-client").then((mod) => ({
      default: mod.ListsPageClient,
    })),
  {
    loading: () => <PageSkeleton />,
    ssr: false,
  }
);

export const RecipesPageClient = dynamic(
  () => import("@/app/(dashboard)/recipes/recipes-page-client"),
  {
    loading: () => <PageSkeleton />,
    ssr: false,
  }
);

export const ProfileDetails = dynamic(
  () =>
    import("@/components/profile/profile-details").then((mod) => ({
      default: mod.ProfileDetails,
    })),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    ),
    ssr: false,
  }
);

// Dynamic imports for heavy components
export const ListDetailsDrawer = dynamic(
  () =>
    import("@/components/lists/list-details-drawer").then((mod) => ({
      default: mod.ListDetailsDrawer,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export const RecipeFormDrawer = dynamic(
  () =>
    import("@/components/recipes/recipe-form-drawer").then((mod) => ({
      default: mod.RecipeFormDrawer,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export const RecipeViewDrawer = dynamic(
  () =>
    import("@/components/recipes/recipe-view-drawer").then((mod) => ({
      default: mod.RecipeViewDrawer,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export const AddListDialog = dynamic(
  () =>
    import("@/components/lists/add-list-dialog").then((mod) => ({
      default: mod.AddListDialogWrapper,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

export const ShareListDialog = dynamic(
  () =>
    import("@/components/lists/share-list-dialog").then((mod) => ({
      default: mod.ShareListDialog,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

export const ShoppingListCard = dynamic(
  () =>
    import("@/components/lists/shopping-list-card").then((mod) => ({
      default: mod.ShoppingListCard,
    })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
    ssr: false,
  }
);

export const FamilyMemberDialog = dynamic(
  () =>
    import("@/components/profile/family-member-dialog").then((mod) => ({
      default: mod.FamilyMemberDialog,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

// Dynamic imports for AI/ML components (heaviest)
export const ImageCropWorkflow = dynamic(
  () =>
    import("@/components/recipes/image-crop-workflow").then((mod) => ({
      default: mod.ImageCropWorkflow,
    })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export const ImageToTextButton = dynamic(
  () =>
    import("@/components/recipes/image-to-text-button").then((mod) => ({
      default: mod.ImageToTextButton,
    })),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false,
  }
);
