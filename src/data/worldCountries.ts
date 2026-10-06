import { CountryData } from '../types';

export const WORLD_CONTINENTS = [
  { id: 'all', name: 'All Continents', nameBn: 'সকল মহাদেশ' },
  { id: 'asia', name: 'Asia', nameBn: 'এশিয়া' },
  { id: 'europe', name: 'Europe', nameBn: 'ইউরোপ' },
  { id: 'americas', name: 'Americas', nameBn: 'আমেরিকা' },
  { id: 'africa', name: 'Africa', nameBn: 'আফ্রিকা' },
  { id: 'oceania', name: 'Oceania', nameBn: 'ওশেনিয়া' },
];

/**
 * World Map SVG data with countries across continents
 * Standard viewBox: 0 0 1000 500
 */
export const WORLD_COUNTRIES: CountryData[] = [
  // ASIA
  {
    id: 'bangladesh',
    code: 'BD',
    name: 'Bangladesh',
    nameBn: 'বাংলাদেশ',
    continent: 'asia',
    center: [720, 240],
    path: 'M 715,235 L 725,233 L 728,245 L 718,248 Z'
  },
  {
    id: 'india',
    code: 'IN',
    name: 'India',
    nameBn: 'ভারত',
    continent: 'asia',
    center: [680, 240],
    path: 'M 655,200 L 715,195 L 730,225 L 710,265 L 675,295 L 650,250 Z'
  },
  {
    id: 'china',
    code: 'CN',
    name: 'China',
    nameBn: 'চীন',
    continent: 'asia',
    center: [770, 180],
    path: 'M 700,140 L 830,130 L 840,195 L 760,220 L 710,195 Z'
  },
  {
    id: 'japan',
    code: 'JP',
    name: 'Japan',
    nameBn: 'জাপান',
    continent: 'asia',
    center: [875, 175],
    path: 'M 865,150 L 885,160 L 870,205 L 855,190 Z'
  },
  {
    id: 'saudi_arabia',
    code: 'SA',
    name: 'Saudi Arabia',
    nameBn: 'সৌদি আরব',
    continent: 'asia',
    center: [590, 235],
    path: 'M 565,210 L 615,205 L 625,255 L 575,265 Z'
  },
  {
    id: 'uae',
    code: 'AE',
    name: 'United Arab Emirates',
    nameBn: 'সংযুক্ত আরব আমিরাত',
    continent: 'asia',
    center: [625, 230],
    path: 'M 620,225 L 632,225 L 630,235 L 618,233 Z'
  },
  {
    id: 'turkey',
    code: 'TR',
    name: 'Turkey',
    nameBn: 'তুরস্ক',
    continent: 'asia',
    center: [565, 170],
    path: 'M 545,160 L 590,162 L 585,180 L 540,178 Z'
  },
  {
    id: 'indonesia',
    code: 'ID',
    name: 'Indonesia',
    nameBn: 'ইন্দোনেশিয়া',
    continent: 'asia',
    center: [790, 315],
    path: 'M 740,305 L 830,305 L 825,325 L 745,320 Z'
  },
  {
    id: 'malaysia',
    code: 'MY',
    name: 'Malaysia',
    nameBn: 'মালয়েশিয়া',
    continent: 'asia',
    center: [750, 285],
    path: 'M 740,280 L 765,280 L 760,295 L 735,290 Z'
  },
  {
    id: 'thailand',
    code: 'TH',
    name: 'Thailand',
    nameBn: 'থাইল্যান্ড',
    continent: 'asia',
    center: [745, 245],
    path: 'M 735,230 L 755,235 L 750,270 L 735,260 Z'
  },
  {
    id: 'russia',
    code: 'RU',
    name: 'Russia',
    nameBn: 'রাশিয়া',
    continent: 'asia',
    center: [710, 85],
    path: 'M 550,70 L 890,50 L 910,120 L 720,130 L 540,110 Z'
  },

  // EUROPE
  {
    id: 'united_kingdom',
    code: 'GB',
    name: 'United Kingdom',
    nameBn: 'যুক্তরাজ্য',
    continent: 'europe',
    center: [475, 130],
    path: 'M 465,115 L 485,115 L 480,145 L 465,140 Z'
  },
  {
    id: 'france',
    code: 'FR',
    name: 'France',
    nameBn: 'ফ্রান্স',
    continent: 'europe',
    center: [485, 160],
    path: 'M 470,145 L 500,145 L 495,175 L 465,170 Z'
  },
  {
    id: 'germany',
    code: 'DE',
    name: 'Germany',
    nameBn: 'জার্মানি',
    continent: 'europe',
    center: [510, 140],
    path: 'M 498,125 L 525,125 L 522,155 L 498,150 Z'
  },
  {
    id: 'italy',
    code: 'IT',
    name: 'Italy',
    nameBn: 'ইতালি',
    continent: 'europe',
    center: [515, 175],
    path: 'M 505,160 L 525,162 L 530,195 L 515,190 Z'
  },
  {
    id: 'spain',
    code: 'ES',
    name: 'Spain',
    nameBn: 'স্পেন',
    continent: 'europe',
    center: [460, 180],
    path: 'M 445,165 L 475,165 L 470,195 L 440,190 Z'
  },
  {
    id: 'switzerland',
    code: 'CH',
    name: 'Switzerland',
    nameBn: 'সুইজারল্যান্ড',
    continent: 'europe',
    center: [505, 158],
    path: 'M 498,154 L 512,154 L 510,165 L 496,164 Z'
  },

  // AMERICAS
  {
    id: 'usa',
    code: 'US',
    name: 'United States',
    nameBn: 'যুক্তরাষ্ট্র',
    continent: 'americas',
    center: [220, 170],
    path: 'M 145,135 L 300,135 L 290,215 L 155,210 Z'
  },
  {
    id: 'canada',
    code: 'CA',
    name: 'Canada',
    nameBn: 'কানাডা',
    continent: 'americas',
    center: [220, 95],
    path: 'M 130,60 L 320,55 L 305,130 L 145,130 Z'
  },
  {
    id: 'brazil',
    code: 'BR',
    name: 'Brazil',
    nameBn: 'ব্রাজিল',
    continent: 'americas',
    center: [340, 330],
    path: 'M 300,285 L 380,285 L 370,380 L 295,360 Z'
  },
  {
    id: 'argentina',
    code: 'AR',
    name: 'Argentina',
    nameBn: 'আর্জেন্টিনা',
    continent: 'americas',
    center: [315, 410],
    path: 'M 295,365 L 335,365 L 320,465 L 295,455 Z'
  },

  // AFRICA
  {
    id: 'egypt',
    code: 'EG',
    name: 'Egypt',
    nameBn: 'মিশর',
    continent: 'africa',
    center: [545, 215],
    path: 'M 525,195 L 565,195 L 560,235 L 525,230 Z'
  },
  {
    id: 'south_africa',
    code: 'ZA',
    name: 'South Africa',
    nameBn: 'দক্ষিণ আফ্রিকা',
    continent: 'africa',
    center: [530, 410],
    path: 'M 505,385 L 560,385 L 550,440 L 500,430 Z'
  },
  {
    id: 'kenya',
    code: 'KE',
    name: 'Kenya',
    nameBn: 'কেনিয়া',
    continent: 'africa',
    center: [570, 295],
    path: 'M 555,275 L 585,275 L 580,315 L 550,310 Z'
  },
  {
    id: 'morocco',
    code: 'MA',
    name: 'Morocco',
    nameBn: 'মরক্কো',
    continent: 'africa',
    center: [460, 205],
    path: 'M 445,190 L 475,192 L 470,225 L 440,220 Z'
  },

  // OCEANIA
  {
    id: 'australia',
    code: 'AU',
    name: 'Australia',
    nameBn: 'অস্ট্রেলিয়া',
    continent: 'oceania',
    center: [860, 380],
    path: 'M 805,335 L 915,335 L 900,430 L 805,420 Z'
  },
  {
    id: 'new_zealand',
    code: 'NZ',
    name: 'New Zealand',
    nameBn: 'নিউজিল্যান্ড',
    continent: 'oceania',
    center: [945, 430],
    path: 'M 935,410 L 955,410 L 950,450 L 935,445 Z'
  }
];

export const COUNTRY_MAP = new Map(WORLD_COUNTRIES.map(c => [c.id, c]));
