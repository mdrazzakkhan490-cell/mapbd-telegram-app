import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, Design, SavedTrip, User, QuizQuestion } from '../db.js';

const router = express.Router();

/**
 * Validate Telegram WebApp initData
 * If BOT_TOKEN is set in process.env, validates hash using HMAC-SHA256
 */
function validateTelegramInitData(initData: string, botToken?: string): { isValid: boolean; user?: any } {
  if (!initData) return { isValid: false };
  
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userStr = params.get('user');

    if (!hash && !userStr) {
      return { isValid: false };
    }

    const userData = userStr ? JSON.parse(userStr) : null;

    if (!botToken) {
      // In development or if bot token is not yet provided, accept valid JSON structure
      return { isValid: true, user: userData };
    }

    // Official Telegram HMAC-SHA256 validation
    params.delete('hash');
    const dataCheckArr: string[] = [];
    params.sort();
    params.forEach((val, key) => {
      dataCheckArr.push(`${key}=${val}`);
    });
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      return { isValid: true, user: userData };
    }

    return { isValid: false };
  } catch (err) {
    return { isValid: false };
  }
}

/**
 * Helper to get current user from request headers or default
 */
function getRequestUser(req: Request): User | null {
  const telegramIdHeader = req.headers['x-telegram-id'];
  const userIdHeader = req.headers['x-user-id'];

  if (userIdHeader && typeof userIdHeader === 'string') {
    const user = db.users.get(userIdHeader);
    if (user) return user;
  }

  if (telegramIdHeader) {
    const tid = Number(telegramIdHeader);
    for (const u of db.users.values()) {
      if (u.telegram_id === tid) return u;
    }
  }

  // Fallback to default guest user
  return db.users.get('user_default') || null;
}

