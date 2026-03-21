import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stage, Problem } from '@/data/mockData';
import { ArrowLeft, Lock, CheckCircle2, Swords, Gift, ChevronRight, Circle } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = useGame();
  const chapter = game.chapters.find(c => c.id === id) || game.chapters[0];
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="watermark text-[10vw] md:text-[8vw] top-[15%] right-[3%]">CHAPTER</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/study')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display tracking-wider text-sm text-white/90">第一章</span>
        <span className="text-white/40 text-xs ml-2">函数与极限</span>
        <span className="ml-auto text-[10px] font-mono text-white/40">
          {chapter.stages.filter(s => s.cleared).length}/{chapter.stages.length} 已通关
        </span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <SectionHeader title="关卡列表" serial="STG//CH01" className="mb-4" />
          <div className="flex flex-col gap-3">
            {chapter.stages.map((stage, i) => {
              const isSelected = selectedStage?.id === stage.id;
              return (
                <div key={stage.id}>
                  {/* Connector */}
                  {i > 0 && (
                    <div className="flex justify-center -mt-3 -mb-3 relative z-0">
                      <div className={`w-0.5 h-6 rounded-full ${chapter.stages[i - 1].cleared ? 'bg-primary/40' : 'bg-border'}`} />
                    </div>
                  )}
                  <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedStage(isSelected ? null : stage)}
                    disabled={!stage.unlocked}
                    className={`w-full text-left transition-all relative overflow-hidden ${
                      isSelected ? 'card-panel-lg ring-2 ring-primary/30' :
                      stage.cleared ? 'card-panel' :
                      stage.unlocked ? 'card-panel card-hover' :
                      'card-panel opacity-40'
                    } p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        stage.cleared ? 'icon-block-orange' :
                        stage.unlocked ? 'icon-block-blue' :
                        'icon-block-muted'
                      }`}>
                        {stage.cleared ? <CheckCircle2 className="w-5 h-5" /> :
                         stage.unlocked ? <Circle className="w-5 h-5" /> :
                         <Lock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <SerialTag text={`1-${i + 1}`} />
                          <span className="text-sm font-semibold">{stage.name}</span>
                          {stage.cleared && <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">已通关</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stage.topic} · {stage.problems.length} 道题</div>
                      </div>
                      {stage.unlocked && <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />}
                    </div>
                  </motion.button>

                  {/* Expanded problems */}
                  <AnimatePresence>
                    {isSelected && stage.unlocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-2">
                          {stage.problems.map((p: Problem) => (
                            <div key={p.id} className="card-panel-sm p-4">
                              <div className="flex items-start gap-3">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 mt-0.5 font-medium ${
                                  p.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                                }`}>{p.difficulty === 'Easy' ? '简单' : '困难'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm leading-snug">{p.question}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                    <Gift className="w-3 h-3" />
                                    {p.rewards.map((r, j) => (
                                      <span key={j}>{r.type === 'basic_exp' ? '📘' : '📗'} {r.name} ×{r.quantity}</span>
                                    ))}
                                    {p.firstClearBonus?.map((r, j) => (
                                      <span key={`fc-${j}`} className="text-primary">🎫 {r.name} ×{r.quantity}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate('/challenge', { state: { problem: p, stageName: stage.name } }); }}
                                className={`w-full mt-3 py-2.5 text-xs font-semibold tracking-wider rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2 ${
                                  p.difficulty === 'Easy' ? 'btn-dark' : 'btn-primary'
                                }`}
                              >
                                <Swords className="w-3.5 h-3.5" /> 挑战
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
