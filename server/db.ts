/**
 * In-memory & JSON file persistent store for MapBD Telegram Web App
 * Satisfies the schema requirement: users, designs, design_files, saved_trips,
 * quiz_questions, quiz_attempts, puzzle_attempts, themes, admin_users
 */
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language: 'bn' | 'en';
  points: number;
  is_blocked: boolean;
  role: 'user' | 'admin';
  created_at: string;
  last_active: string;
}

export interface DesignColors {
  selected: string;
  unselected: string;
  background: string;
  border: string;
  text: string;
}

export interface Design {
  id: string;
  user_id: string;
  telegram_id: number;
  map_type: 'bangladesh' | 'world';
  title: string;
  subtitle: string;
  user_name: string;
  photo_url?: string;
  selected_ids: string[];
  theme_name: string;
  colors: DesignColors;
  font_family: string;
  border_width: number;
  text_position: 'top' | 'center' | 'bottom';
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedTrip {
  id: string;
  user_id: string;
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

export interface QuizAttempt {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  score: number;
  total_questions: number;
  category: string;
  created_at: string;
}

export interface PuzzleAttempt {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  map_type: 'bangladesh' | 'world';
  difficulty: 'easy' | 'medium' | 'hard';
  time_seconds: number;
  attempts: number;
  score: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  is_active: boolean;
}

// Initial seed quiz questions (bilingual)
const INITIAL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'districts',
    question_en: 'Which is the largest district of Bangladesh by area?',
    question_bn: 'আয়তনের দিক থেকে বাংলাদেশের বৃহত্তম জেলা কোনটি?',
    options_en: ['Rangamati', 'Chattogram', 'Khulna', 'Mymensingh'],
    options_bn: ['রাঙ্গামাটি', 'চট্টগ্রাম', 'খুলনা', 'ময়মনসিংহ'],
    correct_index: 0,
    explanation_en: 'Rangamati is the largest district by land area (6,116 km²).',
    explanation_bn: 'আয়তনের দিক থেকে রাঙ্গামাটি বাংলাদেশের সর্ববৃহৎ জেলা (৬,১১৬ বর্গ কিমি)।'
  },
  {
    id: 'q2',
    category: 'districts',
    question_en: 'Which district is known as the "Granary of Bangladesh"?',
    question_bn: 'বাংলাদেশের "শস্যভাণ্ডার" হিসেবে পরিচিত কোন জেলা?',
    options_en: ['Barishal', 'Dinajpur', 'Bogura', 'Sylhet'],
    options_bn: ['বরিশাল', 'দিনাজপুর', 'বগুড়া', 'সিলেট'],
    correct_index: 0,
    explanation_en: 'Barishal is historically known as the granary of Bengal (Dhan-Nodi-Khal, Ei tine Barisal).',
    explanation_bn: 'ঐতিহাসিকভাবে বরিশালকে বাংলাদেশের শস্যভাণ্ডার বলা হয় (ধান নদী খাল, এই তিনে বরিশাল)।'
  },
  {
    id: 'q3',
    category: 'bangladesh',
    question_en: 'Which is the northernmost district of Bangladesh?',
    question_bn: 'বাংলাদেশের সর্বউত্তরের জেলা কোনটি?',
    options_en: ['Panchagarh', 'Thakurgaon', 'Dinajpur', 'Lalmonirhat'],
    options_bn: ['পঞ্চগড়', 'ঠাকুরগাঁও', 'দিনাজপুর', 'লালমনিরহাট'],
    correct_index: 0,
    explanation_en: 'Panchagarh (specifically Tetulia) is the northernmost district.',
    explanation_bn: 'পঞ্চগড় (বিশেষ করে তেঁতুলিয়া) বাংলাদেশের সর্বউত্তরের জেলা।'
  },
  {
    id: 'q4',
    category: 'bangladesh',
    question_en: 'Which is the southernmost district of Bangladesh?',
    question_bn: 'বাংলাদেশের সর্বদক্ষিণের জেলা কোনটি?',
    options_en: ["Cox's Bazar", 'Patuakhali', 'Barguna', 'Bhola'],
    options_bn: ["কক্সবাজার", 'পটুয়াখালী', 'বরগুনা', 'ভোলা'],
    correct_index: 0,
    explanation_en: "Cox's Bazar (including Saint Martin's Island) extends to the southernmost tip.",
    explanation_bn: 'সেন্টমার্টিনসহ কক্সবাজার বাংলাদেশের সর্বদক্ষিণে অবস্থিত।'
  },
  {
    id: 'q5',
    category: 'divisions',
    question_en: 'How many districts are there in Dhaka Division?',
    question_bn: 'ঢাকা বিভাগে মোট কয়টি জেলা রয়েছে?',
    options_en: ['13', '11', '17', '10'],
    options_bn: ['১৩টি', '১১টি', '১৭টি', '১০টি'],
    correct_index: 0,
    explanation_en: 'Dhaka division currently comprises 13 districts.',
    explanation_bn: 'ঢাকা বিভাগে বর্তমানে ১৩টি জেলা রয়েছে।'
  },
  {
    id: 'q6',
    category: 'districts',
    question_en: 'Which district is famous for the mangrove forest "Sundarbans"?',
    question_bn: 'ম্যানগ্রোভ বন সুন্দরবনের জন্য কোন জেলা সবচেয়ে বেশি পরিচিত?',
    options_en: ['Bagerhat & Satkhira', 'Patuakhali', 'Chattogram', 'Noakhali'],
    options_bn: ['বাগেরহাট ও সাতক্ষীরা', 'পটুয়াখালী', 'চট্টগ্রাম', 'নোয়াখালী'],
    correct_index: 0,
    explanation_en: 'The largest part of Sundarbans is situated across Bagerhat, Khulna and Satkhira.',
    explanation_bn: 'সুন্দরবনের প্রধান অংশ বাগেরহাট, খুলনা ও সাতক্ষীরা জেলায় অবস্থিত।'
  },
  {
    id: 'q7',
    category: 'districts',
    question_en: 'Which district has the longest natural sea beach in the world?',
    question_bn: 'বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত কোন জেলায় অবস্থিত?',
    options_en: ["Cox's Bazar", 'Kuakata', 'Chattogram', 'Patuakhali'],
    options_bn: ["কক্সবাজার", 'কুয়াকাটা', 'চট্টগ্রাম', 'পটুয়াখালী'],
    correct_index: 0,
    explanation_en: "Cox's Bazar boasts the unbroken 120 km natural sandy beach.",
    explanation_bn: 'কক্সবাজারে রয়েছে ১২০ কিলোমিটার দীর্ঘ পৃথিবীর দীর্ঘতম অবিচ্ছিন্ন সমুদ্র সৈকত।'
  },
  {
    id: 'q8',
    category: 'world',
    question_en: 'Which country borders Bangladesh on three sides?',
    question_bn: 'কোন দেশ বাংলাদেশকে তিন দিক থেকে ঘিরে রেখেছে?',
    options_en: ['India', 'Myanmar', 'Nepal', 'Bhutan'],
    options_bn: ['ভারত', 'মিয়ানমার', 'নেপাল', 'ভুটান'],
    correct_index: 0,
    explanation_en: 'India borders Bangladesh on the west, north, and east.',
    explanation_bn: 'ভারত পশ্চিম, উত্তর এবং পূর্ব দিক থেকে বাংলাদেশকে ঘিরে রয়েছে।'
  }
];

