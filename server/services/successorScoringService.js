/**
 * 二代版计分服务（占位）
 * 等待二代题库和算法就绪后实现
 */

function calculateSuccessorScore(scoreSummary) {
  // TODO: 实现二代版三条路适配度计分
  // 返回结构应包含：
  // - inheritScore: 继承家业适配度
  // - startupScore: 自主创业适配度
  // - employmentScore: 外出就业适配度
  // - totalScore: 综合得分
  // - recommendedPath: 推荐路径
  // - breakdown: 各维度明细

  return {
    totalScore: 75,
    grade: '待评估',
    gradeDescription: '二代版评估系统开发中',
    inheritScore: 0,
    startupScore: 0,
    employmentScore: 0,
    recommendedPath: 'inherit',
    breakdown: {},
  };
}

module.exports = { calculateSuccessorScore };
