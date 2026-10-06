import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { telegram } from '../../services/telegram';
import {
  ShieldCheck,
  Users,
  Layers,
  Download,
  Brain,
  Puzzle,
  Ban,
  CheckCircle,
  PlusCircle,
  Megaphone,
  ArrowLeft
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, setCurrentTab, showToast, language } = useApp();

  const [stats, setStats] = useState<any>({
    total_users: 0,
    active_users: 0,
    total_designs: 0,
    total_downloads: 0,
    quiz_attempts: 0,
    puzzle_attempts: 0
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New question form
  const [newQuestionEn, setNewQuestionEn] = useState('');
  const [newQuestionBn, setNewQuestionBn] = useState('');
  const [newOptionsEn, setNewOptionsEn] = useState('Option A, Option B, Option C, Option D');
  const [newOptionsBn, setNewOptionsBn] = useState('অপশন ক, অপশন খ, অপশন গ, অপশন ঘ');
  const [correctIndex, setCorrectIndex] = useState(0);

  // Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        api.getAdminStats(user?.telegram_id, user?.id),
        api.getAdminUsers(user?.telegram_id, user?.id)
      ]);
      if (sRes) setStats(sRes);
      if (uRes.users) setUsersList(uRes.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (targetId: string) => {
    telegram.triggerHaptic('medium');
    try {
      const res = await api.toggleBlockUser(targetId, user?.telegram_id, user?.id);
      if (res.success) {
        setUsersList(usersList.map(u => u.id === targetId ? { ...u, is_blocked: res.is_blocked } : u));
        showToast(res.is_blocked ? 'User blocked' : 'User unblocked');
      }
    } catch (e) {
      showToast('Action failed');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuizQuestion(
        {
          question_en: newQuestionEn,
          question_bn: newQuestionBn,
          options_en: newOptionsEn.split(',').map(s => s.trim()),
          options_bn: newOptionsBn.split(',').map(s => s.trim()),
          correct_index: correctIndex,
          category: 'districts'
        },
        user?.telegram_id,
        user?.id
      );
      showToast('Question added to database!');
      setNewQuestionEn('');
      setNewQuestionBn('');
    } catch (e) {
      showToast('Failed to add question');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(annTitle, annContent, user?.telegram_id, user?.id);
      showToast('Announcement posted!');
      setAnnTitle('');
      setAnnContent('');
    } catch (e) {
      showToast('Failed to post');
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold">Total Users</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.total_users}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {stats.active_users} active (48h)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold">Designs</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.total_designs}
          </div>
          <span className="text-[10px] text-slate-400">Created so far</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Download className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold">Downloads</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.total_downloads}
          </div>
          <span className="text-[10px] text-slate-400">PNG, JPG, PDF</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold">Quiz Plays</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.quiz_attempts}
          </div>
          <span className="text-[10px] text-slate-400">Total attempts</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Puzzle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold">Puzzle Plays</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.puzzle_attempts}
          </div>
          <span className="text-[10px] text-slate-400">Map puzzle games</span>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>User Management</span>
          </h3>
          <span className="text-xs text-slate-400">({usersList.length} users)</span>
        </div>

        <input
          type="text"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
        />

        <div className="max-h-56 overflow-y-auto space-y-2">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {u.first_name} {u.last_name || ''} (@{u.username || 'user'})
                </span>
                <span className="text-[10px] text-slate-400 block">
                  TG: {u.telegram_id} • Points: {u.points} • Role: {u.role}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleBlock(u.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    u.is_blocked
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Ban className="w-3 h-3" />
                  <span>{u.is_blocked ? 'Unblock' : 'Block'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Management (Quiz & Announcements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Add Quiz Question */}
        <form
          onSubmit={handleAddQuestion}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-purple-600" />
            <span>Add Quiz Question</span>
          </h3>

          <input
            type="text"
            required
            value={newQuestionEn}
            onChange={(e) => setNewQuestionEn(e.target.value)}
            placeholder="Question in English"
            className="w-full px-3 py-1.5 rounded-xl border text-xs"
          />

          <input
            type="text"
            required
            value={newQuestionBn}
            onChange={(e) => setNewQuestionBn(e.target.value)}
            placeholder="বাংলায় প্রশ্ন"
            className="w-full px-3 py-1.5 rounded-xl border text-xs"
          />

          <input
            type="text"
            value={newOptionsEn}
            onChange={(e) => setNewOptionsEn(e.target.value)}
            placeholder="Options (comma separated)"
            className="w-full px-3 py-1.5 rounded-xl border text-xs"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Correct index (0-3):</span>
            <input
              type="number"
              min="0"
              max="3"
              value={correctIndex}
              onChange={(e) => setCorrectIndex(Number(e.target.value))}
              className="w-16 px-2 py-1 rounded-lg border text-xs text-center"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
          >
            Save Question
          </button>
        </form>

        {/* Post Announcement */}
        <form
          onSubmit={handleCreateAnnouncement}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-sky-600" />
            <span>Post Announcement</span>
          </h3>

          <input
            type="text"
            required
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Announcement Title"
            className="w-full px-3 py-1.5 rounded-xl border text-xs"
          />

          <textarea
            rows={3}
            required
            value={annContent}
            onChange={(e) => setAnnContent(e.target.value)}
            placeholder="Announcement details..."
            className="w-full px-3 py-1.5 rounded-xl border text-xs"
          />

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
          >
            Broadcast Announcement
          </button>
        </form>
      </div>
    </div>
  );
};
