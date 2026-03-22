"""
Chapter & Stage endpoints — backed by SQLite + seed data.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.orm_models import (
    Chapter as DBChapter, Stage as DBStage, Problem as DBProblem,
    UserProgress, User as DBUser,
)
from app.models.schemas import Chapter, Stage
from app.routers.user import ensure_user

router = APIRouter()

# ─── Knowledge content (static, no DB needed) ─────────────────────────

KNOWLEDGE_CONTENT = {
    "s1-1": """**集合与区间**

集合是由不同元素组成的整体。常见的数集：ℕ（自然数）、ℤ（整数）、ℚ（有理数）、ℝ（实数）。

**区间表示法**：
- 开区间 (a,b)：a < x < b
- 闭区间 [a,b]：a ≤ x ≤ b
- 半开区间 (a,b] 或 [a,b)

**绝对值不等式**：|x - a| < r ⟺ a - r < x < a + r（即以 a 为中心，半径 r 的开区间）

**集合运算**：A∩B（交集）、A∪B（并集）、A\\B（差集）、A^c（补集）""",

    "s1-2": """**函数的定义域与值域**

函数 y = f(x) 需要确定 **自然定义域**（使表达式有意义的所有 x 值的集合）。

**常见限制条件**：
- 分母不为零：分母 ≠ 0
- 偶次根号：被开方数 ≥ 0
- 对数：真数 > 0
- arcsin/arccos：参数 ∈ [-1, 1]

**复合函数定义域**：f(g(x)) 的定义域需满足 x ∈ dom(g) 且 g(x) ∈ dom(f)。

例：y = √(4-x²) + ln(x-1)，需 4-x²≥0 且 x-1>0，即 x∈[-2,2] 且 x>1，所以定义域 (1, 2]。""",

    "s1-3": """**函数的四大基本性质**

**1. 单调性**：f'(x) > 0 → 单调递增；f'(x) < 0 → 单调递减（后续章节会详细讲）

**2. 奇偶性**：
- 偶函数：f(-x) = f(x)，图形关于 y 轴对称
- 奇函数：f(-x) = -f(x)，图形关于原点对称
- 判断步骤：先确认定义域关于原点对称，再计算 f(-x)

**3. 周期性**：f(x + T) = f(x)（T > 0），则 T 为周期

**4. 有界性**：∃M > 0，使 |f(x)| ≤ M 对所有 x 成立，则 f 有界

**常用结论**：ln(x + √(1+x²)) 是奇函数；x/(1+x²) 有界（最大值 1/2）。""",

    "s1-4": """**极限的运算法则**

**基本性质**：若 lim f(x) = A，lim g(x) = B，则：
- 加减：lim [f(x) ± g(x)] = A ± B
- 乘法：lim [f(x)·g(x)] = A·B
- 除法：lim [f(x)/g(x)] = A/B（B ≠ 0）

**两个重要极限**：
1. lim(x→0) sin(x)/x = **1**
2. lim(x→∞) (1 + 1/x)^x = **e** ≈ 2.718...

**等价无穷小**（x→0 时）：
- sin x ~ x，tan x ~ x，arcsin x ~ x
- 1 - cos x ~ x²/2，ln(1+x) ~ x，e^x - 1 ~ x

**夹逼准则**：若 g(x) ≤ f(x) ≤ h(x) 且 lim g(x) = lim h(x) = L，则 lim f(x) = L。""",

    "s1-5": """**函数的连续性**

**定义**：若 lim(x→x₀) f(x) = f(x₀)，则 f 在 x₀ 处连续。

**连续条件**（三合一）：
1. f(x₀) 有定义
2. lim(x→x₀) f(x) 存在
3. 极限值等于函数值

**间断点分类**：
- **可去间断点**：极限存在但 ≠ f(x₀)（或无定义），可"补点"
- **跳跃间断点**：左右极限存在但不相等
- **无穷间断点**：极限为 ∞（如 1/x 在 x=0）
- **振荡间断点**：极限不存在（如 sin(1/x) 在 x=0）

**闭区间连续函数的性质**：最大值定理、介值定理、零点定理（f(a)·f(b) < 0 → 存在零点）。""",

    "s2-1": """**导数的定义**

导数描述函数在某点处的**瞬时变化率**，也是曲线在该点的切线斜率。

**定义**：f'(x₀) = lim(h→0) [f(x₀+h) - f(x₀)] / h

**等价形式**：f'(x₀) = lim(x→x₀) [f(x) - f(x₀)] / (x - x₀)

**可导 vs 连续**：可导 → 连续；连续 ≠ 可导（如 |x| 在 x=0 连续但不可导）

**左导数、右导数**：f'₋(x₀) 和 f'₊(x₀)。可导 ⟺ 左右导数相等。

