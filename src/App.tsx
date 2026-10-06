/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { HomePage } from './components/home/HomePage';
import { BangladeshMapCreator } from './components/map/BangladeshMapCreator';
import { WorldMapCreator } from './components/map/WorldMapCreator';
import { TripPlanner } from './components/trip/TripPlanner';
import { QuizView } from './components/quiz/QuizView';
import { MapPuzzleView } from './components/puzzle/MapPuzzleView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CheckCircle2, Send } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentTab, toast, isTelegramWebApp, user } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Telegram status banner if testing in browser */}
      {!isTelegramWebApp && (
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white text-[11px] font-medium py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-xs">
          <Send className="w-3 h-3 text-sky-200" />
          <span>
            Telegram Web App Mode Active: Simulating user @{user?.username || 'razzak_bd'}
          </span>
        </div>
      )}

      {/* Top Header */}
      <TopBar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md text-xs font-semibold shadow-lg flex items-center gap-2 border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'home' && <HomePage />}
        {currentTab === 'bangladesh' && <BangladeshMapCreator />}
        {currentTab === 'world' && <WorldMapCreator />}
        {currentTab === 'trips' && <TripPlanner />}
        {currentTab === 'quiz' && <QuizView />}
        {currentTab === 'puzzle' && <MapPuzzleView />}
        {currentTab === 'profile' && <ProfileView />}
        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Mobile-first Bottom Navigation (Always accessible, hides only in admin view) */}
      {currentTab !== 'admin' && <BottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
