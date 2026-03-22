import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { expToNextLevel } from '@/data/mockData';
import type { Problem, RewardItem } from '@/data/mockData';
import { CheckCircle2, ArrowRight, TrendingUp, Package, Target, RotateCcw, XCircle, MessageSquare, Zap } from 'lucide-react';
import { SectionHeader } from '@/components/Decorative';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CompetencyDelta } from '@/services/api';

const COMP_NAMES: Record<keyof CompetencyDelta, string> = {
  compAbstract:    '数学抽象',
  compLogic:       '逻辑推理',
  compModeling:    '数学建模',
  compImagination: '直观想象',
  compComputation: '运算求解',
  compData:        '数据分析',
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const game = useGame();
  const { problem, stageName, rewards, feedback, failed, competencyDelta } = (location.state || {}) as {
    problem: Problem;
    stageName: string;
    rewards: RewardItem[];
    feedback?: string;
    failed?: boolean;
    competencyDelta?: CompetencyDelta | null;
  };

  const isSuccess = !failed;

  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  useEffect(() => {
    if (isSuccess && rewards?.length > 0) {
      const timer = setTimeout(() => setRewardDialogOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!problem) { navigate('/'); return null; }

  const expNeeded = expToNextLevel(game.level);
  const expPercent = Math.min((game.exp / expNeeded) * 100, 100);
  const dailyDone = game.dailyMissions.filter(m => m.current >= m.target).length;

  const rewardIcons: Record<string, string> = {
    basic_exp: '📘', advanced_exp: '📗', promotion_ticket: '🎫',
  };

  const competencyDeltas = competencyDelta
    ? (Object.entries(competencyDelta) as [keyof CompetencyDelta, number][]).filter(([, v]) => v > 0)
    : [];

  return (
    <div className="relative w-screen min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute bottom-0 right-2 text-[22vw] md:text-[16vw] font-display font-black text-white/[0.04] select-none pointer-events-none leading-none z-0">{isSuccess ? 'COMPLETE' : 'RETRY'}</div>

      {/* ── 奖励领取弹窗 ── */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-sm border-border bg-card/95 backdrop-blur-md">
          <DialogHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="w-14 h-14 mx-auto mb-3 icon-block-orange rounded-2xl flex items-center justify-center"
              style={{ boxShadow: '0 8px 32px hsl(25 95% 53% / 0.3)' }}
            >
              <Package className="w-7 h-7" />
            </motion.div>
            <DialogTitle className="font-display tracking-wider text-lg">获得奖励</DialogTitle>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">REWARD // ACQUIRED</p>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {rewards?.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className="card-panel-sm px-4 py-3 flex items-center gap-3"
              >
                <span className="text-2xl">{rewardIcons[r.type]}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{r.type.toUpperCase()}</div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.12, type: 'spring' }}
                  className="font-display text-xl text-primary font-black"
                >
                  ×{r.quantity}
                </motion.div>
              </motion.div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <button
              onClick={() => setRewardDialogOpen(false)}
              className="w-full btn-primary py-3 text-sm font-semibold tracking-widest flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              领取
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 card-panel-lg p-6 md:p-8 w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
            className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
              isSuccess ? 'icon-block-orange' : 'icon-block-muted'
            }`}
            style={isSuccess ? { boxShadow: '0 8px 24px hsl(25 95% 53% / 0.25)' } : {}}
          >
            {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </motion.div>
          <div className="text-xl font-semibold tracking-wide">{isSuccess ? '挑战成功' : '继续加油'}</div>
          <div className="text-muted-foreground text-xs font-mono mt-1">{stageName}</div>
        </div>

        <div className="card-inset p-3 rounded-xl mb-4">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">题目</div>
          <div className="text-sm">{problem.question}</div>
        </div>

        {/* LLM feedback */}
        {feedback && (
          <div className={`card-inset p-3 rounded-xl mb-4 ${isSuccess ? 'border-l-2 border-primary' : 'border-l-2 border-destructive'}`}>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">AI 评语</span>
            </div>
            <div className="text-sm">{feedback}</div>
          </div>
        )}

        {/* 能力增量区块 */}
        {isSuccess && competencyDeltas.length > 0 && (
          <>
            <SectionHeader title="能力提升" serial="COMP//UP" className="mb-3" />
            <div className="flex flex-wrap gap-2 mb-5">
              {competencyDeltas.map(([key, val], i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20"
                >
                  <Zap className="w-3 h-3 text-secondary" />
                  <span className="text-[10px] font-mono text-secondary font-medium">
                    {COMP_NAMES[key]}
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="text-[11px] font-display font-black text-secondary"
                  >
                    +{val}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {isSuccess && rewards.length > 0 && (
          <>
            <SectionHeader title="获得奖励" serial="RWD//01" className="mb-3" />
            <div className="grid grid-cols-2 gap-2 mb-5">
              {rewards.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="card-panel-sm px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="text-lg">{rewardIcons[r.type]}</span>
                  <div>
                    <div className="text-xs font-medium">{r.name}</div>
                    <div className="text-xs text-primary font-semibold">×{r.quantity}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card-panel-sm p-3 text-center">
            <div className="icon-block-orange w-8 h-8 mx-auto flex items-center justify-center mb-1.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-muted-foreground">等级</div>
            <div className="font-display text-lg text-primary">LV {game.level}</div>
            <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${expPercent}%` }} />
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{game.exp}/{expNeeded}</div>
          </div>
          <div className="card-panel-sm p-3 text-center">
            <div className="icon-block-blue w-8 h-8 mx-auto flex items-center justify-center mb-1.5">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-muted-foreground">每日任务</div>
            <div className="font-display text-lg text-secondary">{dailyDone}/{game.dailyMissions.length}</div>
            <div className="text-[9px] text-muted-foreground mt-1">今日已完成</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate(-2)} className="py-2.5 btn-ghost text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> 返回章节
          </button>
          <button onClick={() => navigate('/growth')} className="py-2.5 btn-primary text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> 成长 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