**基本导数公式**：(x^n)' = nx^(n-1)，(e^x)' = e^x，(ln x)' = 1/x，(sin x)' = cos x，(cos x)' = -sin x。""",

    "s2-2": """**求导法则**

**四则运算**：
- (u ± v)' = u' ± v'
- (uv)' = u'v + uv'
- (u/v)' = (u'v - uv') / v²

**链式法则**（复合函数）：[f(g(x))]' = f'(g(x)) · g'(x)

**反函数求导**：(f⁻¹)'(y) = 1 / f'(x)

**对数求导法**（适用于幂指函数 u^v）：令 y = u^v，两边取 ln：ln y = v·ln u，再对 x 求导。

**示例**：y = sin(x²) → y' = cos(x²) · 2x = 2x cos(x²)""",

    "s2-3": """**高阶导数与隐函数求导**

**高阶导数**：f''(x) = (f'(x))'，f^(n)(x) 为 n 阶导数。
- (sin x)^(n) = sin(x + nπ/2)
- (e^x)^(n) = e^x
- (x^n)^(n) = n!

**隐函数求导**：方程 F(x,y) = 0 确定 y = y(x)，两端对 x 求导（y 视为 x 的函数），解出 dy/dx。

例：x² + y² = R² → 2x + 2y·y' = 0 → y' = -x/y

**参数方程求导**：x = φ(t)，y = ψ(t) → dy/dx = ψ'(t)/φ'(t)

**二阶参数导数**：d²y/dx² = (dy/dx)' / φ'(t)""",

    "s2-4": """**微分**

**定义**：若 Δy = f'(x)·Δx + o(Δx)，则 dy = f'(x)dx 称为 y 的微分。

**几何意义**：dy 是切线上纵坐标的增量，Δy 是曲线上的实际增量。微分是 Δy 的线性主部。

**微分运算法则**：与导数法则对应（一阶微分形式不变性）：
- d(uv) = v du + u dv
- d(u/v) = (v du - u dv) / v²
- d(f(g(x))) = f'(g(x)) · g'(x) dx

**近似计算**：当 |Δx| 很小时，f(x+Δx) ≈ f(x) + f'(x)·Δx

例：√(1.01) ≈ √1 + (1/2√1)·0.01 = 1 + 0.005 = 1.005""",

    "s3-1": """**极值与最值**

**极值判定（第一充分条件）**：若 f'(x) 在 x₀ 两侧变号：
- 由正变负 → x₀ 为极大值点
- 由负变正 → x₀ 为极小值点

**极值判定（第二充分条件）**：若 f'(x₀) = 0：
- f''(x₀) < 0 → 极大值
- f''(x₀) > 0 → 极小值
- f''(x₀) = 0 → 需进一步判断

**闭区间最值**：比较所有极值点处函数值和端点值，最大者为最大值。

**驻点**：f'(x₀) = 0 的点（不一定是极值点，如 x³ 在 x=0）。""",

    "s3-2": """**洛必达法则**

用于求 0/0 型或 ∞/∞ 型不定式的极限：

**法则**：若 lim f(x) = lim g(x) = 0（或 ∞），则在一定条件下：
lim f(x)/g(x) = lim f'(x)/g'(x)

**其他不定式的转化**：
- 0·∞ → 改写为 0/(1/∞) 或 ∞/(1/0)
- ∞ - ∞ → 通分或有理化
- 1^∞、0^0、∞^0 → 取对数转化为 0·∞ 型

**注意**：洛必达后仍为不定式，可继续使用；若导数之比极限不存在，不能反推原极限不存在（此时换方法）。

例：lim(x→0) sin(x)/x = lim(x→0) cos(x)/1 = 1""",

    "s3-3": """**单调性、凹凸性与函数图形分析**

**单调性**：
- f'(x) > 0 → 单调递增；f'(x) < 0 → 单调递减

**凹凸性**：
- f''(x) > 0 → 曲线是凹弧（开口朝上）
- f''(x) < 0 → 曲线是凸弧（开口朝下）
- **拐点**：f''(x) 变号的点，即凹凸性改变处

**渐近线**：
- 水平渐近线：lim(x→±∞) f(x) = c
- 垂直渐近线：lim(x→a) f(x) = ±∞
- 斜渐近线：y = kx + b，其中 k = lim f(x)/x，b = lim [f(x)-kx]

**作图步骤**：定义域 → 奇偶/周期 → 单调区间 → 极值 → 凹凸/拐点 → 渐近线 → 描点绘图。""",

    "s4-1": """**不定积分的基本概念与公式**

**原函数**：若 F'(x) = f(x)，则 F(x) 是 f(x) 的原函数。

**不定积分**：∫f(x)dx = F(x) + C（C 为任意常数）

**基本积分公式**（必须熟记）：
- ∫x^n dx = x^(n+1)/(n+1) + C（n ≠ -1）
- ∫1/x dx = ln|x| + C
- ∫e^x dx = e^x + C
- ∫sin x dx = -cos x + C
- ∫cos x dx = sin x + C
- ∫1/(1+x²) dx = arctan x + C
- ∫1/√(1-x²) dx = arcsin x + C
- ∫sec²x dx = tan x + C

**线性性质**：∫[af(x) + bg(x)]dx = a∫f(x)dx + b∫g(x)dx""",

    "s4-2": """**换元积分法**

**第一类换元法（凑微分法）**：
∫f(g(x))g'(x)dx = F(g(x)) + C

关键：把 g'(x)dx 凑成 dg(x)，然后对 g(x) 积分。

常用形式：∫f(ax+b)dx = (1/a)F(ax+b) + C

**第二类换元法（三角代换等）**：
- √(a²-x²)：令 x = a sin t
- √(a²+x²)：令 x = a tan t
- √(x²-a²)：令 x = a sec t
- 根式 √(ax+b)：令 t = √(ax+b)

**倒代换**：令 t = 1/x，适用于分母次数较高的情形。

例：∫sin³x dx = ∫sin²x · sin x dx = ∫(1-cos²x)(-d cos x) = -cos x + cos³x/3 + C""",

    "s4-3": """**分部积分法**

公式：∫u dv = uv - ∫v du

**选取 u 和 dv 的原则（ILATE 顺序）**：
I（反三角）> L（对数）> A（代数/多项式）> T（三角）> E（指数）

越靠前的作为 u，越靠后的作为 dv。

**经典题型**：
- ∫x·e^x dx：u=x，dv=e^x dx → x·e^x - ∫e^x dx = e^x(x-1) + C
- ∫x·sin x dx：u=x，dv=sin x dx → -x cos x + sin x + C
- ∫ln x dx：u=ln x，dv=dx → x ln x - x + C
- ∫e^x sin x dx：连续两次分部积分，然后解方程

**递推**：某些积分（如 ∫sin^n x dx）需建立递推公式。""",

    "s5-1": """**定积分与牛顿-莱布尼茨公式**

**定积分定义**：将 [a,b] 分割，取各小区间上函数值乘以区间长度之和的极限：
∫ₐᵇ f(x)dx = lim Σf(ξᵢ)Δxᵢ

**积分上限函数**：Φ(x) = ∫ₐˣ f(t)dt，则 Φ'(x) = f(x)（微积分基本定理一）

**牛顿-莱布尼茨公式**（微积分基本定理二）：
∫ₐᵇ f(x)dx = F(b) - F(a)，其中 F'(x) = f(x)

**定积分性质**：
- 线性：∫ₐᵇ [αf + βg]dx = α∫f + β∫g
- 区间可加：∫ₐᵇ = ∫ₐᶜ + ∫ᶜᵇ
- 比较：f ≥ g → ∫f ≥ ∫g

**换元与分部**与不定积分类似，但换元时注意换积分限。""",

    "s5-2": """**定积分的应用**

**平面图形面积**：
- 直角坐标：A = ∫ₐᵇ |f(x) - g(x)| dx（上曲线减下曲线）
- 参数方程：A = ∫α^β y · dx = ∫α^β ψ(t)·φ'(t)dt
- 极坐标：A = (1/2)∫α^β r(θ)² dθ

**旋转体体积**：
- 绕 x 轴旋转（圆盘法）：V = π∫ₐᵇ [f(x)]² dx
- 绕 y 轴旋转（柱壳法）：V = 2π∫ₐᵇ x·f(x) dx

**弧长**：L = ∫ₐᵇ √(1 + [f'(x)]²) dx

**物理应用**：变力做功 W = ∫ₐᵇ F(x)dx；水压力 P = ρg∫ₐᵇ y·l(y)dy。""",

    "s5-3": """**反常积分（广义积分）**

**无穷限积分**（积分上/下限为无穷）：
∫₁^∞ f(x)dx = lim(b→∞) ∫₁ᵇ f(x)dx

若极限存在则**收敛**，否则**发散**。

**无界函数的积分（瑕积分）**：被积函数在某点无界（瑕点），绕开瑕点取极限。

**重要结论**：
- ∫₁^∞ 1/x^p dx：p > 1 收敛，p ≤ 1 发散
- ∫₀¹ 1/x^p dx：p < 1 收敛，p ≥ 1 发散

**比较审敛法**：0 ≤ f(x) ≤ g(x)：g 收敛 → f 收敛；f 发散 → g 发散。

**Γ函数**：Γ(n) = ∫₀^∞ x^(n-1)e^(-x)dx，Γ(n+1) = n·Γ(n)，Γ(n) = (n-1)!（n 为正整数）。""",

    "s6-1": """**微分方程基本概念**

**微分方程**：含有未知函数及其导数的方程，如 y' = 2x，y'' + y = 0。

**阶**：方程中出现的最高阶导数的阶数。

**通解**：含有任意常数（个数等于方程阶数）的解。

**特解**：满足初始条件的解，不含任意常数。

**初始条件**：如 y(x₀) = y₀，y'(x₀) = y₁（确定任意常数）。

**直接积分法**：若 y^(n) = f(x)，可连续积分 n 次得到通解。

例：y'' = sin x → y' = -cos x + C₁ → y = -sin x + C₁x + C₂""",

    "s6-2": """**可分离变量的微分方程与一阶线性方程**

**可分离变量方程**：dy/dx = f(x)·g(y)

解法：分离变量 → 两端积分：∫dy/g(y) = ∫f(x)dx + C

**齐次方程**：dy/dx = φ(y/x)，令 u = y/x，y = ux，dy/dx = u + x·du/dx，化为可分离变量。

**一阶线性方程**：y' + P(x)y = Q(x)

**通解公式**：y = e^(-∫P(x)dx) [∫Q(x)e^(∫P(x)dx)dx + C]

**记忆方法**：先求积分因子 μ = e^(∫P(x)dx)，方程变为 (μy)' = μQ(x)，两边积分。

例：y' + y = e^x → 积分因子 e^x → (e^x y)' = e^(2x) → y = (1/2)e^x + Ce^(-x)""",

    "s6-3": """**二阶常系数线性微分方程**

**齐次方程**：y'' + py' + qy = 0（p, q 为常数）

**特征方程**：r² + pr + q = 0，求特征根 r₁, r₂

| 特征根情况 | 通解形式 |
|---|---|
| 两个不等实根 r₁ ≠ r₂ | y = C₁e^(r₁x) + C₂e^(r₂x) |
| 两个相等实根 r₁ = r₂ = r | y = (C₁ + C₂x)e^(rx) |
| 共轭复根 α ± βi | y = e^(αx)(C₁cosβx + C₂sinβx) |

**非齐次方程**：y'' + py' + qy = f(x)

通解 = 齐次通解 + 非齐次特解

**特解形式（待定系数法）**：
- f(x) = Pₘ(x)e^(λx)：特解设为 x^k·Qₘ(x)e^(λx)（k 为 λ 重特征根的重数）
- f(x) = e^(λx)[A cosωx + B sinωx]：类似处理""",
}

