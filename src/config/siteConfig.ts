// Property content lives here. Confirm flagged facts against the live Airbnb listing.
// Paths are relative to public/; the app resolves them using Vite's deployment base.
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  // Add only real, owner-approved exports of the SAME photograph.
  sources?: { src: string; width: number }[];
}

export const property = {
  name: 'Blue Bliss By The Bay',
  shortName: 'Blue Bliss',
  nameSuffix: 'By The Bay',
  neighborhood: 'Tampa Heights',
  city: 'Tampa',
  state: 'Florida',
  guests: 6,
  bedrooms: 3,
  beds: 4,
  bathrooms: '2.5',
  description: 'Tampa Heights Home with room to settle in... Enjoy relaxing in the beautiful outdoor space with a cup of coffee, glass of wine/beer or a game of bocce. Walk a couple of blocks to Armature Works for fabulous food and fun! Relish in the new outdoor shower after a glorious day at the beach or on the course.',
};

// Supplied historical claims, NOT verified current claims. Badges stay hidden until
// the owner confirms each value and records a date. Never infer verification.
export const trust = {
  rating: { value: 5.0, verified: false, verifiedAt: '' },
  reviewCount: { value: 15, verified: false, verifiedAt: '' },
  superhost: { value: true, verified: false, verifiedAt: '' },
  reviewSourceNote: 'Guest comments supplied by the host. Visit Airbnb for the full, current review history.',
};

export const externalLinks = {
  airbnbListing: 'https://www.airbnb.com/rooms/1211112487690698739',
};

export const navigation = [
  { name: 'The home', href: '#the-home' },
  { name: 'Sleeping', href: '#sleeping' },
  { name: 'Neighborhood', href: '#neighborhood' },
  { name: 'Reviews', href: '#reviews' },
  { name: 'Good to know', href: '#good-to-know' },
];

export const photography = {
  albumUrl: 'https://lightroom.adobe.com/shares/86fb79cab64549df885c04ea983c2eef',
  importedAt: '2026-09-12',
  // Lightroom provides filenames, not room labels. Do not infer bedroom names.
  // Replace neutral captions/alt text below after the owner supplies a photo key.
  captionsNeedReview: true,
  // Third photo in the source album's custom order: owner-confirmed front house.
  // Shower candidates selected with local image classification, not visual review.
  // Confirm these two IDs before assigning more specific public captions.
  showerCandidates: ['dsc06560', 'dsc06562'],
  priorityIds: ['dsc06600', 'dsc06560', 'dsc06562', 'dsc06590', 'dsc06584', 'dsc06561', 'dsc06566', 'dsc06559', 'dsc06573', 'dsc06578', 'dsc06581'],
  previewIds: ['dsc06600', 'dsc06560', 'dsc06562', 'dsc06590', 'dsc06584'],
  storyIds: { outdoors: 'dsc06590', indoors: 'dsc06496', sleeping: 'dsc06475', farewell: 'dsc06566' },
};

// Conservative scene descriptions supported by local image analysis. These do
// not identify a named bedroom, a bed size, or an unconfirmed shower view.
const photoDescriptions: Record<string, { alt: string; caption: string }> = {
  dsc06600: { alt: 'Front of Blue Bliss By The Bay in Tampa Heights', caption: 'The home / Tampa Heights' },
  dsc06590: { alt: 'Outdoor table and chairs in the fenced yard at Blue Bliss', caption: 'Outside / a little room to linger' },
  dsc06584: { alt: 'Another view of the outdoor table and seating area at Blue Bliss', caption: 'Outside / space to gather' },
  dsc06496: { alt: 'Interior sitting area with a sofa and chairs at Blue Bliss', caption: 'Inside / time to unwind' },
  dsc06475: { alt: 'A bedroom at Blue Bliss By The Bay', caption: 'Stay awhile / a comfortable night' },
  dsc06566: { alt: 'Seating beside the fenced outdoor space at Blue Bliss', caption: 'One more moment / outside' },
};

