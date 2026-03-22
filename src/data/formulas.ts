export interface Formula {
  id: string;
  category: string;
  name: string;
  content: string;
  tip: string;
}

export const FORMULAS: Formula[] = [
  // 极限
  { id: 'f1', category: '极限', name: '重要极限一', content: 'lim(x→0) sin(x)/x = 1', tip: 'x→0时 sin x ~ x，是三角函数极限的基础' },
  { id: 'f2', category: '极限', name: '重要极限二', content: 'lim(x→∞) (1 + 1/x)ˣ = e', tip: 'e ≈ 2.71828，复利公式的极限形式' },
  { id: 'f3', category: '极限', name: '等价无穷小（x→0）', content: 'sin x ~ x, tan x ~ x, arcsin x ~ x\n1−cos x ~ x²/2, ln(1+x) ~ x, eˣ−1 ~ x', tip: '可用于替换化简极限，注意只能在乘除时替换' },
  // 导数
  { id: 'f4', category: '导数', name: '导数定义', content: "f'(x₀) = lim(h→0) [f(x₀+h)−f(x₀)] / h", tip: '导数 = 瞬时变化率 = 切线斜率' },
  { id: 'f5', category: '导数', name: '基本导数公式', content: "(xⁿ)' = nxⁿ⁻¹\n(eˣ)' = eˣ\n(ln x)' = 1/x\n(sin x)' = cos x\n(cos x)' = −sin x\n(arctan x)' = 1/(1+x²)", tip: '必须熟记的基础公式' },
  { id: 'f6', category: '导数', name: '链式法则', content: "[f(g(x))]' = f'(g(x)) · g'(x)", tip: '复合函数求导：外层导数 × 内层导数' },
  { id: 'f7', category: '导数', name: '乘积与商的导数', content: "(uv)' = u'v + uv'\n(u/v)' = (u'v − uv') / v²", tip: '乘积法则和商的法则' },
  // 导数应用
  { id: 'f8', category: '导数应用', name: '洛必达法则', content: 'lim f(x)/g(x) = lim f\'(x)/g\'(x)\n（适用于 0/0 型或 ∞/∞ 型）', tip: '其他不定式需先转化：0·∞→0/(1/∞)，∞−∞→通分，1^∞/0⁰/∞⁰→取对数' },
  { id: 'f9', category: '导数应用', name: '极值判定', content: "f'(x₀) = 0 时：\nf''(x₀) < 0 → 极大值\nf''(x₀) > 0 → 极小值", tip: '第二充分条件；第一充分条件看 f\'(x) 的变号方向' },
  { id: 'f10', category: '导数应用', name: '泰勒公式（麦克劳林）', content: "eˣ = 1 + x + x²/2! + x³/3! + …\nsin x = x − x³/3! + x⁵/5! − …\nln(1+x) = x − x²/2 + x³/3 − …", tip: '用于求高阶极限和近似计算' },
  // 积分
  { id: 'f11', category: '积分', name: '基本积分公式', content: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C（n≠−1）\n∫(1/x) dx = ln|x| + C\n∫eˣ dx = eˣ + C\n∫sin x dx = −cos x + C\n∫cos x dx = sin x + C\n∫1/(1+x²) dx = arctan x + C\n∫1/√(1−x²) dx = arcsin x + C", tip: '不定积分的七大基础公式' },
  { id: 'f12', category: '积分', name: '分部积分法', content: '∫u dv = uv − ∫v du\nILATE优先级：反三角 > 对数 > 代数 > 三角 > 指数', tip: '靠前的作 u，靠后的作 dv；经典例：∫x eˣ dx = eˣ(x−1)+C' },
  { id: 'f13', category: '积分', name: '换元积分法', content: '第一类（凑微分）：∫f(g(x))g\'(x)dx = F(g(x))+C\n第二类（三角代换）：√(a²−x²)令x=a sin t', tip: '凑微分关键是识别内层函数的导数' },
  // 定积分
  { id: 'f14', category: '定积分', name: '牛顿-莱布尼茨公式', content: '∫ₐᵇ f(x)dx = F(b) − F(a)\n（F\'(x) = f(x)）', tip: '微积分基本定理，将定积分转化为原函数做差' },
  { id: 'f15', category: '定积分', name: '积分上限函数求导', content: 'd/dx ∫ₐˣ f(t)dt = f(x)\nd/dx ∫ₐᵍ⁽ˣ⁾ f(t)dt = f(g(x))·g\'(x)', tip: '微积分基本定理一：积分上限的导数等于被积函数在上限处的值' },
  { id: 'f16', category: '定积分', name: '旋转体体积', content: '绕 x 轴（圆盘法）：V = π∫ₐᵇ [f(x)]² dx\n绕 y 轴（柱壳法）：V = 2π∫ₐᵇ x·|f(x)| dx', tip: '圆盘法截面是圆，柱壳法截面是圆柱侧面' },
  // 微分方程
  { id: 'f17', category: '微分方程', name: '一阶线性方程通解', content: "y' + P(x)y = Q(x)\n通解：y = e^(−∫P dx) [∫Q·e^(∫P dx) dx + C]", tip: '积分因子 μ = e^(∫P dx)，使方程化为 (μy)\' = μQ' },
  { id: 'f18', category: '微分方程', name: '二阶常系数齐次方程', content: "特征方程 r²+pr+q=0\n两实根r₁≠r₂：y=C₁eʳ¹ˣ+C₂eʳ²ˣ\n重根r：y=(C₁+C₂x)eʳˣ\n复根α±βi：y=eᵅˣ(C₁cosβx+C₂sinβx)", tip: '解特征方程是关键第一步' },
];
