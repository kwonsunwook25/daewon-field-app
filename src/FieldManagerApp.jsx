import './index.css';
import React, { useState } from 'react';
import SignaturePadPopup from './SignaturePadPopup';

// 1. 15개 법인 목록
const CORPORATIONS = [
  "대원전기(주)", "우창전력(주)", "세대전력(주)", "(주)태원전력공사", "(주)정동전력",
  "보람전설(주)", "화신전기(주)", "우림전기(주)", "(주)창전사", "(주)대원전기교육원",
  "대상전력(주)", "대홍전건(주)", "태홍전력(주)", "대원산전(주)", "대명전업(주)"
];

// 2. 각 법인별 소속 현장 (임시 데이터)
const SITE_MAPPING = {
  "대원전기(주)": ["증평 지중화 공사", "청주 고압 배전단가", "본사 안전관리 교육장"],
  "우창전력(주)": ["진천 변전소 신설", "음성 송전선로 유지보수"],
  "세대전력(주)": ["세종 스마트시티 전력망 구축"],
  "(주)태원전력공사": ["천안 일반산업단지 전기설비"],
};

// 3. 9가지 공사 종류
const CONSTRUCTION_TYPES = [
  "내선전기", "전문소방", "구내통신", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);
  
  const [workers, setWorkers] = useState([
    { id: 1, name: '김정규', type: '정규직', baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null },
    { id: 2, name: '이일용', type: '일용직', baseHours: 8, otHours: 2, healthOk: false, signatureUrl: null },
    { id: 3, name: '박안전', type: '일용직', baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null },
  ]);

  // 상위 항목 변경 시 하위 항목 자동 초기화 로직
  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite(''); 
    setSelectedType('');
  };

  const handleSiteChange = (e) => {
    setSelectedSite(e.target.value);
    setSelectedType('');
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const availableSites = selectedCorp 
    ? (SITE_MAPPING[selectedCorp] || [`${selectedCorp} 제1공구`, `${selectedCorp} 제2공구`]) 
    : [];

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
    const unsafeWorkers = workers.filter(w => !w.healthOk || !w.signatureUrl);
    if (unsafeWorkers.length > 0) {
      alert(`건강상태 체크 또는 TBM 서명이 누락된 인원이 있습니다.\n모두 완료해야 투입 승인이 가능합니다.`);
      return;
    }
    alert(`✅ [${selectedCorp}] - [${selectedSite}] - [${selectedType}]\n현장의 출역일보 및 TBM 일지가 등록되었습니다.`);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-24 font-sans text-slate-800">
      <header className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold tracking-tight">통합 현장 투입일보</h1>
          <div className="bg-blue-700 px-3 py-1 rounded-full text-sm font-semibold">총 {workers.length}명</div>
        </div>
        <p className="text-xs text-blue-200 font-medium truncate">
          {selectedCorp ? selectedCorp : '법인 대기중'} 
          {selectedSite ? ` ❯ ${selectedSite}` : ''}
          {selectedType ? ` ❯ ${selectedType}` : ''}
        </p>
      </header>

      <main className="p-4 space-y-5">
        
        {/* STEP 1, 2, 3: 기본 정보 선택 영역 */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. 소속 법인 선택</label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-medium rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              value={selectedCorp} onChange={handleCorpChange}
            >
              <option value="">법인을 선택해 주세요</option>
              {CORPORATIONS.map(corp => (
                <option key={corp} value={corp}>{corp}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${selectedCorp ? 'text-slate-700' : 'text-slate-400'}`}>
              2. 투입 현장(사업장) 선택
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-medium rounded-lg p-3 disabled:opacity-50 disabled:bg-slate-100 focus:ring-2 focus:ring-blue-500"
              value={selectedSite} onChange={handleSiteChange}
              disabled={!selectedCorp} 
            >
              <option value="">현장을 선택해 주세요</option>
              {availableSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${selectedSite ? 'text-slate-700' : 'text-slate-400'}`}>
              3. 공사 종류 선택
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-medium rounded-lg p-3 disabled:opacity-50 disabled:bg-slate-100 focus:ring-2 focus:ring-blue-500"
              value={selectedType} onChange={handleTypeChange}
              disabled={!selectedSite} 
            >
              <option value="">공사 종류를 선택해 주세요</option>
              {CONSTRUCTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </section>

        {/* STEP 4: 인원 입력 (모든 조건이 선택되어야 표시됨) */}
        {selectedCorp && selectedSite && selectedType ? (
          <section className="space-y-4 animate-fade-in-up">
            <h2 className="text-base font-bold text-slate-700 px-1">4. 투입 인원 명단 및 TBM 확인</h2>
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
                    <input type="number" className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" value={worker.baseHours} onChange={(e) => updateWorkerHours(worker.id, 'baseHours', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">연장/야간(H)</label>
                    <input type="number" className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" value={worker.otHours} onChange={(e) => updateWorkerHours(worker.id, 'otHours', e.target.value)} />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={`text-sm font-medium ${worker.healthOk ? 'text-slate-700' : 'text-red-500 font-bold'}`}>🩺 당일 건강 이상 없음</span>
                    <input type="checkbox" className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500" checked={worker.healthOk} onChange={() => toggleHealthCheck(worker.id)} />
                  </label>
                  <hr className="border-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${worker.signatureUrl ? 'text-blue-700' : 'text-slate-600'}`}>
                      👷 TBM 및 보호구 서명
                    </span>
                    {worker.signatureUrl ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded font-bold border border-blue-200">서명완료</span>
                    ) : (
                      <button onClick={() => openSignaturePad(worker)} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 font-semibold shadow-sm transition-colors">서명하기</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="bg-blue-50 border border-blue-100 text-blue-600 p-6 rounded-xl text-center shadow-sm">
            <p className="font-semibold">법인, 현장, 공사 종류를 모두 선택해 주세요.</p>
            <p className="text-sm mt-1 opacity-80">선택 완료 시 인원 명단이 나타납니다.</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full max-w-md p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleSubmit} 
          disabled={!selectedCorp || !selectedSite || !selectedType}
          className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg transition-colors ${
            (!selectedCorp || !selectedSite || !selectedType) ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-800 text-white hover:bg-blue-900'
          }`}
        >
          출역 승인 및 데이터 전송
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