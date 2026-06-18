/**
 * 二代版报告生成器（占位）
 * 等待二代题库、计分规则、AI Prompt 和报告模板就绪后实现
 *
 * 职责：
 *   1. 调用AI生成三条路（继承/创业/就业）的文字解析
 *   2. 解析AI返回的结构化文本
 *   3. 调用chartService生成SVG图表
 *   4. 调用template组装完整HTML
 *   5. 输出HTML报告文件
 */

async function generateReport({ scores, userName, sessionId }) {
  // TODO: 实现完整的二代版报告生成流程
  throw new Error('二代版报告生成器尚未实现，请等待后续更新');
}

module.exports = { generateReport };
