// Re-export from centralized schema to reduce bundle size
export {
  listSchema,
  createListSchema,
  updateListSchema,
  CreateListSchema,
} from "./index";
export type { List, CreateList, UpdateList } from "./index";
