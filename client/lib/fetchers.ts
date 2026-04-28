import type {
  AvailabilityEntry,
  InventoryNode,
  Movement,
  Product,
} from "@/server/types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const fetchInventory = (params?: { low_stock?: boolean; platform_id?: number }) => {
  const qs = new URLSearchParams();
  if (params?.low_stock) qs.set("low_stock", "true");
  if (params?.platform_id) qs.set("platform_id", String(params.platform_id));
  const query = qs.toString();
  return getJSON<{ nodes: InventoryNode[] }>(`/api/inventory${query ? `?${query}` : ""}`);
};

export const fetchMovements = (limit = 100) =>
  getJSON<{
    movements: (Movement & {
      sku: string;
      product_name: string;
      user_name: string | null;
    })[];
  }>(`/api/movements?limit=${limit}`);

export const fetchSuppliers = () =>
  getJSON<{
    suppliers: Array<{
      id: number;
      name: string;
      lead_time_days: number;
      reliability_score: number;
      contact_email: string | null;
      products_supplied: number;
    }>;
  }>("/api/suppliers");

export const fetchProduct = (id: number) =>
  getJSON<{ product: Product & { availability: AvailabilityEntry[] } }>(
    `/api/products/${id}/full`,
  );

export const fetchSearch = (q: string) =>
  getJSON<{ products: Product[]; query: string }>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
