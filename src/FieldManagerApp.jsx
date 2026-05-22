import React, { useState } from 'react';
import SignaturePadPopup from './SignaturePadPopup';

const CORPORATIONS = [
  "대원전기(주)", "우창전력(주)", "세대전력(주)", "(주)태원전력공사", "(주)정동전력",
  "보람전설(주)", "화신전기(주)", "우림전기(주)", "(주)창전사", "(주)대원전기교육원",
  "대상전력(주)", "대홍전건(주)", "태홍전력(주)", "대원산전(주)", "대명전업(주)"
];

const SITE_MAPPING = {
  "대원전기(주)": ["증평 지중화 공사 현장", "청주 한전 배전단가 현장", "본사 안전보건 교육장"],
  "우창전력(주)": ["진천 변전소 신설 공사", "음성 가공송전로 점검 현장"],
  "세대전력(주)": ["세종 구내통신망 구축 공사"],
  "(주)태원전력공사": ["천안 산단 내선전기 공사"],
};

const CONSTRUCTION_TYPES = [
  "내선전기", "전문소방", "구내통신", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  // 시스템 모드 스위치: 'daily' (현장 출역일보 작성) | 'admin' (관리자 근로자 선등록)
  const [activeTab, setActiveTab] = useState('daily');

  // 💡 [마스터 인력풀 DB] 법인별, 공사종류(공종)별로 매핑된 통합 인력 DB
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직' },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직' },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직' },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직' },
    { id: 'm-5', corp: '우창전력(주)', constType: '가공송전', name: '정송전', type: '일용직' },
  ]);

  // 관리자 등록용 임시 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');

  // 현장 출역작성 단계용 상태값
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 현장 메인 공종
  
  // 인력 매칭용 소트/필터 검색 상태값 (근로자가 많을 때 찾기 간편하게 구성)
  const [filterCorp, setFilterCorp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 오늘 이 현장에 최종 매 배분된 근로자 명단
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);

  // TBM 서명 패드 팝업 제어
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  // 법인/현장 선택 시 하위 리셋
  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite('');
    setSelectedType('');
    setTodayActiveWorkers([]);
    // 필터링 기본값 자동 동기화 (사용자 편의성 상향)
    setFilterCorp(e.target.value);
  };

  // 1. 관리자 직접 개별 등록 기능
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (!adminCorp || !adminType || !adminName.trim()) {
      alert("법인, 공사종류, 근로자 성명을 모두 입력해 주세요.");
      return;
    }

    const newWorker = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      corp: adminCorp,
      constType: adminType,
      name: adminName.trim(),
      type: adminWorkerType
    };

    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName('');
    alert(`✅ [등록 완료] ${adminCorp} / ${adminType} 공종에 ${adminName} 근로자가 선등록되었습니다.`);
  };

  // 2. 관리자 엑셀/CSV 텍스트 파일 일괄 파싱 및 업로드 업데이터
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const uploadedWorkers = [];

      // 엑셀 규격 가이드라인: 성명,법인명,공사종류,근무형태
      lines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return; // 헤더행 생략
        const cols = line.split(',').map(c => c.trim());
        if (cols.length >= 3) {
          uploadedWorkers.push({
            id: `excel-${Date.now()}-${index}`,
            name: cols[0],
            corp: CORPORATIONS.includes(cols[1]) ? cols[1] : CORPORATIONS[0],
            constType: CONSTRUCTION_TYPES.includes(cols[2]) ? cols[2] : CONSTRUCTION_TYPES[0],
            type: cols[3] === '일용직' ? '일용직' : '정규직'
          });
        }
      });

      if (uploadedWorkers.length > 0) {
        setMasterWorkerPool([...masterWorkerPool, ...uploadedWorkers]);
        alert(`📊 엑셀 데이터 파일 분석 완료!\n총 ${uploadedWorkers.length}명의 근로자가 시스템에 일괄 등록되었습니다.`);
      } else {
        alert("⚠️ 올바른 형식의 파일이 아니거나 데이터가 비어있습니다. 샘플 형식을 참고하세요.");
      }
    };
    reader.readAsText(file, 'EUC-KR'); // 한글 깨짐 방지
  };

  // 3. 오늘 출역 명단에 인원 토글 (투입/취소)
  const handleToggleSelectWorker = (worker) => {
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);
    if (isAlreadyAdded) {
      setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
    } else {
      setTodayActiveWorkers([
        ...todayActiveWorkers,
        { ...worker, baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null }
      ]);
    }
  };

  // 대규모 명단 간편 검색을 위한 소트 & 필터 가공 핵심 로직
  const filteredMasterPool = masterWorkerPool.filter(worker => {
    const matchCorp = filterCorp ? worker.corp === filterCorp : true;
    const matchType = filterType ? worker.constType === filterType : true;
    const matchQuery = searchQuery ? worker.name.includes(searchQuery) : true;
    return matchCorp && matchType && matchQuery;
  });

  const availableSites = selectedCorp ? (SITE_MAPPING[selectedCorp] || [`${selectedCorp} 상시 공구 현장`]) : [];

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-36 font-sans text-slate-800 antialiased">
      
      {/* 고해상도 메인 제어 헤더 */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tight">⚙️ 대원 통합 현장 관리시스템</h1>
          <span className="bg-white/20 text-[11px] px-2.5 py-1 rounded-full font-bold">마스터 DB: {masterWorkerPool.length}명</span>
        </div>

        {/* 탭 네비게이션 제어 바 */}
        <div className="flex bg-black/20 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('daily')}
            className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            📝 현장 출역일보 작성
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            👮 근로자 선등록 대시보드
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* ========================================================= */}
        {/* 모드 1: 관리자 선등록 탭 화면 */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            {/* 직접 추가 컴포넌트 */}
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">👤 근로자 개별 직접 등록</h2>
              <form onSubmit={handleAdminAddWorker} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" value={adminCorp} onChange={e => setAdminCorp(e.target.value)}>
                    <option value="">법인 선택</option>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" value={adminType} onChange={e => setAdminType(e.target.value)}>
                    <option value="">공사종류 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="근로자 성명" 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={adminName} onChange={e => setAdminName(e.target.value)}
                  />
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" value={adminWorkerType} onChange={e => setAdminWorkerType(e.target.value)}>
                    <option value="정규직">정규직</option>
                    <option value="일용직">일용직</option>
                  </select>
                  <button type="submit" className="bg-slate-900 text-white text-xs px-4 rounded-xl font-bold hover:bg-slate-800">등록</button>
                </div>
              </form>
            </section>

            {/* 엑셀/CSV 대량 연동 컴포넌트 */}
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">📊 엑셀 일괄 업로드(.csv 파일 전용)</h2>
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center relative hover:bg-slate-100 transition-all">
                <input type="file" accept=".csv, .txt" onChange={handleExcelUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <p className="text-xs font-extrabold text-slate-600">📁 여기에 파일을 클릭하거나 드래그하세요</p>
                <p className="text-[10px] text-slate-400 mt-1">포맷예시: 성명, 법인명, 공사종류, 근무형태 (첫 행은 제외)</p>
              </div>
            </section>

            {/* 현재 등록 상태 모니터링 테이블 */}
            <section className="bg-white p-4 rounded-2xl shadow-md border border-slate-200/60">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">전체 마스터 등록부 명단 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {masterWorkerPool.map(w => (
                  <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-black text-slate-900 mr-2">{w.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-md">{w.corp}</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{w.constType}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* 모드 2: 일보 및 현장 배치 탭 화면 */}
        {/* ========================================================= */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {/* 기본 타깃 정보 세팅 서식 */}
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">1. 투입 법인 선택</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl p-3 outline-none" value={selectedCorp} onChange={handleCorpChange}>
                  <option value="">소속 법인을 골라주세요</option>
                  {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">2. 현장 선택</label>
                  <select className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-3 outline-none" value={selectedSite} onChange={e => setSelectedSite(e.target.value)} disabled={!selectedCorp}>
                    <option value="">현장 선택</option>
                    {availableSites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">3. 대표 공종</label>
                  <select className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-3 outline-none" value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={!selectedSite}>
                    <option value="">공종 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 조건부 렌더링: 대규모 필터 소팅 패널 및 배치 트리거 */}
            {selectedCorp && selectedSite && selectedType && (
              <>
                {/* 🎯 [핵심 요구사항] 대규모 근로자 정밀 소트/퀵 필터 시스템 */}
                <section className="bg-white p-4 rounded-2xl shadow-md border border-blue-200/60 space-y-3 ring-2 ring-blue-500/5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1">🔍 선등록 근로자 소트/필터 검색</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">검색결과: {filteredMasterPool.length}명</span>
                  </div>
                  
                  {/* 정렬 필터 컨트롤 블록 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <select className="bg-slate-50 border border-slate-200 text-[11px] font-black p-2 rounded-xl outline-none" value={filterCorp} onChange={e => setFilterCorp(e.target.value)}>
                      <option value="">모든 법인 소트</option>
                      {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="bg-slate-50 border border-slate-200 text-[11px] font-black p-2 rounded-xl outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="">모든 공사종류 소트</option>
                      {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <input 
                    type="text" placeholder="🔎 이름으로 빠르게 찾기..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-xl outline-none focus:border-blue-500"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />

                  {/* 필터 정렬된 결과 명단 노출 구역 */}
                  <div className="pt-1">
                    {filteredMasterPool.length === 0 ? (
                      <p className="text-[11px] text-center text-slate-400 bg-slate-50 p-4 rounded-xl">해당 소트 조건에 일치하는 선등록자가 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-0.5">
                        {filteredMasterPool.map(worker => {
                          const isSelected = todayActiveWorkers.some(w => w.id === worker.id);
                          return (
                            <button
                              key={worker.id} onClick={() => handleToggleSelectWorker(worker)}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                            >
                              {isSelected ? '✓ ' : '+ '} {worker.name} 
                              <span className="text-[9px] opacity-70 font-normal"> ({worker.constType})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* 4단계: 오늘 최종 투입 인력 명단 카드 */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 px-1">👷 오늘 현장 실제 배치 인원 ({todayActiveWorkers.length}명)</h3>
                  {todayActiveWorkers.length === 0 ? (
                    <div className="bg-slate-200/50 text-slate-400 p-8 rounded-2xl text-center border border-dashed border-slate-300 text-xs font-bold">
                      선택 배치된 인원이 없습니다.<br/>위의 소트 패널에서 근로자를 선택해 주세요.
                    </div>
                  ) : (
                    todayActiveWorkers.map(worker => (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-900">{worker.name}</span>
                            <span className="text-[10px] bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-md font-bold">{worker.corp}</span>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">{worker.constType}</span>
                          </div>
                          <button onClick={() => handleToggleSelectWorker(worker)} className="text-xs text-red-400 font-bold hover:underline">제외</button>
                        </div>

                        {/* 시수 연동 입력창 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">주간 근무 (시간)</label>
                            <input type="number" className="w-full text-center text-sm font-black bg-slate-50 border rounded-lg p-2" value={worker.baseHours} onChange={e => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, baseHours: Number(e.target.value)} : w))} />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">연장/야간 (시간)</label>
                            <input type="number" className="w-full text-center text-sm font-black bg-slate-50 border rounded-lg p-2" value={worker.otHours} onChange={e => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, otHours: Number(e.target.value)} : w))} />
                          </div>
                        </div>

                        {/* 건강상태 및 모바일 서명 컴포넌트 */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-2">
                          <label className="flex justify-between items-center cursor-pointer">
                            <span className={worker.healthOk ? 'text-slate-600 font-bold' : 'text-red-500 font-black'}>🩺 당일 건강 상태 정상 여부</span>
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={worker.healthOk} onChange={() => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, healthOk: !w.healthOk} : w))} />
                          </label>
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                            <span className={worker.signatureUrl ? 'text-blue-700 font-black' : 'text-slate-500 font-bold'}>👷 안전보호구 검사 및 서명</span>
                            {worker.signatureUrl ? (
                              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-black">서명완료</span>
                            ) : (
                              <button onClick={() => { setCurrentWorker(worker); setIsSignatureOpen(true); }} className="bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold">서명 받기</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </>
            )}

            {/* 초기 가이드 */}
            {(!selectedCorp || !selectedSite || !selectedType) && (
              <div className="bg-blue-50/60 border border-blue-200/50 text-blue-700 p-8 rounded-2xl text-center shadow-inner text-xs">
                <p className="font-black text-sm">상단 정보를 지정해 주세요.</p>
                <p className="mt-1 text-blue-600/80">선등록된 인력풀에서 소트 및 추출할 수 있는 특수 정렬 시스템이 작동합니다.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 하단 고정 종합 전송 바 */}
      {activeTab === 'daily' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-slate-200/80 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] backdrop-blur-md z-20">
          <div className="max-w-md mx-auto">
            <button 
              disabled={!selectedCorp || !selectedSite || !selectedType || todayActiveWorkers.length === 0}
              onClick={() => {
                if(todayActiveWorkers.some(w => !w.healthOk || !w.signatureUrl)) {
                  alert("⚠️ 미완료 항목 안내\n건강체크 또는 TBM 서명이 누락된 인원이 있습니다.");
                  return;
                }
                alert(`✅ [출역 데이터 통합 전송 완료]\n법인: ${selectedCorp}\n현장: ${selectedSite}\n총 ${todayActiveWorkers.length}명의 데이터가 본사ERP 정산시스템으로 즉시 전송되었습니다.`);
              }}
              className={`w-full font-black text-base py-4 rounded-xl shadow-xl transition-all ${(!selectedCorp || !selectedSite || !selectedType || todayActiveWorkers.length === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-800 text-white hover:bg-blue-900 shadow-blue-900/20'}`}
            >
              출역 전송 및 데이터 집계
            </button>
          </div>
        </div>
      )}

      <SignaturePadPopup 
        isOpen={isSignatureOpen} 
        onClose={() => setIsSignatureOpen(false)} 
        onSave={(url) => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === currentWorker.id ? { ...w, signatureUrl: url } : w))} 
        workerName={currentWorker?.name} 
        workerId={currentWorker?.id} 
      />
    </div>
  );
}