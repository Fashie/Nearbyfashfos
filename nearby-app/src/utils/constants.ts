import { LocationPreset, Neighbor, UserNote, DirectMessage, FeedPost } from '../types';

export const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const hasValidGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

export const SNAP_HOTSPOTS = [
  { name: "Nelson Mandela Freedom Park", label: "Top Pick", category: "Recreation Park", emoji: "🌳", latOffset: 0.0015, lngOffset: -0.002 },
  { name: "Bite More Restaurant", label: "Top Pick", category: "Cafe & Fast Food", emoji: "🍔", latOffset: -0.0025, lngOffset: 0.001 },
  { name: "Locapy Lounge & Bar", label: "Top Pick", category: "Lounge", emoji: "🍹", latOffset: 0.002, lngOffset: 0.003 },
  { name: "Goodness Batik & Dye", label: "Highly Revisited", category: "Cultural Center", emoji: "🎨", latOffset: -0.0015, lngOffset: -0.003 },
  { name: "Adolak Int'l Hotel", label: "Lodging", category: "Hotel Lobby", emoji: "🏨", latOffset: -0.0008, lngOffset: -0.0012 },
  { name: "Jossy Restaurant", label: "Top Pick", category: "Diner", emoji: "🍲", latOffset: 0.0035, lngOffset: -0.0015 },
  { name: "Khadz and T Food", label: "Top Pick", category: "Pizzeria", emoji: "🍕", latOffset: -0.003, lngOffset: -0.0025 }
];

export const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    authorId: "nb-1",
    authorName: "Sade Bello",
    authorAvatar: "🎨",
    timestamp: "2 hours ago",
    caption: "Setting up my new studio corner today in Osogbo! If you're around Gbongan Road, stop by for some coffee and art chats ☕🎨",
    locationTag: "Gbongan Road",
    likes: 6,
    likedByMe: false,
    comments: [
      {
        id: "c-1",
        authorName: "Chidi Okafor",
        text: "Looks amazing! Might swing by after work.",
        timestamp: "1 hour ago"
      }
    ]
  },
  {
    id: "post-2",
    authorId: "nb-3",
    authorName: "Amaka Eze",
    authorAvatar: "🏃‍♀️",
    timestamp: "5 hours ago",
    caption: "Morning 5k loop around Freedom Park completed! Who's joining the weekend community walk on Saturday?",
    locationTag: "Freedom Park",
    likes: 11,
    likedByMe: true,
    comments: []
  }
];

