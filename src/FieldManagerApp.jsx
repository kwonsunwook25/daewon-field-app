import './index.css'; // 강제로 디자인 파일 연결
import React, { useState } from 'react';
import SignaturePadPopup from './SignaturePadPopup';

export default function FieldManagerApp() {
  const [selectedSite, setSelectedSite] = useState('');
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  
  const [workers, setWorkers] = useState([
    { id: 1, name: '김정규', type: '정규직', baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null },
    { id: 2, name: '이일용', type: '일용직', baseHours: 8, otHours: 2, healthOk: false, signatureUrl: null },
  ]);

  const handleSiteChange = (e) => setSelectedSite(e.target.value);

  const updateWorkerHours = (id, field, value) => {
    const numValue = Number(value);
    if (numValue < 0 || numValue > 24) return;
    setWorkers(workers.map(w => w.id === id ? { ...w, [field]: numValue } : w));
  };

  const toggleHealthCheck = (id) => {
    setWorkers(workers.map(w => w.id === id ? { ...w, healthOk: !w.healthOk } : w));
  };

  const openSignaturePad = (worker) => {
    setCurrentWorker(worker);
    setIsSignatureOpen(true);
  };

  const saveSignatureUrl = (url) => {
    setWorkers(workers.map(w => w.id === currentWorker.id ? { ...w, signatureUrl: url } : w));
  };

  const handleSubmit = () => {
    if (!selectedSite) {
      alert("투입 현장을 선택해 주세요.");
      return;
    }
    const unsafeWorkers = workers.filter(w => !w.healthOk || !w.signatureUrl);
    if (unsafeWorkers.length > 0) {
      alert(`건강상태 체크 또는 TBM 서명이 누락된 인원이 있습니다.\n모두 완료해야 투입 승인이 가능합니다.`);
      return;
    }
    alert("✅ 성공적으로 출역일보 및 TBM 일지가 등록되었습니다.");
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-24 font-sans text-slate-800">
      <header className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">일일 현장 투입일보</h1>
          <p className="text-xs text-blue-200 mt-1">{new Date().toLocaleDateString('ko-KR')} 기준</p>
        </div>
        <div className="bg-blue-700 px-3 py-1 rounded-full text-sm font-semibold">총 {workers.length}명</div>
      </header>

      <main className="p-4 space-y-5">
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">투입 현장(사업장) 선택</label>
          <select 
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg p-3"
            value={selectedSite} onChange={handleSiteChange}
          >
            <option value="">현장을 선택해 주세요</option>
            <option value="SITE_O_1">증평 종합운동장 (O법인)</option>
            <option value="SITE_B_1">청주 송전탑 신설 (B법인)</option>
          </select>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-700">투입 인원 명단</h2>
          {workers.map((worker) => (
            <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-lg font-bold">{worker.name}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${worker.type === '정규직' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {worker.type}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">주간 근무(H)</label>
                  <input type="number" className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg p-2" value={worker.baseHours} onChange={(e) => updateWorkerHours(worker.id, 'baseHours', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">연장/야간(H)</label>
                  <input type="number" className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg p-2" value={worker.otHours} onChange={(e) => updateWorkerHours(worker.id, 'otHours', e.target.value)} />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={`text-sm font-medium ${worker.healthOk ? 'text-slate-700' : 'text-red-500 font-bold'}`}>🩺 당일 건강 이상 없음</span>
                  <input type="checkbox" className="w-6 h-6 text-blue-600 rounded" checked={worker.healthOk} onChange={() => toggleHealthCheck(worker.id)} />
                </label>
                <hr className="border-slate-200" />
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${worker.signatureUrl ? 'text-blue-700' : 'text-red-500 font-bold'}`}>
                    👷 TBM 및 보호구 서명
                  </span>
                  {worker.signatureUrl ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">서명완료</span>
                  ) : (
                    <button onClick={() => openSignaturePad(worker)} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700">서명하기</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed bottom-0 w-full max-w-md p-4 bg-white border-t border-slate-200 shadow-lg">
        <button onClick={handleSubmit} className="w-full bg-blue-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-blue-900">
          출역 승인 및 원가 배분
        </button>
      </div>

      <SignaturePadPopup 
        isOpen={isSignatureOpen} 
        onClose={() => setIsSignatureOpen(false)} 
        onSave={saveSignatureUrl} 
        workerName={currentWorker?.name} 
        workerId={currentWorker?.id} 
      />
    </div>
  );
}