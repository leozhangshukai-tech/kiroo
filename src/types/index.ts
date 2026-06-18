// ==================== 问卷相关类型 ====================

export type IdentityType = 'student' | 'successor'

export type QuestionnaireCategory =
  | 'personality'
  | 'temperament'
  | 'mbti'
  | 'leadership'
  | 'career'
  | 'big5'
  | '16pf'
  | 'creativity'
  | 'holland'
  | 'lzu-leadership'
  | 'lzu-personality'
  | 'lzu-creativity'
  | 'successor-leadership'
  | 'successor-traits'

export interface Option {
  id: string
  text: string
  scores?: Record<string, number>
  category?: string
}

export interface Question {
  id: string
  sequence: number
  text: string
  options: Option[]
}

export interface DimensionDefinition {
  key: string
  name: string
  min?: number
  max?: number
  description?: string
}

export interface CategoryDefinition {
  key: string
  name: string
  description?: string
}

export type ScoringRuleType = 'additive' | 'categorical'

export interface ScoringRule {
  type: ScoringRuleType
  dimensions?: DimensionDefinition[]
  categories?: CategoryDefinition[]
}

export interface Questionnaire {
  id: string
  name: string
  category: QuestionnaireCategory
  description: string
  enabled: boolean
  createdAt: string
  questions: Question[]
  scoring_rule: ScoringRule
}

export type QuestionnaireMetadata = Omit<Questionnaire, 'questions'>

export interface ScoreResult {
  questionnaireId: string
  type: ScoringRuleType
  dimensionScores?: Record<string, number>
  categoryResult?: string
  categoryFrequencies?: Record<string, number>
  answeredAt: string
}

// ==================== 问卷优先级配置 ====================

export const QUESTIONNAIRE_PRIORITY: Array<{
  id: string
  name: string
  questions: number
  estimatedMinutes: number
}> = [
  { id: 'leadership',   name: '领导风格测评',           questions: 12,  estimatedMinutes: 3  },
  { id: 'temperament',  name: '气质类型测试',           questions: 60,  estimatedMinutes: 10 },
  { id: 'big5',         name: '大五人格测试',           questions: 60,  estimatedMinutes: 10 },
  { id: 'mbti',         name: 'MBTI性格测试',           questions: 93,  estimatedMinutes: 15 },
  { id: '16pf',         name: '卡氏十六种人格因素测验',  questions: 187, estimatedMinutes: 30 },
  { id: 'creativity',   name: '创造力障碍测评',         questions: 37,  estimatedMinutes: 6  },
  { id: 'holland',      name: '霍兰德职业兴趣测试',     questions: 90,  estimatedMinutes: 15 },
]

export const PRIORITY_ORDER = QUESTIONNAIRE_PRIORITY.map(q => q.id)

// ==================== 兰大测评优先级配置 ====================

export const LZU_QUESTIONNAIRE_PRIORITY: Array<{
  id: string
  name: string
  questions: number
  estimatedMinutes: number
}> = [
  { id: 'lzu-leadership',  name: '领导风格问卷',      questions: 12, estimatedMinutes: 15 },
  { id: 'lzu-personality', name: '16PF人格测验',    questions: 15, estimatedMinutes: 20 },
  { id: 'lzu-creativity',  name: '创造力障碍测试',            questions: 12, estimatedMinutes: 15 },
]

export const LZU_PRIORITY_ORDER = LZU_QUESTIONNAIRE_PRIORITY.map(q => q.id)

// ==================== 二代版测评优先级配置 ====================

export const SUCCESSOR_QUESTIONNAIRE_PRIORITY: Array<{
  id: string
  name: string
  questions: number
  estimatedMinutes: number
}> = [
  // 待二代题库就绪后填入
]

/** 是否为兰大测评模式 */
export const IS_LZU_MODE = import.meta.env.VITE_LZU_MODE === 'true'

// ==================== 测评会话类型 ====================

export type SessionStatus = 'in_progress' | 'completed' | 'submitted' | 'approved' | 'rejected'

export interface AssessmentSession {
  id: number
  selectedQuestionnaires: string[]
  orderedQuestionnaires: string[]
  currentIndex: number
  status: SessionStatus
  createdAt?: string
  updatedAt?: string
}

// ==================== 综合报告类型 ====================

export interface ComprehensiveReport {
  id: number
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, ScoreResult>
  reportContent: string | null
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
}

// ==================== 报告错误类型 ====================

export type ReportError =
  | { type: 'timeout' }
  | { type: 'http_error'; status: number }
  | { type: 'empty_response' }

// ==================== 旧版报告类型（保留兼容） ====================

export interface AssessmentReport {
  questionnaireName: string
  scoreResult: ScoreResult
  aiAnalysis: string
  suggestions: string
  generatedAt: string
}

export type ReportStatus = 'idle' | 'loading' | 'success' | 'error'

// ==================== Assessment State ====================

export interface AssessmentState {
  questionnaires: Questionnaire[]
  /** 新版：当前测评会话 */
  currentSession: AssessmentSession | null
  /** 旧版兼容：当前单个问卷 */
  currentQuestionnaire: Questionnaire | null
  /** 当前问卷的答题记录 */
  answers: Record<string, string>
  /** 当前单个问卷计分结果 */
  scoreResult: ScoreResult | null
  /** 所有已完成问卷的计分结果汇总（用于综合报告） */
  allScoreResults: Record<string, ScoreResult>
  /** 旧版报告 */
  report: AssessmentReport | null
  reportStatus: ReportStatus
  reportError: ReportError | null
  /** 新版综合报告 */
  comprehensiveReport: ComprehensiveReport | null
}

export type AssessmentAction =
  | { type: 'SET_QUESTIONNAIRES'; payload: Questionnaire[] }
  | { type: 'SET_SESSION'; payload: AssessmentSession | null }
  | { type: 'START_ASSESSMENT'; payload: Questionnaire }
  | { type: 'SET_ANSWER'; payload: { questionId: string; optionId: string } }
  | { type: 'SET_SCORE_RESULT'; payload: ScoreResult }
  | { type: 'ADD_COMPLETED_SCORE'; payload: { questionnaireId: string; scoreResult: ScoreResult } }
  | { type: 'SET_ALL_SCORES'; payload: Record<string, ScoreResult> }
  | { type: 'SET_REPORT_LOADING' }
  | { type: 'SET_REPORT_SUCCESS'; payload: AssessmentReport }
  | { type: 'SET_REPORT_ERROR'; payload: ReportError }
  | { type: 'SET_COMPREHENSIVE_REPORT'; payload: ComprehensiveReport | null }
  | { type: 'RETRY_REPORT' }
  | { type: 'RESET' }
