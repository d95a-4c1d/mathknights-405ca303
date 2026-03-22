import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Mission } from '@/data/mockData';
import { ArrowLeft, Target, Calendar, CheckCircle2, Gift, Clock, Trophy, BookOpen, ChevronDown } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';
import { FORMULAS } from '@/data/formulas';
import { formulaPractice } from '@/services/api';

export default function Missions() {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'formula'>('daily');
  const navigate = useNavigate();
  const game = useGame();

  const missions = tab === 'daily' ? game.dailyMissions : game.weeklyMissions;
  const completed = missions.filter(m => m.current >= m.target).length;
  const claimed = missions.filter(m => m.claimed).length;

  // Formula practice state
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);
  const [memorized, setMemorized] = useState<Set<string>>(new Set());
  const [practicing, setPracticing] = useState(false);

  const rewardIcons: Record<string, string> = {
    basic_exp: '📘', advanced_exp: '📗', promotion_ticket: '🎫',
  };

  const handleClaim = (m: Mission) => {
    game.claimMission(m.id, tab as 'daily' | 'weekly');
  };

  const handleMemorize = async (formulaId: string) => {
    if (memorized.has(formulaId) || practicing) return;
    setPracticing(true);
    try {
      await formulaPractice();
      setMemorized(prev => new Set([...prev, formulaId]));
      // Refresh missions to show updated progress
      game.refreshMissions();
    } catch (err) {
      console.error('Formula practice failed:', err);
    } finally {
      setPracticing(false);
    }
  };

  // Group formulas by category
  const formulasByCategory = FORMULAS.reduce<Record<string, typeof FORMULAS>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  // Find formula mission progress
  const formulaMissions = [...game.dailyMissions, ...game.weeklyMissions].filter(m => m.description.includes('公式'));
  const totalFormulaProgress = memorized.size;

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="watermark text-[10vw] md:text-[8vw] top-[12%] right-[3%]">MISSION</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <Target className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">任务</span>
        <SerialTag text="MSN//SYS" className="ml-3 text-white/30" />
      </div>

      <div className="px-4 md:px-6 pt-4 space-y-3">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'formula'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-medium tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
                tab === t ? 'btn-primary' : 'btn-ghost text-muted-foreground'
              }`}
            >
              {t === 'daily' ? <Calendar className="w-3.5 h-3.5" /> :
               t === 'weekly' ? <Trophy className="w-3.5 h-3.5" /> :
               <BookOpen className="w-3.5 h-3.5" />}
              {t === 'daily' ? '每日' : t === 'weekly' ? '每周' : '公式'}
            </button>
          ))}
        </div>

        {tab !== 'formula' && (
          <div className="card-panel-sm p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">整体进度</span>
              <span>
                <span className="text-primary font-bold">{completed}</span>
                <span className="text-muted-foreground"> / {missions.length} 完成 · {claimed} 领取</span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${missions.length ? (completed / missions.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {tab === 'formula' && (
          <div className="card-panel-sm p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">本次已记住</span>
              <span className="text-primary font-bold">{totalFormulaProgress} 个公式</span>
            </div>
            {formulaMissions.length > 0 && (
              <div className="space-y-1 mt-2">
                {formulaMissions.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="h-1.5 flex-1 max-w-[120px] bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((m.current / m.target) * 100, 100)}%` }} />
                    </div>
                    <span>{m.description} {m.current}/{m.target}</span>
                    {m.claimed && <CheckCircle2 className="w-3 h-3 text-primary" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 py-3">
        <AnimatePresence mode="wait">
          {tab === 'formula' ? (
            <motion.div key="formula" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-2xl"
            >
              {Object.entries(formulasByCategory).map(([category, formulas]) => (
                <div key={category}>
                  <SectionHeader title={category} serial={`FML//${category.slice(0, 2).toUpperCase()}`} className="mb-2" />
                  <div className="space-y-2">
                    {formulas.map((f, i) => {
                      const done = memorized.has(f.id);
                      const expanded = expandedFormula === f.id;
                      return (
                        <motion.div key={f.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`card-panel-sm overflow-hidden ${done ? 'opacity-60' : ''}`}
                        >
                          <button
                            onClick={() => setExpandedFormula(expanded ? null : f.id)}
                            className="w-full p-4 flex items-center gap-3 text-left"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${done ? 'icon-block-orange' : 'icon-block-muted'}`}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold">{f.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{f.content.split('\n')[0]}</div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4">
                                  <div className="card-inset p-3 rounded-lg mb-3">
                                    <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">{f.content}</pre>
                                    <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                                      💡 {f.tip}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleMemorize(f.id)}
                                    disabled={done || practicing}
                                    className={`w-full py-2.5 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 ${
                                      done ? 'btn-ghost text-muted-foreground' : 'btn-primary'
                                    }`}
                                  >
                                    {done ? <><CheckCircle2 className="w-3.5 h-3.5" /> 已记住</> : '✓ 记住了'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid gap-2 max-w-3xl"
            >
              {missions.map((m, i) => {
                const done = m.current >= m.target;
                return (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`card-panel-sm p-3 md:p-4 flex items-center gap-3 ${m.claimed ? 'opacity-40' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      m.claimed ? 'icon-block-muted' : done ? 'icon-block-orange' : 'icon-block-muted'
                    }`}>
                      {m.claimed ? <CheckCircle2 className="w-4 h-4" /> :
                       done ? <Gift className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-tight font-medium">{m.description}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1.5 flex-1 max-w-[160px] bg-muted rounded-full overflow-hidden">
                          <div className={`h-full transition-all rounded-full ${done ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: `${Math.min((m.current / m.target) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{m.current}/{m.target}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                      {m.rewards.map((r, j) => (
                        <span key={j}>{rewardIcons[r.type]}×{r.quantity}</span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleClaim(m)}
                      disabled={!done || m.claimed}
                      className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider rounded-lg transition-all shrink-0 ${
                        m.claimed ? 'btn-ghost text-muted-foreground opacity-50' :
                        done ? 'btn-primary' :
                        'btn-ghost text-muted-foreground'
                      }`}
                    >{m.claimed ? '已领取' : done ? '领取' : `${Math.round((m.current / m.target) * 100)}%`}</button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
