// Image registry and mock inventory for Travora.

export const IMG = {
  hero: require('../assets/images/hotel/hero.jpg'),
  signin: require('../assets/images/auth/signin.jpg'),
  signup: require('../assets/images/auth/signup.jpg'),
  rooms: {
    obsidian: require('../assets/images/rooms/obsidian.jpg'),
    ivory: require('../assets/images/rooms/ivory.jpg'),
    dune: require('../assets/images/rooms/dune.jpg'),
    harbor: require('../assets/images/rooms/harbor.jpg'),
    admiral: require('../assets/images/rooms/admiral.jpg'),
    cedar: require('../assets/images/rooms/cedar.jpg'),
    skyline: require('../assets/images/rooms/skyline.jpg'),
    lagoon: require('../assets/images/rooms/lagoon.jpg'),
    palm: require('../assets/images/rooms/palm.jpg'),
    coral: require('../assets/images/rooms/coral.jpg'),
  },
  flight: {
    economy: require('../assets/images/flight/economy.jpg'),
    economy2: require('../assets/images/flight/economy2.jpg'),
    business: require('../assets/images/flight/business.jpg'),
    first: require('../assets/images/flight/first.jpg'),
    lounge: require('../assets/images/flight/lounge.jpg'),
  },
  train: {
    main: require('../assets/images/train/main.jpg'),
    economy: require('../assets/images/train/economy.jpg'),
    economy2: require('../assets/images/train/economy2.jpg'),
    business: require('../assets/images/train/business.jpg'),
    business2: require('../assets/images/train/business2.jpg'),
    first: require('../assets/images/train/first.jpg'),
    first2: require('../assets/images/train/first2.jpg'),
  },
  cars: {
    bentley: require('../assets/images/cars/bentley.webp'),
    alphard: require('../assets/images/cars/alphard.webp'),
    panamera: require('../assets/images/cars/panamera.webp'),
    taycan: require('../assets/images/cars/taycan.webp'),
    maybach: require('../assets/images/cars/maybach.webp'),
    gwagon: require('../assets/images/cars/gwagon.webp'),
    rangerover: require('../assets/images/cars/rangerover.webp'),
  },
  bus: {
    standard: require('../assets/images/bus/standard.jpg'),
    classic: require('../assets/images/bus/classic.jpg'),
    executive: require('../assets/images/bus/executive.jpg'),
    executive2: require('../assets/images/bus/executive2.jpg'),
    royal: require('../assets/images/bus/royal.jpg'),
    vip: require('../assets/images/bus/vip.jpg'),
  },
};


export const CITIES = [
  { code: 'KHI', city: 'Karachi', country: 'Pakistan' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan' },
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'DOH', city: 'Doha', country: 'Qatar' },
  { code: 'IST', city: 'Istanbul', country: 'Türkiye' },
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'MLE', city: 'Malé', country: 'Maldives' },
];

export const GROUND_CITIES = ['Karachi', 'Hyderabad', 'Sukkur', 'Multan', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta'];

// Car pick-up cities: home cities first, then places travellers rent in around the world.
export const CAR_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan',
  'Dubai', 'Abu Dhabi', 'Doha', 'Istanbul', 'London', 'Paris', 'New York',
  'Singapore', 'Kuala Lumpur', 'Bangkok', 'Tokyo', 'Malé',
];

// Tiny deterministic PRNG so seat maps and results stay stable per trip.
export function rng(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
const clock = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
const dur = (mins) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;

export function nextDays(count = 14) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push(d);
  }
  return out;
}
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d) => {
  const x = new Date(d);
  return `${DOW[x.getDay()]}, ${x.getDate()} ${MON[x.getMonth()]}`;
};

