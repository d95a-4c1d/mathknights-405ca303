export interface Stage {
  id: string;
  name: string;
  topic: string;
  problems: Problem[];
  unlocked: boolean;
  cleared: boolean;
}

export interface Problem {
  id: string;
  difficulty: 'Easy' | 'Hard';
  question: string;
  rewards: RewardItem[];
  firstClearBonus?: RewardItem[];
  completed?: boolean;
  bestScore?: number;
}

export interface RewardItem {
  type: 'basic_exp' | 'advanced_exp' | 'promotion_ticket';
  name: string;
  quantity: number;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  stages: Stage[];
  available: boolean;
}

export interface Mission {
  id: string;
  description: string;
  target: number;
  current: number;
  rewards: RewardItem[];
  claimed: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch1', number: 1, title: '函数与极限', subtitle: '微积分基础', available: true,
    stages: [
      {
        id: 's1-1', name: '区间与集合', topic: '集合论基础', unlocked: true, cleared: false,
        problems: [
          { id: 'p1-1-e', difficulty: 'Easy', question: '用区间表示法求解 |2x-3| < 5。', rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }] },
          { id: 'p1-1-h', difficulty: 'Hard', question: '已知 A=(-∞,2], B=[-1,4)，求 A∩B 和 A∪B。', rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 1 }], firstClearBonus: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }] },
        ],
      },
      {
        id: 's1-2', name: '定义域与值域', topic: '函数定义域', unlocked: false, cleared: false,
        problems: [
          { id: 'p1-2-e', difficulty: 'Easy', question: '求 y=√(4-x²)+ln(x-1) 的自然定义域。', rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }] },
          { id: 'p1-2-h', difficulty: 'Hard', question: '已知 f(x)=arcsin x, g(x)=√x，求 f(g(x)) 的定义域。', rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 1 }], firstClearBonus: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }] },
        ],
      },
      {
        id: 's1-3', name: '函数的四大性质', topic: '函数性质', unlocked: false, cleared: false,
        problems: [
          { id: 'p1-3-e', difficulty: 'Easy', question: '判断 f(x)=ln(x+√(1+x²)) 的奇偶性。', rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }] },
          { id: 'p1-3-h', difficulty: 'Hard', question: '判断 f(x)=x/(1+x²) 在其定义域上是否有界，并描述其在 (0,+∞) 上的单调性。', rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 1 }], firstClearBonus: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }] },
        ],
      },
    ],
  },
  { id: 'ch2', number: 2, title: '导数与微分', subtitle: '变化率', available: false, stages: [] },
  { id: 'ch3', number: 3, title: '导数的应用', subtitle: '优化与分析', available: false, stages: [] },
  { id: 'ch4', number: 4, title: '不定积分', subtitle: '原函数', available: false, stages: [] },
  { id: 'ch5', number: 5, title: '定积分', subtitle: '曲线下面积', available: false, stages: [] },
];

export const DAILY_MISSIONS: Mission[] = [
  { id: 'd1', description: '完成5道简单题', target: 5, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 2 }], claimed: false },
  { id: 'd2', description: '完成10道简单题', target: 10, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 5 }], claimed: false },
  { id: 'd3', description: '完成15道简单题', target: 15, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 1 }], claimed: false },
  { id: 'd4', description: '完成1道困难题', target: 1, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 3 }], claimed: false },
  { id: 'd5', description: '完成3道困难题', target: 3, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 1 }], claimed: false },
  { id: 'd6', description: '复习3道错题', target: 3, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 2 }], claimed: false },
  { id: 'd7', description: '复习5道错题', target: 5, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 4 }], claimed: false },
  { id: 'd8', description: '背诵3个公式', target: 3, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }], claimed: false },
  { id: 'd9', description: '背诵5个公式', target: 5, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 3 }], claimed: false },
];

export const WEEKLY_MISSIONS: Mission[] = [
  { id: 'w1', description: '完成50道简单题', target: 50, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 3 }], claimed: false },
  { id: 'w2', description: '完成100道简单题', target: 100, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 5 }], claimed: false },
  { id: 'w3', description: '完成150道简单题', target: 150, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 8 }], claimed: false },
  { id: 'w4', description: '完成200道简单题', target: 200, current: 0, rewards: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }], claimed: false },
  { id: 'w5', description: '完成5道困难题', target: 5, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 2 }], claimed: false },
  { id: 'w6', description: '完成10道困难题', target: 10, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 4 }], claimed: false },
  { id: 'w7', description: '完成15道困难题', target: 15, current: 0, rewards: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }], claimed: false },
  { id: 'w8', description: '复习20道错题', target: 20, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 10 }], claimed: false },
  { id: 'w9', description: '复习30道错题', target: 30, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 2 }], claimed: false },
  { id: 'w10', description: '复习50道错题', target: 50, current: 0, rewards: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }], claimed: false },
  { id: 'w11', description: '完成1张思维导图', target: 1, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 3 }], claimed: false },
  { id: 'w12', description: '背诵20个公式', target: 20, current: 0, rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 8 }], claimed: false },
  { id: 'w13', description: '背诵30个公式', target: 30, current: 0, rewards: [{ type: 'advanced_exp', name: '高级经验卡', quantity: 2 }], claimed: false },
  { id: 'w14', description: '背诵50个公式', target: 50, current: 0, rewards: [{ type: 'promotion_ticket', name: '晋升凭证', quantity: 1 }], claimed: false },
];

export function expForLevel(level: number): number {
  return Math.round(0.0426294375 * Math.pow(level, 3) - 1.77973802 * Math.pow(level, 2) + 66.4218848 * level + 74.0646917);
}

export function expToNextLevel(level: number): number {
  return expForLevel(level + 1);
}

export const COMPETENCIES = [
  { name: '抽象', fullName: '数学抽象', value: 72 },
  { name: '逻辑', fullName: '逻辑推理', value: 65 },
  { name: '建模', fullName: '数学建模', value: 48 },
  { name: '直觉', fullName: '直观想象', value: 58 },
  { name: '运算', fullName: '数学运算', value: 81 },
  { name: '数据', fullName: '数据分析', value: 55 },
];
