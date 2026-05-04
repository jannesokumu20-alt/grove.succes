"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ContributionsPage() {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const chartData = [
    { name: "Jan", amount: 0 },
    { name: "Feb", amount: 0 },
    { name: "Mar", amount: 0 },
    { name: "Apr", amount: 0 },
    { name: "May", amount: 0 },
    { name: "Jun", amount: 0 },
  ];

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
        {["all", "month", "year"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeFilter === filter
                ? "bg-green-500 text-black shadow-md shadow-green-500/30"
                : "border border-white/20 text-gray-300 hover:border-white/40"
            }`}
          >
            {filter === "all" ? "All Time" : filter === "month" ? "This Month" : "This Year"}
          </button>
        ))}
      </div>

      {/* ===== GRAPH (REAL CHART) ===== */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-md shadow-black/30 p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== EMPTY STATE ===== */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md shadow-md shadow-black/30 text-center">
          <p className="text-gray-400 mb-4">No contributions yet</p>
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold shadow-lg shadow-green-500/30 active:scale-95 transition">
            + Add First Contribution
          </button>
        </div>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3 z-50">

        {open && (
          <>
            <button className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50">
              📄 <span>Records</span>
            </button>

            <button className="flex items-center gap-3 bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50">
              📊 <span>Reports</span>
            </button>

            <button className="flex items-center gap-3 bg-orange-500 text-white px-4 py-3 rounded-full shadow-lg shadow-orange-500/30 transition hover:shadow-orange-500/50">
              ⚠️ <span>Defaulters</span>
            </button>
          </>
        )}

        {/* MAIN BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-green-500 text-black px-4 py-3 rounded-full shadow-xl shadow-green-500/40 font-medium transition active:scale-95"
        >
          <span className="text-lg">{open ? "✕" : "+"}</span>
          {!open && <span className="text-sm">Add</span>}
        </button>
      </div>

    </div>
  );
}
