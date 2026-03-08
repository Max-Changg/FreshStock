export type SupplierCategory = 'Produce' | 'Dairy' | 'Dry Goods' | 'Beverages' | 'Oils';

export interface Supplier {
  name: string;
  rating: number;
  reviews: number;
  certs: string[];
  miles: number;
  products: string[];
  contact: string;
  category: SupplierCategory;
}

export const SUPPLIERS: Supplier[] = [
  {
    name: 'Herb Haven',
    rating: 4.9,
    reviews: 34,
    certs: ['Organic', 'Local'],
    miles: 2.1,
    products: ['Basil', 'Mint', 'Rosemary', 'Thyme'],
    contact: 'herbhaven@email.com',
    category: 'Produce',
  },
  {
    name: 'Sunshine Gardens',
    rating: 4.8,
    reviews: 61,
    certs: ['Organic', 'Fair Trade'],
    miles: 3.4,
    products: ['Tomatoes', 'Peppers', 'Zucchini'],
    contact: 'hello@sunshinegardens.com',
    category: 'Produce',
  },
  {
    name: 'Green Valley Farms',
    rating: 4.7,
    reviews: 48,
    certs: ['Local', 'B-Corp'],
    miles: 5.2,
    products: ['Milk', 'Cream', 'Butter'],
    contact: 'orders@greenvalley.farm',
    category: 'Dairy',
  },
  {
    name: 'Fair Trade Coffee Co.',
    rating: 4.9,
    reviews: 112,
    certs: ['Fair Trade', 'Organic'],
    miles: 12.0,
    products: ['Coffee Beans', 'Espresso Blends'],
    contact: 'supply@ftcoffee.com',
    category: 'Beverages',
  },
  {
    name: 'Local Mill',
    rating: 4.6,
    reviews: 29,
    certs: ['Local'],
    miles: 7.8,
    products: ['Wheat Flour', 'Rye Flour', 'Oat Flour'],
    contact: 'localmill@grains.com',
    category: 'Dry Goods',
  },
  {
    name: 'Happy Hens Co-op',
    rating: 5.0,
    reviews: 77,
    certs: ['Organic', 'Free Range'],
    miles: 4.0,
    products: ['Eggs', 'Duck Eggs'],
    contact: 'coop@happyhens.farm',
    category: 'Produce',
  },
];
