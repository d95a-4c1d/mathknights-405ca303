import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Upload, Camera, Sparkles, Lock, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';
import { ocrAnalyze } from '@/services/api';

const chapterEmojis: Record<string, string> = {
  ch1: '📐', ch2: '📈', ch3: '🔍', ch4: '∫', ch5: '📊',
};

export default function Study() {
  const [tab, setTab] = useState<'mainline' | 'custom'>('mainline');
  const navigate = useNavigate();
  const game = useGame();

  // Custom challenge state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ question: string; difficulty: string } | null>(null);
  const [ocrError, setOcrError] = useState('');

  const handleOcrUpload = async (file: File) => {
    setOcrFile(file);
    setOcrLoading(true);
    setOcrError('');
    setOcrResult(null);
    try {
      const result = await ocrAnalyze(file);
      setOcrResult({ question: result.question, difficulty: result.difficulty });
    } catch (err) {
      setOcrError('识别失败，请重试');
      console.error('OCR error:', err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleOcrUpload(file);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      if (input.files?.[0]) handleOcrUpload(input.files[0]);
    };
    input.click();
  };

  const handleCustomSubmit = () => {
    if (!ocrResult) return;
    navigate('/challenge', {
      state: {
        problem: {
          id: `ocr-${Date.now()}`,
          difficulty: ocrResult.difficulty as 'Easy' | 'Hard',
          question: ocrResult.question,
          rewards: [{ type: ocrResult.difficulty === 'Easy' ? 'basic_exp' as const : 'advanced_exp' as const, name: ocrResult.difficulty === 'Easy' ? '基础经验卡' : '高级经验卡', quantity: 1 }],
          firstClearBonus: ocrResult.difficulty === 'Hard' ? [{ type: 'promotion_ticket' as const, name: '晋升凭证', quantity: 1 }] : undefined,
        },
        stageName: '自定义题目',
        isCustom: true,
      },
    });
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="absolute bottom-0 right-2 text-[22vw] md:text-[16vw] font-display font-black text-white/[0.04] select-none pointer-events-none leading-none z-0">STUDY</div>

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
            {t === 'mainline' ? '主线' : '自选'}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex-1 overflow-hidden px-4 md:px-6 py-4">
        <AnimatePresence mode="wait">
          {tab === 'mainline' ? (
            <motion.div key="mainline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-4 overflow-x-auto pb-4 h-full items-stretch snap-x snap-mandatory"
            >
              {game.chapters.map((ch, i) => {
                const cleared = ch.stages.filter(s => s.cleared).length;
                const total = ch.stages.length;
                const progress = total > 0 ? Math.round((cleared / total) * 100) : 0;
                return (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => ch.available && navigate(`/chapter/${ch.id}`)}
                    className={`shrink-0 w-64 md:w-72 card-panel flex flex-col relative overflow-hidden snap-center
                      ${ch.available ? 'card-hover cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    {/* Top accent bar */}
                    <div className={`h-1.5 w-full rounded-t-xl ${ch.available ? 'bg-primary' : 'bg-muted'}`} />
                    {/* Big chapter number watermark */}
                    <div className="absolute top-8 right-4 font-display text-7xl text-muted/60 leading-none select-none pointer-events-none">
                      {String(ch.number).padStart(2, '0')}
                    </div>
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="text-3xl mb-3">{chapterEmojis[ch.id] || '📐'}</div>
                      <SerialTag text={`CH-${String(ch.number).padStart(2, '0')}`} className="mb-1" />
                      <div className="text-base font-semibold mt-1 leading-tight">{ch.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{ch.subtitle}</div>
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
                              <span className="text-[10px] text-muted-foreground">{cleared}/{total} 关卡</span>
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
                <SectionHeader title="自选题目" serial="OCR//01" className="mb-4" />
                <p className="text-sm text-muted-foreground mb-4">上传数学题目图片，AI 自动识别并生成关卡</p>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 mb-4 hover:border-primary/50 transition-colors cursor-pointer text-center card-inset"
                  onClick={handleFileSelect}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  {ocrLoading ? (
                    <Loader2 className="w-8 h-8 mx-auto text-primary mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  )}
                  <div className="text-sm text-muted-foreground">
                    {ocrLoading ? '识别中...' : ocrFile ? ocrFile.name : '点击或拖拽上传图片'}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    支持 JPG、PNG 等格式
                  </div>
                </div>

                {ocrError && (
                  <div className="text-sm text-destructive mb-4 bg-destructive/10 p-3 rounded-lg">{ocrError}</div>
                )}

                {ocrResult && (
                  <div className="card-inset p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <SerialTag text="OCR.RESULT//01" />
                    </div>
                    <div className="text-sm mb-2 font-medium">{ocrResult.question}</div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        ocrResult.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                      }`}>{ocrResult.difficulty === 'Easy' ? '简单' : '困难'}</span>
                      <span>{ocrResult.difficulty === 'Easy' ? '📘' : '📗'} 经验卡 ×1</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCustomSubmit}
                  disabled={!ocrResult}
                  className={`w-full py-3.5 text-sm tracking-wide flex items-center justify-center gap-2 ${
                    ocrResult ? 'btn-primary' : 'btn-ghost text-muted-foreground'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> 开始挑战
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
