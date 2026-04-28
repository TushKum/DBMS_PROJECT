export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type PlatformKind = "MARKETPLACE" | "BRAND_DTC";

export type Platform = {
  id: number;
  slug: string;
  name: string;
  kind: PlatformKind;
  url: string | null;
  logo_url: string | null;
  brand_color: string | null;
};

export type AvailabilityEntry = {
  platform_slug: string;
  platform_name: string;
  kind: PlatformKind;
  brand_color: string | null;
  size: string;
  color: string;
  in_stock: boolean;
  qty: number;
  price: number;
  url: string | null;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number | null;
  category_name?: string | null;
  base_price: number;
  brand: string | null;
  poster_url: string | null;
  broll_url: string | null;
  is_hyped: boolean;
  total_on_hand?: number;
  is_low_stock?: boolean;
  daily_velocity?: number;
  platforms_in_stock?: number;
  min_price?: number;
  availability?: AvailabilityEntry[];
  created_at: string;
  updated_at: string;
};

export type InventoryNode = {
  id: number;
  platform_id: number;
  platform_slug?: string;
  platform_name?: string;
  product_id: number;
  size: string;
  color: string;
  current_quantity: number;
  reorder_level: number;
  capacity: number;
  platform_price: number | null;
  product_url: string | null;
  is_low_stock: boolean;
  last_checked_at: string;
  updated_at: string;
};

export type ActionType = "SALE" | "RESTOCK" | "RETURN" | "TRANSFER" | "ADJUSTMENT";

export type Movement = {
  id: number;
  product_id: number;
  source_node_id: number | null;
  dest_node_id: number | null;
  quantity: number;
  action_type: ActionType;
  user_id: number | null;
  notes: string | null;
  created_at: string;
};

export type ReorderSuggestion = {
  product_id: number;
  sku: string;
  name: string;
  brand: string | null;
  units_sold: number;
  daily_velocity: number;
  total_on_hand: number;
  lead_time_days: number;
  suggested_reorder_qty: number;
};
