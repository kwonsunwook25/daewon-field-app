import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SettlementDashboard() {
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const chartData = [
    { corp: 'B법인', 매출: 1500, 매입: 500, 순정산액: 1000 },
    { corp: 'C법인', 매출: 800, 매입: 1200, 순정산액: -400 },
    { corp: 'D법인', 매출: 200, 매입: 1800, 순정산액: -1600 },
    { corp: 'E법인', 매출: 1000, 매입: 0, 순정산액: 1000 },
  ];

  const matrixData = [
    { from: 'B법인', B: '-', C: 500, D: 800, E: 200, total: 1500 },
    { from: 'C법인', B: 300, C: '-', D: 500, E: 0, total: 800 },
    { from: 'D법인', B: 200, C: 0, D: '-', E: 0, total: 200 },
    { from: 'E법인', B: 0, C: 700, D: 300, E: '-', total: 1000 },
    { from: '합계(매입)', B: 500, C: 1200, D: 1600, E: 200, total: 3500 },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">법인 간 노무비 교차정산 대시보드</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-bold mb-4 text-slate-700">법인별 노무비 순정산(Net) 현황</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="corp" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} 만원`} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="매출" fill="#4ade80" name="청구할 금액(매출)" stackId="a" />
              <Bar dataKey="매입" fill="#f87171" name="지급할 금액(매입)" stackId="a" />
              <Bar dataKey="순정산액" fill="#3b82f6" name="순정산액 (받을돈-줄돈)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4 text-slate-700">법인 간 매출/매입 세금계산서 발행 매트릭스 (단위: 만원)</h2>
        <table className="w-full text-center border-collapse border">
          <thead>
            <tr className="bg-slate-200">
              <th className="border p-3">청구 법인 ↓ \ 지급 법인 →</th>
              <th className="border p-3">B법인</th>
              <th className="border p-3">C법인</th>
              <th className="border p-3">D법인</th>
              <th className="border p-3">E법인</th>
              <th className="border p-3 bg-blue-100 font-bold">총 청구액(매출)</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border p-3 font-semibold bg-slate-100">{row.from}</td>
                <td className="border p-3">{row.B}</td>
                <td className="border p-3">{row.C}</td>
                <td className="border p-3">{row.D}</td>
                <td className="border p-3">{row.E}</td>
                <td className="border p-3 bg-blue-50 font-bold text-blue-700">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}