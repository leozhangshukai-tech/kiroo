# HelloPage 改造任务

## 背景
项目要到武汉某大学投入使用测评，需要将落地页（HelloPage）内容聚焦于"大学生职业测评"场景，去掉企业二代相关内容，精简页面，美化视觉效果。

## 需要修改的文件清单

| 操作 | 文件路径 |
|------|----------|
| 删除 | src/components/hello/IdentitySection.tsx |
| 删除 | src/components/hello/StatsSection.tsx |
| 删除 | src/components/hello/ExpertSection.tsx |
| 重写 | src/components/hello/Hero.tsx |
| 修改 | src/components/hello/FeatureSection.tsx |
| 修改 | src/components/hello/HelloNavbar.tsx |
| 小改 | src/components/hello/HelloFooter.tsx |
| 修改 | src/pages/HelloPage.tsx |
| 新建 | src/components/hello/CTASection.tsx |

---

## 1. 修改 src/pages/HelloPage.tsx

删除 IdentitySection、StatsSection、ExpertSection 的 import 和使用，新增 CTASection。

最终代码：

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HelloNavbar from '../components/hello/HelloNavbar'
import Hero from '../components/hello/Hero'
import FeatureSection from '../components/hello/FeatureSection'
import ReportPreviewSection from '../components/hello/ReportPreviewSection'
import CTASection from '../components/hello/CTASection'
import HelloFooter from '../components/hello/HelloFooter'

export default function HelloPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/select', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden">
      <HelloNavbar />
      <Hero />
      <FeatureSection />
      <ReportPreviewSection />
      <CTASection />
      <HelloFooter />
    </div>
  )
}
```

---

## 2. 删除 3 个文件

直接删除：
- src/components/hello/IdentitySection.tsx
- src/components/hello/StatsSection.tsx
- src/components/hello/ExpertSection.tsx

---

## 3. 新建 src/components/hello/CTASection.tsx

深色背景的行动号召区块：

```tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <motion.section
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* 背景光斑 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          准备好了吗？
        </motion.h2>
        <motion.p
          className="text-lg text-white/60 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          5分钟测评，找到你的方向
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white text-lg font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
          >
            立即开始
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
        <motion.p
          className="text-sm text-white/40 mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          测一次，少走五年弯路
        </motion.p>
      </div>
    </motion.section>
  )
}
```

---

## 4. 重写 src/components/hello/Hero.tsx

整体结构：左侧文案 + 右侧轨道动画（6个浮动图标球+美化中心球）

```tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, Eye, FlaskConical, Brain, Lightbulb, GraduationCap } from 'lucide-react'

const floatingBalls = [
  { icon: Target, pos: 'top-[3%] left-1/2 -translate-x-1/2', bg: 'from-[#EFF6FF] to-[#DBEAFE]', stroke: '#2563EB', shadow: 'rgba(37,99,235,0.2)', y: -12, dur: 3.8, delay: 0 },
  { icon: Eye, pos: 'top-[17%] right-[5%]', bg: 'from-[#ECFEFF] to-[#CFFAFE]', stroke: '#06B6D4', shadow: 'rgba(6,182,212,0.2)', y: -9, dur: 4.4, delay: -0.7 },
  { icon: FlaskConical, pos: 'bottom-[17%] right-[3%]', bg: 'from-[#ECFDF5] to-[#D1FAE5]', stroke: '#059669', shadow: 'rgba(5,150,105,0.2)', y: -14, dur: 3.5, delay: -1.4 },
  { icon: Brain, pos: 'bottom-[1%] left-1/2 -translate-x-1/2', bg: 'from-[#F0FDF4] to-[#DCFCE7]', stroke: '#16A34A', shadow: 'rgba(22,163,74,0.2)', y: -8, dur: 4.8, delay: -2.1 },
  { icon: Lightbulb, pos: 'bottom-[17%] left-[3%]', bg: 'from-[#FFFBEB] to-[#FEF3C7]', stroke: '#D97706', shadow: 'rgba(217,119,6,0.2)', y: -11, dur: 3.3, delay: -2.8 },
  { icon: GraduationCap, pos: 'top-[17%] left-[5%]', bg: 'from-[#FEF2F2] to-[#FECACA]', stroke: '#DC2626', shadow: 'rgba(220,38,38,0.18)', y: -10, dur: 4.1, delay: -3.5 },
]

