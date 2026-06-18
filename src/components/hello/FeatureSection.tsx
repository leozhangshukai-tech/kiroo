import { motion } from 'framer-motion'
import { Target, Eye, FlaskConical, Brain, Lightbulb, GraduationCap } from 'lucide-react'

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

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function FeatureSection() {
  return (
    <motion.section
      id="features"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* 背景模糊光斑 */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">
            为什么选择明途AI
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            不是简单贴标签，而是给方向——测一次，少走五年弯路
          </p>
        </motion.div>

        {/* 卡片网格 */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className={`group p-6 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-transparent ${f.hoverBorder} hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300`}
              >
                <motion.div
                  className={`w-12 h-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </motion.div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </motion.section>
  )
}