export const NEIGHBORHOODS: LocationPreset[] = [
  {
    name: "Ogo-Oluwa",
    city: "Osogbo, Osun State",
    coords: { lat: 7.7853, lng: 4.5382 },
    streets: ["Gbongan Road", "Ogo-Oluwa Avenue", "Adebola Olawoyin Street", "Opeyemi Lane", "Osogbo-Iwo Road"]
  },
  {
    name: "Oketunji Street",
    city: "Osogbo, Osun State",
    coords: { lat: 7.7715, lng: 4.5630 },
    streets: ["Oketunji Street", "Gbongan Road", "Alekunwodo Rd", "Station Road", "Odi-Olowo St"]
  },
  {
    name: "Yaba",
    city: "Lagos",
    coords: { lat: 6.5095, lng: 3.3711 },
    streets: ["Herbert Macaulay Way", "Yaba Rd", "Montgomery Rd", "Birrel Ave", "Tejuosho St", "Alara St"]
  },
  {
    name: "Lekki Phase 1",
    city: "Lagos",
    coords: { lat: 6.4468, lng: 3.4735 },
    streets: ["Admiralty Way", "Fola Osibo Rd", "Providence St", "Durosinmi Etti Dr", "Omorinre Johnson St"]
  },
  {
    name: "Ikeja GRA",
    city: "Lagos",
    coords: { lat: 6.5815, lng: 3.3551 },
    streets: ["Joel Ogunnaike St", "Isaac John St", "Oba Akinjobi St", "Sasegbon St", "Harold Shodipo Cres"]
  },
  {
    name: "Wuse II",
    city: "Abuja",
    coords: { lat: 9.0765, lng: 7.4764 },
    streets: ["Aminu Kano Crescent", "Adetokunbo Ademola St", "Wuse 2 Ave", "Gana St", "Banex Plaza Loop"]
  },
  {
    name: "Maitama District",
    city: "Abuja",
    coords: { lat: 9.0882, lng: 7.4950 },
    streets: ["Gana Street", "Maitama Dr", "Osborn Rd", "Amazon St", "Rana Crescent"]
  },
  {
    name: "Bodija Estate",
    city: "Ibadan",
    coords: { lat: 7.4350, lng: 3.9140 },
    streets: ["Bodija Rd", "Aare Avenue", "Favos Loop", "Oshuntokun Ave", "Awolowo Ave"]
  },
  {
    name: "GRA Phase II",
    city: "Port Harcourt",
    coords: { lat: 4.8140, lng: 7.0012 },
    streets: ["Tombia St", "Sani Abacha Rd", "Apara Link Rd", "Birabi St", "Phase 2 Boulevard"]
  },
  {
    name: "Independence Layout",
    city: "Enugu",
    coords: { lat: 6.4281, lng: 7.5020 },
    streets: ["Chime Avenue", "Okpara Ave", "Nza St", "Rangers Ave", "Eze St"]
  },
  {
    name: "Nasarawa GRA",
    city: "Kano",
    coords: { lat: 12.0010, lng: 8.5420 },
    streets: ["Hadejia Rd", "Bompai Rd", "Liman Ave", "Audu Bako Way", "Kano Club Loop"]
  },
  {
    name: "Barnawa Sector",
    city: "Kaduna",
    coords: { lat: 10.4850, lng: 7.4320 },
    streets: ["Barnawa High Street", "Kachia Rd", "Gwari Ave", "Kaduna River Trail"]
  },
  {
    name: "GRA Benin",
    city: "Benin City",
    coords: { lat: 6.3150, lng: 5.6120 },
    streets: ["Airport Rd", "Sapele Rd", "Boundary Rd", "Reservation Rd", "Ihama Rd"]
  }
];

export const NIGERIAN_STATES = [
  { name: "Abia", capital: "Umuahia", coords: { lat: 5.5267, lng: 7.4898 } },
  { name: "Adamawa", capital: "Yola", coords: { lat: 9.2035, lng: 12.4954 } },
  { name: "Akwa Ibom", capital: "Uyo", coords: { lat: 5.0389, lng: 7.9092 } },
  { name: "Anambra", capital: "Awka", coords: { lat: 6.2209, lng: 7.0731 } },
  { name: "Bauchi", capital: "Bauchi", coords: { lat: 10.3158, lng: 9.8442 } },
  { name: "Bayelsa", capital: "Yenagoa", coords: { lat: 4.9267, lng: 6.2676 } },
  { name: "Benue", capital: "Makurdi", coords: { lat: 7.7337, lng: 8.5214 } },
  { name: "Borno", capital: "Maiduguri", coords: { lat: 11.8311, lng: 13.1510 } },
  { name: "Cross River", capital: "Calabar", coords: { lat: 4.9757, lng: 8.3417 } },
  { name: "Delta", capital: "Asaba", coords: { lat: 6.1983, lng: 6.7262 } },
  { name: "Ebonyi", capital: "Abakaliki", coords: { lat: 6.3249, lng: 8.1137 } },
  { name: "Edo", capital: "Benin City", coords: { lat: 6.3350, lng: 5.6037 } },
  { name: "Ekiti", capital: "Ado-Ekiti", coords: { lat: 7.6211, lng: 5.2215 } },
  { name: "Enugu", capital: "Enugu", coords: { lat: 6.4584, lng: 7.5464 } },
  { name: "FCT - Abuja", capital: "Abuja", coords: { lat: 9.0765, lng: 7.3986 } },
  { name: "Gombe", capital: "Gombe", coords: { lat: 10.2897, lng: 11.1673 } },
  { name: "Imo", capital: "Owerri", coords: { lat: 5.4836, lng: 7.0333 } },
  { name: "Jigawa", capital: "Dutse", coords: { lat: 11.7583, lng: 9.3389 } },
  { name: "Kaduna", capital: "Kaduna", coords: { lat: 10.5105, lng: 7.4165 } },
  { name: "Kano", capital: "Kano", coords: { lat: 12.0022, lng: 8.5920 } },
  { name: "Katsina", capital: "Katsina", coords: { lat: 12.9908, lng: 7.6018 } },
  { name: "Kebbi", capital: "Birnin Kebbi", coords: { lat: 12.4539, lng: 4.1975 } },
  { name: "Kogi", capital: "Lokoja", coords: { lat: 7.7969, lng: 6.7405 } },
  { name: "Kwara", capital: "Ilorin", coords: { lat: 8.4966, lng: 4.5421 } },
  { name: "Lagos", capital: "Ikeja", coords: { lat: 6.5244, lng: 3.3792 } },
  { name: "Nasarawa", capital: "Lafia", coords: { lat: 8.4904, lng: 8.5167 } },
  { name: "Niger", capital: "Minna", coords: { lat: 9.6139, lng: 6.5569 } },
  { name: "Ogun", capital: "Abeokuta", coords: { lat: 7.1557, lng: 3.3451 } },
  { name: "Ondo", capital: "Akure", coords: { lat: 7.2571, lng: 5.2058 } },
  { name: "Osun", capital: "Osogbo", coords: { lat: 7.7827, lng: 4.5418 } },
  { name: "Oyo", capital: "Ibadan", coords: { lat: 7.3775, lng: 3.9470 } },
  { name: "Plateau", capital: "Jos", coords: { lat: 9.8965, lng: 8.8583 } },
  { name: "Rivers", capital: "Port Harcourt", coords: { lat: 4.8156, lng: 7.0498 } },
  { name: "Sokoto", capital: "Sokoto", coords: { lat: 13.0059, lng: 5.2476 } },
  { name: "Taraba", capital: "Jalingo", coords: { lat: 8.8937, lng: 11.3596 } },
  { name: "Yobe", capital: "Damaturu", coords: { lat: 11.7470, lng: 11.9608 } },
  { name: "Zamfara", capital: "Gusau", coords: { lat: 12.1704, lng: 6.6646 } }
];

