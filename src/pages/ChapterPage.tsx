import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stage, Problem } from '@/data/mockData';
import { ArrowLeft, Lock, CheckCircle2, Swords, Gift, ChevronRight, Circle, BookOpen, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';
import { generateChallenge } from '@/services/api';

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = useGame();
  const chapter = game.chapters.find(c => c.id === id) || game.chapters[0];
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null); // `${stageId}-${difficulty}`
  const [showKnowledge, setShowKnowledge] = useState<string | null>(null); // stageId

  const handleChallenge = async (stage: Stage, p: Problem, isDynamic: boolean) => {
    if (!isDynamic) {
      // Use the fixed seed problem (teaching stages always use seed problems)
      navigate('/challenge', { state: { problem: p, stageName: stage.name } });
      return;
    }

    const key = `${stage.id}-${p.difficulty}`;
    setGeneratingFor(key);
    try {
      const generated = await generateChallenge(stage.id, p.difficulty as 'Easy' | 'Hard', stage.topic);
      navigate('/challenge', { state: { problem: generated, stageName: stage.name } });
    } catch (err) {
      console.error('Generate failed, using seed problem:', err);
      // Fallback to seed problem
      navigate('/challenge', { state: { problem: p, stageName: stage.name } });
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="absolute bottom-0 right-2 text-[22vw] md:text-[16vw] font-display font-black text-white/[0.04] select-none pointer-events-none leading-none z-0">CHAPTER</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/study')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display tracking-wider text-sm text-white/90">{chapter.title}</span>
        <span className="text-white/40 text-xs ml-2">{chapter.subtitle}</span>
        <span className="ml-auto text-[10px] font-mono text-white/40">
          {chapter.stages.filter(s => s.cleared).length}/{chapter.stages.length} 已通关
        </span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <SectionHeader title="关卡列表" serial={`STG//CH${String(chapter.number).padStart(2, '0')}`} className="mb-4" />
          <div className="flex flex-col gap-3">
            {chapter.stages.map((stage, i) => {
              const isSelected = selectedStage?.id === stage.id;
              const isTeaching = stage.isTeaching;
              return (
                <div key={stage.id}>
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
                        stage.unlocked ? (isTeaching ? 'icon-block-blue' : 'icon-block-blue') :
                        'icon-block-muted'
                      }`}>
                        {stage.cleared ? <CheckCircle2 className="w-5 h-5" /> :
                         !stage.unlocked ? <Lock className="w-4 h-4" /> :
                         isTeaching ? <BookOpen className="w-5 h-5" /> :
                         <Circle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <SerialTag text={`${chapter.number}-${i + 1}`} />
                          <span className="text-sm font-semibold">{stage.name}</span>
                          {isTeaching && <span className="text-[9px] px-2 py-0.5 bg-secondary/10 text-secondary rounded-full font-medium">教学</span>}
                          {stage.cleared && <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">已通关</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stage.topic} · {stage.problems.length} 道题</div>
                      </div>
                      {stage.unlocked && <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />}
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {isSelected && stage.unlocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-2">
                          {/* Teaching stage: knowledge content */}
                          {isTeaching && stage.knowledgeContent && (
                            <div className="card-panel-sm p-4">
                              <button
                                onClick={() => setShowKnowledge(showKnowledge === stage.id ? null : stage.id)}
                                className="flex items-center gap-2 w-full text-left mb-2"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-xs font-semibold text-secondary tracking-wide">知识点回顾</span>
                                <ChevronRight className={`w-3.5 h-3.5 text-secondary ml-auto transition-transform ${showKnowledge === stage.id ? 'rotate-90' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {showKnowledge === stage.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="card-inset p-3 rounded-lg mt-2">
                                      <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                                        {stage.knowledgeContent}
                                      </pre>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Problems */}
                          {stage.problems.map((p: Problem) => {
                            const genKey = `${stage.id}-${p.difficulty}`;
                            const isGenerating = generatingFor === genKey;
                            // Non-teaching stages use dynamic generation; teaching uses fixed seed
                            const isDynamic = !isTeaching;
                            return (
                              <div key={p.id} className="card-panel-sm p-4">
                                <div className="flex items-start gap-3">
                                  <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 mt-0.5 font-medium ${
                                    p.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                                  }`}>{p.difficulty === 'Easy' ? '简单' : '困难'}</span>
                                  <div className="flex-1 min-w-0">
                                    {isDynamic ? (
                                      <div className="text-sm leading-snug text-muted-foreground italic">
                                        AI 将为你随机出题 · {stage.topic}
                                      </div>
                                    ) : (
                                      <div className="text-sm leading-snug">{p.question}</div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                      <Gift className="w-3 h-3" />
                                      {p.rewards.map((r, j) => (
                                        <span key={j}>{r.type === 'basic_exp' ? '📘' : '📗'} {r.name} ×{r.quantity}</span>
                                      ))}
                                      {p.firstClearBonus?.map((r, j) => (
                                        <span key={`fc-${j}`} className="text-primary">🎫 {r.name} ×{r.quantity}</span>
                                      ))}
                                      {isDynamic && (
                                        <span className="flex items-center gap-1 text-primary/60">
                                          <Sparkles className="w-2.5 h-2.5" /> AI出题
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleChallenge(stage, p, isDynamic); }}
                                  disabled={isGenerating}
                                  className={`w-full mt-3 py-2.5 text-xs font-semibold tracking-wider rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-2 ${
                                    isGenerating ? 'btn-ghost text-muted-foreground' :
                                    p.difficulty === 'Easy' ? 'btn-dark' : 'btn-primary'
                                  }`}
                                >
                                  {isGenerating ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI 出题中...</>
                                  ) : isDynamic ? (
                                    <><RefreshCw className="w-3.5 h-3.5" /> 随机挑战</>
                                  ) : (
                                    <><Swords className="w-3.5 h-3.5" /> 挑战</>
                                  )}
                                </button>
                              </div>
                            );
                          })}
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
