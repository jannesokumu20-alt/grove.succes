"use client";
import { useState } from "react";

export default function ContributionsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#020617] text-white pb-28">

      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 bg-[#0B1220]/90 backdrop-blur-lg border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contributions</h1>
          <p className="text-sm text-gray-400">Track and manage contributions</p>
        </div>

        {/* RECORD BUTTON */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl 
          bg-gradient-to-r from-green-500 to-emerald-600 
          text-black font-semibold shadow-lg shadow-green-500/30 active:scale-95 transition">
          <span className="text-lg">+</span>
          <span>Record</span>
        </button>
      </div>

      {/* ===== CARDS ===== */}
      <div className="grid grid-cols-2 gap-4 p-4">

        {/* TOTAL */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-green-500/20 to-emerald-700/10 border border-green-500/30 shadow-lg shadow-green-500/10">
          <p className="text-sm text-gray-300">Total All Time</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

        {/* MONTH */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500/20 to-blue-700/10 border border-blue-500/30 shadow-lg shadow-blue-500/10">
          <p className="text-sm text-gray-300">This Month</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

        {/* YEAR */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-500/20 to-purple-700/10 border border-purple-500/30 shadow-lg shadow-purple-500/10 col-span-2">
          <p className="text-sm text-gray-300">This Year</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

      </div>

      {/* ===== FILTER BUTTONS ===== */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full bg-green-500 text-black font-medium shadow-md">
          All Time
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 text-gray-300">
          This Month
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 text-gray-300">
          This Year
        </button>
      </div>

      {/* ===== GRAPH (PLACEHOLDER) ===== */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl h-40 bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
          Graph will appear here
        </div>
      </div>

      {/* ===== EMPTY STATE ===== */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400 mb-4">No contributions found</p>
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold">
            Add First Contribution
          </button>
        </div>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3 z-50">

        {open && (
          <>
            <button className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg">
              📄 <span>Records</span>
            </button>

            <button className="flex items-center gap-3 bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg">
              📊 <span>Reports</span>
            </button>

            <button className="flex items-center gap-3 bg-orange-500 text-white px-4 py-3 rounded-full shadow-lg">
              ⚠️ <span>Defaulters</span>
            </button>
          </>
        )}

        {/* MAIN BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="bg-green-500 text-black p-5 rounded-full shadow-xl shadow-green-500/40 text-xl"
        >
          {open ? "✕" : "+"}
        </button>
      </div>

    </div>
  );
}