const AIRLINES = [
  { name: 'Aurelia Air', code: 'AU', tint: '#F5B65B' },
  { name: 'Meridian', code: 'MR', tint: '#3FD8E6' },
  { name: 'Saffron Airways', code: 'SF', tint: '#FF9F6B' },
  { name: 'Northwind', code: 'NW', tint: '#9EA8FF' },
  { name: 'Zephyr Jet', code: 'ZJ', tint: '#5BE3A8' },
];
const BUS_OPS = [
  { name: 'Sandline Coaches', tint: '#EBD2A6' },
  { name: 'Royal Caravan', tint: '#F5B65B' },
  { name: 'Indus Express', tint: '#3FD8E6' },
  { name: 'Nightjar Travels', tint: '#9EA8FF' },
];
const TRAINS = [
  { name: 'Silver Arrow', tint: '#D8DEF5' },
  { name: 'Indus Crescent', tint: '#3FD8E6' },
  { name: 'Karakoram Line', tint: '#F5B65B' },
  { name: 'Night Owl Sleeper', tint: '#9EA8FF' },
];

// width / height of each car cutout
export const CAR_RATIO = { bentley: 1.8998, alphard: 1.8425, panamera: 2.0716, taycan: 1.7405, maybach: 2.3656, gwagon: 1.5714, rangerover: 1.682 };

export const CLASSES = {
  flight: [
    { id: 'economy', label: 'Economy', img: IMG.flight.economy, alt: IMG.flight.economy2, mult: 1, blurb: 'Seatback screens, 31 in pitch, meal included' },
    { id: 'business', label: 'Business', img: IMG.flight.business, alt: IMG.flight.lounge, mult: 3.4, blurb: 'Lie-flat pods, lounge bar, priority boarding' },
    { id: 'first', label: 'First', img: IMG.flight.first, alt: IMG.flight.lounge, mult: 6.2, blurb: 'Private suites with doors, onboard lounge and spa' },
  ],
  bus: [
    { id: 'standard', label: 'Standard', img: IMG.bus.standard, alt: IMG.bus.classic, mult: 1, blurb: 'Reclining seats, charging ports, AC' },
    { id: 'executive', label: 'Executive', img: IMG.bus.executive, alt: IMG.bus.executive2, mult: 1.8, blurb: '2+1 leather seats, ambient lighting, snacks' },
    { id: 'royal', label: 'Royal Lounge', img: IMG.bus.royal, alt: IMG.bus.vip, mult: 3, blurb: 'Captain recliners and a private lounge cabin' },
  ],
  train: [
    { id: 'economy', label: 'Economy', img: IMG.train.economy, alt: IMG.train.economy2, mult: 1, blurb: 'Facing seats with tables, power at every bay' },
    { id: 'business', label: 'Business', img: IMG.train.business, alt: IMG.train.business2, mult: 2.1, blurb: '2+1 armchairs, quiet coach, served meal' },
    { id: 'first', label: 'First class', img: IMG.train.first, alt: IMG.train.first2, mult: 3.4, blurb: '1+1 wide recliners, dining car and lounge access' },
  ],
};

export function searchFlights(from, to, date) {
  const r = rng(from + to + new Date(date).toDateString());
  const base = 90 + Math.floor(r() * 140);
  return Array.from({ length: 6 }, (_, i) => {
    const al = AIRLINES[Math.floor(r() * AIRLINES.length)];
    const dep = 300 + Math.floor(r() * 960);
    const len = 95 + Math.floor(r() * 300);
    const stops = r() > 0.72 ? 1 : 0;
    const price = base + Math.floor(r() * 120) + stops * -25;
    return {
      id: `${al.code}${100 + Math.floor(r() * 899)}-${i}`,
      mode: 'flight',
      operator: al.name,
      code: `${al.code} ${100 + Math.floor(r() * 899)}`,
      tint: al.tint,
      from, to, date,
      depart: clock(dep), arrive: clock(dep + len), duration: dur(len),
      stops, price,
      seatsLeft: 3 + Math.floor(r() * 20),
    };
  }).sort((a, b) => a.price - b.price);
}

