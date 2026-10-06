import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { telegram } from '../../services/telegram';
import { QuizQuestion, LeaderboardEntry } from '../../types';
import {
  Brain,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  Trophy,
  Flame,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const QuizView: React.FC = () => {
  const { user, language, refreshProfile, showToast } = useApp();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [category, setCategory] = useState<'all' | 'bangladesh' | 'districts' | 'divisions' | 'world'>('all');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadQuiz();
    loadLeaderboard();
  }, [category]);

  const loadQuiz = async () => {
    setLoading(true);
    setIsComplete(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    try {
      const data = await api.getQuizQuestions(category);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await api.getQuizLeaderboard();
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    } catch (e) {}
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correct_index;

    if (isCorrect) {
      telegram.triggerHaptic('success');
      setScore(prev => prev + 1);
    } else {
      telegram.triggerHaptic('error');
    }
  };

  const handleNextQuestion = () => {
    telegram.triggerHaptic('light');
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsComplete(true);
    telegram.triggerHaptic('heavy');
    try {
      await api.submitQuiz(score, questions.length, category, user?.telegram_id, user?.id);
      refreshProfile();
      loadLeaderboard();
      showToast(language === 'bn' ? 'কুইজ সম্পন্ন হয়েছে! পয়েন্ট যুক্ত হয়েছে।' : 'Quiz completed! Points earned.');
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading quiz questions...
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-4 pb-20">
      {/* Category selector & Leaderboard toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-1.5 shrink-0">
          {(['all', 'bangladesh', 'districts', 'divisions', 'world'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                telegram.triggerHaptic('selection');
                setCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                category === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat === 'all'
                ? language === 'bn' ? 'সকল প্রশ্ন' : 'All'
                : cat === 'bangladesh'
                ? language === 'bn' ? 'বাংলাদেশ' : 'BD Geography'
                : cat === 'districts'
                ? language === 'bn' ? 'জেলাসমূহ' : 'Districts'
                : cat === 'divisions'
                ? language === 'bn' ? 'বিভাগসমূহ' : 'Divisions'
                : language === 'bn' ? 'বিশ্ব' : 'World'}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            telegram.triggerHaptic('light');
            setShowLeaderboard(!showLeaderboard);
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-colors ${
            showLeaderboard
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-white dark:bg-slate-800 text-amber-600 border-amber-300 dark:border-amber-700'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'লিডারবোর্ড' : 'Board'}</span>
        </button>
      </div>

      {/* Leaderboard Modal / Drawer */}
      {showLeaderboard && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{language === 'bn' ? 'শীর্ষস্থান অধিকারী খেলোয়াড়' : 'Top Quiz Champions'}</span>
            </h3>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {leaderboard.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-900'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.first_name} (@{item.username})
                  </span>
                </div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.score} / {item.total} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Card */}
      {!isComplete && currentQ ? (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {language === 'bn' ? 'প্রশ্ন' : 'Question'} {currentIndex + 1} / {questions.length}
              </span>
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{score} pts</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question text */}
          <div className="pt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {language === 'bn' ? currentQ.question_bn : currentQ.question_en}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2 pt-2">
            {(language === 'bn' ? currentQ.options_bn : currentQ.options_en).map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correct_index;

              let btnStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 hover:bg-slate-100/50';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                } else {
                  btnStyle = 'opacity-40 border-slate-200 dark:border-slate-700';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && (
                    <span>
                      {isCorrectAnswer ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <span className="font-bold block">
                {language === 'bn' ? 'ব্যাখ্যা:' : 'Explanation:'}
              </span>
              <p>{language === 'bn' ? currentQ.explanation_bn : currentQ.explanation_en}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{currentIndex + 1 === questions.length ? (language === 'bn' ? 'ফলাফল দেখুন' : 'View Results') : (language === 'bn' ? 'পরবর্তী প্রশ্ন' : 'Next Question')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Final Results Card */
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {score >= questions.length * 0.7
                ? language === 'bn' ? 'অসাধারণ ফলাফল!' : 'Splendid Job!'
                : language === 'bn' ? 'ভালো চেষ্টা!' : 'Good Effort!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'bn'
                ? `আপনি ${questions.length}টির মধ্যে ${score}টি সঠিক উত্তর দিয়েছেন।`
                : `You scored ${score} out of ${questions.length} correct.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 text-amber-700 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>+{score * 5} {language === 'bn' ? 'পয়েন্ট যোগ হয়েছে' : 'Points Earned'}</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={loadQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'bn' ? 'পুনরায় খেলুন' : 'Play Again'}</span>
            </button>
            <button
              onClick={() => {
                telegram.shareToTelegram(
                  `🧠 I scored ${score}/${questions.length} on MapBD Geography Quiz! Can you beat my score?`
                );
              }}
              className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
            >
              {language === 'bn' ? 'শেয়ার' : 'Share'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
