'use client';

import { useState } from 'react';

export default function ContributionsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050B18] text-white pb-28">

      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 bg-[#0B1220]/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Contributions</h1>
            <p className="text-gray-400 text-sm">
              Track and manage contributions
            </p>
          </div>

          {/* RECORD BUTTON */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl 
                       bg-gradient-to-r from-green-500 to-emerald-600 
                       text-black font-semibold shadow-lg shadow-green-500/30
                       active:scale-95 transition"
          >
            <span className="text-lg">+</span>
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-5">

        {/* TOTAL */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-700/10 border border-green-500/20">
          <p className="text-gray-400 text-sm">Total All Time</p>
          <h2 className="text-xl font-bold mt-2">KES 0</h2>
        </div>

        {/* MONTH */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-700/10 border border-blue-500/20">
          <p className="text-gray-400 text-sm">This Month</p>
          <h2 className="text-xl font-bold mt-2">KES 0</h2>
        </div>

        {/* YEAR */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-700/10 border border-purple-500/20 col-span-2">
          <p className="text-gray-400 text-sm">This Year</p>
          <h2 className="text-xl font-bold mt-2">KES 0</h2>
        </div>

      </div>

      {/* ===== FILTER TABS ===== */}
      <div className="flex gap-3 px-4 mt-5">
        <button className="px-5 py-2 rounded-full bg-green-500 text-black font-semibold shadow-lg shadow-green-500/30">
          All Time
        </button>
        <button className="px-5 py-2 rounded-full border border-white/20 text-white">
          This Month
        </button>
        <button className="px-5 py-2 rounded-full border border-white/20 text-white">
          This Year
        </button>
      </div>

      {/* ===== GRAPH (UI ONLY) ===== */}
      <div className="mx-4 mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <p className="text-gray-400 text-sm mb-3">Contribution Trend</p>

        <div className="h-40 flex items-end gap-2">
          {[20, 40, 30, 60, 50, 80, 40].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-lg"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* ===== EMPTY STATE ===== */}
      <div className="mx-4 mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400 mb-4">No contributions found</p>

        <button
          className="px-6 py-3 rounded-xl bg-green-500 text-black font-semibold shadow-lg shadow-green-500/30"
        >
          Add First Contribution
        </button>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">

        {menuOpen && (
          <>
            <button
              className="flex items-center gap-3 bg-green-500 text-black px-4 py-3 rounded-full shadow-lg shadow-green-500/40"
            >
              ➕ <span>Record Contribution</span>
            </button>

            <button
              className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg"
            >
              👥 <span>Add Member</span>
            </button>

            <button
              className="flex items-center gap-3 bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg"
            >
              💰 <span>Add Loan</span>
            </button>

            <button
              className="flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-full shadow-lg"
            >
              ⚠️ <span>Add Fine</span>
            </button>
          </>
        )}

        {/* MAIN + BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-14 h-14 flex items-center justify-center rounded-full 
                     bg-gradient-to-r from-green-500 to-emerald-600 
                     text-black text-2xl shadow-lg shadow-green-500/40"
        >
          {menuOpen ? "×" : "+"}
        </button>
      </div>

      {/* ===== BOTTOM SPACING (FOR NAVBAR) ===== */}
      <div className="h-20" />
    </div>
  );
}
