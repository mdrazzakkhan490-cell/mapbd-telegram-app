export type Language = 'bn' | 'en';

export type MainTab = 'home' | 'bangladesh' | 'world' | 'trips' | 'quiz' | 'puzzle' | 'profile' | 'admin';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface UserProfile {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language: Language;
  points: number;
  is_blocked: boolean;
  role: 'user' | 'admin';
  created_at: string;
  last_active: string;
}

export type DivisionName =
  | 'Dhaka'
  | 'Chattogram'
  | 'Rajshahi'
  | 'Khulna'
  | 'Barishal'
  | 'Sylhet'
  | 'Rangpur'
  | 'Mymensingh';

export interface DistrictData {
  id: string;
  name: string;
  nameBn: string;
  shortNameBn?: string;
  division: DivisionName;
  divisionBn: string;
  center: [number, number]; // [x, y] in SVG coordinates (0-800, 1000)
  path: string; // SVG path d attribute
  highlight: string;
  highlightBn: string;
  areaSqKm: number;
  fontSize?: number;
}

export interface CountryData {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  continent: string;
  center: [number, number];
  path: string;
}

export interface MapTheme {
  id: string;
  name: string;
  nameBn: string;
  selectedColor: string;
  unselectedColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export interface DesignConfig {
  id?: string;
  mapType: 'bangladesh' | 'world';
  selectedIds: string[];
  themeId: string;
  customColors: {
    selected: string;
    unselected: string;
    background: string;
    border: string;
    text: string;
  };
  borderWidth: number;
  title: string;
  subtitle: string;
  userName: string;
  userPhoto?: string;
  showPhoto: boolean;
  showWatermark: boolean;
  fontFamily: string;
  textPosition: 'top' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  thumbnail?: string;
  created_at?: string;
}

export interface SavedTrip {
  id: string;
  user_id?: string;
  title: string;
  start_location: string;
  destinations: string[];
  travel_date: string;
  travel_mode: 'bus' | 'train' | 'car' | 'launch' | 'air';
  budget?: string;
  notes?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  category: 'bangladesh' | 'districts' | 'divisions' | 'world';
  question_en: string;
  question_bn: string;
  options_en: string[];
  options_bn: string[];
  correct_index: number;
  explanation_en: string;
  explanation_bn: string;
}

export interface LeaderboardEntry {
  username: string;
  first_name: string;
  score: number;
  total: number;
  date: string;
}
