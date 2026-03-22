import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings as SettingsIcon, Volume2, VolumeX, Sparkles, Wifi, Shield } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';

export default function Settings() {
  const navigate = useNavigate();
  const game = useGame();

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="absolute bottom-0 right-2 text-[22vw] md:text-[16vw] font-display font-black text-white/[0.04] select-none pointer-events-none leading-none z-0">SETTINGS</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <SettingsIcon className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">设置</span>
        <SerialTag text="CFG//SYS" className="ml-3 text-white/30" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="max-w-md mx-auto space-y-4"
        >
          <div className="card-panel p-1">
            {[
              { label: '音效', active: game.settings.sound, toggle: () => game.toggleSetting('sound'), IconOn: Volume2, IconOff: VolumeX },
              { label: '动画', active: game.settings.animation, toggle: () => game.toggleSetting('animation'), IconOn: Sparkles, IconOff: Sparkles },
            ].map((s, i, arr) => (
              <div key={s.label} className={`flex items-center justify-between px-4 py-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.active ? 'icon-block-orange' : 'icon-block-muted'}`}>
                    {s.active ? <s.IconOn className="w-4 h-4" /> : <s.IconOff className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <button onClick={s.toggle}
                  className={`w-12 h-7 rounded-full relative transition-colors ${s.active ? 'bg-primary' : 'bg-muted'}`}
                  style={{ boxShadow: 'inset 0 1px 3px hsl(0 0% 0% / 0.15)' }}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${s.active ? 'translate-x-6' : 'translate-x-1'}`}
                    style={{ boxShadow: '0 1px 4px hsl(0 0% 0% / 0.2)' }} />
                </button>
              </div>
            ))}
          </div>

          <div className="card-panel p-4 space-y-3">
            <SectionHeader title="API 状态" serial="API//SYS" className="mb-1" />
            {['OCR 接口', '判题接口'].map(name => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-block-blue w-8 h-8 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-secondary/10 text-secondary rounded-full font-medium">模拟</span>
              </div>
            ))}
          </div>

          <div className="card-panel-dark p-6 text-center">
            <div className="icon-block-orange w-12 h-12 mx-auto flex items-center justify-center mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <div className="font-display text-sm tracking-[0.2em] text-white/90">MATHKNIGHTS</div>
            <div className="text-[10px] text-white/40 mt-1 font-mono">v1.0.0 · PROTOTYPE BUILD</div>
            <div className="text-xs text-white/50 mt-2">游戏化高等数学学习助手</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
