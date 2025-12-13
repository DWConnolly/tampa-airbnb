// ==========================================
// Blue Bliss By The Bay — Site Configuration
// Tropical Mediterranean Elegance
// ==========================================

export interface PropertyDetails {
  name: string;
  tagline: string;
  description: string;
  neighborhood: string;
  city: string;
  state: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: string;
  rating: number;
  reviewCount: number;
  superhostStatus: boolean;
}

export interface Bedroom {
  name: string;
  bedType: string;
  description: string;
  icon: string;
}

export interface Amenity {
  name: string;
  description: string;
  icon: string;
  category: 'essentials' | 'comfort' | 'convenience' | 'outdoor';
}

export interface LocationHighlight {
  name: string;
  distance: string;
  description: string;
  icon: string;
}

export interface Review {
  id: number;
  name: string;
  location?: string;
  date: string;
  rating: number;
  quote: string;
  avatar?: string;
}

export interface HouseGuideline {
  title: string;
  description: string;
  icon: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: 'exterior' | 'interior' | 'bedroom' | 'kitchen' | 'outdoor' | 'detail';
  featured?: boolean;
}

// ==========================================
// Property Configuration
// ==========================================

export const property: PropertyDetails = {
  name: 'Blue Bliss By The Bay',
  tagline: 'Your Tropical Mediterranean Tampa Retreat',
  description: 'Discover coastal serenity in the heart of Tampa Heights. This light-filled tropical villa offers the perfect harmony of Mediterranean charm and urban convenience — a tranquil sanctuary where every detail invites relaxation.',
  neighborhood: 'Tampa Heights',
  city: 'Tampa',
  state: 'Florida',
  guests: 6,
  bedrooms: 3,
  beds: 4,
  bathrooms: '2.5',
  rating: 5.0,
  reviewCount: 15,
  superhostStatus: true,
};

export const bedrooms: Bedroom[] = [
  {
    name: 'Primary Suite',
    bedType: 'King Bed',
    description: 'Wake to morning light in this serene primary retreat',
    icon: 'Crown',
  },
  {
    name: 'Seahorse Room',
    bedType: 'Queen Bed',
    description: 'Coastal elegance meets comfortable rest',
    icon: 'Shell',
  },
  {
    name: 'Starfish Room',
    bedType: 'Queen Bed',
    description: 'A peaceful haven inspired by the sea',
    icon: 'Star',
  },
  {
    name: 'Loft Retreat',
    bedType: 'Sofa Bed',
    description: 'Additional sleeping quarters with character',
    icon: 'Home',
  },
];

export const amenities: Amenity[] = [
  {
    name: 'Gourmet Kitchen',
    description: 'Fully equipped for culinary adventures',
    icon: 'ChefHat',
    category: 'essentials',
  },
  {
    name: 'High-Speed WiFi',
    description: 'Seamless connectivity throughout',
    icon: 'Wifi',
    category: 'essentials',
  },
  {
    name: 'Dedicated Workspace',
    description: 'A quiet corner for productivity',
    icon: 'Monitor',
    category: 'convenience',
  },
  {
    name: 'Private Parking',
    description: 'Complimentary on-site parking',
    icon: 'Car',
    category: 'convenience',
  },
  {
    name: '75" Smart HDTV',
    description: 'Cinematic entertainment experience',
    icon: 'Tv',
    category: 'comfort',
  },
  {
    name: 'Fire Pit Deck',
    description: 'Evening gatherings under the stars',
    icon: 'Flame',
    category: 'outdoor',
  },
  {
    name: 'Smart Lock Entry',
    description: 'Effortless self check-in',
    icon: 'KeyRound',
    category: 'convenience',
  },
  {
    name: 'Climate Control',
    description: 'Perfect comfort in every season',
    icon: 'Thermometer',
    category: 'comfort',
  },
];

