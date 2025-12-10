/**
 * Demo Data
 *
 * Sample data for demonstrating dependent fields.
 */

export interface Option {
  label: string;
  value: string;
  parentValue?: string;
}

// Countries
export const countries: Option[] = [
  { label: 'Vietnam', value: 'VN' },
  { label: 'United States', value: 'US' },
  { label: 'Japan', value: 'JP' },
];

// Provinces/States
export const provinces: Option[] = [
  // Vietnam
  { label: 'Ho Chi Minh City', value: 'HCM', parentValue: 'VN' },
  { label: 'Hanoi', value: 'HN', parentValue: 'VN' },
  { label: 'Da Nang', value: 'DN', parentValue: 'VN' },
  // USA
  { label: 'California', value: 'CA', parentValue: 'US' },
  { label: 'New York', value: 'NY', parentValue: 'US' },
  { label: 'Texas', value: 'TX', parentValue: 'US' },
  // Japan
  { label: 'Tokyo', value: 'TK', parentValue: 'JP' },
  { label: 'Osaka', value: 'OS', parentValue: 'JP' },
  { label: 'Kyoto', value: 'KY', parentValue: 'JP' },
];

// Cities/Districts
export const cities: Option[] = [
  // Ho Chi Minh City
  { label: 'District 1', value: 'D1', parentValue: 'HCM' },
  { label: 'District 2', value: 'D2', parentValue: 'HCM' },
  { label: 'District 7', value: 'D7', parentValue: 'HCM' },
  { label: 'Binh Thanh', value: 'BT', parentValue: 'HCM' },
  // Hanoi
  { label: 'Hoan Kiem', value: 'HK', parentValue: 'HN' },
  { label: 'Ba Dinh', value: 'BD', parentValue: 'HN' },
  { label: 'Dong Da', value: 'DD', parentValue: 'HN' },
  // Da Nang
  { label: 'Hai Chau', value: 'HC', parentValue: 'DN' },
  { label: 'Son Tra', value: 'ST', parentValue: 'DN' },
  // California
  { label: 'Los Angeles', value: 'LA', parentValue: 'CA' },
  { label: 'San Francisco', value: 'SF', parentValue: 'CA' },
  { label: 'San Diego', value: 'SD', parentValue: 'CA' },
  // New York
  { label: 'New York City', value: 'NYC', parentValue: 'NY' },
  { label: 'Buffalo', value: 'BUF', parentValue: 'NY' },
  // Texas
  { label: 'Houston', value: 'HOU', parentValue: 'TX' },
  { label: 'Dallas', value: 'DAL', parentValue: 'TX' },
  { label: 'Austin', value: 'AUS', parentValue: 'TX' },
  // Tokyo
  { label: 'Shibuya', value: 'SHI', parentValue: 'TK' },
  { label: 'Shinjuku', value: 'SHJ', parentValue: 'TK' },
  { label: 'Minato', value: 'MIN', parentValue: 'TK' },
  // Osaka
  { label: 'Namba', value: 'NAM', parentValue: 'OS' },
  { label: 'Umeda', value: 'UME', parentValue: 'OS' },
  // Kyoto
  { label: 'Gion', value: 'GIO', parentValue: 'KY' },
  { label: 'Arashiyama', value: 'ARA', parentValue: 'KY' },
];

// Helper to filter options by parent
export function filterByParent(options: Option[], parentValue?: string): Option[] {
  if (!parentValue) return [];
  return options.filter((opt) => opt.parentValue === parentValue);
}

// Simulate API delay
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fake async fetch
export async function fetchProvinces(countryCode: string): Promise<Option[]> {
  await delay(500);
  return filterByParent(provinces, countryCode);
}

export async function fetchCities(provinceCode: string): Promise<Option[]> {
  await delay(500);
  return filterByParent(cities, provinceCode);
}
