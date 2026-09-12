import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Trophy, Download, Trash2, X, Search, ShieldCheck, Zap, Activity } from 'lucide-react';
import { GameMode } from '../../types';

export const ScoreboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { runHistory, clearHistory, exportHistoryCSV, hiscore } = useGameStore();
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');

  const filteredRuns = useMemo(() => {
    return runHistory.filter((run) => {
      const matchesSearch = run.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            run.status.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            run.score.toString().includes(searchFilter);
      const matchesMode = selectedMode === 'ALL' || run.mode === selectedMode;
      return matchesSearch && matchesMode;
    });
  }, [runHistory, searchFilter, selectedMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black border-2 border-[#E056FD] shadow-[0_0_40px_rgba(224,86,253,0.3)] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-[#E056FD]/40 bg-[#0a0010] p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#FFD700] bg-[#FFD700]/10 flex items-center justify-center text-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.4)]">
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#FF003C] tracking-widest uppercase">
                  SOVEREIGN SCORE MATRIX
                </span>
                <span className="text-[10px] text-gray-500 border border-[#333] px-1.5 py-0.2">
                  LOCAL PERSISTENCE // EXPORTABLE
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                PILOT RUN ARCHIVE &amp; TELEMETRY LEDGER
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 border border-[#333] hover:border-[#FF003C] text-gray-400 hover:text-[#FF003C] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#050505] border-b border-[#222] text-xs">
          <div className="border border-[#333] p-2 bg-black">
            <span className="text-[9px] text-gray-500 uppercase block">ALL-TIME HISCORE</span>
            <span className="text-sm font-black text-[#FFD700]">{hiscore.toLocaleString()}</span>
          </div>
          <div className="border border-[#333] p-2 bg-black">
            <span className="text-[9px] text-gray-500 uppercase block">TOTAL LOGGED RUNS</span>
            <span className="text-sm font-black text-white">{runHistory.length}</span>
          </div>
          <div className="border border-[#333] p-2 bg-black">
            <span className="text-[9px] text-gray-500 uppercase block">PURGES / LOSSES</span>
            <span className="text-sm font-black text-[#FF003C]">
              {runHistory.filter(r => r.status === 'PURGED').length}
            </span>
          </div>
          <div className="border border-[#333] p-2 bg-black">
            <span className="text-[9px] text-gray-500 uppercase block">VICTORIES</span>
            <span className="text-sm font-black text-[#39FF14]">
              {runHistory.filter(r => r.status === 'VICTORY').length}
            </span>
          </div>
        </div>

        {/* FILTER & TOOLBAR */}
        <div className="p-3 bg-[#080808] border-b border-[#222] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="SEARCH RUN LEDGER..."
                className="w-full bg-black border border-[#333] text-xs text-[#E056FD] pl-8 pr-3 py-1.5 focus:border-[#E056FD] outline-none font-mono"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-gray-600" />
            </div>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="bg-black border border-[#333] text-[10px] text-white p-1.5 focus:border-[#E056FD] outline-none uppercase"
            >
              <option value="ALL">ALL MODES</option>
              {Object.values(GameMode).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportHistoryCSV}
              disabled={runHistory.length === 0}
              className="px-4 py-2 bg-[#39FF14] text-black font-black text-xs uppercase tracking-wider hover:bg-white flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> [ EXPORT CSV ]
            </button>

            <button
              onClick={() => {
                if (confirm("PURGE ENTIRE LOCAL SCORE LEDGER?")) {
                  clearHistory();
                }
              }}
              disabled={runHistory.length === 0}
              className="px-3 py-2 border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-black font-bold text-xs uppercase flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* SCOREBOARD TABLE */}
        <div className="flex-1 overflow-auto bg-black p-2">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[#0c0014] sticky top-0 z-10 text-[10px] text-[#E056FD] uppercase border-b border-[#E056FD]/30">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">TIMESTAMP</th>
                <th className="p-2.5">MODE</th>
                <th className="p-2.5 text-right">SCORE</th>
                <th className="p-2.5 text-center">PHASE</th>
                <th className="p-2.5 text-center">GRAZE</th>
                <th className="p-2.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818] text-[11px]">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-600 uppercase tracking-widest text-xs">
                    NO ENGAGEMENT DATA RECORDED // COMMENCE FLIGHT PROTOCOL
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run, idx) => {
                  const isTopScore = run.score === hiscore && hiscore > 0;
                  return (
                    <tr
                      key={run.id}
                      className={`hover:bg-[#E056FD]/5 transition-colors ${
                        isTopScore ? 'bg-[#FFD700]/10 border-l-2 border-[#FFD700]' : ''
                      }`}
                    >
                      <td className="p-2.5 text-gray-500 font-bold">{idx + 1}</td>
                      <td className="p-2.5 text-gray-400 whitespace-nowrap">
                        {new Date(run.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-white font-bold">{run.mode}</td>
                      <td className="p-2.5 text-right font-black text-[#E056FD] text-sm">
                        {run.score.toLocaleString()}
                        {isTopScore && <span className="text-[#FFD700] ml-1 text-[9px]">★HI</span>}
                      </td>
                      <td className="p-2.5 text-center text-white">
                        P-{run.bossPhase + 1}
                      </td>
                      <td className="p-2.5 text-center text-[#00F3FF]">
                        {run.graze}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black border ${
                          run.status === 'VICTORY'
                            ? 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/40'
                            : 'bg-[#FF003C]/20 text-[#FF003C] border-[#FF003C]/40'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-[#222] bg-[#050505] flex justify-between items-center text-[10px] text-gray-500">
          <span>CSV SPECIFICATION: RFC-4180 COMPLIANT (UTF-8 BOM)</span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-[#E056FD] text-black font-black uppercase tracking-widest hover:bg-white transition-all"
          >
            RETURN TO TITLE
          </button>
        </div>

      </div>
    </div>
  );
};