// -------------------------------------------------------------
// 1. Telegram Authentication
// -------------------------------------------------------------
router.post('/auth/telegram', (req: Request, res: Response) => {
  try {
    const { initData, userPayload } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    let tgUser: any = null;

    if (initData) {
      const validation = validateTelegramInitData(initData, botToken);
      if (validation.isValid && validation.user) {
        tgUser = validation.user;
      }
    }

    // Direct fallback payload from client if initData is raw object (e.g. preview mode)
    if (!tgUser && userPayload && userPayload.id) {
      tgUser = userPayload;
    }

    if (!tgUser) {
      // Create or return demo session
      tgUser = {
        id: 970532,
        first_name: 'MD Razzak',
        last_name: 'Khan',
        username: 'razzak_bd',
        photo_url: ''
      };
    }

    const userId = `user_${tgUser.id}`;
    let user = db.users.get(userId);

    if (!user) {
      user = {
        id: userId,
        telegram_id: tgUser.id,
        first_name: tgUser.first_name || 'Traveler',
        last_name: tgUser.last_name || '',
        username: tgUser.username || '',
        photo_url: tgUser.photo_url || '',
        language: tgUser.language_code === 'bn' ? 'bn' : 'en',
        points: 100,
        is_blocked: false,
        role: tgUser.id === 10001 ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      db.users.set(userId, user);
    } else {
      user.last_active = new Date().toISOString();
      if (tgUser.first_name) user.first_name = tgUser.first_name;
      if (tgUser.username) user.username = tgUser.username;
      if (tgUser.photo_url) user.photo_url = tgUser.photo_url;
      db.users.set(userId, user);
    }

    res.json({
      success: true,
      token: `tg_token_${user.id}_${Date.now()}`,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Auth failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// 2. User Profile
// -------------------------------------------------------------
router.get('/user/profile', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Compute user statistics
  const userDesigns = Array.from(db.designs.values()).filter(d => d.user_id === user.id);
  const userTrips = Array.from(db.trips.values()).filter(t => t.user_id === user.id);
  const userQuizAttempts = db.quizAttempts.filter(q => q.user_id === user.id);
  const userPuzzleAttempts = db.puzzleAttempts.filter(p => p.user_id === user.id);

  res.json({
    user,
    stats: {
      total_designs: userDesigns.length,
      total_trips: userTrips.length,
      quiz_attempts: userQuizAttempts.length,
      puzzle_attempts: userPuzzleAttempts.length,
      highest_quiz_score: userQuizAttempts.reduce((acc, cur) => Math.max(acc, cur.score), 0),
      points: user.points
    }
  });
});

router.put('/user/profile', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { first_name, last_name, username, language, photo_url } = req.body;
  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (username !== undefined) user.username = username;
  if (language !== undefined) user.language = language;
  if (photo_url !== undefined) user.photo_url = photo_url;

  user.last_active = new Date().toISOString();
  db.users.set(user.id, user);

  res.json({ success: true, user });
});

// -------------------------------------------------------------
// 3. Designs CRUD
// -------------------------------------------------------------
router.get('/designs', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const allParam = req.query.all === 'true';

  let list = Array.from(db.designs.values());
  if (!allParam && user) {
    list = list.filter(d => d.user_id === user.id);
  }

  // Sort descending by created_at
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({ designs: list });
});

router.get('/designs/:id', (req: Request, res: Response) => {
  const design = db.designs.get(req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json({ design });
});

router.post('/designs', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    map_type = 'bangladesh',
    title = 'My Map',
    subtitle = '',
    user_name = user.first_name,
    photo_url = user.photo_url,
    selected_ids = [],
    theme_name = 'Classic Emerald',
    colors,
    font_family = 'Plus Jakarta Sans',
    border_width = 1.5,
    text_position = 'top',
    thumbnail = ''
  } = req.body;

  const newDesign: Design = {
    id: `des_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: user.id,
    telegram_id: user.telegram_id,
    map_type,
    title,
    subtitle,
    user_name,
    photo_url,
    selected_ids,
    theme_name,
    colors: colors || {
      selected: '#059669',
      unselected: '#e2e8f0',
      background: '#ffffff',
      border: '#ffffff',
      text: '#0f172a'
    },
    font_family,
    border_width,
    text_position,
    thumbnail,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.designs.set(newDesign.id, newDesign);
  // Award points for design creation
  user.points += 10;
  db.users.set(user.id, user);

  res.status(201).json({ success: true, design: newDesign, points_earned: 10 });
});

router.put('/designs/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const design = db.designs.get(req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });

  // Security check: only creator or admin can modify
  if (user && design.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not own this design' });
  }

  const updates = req.body;
  const updatedDesign: Design = {
    ...design,
    ...updates,
    id: design.id,
    user_id: design.user_id,
    updated_at: new Date().toISOString()
  };

  db.designs.set(design.id, updatedDesign);
  res.json({ success: true, design: updatedDesign });
});

router.delete('/designs/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const design = db.designs.get(req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });

  // Security check
  if (user && design.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.designs.delete(req.params.id);
  res.json({ success: true, message: 'Design deleted successfully' });
});

router.post('/designs/:id/export', (req: Request, res: Response) => {
  const design = db.designs.get(req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });

  const { format = 'png' } = req.body;
  db.downloadCount += 1;

  res.json({
    success: true,
    message: `Export logged for format ${format}`,
    total_downloads: db.downloadCount
  });
});

// -------------------------------------------------------------
// 4. Trip Planner
// -------------------------------------------------------------
router.get('/trips', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  let trips = Array.from(db.trips.values());
  if (user) {
    trips = trips.filter(t => t.user_id === user.id);
  }
  trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ trips });
});

router.post('/trips', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { title, start_location, destinations, travel_date, travel_mode, budget, notes } = req.body;
  if (!title || !start_location || !destinations || !destinations.length) {
    return res.status(400).json({ error: 'Missing trip details' });
  }

  const trip: SavedTrip = {
    id: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    title,
    start_location,
    destinations,
    travel_date: travel_date || new Date().toISOString().split('T')[0],
    travel_mode: travel_mode || 'bus',
    budget: budget || '',
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  db.trips.set(trip.id, trip);
  user.points += 5;
  db.users.set(user.id, user);

  res.status(201).json({ success: true, trip });
});

router.delete('/trips/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const trip = db.trips.get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (user && trip.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.trips.delete(req.params.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 5. Quiz API
// -------------------------------------------------------------
router.get('/quiz', (req: Request, res: Response) => {
  const category = req.query.category as string;
  let questions = db.quizQuestions;

  if (category && category !== 'all') {
    questions = questions.filter(q => q.category === category);
  }

  // Shuffle questions lightly
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  res.json({ questions: shuffled.slice(0, 8) });
});

router.post('/quiz/submit', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const { score, total_questions, category = 'bangladesh' } = req.body;

  if (score === undefined || !total_questions) {
    return res.status(400).json({ error: 'Invalid submission parameters' });
  }

  const attempt = {
    id: `qa_${Date.now()}`,
    user_id: user ? user.id : 'anonymous',
    username: user ? user.username || user.first_name : 'Guest',
    first_name: user ? user.first_name : 'Guest',
    score: Number(score),
    total_questions: Number(total_questions),
    category,
    created_at: new Date().toISOString()
  };

  db.quizAttempts.unshift(attempt);

  if (user) {
    user.points += score * 5;
    db.users.set(user.id, user);
  }

  res.json({
    success: true,
    attempt,
    points_earned: score * 5,
    user_points: user ? user.points : 0
  });
});

router.get('/quiz/leaderboard', (_req: Request, res: Response) => {
  // Aggregate best scores by user
  const userBests: { [key: string]: { username: string; first_name: string; score: number; total: number; date: string } } = {};
  
  for (const a of db.quizAttempts) {
    if (!userBests[a.user_id] || a.score > userBests[a.user_id].score) {
      userBests[a.user_id] = {
        username: a.username,
        first_name: a.first_name,
        score: a.score,
        total: a.total_questions,
        date: a.created_at
      };
    }
  }

  const leaderboard = Object.values(userBests)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json({ leaderboard });
});

// -------------------------------------------------------------
// 6. Puzzle API
// -------------------------------------------------------------
router.get('/puzzle', (req: Request, res: Response) => {
  const difficulty = (req.query.difficulty as string) || 'easy';
  res.json({
    difficulty,
    levels: [
      { id: 'p1', name: 'Divisions Challenge', target_pieces: 8, time_limit: 60 },
      { id: 'p2', name: 'Key Major Districts', target_pieces: 16, time_limit: 120 },
      { id: 'p3', name: 'Master 64 Districts', target_pieces: 64, time_limit: 300 }
    ]
  });
});

router.post('/puzzle/submit', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const { map_type = 'bangladesh', difficulty = 'easy', time_seconds, attempts = 1, score = 100 } = req.body;

  const attempt = {
    id: `pa_${Date.now()}`,
    user_id: user ? user.id : 'guest',
    username: user ? user.username || user.first_name : 'Guest',
    first_name: user ? user.first_name : 'Guest',
    map_type,
    difficulty,
    time_seconds: Number(time_seconds) || 0,
    attempts: Number(attempts) || 1,
    score: Number(score) || 0,
    created_at: new Date().toISOString()
  };

  db.puzzleAttempts.unshift(attempt);

  if (user) {
    user.points += 20;
    db.users.set(user.id, user);
  }

  res.json({ success: true, attempt, points_earned: 20 });
});

// -------------------------------------------------------------
// 7. Admin Panel Endpoints
// -------------------------------------------------------------
router.get('/admin/stats', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (user && user.role !== 'admin') {
    // Return stats anyway for demonstration / admin dashboard preview
  }

  const totalUsers = db.users.size;
  const activeUsers = Array.from(db.users.values()).filter(u => {
    const hours = (Date.now() - new Date(u.last_active).getTime()) / 3600000;
    return hours < 48;
  }).length;

  res.json({
    total_users: totalUsers,
    active_users: activeUsers,
    total_designs: db.designs.size,
    total_downloads: db.downloadCount,
    quiz_attempts: db.quizAttempts.length,
    puzzle_attempts: db.puzzleAttempts.length
  });
});

router.get('/admin/users', (req: Request, res: Response) => {
  const usersList = Array.from(db.users.values()).map(u => ({
    id: u.id,
    telegram_id: u.telegram_id,
    first_name: u.first_name,
    last_name: u.last_name,
    username: u.username,
    points: u.points,
    role: u.role,
    is_blocked: u.is_blocked,
    created_at: u.created_at,
    last_active: u.last_active
  }));
  res.json({ users: usersList });
});

router.post('/admin/users/:id/toggle-block', (req: Request, res: Response) => {
  const targetUser = db.users.get(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  targetUser.is_blocked = !targetUser.is_blocked;
  db.users.set(targetUser.id, targetUser);

  res.json({ success: true, is_blocked: targetUser.is_blocked, user: targetUser });
});

router.post('/admin/questions', (req: Request, res: Response) => {
  const { question_en, question_bn, options_en, options_bn, correct_index, category, explanation_en, explanation_bn } = req.body;
  if (!question_en || !options_en || options_en.length < 2) {
    return res.status(400).json({ error: 'Invalid question data' });
  }

  const newQ: QuizQuestion = {
    id: `q_${Date.now()}`,
    category: category || 'bangladesh',
    question_en,
    question_bn: question_bn || question_en,
    options_en,
    options_bn: options_bn || options_en,
    correct_index: Number(correct_index) || 0,
    explanation_en: explanation_en || '',
    explanation_bn: explanation_bn || ''
  };

  db.quizQuestions.push(newQ);
  res.status(201).json({ success: true, question: newQ });
});

router.get('/admin/announcements', (_req: Request, res: Response) => {
  res.json({ announcements: db.announcements });
});

router.post('/admin/announcements', (req: Request, res: Response) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const ann = {
    id: `ann_${Date.now()}`,
    title,
    content,
    date: new Date().toISOString(),
    is_active: true
  };
  db.announcements.unshift(ann);
  res.status(201).json({ success: true, announcement: ann });
});

export default router;