export const INITIAL_NOTES: UserNote[] = [
  {
    id: "note-1",
    name: "Funke",
    avatarColor: "bg-gradient-to-tr from-amber-400 to-rose-400 text-white",
    avatarEmoji: "🎧",
    text: "Who has a PS5 controller charger around Oketunji? 🔌"
  },
  {
    id: "note-2",
    name: "Tobi",
    avatarColor: "bg-gradient-to-tr from-blue-400 to-indigo-500 text-white",
    avatarEmoji: "☕",
    text: "Working from Bite More today if anyone wants to join!"
  },
  {
    id: "note-3",
    name: "Amaka",
    avatarColor: "bg-gradient-to-tr from-purple-400 to-pink-500 text-white",
    avatarEmoji: "🌿",
    text: "Morning run by Freedom Park tomorrow 6am 🏃‍♀️"
  }
];

export const INITIAL_NEIGHBORS: Neighbor[] = [
  {
    id: "nb-myai",
    name: "Nearby Assistant",
    username: "nearby_ai",
    avatarColor: "bg-emerald-600 text-white",
    avatarEmoji: "✨",
    distanceMeters: 0,
    streetName: "Your Neighborhood Companion",
    bio: "I can help you explore verified nearby hotspots, schedule safe meetups, and connect with people around you!",
    interests: ["Local Guide", "Safe Meetups", "Community", "Food"],
    publicSnaps: [],
    activeStory: [],
    onlineStatus: "active",
    latOffset: 0,
    lngOffset: 0,
    trustScore: 5.0,
    verificationLevel: "Verified"
  },
  {
    id: "nb-1",
    name: "Sade Bello",
    username: "sade_bello",
    avatarColor: "bg-rose-500 text-white",
    avatarEmoji: "🎨",
    distanceMeters: 140,
    streetName: "Gbongan Road, 2 mins walk",
    bio: "Visual artist & creative designer. Love discovering local cafes and gallery spaces in Osogbo.",
    interests: ["Art", "Design", "Coffee", "Photography"],
    publicSnaps: [],
    activeStory: [],
    onlineStatus: "active",
    latOffset: 0.0012,
    lngOffset: 0.0008,
    trustScore: 4.9,
    verificationLevel: "Verified",
    gender: "Female",
    ageRange: "22-29"
  },
  {
    id: "nb-2",
    name: "Chidi Okafor",
    username: "chidi_codes",
    avatarColor: "bg-blue-600 text-white",
    avatarEmoji: "💻",
    distanceMeters: 320,
    streetName: "Ogo-Oluwa Avenue, 5 mins walk",
    bio: "Software engineer building mobile tools. Always up for tech gist or weekend football.",
    interests: ["Tech", "Football", "Gaming", "Startups"],
    publicSnaps: [],
    activeStory: [],
    onlineStatus: "active",
    latOffset: -0.0018,
    lngOffset: 0.0021,
    trustScore: 4.8,
    verificationLevel: "Verified",
    gender: "Male",
    ageRange: "25-34"
  },
  {
    id: "nb-3",
    name: "Amaka Eze",
    username: "amaka_fit",
    avatarColor: "bg-purple-600 text-white",
    avatarEmoji: "🏃‍♀️",
    distanceMeters: 450,
    streetName: "Alekunwodo Rd, 7 mins walk",
    bio: "Fitness trainer & nutritionist. Looking for workout partners around Freedom Park!",
    interests: ["Fitness", "Nutrition", "Running", "Music"],
    publicSnaps: [],
    activeStory: [],
    onlineStatus: "active",
    latOffset: 0.0025,
    lngOffset: -0.0015,
    trustScore: 4.9,
    verificationLevel: "Verified",
    gender: "Female",
    ageRange: "22-29"
  }
];

