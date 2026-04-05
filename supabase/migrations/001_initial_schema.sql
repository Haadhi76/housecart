-- =============================================================
-- HouseCart — Initial Database Schema
-- =============================================================
-- Run this migration in the Supabase SQL editor.
-- Tables are created in dependency order so foreign keys resolve.
-- =============================================================

-- -----------------------------------------------
-- 1. profiles — extends auth.users
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 2. households
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 3. household_members
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

-- -----------------------------------------------
-- 4. shopping_lists
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 5. recipes  (must come BEFORE list_items for FK)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  source_url   TEXT,
  servings     INTEGER DEFAULT 4,
  notes        TEXT,
  added_by     UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 6. list_items
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.list_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  quantity     DECIMAL(10,2) DEFAULT 1,
  unit         VARCHAR(30),
  category     VARCHAR(50) DEFAULT 'other',
  is_purchased BOOLEAN DEFAULT false,
  purchased_by UUID REFERENCES public.profiles(id),
  purchased_at TIMESTAMPTZ,
  added_by     UUID NOT NULL REFERENCES public.profiles(id),
  recipe_id    UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 7. recipe_ingredients
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name      VARCHAR(200) NOT NULL,
  quantity  DECIMAL(10,2) NOT NULL,
  unit      VARCHAR(30),
  category  VARCHAR(50) DEFAULT 'other',
  position  INTEGER DEFAULT 0
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_list_items_list_purchased ON public.list_items(list_id, is_purchased);
CREATE INDEX IF NOT EXISTS idx_recipes_household         ON public.recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user    ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_households_invite_code    ON public.households(invite_code);

-- =============================================================
-- ROW-LEVEL SECURITY
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- profiles policies
-- -----------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------
-- households policies
-- -----------------------------------------------
CREATE POLICY "Members can view their households"
  ON public.households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = households.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update household"
  ON public.households FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete household"
  ON public.households FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- -----------------------------------------------
-- household_members policies
-- -----------------------------------------------
CREATE POLICY "Members can view fellow members"
  ON public.household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can add members"
  ON public.household_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_members.household_id
        AND households.owner_id = auth.uid()
    )
    OR user_id = auth.uid()  -- users can add themselves (via join function)
  );

CREATE POLICY "Owner can remove members"
  ON public.household_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_members.household_id
        AND households.owner_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- shopping_lists policies
-- -----------------------------------------------
CREATE POLICY "Members can view lists"
  ON public.shopping_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = shopping_lists.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create lists"
  ON public.shopping_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = shopping_lists.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update lists"
  ON public.shopping_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = shopping_lists.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete lists"
  ON public.shopping_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = shopping_lists.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- list_items policies
-- -----------------------------------------------
CREATE POLICY "Members can view items"
  ON public.list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      JOIN public.household_members ON household_members.household_id = shopping_lists.household_id
      WHERE shopping_lists.id = list_items.list_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add items"
  ON public.list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      JOIN public.household_members ON household_members.household_id = shopping_lists.household_id
      WHERE shopping_lists.id = list_items.list_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update items"
  ON public.list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      JOIN public.household_members ON household_members.household_id = shopping_lists.household_id
      WHERE shopping_lists.id = list_items.list_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete items"
  ON public.list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      JOIN public.household_members ON household_members.household_id = shopping_lists.household_id
      WHERE shopping_lists.id = list_items.list_id
        AND household_members.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- recipes policies
-- -----------------------------------------------
CREATE POLICY "Members can view recipes"
  ON public.recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = recipes.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = recipes.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update recipes"
  ON public.recipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = recipes.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete recipes"
  ON public.recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = recipes.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- recipe_ingredients policies
-- -----------------------------------------------
CREATE POLICY "Members can view recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      JOIN public.household_members ON household_members.household_id = recipes.household_id
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      JOIN public.household_members ON household_members.household_id = recipes.household_id
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      JOIN public.household_members ON household_members.household_id = recipes.household_id
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      JOIN public.household_members ON household_members.household_id = recipes.household_id
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
  );

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- -----------------------------------------------
-- Auto-create profile on user signup
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- Generate a random 8-character invite code
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i      INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- -----------------------------------------------
-- Join a household by invite code
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.join_household(code VARCHAR)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  target_household public.households;
BEGIN
  -- Find the household
  SELECT * INTO target_household
  FROM public.households
  WHERE invite_code = code;

  IF target_household IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = target_household.id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are already a member of this household';
  END IF;

  -- Add as member
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (target_household.id, auth.uid(), 'member');

  RETURN target_household;
END;
$$;
