import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { expToNextLevel } from '@/data/mockData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Zap, ChevronUp, ChevronDown, Sparkles, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { SectionHeader, Barcode, SerialTag } from '@/components/Decorative';

interface MaterialPlan {
  basicUsed: number; advancedUsed: number; totalExp: number; overflow: number;
  levelsGained: number; finalLevel: number; finalExp: number; sufficient: boolean; expNeeded: number;
}

function calcPlanToLevel(currentLevel: number, currentExp: number, targetLevel: number, elite: number, basicAvail: number, advAvail: number): MaterialPlan {
  const maxLv = elite === 0 ? 50 : 70;
  const tgt = Math.min(targetLevel, maxLv);
  if (tgt <= currentLevel) return { basicUsed: 0, advancedUsed: 0, totalExp: 0, overflow: 0, levelsGained: 0, finalLevel: currentLevel, finalExp: currentExp, sufficient: true, expNeeded: 0 };

  let totalNeeded = 0;
  let tempExp = currentExp;
  for (let lv = currentLevel; lv < tgt; lv++) {
    const needed = expToNextLevel(lv);
    if (lv === currentLevel) { totalNeeded += needed - tempExp; } else { totalNeeded += needed; }
  }

  const advNeeded = Math.min(Math.ceil(totalNeeded / 500), advAvail);
  let covered = advNeeded * 500;
  let basicNeeded = 0;
  if (covered < totalNeeded) {
    basicNeeded = Math.min(Math.ceil((totalNeeded - covered) / 100), basicAvail);
    covered += basicNeeded * 100;
  }

  const sufficient = covered >= totalNeeded;
  const totalExp = advNeeded * 500 + basicNeeded * 100;

  let lv = currentLevel;
  let exp = currentExp + totalExp;
  while (lv < maxLv && exp >= expToNextLevel(lv)) { exp -= expToNextLevel(lv); lv++; }
  if (lv >= maxLv) lv = maxLv;

  return { basicUsed: basicNeeded, advancedUsed: advNeeded, totalExp, overflow: sufficient ? totalExp - totalNeeded : 0,
    levelsGained: lv - currentLevel, finalLevel: lv, finalExp: exp, sufficient, expNeeded: totalNeeded };
}