// Source filenames in Lightroom's custom album order. Each has real 640/1280/2048
// WebP exports. All decoded source renditions are landscape 2048 × 1365.
const albumPhotoFiles = [
  'dsc06433', 'dsc06593', 'dsc06600', 'dsc06603', 'dsc06436', 'dsc06442',
  'dsc06549', 'dsc06445', 'dsc06448', 'dsc06451', 'dsc06548', 'dsc06454',
  'dsc06545', 'dsc06460', 'dsc06463', 'dsc06466', 'dsc06469', 'dsc06472',
  'dsc06475', 'dsc06546', 'dsc06478', 'dsc06487', 'dsc06490', 'dsc06493',
  'dsc06550', 'dsc06496', 'dsc06499', 'dsc06555', 'dsc06502', 'dsc06505',
  'dsc06508', 'dsc06556', 'dsc06511', 'dsc06552', 'dsc06514', 'dsc06523',
  'dsc06529', 'dsc06553', 'dsc06532', 'dsc06535', 'dsc06554', 'dsc06538',
  'dsc06541', 'dsc06573', 'dsc06578', 'dsc06560', 'dsc06562', 'dsc06561',
  'dsc06581', 'dsc06584', 'dsc06564', 'dsc06557', 'dsc06558', 'dsc06590',
  'dsc06559', 'dsc06566',
];

// Property photography only. No stock or neighborhood imagery.
export const galleryImages: GalleryImage[] = [
  {
    id: 'exterior',
    src: 'images/hero.avif',
    alt: 'Blue exterior of Blue Bliss By The Bay in Tampa Heights',
    caption: 'Blue Bliss By The Bay · exterior',
    width: 1440,
    height: 975,
  },
  ...albumPhotoFiles.map((id, index) => ({
    id,
    src: `images/property/${id}-2048.webp`,
    alt: photoDescriptions[id]?.alt ?? `Blue Bliss By The Bay — host-supplied property photograph ${index + 1} (${id.toUpperCase()})`,
    caption: photoDescriptions[id]?.caption ?? `Property album · ${String(index + 1).padStart(2, '0')}`,
    width: 2048,
    height: 1365,
    sources: [640, 1280, 2048].map((width) => ({ src: `images/property/${id}-${width}.webp`, width })),
  })),
].sort((a, b) => {
  const rank = (id: string) => {
    const priority = photography.priorityIds.indexOf(id);
    return priority === -1 ? photography.priorityIds.length : priority;
  };
  // Stable sort keeps the remaining photos in their existing album order.
  return rank(a.id) - rank(b.id);
});

export const bedrooms = [
  { name: 'Primary suite', bedType: '1 king bed' },
  { name: 'Seahorse room', bedType: '1 queen bed' },
  { name: 'Starfish room', bedType: '1 queen bed' },
];

export const additionalSleeping = {
  name: 'Loft',
  bedType: '1 sofa bed',
  description: 'An additional sleeping space, not a fourth bedroom. The home accommodates up to 6 guests in total.',
};

export const amenities = [
  { name: 'Private outdoor space', description: 'Coffee in the fresh air. Conversation on the fire pit deck.', icon: 'Flame' },
  { name: 'Outdoor shower & bocce', description: 'Rinse off after a beach day or a round of golf, then enjoy a game of bocce back at home.', icon: 'ShowerHead' },
  { name: 'On-site parking', description: 'Keep your car at the home between Tampa outings.', icon: 'Car' },
  { name: 'Workspace & Wi-Fi', description: 'A dedicated spot to open your laptop when work comes along.', icon: 'Laptop' },
  { name: 'Self check-in', description: 'Smart-lock entry lets you settle in without a key handoff.', icon: 'KeyRound' },
  { name: 'Comfortable evenings in', description: 'Air conditioning and a smart TV for downtime at home.', icon: 'Tv' },
] as const;

// Destination information only. Armature Works proximity supplied by owner.
export const locationHighlights = [
  { name: 'Armature Works', description: 'Walk a couple of blocks for food and fun, with something different for everyone in your group.' },
  { name: 'Tampa Riverwalk', description: 'Enjoy the city’s waterfront promenade as part of a day out in Tampa.' },
  { name: 'Hyde Park & SoHo', description: 'Explore shops and restaurants in these Tampa neighborhoods.' },
];

