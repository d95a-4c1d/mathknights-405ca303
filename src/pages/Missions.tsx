import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import type { Mission } from '@/data/mockData';
import { ArrowLeft, Target, Calendar, CheckCircle2, Gift, Clock, Trophy } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';

export default function Missions() {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const navigate = useNavigate();
  const game = useGame();

  const missions = tab === 'daily' ? game.dailyMissions : game.weeklyMissions;
  const completed = missions.filter(m => m.current >= m.target).length;
  const claimed = missions.filter(m => m.claimed).length;

  const rewardIcons: Record<string, string> = {
    basic_exp: '📘', advanced_exp: '📗', promotion_ticket: '🎫',
  };

  const handleClaim = (m: Mission) => {
    game.claimMission(m.id, tab);
  };

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
          {(['daily', 'weekly'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-xs font-medium tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                tab === t ? 'btn-primary' : 'btn-ghost text-muted-foreground'
              }`}
            >
              {t === 'daily' ? <Calendar className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
              {t === 'daily' ? '每日' : '每周'}
            </button>
          ))}
        </div>

        <div className="card-panel-sm p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">整体进度</span>
            <span>
              <span className="text-primary font-bold">{completed}</span>
              <span className="text-muted-foreground"> / {missions.length} 完成 · {claimed} 领取</span>
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${(completed / missions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3">
        <div className="grid gap-2 max-w-3xl">
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
        </div>
      </div>
    </div>
  );
}
