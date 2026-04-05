import { z } from "zod";

// --- Household schemas ---

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
  invite_code: z.string().regex(/^[a-zA-Z0-9]{8}$/, "Must be exactly 8 alphanumeric characters"),
});
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;

export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

// --- Shopping List schemas ---

export const createListSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateListInput = z.infer<typeof updateListSchema>;

// --- List Item schemas ---

export const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(30).optional(),
  category: z.string().max(50).optional(),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(30).optional(),
  category: z.string().max(50).optional(),
  is_purchased: z.boolean().optional(),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// --- Recipe schemas ---

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  source_url: z.string().url().optional(),
  servings: z.number().int().min(1).max(100).optional(),
  notes: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().positive(),
        unit: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .min(1),
});
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export const updateRecipeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  servings: z.number().int().min(1).max(100).optional(),
  notes: z.string().optional(),
});
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

export const parseRecipeUrlSchema = z.object({
  url: z.string().url(),
});
export type ParseRecipeUrlInput = z.infer<typeof parseRecipeUrlSchema>;

export const addRecipeToListSchema = z.object({
  list_id: z.string().uuid(),
  servings: z.number().int().positive().min(1).max(100).optional(),
});
export type AddRecipeToListInput = z.infer<typeof addRecipeToListSchema>;
