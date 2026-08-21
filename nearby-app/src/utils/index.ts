export const getStateStreets = (stateName: string): string[] => {
  switch (stateName.toLowerCase()) {
    case 'abia': return ["Azikiwe Rd", "Aba Owerri Rd", "Ariaria Market Way", "Faulks Crescent"];
    case 'adamawa': return ["Yola Road", "Jimeta Bypass", "Lamido Sanda St", "Airport Rd"];
    case 'akwa ibom': return ["Abak Rd", "Ikot Ekpene Rd", "Udo Udoma Ave", "Oron Rd"];
    case 'anambra': return ["Ziks Avenue", "Onitsha-Owerri Rd", "Awka Rd", "Nnamdi Azikiwe Rd"];
    case 'bauchi': return ["Tafawa Balewa Way", "Maiduguri Rd", "Yandoka Rd", "Ahmadu Bello Way"];
    case 'bayelsa': return ["Melford Okilo Rd", "Sani Abacha Expressway", "Isaac Boro Expressway"];
    case 'benue': return ["Gboko Rd", "Wadata Rd", "High Level Rd", "Otukpo Rd"];
    case 'borno': return ["Maiduguri Bypass", "Bama Rd", "Airport Rd", "Shehu Lamido Way"];
    case 'cross river': return ["Marian Rd", "Murtala Mohammed Highway", "Calabar Rd", "Etta Agbor Rd"];
    case 'delta': return ["Effurun-Sapele Rd", "Nnebisi Rd", "Airport Rd", "Warri-Wood Rd"];
    case 'ebonyi': return ["Afikpo Rd", "Water Works Rd", "Ogoja Rd", "Abakaliki-Enugu Rd"];
    case 'edo': return ["Airport Rd", "Ihama Rd", "Sapele Rd", "Boundary Rd", "Akpakpava St"];
    case 'ekiti': return ["Ado-Iworoko Rd", "Sada Rd", "Ajilosun St", "Okesa St"];
    case 'enugu': return ["Chime Avenue", "Presidential Rd", "Okpara Ave", "Nza St", "Rangers Ave"];
    case 'gombe': return ["Bauchi Rd", "Biye Rd", "Kano Rd", "Ashaka Rd"];
    case 'imo': return ["Ikenegbu Lane", "Wetheral Rd", "Douglas Rd", "Orlu Rd", "Okigwe Rd"];
    case 'jigawa': return ["Dutse Bypass", "Kano Rd", "Kazaure Rd", "Hadejia Rd"];
    case 'kaduna': return ["Ali Akilu Rd", "Kachia Rd", "Gwari Ave", "Constitution Rd", "Broad Rd"];
    case 'kano': return ["Bompai Rd", "Hadejia Rd", "Airport Rd", "Zaria Rd", "Zoo Rd"];
    case 'katsina': return ["Kano Rd", "Batsari Rd", "Jibia Rd", "Ibrahim Babangida Way"];
    case 'kebbi': return ["Birnin Kebbi Rd", "Ahmadu Bello Way", "Haliru Abdu Rd"];
    case 'kogi': return ["Lokoja-Ajaokuta Rd", "Murtala Mohammed Way", "Ganaja Rd"];
    case 'kwara': return ["Gaa Akanbi Rd", "Taiwo Rd", "Muritala Mohammed Way", "Ilofa Rd"];
    case 'lagos': return ["Herbert Macaulay Way", "Admiralty Way", "Isaac John St", "Surulere Way", "Fola Osibo Rd"];
    case 'nasarawa': return ["Lafia-Keffi Road", "Jos Rd", "Makurdi Rd"];
    case 'niger': return ["Minna-Suleja Rd", "Chanchaga Rd", "Bosso Rd", "Paiko Rd"];
    case 'ogun': return ["Oke-Mosan Rd", "Lafenwa Rd", "Ibara Rd", "Presidential Blvd"];
    case 'ondo': return ["Ilesha Rd", "Owo Rd", "Arakale Rd", "Ogbese Rd"];
    case 'osun': return ["Gbongan Rd", "Ogo-Oluwa Ave", "Ile-Ife Rd", "Station Rd"];
    case 'oyo': return ["Bodija Rd", "Ring Rd", "Challenge Rd", "Awolowo Ave", "Iwo Rd"];
    case 'plateau': return ["Rayfield Rd", "Zaria Rd", "Bukuru Bypass", "Ahmadu Bello Way"];
    case 'rivers': return ["Tombia St", "Sani Abacha Rd", "Apara Link Rd", "Trans Amadi Rd", "Ikwerre Rd"];
    case 'sokoto': return ["Gusau Rd", "Kano Rd", "Sultan Abubakar Rd", "Ahmadu Bello Way"];
    case 'taraba': return ["Hammaruwa Way", "Wukari Rd", "Jalingo Bypass"];
    case 'yobe': return ["Maiduguri Rd", "Potiskum Rd", "Gashua Rd"];
    case 'zamfara': return ["Sokoto Rd", "Zaria Rd", "Gusau Bypass"];
    default: return ["Ahmadu Bello Way", "Independence Ave", "Ring Road", "Airport Rd"];
  }
};

export const getDistanceLabel = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
};