export const locationHighlights: LocationHighlight[] = [
  {
    name: 'Armature Works',
    distance: 'Steps away',
    description: 'Vibrant food hall and waterfront gathering place',
    icon: 'Utensils',
  },
  {
    name: 'Tampa Riverwalk',
    distance: 'Minutes away',
    description: 'Scenic waterfront promenade connecting downtown attractions',
    icon: 'Waves',
  },
  {
    name: 'Hyde Park & SoHo',
    distance: 'Short drive',
    description: 'Boutique shopping and acclaimed dining districts',
    icon: 'ShoppingBag',
  },
  {
    name: 'M.Bird Rooftop',
    distance: 'Minutes away',
    description: 'Stunning skyline views and craft cocktails',
    icon: 'Wine',
  },
  {
    name: 'Gulf Beaches',
    distance: '40 minutes',
    description: 'Clearwater and St. Pete\'s pristine shores',
    icon: 'Palmtree',
  },
  {
    name: 'Downtown Tampa',
    distance: 'Minutes away',
    description: 'Arts, culture, and entertainment district',
    icon: 'Building',
  },
];

export const reviews: Review[] = [
  {
    id: 1,
    name: 'Kevin',
    location: 'Michigan',
    date: 'February 2025',
    rating: 5,
    quote: 'This was one of our best family vacations. We enjoyed breakfast on the sunny back patio each morning, while the clean, turfed yard gave our kids space to play. Blue Bliss was clean, inviting, and well-equipped, with thoughtful touches.',
  },
  {
    id: 2,
    name: 'Nancy',
    location: 'Airbnb Member',
    date: 'March 2025',
    rating: 5,
    quote: 'We had an amazing time celebrating our friend\'s birthday at Blue Bliss! The house was incredibly clean and the upgraded kitchen had every item we needed for cooking. The beds were extremely comfortable and the neighbors very kind.',
  },
  {
    id: 3,
    name: 'Natalie',
    location: 'Airbnb Member',
    date: 'August 2024',
    rating: 5,
    quote: 'We had an incredible stay at Blue Bliss by the Bay! The home was spotless, beautifully decorated, and had all the amenities we could ask for. We enjoyed wine on the deck in the private backyard, the vibes were great!',
  },
  {
    id: 4,
    name: 'Rebecca',
    location: 'Asheville, North Carolina',
    date: 'April 2025',
    rating: 5,
    quote: 'Blue Bliss was perfect for our girls\' trip to the Women\'s Final Four. The home was comfortable with plenty of space for 6 in our party. Very convenient to downtown as well as nearby local restaurants. Kimberly was an amazing host!',
  },
  {
    id: 5,
    name: 'Milton',
    location: 'Bloomfield Hills, Michigan',
    date: 'December 2024',
    rating: 5,
    quote: 'Had a fantastic time staying at Blue Bliss! Great to be walkable to Armature Works and all the great restaurants and bars. The house had a great outdoor space with a gas fire for us to gather around. Highly recommend this 5 Star Getaway!',
  },
  {
    id: 6,
    name: 'Megan',
    location: 'Massapequa, New York',
    date: 'February 2025',
    rating: 5,
    quote: 'This is a wonderful place to stay! The house is very spacious and immaculate. We especially loved the beautiful backyard with a comfortable table and ambiance. Great grocery store and restaurants easily within walking distance.',
  },
];

export const houseGuidelines: HouseGuideline[] = [
  {
    title: 'Arrival Window',
    description: 'Welcome home between 3:00 PM and 10:00 PM',
    icon: 'Clock',
  },
  {
    title: 'Departure',
    description: 'Checkout by 11:00 AM to allow preparation for arriving guests',
    icon: 'LogOut',
  },
  {
    title: 'Guest Count',
    description: 'Thoughtfully designed for up to 6 guests',
    icon: 'Users',
  },
  {
    title: 'Atmosphere',
    description: 'A tranquil retreat crafted for relaxation and connection',
    icon: 'Heart',
  },
  {
    title: 'Seamless Entry',
    description: 'Smart lock provides effortless self check-in',
    icon: 'KeyRound',
  },
  {
    title: 'Neighborhood Harmony',
    description: 'Respectful quiet hours ensure serenity for all',
    icon: 'Moon',
  },
];

