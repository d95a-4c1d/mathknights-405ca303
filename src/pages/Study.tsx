import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Upload, Camera, Sparkles, Lock, ChevronRight, MapPin } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';

const chapterCovers = [
  { id: 'ch1', num: 1, title: '函数与极限', sub: '微积分基础', emoji: '📐', available: true },
  { id: 'ch2', num: 2, title: '导数与微分', sub: '变化率', emoji: '📈', available: false },
  { id: 'ch3', num: 3, title: '导数的应用', sub: '优化与分析', emoji: '🔍', available: false },
  { id: 'ch4', num: 4, title: '不定积分', sub: '原函数', emoji: '∫', available: false },
  { id: 'ch5', num: 5, title: '定积分', sub: '曲线下面积', emoji: '📊', available: false },
];

export default function Study() {
  const [tab, setTab] = useState<'mainline' | 'custom'>('mainline');
  const navigate = useNavigate();
  const game = useGame();

  const ch1 = game.chapters.find(c => c.id === 'ch1');
  const ch1Cleared = ch1 ? ch1.stages.filter(s => s.cleared).length : 0;
  const ch1Total = ch1 ? ch1.stages.length : 3;

  const handleCustomSubmit = () => {
    navigate('/challenge', {
      state: {
        problem: { id: 'custom-1', difficulty: 'Easy' as const, question: '判断 f(x)=ln(x+√(1+x²)) 的奇偶性。', rewards: [{ type: 'basic_exp' as const, name: '基础经验卡', quantity: 1 }] },
        stageName: '自定义题目', isCustom: true,
      },
    });
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="watermark text-[12vw] md:text-[10vw] top-[15%] left-[3%]">STUDY</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <BookOpen className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">学习终端</span>
        <SerialTag text="TERM//03" className="ml-3 text-white/30" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 md:px-6 pt-4 pb-1">
        {(['mainline', 'custom'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-medium tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              tab === t ? 'btn-primary' : 'btn-ghost text-muted-foreground'
            }`}
          >
            {t === 'mainline' ? <MapPin className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            {t === 'mainline' ? '主线' : '自定义'}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex-1 overflow-hidden px-4 md:px-6 py-4">
        <AnimatePresence mode="wait">
          {tab === 'mainline' ? (
            <motion.div key="mainline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-4 overflow-x-auto pb-4 h-full items-stretch snap-x snap-mandatory"
            >
              {chapterCovers.map((ch, i) => {
                const progress = ch.id === 'ch1' ? Math.round((ch1Cleared / ch1Total) * 100) : 0;
                return (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => ch.available && navigate('/chapter/ch1')}
                    className={`shrink-0 w-64 md:w-72 card-panel flex flex-col relative overflow-hidden snap-center
                      ${ch.available ? 'card-hover cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    {/* Top accent bar */}
                    <div className={`h-1.5 w-full rounded-t-xl ${ch.available ? 'bg-primary' : 'bg-muted'}`} />
                    {/* Big chapter number watermark */}
                    <div className="absolute top-8 right-4 font-display text-7xl text-muted/60 leading-none select-none pointer-events-none">
                      {String(ch.num).padStart(2, '0')}
                    </div>
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="text-3xl mb-3">{ch.emoji}</div>
                      <SerialTag text={`CH-${String(ch.num).padStart(2, '0')}`} className="mb-1" />
                      <div className="text-base font-semibold mt-1 leading-tight">{ch.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{ch.sub}</div>
                      <div className="mt-auto pt-5">
                        {ch.available ? (
                          <>
                            <div className="flex items-center justify-between text-[10px] mb-1.5">
                              <span className="text-muted-foreground">进度</span>
                              <span className="font-mono text-primary font-medium">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-muted-foreground">{ch1Cleared}/{ch1Total} 关卡</span>
                              <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                                进入 <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">未解锁</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-4 px-2"
            >
              <div className="card-panel-lg p-6 w-full max-w-lg">
                <SectionHeader title="自定义题目" serial="OCR//01" className="mb-4" />
                <p className="text-sm text-muted-foreground mb-4">上传数学题目图片进行 OCR 分析</p>

                <div className="border-2 border-dashed border-border rounded-xl p-8 mb-4 hover:border-primary/50 transition-colors cursor-pointer text-center card-inset">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground">点击或拖拽上传</div>
                  <div className="text-[10px] text-muted-foreground mt-1">（模拟：将返回示例题目）</div>
                </div>

                <div className="card-inset p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <SerialTag text="OCR.RESULT//SIM" />
                  </div>
                  <div className="text-sm mb-2 font-medium">f(x) = ln(x + √(1+x²))</div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full font-medium">简单</span>
                    <span>📘 基础经验卡 ×1</span>
                  </div>
                </div>

                <button onClick={handleCustomSubmit} className="w-full py-3.5 btn-primary text-sm tracking-wide flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> 分析并挑战
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