export default function Hero() {
  return (
    <motion.section
      id="hero"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0F9FF]" />
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 左侧文案 */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-[#2563EB]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-[#2563EB]">AI职业规划平台</span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <span className="text-[#0F172A]">明途AI</span>
            </motion.h1>

            <motion.p
              className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#06B6D4] mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              看清前途，再做选择
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-lg mx-auto lg:mx-0 mb-2">
                专为大学生设计的AI职业规划平台
              </p>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                5分钟测评，获取你的专属职业发展报告<br />
                找到最适合你的行业与岗位方向
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
            >
              <Link
                to="/register"
                className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 text-center relative overflow-hidden"
              >
                <span className="relative z-10">立即开始测评</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#1D4ED8] to-[#0891B2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <a
                href="#report-preview"
                className="px-8 py-3.5 rounded-full bg-white border border-gray-200 text-[#0F172A] font-semibold hover:border-[#2563EB] hover:text-[#2563EB] hover:shadow-lg transition-all duration-300 text-center"
              >
                查看示例报告
              </a>
            </motion.div>
          </motion.div>

          {/* 右侧视觉：轨道 + 中心球 + 6浮动球 */}
          <motion.div
            className="flex justify-center relative"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          >
            <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[440px] lg:h-[440px]">

              {/* 轨道 */}
              <motion.div
                className="absolute inset-[8%] rounded-full border border-blue-200/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-[20%] rounded-full border border-cyan-200/8"
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-[32%] rounded-full border border-dashed border-purple-200/6"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              />

              {/* 中心球 */}
              <div className="absolute inset-[34%] flex items-center justify-center">
                {/* 脉冲扩散环1 */}
                <motion.div
                  className="absolute w-[100px] h-[100px] sm:w-[115px] sm:h-[115px] lg:w-[130px] lg:h-[130px] rounded-full border-[1.5px] border-blue-500/15"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* 脉冲扩散环2 */}
                <motion.div
                  className="absolute w-[120px] h-[120px] sm:w-[135px] sm:h-[135px] lg:w-[155px] lg:h-[155px] rounded-full border border-cyan-500/10"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                {/* 旋转虚线光晕 */}
                <motion.div
                  className="absolute w-[85px] h-[85px] sm:w-[100px] sm:h-[100px] lg:w-[115px] lg:h-[115px] rounded-full border-[1.5px] border-dashed border-blue-500/12"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                {/* 径向辉光 */}
                <div
                  className="absolute w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] lg:w-[160px] lg:h-[160px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, rgba(6,182,212,0.04) 50%, transparent 70%)' }}
                />
                {/* 球体 */}
                <motion.div
                  className="relative w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] lg:w-[80px] lg:h-[80px] rounded-full flex items-center justify-center border-2 border-white/20"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 30%, #06B6D4 100%)',
                    boxShadow: '0 8px 32px rgba(37,99,235,0.35), 0 0 60px rgba(37,99,235,0.12)',
                  }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* 顶部高光 */}
                  <div className="absolute top-[6px] left-[12px] w-[28px] h-[14px] lg:w-[35px] lg:h-[18px] rounded-full bg-gradient-to-b from-white/35 to-transparent" />
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </motion.div>
              </div>

              {/* 6个浮动图标球 */}
              {floatingBalls.map((ball, index) => {
                const Icon = ball.icon
                return (
                  <motion.div
                    key={index}
                    className={`absolute ${ball.pos} w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center border-[1.5px] border-white/90 backdrop-blur-[12px] bg-gradient-to-br ${ball.bg}`}
                    style={{ boxShadow: `0 8px 24px -4px ${ball.shadow}, 0 2px 8px ${ball.shadow}` }}
                    animate={{ y: [0, ball.y, 0] }}
                    transition={{ duration: ball.dur, repeat: Infinity, ease: 'easeInOut', delay: ball.delay }}
                  >
                    {/* 高光层 */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
                    <Icon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-[26px] lg:h-[26px] relative z-10" style={{ color: ball.stroke }} strokeWidth={2} />
                  </motion.div>
                )
              })}

            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
```

---

## 5. 修改 src/components/hello/FeatureSection.tsx

只需要改两处：

### 5.1 修改 import
把原来的图标 import 改为：
```tsx
import { Target, Eye, FlaskConical, Brain, Lightbulb, GraduationCap } from 'lucide-react'
```

### 5.2 修改 features 数组
```tsx
const features = [
  {
    title: '精准定位',
    desc: '匹配适合你的行业与岗位，告诉你该往哪走',
    icon: Target,
    color: 'text-[#2563EB]',
    bg: 'bg-blue-50',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    title: '前瞻10年',
    desc: '结合AI时代趋势，规划长期发展路径',
    icon: Eye,
    color: 'text-[#7C3AED]',
    bg: 'bg-purple-50',
    hoverBorder: 'hover:border-purple-200',
  },
  {
    title: '科学权威',
    desc: '基于权威心理学量表，多维交叉分析，综合画像',
    icon: FlaskConical,
    color: 'text-[#06B6D4]',
    bg: 'bg-cyan-50',
    hoverBorder: 'hover:border-cyan-200',
  },
  {
    title: 'AI智能分析',
    desc: '即时生成个性化报告，零等待查看结果',
    icon: Brain,
    color: 'text-[#059669]',
    bg: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-200',
  },
  {
    title: '正向赋能',
    desc: '聚焦优势发现，用"发展空间"代替"劣势"，激发信心',
    icon: Lightbulb,
    color: 'text-[#D97706]',
    bg: 'bg-amber-50',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    title: '专家设计',
    desc: '高校教授 × 硕博团队联合研发，三重保障',
    icon: GraduationCap,
    color: 'text-[#DC2626]',
    bg: 'bg-red-50',
    hoverBorder: 'hover:border-red-200',
  },
]
```

### 5.3 修改标题文案
- h2 改为："为什么选择明途AI"
- p 改为："不是简单贴标签，而是给方向——测一次，少走五年弯路"

### 5.4 给 section 加 id
在 `<motion.section` 上加 `id="features"`

---

## 6. 修改 src/components/hello/HelloNavbar.tsx

navLinks 数组改为：
```tsx
const navLinks = [
  { label: '首页', href: '#hero' },
  { label: '测评介绍', href: '#features' },
  { label: '报告示例', href: '#report-preview' },
  { label: '关于我们', href: '#footer' },
]
```

---

## 7. 小改 src/components/hello/HelloFooter.tsx

footerLinks 数组第一项"产品"的 links 改为：
```tsx
links: ['学生版测评', '报告示例', '常见问题'],
```

---

## 执行顺序

1. 删除 3 个不需要的文件
2. 新建 CTASection.tsx
3. 重写 Hero.tsx（这是最大的改动）
4. 修改 FeatureSection.tsx
5. 修改 HelloPage.tsx
6. 修改 HelloNavbar.tsx
7. 小改 HelloFooter.tsx

## 技术栈提醒

- React + TypeScript
- framer-motion（动画）
- lucide-react（图标）
- Tailwind CSS（样式）
- react-router-dom 的 Link 组件（路由跳转）

## 不要动的文件

- src/components/hello/ReportPreviewSection.tsx（保持原样）
- src/context/AuthContext.tsx
- 其他所有文件