export const INITIAL_MESSAGES: Record<string, DirectMessage[]> = {
  "nb-myai": [
    {
      id: "msg-ai-1",
      senderId: "nb-myai",
      receiverId: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text",
      text: "Hello! Welcome to Nearby. I am your neighborhood assistant. Feel free to ask about safe meetup spots or finding neighbors with matching interests!",
      status: "read"
    }
  ]
};

export const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Feelings',
    emojis: [
      { char: '😀', tags: 'smile happy laugh face grinning' },
      { char: '😃', tags: 'smile happy laugh face grinning' },
      { char: '😄', tags: 'smile happy laugh face' },
      { char: '😁', tags: 'smile happy grin face' },
      { char: '😆', tags: 'laugh happy face grinning' },
      { char: '😅', tags: 'laugh sweat happy face' },
      { char: '😂', tags: 'laugh tear lol happy cry face' },
      { char: '🤣', tags: 'laugh lol roll face' },
      { char: '😊', tags: 'smile blush happy face' },
      { char: '😇', tags: 'angel innocent face' },
      { char: '🙂', tags: 'smile slight face' },
      { char: '😍', tags: 'heart eyes love happy face' },
      { char: '🥰', tags: 'hearts love warm face' },
      { char: '😘', tags: 'kiss love face' },
      { char: '😎', tags: 'cool sunglasses face' },
      { char: '🥳', tags: 'party celebrate face' },
      { char: '🔥', tags: 'fire hot lit flame' },
      { char: '✨', tags: 'sparkles star shine' },
      { char: '❤️', tags: 'heart red love' },
      { char: '👍', tags: 'thumbs up like approve' }
    ]
  },
  {
    name: 'Gestures & People',
    emojis: [
      { char: '👋', tags: 'wave hello goodbye' },
      { char: '🙌', tags: 'hands praise celebrate' },
      { char: '🤝', tags: 'handshake deal agreement' },
      { char: '👏', tags: 'clap applause bravo' },
      { char: '✌️', tags: 'peace victory sign' },
      { char: '🤞', tags: 'fingers crossed luck' },
      { char: '💪', tags: 'muscle strong flex' },
      { char: '🙏', tags: 'pray please thank you' }
    ]
  },
  {
    name: 'Places & Fun',
    emojis: [
      { char: '📍', tags: 'pin location map' },
      { char: '☕', tags: 'coffee cafe drink' },
      { char: '🍔', tags: 'burger food eat' },
      { char: '🍕', tags: 'pizza food restaurant' },
      { char: '⚽', tags: 'football soccer ball sport' },
      { char: '🎮', tags: 'gaming controller ps5' },
      { char: '🎵', tags: 'music song audio' },
      { char: '🌳', tags: 'park tree nature' }
    ]
  }
];