// Unsplash placeholder images - Tampa, Downtown, Riverwalk, coastal themes
// Property images will be added by owner
export const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: 'https://media.cntraveler.com/photos/601b10219d4d66f32970a192/16:9/w_2560%2Cc_limit/1097988940',
    alt: 'Tampa skyline and waterfront',
    category: 'exterior',
    featured: true,
  },
  {
    id: 2,
    src: 'https://hospitalitysnapshots.com/wp-content/uploads/sites/3/2019/12/M-bird-Aerial-High-to-City.jpg',
    alt: 'M.Bird rooftop with downtown Tampa skyline',
    category: 'exterior',
    featured: true,
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&q=80',
    alt: 'Florida palm trees and blue sky',
    category: 'outdoor',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    alt: 'Craft cocktails and fine dining',
    category: 'outdoor',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80',
    alt: 'Waterfront restaurant at sunset',
    category: 'exterior',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80',
    alt: 'Evening drinks with a view',
    category: 'outdoor',
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    alt: 'Florida beach and turquoise waters',
    category: 'outdoor',
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    alt: 'Gulf Coast sandy beach',
    category: 'outdoor',
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
    alt: 'Tropical palm sunset',
    category: 'outdoor',
  },
  {
    id: 10,
    src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    alt: 'Poolside Florida living',
    category: 'exterior',
  },
];

// Hero background images - Property exterior
export const heroImages = [
  '/tampa-airbnb/images/hero.jpg',
  '/tampa-airbnb/images/hero.jpg',
];

// ==========================================
// Design Tokens
// ==========================================

export const designTokens = {
  colors: {
    navy: {
      900: '#0F2C4A',
      800: '#1A4B6D',
      700: '#1E5A82',
      600: '#2B6E99',
    },
    champagne: {
      50: '#FEFDFB',
      100: '#F8F6F2',
      200: '#F0EDE6',
      300: '#E8E4DA',
    },
    gold: {
      400: '#D4A574',
      500: '#C9A068',
      600: '#B8915C',
      700: '#A07D4E',
    },
    greek: {
      400: '#5B9BD5',
      500: '#4A90D9',
      600: '#3A7FC9',
    },
    seafoam: {
      300: '#A8DADC',
      400: '#8DCACD',
      500: '#72BABD',
    },
    charcoal: {
      900: '#2C3E50',
      800: '#34495E',
      700: '#415B76',
      600: '#506A84',
    },
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    heading: "'Montserrat', system-ui, sans-serif",
    body: "'Lora', Georgia, serif",
  },
};

// ==========================================
// External Links
// ==========================================

export const externalLinks = {
  airbnbListing: 'https://www.airbnb.com/rooms/1211112487690698739',
};

// ==========================================
// Navigation Configuration
// ==========================================

export const navigation = [
  { name: 'Home', href: '#home' },
  { name: 'Location', href: '#location' },
  { name: 'Experience', href: '#experience' },
  { name: 'Amenities', href: '#amenities' },
  { name: 'Reviews', href: '#reviews' },
];

// ==========================================
// SEO Configuration
// ==========================================

export const seoConfig = {
  title: 'Blue Bliss By The Bay | Tropical Mediterranean Tampa Vacation Rental',
  description: 'Experience coastal serenity in Tampa Heights. This light-filled tropical villa offers Mediterranean charm, modern amenities, and steps-from-Armature-Works convenience. Book your tranquil retreat today.',
  keywords: 'Tampa vacation rental, Tampa Heights Airbnb, Mediterranean villa Tampa, Armature Works, Tampa Bay vacation home, luxury rental Tampa',
  ogImage: heroImages[0],
};