// Supplied quotes, names, dates and ratings preserved verbatim. Individual star
// ratings are retained for owner verification, but are not displayed as verified.
export const reviews = [
  {
    id: 1, name: 'Kevin', location: 'Michigan', date: 'February 2025', rating: 5,
    quote: 'This was one of our best family vacations. We enjoyed breakfast on the sunny back patio each morning, while the clean, turfed yard gave our kids space to play. Blue Bliss was clean, inviting, and well-equipped, with thoughtful touches.',
  },
  {
    id: 2, name: 'Nancy', location: 'Airbnb Member', date: 'March 2025', rating: 5,
    quote: 'We had an amazing time celebrating our friend\'s birthday at Blue Bliss! The house was incredibly clean and the upgraded kitchen had every item we needed for cooking. The beds were extremely comfortable and the neighbors very kind.',
  },
  {
    id: 3, name: 'Natalie', location: 'Airbnb Member', date: 'August 2024', rating: 5,
    quote: 'We had an incredible stay at Blue Bliss by the Bay! The home was spotless, beautifully decorated, and had all the amenities we could ask for. We enjoyed wine on the deck in the private backyard, the vibes were great!',
  },
  {
    id: 4, name: 'Rebecca', location: 'Asheville, North Carolina', date: 'April 2025', rating: 5,
    quote: 'Blue Bliss was perfect for our girls\' trip to the Women\'s Final Four. The home was comfortable with plenty of space for 6 in our party. Very convenient to downtown as well as nearby local restaurants. Kimberly was an amazing host!',
  },
  {
    id: 5, name: 'Milton', location: 'Bloomfield Hills, Michigan', date: 'December 2024', rating: 5,
    quote: 'Had a fantastic time staying at Blue Bliss! Great to be walkable to Armature Works and all the great restaurants and bars. The house had a great outdoor space with a gas fire for us to gather around. Highly recommend this 5 Star Getaway!',
  },
  {
    id: 6, name: 'Megan', location: 'Massapequa, New York', date: 'February 2025', rating: 5,
    quote: 'This is a wonderful place to stay! The house is very spacious and immaculate. We especially loved the beautiful backyard with a comfortable table and ambiance. Great grocery store and restaurants easily within walking distance.',
  },
];

export const houseGuidelines = [
  { question: 'How many people can stay?', answer: 'Up to 6 guests. There are 3 bedrooms with a king bed and two queen beds, plus a sofa bed in the loft. The loft is not a fourth bedroom.' },
  { question: 'How does check-in work?', answer: 'The home has smart-lock self check-in. Confirm the arrival window and checkout time on Airbnb; your host will share access instructions for your stay.' },
  { question: 'Is the home on the water?', answer: 'This is a Tampa Heights neighborhood stay, not a beachfront or waterfront home. The Riverwalk and other waterfront destinations are separate places to visit.' },
  { question: 'What are the house rules?', answer: 'Check the Airbnb listing for current rules on pets, smoking, events, and quiet hours before booking. Contact the host on Airbnb if you need clarification.' },
  { question: 'Where can I see prices and cancellation terms?', answer: 'Enter your dates and guest count on Airbnb for availability, the full price, and the cancellation policy that applies to your reservation. All bookings take place on Airbnb.' },
];