# ─── Seed data ────────────────────────────────────────────────────────

SEED_CHAPTERS = [
    {
        "id": "ch1", "number": 1, "title": "函数与极限", "subtitle": "微积分基础",
        "stages": [
            {"id": "s1-1", "name": "集合与区间", "topic": "集合论基础", "order": 0,
             "problems": [
                 {"id": "p1-1-e", "difficulty": "Easy",
                  "question": "用区间表示法求解不等式 |2x-3| < 5。",
                  "reference_answer": "由 |2x-3| < 5 得 -5 < 2x-3 < 5，即 -2 < 2x < 8，所以 -1 < x < 4。区间表示为 (-1, 4)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-1-h", "difficulty": "Hard",
                  "question": "已知 A=(-∞,2], B=[-1,4)，求 A∩B、A∪B，并用集合运算性质验证 (A∩B)^c = A^c ∪ B^c。",
                  "reference_answer": "A∩B = [-1, 2]，A∪B = (-∞, 4)。A^c = (2,+∞)，B^c = (-∞,-1)∪[4,+∞)，A^c∪B^c = (-∞,-1)∪(2,+∞) = [-1,2]^c = (A∩B)^c。验证正确。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-2", "name": "定义域与值域", "topic": "函数定义域", "order": 1,
             "problems": [
                 {"id": "p1-2-e", "difficulty": "Easy",
                  "question": "求 y = √(4-x²) + ln(x-1) 的自然定义域。",
                  "reference_answer": "需要 4-x²≥0 且 x-1>0，即 -2≤x≤2 且 x>1，所以定义域为 (1, 2]。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-2-h", "difficulty": "Hard",
                  "question": "已知 f(x) = arcsin x，g(x) = √x，求复合函数 f(g(x)) 的定义域，并求其反函数。",
                  "reference_answer": "g(x)=√x 定义域 x≥0，arcsin 定义域 [-1,1]，需 0≤√x≤1，即 0≤x≤1。反函数：令 y=arcsin(√x)，则 sin y = √x，x = sin²y，y∈[0,π/2]，反函数为 y = sin²x，x∈[0,π/2]。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-3", "name": "函数的四大性质", "topic": "函数性质", "order": 2,
             "problems": [
                 {"id": "p1-3-e", "difficulty": "Easy",
                  "question": "判断 f(x) = ln(x + √(1+x²)) 的奇偶性。",
                  "reference_answer": "定义域为 ℝ（关于原点对称）。f(-x) = ln(-x+√(1+x²))。注意 (-x+√(1+x²))(x+√(1+x²)) = 1+x²-x² = 1，所以 f(-x) = ln(1/(x+√(1+x²))) = -ln(x+√(1+x²)) = -f(x)。故为奇函数。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-3-h", "difficulty": "Hard",
                  "question": "判断 f(x) = x/(1+x²) 在其定义域上的有界性，并确定其单调区间。",
                  "reference_answer": "有界性：|x/(1+x²)| ≤ 1/2（由均值不等式 1+x²≥2|x|），有界。单调性：f'(x) = (1-x²)/(1+x²)²。f'(x)>0 → x∈(-1,1) 单调递增；f'(x)<0 → x∈(-∞,-1)∪(1,+∞) 单调递减。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-4", "name": "极限运算", "topic": "极限四则与重要极限", "order": 3,
             "problems": [
                 {"id": "p1-4-e", "difficulty": "Easy",
                  "question": "利用等价无穷小求极限：lim(x→0) (sin 3x) / (2x)。",
                  "reference_answer": "当 x→0 时，sin 3x ~ 3x，所以 lim (sin 3x)/(2x) = lim 3x/(2x) = 3/2。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-4-h", "difficulty": "Hard",
                  "question": "求极限：lim(x→0) (e^(2x) - 1 - 2x) / x²。",
                  "reference_answer": "e^u - 1 ~ u（u→0），但分子是二阶量。用泰勒展开：e^(2x) = 1 + 2x + (2x)²/2 + o(x²) = 1 + 2x + 2x² + o(x²)，所以分子 ~ 2x²，极限 = 2x²/x² = 2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-5", "name": "连续性与间断点", "topic": "函数连续性", "order": 4,
             "problems": [
                 {"id": "p1-5-e", "difficulty": "Easy",
                  "question": "设 f(x) = (x²-1)/(x-1)（x≠1），f(1) = 3，判断 f(x) 在 x=1 处是否连续，并说明理由。",
                  "reference_answer": "lim(x→1) (x²-1)/(x-1) = lim(x→1)(x+1) = 2，但 f(1) = 3 ≠ 2，极限存在但不等于函数值，所以 f 在 x=1 处不连续（可去间断点）。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-5-h", "difficulty": "Hard",
                  "question": "证明方程 x·e^x = 2 在 (0, 1) 内至少有一个实根。",
                  "reference_answer": "令 f(x) = x·e^x - 2，f(x) 在 [0,1] 上连续。f(0) = 0·1 - 2 = -2 < 0，f(1) = e - 2 ≈ 0.718 > 0。由零点定理，存在 ξ∈(0,1) 使 f(ξ) = 0，即 ξ·e^ξ = 2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch2", "number": 2, "title": "导数与微分", "subtitle": "变化率",
        "stages": [
            {"id": "s2-1", "name": "导数的定义", "topic": "导数概念", "order": 0,
             "problems": [
                 {"id": "p2-1-e", "difficulty": "Easy",
                  "question": "用导数定义求 f(x) = x² 在 x=1 处的导数。",
                  "reference_answer": "f'(1) = lim(h→0) [(1+h)²-1²]/h = lim(h→0) (2h+h²)/h = lim(h→0)(2+h) = 2。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-1-h", "difficulty": "Hard",
                  "question": "讨论 f(x) = |x| 在 x=0 处的可导性，并说明可导与连续的关系。",
                  "reference_answer": "右导数 f'₊(0) = lim(h→0⁺) |h|/h = 1，左导数 f'₋(0) = lim(h→0⁻) |h|/h = -1。左右导数不等，故 f 在 x=0 不可导。但 f(x)=|x| 在 x=0 处连续（lim|x|=0=f(0)）。结论：连续不一定可导，可导一定连续。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s2-2", "name": "求导法则", "topic": "四则运算与链式法则", "order": 1,
             "problems": [
                 {"id": "p2-2-e", "difficulty": "Easy",
                  "question": "求 y = sin(x²) 的导数。",
                  "reference_answer": "链式法则：y' = cos(x²) · (x²)' = 2x cos(x²)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-2-h", "difficulty": "Hard",
                  "question": "求 y = x^x（x > 0）的导数。",
                  "reference_answer": "对数求导法：ln y = x ln x，两边对 x 求导：y'/y = ln x + 1，故 y' = x^x(ln x + 1)。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s2-3", "name": "高阶导数与隐函数", "topic": "高阶导数与隐函数求导", "order": 2,
             "problems": [
                 {"id": "p2-3-e", "difficulty": "Easy",
                  "question": "求由方程 x² + y² = 4 确定的隐函数 y = y(x) 的导数 dy/dx。",
                  "reference_answer": "对等式两端关于 x 求导：2x + 2y·y' = 0，解得 y' = -x/y（y ≠ 0）。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-3-h", "difficulty": "Hard",
                  "question": "已知 x = sin t，y = cos 2t（参数方程），求 d²y/dx²。",
                  "reference_answer": "dy/dx = y'_t / x'_t = (-2 sin 2t) / cos t = -4 sin t。d²y/dx² = (dy/dx)'_t / x'_t = (-4 cos t) / cos t = -4。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s2-4", "name": "微分", "topic": "微分的概念与应用", "order": 3,
             "problems": [
                 {"id": "p2-4-e", "difficulty": "Easy",
                  "question": "求 y = e^(2x) · sin x 的微分 dy。",
                  "reference_answer": "y' = 2e^(2x) sin x + e^(2x) cos x = e^(2x)(2 sin x + cos x)，所以 dy = e^(2x)(2 sin x + cos x) dx。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-4-h", "difficulty": "Hard",
                  "question": "利用微分近似计算 sin 31°（精确到 0.001）。",
                  "reference_answer": "令 x₀ = 30° = π/6，Δx = 1° = π/180。f(x) = sin x，f'(x) = cos x。sin 31° ≈ sin 30° + cos 30° · π/180 = 0.5 + (√3/2)·(π/180) ≈ 0.5 + 0.8660 × 0.01745 ≈ 0.5 + 0.01512 ≈ 0.515。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch3", "number": 3, "title": "导数的应用", "subtitle": "优化与分析",
        "stages": [
            {"id": "s3-1", "name": "极值与最值", "topic": "极值判定", "order": 0,
             "problems": [
                 {"id": "p3-1-e", "difficulty": "Easy",
                  "question": "求 f(x) = x³ - 3x 的极值。",
                  "reference_answer": "f'(x) = 3x²-3 = 3(x-1)(x+1)，驻点 x=±1。f''(x) = 6x：f''(1)=6>0 → x=1 极小值 f(1)=-2；f''(-1)=-6<0 → x=-1 极大值 f(-1)=2。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p3-1-h", "difficulty": "Hard",
                  "question": "证明方程 x⁵ + x - 1 = 0 有且仅有一个实根。",
                  "reference_answer": "f(x) = x⁵ + x - 1：f(0)=-1<0，f(1)=1>0，由零点定理至少一实根。f'(x)=5x⁴+1>0 恒成立，f 严格单调递增，故恰有一个实根。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s3-2", "name": "洛必达法则", "topic": "不定式极限", "order": 1,
             "problems": [
                 {"id": "p3-2-e", "difficulty": "Easy",
                  "question": "用洛必达法则求极限：lim(x→0) (e^x - 1 - x) / x²。",
                  "reference_answer": "0/0 型。分子导数 e^x - 1，分母导数 2x，仍为 0/0 型。再次：e^x / 2 = 1/2。所以极限 = 1/2。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p3-2-h", "difficulty": "Hard",
                  "question": "求极限：lim(x→0⁺) x^x。",
                  "reference_answer": "1^0 不定式。令 y = x^x，ln y = x ln x → 0·(-∞)。改写：x ln x = ln x / (1/x)，洛必达：(1/x) / (-1/x²) = -x → 0。所以 ln y → 0，y = e^0 = 1。极限为 1。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s3-3", "name": "函数图形分析", "topic": "单调性、凹凸性与渐近线", "order": 2,
             "problems": [
                 {"id": "p3-3-e", "difficulty": "Easy",
                  "question": "求 f(x) = x³ - 6x² + 9x 的单调区间和极值。",
                  "reference_answer": "f'(x) = 3x²-12x+9 = 3(x-1)(x-3)。f'(x)>0 → x∈(-∞,1)∪(3,+∞) 递增；f'(x)<0 → x∈(1,3) 递减。x=1 极大值 f(1)=4；x=3 极小值 f(3)=0。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p3-3-h", "difficulty": "Hard",
                  "question": "求 f(x) = xe^(-x) 的单调区间、极值、凹凸区间、拐点及渐近线。",
                  "reference_answer": "f'(x) = e^(-x) - xe^(-x) = (1-x)e^(-x)。单调递增 (-∞,1)，递减 (1,+∞)，x=1 极大值 e^(-1)。f''(x) = (x-2)e^(-x)：x<2 凸弧，x>2 凹弧，拐点 (2, 2e^(-2))。水平渐近线 y=0（x→+∞）。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch4", "number": 4, "title": "不定积分", "subtitle": "原函数",
        "stages": [
            {"id": "s4-1", "name": "基本积分公式", "topic": "直接积分", "order": 0,
             "problems": [
                 {"id": "p4-1-e", "difficulty": "Easy",
                  "question": "求 ∫(2x + 1/x + e^x) dx。",
                  "reference_answer": "∫(2x + 1/x + e^x) dx = x² + ln|x| + e^x + C。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p4-1-h", "difficulty": "Hard",
                  "question": "求 ∫ (x² + 2) / (x² + 1) dx。",
                  "reference_answer": "拆分：(x²+2)/(x²+1) = 1 + 1/(x²+1)。∫[1 + 1/(x²+1)]dx = x + arctan x + C。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s4-2", "name": "换元积分法", "topic": "第一类和第二类换元法", "order": 1,
             "problems": [
                 {"id": "p4-2-e", "difficulty": "Easy",
                  "question": "用换元法求 ∫ sin²x · cos x dx。",
                  "reference_answer": "令 u = sin x，du = cos x dx，∫u² du = u³/3 + C = sin³x/3 + C。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p4-2-h", "difficulty": "Hard",
                  "question": "求 ∫ √(1-x²) dx（用三角代换）。",
                  "reference_answer": "令 x = sin t，t∈[-π/2, π/2]，dx = cos t dt，√(1-x²) = cos t。∫cos²t dt = ∫(1+cos2t)/2 dt = t/2 + sin2t/4 + C = (arcsin x)/2 + x√(1-x²)/2 + C。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s4-3", "name": "分部积分法", "topic": "分部积分与递推", "order": 2,
             "problems": [
                 {"id": "p4-3-e", "difficulty": "Easy",
                  "question": "求 ∫ x · e^x dx。",
                  "reference_answer": "令 u=x，dv=e^x dx，du=dx，v=e^x。∫x e^x dx = x e^x - ∫e^x dx = x e^x - e^x + C = e^x(x-1) + C。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p4-3-h", "difficulty": "Hard",
                  "question": "求 ∫ e^x · sin x dx。",
                  "reference_answer": "令 I = ∫e^x sin x dx。u=sin x，dv=e^x dx → I = e^x sin x - ∫e^x cos x dx。对后者再分部：e^x cos x + ∫e^x sin x dx = e^x cos x + I。代入：I = e^x sin x - e^x cos x - I，得 2I = e^x(sin x - cos x)，I = e^x(sin x - cos x)/2 + C。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch5", "number": 5, "title": "定积分", "subtitle": "曲线下面积",
        "stages": [
            {"id": "s5-1", "name": "牛顿-莱布尼茨公式", "topic": "定积分计算", "order": 0,
             "problems": [
                 {"id": "p5-1-e", "difficulty": "Easy",
                  "question": "计算 ∫₀¹ (x² + 2x) dx。",
                  "reference_answer": "∫₀¹(x²+2x)dx = [x³/3 + x²]₀¹ = (1/3 + 1) - 0 = 4/3。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p5-1-h", "difficulty": "Hard",
                  "question": "计算 ∫₀^π sin²x dx，并解释其几何意义。",
                  "reference_answer": "sin²x = (1-cos2x)/2，∫₀^π (1-cos2x)/2 dx = [x/2 - sin2x/4]₀^π = π/2。几何意义：y=sin²x 在 [0,π] 上的图形与 x 轴所围面积为 π/2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s5-2", "name": "定积分的应用", "topic": "面积与旋转体体积", "order": 1,
             "problems": [
                 {"id": "p5-2-e", "difficulty": "Easy",
                  "question": "求曲线 y = x² 与直线 y = x 所围平面图形的面积。",
                  "reference_answer": "交点：x²=x → x=0,1。面积 A = ∫₀¹(x-x²)dx = [x²/2 - x³/3]₀¹ = 1/2 - 1/3 = 1/6。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p5-2-h", "difficulty": "Hard",
                  "question": "求 y = √x 在 [0,1] 上，绕 x 轴旋转所得旋转体的体积。",
                  "reference_answer": "圆盘法：V = π∫₀¹ (√x)² dx = π∫₀¹ x dx = π[x²/2]₀¹ = π/2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s5-3", "name": "反常积分", "topic": "无穷限与无界函数积分", "order": 2,
             "problems": [
                 {"id": "p5-3-e", "difficulty": "Easy",
                  "question": "计算反常积分 ∫₁^∞ 1/x² dx，并判断收敛性。",
                  "reference_answer": "∫₁^∞ x^(-2) dx = lim(b→∞) [-1/x]₁ᵇ = lim(b→∞) (-1/b + 1) = 1。收敛，值为 1。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p5-3-h", "difficulty": "Hard",
                  "question": "判断 ∫₀¹ ln x dx 的收敛性，若收敛求其值。",
                  "reference_answer": "x=0 是瑕点（ln 0→-∞）。∫₀¹ ln x dx = lim(ε→0⁺) ∫ε¹ ln x dx = lim(ε→0⁺) [x ln x - x]ε¹ = (0-1) - (ε ln ε - ε)。因 lim(ε→0⁺) ε ln ε = 0，极限 = -1 - 0 = -1。收敛，值为 -1。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch6", "number": 6, "title": "微分方程", "subtitle": "变化律建模",
        "stages": [
            {"id": "s6-1", "name": "微分方程基本概念", "topic": "微分方程基础", "order": 0,
             "problems": [
                 {"id": "p6-1-e", "difficulty": "Easy",
                  "question": "验证 y = C₁e^x + C₂e^(-x) 是方程 y'' - y = 0 的通解（C₁, C₂ 为任意常数）。",
                  "reference_answer": "y' = C₁e^x - C₂e^(-x)，y'' = C₁e^x + C₂e^(-x) = y。所以 y'' - y = 0 成立。含2个任意常数，是2阶方程通解。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p6-1-h", "difficulty": "Hard",
                  "question": "求微分方程 y'' = xe^x 满足 y(0)=0，y'(0)=1 的特解。",
                  "reference_answer": "积分一次：y' = ∫xe^x dx = xe^x - e^x + C₁ = e^x(x-1) + C₁。y'(0)=e^0(0-1)+C₁=-1+C₁=1，C₁=2。y = ∫[e^x(x-1)+2]dx = e^x(x-1) - e^x + 2x + C₂ = e^x(x-2) + 2x + C₂。y(0)=e^0(0-2)+0+C₂=-2+C₂=0，C₂=2。特解：y = e^x(x-2) + 2x + 2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s6-2", "name": "可分离变量与一阶线性方程", "topic": "一阶微分方程", "order": 1,
             "problems": [
                 {"id": "p6-2-e", "difficulty": "Easy",
                  "question": "求微分方程 dy/dx = 2xy 的通解。",
                  "reference_answer": "分离变量：dy/y = 2x dx。两端积分：ln|y| = x² + C₀，|y| = e^(C₀) · e^(x²)，故 y = Ce^(x²)（C 为任意非零常数，含 C=0 则 y≡0）。通解 y = Ce^(x²)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p6-2-h", "difficulty": "Hard",
                  "question": "求一阶线性方程 y' + y = e^x 的通解。",
                  "reference_answer": "P(x)=1，Q(x)=e^x。积分因子 μ = e^(∫1 dx) = e^x。(e^x y)' = e^x · e^x = e^(2x)。两端积分：e^x y = e^(2x)/2 + C。通解 y = e^x/2 + Ce^(-x)。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s6-3", "name": "二阶常系数线性方程", "topic": "特征根法", "order": 2,
             "problems": [
                 {"id": "p6-3-e", "difficulty": "Easy",
                  "question": "求方程 y'' - 3y' + 2y = 0 的通解。",
                  "reference_answer": "特征方程 r²-3r+2=0，(r-1)(r-2)=0，特征根 r₁=1，r₂=2。通解 y = C₁e^x + C₂e^(2x)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p6-3-h", "difficulty": "Hard",
                  "question": "求方程 y'' + 2y' + y = xe^(-x) 的通解。",
                  "reference_answer": "齐次方程特征根：r²+2r+1=(r+1)²=0，r₁=r₂=-1，齐次通解 y*=(C₁+C₂x)e^(-x)。非齐次特解：λ=-1 为2重特征根，设特解 ỹ = x²(ax+b)e^(-x)。代入：6ax e^(-x) + 2a e^(-x) = xe^(-x)，a=1/6，b=0。特解 ỹ = x³e^(-x)/6。通解 y = (C₁+C₂x)e^(-x) + x³e^(-x)/6。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
]


async def seed_data(db: AsyncSession):
    """Seed chapters/stages/problems. Re-seeds if ch6 is missing (upgrade)."""
    # Check if ch6 exists — if not, we need to (re-)seed
    result = await db.execute(select(DBChapter).where(DBChapter.id == "ch6"))
    if result.first() is not None:
        return  # Already fully seeded with all 6 chapters

    # Clear old data (handles upgrade from 5-chapter version)
    # Note: This will also clear user_progress referencing these problems.
    # For a dev/demo environment this is acceptable.
    await db.execute(delete(UserProgress))
    await db.execute(delete(DBProblem))
    await db.execute(delete(DBStage))
    await db.execute(delete(DBChapter))
    await db.commit()

    for ch_data in SEED_CHAPTERS:
        ch = DBChapter(
            id=ch_data["id"], number=ch_data["number"],
            title=ch_data["title"], subtitle=ch_data["subtitle"],
            available=True,  # availability is computed dynamically
        )
        db.add(ch)
        for st_data in ch_data.get("stages", []):
            st = DBStage(
                id=st_data["id"], chapter_id=ch_data["id"],
                name=st_data["name"], topic=st_data["topic"],
                order=st_data["order"],
            )
            db.add(st)
            for p_data in st_data.get("problems", []):
                p = DBProblem(
                    id=p_data["id"], stage_id=st_data["id"],
                    difficulty=p_data["difficulty"], question=p_data["question"],
                    reference_answer=p_data.get("reference_answer", ""),
                    rewards=p_data.get("rewards", []),
                    first_clear_bonus=p_data.get("first_clear_bonus"),
                )
                db.add(p)
    await db.commit()


@router.get("/", response_model=list[Chapter])
async def list_chapters(
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    await seed_data(db)
    await ensure_user(db, user_id)
    result = await db.execute(
        select(DBChapter).options(selectinload(DBChapter.stages).selectinload(DBStage.problems))
        .order_by(DBChapter.number)
    )
    chapters = result.scalars().all()

    # Build all chapters with progress first (needed for sequential unlock)
    chapters_data = [await _chapter_to_schema(ch, user_id, db) for ch in chapters]

    # Apply sequential unlock across chapters
    _apply_chapter_unlock(chapters_data)

    return chapters_data


@router.get("/{chapter_id}", response_model=Chapter)
async def get_chapter(
    chapter_id: str,
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    await seed_data(db)
    await ensure_user(db, user_id)

    # Need all chapters to compute availability
    result = await db.execute(
        select(DBChapter).options(selectinload(DBChapter.stages).selectinload(DBStage.problems))
        .order_by(DBChapter.number)
    )
    all_chapters = result.scalars().all()
    chapters_data = [await _chapter_to_schema(ch, user_id, db) for ch in all_chapters]
    _apply_chapter_unlock(chapters_data)

    ch_data = next((c for c in chapters_data if c["id"] == chapter_id), None)
    if not ch_data:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return ch_data


def _apply_chapter_unlock(chapters_data: list[dict]):
    """Apply sequential chapter unlock: ch1 always available, others need previous chapter's last stage cleared."""
    for i, ch in enumerate(chapters_data):
        if i == 0:
            ch["available"] = True
        else:
            prev = chapters_data[i - 1]
            # Previous chapter unlocked AND at least its last stage is cleared
            prev_stages = prev.get("stages", [])
            if not prev_stages:
                ch["available"] = False
            else:
                # Need ALL stages of previous chapter cleared for sequential unlock
                # (or at least the last one — we use "all" for better progression feel)
                ch["available"] = all(s["cleared"] for s in prev_stages)


async def _chapter_to_schema(ch: DBChapter, user_id: str, db: AsyncSession) -> dict:
    """Build chapter schema with user progress awareness (DAG unlock logic)."""
    problem_ids = [p.id for st in ch.stages for p in st.problems]
    progress_map: dict[str, UserProgress] = {}
    if problem_ids:
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.problem_id.in_(problem_ids),
            )
        )
        for p in result.scalars().all():
            progress_map[p.problem_id] = p

    stages_data = []
    for st in ch.stages:
        # A stage is "cleared" if any of its problems is completed
        stage_cleared = any(
            progress_map.get(p.id) and progress_map[p.id].completed
            for p in st.problems
        )
        stages_data.append({
            "id": st.id,
            "name": st.name,
            "topic": st.topic,
            "unlocked": True,  # set below via DAG
            "cleared": stage_cleared,
            "is_teaching": st.order == 0,  # first stage of each chapter is teaching
            "knowledge_content": KNOWLEDGE_CONTENT.get(st.id),
            "problems": [
                {
                    "id": p.id,
                    "difficulty": p.difficulty,
                    "question": p.question,
                    "rewards": p.rewards or [],
                    "first_clear_bonus": p.first_clear_bonus,
                    "completed": bool(progress_map.get(p.id) and progress_map[p.id].completed),
                    "best_score": float(progress_map.get(p.id).best_score or 0) if progress_map.get(p.id) else 0,
                }
                for p in st.problems
            ],
        })

    # DAG within chapter: first stage always unlocked, rest unlock when previous cleared
    for i in range(len(stages_data)):
        if i == 0:
            stages_data[i]["unlocked"] = True
        else:
            stages_data[i]["unlocked"] = stages_data[i - 1]["cleared"]

    return {
        "id": ch.id,
        "number": ch.number,
        "title": ch.title,
        "subtitle": ch.subtitle,
        "available": True,  # overridden by _apply_chapter_unlock
        "stages": stages_data,
    }
