import { useGame } from '@/context/GameContext';
import { COMPETENCIES, expToNextLevel } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { BookOpen, Target, TrendingUp, Package, Settings, ChevronRight, Award, Star, Shield } from 'lucide-react';
import { Barcode, SerialTag, SectionHeader } from '@/components/Decorative';

const menuItems = [
  { label: '学习', sub: '开始学习之旅', path: '/study', icon: BookOpen, accent: true },
  { label: '任务', sub: '每日与每周任务', path: '/missions', icon: Target },
  { label: '成长', sub: '升级强化', path: '/growth', icon: TrendingUp },
  { label: '仓库', sub: '物品与素材', path: '/inventory', icon: Package },
  { label: '设置', sub: '系统配置', path: '/settings', icon: Settings },
];

export default function Home() {
  const game = useGame();
  const navigate = useNavigate();
  const expNeeded = expToNextLevel(game.level);
  const expPercent = Math.min((game.exp / expNeeded) * 100, 100);
  const dailyDone = game.dailyMissions.filter(m => m.current >= m.target).length;
  const totalSolved = game.easyCompleted + game.hardCompleted;

  return (
    <div className="relative w-screen min-h-screen bg-background overflow-y-auto md:overflow-hidden md:h-screen">
      {/* Giant watermark */}
      <div className="watermark text-[8vw] md:text-[12vw] top-[15%] left-[5%] opacity-100">
        MATHEMATICS
      </div>
      <div className="watermark text-[4vw] md:text-[5vw] bottom-[10%] right-[5%] opacity-100">
        KNIGHTS
      </div>

      {/* Top bar — dark style */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-12 glass-dark rounded-none"
        style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="icon-block-orange w-7 h-7 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-display text-xs tracking-[0.2em] text-white/90">MATHKNIGHTS</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
            <span>📘</span><span className="text-white/80 font-medium">{game.inventory.basic_exp}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
            <span>📗</span><span className="text-white/80 font-medium">{game.inventory.advanced_exp}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
            <span>🎫</span><span className="text-primary font-medium">{game.inventory.promotion_ticket}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-4 p-4 md:p-6 md:h-[calc(100vh-48px)]">
        {/* Left column — profile + radar */}
        <motion.div
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 w-full md:w-[380px] shrink-0"
        >
          {/* Profile card — dark */}
          <div className="card-panel-dark p-5 relative overflow-hidden">
            <div className="absolute top-3 right-4"><Barcode /></div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220 10% 30%)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(25 95% 53%)" strokeWidth="4"
                    strokeDasharray={`${expPercent * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-white/50 font-medium tracking-wider">LV</span>
                  <span className="font-display text-xl text-white leading-none">{game.level}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-white/90 tracking-wide">干员</span>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">精英{game.elite}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${expPercent}%` }} />
                </div>
                <div className="text-[10px] text-white/40 mt-1 font-mono">
                  {game.exp} / {expNeeded} EXP
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Target, label: '每日', value: `${dailyDone}/${game.dailyMissions.length}`, bg: 'icon-block-orange' },
              { icon: Star, label: '章节', value: '1-1', bg: 'icon-block-blue' },
              { icon: Award, label: '已解', value: `${totalSolved}`, bg: 'icon-block-dark' },
            ].map((s, i) => (
              <div key={i} className="card-panel-sm p-3 text-center">
                <div className={`w-8 h-8 mx-auto ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="font-display text-lg leading-none">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="card-panel flex-1 p-4 min-h-[240px] md:min-h-0 relative overflow-hidden">
            <SectionHeader title="能力分析" serial="COMP.ANALYSIS//04" className="mb-2" />
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={COMPETENCIES} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="hsl(220 14% 88%)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(220 10% 46%)', fontSize: 10, fontFamily: 'Noto Sans SC' }} />
                <Radar name="分数" dataKey="value" stroke="hsl(25 95% 53%)" fill="hsl(25 95% 53%)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right — large menu nav */}
        <div className="flex-1 flex flex-col justify-center gap-3 md:pl-4 pb-6 md:pb-0">
          <div className="hidden md:block mb-2">
            <SectionHeader title="作战终端" serial="MK-NAV//01" />
          </div>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                onClick={() => navigate(item.path)}
                className={`card-panel card-hover flex items-center gap-4 px-5 py-4 w-full md:max-w-lg md:ml-auto text-left group relative overflow-hidden ${
                  item.accent ? '' : ''
                }`}
              >
                {/* Accent left bar for study */}
                {item.accent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />}
                <div className={`w-11 h-11 flex items-center justify-center shrink-0 ${
                  item.accent ? 'icon-block-orange' : 'icon-block-muted'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold tracking-wide group-hover:text-primary transition-colors ${item.accent ? 'text-primary' : ''}`}>{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                </div>
                <SerialTag text={`MK-${String(i + 1).padStart(2, '0')}`} className="hidden md:block mr-2" />
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
