import { Neighbor, DirectMessage } from './types';

export interface LocationPreset {
  name: string;
  city: string;
  coords: { lat: number; lng: number };
  streets: string[];
}

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
  { name: "Delta", capital: "Asaba", coords: { lat: 6.1996, lng: 6.7303 } },
  { name: "Ebonyi", capital: "Abakaliki", coords: { lat: 6.3236, lng: 8.1121 } },
  { name: "Edo", capital: "Benin City", coords: { lat: 6.3350, lng: 5.6037 } },
  { name: "Ekiti", capital: "Ado Ekiti", coords: { lat: 7.6212, lng: 5.2215 } },
  { name: "Enugu", capital: "Enugu", coords: { lat: 6.4584, lng: 7.5101 } },
  { name: "FCT - Abuja", capital: "Abuja", coords: { lat: 9.0765, lng: 7.4764 } },
  { name: "Gombe", capital: "Gombe", coords: { lat: 10.2897, lng: 11.1673 } },
  { name: "Imo", capital: "Owerri", coords: { lat: 5.4856, lng: 7.0351 } },
  { name: "Jigawa", capital: "Dutse", coords: { lat: 11.7516, lng: 9.3392 } },
  { name: "Kaduna", capital: "Kaduna", coords: { lat: 10.5105, lng: 7.4165 } },
  { name: "Kano", capital: "Kano", coords: { lat: 12.0022, lng: 8.5920 } },
  { name: "Katsina", capital: "Katsina", coords: { lat: 12.9816, lng: 7.6171 } },
  { name: "Kebbi", capital: "Birnin Kebbi", coords: { lat: 12.4504, lng: 4.1975 } },
  { name: "Kogi", capital: "Lokoja", coords: { lat: 7.7969, lng: 6.7405 } },
  { name: "Kwara", capital: "Ilorin", coords: { lat: 8.4799, lng: 4.5418 } },
  { name: "Lagos", capital: "Ikeja", coords: { lat: 6.5244, lng: 3.3792 } },
  { name: "Nasarawa", capital: "Lafia", coords: { lat: 8.4904, lng: 8.5155 } },
  { name: "Niger", capital: "Minna", coords: { lat: 9.6138, lng: 6.5569 } },
  { name: "Ogun", capital: "Abeokuta", coords: { lat: 7.1557, lng: 3.3453 } },
  { name: "Ondo", capital: "Akure", coords: { lat: 7.2571, lng: 5.2058 } },
  { name: "Osun", capital: "Osogbo", coords: { lat: 7.7853, lng: 4.5382 } },
  { name: "Oyo", capital: "Ibadan", coords: { lat: 7.3775, lng: 3.9470 } },
  { name: "Plateau", capital: "Jos", coords: { lat: 9.8965, lng: 8.8583 } },
  { name: "Rivers", capital: "Port Harcourt", coords: { lat: 4.8156, lng: 7.0498 } },
  { name: "Sokoto", capital: "Sokoto", coords: { lat: 13.0622, lng: 5.2339 } },
  { name: "Taraba", capital: "Jalingo", coords: { lat: 8.8929, lng: 11.3789 } },
  { name: "Yobe", capital: "Damaturu", coords: { lat: 11.7489, lng: 11.9608 } },
  { name: "Zamfara", capital: "Gusau", coords: { lat: 12.1628, lng: 6.6614 } }
];

export const INITIAL_NEIGHBORS: Neighbor[] = [];

export const INITIAL_MESSAGES: Record<string, DirectMessage[]> = {};

// Notes preset values for the horizontal notes shelf at the top of messages page!
export interface UserNote {
  id: string;
  name: string;
  avatarColor: string;
  avatarEmoji: string;
  text: string;
}

export const INITIAL_NOTES: UserNote[] = [];