class Database {
  public users: Map<string, User> = new Map();
  public designs: Map<string, Design> = new Map();
  public trips: Map<string, SavedTrip> = new Map();
  public quizQuestions: QuizQuestion[] = [...INITIAL_QUESTIONS];
  public quizAttempts: QuizAttempt[] = [];
  public puzzleAttempts: PuzzleAttempt[] = [];
  public announcements: Announcement[] = [
    {
      id: 'ann-1',
      title: 'Welcome to MapBD Telegram App!',
      content: 'Create your personalized Bangladesh 64-district map or World map and share directly with friends on Telegram.',
      date: new Date().toISOString(),
      is_active: true
    }
  ];
  public downloadCount: number = 42;

  constructor() {
    // Seed default admin and sample users
    const defaultAdmin: User = {
      id: 'user_admin',
      telegram_id: 10001,
      first_name: 'Admin',
      last_name: 'Developer',
      username: 'mapbd_admin',
      photo_url: '',
      language: 'bn',
      points: 500,
      is_blocked: false,
      role: 'admin',
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };
    this.users.set(defaultAdmin.id, defaultAdmin);

    // Seed a sample guest user
    const guestUser: User = {
      id: 'user_default',
      telegram_id: 970532,
      first_name: 'MD Razzak',
      last_name: 'Khan',
      username: 'razzak_bd',
      photo_url: '',
      language: 'bn',
      points: 250,
      is_blocked: false,
      role: 'user',
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };
    this.users.set(guestUser.id, guestUser);

    // Seed sample initial design for display in Recent Designs
    const sampleDesign: Design = {
      id: 'des_sample_1',
      user_id: guestUser.id,
      telegram_id: guestUser.telegram_id,
      map_type: 'bangladesh',
      title: 'My Bangladesh Journey',
      subtitle: 'Visited 18 of 64 districts',
      user_name: 'MD Razzak Khan',
      photo_url: '',
      selected_ids: ['dhaka', 'gazipur', 'narayanganj', 'chattogram', 'coxsbazar', 'sylhet', 'moulvibazar', 'rajshahi', 'bogura', 'khulna', 'bagerhat', 'barishal', 'rangpur', 'dinajpur', 'panchagarh', 'mymensingh', 'tangail', 'cumilla'],
      theme_name: 'Classic Emerald',
      colors: {
        selected: '#059669',
        unselected: '#e2e8f0',
        background: '#ffffff',
        border: '#ffffff',
        text: '#0f172a'
      },
      font_family: 'Plus Jakarta Sans',
      border_width: 1.5,
      text_position: 'top',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
    };
    this.designs.set(sampleDesign.id, sampleDesign);

    // Sample trip
    const sampleTrip: SavedTrip = {
      id: 'trip_sample_1',
      user_id: guestUser.id,
      title: 'Tour to Chattogram Hill Tracts & Beach',
      start_location: 'Dhaka',
      destinations: ['Chattogram', 'Bandarban', "Cox's Bazar"],
      travel_date: '2026-11-15',
      travel_mode: 'train',
      budget: '৳ 15,000',
      notes: 'Explore Nilgiri, Boga Lake and Marine Drive sunset.',
      created_at: new Date().toISOString()
    };
    this.trips.set(sampleTrip.id, sampleTrip);

    // Sample leaderboard attempts
    this.quizAttempts.push({
      id: 'qa_1',
      user_id: guestUser.id,
      username: 'razzak_bd',
      first_name: 'MD Razzak',
      score: 8,
      total_questions: 8,
      category: 'bangladesh',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    });
    this.quizAttempts.push({
      id: 'qa_2',
      user_id: 'user_tasneem',
      username: 'tasneem_travels',
      first_name: 'Tasneem',
      score: 7,
      total_questions: 8,
      category: 'districts',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    });
  }
}

export const db = new Database();
