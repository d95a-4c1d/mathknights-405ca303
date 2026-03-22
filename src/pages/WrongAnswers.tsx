import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookX, Swords, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';
import { fetchWrongAnswers } from '@/services/api';
import type { WrongAnswerItem } from '@/services/api';
import { MathRenderer } from '@/components/MathRenderer';

export default function WrongAnswers() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWrongAnswers()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = items.reduce<Record<string, WrongAnswerItem[]>>((acc, item) => {
    const key = item.chapterTitle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleRetry = (item: WrongAnswerItem) => {
    navigate('/challenge', {
      state: {
        problem: {
          id: item.problemId,
          difficulty: item.difficulty,
          question: item.question,
          rewards: item.rewards,
        },
        stageName: item.stageName,
        isRetry: true,
      },
    });
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="absolute bottom-0 right-2 text-[22vw] md:text-[16vw] font-display font-black text-white/[0.04] select-none pointer-events-none leading-none z-0">REVIEW</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <BookX className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">错题本</span>
        {!loading && (
          <span className="ml-auto text-[10px] font-mono text-white/40">{items.length} 道待复习</span>
        )}
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="icon-block-orange w-16 h-16 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="text-base font-semibold">暂无错题记录</div>
              <div className="text-sm text-muted-foreground text-center max-w-xs">
                完成题目挑战后，未通过的题目会在此显示，方便你针对性复习。
              </div>
              <button onClick={() => navigate('/study')} className="btn-primary px-6 py-2.5 text-sm mt-2">
                去做题
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([chapterTitle, chItems], gi) => (
                <div key={chapterTitle}>
                  <SectionHeader title={chapterTitle} serial={`ERR//CH${String(gi + 1).padStart(2, '0')}`} className="mb-3" />
                  <div className="space-y-2">
                    {chItems.map((item, i) => (
                      <motion.div
                        key={item.problemId}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="card-panel-sm p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 mt-0.5 font-medium ${
                            item.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                          }`}>{item.difficulty === 'Easy' ? '简单' : '困难'}</span>
                          <div className="flex-1 min-w-0">
                            <SerialTag text={item.stageName} className="mb-1" />
                            <MathRenderer content={item.question} className="text-sm leading-snug mt-1" />
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                              <span>尝试 {item.attempts} 次</span>
                              <span>最高得分 {Math.round(item.bestScore * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRetry(item)}
                          className="w-full mt-3 py-2.5 btn-dark text-xs font-semibold tracking-wider flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> 重新挑战
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
