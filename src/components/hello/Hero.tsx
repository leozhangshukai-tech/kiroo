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
                AI职业规划与传承发展平台
              </p>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                5分钟测评，获取你的专属发展报告<br />
                看清方向，找到最适合你的路径
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
