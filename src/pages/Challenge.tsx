import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import type { Problem } from '@/data/mockData';
import { ArrowLeft, Send, Loader2, Swords, Gift } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';
import { submitChallenge } from '@/services/api';

export default function Challenge() {
  const location = useLocation();
  const navigate = useNavigate();
  const game = useGame();
  const { problem, stageName, isCustom, isRetry } = (location.state || {}) as { problem: Problem; stageName: string; isCustom?: boolean; isRetry?: boolean };
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!problem) { navigate('/study'); return null; }

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitChallenge(problem.id, answer, !!isRetry);
      if (result.correct) {
        const rewards = game.completeChallenge(problem);
        // Refresh backend state so chapter unlock propagates
        game.refreshChapters();
        game.refreshProfile();
        navigate('/result', { state: { problem, stageName, rewards, isCustom, feedback: result.feedback } });
      } else {
        navigate('/result', { state: { problem, stageName, rewards: [], isCustom, feedback: result.feedback, failed: true } });
      }
    } catch (err) {
      console.error('Submit failed:', err);
      navigate('/result', { state: { problem, stageName, rewards: [], isCustom, feedback: '网络错误，请检查后端服务是否运行', failed: true } });
    }
  };

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="watermark text-[10vw] md:text-[8vw] bottom-[10%] right-[3%]">CHALLENGE</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <Swords className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">挑战</span>
        <span className="text-white/40 text-xs ml-2 truncate max-w-[40vw]">{stageName}</span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card-panel-lg p-5 md:p-8 w-full max-w-2xl"
        >
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
              problem.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
            }`}>{problem.difficulty === 'Easy' ? '简单' : '困难'}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Gift className="w-3 h-3" />
              {problem.rewards.map((r, i) => (
                <span key={i}>{r.type === 'basic_exp' ? '📘' : '📗'} ×{r.quantity}</span>
              ))}
            </div>
            <SerialTag text="PROB//ACTIVE" className="ml-auto" />
          </div>

          {/* Question in card-inset for better visual hierarchy */}
          <div className="card-inset p-4 md:p-5 rounded-xl mb-6">
            <div className="text-xs font-mono text-muted-foreground mb-2">题目</div>
            <div className="text-base md:text-lg leading-relaxed font-medium">{problem.question}</div>
          </div>

          <SectionHeader title="你的答案" serial="ANS//INPUT" className="mb-3" />
          <textarea
            value={answer} onChange={e => setAnswer(e.target.value)}
            className="w-full h-32 bg-background border border-border rounded-xl p-3 text-foreground text-sm resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            placeholder="在此输入你的答案..."
            disabled={submitting}
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className={`flex-1 py-3 text-sm font-semibold tracking-wider flex items-center justify-center gap-2 ${
                submitting ? 'btn-ghost text-muted-foreground' : 'btn-primary'
              }`}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 判题中...</>
              ) : (
                <><Send className="w-4 h-4" /> 提交</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
