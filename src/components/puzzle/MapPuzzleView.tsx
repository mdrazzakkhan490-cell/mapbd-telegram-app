import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DISTRICTS, DISTRICT_MAP } from '../../data/bangladeshDistricts';
import { telegram } from '../../services/telegram';
import { api } from '../../services/api';
import { DistrictData } from '../../types';
import {
  Puzzle,
  Timer,
  Award,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const MapPuzzleView: React.FC = () => {
  const { user, language, refreshProfile, showToast } = useApp();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [targetDistrict, setTargetDistrict] = useState<DistrictData | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [candidateOptions, setCandidateOptions] = useState<DistrictData[]>([]);

  // Difficulty target counts
  const targetCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 12 : 20;

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isGameOver) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isGameOver]);

  const startNewGame = () => {
    setSolvedIds([]);
    setAttempts(0);
    setScore(0);
    setSeconds(0);
    setIsActive(true);
    setIsGameOver(false);
    pickNextDistrict([]);
  };

  const pickNextDistrict = (currentSolved: string[]) => {
    const remaining = BANGLADESH_DISTRICTS.filter(d => !currentSolved.includes(d.id));
    if (remaining.length === 0 || currentSolved.length >= targetCount) {
      handleGameOver();
      return;
    }

    const randomTarget = remaining[Math.floor(Math.random() * remaining.length)];
    setTargetDistrict(randomTarget);

    // Pick 3 decoys from remaining or other districts for choice buttons
    const decoys = BANGLADESH_DISTRICTS.filter(d => d.id !== randomTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const candidates = [randomTarget, ...decoys].sort(() => 0.5 - Math.random());
    setCandidateOptions(candidates);
  };

  const handleGuess = (districtId: string) => {
    if (!targetDistrict || isGameOver) return;
    setAttempts(prev => prev + 1);

    if (districtId === targetDistrict.id) {
      telegram.triggerHaptic('success');
      const nextSolved = [...solvedIds, targetDistrict.id];
      setSolvedIds(nextSolved);
      setScore(prev => prev + 10);
      showToast(
        language === 'bn'
          ? `সঠিক! ${targetDistrict.nameBn} যুক্ত হলো`
          : `Correct! ${targetDistrict.name} placed`
      );
      pickNextDistrict(nextSolved);
    } else {
      telegram.triggerHaptic('error');
      showToast(language === 'bn' ? 'ভুল উত্তর, আবার চেষ্টা করুন!' : 'Incorrect guess, try again!');
    }
  };

  const handleGameOver = async () => {
    setIsActive(false);
    setIsGameOver(true);
    telegram.triggerHaptic('heavy');
    try {
      await api.submitPuzzle(score, seconds, attempts, difficulty, user?.telegram_id, user?.id);
      refreshProfile();
    } catch (e) {}
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                telegram.triggerHaptic('selection');
                setDifficulty(diff);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                difficulty === diff
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {diff === 'easy'
                ? language === 'bn' ? 'সহজ' : 'Easy'
                : diff === 'medium'
                ? language === 'bn' ? 'মাঝারি' : 'Medium'
                : language === 'bn' ? 'কঠিন' : 'Hard'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 tabular-nums">
            <Timer className="w-4 h-4 text-rose-500" />
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-emerald-600 font-bold tabular-nums">
            {solvedIds.length} / {targetCount}
          </span>
        </div>
      </div>

      {/* Target Question Card */}
      {!isGameOver && targetDistrict && (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">
            <Puzzle className="w-3.5 h-3.5" />
            <span>
              {language === 'bn' ? 'চিহ্নিত জেলাটি খুঁজে বের করুন' : 'Locate Highlighted District'}
            </span>
          </div>

          <p className="text-xs text-rose-950 dark:text-rose-200">
            {language === 'bn' ? 'বিভাগ:' : 'Division:'}{' '}
            <span className="font-bold">
              {language === 'bn' ? targetDistrict.divisionBn : targetDistrict.division}
            </span>{' '}
            • {language === 'bn' ? targetDistrict.highlightBn : targetDistrict.highlight}
          </p>
        </div>
      )}

      {/* Interactive Map Visual */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700 flex justify-center">
        <svg viewBox="0 0 800 1000" className="w-full max-w-[420px] h-auto">
          {BANGLADESH_DISTRICTS.map((d) => {
            const isTarget = targetDistrict?.id === d.id;
            const isSolved = solvedIds.includes(d.id);

            let fill = '#E2E8F0';
            if (isSolved) fill = '#10B981';
            else if (isTarget) fill = '#F43F5E';

            return (
              <path
                key={d.id}
                d={d.path}
                fill={fill}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                onClick={() => handleGuess(d.id)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isTarget ? 'animate-pulse' : ''
                }`}
              >
                <title>{d.name}</title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Quick Option Candidates */}
      {!isGameOver && (
        <div className="grid grid-cols-2 gap-2">
          {candidateOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleGuess(opt.id)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-500 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between"
            >
              <span>{language === 'bn' ? opt.nameBn : opt.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {opt.division}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Victory Card */}
      {isGameOver && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'পাজল সম্পন্ন হয়েছে!' : 'Puzzle Completed!'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? `${seconds} সেকেন্ডে ${attempts}টি প্রচেষ্টায় সম্পন্ন করেছেন।`
              : `Finished in ${seconds}s with ${attempts} attempts.`}
          </p>

          <button
            onClick={startNewGame}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন করে শুরু' : 'Play Again'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
