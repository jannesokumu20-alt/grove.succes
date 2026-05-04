"use client";
import { useState } from "react";

export default function FinesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#020617] text-white pb-28">

      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 bg-[#0B1220]/90 backdrop-blur-lg border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fines</h1>
          <p className="text-sm text-gray-400">Track and manage member fines</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl 
          bg-gradient-to-r from-green-500 to-emerald-600 
          text-black font-semibold shadow-lg shadow-green-500/30">
          <span className="text-lg">+</span>
          <span>Record Fine</span>
        </button>
      </div>

      {/* ===== CARDS ===== */}
      <div className="grid grid-cols-2 gap-4 p-4">

        {/* TOTAL */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-red-500/20 to-red-700/10 border border-red-500/30 shadow-lg shadow-red-500/10">
          <p className="text-sm text-gray-300">Total Fines</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

        {/* PAID */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-green-500/20 to-emerald-700/10 border border-green-500/30 shadow-lg shadow-green-500/10">
          <p className="text-sm text-gray-300">Paid</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

        {/* OUTSTANDING */}
        <div className="rounded-2xl p-4 col-span-2 bg-gradient-to-br from-orange-500/20 to-orange-700/10 border border-orange-500/30 shadow-lg shadow-orange-500/10">
          <p className="text-sm text-gray-300">Outstanding</p>
          <h2 className="text-2xl font-bold mt-2">KES 0</h2>
        </div>

      </div>

      {/* ===== FILTERS ===== */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full bg-green-500 text-black font-medium">
          All
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 text-gray-300">
          Paid
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 text-gray-300">
          Unpaid
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 text-gray-300">
          Overdue
        </button>
      </div>

      {/* ===== EMPTY STATE ===== */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400 mb-4">No fines recorded</p>
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold">
            Record First Fine
          </button>
        </div>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3 z-50">

        {open && (
          <>
            <button className="flex items-center gap-3 bg-green-500 text-black px-4 py-3 rounded-full shadow-lg">
              ➕ <span>Record Fine</span>
            </button>

            <button className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg">
              📊 <span>Reports</span>
            </button>

            <button className="flex items-center gap-3 bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg">
              ✉️ <span>Reminders</span>
            </button>
          </>
        )}

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
