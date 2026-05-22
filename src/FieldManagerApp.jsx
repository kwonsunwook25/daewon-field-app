import React, { useState } from 'react';
import SignaturePadPopup from './SignaturePadPopup';

// 15개 법인 명단
const CORPORATIONS = [
  "대원전기(주)", "우창전력(주)", "세대전력(주)", "(주)태원전력공사", "(주)정동전력",
  "보람전설(주)", "화신전기(주)", "우림전기(주)", "(주)창전사", "(주)대원전기교육원",
  "대상전력(주)", "대홍전건(주)", "태홍전력(주)", "대원산전(주)", "대명전업(주)"
];

// 법인별 소속 현장 매핑
const SITE_MAPPING = {
  "대원전기(주)": ["증평 지중화 공사 현장", "청주 한전 배전단가 현장", "본사 안전보건 교육장"],
  "우창전력(주)": ["진천 변전소 신설 공사", "음성 가공송전로 점검 현장"],
  "세대전력(주)": ["세종 구내통신망 구축 공사"],
  "(주)태원전력공사": ["천안 산단 내선전기 공사"],
};

// 9가지 공사종류
const CONSTRUCTION_TYPES = [
  "내선전기", "전문소방", "구내통신", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // 💡 [핵심] 법인별 근로자 인력풀 데이터베이스 (초기 샘플 데이터)
  const [corpMasterPool, setCorpMasterPool] = useState({
    "대원전기(주)": [
      { id: 'dw-1', name: '김정규', type: '정규직' },
      { id: 'dw-2', name: '이일용', type: '일용직' },
      { id: 'dw-3', name: '박안전', type: '일용직' }
    ],
    "우창전력(주)": [
      { id: 'wc-1', name: '최전력', type: '정규직' },
      { id: 'wc-2', name: '정송전', type: '일용직' }
    ]
  });

  // 신규 근로자 직접 등록을 위한 입력창 상태값
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerType, setNewWorkerType] = useState('정규직');

  // 💡 오늘 이 현장에 '실제 투입된' 근로자 명단
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);

  // 서명 팝업 관련 상태
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  // 법인 변경 시 하위 항목 및 오늘 투입 명단 초기화
  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite(''); 
    setSelectedType('');
    setTodayActiveWorkers([]); // 법인이 바뀌면 투입 명단 리셋
  };

  const handleSiteChange = (e) => {
    setSelectedSite(e.target.value);
    setSelectedType('');
    setTodayActiveWorkers([]);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setTodayActiveWorkers([]);
  };

  // 현재 선택된 법인의 전체 근로자 인력풀 가져오기
  const currentCorpPool = selectedCorp ? (corpMasterPool[selectedCorp] || []) : [];
  
  // 현재 선택된 법인의 현장 목록 가져오기
  const availableSites = selectedCorp 
    ? (SITE_MAPPING[selectedCorp] || [`${selectedCorp} 상시 현장`]) 
    : [];

  // 1. 신규 근로자 인력풀에 직접 추가 기능
  const handleAddWorkerToPool = (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    const newWorker = {
      id: `custom-${Date.now()}`,
      name: newWorkerName.trim(),
      type: newWorkerType
    };

    setCorpMasterPool({
      ...corpMasterPool,
      [selectedCorp]: [...currentCorpPool, newWorker]
    });

    setNewWorkerName(''); // 입력창 비우기
  };

  // 2. 인력풀에서 오늘 현장으로 인원 선택/체크 기능
  const handleToggleSelectWorker = (worker) => {
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);

    if (isAlreadyAdded) {
      // 이미 들어가 있다면 투입 명단에서 제외
      setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
    } else {
      // 새로 선택했다면 근무시간(8시간), 서명 등이 초기화된 상태로 투입
      setTodayActiveWorkers([
        ...todayActiveWorkers,
        {
          ...worker,
          baseHours: 8,
          otHours: 0,
          healthOk: false,
          signatureUrl: null
        }
      ]);
    }
  };

  // 주간/연장 근무 시간 수정
  const updateWorkerHours = (id, field, value) => {
    const numValue = Number(value);
    if (numValue < 0 || numValue > 24) return;
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === id ? { ...w, [field]: numValue } : w));
  };

  // 건강 상태 체크 토글
  const toggleHealthCheck = (id) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === id ? { ...w, healthOk: !w.healthOk } : w));
  };

  // 서명 패드 열기
  const openSignaturePad = (worker) => {
    setCurrentWorker(worker);
    setIsSignatureOpen(true);
  };

  // 서명 완료 저장
  const saveSignatureUrl = (url) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === currentWorker.id ? { ...w, signatureUrl: url } : w));
  };

  // 출역 제출
  const handleSubmit = () => {
    if (todayActiveWorkers.length === 0) {
      alert("⚠️ 투입된 인원이 없습니다. 인력풀에서 인원을 선택해 주세요.");
      return;
    }
    const unsafeWorkers = todayActiveWorkers.filter(w => !w.healthOk || !w.signatureUrl);
    if (unsafeWorkers.length > 0) {
      alert(`⚠️ 미완료 항목 안내\n건강상태 체크 또는 TBM 안전 서명이 누락된 인원이 있습니다.`);
      return;
    }
    alert(`✅ [출역 전송 완료]\n법인: ${selectedCorp}\n현장: ${selectedSite}\n공종: ${selectedType}\n투입인원: 총 ${todayActiveWorkers.length}명\n\n노무비 및 TBM 데이터가 본사 전산으로 전송되었습니다.`);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-32 font-sans text-slate-800 antialiased">
      <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-5 shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-extrabold tracking-tight">통합 현장 투입일보</h1>
          <span className="bg-blue-600/50 text-white text-xs px-3 py-1 rounded-full font-bold backdrop-blur-sm">
            선택 투입: {todayActiveWorkers.length}명
          </span>
        </div>
        <div className="text-xs text-blue-200 font-semibold mt-2 bg-black/10 p-2 rounded-lg flex flex-wrap gap-1 items-center">
          <span className="text-white">{selectedCorp || "법인 선택 대기"}</span>
          {selectedSite && <><span>❯</span> <span className="text-white">{selectedSite}</span></>}
          {selectedType && <><span>❯</span> <span className="text-yellow-300 font-bold">{selectedType}</span></>}
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* [1단계] 정보 선택 창 */}
        <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">1. 소속 법인 선택</label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
              value={selectedCorp} onChange={handleCorpChange}
            >
              <option value="">소속 법인을 골라주세요</option>
              {CORPORATIONS.map(corp => (
                <option key={corp} value={corp}>{corp}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${selectedCorp ? 'text-slate-500' : 'text-slate-300'}`}>
              2. 투입 현장 선택
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold rounded-xl p-3.5 disabled:opacity-40 disabled:bg-slate-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
              value={selectedSite} onChange={handleSiteChange}
              disabled={!selectedCorp} 
            >
              <option value="">현장을 골라주세요</option>
              {availableSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${selectedSite ? 'text-slate-500' : 'text-slate-300'}`}>
              3. 공사 종류(공종) 선택
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold rounded-xl p-3.5 disabled:opacity-40 disabled:bg-slate-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
              value={selectedType} onChange={handleTypeChange}
              disabled={!selectedSite} 
            >
              <option value="">공사 종류를 골라주세요</option>
              {CONSTRUCTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </section>

        {/* 뼈대 선택이 완료되면 마스터 인력풀 관리 및 선택창 활성화 */}
        {selectedCorp && selectedSite && selectedType && (
          <>
            {/* [2단계] 해당 법인 소속 근로자 직접 등록 (인력풀 DB 채우기) */}
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-700">📋 {selectedCorp} 마스터 인력풀 관리</h2>
              <form onSubmit={handleAddWorkerToPool} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="근로자 성명 입력" 
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-blue-600"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                />
                <select 
                  className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold"
                  value={newWorkerType}
                  onChange={(e) => setNewWorkerType(e.target.value)}
                >
                  <option value="정규직">정규직</option>
                  <option value="일용직">일용직</option>
                </select>
                <button type="submit" className="bg-blue-800 text-white px-4 rounded-xl text-sm font-bold hover:bg-blue-900 active:scale-95 transition-all">
                  등록
                </button>
              </form>

              {/* [3단계] 등록된 인력풀 명단 띄우고 오늘 출근자 선택하기 */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-2">💡 아래 명단에서 오늘 출근자를 터치하여 선택(체크)하세요</label>
                {currentCorpPool.length === 0 ? (
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 p-3 rounded-lg">등록된 근로자가 없습니다. 위의 입력창에 근로자를 먼저 등록해 주세요.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentCorpPool.map((worker) => {
                      const isSelected = todayActiveWorkers.some(w => w.id === worker.id);
                      return (
                        <button
                          key={worker.id}
                          onClick={() => handleToggleSelectWorker(worker)}
                          className={`text-sm font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm ring-2 ring-blue-600/20' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isSelected ? '✅' : '➕'}</span>
                          <span>{worker.name}</span>
                          <span className="text-[10px] opacity-60">({worker.type[0]})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* [4단계] 오늘 선택된 투입 근로자만 실시간 매배분 및 서명 양식 노출 */}
            <section className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-600 px-1">4. 당일 현장 투입 인원 상세 설정 ({todayActiveWorkers.length}명)</h2>
              
              {todayActiveWorkers.length === 0 ? (
                <div className="bg-slate-200/60 text-slate-500 p-8 rounded-2xl text-center border border-dashed border-slate-300">
                  <p className="font-bold text-sm">투입 명단이 비어 있습니다.</p>
                  <p className="text-xs mt-1">위의 마스터 인력풀에서 오늘 출근한 사람을 클릭해 주세요.</p>
                </div>
              ) : (
                todayActiveWorkers.map((worker) => (
                  <div key={worker.id} className="bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden p-4 space-y-4 transition-all">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-900">{worker.name}</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black tracking-wide ${worker.type === '정규직' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'}`}>
                          {worker.type}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleToggleSelectWorker(worker)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        투입 취소
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">주간 근무 시간</label>
                        <input type="number" className="w-full text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" value={worker.baseHours} onChange={(e) => updateWorkerHours(worker.id, 'baseHours', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">연장/야간 시간</label>
                        <input type="number" className="w-full text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" value={worker.otHours} onChange={(e) => updateWorkerHours(worker.id, 'otHours', e.target.value)} />
                      </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-3.5 border border-slate-200/40">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className={`text-sm font-semibold transition-colors ${worker.healthOk ? 'text-slate-700' : 'text-red-500 font-extrabold'}`}>🩺 당일 건강 상태 정상 여부</span>
                        <input type="checkbox" className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 transition-all border-slate-300" checked={worker.healthOk} onChange={() => toggleHealthCheck(worker.id)} />
                      </label>
                      <div className="border-t border-slate-200/60" />
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${worker.signatureUrl ? 'text-blue-700 font-extrabold' : 'text-slate-600'}`}>
                          👷 안전 보호구 검사 및 서명
                        </span>
                        {worker.signatureUrl ? (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-black">서명 완료</span>
                        ) : (
                          <button onClick={() => openSignaturePad(worker)} className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg hover:bg-slate-800 font-bold shadow-md transition-all active:scale-95">서명 받기</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {(!selectedCorp || !selectedSite || !selectedType) && (
          <div className="bg-blue-50/60 border border-blue-200/50 text-blue-700 p-8 rounded-2xl text-center shadow-inner">
            <p className="font-black text-base">법인 ➔ 현장 ➔ 공사 종류</p>
            <p className="text-xs mt-1.5 font-medium text-blue-600/80">3가지 조건을 지정하면 맞춤형 인력풀 관리 시스템이 작동합니다.</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-slate-200/80 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] backdrop-blur-md z-10">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSubmit} 
            disabled={!selectedCorp || !selectedSite || !selectedType || todayActiveWorkers.length === 0}
            className={`w-full font-black text-lg py-4 rounded-xl shadow-xl transition-all ${
              (!selectedCorp || !selectedSite || !selectedType || todayActiveWorkers.length === 0) 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-800 text-white hover:bg-blue-900 shadow-blue-900/20 active:scale-[0.99]'
            }`}
          >
            출역 승인 및 전송
          </button>
        </div>
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