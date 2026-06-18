import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Brain, Target, Lightbulb, Map, ArrowRight } from 'lucide-react'

const reportFeatures = [
  { icon: BarChart3, title: '综合评估', desc: '仪表盘式总览，一目了然你的综合得分', color: 'text-blue-500 bg-blue-50' },
  { icon: Brain, title: '能力画像', desc: '雷达图多维展示你的核心优势与潜力', color: 'text-purple-500 bg-purple-50' },
  { icon: Target, title: '行业匹配', desc: '精准匹配适合的行业+岗位排名', color: 'text-cyan-500 bg-cyan-50' },
  { icon: Lightbulb, title: '发展建议', desc: 'AI个性化生成，给方向而非贴标签', color: 'text-amber-500 bg-amber-50' },
  { icon: Map, title: '职业路线图', desc: '前瞻10年，结合AI趋势规划成长路径', color: 'text-emerald-500 bg-emerald-50' },
]

export default function ReportPreviewSection() {
  return (
    <motion.section
      id="report-preview"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左侧：高端报告 Mockup */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md">
              {/* 报告主体 */}
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* 顶部渐变条 */}
                <div className="h-1.5 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4]" />

                <div className="p-6 sm:p-8">
                  {/* 报告头部 */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-medium mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                        明途AI · 专属报告
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A]">职业发展综合评估</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#64748B]">综合得分</p>
                      <p className="text-2xl font-extrabold text-[#2563EB]">82<span className="text-sm text-[#64748B] font-normal">/100</span></p>
                    </div>
                  </div>

                  {/* 仪表盘区 */}
                  <div className="bg-[#F8FAFC] rounded-xl p-4 mb-5">
                    <p className="text-[10px] text-[#64748B] font-medium mb-3 uppercase tracking-wide">能力雷达</p>
                    <div className="flex justify-center">
                      <svg width="180" height="130" viewBox="0 0 180 130" className="drop-shadow-sm">
                        {/* 背景网格 */}
                        <polygon points="90,15 155,42 145,100 35,100 25,42" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
                        <polygon points="90,30 138,50 130,90 50,90 42,50" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
                        <polygon points="90,45 120,58 115,80 65,80 60,58" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
                        {/* 数据面 */}
                        <polygon points="90,20 150,44 125,95 48,88 32,46" fill="rgba(37,99,235,0.08)" stroke="#2563EB" strokeWidth="1.5" />
                        {/* 数据点 */}
                        <circle cx="90" cy="20" r="3" fill="#2563EB" />
                        <circle cx="150" cy="44" r="3" fill="#2563EB" />
                        <circle cx="125" cy="95" r="3" fill="#2563EB" />
                        <circle cx="48" cy="88" r="3" fill="#2563EB" />
                        <circle cx="32" cy="46" r="3" fill="#2563EB" />
                        {/* 标签 */}
                        <text x="90" y="10" textAnchor="middle" fontSize="9" fill="#64748B" fontWeight="500">领导力</text>
                        <text x="163" y="46" textAnchor="start" fontSize="9" fill="#64748B" fontWeight="500">创新力</text>
                        <text x="130" y="110" textAnchor="start" fontSize="9" fill="#64748B" fontWeight="500">执行力</text>
                        <text x="40" y="110" textAnchor="end" fontSize="9" fill="#64748B" fontWeight="500">沟通力</text>
                        <text x="20" y="46" textAnchor="end" fontSize="9" fill="#64748B" fontWeight="500">抗压力</text>
                      </svg>
                    </div>
                  </div>

                  {/* 行业匹配度 */}
                  <div className="mb-5">
                    <p className="text-[10px] text-[#64748B] font-medium mb-3 uppercase tracking-wide">行业匹配度</p>
                    <div className="space-y-3">
                      {[
                        { name: '互联网/科技', score: 92 },
                        { name: '金融/咨询', score: 85 },
                        { name: '教育/培训', score: 78 },
                      ].map((item) => (
                        <div key={item.name}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[#0F172A] font-medium">{item.name}</span>
                            <span className="text-[#2563EB] font-bold">{item.score}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.score}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 职业路线预览 */}
                  <div className="bg-gradient-to-r from-[#EEF2FF] to-[#F0F9FF] rounded-xl p-4">
                    <p className="text-[10px] text-[#64748B] font-medium mb-2 uppercase tracking-wide">10年发展路线</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] font-medium">入行</span>
                      <span className="text-gray-300">→</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] font-medium">深耕</span>
                      <span className="text-gray-300">→</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] font-medium">管理</span>
                      <span className="text-gray-300">→</span>
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-medium">专家</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 装饰阴影层 */}
              <div className="absolute -bottom-3 left-6 right-6 h-6 bg-gradient-to-b from-blue-100/40 to-transparent rounded-b-2xl blur-sm -z-10" />
              <div className="absolute -bottom-6 left-12 right-12 h-6 bg-gradient-to-b from-blue-50/30 to-transparent rounded-b-2xl blur-md -z-20" />
            </div>
          </motion.div>

          {/* 右侧：内容说明 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
              测评报告预览
            </h2>
            <p className="text-base text-[#64748B] mb-8 leading-relaxed">
              AI即时生成个性化报告，含可视化图表 + 精准分析 + 可下载PDF，零等待即可查看你的专属职业发展蓝图。
            </p>

            {/* 报告内容列表 */}
            <div className="space-y-3 mb-8">
              {reportFeatures.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{item.title}</h4>
                      <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* CTA */}
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
            >
              查看完整示例
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
