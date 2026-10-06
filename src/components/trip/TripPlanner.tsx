import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DISTRICTS, DISTRICT_MAP } from '../../data/bangladeshDistricts';
import { api } from '../../services/api';
import { telegram } from '../../services/telegram';
import { SavedTrip } from '../../types';
import {
  Compass,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Car,
  Train,
  Ship,
  Plane,
  Bus,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';

export const TripPlanner: React.FC = () => {
  const { user, language, showToast } = useApp();

  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [startLocation, setStartLocation] = useState('Dhaka');
  const [destinationInput, setDestinationInput] = useState('Chattogram');
  const [destinations, setDestinations] = useState<string[]>(["Cox's Bazar", 'Bandarban']);
  const [travelDate, setTravelDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [travelMode, setTravelMode] = useState<'bus' | 'train' | 'car' | 'launch' | 'air'>('train');
  const [budget, setBudget] = useState('৳ 12,000');
  const [notes, setNotes] = useState('Sunset walk, hill trekking & local food.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getTrips(user?.telegram_id, user?.id);
      if (data.trips) setTrips(data.trips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDestination = () => {
    if (destinationInput && !destinations.includes(destinationInput)) {
      telegram.triggerHaptic('light');
      setDestinations([...destinations, destinationInput]);
    }
  };

  const handleRemoveDestination = (index: number) => {
    telegram.triggerHaptic('light');
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startLocation || destinations.length === 0) {
      showToast(language === 'bn' ? 'সকল প্রয়োজনীয় তথ্য দিন' : 'Please provide trip details');
      return;
    }

    setIsSubmitting(true);
    telegram.triggerHaptic('success');
    try {
      const res = await api.saveTrip(
        {
          title,
          start_location: startLocation,
          destinations,
          travel_date: travelDate,
          travel_mode: travelMode,
          budget,
          notes
        },
        user?.telegram_id,
        user?.id
      );

      if (res.trip) {
        setTrips([res.trip, ...trips]);
        setTitle('');
        showToast(language === 'bn' ? 'ভ্রমণ সফলভাবে প্ল্যান করা হয়েছে!' : 'Trip itinerary saved!');
      }
    } catch (err) {
      showToast('Failed to save trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    telegram.triggerHaptic('medium');
    try {
      await api.deleteTrip(id, user?.telegram_id, user?.id);
      setTrips(trips.filter(t => t.id !== id));
      showToast(language === 'bn' ? 'ভ্রমণ মুছে ফেলা হয়েছে' : 'Trip plan deleted');
    } catch (e) {
      showToast('Failed to delete');
    }
  };

  // Find SVG coordinates for route mapping
  const allStops = [startLocation, ...destinations];
  const stopPoints = allStops
    .map(name => {
      const match = BANGLADESH_DISTRICTS.find(
        d => d.name.toLowerCase() === name.toLowerCase() || d.nameBn === name
      );
      return match ? { name: match.name, x: match.center[0], y: match.center[1] } : null;
    })
    .filter(Boolean) as { name: string; x: number; y: number }[];

  const ModeIcon =
    travelMode === 'train'
      ? Train
      : travelMode === 'air'
      ? Plane
      : travelMode === 'launch'
      ? Ship
      : travelMode === 'car'
      ? Car
      : Bus;

  return (
    <div className="space-y-5 pb-20">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white p-5 shadow-sm">
        <img
          src="/src/assets/images/trip_journey_art_1791284560375.jpg"
          alt="Trip Planner"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>{language === 'bn' ? 'ট্যুর ও রুট প্ল্যানার' : 'Journey Itinerary'}</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {language === 'bn' ? 'আপনার পরবর্তী ভ্রমণ সাজান' : 'Plan Your Journey'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm">
            {language === 'bn'
              ? 'শুরুর স্থান ও গন্তব্যসমূহ যোগ করে ইন্টার‍্যাক্টিভ রুট টাইমলাইন তৈরি করুন।'
              : 'Add starting point and multiple stops to visualize your route.'}
          </p>
        </div>
      </div>

      {/* New Trip Planner Form */}
      <form
        onSubmit={handleSaveTrip}
        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookmarkPlus className="w-4 h-4 text-emerald-600" />
          <span>{language === 'bn' ? 'নতুন ভ্রমণ যোগ করুন' : 'Create New Trip Itinerary'}</span>
        </h3>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'bn' ? 'ভ্রমণের নাম / শিরোনাম' : 'Trip Title'}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sajek Valley & Bandarban Trekking"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Start Location & Destination selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'শুরুর স্থান' : 'Starting Point'}
            </label>
            <select
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            >
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {language === 'bn' ? d.nameBn : d.name} ({d.division})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'গন্তব্য যোগ করুন' : 'Add Destination Stop'}
            </label>
            <div className="flex gap-1.5">
              <select
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {language === 'bn' ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDestination}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Destinations List */}
        {destinations.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
              {language === 'bn' ? 'ভ্রমণের রুট ও স্টপসমূহ' : 'Route Stops Sequence'}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{startLocation} (Start)</span>
              </span>

              {destinations.map((dest, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-slate-400">→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5">
                    <span>{dest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDestination(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date, Mode & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {language === 'bn' ? 'যাত্রার তারিখ' : 'Travel Date'}
              </span>
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                {language === 'bn' ? 'যাতায়াত মাধ্যম' : 'Mode of Travel'}
              </span>
            </label>
            <select
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white capitalize"
            >
              <option value="bus">Bus (বাস)</option>
              <option value="train">Train (ট্রেন)</option>
              <option value="car">Car / Rental (গাড়ি)</option>
              <option value="launch">Launch / Ship (লঞ্চ / জাহাজ)</option>
              <option value="air">Air (বিমান)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                {language === 'bn' ? 'আনুমানিক বাজেট' : 'Budget Estimate'}
              </span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. ৳ 15,000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'bn' ? 'নোট বা পরিকল্পনা' : 'Trip Notes & Packing List'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : language === 'bn' ? 'ভ্রমণ প্ল্যান সংরক্ষণ করুন' : 'Save Trip Itinerary'}</span>
        </button>
      </form>

      {/* Mini SVG Route Visualization */}
      {stopPoints.length >= 2 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'রুট ম্যাপ প্রিভিউ' : 'Route Map Preview'}</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {stopPoints.length} {language === 'bn' ? 'টি স্টপ' : 'Stops'}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-950 p-2 border border-slate-800 flex justify-center">
            <svg viewBox="0 0 800 1000" className="w-full max-w-[280px] h-auto opacity-90">
              {/* Draw light boundary outline of BD districts */}
              {BANGLADESH_DISTRICTS.map((d) => (
                <path
                  key={`bg-${d.id}`}
                  d={d.path}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="0.8"
                />
              ))}

              {/* Draw connecting route path lines */}
              <polyline
                points={stopPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="6,4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Draw pins for each stop */}
              {stopPoints.map((p, idx) => (
                <g key={`point-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="8" fill="#10b981" />
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" />
                  <text
                    x={p.x + 10}
                    y={p.y + 4}
                    fill="#ffffff"
                    fontSize="16"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Saved Trips List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>{language === 'bn' ? 'সংরক্ষিত ভ্রমণসমূহ' : 'Saved Trips'}</span>
          <span className="text-xs font-normal text-slate-500">({trips.length})</span>
        </h3>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading trips...</div>
        ) : trips.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <Compass className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">
              {language === 'bn' ? 'কোনো ভ্রমণ সংরক্ষিত নেই।' : 'No trips planned yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      {trip.travel_mode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {trip.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{trip.start_location}</span>
                    <span className="text-slate-400">→</span>
                    <span className="truncate">{trip.destinations?.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>📅 {trip.travel_date}</span>
                    {trip.budget && <span>💰 {trip.budget}</span>}
                  </div>

                  {trip.notes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      "{trip.notes}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteTrip(trip.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