export function searchGround(mode, from, to, date) {
  const r = rng(mode + from + to + new Date(date).toDateString());
  const ops = mode === 'bus' ? BUS_OPS : TRAINS;
  const base = mode === 'bus' ? 14 + Math.floor(r() * 18) : 18 + Math.floor(r() * 25);
  return Array.from({ length: 5 }, (_, i) => {
    const op = ops[Math.floor(r() * ops.length)];
    const dep = 240 + Math.floor(r() * 1080);
    const len = 180 + Math.floor(r() * 720);
    return {
      id: `${mode}-${i}-${dep}`,
      mode,
      operator: op.name,
      code: mode === 'bus' ? `Coach ${10 + Math.floor(r() * 80)}` : `Train ${1 + Math.floor(r() * 45)} Up`,
      tint: op.tint,
      from, to, date,
      depart: clock(dep), arrive: clock(dep + len), duration: dur(len),
      stops: Math.floor(r() * 4),
      price: base + Math.floor(r() * 10),
      seatsLeft: 4 + Math.floor(r() * 30),
    };
  }).sort((a, b) => a.depart.localeCompare(b.depart));
}

export const CARS = [
  { id: 'c1', name: 'Bentley SUV', make: 'Bentley', type: 'Luxury SUV', img: 'bentley', seats: 5, gear: 'Automatic', fuel: 'Hybrid', price: 240, rating: 4.9, range: '780 km' },
  { id: 'c2', name: 'Toyota Alphard', make: 'Toyota', type: 'Executive van', img: 'alphard', seats: 7, gear: 'Automatic', fuel: 'Hybrid', price: 130, rating: 4.8, range: '850 km' },
  { id: 'c3', name: 'Porsche Panamera', make: 'Porsche', type: 'Sport saloon', img: 'panamera', seats: 4, gear: 'Automatic', fuel: 'Petrol', price: 210, rating: 4.9, range: '620 km' },
  { id: 'c4', name: 'Porsche Taycan', make: 'Porsche', type: 'Electric', img: 'taycan', seats: 4, gear: 'Automatic', fuel: 'Electric', price: 230, rating: 4.8, range: '500 km' },
  { id: 'c5', name: 'Mercedes-Maybach S', make: 'Mercedes', type: 'Chauffeur saloon', img: 'maybach', seats: 4, gear: 'Automatic', fuel: 'Petrol', price: 320, rating: 5.0, range: '700 km' },
  { id: 'c6', name: 'Mercedes-AMG G 63', make: 'Mercedes', type: 'Off-road SUV', img: 'gwagon', seats: 5, gear: 'Automatic', fuel: 'Petrol', price: 290, rating: 4.9, range: '560 km' },
  { id: 'c7', name: 'Range Rover', make: 'Land Rover', type: 'Luxury SUV', img: 'rangerover', seats: 5, gear: 'Automatic', fuel: 'Hybrid', price: 260, rating: 4.9, range: '740 km' },
];
// Showroom light colours (the photos keep their real paint; the room light changes instead).
export const SHOWROOM_LIGHTS = ['#EBD2A6', '#3FD8E6', '#F5B65B', '#9EA8FF', '#FF7A8A', '#5BE3A8'];

