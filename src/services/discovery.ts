
export interface FlipDeal {
  id: string;
  name: string;
  brand: string;
  estimatedValue: number;
  dealPrice: number;
  platform: 'Vinted' | 'Depop' | 'eBay';
  imageUrl: string;
  additionalPhotos?: string[];
  link: string;
  confidence: number;
  profitPotential: number;
  category: string;
  seller?: {
    name: string;
    rating: number;
    reviews: number;
    avatar?: string;
  };
  location?: string;
  description?: string;
}

const getPlatformLink = (platform: string, query: string, maxPrice: number) => {
  const encodedQuery = encodeURIComponent(query);
  switch (platform.toLowerCase()) {
    case 'vinted':
      return `https://www.vinted.it/catalog?search_text=${encodedQuery}&price_to=${maxPrice}&order=price_low_to_high`;
    case 'ebay':
      return `https://www.ebay.it/sch/i.html?_nkw=${encodedQuery}&_udhi=${maxPrice}&_sop=15`;
    case 'depop':
      return `https://www.depop.com/search/?q=${encodedQuery}&max_price=${maxPrice}`;
    default:
      return '#';
  }
};

const MOCK_DEALS: FlipDeal[] = [
  {
    id: '1',
    name: 'Jordan 4 Retro Military Blue (2024)',
    brand: 'Nike / Jordan',
    estimatedValue: 320,
    dealPrice: 185,
    platform: 'Vinted',
    imageUrl: 'https://images.unsplash.com/photo-1597040966242-488c783a7403?q=80&w=800&auto=format&fit=crop',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=400',
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=400'
    ],
    link: getPlatformLink('Vinted', 'Jordan 4 Retro Military Blue 2024', 190),
    confidence: 0.92,
    profitPotential: 135,
    category: 'Jordan 4',
    seller: { name: 'SneakerHead92', rating: 4.8, reviews: 124, avatar: 'https://i.pravatar.cc/150?u=1' },
    location: 'Milano, Italia',
    description: 'Nuove mai indossate, con scatola originale. Ricevute come regalo ma taglia errata. Spedizione veloce.'
  },
  {
    id: '2',
    name: 'Stone Island Ghost Piece Crewneck',
    brand: 'Stone Island',
    estimatedValue: 450,
    dealPrice: 260,
    platform: 'Depop',
    imageUrl: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=800&auto=format&fit=crop',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=400'
    ],
    link: getPlatformLink('Depop', 'Stone Island Ghost Piece', 270),
    confidence: 0.88,
    profitPotential: 190,
    category: 'Stone Island',
    seller: { name: 'VintageVault', rating: 4.9, reviews: 56, avatar: 'https://i.pravatar.cc/150?u=2' },
    location: 'London, UK',
    description: 'Ghost Piece in ottime condizioni, indossato pochissime volte. Badge originale incluso.'
  },
  {
    id: '3',
    name: 'Technics SL-1200MK2 Turntable',
    brand: 'Technics',
    estimatedValue: 650,
    dealPrice: 380,
    platform: 'eBay',
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800&auto=format&fit=crop',
    link: getPlatformLink('eBay', 'Technics SL-1200MK2', 400),
    confidence: 0.95,
    profitPotential: 270,
    category: 'Vinyl Records',
    seller: { name: 'AudioRelics', rating: 5.0, reviews: 890, avatar: 'https://i.pravatar.cc/150?u=3' },
    location: 'Berlin, Germany',
    description: 'Perfettamente funzionante, revisionato di recente. Segni di usura minimi.'
  }
];

export const fetchHotDeals = async (tag?: string): Promise<FlipDeal[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (!tag) return MOCK_DEALS;

  // 1. Check if it matches a predefined category
  const filtered = MOCK_DEALS.filter(d => 
    d.category.toLowerCase().includes(tag.toLowerCase()) || 
    d.brand.toLowerCase().includes(tag.toLowerCase())
  );

  if (filtered.length > 0) return filtered;

  // 2. If no match, generate simulated results for the custom theme
  const simulatedResults: FlipDeal[] = [
    {
      id: `sim-${Date.now()}-1`,
      name: `${tag} Selection`,
      brand: tag,
      estimatedValue: 300,
      dealPrice: 150,
      platform: 'Vinted',
      imageUrl: `https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop`,
      link: getPlatformLink('Vinted', tag, 160),
      confidence: 0.85,
      profitPotential: 150,
      category: tag,
      seller: { name: 'ExpertSeller', rating: 4.7, reviews: 42, avatar: 'https://i.pravatar.cc/150?u=10' },
      location: 'Europe',
      description: `Occasione per ${tag}. Filtro prezzo applicato (<160€).`
    }
  ];

  return simulatedResults;
};

export const getTrendingSearches = () => [
  "Jordan 4", "Stone Island", "Vintage Carhartt", "Vinyl Records", "Dunk Low"
];
