import { auth } from "@/lib/auth";

export default async function RecipesPage() {
  const session = await auth();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Recipes</h2>
        <p className="text-gray-600 mt-2">
          Manage your recipes and add ingredients to shopping lists
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for recipe cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">Recipe Image</span>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chicken Stir Fry
            </h3>
            <p className="text-gray-600 text-sm mb-4">30 min • 4 servings</p>
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
              Add to Shopping List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">Recipe Image</span>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pasta Carbonara
            </h3>
            <p className="text-gray-600 text-sm mb-4">20 min • 2 servings</p>
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
              Add to Shopping List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