export const HOTELS = [
  {
    id: 'h1',
    name: 'Crescent Palm Resort',
    city: 'Palm Jumeirah, Dubai',
    rating: 4.9,
    reviews: 2184,
    from: 240,
    cover: IMG.hero,
    tagline: 'Arched halls, a lantern-lit facade and an infinity pool that glows after dusk.',
    amenities: ['Infinity pool', 'Private beach', 'Spa', 'Kids club', 'Fine dining', 'Gym'],
    rooms: [
      { id: 'r1', name: 'Dune Deluxe King', img: 'dune', price: 240, size: 42, beds: '1 king bed', guests: 2, view: 'Garden view', hotspots: [{ x: 0.42, y: 0.55, label: 'Sculpted king bed with sateen linen' }, { x: 0.9, y: 0.4, label: 'Floor-to-ceiling garden doors' }, { x: 0.2, y: 0.32, label: 'Wave headboard with warm cove light' }] },
      { id: 'r2', name: 'Ivory Sea Suite', img: 'ivory', price: 310, size: 55, beds: '1 king bed', guests: 3, view: 'Partial sea', hotspots: [{ x: 0.3, y: 0.6, label: 'King bed facing the balcony' }, { x: 0.6, y: 0.3, label: 'Lounge corner with curved sofa' }, { x: 0.68, y: 0.85, label: 'Hand-tufted silk rug' }] },
      { id: 'r3', name: 'Admiral Ocean Suite', img: 'admiral', price: 420, size: 68, beds: '1 king + sofa bed', guests: 4, view: 'Ocean front', hotspots: [{ x: 0.35, y: 0.55, label: 'Navy tufted king bed' }, { x: 0.65, y: 0.75, label: 'Champagne on arrival' }, { x: 0.85, y: 0.35, label: 'Wraparound ocean terrace' }] },
      { id: 'r4', name: 'Lagoon Villa Room', img: 'lagoon', price: 520, size: 80, beds: '1 king bed', guests: 2, view: 'Lagoon & beach', hotspots: [{ x: 0.3, y: 0.55, label: 'Indigo king with throw pillows' }, { x: 0.8, y: 0.35, label: 'Sliding doors to the beach' }, { x: 0.55, y: 0.78, label: 'Sunken lounge with sea art' }] },
    ],
  },
  {
    id: 'h2',
    name: 'Harbor House',
    city: 'Istanbul, Türkiye',
    rating: 4.7,
    reviews: 964,
    from: 180,
    cover: IMG.rooms.harbor,
    tagline: 'Bosphorus light, quiet classic rooms and a rooftop that catches the ferries.',
    amenities: ['Rooftop bar', 'Hammam', 'Breakfast', 'Airport shuttle'],
    rooms: [
      { id: 'r5', name: 'Harbor Classic', img: 'harbor', price: 180, size: 36, beds: '1 king bed', guests: 2, view: 'City view', hotspots: [{ x: 0.3, y: 0.6, label: 'Pillow-top king bed' }, { x: 0.75, y: 0.35, label: 'Bay window with reading chairs' }] },
      { id: 'r6', name: 'Obsidian Loft', img: 'obsidian', price: 220, size: 44, beds: '1 king bed', guests: 2, view: 'Skyline', hotspots: [{ x: 0.6, y: 0.55, label: 'Low platform bed' }, { x: 0.3, y: 0.35, label: 'Sheer blackout drapes' }] },
      { id: 'r7', name: 'Cedar Studio', img: 'cedar', price: 160, size: 30, beds: '1 queen bed', guests: 2, view: 'Courtyard', hotspots: [{ x: 0.55, y: 0.7, label: 'Queen bed with runner' }, { x: 0.15, y: 0.6, label: 'Work desk and fast Wi-Fi' }] },
    ],
  },
  {
    id: 'h3',
    name: 'Skyline Shore',
    city: 'Malé, Maldives',
    rating: 4.8,
    reviews: 1321,
    from: 390,
    cover: IMG.rooms.coral,
    tagline: 'Overwater calm with rooms that open straight onto the reef.',
    amenities: ['Overwater deck', 'Snorkel trips', 'Sunset bar', 'Spa'],
    rooms: [
      { id: 'r8', name: 'Coral Beach Room', img: 'coral', price: 390, size: 58, beds: '1 king bed', guests: 2, view: 'Beach front', hotspots: [{ x: 0.3, y: 0.6, label: 'Driftwood king bed' }, { x: 0.82, y: 0.4, label: 'Steps to the sand' }] },
      { id: 'r9', name: 'Skyline Panorama', img: 'skyline', price: 460, size: 70, beds: '1 king bed', guests: 3, view: 'Ocean panorama', hotspots: [{ x: 0.5, y: 0.6, label: 'Centered king facing the sea' }, { x: 0.2, y: 0.45, label: 'Glass wall to the terrace' }] },
      { id: 'r10', name: 'Palm Chandelier Suite', img: 'palm', price: 540, size: 85, beds: '1 king + lounge', guests: 4, view: 'Palm grove', hotspots: [{ x: 0.5, y: 0.25, label: 'Crystal rain chandelier' }, { x: 0.45, y: 0.7, label: 'Round lounge rug' }] },
    ],
  },
  {
    id: 'h4',
    name: 'Marina Bay Haven',
    city: 'Marina Bay, Singapore',
    rating: 4.8,
    reviews: 1752,
    from: 280,
    cover: IMG.rooms.skyline,
    tagline: 'A rooftop pool above the harbour lights and rooms that look straight over the bay.',
    amenities: ['Rooftop pool', 'Spa', 'Fine dining', 'Gym', 'Concierge'],
    rooms: [
      { id: 'r11', name: 'Bay Deluxe', img: 'skyline', price: 280, size: 40, beds: '1 king bed', guests: 2, view: 'Marina view', hotspots: [{ x: 0.5, y: 0.6, label: 'King bed facing the harbour' }, { x: 0.2, y: 0.45, label: 'Floor-to-ceiling glass wall' }] },
      { id: 'r12', name: 'Garden Skyline Suite', img: 'obsidian', price: 410, size: 62, beds: '1 king + sofa bed', guests: 3, view: 'Skyline', hotspots: [{ x: 0.6, y: 0.55, label: 'Low platform king bed' }, { x: 0.3, y: 0.35, label: 'Sheer drapes over city lights' }] },
    ],
  },
  {
    id: 'h5',
    name: 'Atelier Rive Gauche',
    city: 'Saint-Germain, Paris',
    rating: 4.7,
    reviews: 1103,
    from: 310,
    cover: IMG.rooms.ivory,
    tagline: 'Cream salons, tall shuttered windows and breakfast on a quiet courtyard.',
    amenities: ['Breakfast', 'Fine dining', 'Spa', 'Concierge'],
    rooms: [
      { id: 'r13', name: 'Salon Classic', img: 'ivory', price: 310, size: 34, beds: '1 queen bed', guests: 2, view: 'Courtyard', hotspots: [{ x: 0.3, y: 0.52, label: 'Upholstered headboard and linen' }, { x: 0.6, y: 0.3, label: 'Tall shuttered windows' }] },
      { id: 'r14', name: 'Seine Junior Suite', img: 'harbor', price: 430, size: 48, beds: '1 king bed', guests: 3, view: 'River view', hotspots: [{ x: 0.3, y: 0.6, label: 'King bed with reading nook' }, { x: 0.75, y: 0.35, label: 'Bay window over the street' }] },
    ],
  },
  {
    id: 'h6',
    name: 'Hudson Yard Hotel',
    city: 'Midtown, New York',
    rating: 4.6,
    reviews: 3402,
    from: 340,
    cover: IMG.rooms.obsidian,
    tagline: 'Industrial lofts a few blocks from the park, with a lobby bar that stays open late.',
    amenities: ['Rooftop bar', 'Gym', 'Breakfast', 'Concierge'],
    rooms: [
      { id: 'r15', name: 'Loft King', img: 'obsidian', price: 340, size: 36, beds: '1 king bed', guests: 2, view: 'City view', hotspots: [{ x: 0.6, y: 0.55, label: 'Platform bed with city light' }, { x: 0.3, y: 0.35, label: 'Blackout drapes' }] },
      { id: 'r16', name: 'Park Studio', img: 'cedar', price: 290, size: 28, beds: '1 queen bed', guests: 2, view: 'Courtyard', hotspots: [{ x: 0.55, y: 0.7, label: 'Queen bed with runner' }, { x: 0.15, y: 0.6, label: 'Work desk and fast Wi-Fi' }] },
    ],
  },
  {
    id: 'h7',
    name: 'Lantern House Shibuya',
    city: 'Shibuya, Tokyo',
    rating: 4.8,
    reviews: 1486,
    from: 230,
    cover: IMG.rooms.dune,
    tagline: 'Quiet timber rooms and a tea lounge, a few minutes from the busiest crossing in the world.',
    amenities: ['Onsen', 'Breakfast', 'Gym', 'Concierge'],
    rooms: [
      { id: 'r17', name: 'Timber Double', img: 'dune', price: 230, size: 26, beds: '1 double bed', guests: 2, view: 'City view', hotspots: [{ x: 0.42, y: 0.55, label: 'Low bed with sateen linen' }, { x: 0.2, y: 0.32, label: 'Warm cove lighting' }] },
      { id: 'r18', name: 'Garden Suite', img: 'palm', price: 360, size: 44, beds: '1 king bed', guests: 3, view: 'Garden', hotspots: [{ x: 0.5, y: 0.25, label: 'Paper-shade pendant light' }, { x: 0.45, y: 0.7, label: 'Round lounge rug' }] },
    ],
  },
  {
    id: 'h8',
    name: 'Kensington Row',
    city: 'Kensington, London',
    rating: 4.7,
    reviews: 2210,
    from: 300,
    cover: IMG.rooms.admiral,
    tagline: 'A white townhouse terrace with deep navy suites and an old-fashioned bar downstairs.',
    amenities: ['Breakfast', 'Fine dining', 'Gym', 'Airport shuttle'],
    rooms: [
      { id: 'r19', name: 'Townhouse Double', img: 'cedar', price: 300, size: 30, beds: '1 queen bed', guests: 2, view: 'Garden square', hotspots: [{ x: 0.55, y: 0.7, label: 'Queen bed with runner' }, { x: 0.15, y: 0.6, label: 'Writing desk' }] },
      { id: 'r20', name: 'Admiral Suite', img: 'admiral', price: 460, size: 58, beds: '1 king + sofa bed', guests: 4, view: 'Park view', hotspots: [{ x: 0.35, y: 0.55, label: 'Navy tufted king bed' }, { x: 0.85, y: 0.35, label: 'Tall sash windows' }] },
    ],
  },
  {
    id: 'h9',
    name: 'Siam Orchid Retreat',
    city: 'Sukhumvit, Bangkok',
    rating: 4.6,
    reviews: 1890,
    from: 120,
    cover: IMG.rooms.lagoon,
    tagline: 'A green courtyard pool in the middle of the city and rooms that stay cool and quiet.',
    amenities: ['Infinity pool', 'Spa', 'Breakfast', 'Airport shuttle'],
    rooms: [
      { id: 'r21', name: 'Orchid Deluxe', img: 'lagoon', price: 120, size: 38, beds: '1 king bed', guests: 2, view: 'Pool view', hotspots: [{ x: 0.3, y: 0.55, label: 'Indigo king with throw pillows' }, { x: 0.8, y: 0.35, label: 'Doors to the pool deck' }] },
      { id: 'r22', name: 'Teak Studio', img: 'coral', price: 150, size: 42, beds: '1 king bed', guests: 2, view: 'Garden', hotspots: [{ x: 0.3, y: 0.6, label: 'Driftwood king bed' }, { x: 0.82, y: 0.4, label: 'Steps to the courtyard' }] },
    ],
  },
  {
    id: 'h10',
    name: 'Arabian Pearl Karachi',
    city: 'Clifton, Karachi',
    rating: 4.6,
    reviews: 1420,
    from: 95,
    cover: IMG.rooms.coral,
    tagline: 'Sea-breeze rooms a short walk from the Clifton beachfront, with a rooftop that catches the sunset.',
    amenities: ['Rooftop bar', 'Breakfast', 'Gym', 'Airport shuttle'],
    rooms: [
      { id: 'r23', name: 'Clifton Deluxe', img: 'coral', price: 95, size: 34, beds: '1 king bed', guests: 2, view: 'Sea breeze', hotspots: [{ x: 0.3, y: 0.6, label: 'Driftwood king bed' }, { x: 0.82, y: 0.4, label: 'Balcony toward the coast' }] },
      { id: 'r24', name: 'Harbour Studio', img: 'harbor', price: 120, size: 38, beds: '1 king bed', guests: 2, view: 'City view', hotspots: [{ x: 0.3, y: 0.6, label: 'Pillow-top king bed' }, { x: 0.75, y: 0.35, label: 'Bay window with reading chairs' }] },
    ],
  },
  {
    id: 'h11',
    name: 'Mughal Courtyard Lahore',
    city: 'Walled City, Lahore',
    rating: 4.8,
    reviews: 1685,
    from: 85,
    cover: IMG.rooms.ivory,
    tagline: 'A restored haveli with arched halls, a lantern-lit courtyard and breakfast under the old trees.',
    amenities: ['Breakfast', 'Fine dining', 'Spa', 'Airport shuttle'],
    rooms: [
      { id: 'r25', name: 'Haveli Classic', img: 'ivory', price: 85, size: 32, beds: '1 queen bed', guests: 2, view: 'Courtyard', hotspots: [{ x: 0.3, y: 0.52, label: 'Carved headboard and linen' }, { x: 0.6, y: 0.3, label: 'Arched windows to the courtyard' }] },
      { id: 'r26', name: 'Royal Suite', img: 'admiral', price: 160, size: 56, beds: '1 king + sofa bed', guests: 4, view: 'Old city', hotspots: [{ x: 0.35, y: 0.55, label: 'Tufted king bed' }, { x: 0.85, y: 0.35, label: 'Terrace over the rooftops' }] },
    ],
  },
  {
    id: 'h12',
    name: 'Margalla Ridge Lodge',
    city: 'Margalla Hills, Islamabad',
    rating: 4.7,
    reviews: 1130,
    from: 110,
    cover: IMG.rooms.dune,
    tagline: 'Pine-scented rooms on the edge of the hills with a long view over the city lights.',
    amenities: ['Spa', 'Breakfast', 'Fine dining', 'Gym'],
    rooms: [
      { id: 'r27', name: 'Ridge Deluxe', img: 'dune', price: 110, size: 40, beds: '1 king bed', guests: 2, view: 'Hill view', hotspots: [{ x: 0.42, y: 0.55, label: 'King bed with sateen linen' }, { x: 0.9, y: 0.4, label: 'Doors to the garden' }] },
      { id: 'r28', name: 'Cedar Loft', img: 'cedar', price: 90, size: 30, beds: '1 queen bed', guests: 2, view: 'Pine garden', hotspots: [{ x: 0.55, y: 0.7, label: 'Queen bed with runner' }, { x: 0.15, y: 0.6, label: 'Work desk and fast Wi-Fi' }] },
    ],
  },
  {
    id: 'h13',
    name: 'Karakoram Vista Hunza',
    city: 'Karimabad, Hunza',
    rating: 4.9,
    reviews: 842,
    from: 70,
    cover: IMG.rooms.lagoon,
    tagline: 'Wake up to snow peaks and apricot orchards in quiet rooms with big windows.',
    amenities: ['Breakfast', 'Fine dining', 'Spa'],
    rooms: [
      { id: 'r29', name: 'Peak View Room', img: 'lagoon', price: 70, size: 36, beds: '1 king bed', guests: 2, view: 'Mountain view', hotspots: [{ x: 0.3, y: 0.55, label: 'Indigo king with throw pillows' }, { x: 0.8, y: 0.35, label: 'Sliding doors to the terrace' }] },
      { id: 'r30', name: 'Valley Suite', img: 'palm', price: 130, size: 60, beds: '1 king + lounge', guests: 4, view: 'Valley', hotspots: [{ x: 0.5, y: 0.25, label: 'Crystal chandelier' }, { x: 0.45, y: 0.7, label: 'Round lounge rug' }] },
    ],
  },
];

export const findRoomHotel = (roomId) => {
  for (const h of HOTELS) {
    const room = h.rooms.find((r) => r.id === roomId);
    if (room) return { hotel: h, room };
  }
  return {};
};