export const siteCopy = {
  bookingLabel: 'Check availability on Airbnb',
  hero: {
    eyebrow: 'Out of office, into Tampa',
    headline: 'Your Tampa',
    headlineAccent: 'launchpad.',
    description: 'Stay in Tampa Heights, close to Armature Works. Head out for food, drinks, and downtown adventures—then come home to Blue Bliss.',
    photoNote: '01 / Arrive in Tampa Heights',
    explore: 'Explore the home',
    note: 'See dates, total pricing, and booking terms on Airbnb.',
  },
  home: {
    eyebrow: '02 / Make yourself at home',
    title: 'Your Own Place. Your Own Pace.',
    description: 'Slow morning or straight out the door? Blue Bliss is your Tampa Heights launchpad, close to Armature Works and ready for your plans. Explore downtown, head to the conference or golf course, or make a day of Tampa Bay. Come back to a space that is all yours.',
    galleryEyebrow: 'The photo journal',
    galleryHeading: 'Take a look around.',
    galleryNote: 'The home, inside and out. Open any photograph to explore the full collection.',
    galleryLink: 'See the home on Airbnb',
    galleryTitle: 'Property photos',
    viewAll: 'View all',
    photoLabel: 'photos',
    jumpLabel: 'Jump to photo',
  },
  stay: {
    outdoor: { eyebrow: 'Before the city calls', title: 'First, coffee outside.', description: 'Start in your private outdoor space. Plan the day over a cup of coffee—or leave the afternoon open for bocce and a little time together.', caption: '02.1 / Start your day here' },
    indoor: { eyebrow: 'Your between-adventures address', title: 'Big day out. Easy evening in.', description: 'After downtown exploring, neighborhood drinks, or a day across Tampa Bay, settle back into your own comfortable space.', caption: '02.2 / Come back to your own place' },
    ownerNote: { eyebrow: 'A note for your stay', title: 'More than a place to drop your bags.' },
  },
  sleeping: { eyebrow: '03 / Call it a night', title: 'Good nights. Fresh starts.', description: 'Three bedrooms: a king and two queens. A separate loft sofa bed adds flexibility, not a fourth bedroom. Up to six guests in total.', caption: '03.1 / A bedroom at Blue Bliss' },
  amenities: { eyebrow: 'The useful little details', title: 'Less to think about.', note: 'View the full amenity list and any usage guidelines on Airbnb.' },
  neighborhood: {
    eyebrow: '04 / Your plans start here',
    title: 'Stay in the Heights. Go enjoy Tampa.',
    description: 'Armature Works is close to home—a couple of blocks away, as your host describes it. Start with food and drinks there, then make downtown and the wider Tampa Bay area part of your getaway.',
    note: 'Off-property experiences. Blue Bliss is in Tampa Heights, not downtown or on the waterfront. Check routes and travel times for your plans.',
    link: 'Explore the neighborhood around Armature Works',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Armature+Works+Tampa+Florida',
    featuredLabel: 'Close to home / Armature Works',
    featuredTitle: 'Your first stop, not your whole itinerary.',
    homeLabel: 'Your home base',
    awayLabel: 'Your day out',
    awayDescription: 'Armature Works · Downtown Tampa · Tampa Bay',
  },
  reviews: { eyebrow: 'Guest notes', title: 'Little moments. Lasting memories.', more: 'Read more guest comments', link: 'Read reviews on Airbnb' },
  faq: { eyebrow: 'Before you arrive', title: 'A few things to know.', description: 'A clear plan makes for an easier stay. Airbnb has the current house rules and reservation details.' },
  booking: { eyebrow: 'Make Tampa your next getaway', title: 'Make the plans.', titleAccent: 'We’re your home base.', description: 'Stay close to Armature Works in a Tampa Heights home for up to six. Choose your dates on Airbnb and let the Tampa plans begin.', note: 'See availability, total pricing, and booking terms on Airbnb. Questions? Message the host there.', caption: 'After the day out / a place that is all yours' },
  footer: { location: 'A neighborhood home in Tampa Heights, Florida.', note: 'Reservations and payments are handled on Airbnb.' },
};

// HTML metadata is generated from this object by Vite, including for social bots.
export const seoConfig = {
  title: 'Blue Bliss By The Bay | Tampa Heights Vacation Home',
  description: 'Your Tampa Heights launchpad near Armature Works: Blue Bliss By The Bay sleeps 6 with 3 bedrooms, private outdoor space, and parking. Book through Airbnb.',
  siteOrigin: 'https://danielconnolly.github.io', // Confirm production domain before launch.
  socialImage: 'images/hero.jpg',
  socialImageAlt: 'Blue Bliss By The Bay vacation home in Tampa Heights',
};

export const ownerVerification = {
  ownerSuppliedUpdates: 'September 12, 2026: outdoor shower, bocce, and a couple-of-blocks walk to Armature Works supplied by owner; third source-album photo identified as front house.',
  pending: [
    'Verify the current Airbnb rating, review count, and Superhost status before enabling each trust badge.',
    'Confirm the supplied guest quotes, dates, attribution, and permission to republish.',
    'Confirm the current arrival/checkout window, pet/smoking/event rules, quiet hours, and cancellation terms. Old supplied times (3–10 PM arrival, 11 AM departure) are intentionally not published.',
    'Confirm bedroom names, bed sizes, loft layout, parking capacity/restrictions, fire pit usage, and the listed amenities.',
    'Confirm the production domain and Airbnb listing URL.',
    'Approve the existing JPEG social preview: confirm the same property, crop, and publishing rights. Automated similarity is not owner verification.',
  ],
  photoReview: '56 Lightroom photos imported. Supply room-by-room captions/alt descriptions and map bedroom photos to the named rooms. Confirm coverage of the loft sofa bed, bathrooms, parking, and entry; no room labels were inferred from filenames.',
  outdoorPhotoReview: 'Priority order now puts dsc06600 first, then likely shower views dsc06560/dsc06562 and entertaining views dsc06590/dsc06584. Local Apple Vision classification informed the outdoor selections; confirm the two shower filenames visually. Neutral captions retained for unconfirmed images.',
};
