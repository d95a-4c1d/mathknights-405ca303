import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, BookOpen, Sparkles, Ticket, ArrowRight } from 'lucide-react';
import { SectionHeader, SerialTag } from '@/components/Decorative';

const items = [
  { key: 'basic_exp' as const, name: '基础经验卡', desc: '每张 +100 EXP', icon: '📘', rarity: '普通', Icon: BookOpen },
  { key: 'advanced_exp' as const, name: '高级经验卡', desc: '每张 +500 EXP', icon: '📗', rarity: '稀有', Icon: Sparkles },
  { key: 'promotion_ticket' as const, name: '晋升凭证', desc: '精英晋升所需', icon: '🎫', rarity: '史诗', Icon: Ticket },
];

const rarityBlock: Record<string, string> = {
  '普通': 'icon-block-muted',
  '稀有': 'icon-block-blue',
  '史诗': 'icon-block-orange',
};

export default function Inventory() {
  const navigate = useNavigate();
  const game = useGame();

  return (
    <div className="relative w-screen min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col">
      <div className="watermark text-[10vw] md:text-[8vw] top-[18%] left-[3%]">INVENTORY</div>

      <div className="sticky top-0 z-20 h-12 flex items-center px-4 md:px-6 glass-dark rounded-none" style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="icon-block-orange w-7 h-7 flex items-center justify-center mr-2">
          <Package className="w-4 h-4" />
        </div>
        <span className="font-display tracking-wider text-sm text-white/90">仓库</span>
        <span className="text-[10px] text-white/30 font-mono ml-3">
          共 {game.inventory.basic_exp + game.inventory.advanced_exp + game.inventory.promotion_ticket} 件
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <div className="max-w-xl mx-auto space-y-3">
          <SectionHeader title="物品列表" serial="INV//ALL" className="mb-2" />
          {items.map((item, i) => (
            <motion.div key={item.key}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card-panel p-4 flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${rarityBlock[item.rarity]}`}>
                <span className="text-3xl">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    item.rarity === '史诗' ? 'bg-primary/10 text-primary' :
                    item.rarity === '稀有' ? 'bg-secondary/10 text-secondary' :
                    'bg-muted text-muted-foreground'
                  }`}>{item.rarity}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-2xl text-primary">{game.inventory[item.key]}</div>
              </div>
            </motion.div>
          ))}

          <div className="card-panel-sm p-4 mt-4">
            <SectionHeader title="快捷操作" serial="ACT//02" className="mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/growth')}
                className="py-2.5 btn-primary text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5">
                使用经验卡 <ArrowRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate('/missions')}
                className="py-2.5 btn-dark text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5">
                获取更多 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