export default function Growth() {
  const navigate = useNavigate();
  const game = useGame();
  const maxLevel = game.elite === 0 ? 50 : 70;
  const expNeeded = expToNextLevel(game.level);
  const expPercent = Math.min((game.exp / expNeeded) * 100, 100);
  const canPromote = game.elite === 0 && game.level >= 50 && game.inventory.promotion_ticket >= 20;

  const [targetLevel, setTargetLevel] = useState(Math.min(game.level + 1, maxLevel));
  const [manualBasic, setManualBasic] = useState<number | null>(null);
  const [manualAdv, setManualAdv] = useState<number | null>(null);

  const autoPlan = useMemo(() =>
    calcPlanToLevel(game.level, game.exp, targetLevel, game.elite, game.inventory.basic_exp, game.inventory.advanced_exp),
    [game.level, game.exp, targetLevel, game.elite, game.inventory.basic_exp, game.inventory.advanced_exp]
  );

  const isManual = manualBasic !== null || manualAdv !== null;
  const basicToUse = manualBasic ?? autoPlan.basicUsed;
  const advToUse = manualAdv ?? autoPlan.advancedUsed;
  const actualExp = basicToUse * 100 + advToUse * 500;

  const handleApply = () => {
    if (advToUse > 0) game.useExpCard('advanced_exp', advToUse);
    if (basicToUse > 0) game.useExpCard('basic_exp', basicToUse);
    setManualBasic(null); setManualAdv(null);
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      {/* Watermark */}
      <div className="watermark text-[10vw] md:text-[8vw] top-[20%] right-[5%]">GROWTH</div>

      {/* Top bar */}
      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <TrendingUp className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">成长</span>
        <SerialTag text="GRW-SYS//07" className="ml-3 text-white/30" />
      </div>

      {/* Main — two columns on desktop */}
      <div className="relative z-10 flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-4 p-4 md:p-6">

        {/* LEFT — Status + Radar */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-[360px] shrink-0 flex flex-col gap-4"
        >
          {/* Current status card */}
          <div className="card-panel-dark p-5 relative overflow-hidden">
            <div className="absolute top-3 right-4"><Barcode /></div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220 10% 30%)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(25 95% 53%)" strokeWidth="5"
                    strokeDasharray={`${expPercent * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-white/40 font-medium">LV</span>
                  <span className="font-display text-2xl text-white">{game.level}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">精英{game.elite}</span>
                  <span className="text-[10px] text-white/40 font-mono">MAX LV {maxLevel}</span>
                </div>
                <div className="text-sm font-mono font-medium text-white/80">EXP {game.exp} / {expNeeded}</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${expPercent}%` }} />
                </div>
                <div className="text-[10px] text-white/30 mt-1">还需 {expNeeded - game.exp} EXP 升级</div>
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div className="card-panel flex-1 p-4 min-h-[260px] md:min-h-0 relative overflow-hidden">
            <SectionHeader title="能力分析" serial="COMP//04" className="mb-2" />
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={game.competencies} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="hsl(220 14% 88%)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(220 10% 46%)', fontSize: 10, fontFamily: 'Noto Sans SC' }} />
                <Radar name="分数" dataKey="value" stroke="hsl(25 95% 53%)" fill="hsl(25 95% 53%)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Promotion card */}
          <div className="card-panel p-5">
            <SectionHeader title="晋升" serial="PROMO//01" className="mb-3" />
            {game.elite === 0 ? (
              <>
                <div className="text-sm mb-3 font-medium">精英0 → 精英1</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="card-inset p-3 text-center rounded-lg">
                    <div className="text-[10px] text-muted-foreground mb-1">等级</div>
                    <div className={`font-display text-lg ${game.level >= 50 ? 'text-primary' : ''}`}>{game.level}/50</div>
                  </div>
                  <div className="card-inset p-3 text-center rounded-lg">
                    <div className="text-[10px] text-muted-foreground mb-1">凭证</div>
                    <div className={`font-display text-lg ${game.inventory.promotion_ticket >= 20 ? 'text-primary' : ''}`}>
                      🎫 {game.inventory.promotion_ticket}/20
                    </div>
                  </div>
                </div>
                <button onClick={() => game.promote()} disabled={!canPromote}
                  className={`w-full py-3 text-sm font-semibold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                    canPromote ? 'btn-primary' : 'btn-ghost text-muted-foreground'
                  }`}
                ><ArrowUpCircle className="w-4 h-4" /> 晋升</button>
              </>
            ) : (
              <div className="text-sm text-primary flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" /> 精英1 — 已达最高晋升
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT — Upgrade planner */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col gap-4"
        >
          <div className="card-panel-lg p-5 md:p-6 flex-1 flex flex-col">
            <SectionHeader title="自动升级规划" serial="PLAN//02" className="mb-5" />

            {/* Target level selector */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs text-muted-foreground">目标等级</span>
              <button onClick={() => setTargetLevel(Math.max(game.level + 1, targetLevel - 1))}
                className="w-9 h-9 btn-ghost flex items-center justify-center active:scale-95">
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="font-display text-3xl w-16 text-center text-primary">{targetLevel}</span>
              <button onClick={() => setTargetLevel(Math.min(maxLevel, targetLevel + 1))}
                className="w-9 h-9 btn-ghost flex items-center justify-center active:scale-95">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => setTargetLevel(maxLevel)}
                className="text-[10px] text-muted-foreground hover:text-primary ml-2 font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">MAX</button>
            </div>

            {/* Material cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {[
                { label: '高级经验卡', emoji: '📗', desc: '+500 EXP/张', val: advToUse, own: game.inventory.advanced_exp,
                  dec: () => setManualAdv(Math.max(0, (manualAdv ?? autoPlan.advancedUsed) - 1)),
                  inc: () => setManualAdv(Math.min(game.inventory.advanced_exp, (manualAdv ?? autoPlan.advancedUsed) + 1)) },
                { label: '基础经验卡', emoji: '📘', desc: '+100 EXP/张', val: basicToUse, own: game.inventory.basic_exp,
                  dec: () => setManualBasic(Math.max(0, (manualBasic ?? autoPlan.basicUsed) - 1)),
                  inc: () => setManualBasic(Math.min(game.inventory.basic_exp, (manualBasic ?? autoPlan.basicUsed) + 1)) },
              ].map((card, idx) => (
                <div key={idx} className="card-panel-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${idx === 0 ? 'icon-block-blue' : 'icon-block-orange'} flex items-center justify-center text-lg`}>{card.emoji}</div>
                    <div>
                      <div className="text-sm font-semibold">{card.label}</div>
                      <div className="text-[10px] text-muted-foreground">{card.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={card.dec}
                      className="w-8 h-8 btn-ghost flex items-center justify-center text-sm active:scale-95">−</button>
                    <span className="font-display text-xl w-12 text-center text-primary">{card.val}</span>
                    <button onClick={card.inc}
                      className="w-8 h-8 btn-ghost flex items-center justify-center text-sm active:scale-95">+</button>
                    <span className="text-[10px] text-muted-foreground ml-auto">拥有 {card.own}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card-inset p-4 mb-4 space-y-2 rounded-lg">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">总计获得经验</span>
                <span className="text-primary font-bold text-sm">+{actualExp} EXP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">升至 LV {targetLevel} 所需</span>
                <span className="font-mono">{autoPlan.expNeeded}</span>
              </div>
              {autoPlan.overflow > 0 && !isManual && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">溢出</span>
                  <span className="text-secondary font-medium">+{autoPlan.overflow}</span>
                </div>
              )}
              {!autoPlan.sufficient && !isManual && (
                <div className="text-xs text-destructive flex items-center gap-1 mt-1 bg-destructive/10 p-2 rounded-md">
                  ⚠ 素材不足 — 还差 {autoPlan.expNeeded - (autoPlan.basicUsed * 100 + autoPlan.advancedUsed * 500)} EXP
                </div>
              )}
              <div className="flex justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground">结果</span>
                <span>LV {game.level} → <span className="text-primary font-bold">LV {autoPlan.finalLevel}</span></span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              {isManual && (
                <button onClick={() => { setManualBasic(null); setManualAdv(null); }}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-medium tracking-wider btn-ghost">
                  ↺ 重置为自动
                </button>
              )}
              <button onClick={handleApply} disabled={actualExp === 0}
                className={`w-full py-3.5 text-sm font-semibold tracking-wider flex items-center justify-center gap-2 ${
                  actualExp > 0 ? 'btn-primary' : 'btn-ghost text-muted-foreground'
                }`}
              >
                <Zap className="w-4 h-4" /> 使用 +{actualExp} EXP
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
