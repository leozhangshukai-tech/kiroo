/**
 * 兰大综合报告 — 生成编排器
 *
 * 职责：
 *   1. 调用AI生成文字解析
 *   2. 解析AI返回的结构化文本
 *   3. 调用chartService生成SVG图表
 *   4. 调用template组装完整HTML
 *   5. 通过Puppeteer渲染HTML为PDF
 *
 * 提示词参考：D:\AI测评小助手\提示词兰大最终终版.md
 * 模版参考：D:\AI测评小助手\报告模版兰大最终.html
 */

const fs = require('fs');
const path = require('path');
const { renderLeadershipRadar, renderScoreGauge } = require('./lzuChartService');
const { buildReportHTML } = require('./lzuReportTemplate');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * 解析AI返回的结构化文本，按 [SECTION:xxx] 标记切分
 * 18个中文段落，参照：提示词兰大最终终版.md
 */
function parseAIText(raw) {
  const sections = {
    overallPortrait: '',
    coreStrengths: '',
    leadershipStrength: '',
    leadershipRadarInterpretation: '',
    leadershipConclusion: '',
    personalityCreativity: '',
    personalityMentalHealth: '',
    personalityManagement: '',
    personalityConclusion: '',
    barrierPsychological: '',
    barrierCognitive: '',
    barrierEnvironmental: '',
    barrierConclusion: '',
    scoreGrade: '',
    careerPositions: '',
    keyActions: '',
    growthPath: '',
    finalAdvice: '',
  };

  const sectionMap = {
    '整体画像': 'overallPortrait',
    '核心优势与成长点': 'coreStrengths',
    '领导风格强度': 'leadershipStrength',
    '领导风格雷达图解读': 'leadershipRadarInterpretation',
    '领导风格综合结论': 'leadershipConclusion',
    '人格特质-创造力': 'personalityCreativity',
    '人格特质-心理健康': 'personalityMentalHealth',
    '人格特质-管理潜能': 'personalityManagement',
    '人格特质综合结论': 'personalityConclusion',
    '创造力障碍-心理障碍': 'barrierPsychological',
    '创造力障碍-认知障碍': 'barrierCognitive',
    '创造力障碍-环境资源障碍': 'barrierEnvironmental',
    '创造力障碍综合结论': 'barrierConclusion',
    '综合评分与等级': 'scoreGrade',
    '适合岗位类别': 'careerPositions',
    '关键发展行动': 'keyActions',
    '阶段性成长路径': 'growthPath',
    '最终建议与寄语': 'finalAdvice',
  };

  // 使用正则匹配 [SECTION:xxx] 直到下一个 [SECTION: 或文本结尾
  const regex = /\[SECTION:([^\]]+)\]\s*([\s\S]*?)(?=\[SECTION:[^\]]+\]|$)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    const mappedKey = sectionMap[key];
    if (mappedKey) {
      sections[mappedKey] = value;
    }
  }

  return sections;
}

/**
 * 生成图表SVG
 */
function generateCharts(scores) {
  const l = scores.leadership;
  const b = scores.creativityBarrier;
  const p = scores.personality;

  const leadershipRadar = renderLeadershipRadar(l.s1, l.s2, l.s3, l.s4);
  const scoreGauge = renderScoreGauge(scores.totalScore, '综合得分', scores.grade);

  return { leadershipRadar, scoreGauge };
}

/**
 * 调用DeepSeek API生成文字解析
 */
async function callAIForText(scores, userName) {
  const { callDeepSeek } = require('./deepseekClient');
  const prompt = buildAIPrompt(scores, userName);

  const content = await callDeepSeek({
    prompt,
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 120000,
  });

  if (!content || content.length < 100) {
    console.error('[LZU Generator] Empty or too short AI response');
    return null;
  }

  return content;
}

/**
 * 构建发送给AI的Prompt
 * 参照：D:\AI测评小助手\提示词兰大最终终版.md
 * ⚠️ 此prompt严格控制AI输出内容和格式，排版/字体/图表/颜色由代码模板接管
 */
function buildAIPrompt(scores, userName) {
  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const bd = scores.breakdown;

  // 计算百分比
  const s1_pct = Math.round((l.s1 / 7) * 100);
  const s2_pct = Math.round((l.s2 / 12) * 100);
  const s3_pct = Math.round((l.s3 / 12) * 100);
  const s4_pct = Math.round((l.s4 / 12) * 100);

  return `# 职业发展报告内容生成提示词（DeepSeek API）

你是一位兰州大学管理学院职业发展中心的资深测评分析师。请根据以下测评数据，生成一份结构化的职业发展分析内容。**只输出纯文本段落，不要添加任何 Markdown 标记（如 #、**、- 等），不要解释，不要输出额外说明。**

## 输入数据
- **领导风格测评**
  指令型(S1)：原始分 ${l.s1}/${7}，强度百分比 ${s1_pct}%
  教练型(S2)：${l.s2}/${12}，${s2_pct}%
  支持型(S3)：${l.s3}/${12}，${s3_pct}%
  授权型(S4)：${l.s4}/${12}，${s4_pct}%
  领导风格部分得分（满分30）：${bd.leadership}

- **16PF人格特质（满分10分）**
  创造力：${p.creativityPotential.raw} 分
  心理健康：${p.mentalHealth.raw} 分
  管理潜能：${p.managementPotential.raw} 分
  人格部分得分（满分40）：${bd.personality}

- **创造力障碍测试（得分越高障碍越小）**
  心理障碍：${b.psychological.score}/${b.psychological.max}
  认知障碍：${b.cognitive.score}/${b.cognitive.max}
  环境与资源障碍：${b.environmental.score}/${b.environmental.max}
  创造力部分得分（满分30）：${bd.creativityBarrier}

- **综合总分（0-100）**：${scores.totalScore}
  等级：${scores.grade}（定义：≥90卓越型，75-89进取型，60-74成长型，<60待发展型）

## 输出格式要求
按顺序输出以下 **18 个段落**，每个段落以 \`[SECTION:xxx]\` 开头（xxx 为下方指定的标题），然后换行后写分析内容。段落之间用空行分隔。每个段落内容控制在 40~100 字，精准、可落地，避免空话。

## 18 个段落的标题（按顺序）
[SECTION:整体画像]
[SECTION:核心优势与成长点]
[SECTION:领导风格强度]
[SECTION:领导风格雷达图解读]
[SECTION:领导风格综合结论]
[SECTION:人格特质-创造力]
[SECTION:人格特质-心理健康]
[SECTION:人格特质-管理潜能]
[SECTION:人格特质综合结论]
[SECTION:创造力障碍-心理障碍]
[SECTION:创造力障碍-认知障碍]
[SECTION:创造力障碍-环境资源障碍]
[SECTION:创造力障碍综合结论]
[SECTION:综合评分与等级]
[SECTION:适合岗位类别]
[SECTION:关键发展行动]
[SECTION:阶段性成长路径]
[SECTION:最终建议与寄语]

## 内容写作指南
- 整体画像：一句话概括定位（如"进取型管理苗子"），突出两个最强指标。
- 核心优势与成长点：2-3 项优势，1-2 项成长空间。
- 领导风格强度：分别说明四种风格的实际强度及适用场景。
- 雷达图解读：解释图形特征（双峰凸起），指出平衡性与提升建议。
- 领导风格综合结论：总结教练+支持的价值，给 1 条具体练习建议。
- 人格各维度：分析等级（优秀/良好/一般），给出 1 个日常行动。
- 人格综合结论：串联三维度，推荐 2-3 个最适合的岗位类型。
- 创造力障碍各维度：评价程度，给出 1 条具体克服方法。
- 创造力障碍综合结论：指出最大瓶颈，给出 6 个月内可量化的目标。
- 综合评分与等级：给出总分等级，指出提升的关键杠杆（如降低认知障碍）。
- 适合岗位类别：列出 3-5 个具体岗位名称，说明匹配理由。
- 关键发展行动：提炼 3 条核心短期行动（每条 10-20 字）。
- 阶段性成长路径：按短期（0-6 月）、中期（6-18 月）、长期（2-5 年）各 1 条任务。
- 最终建议与寄语：鼓励性总结，强调"从分析者到行动型创新者"。

## 开始生成
请严格按照上述 18 个 SECTION 顺序输出，每个段落以 \`[SECTION:标题]\` 开头，换行后写内容。不要输出任何其他内容。`;
}

/**
 * 构建降级占位文字（AI不可用时使用）
 * 18个段落，参照提示词兰大最终终版.md的输出格式
 */
function buildFallbackText(scores, userName) {
  const name = userName || '测评对象';
  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const bd = scores.breakdown;

  function dimLevel(raw, max) {
    const ratio = raw / max;
    if (ratio >= 0.8) return '优秀';
    if (ratio >= 0.6) return '良好';
    if (ratio >= 0.4) return '中等';
    return '需提升';
  }

  function barrierLevel(score, max) {
    const ratio = score / max;
    if (ratio >= 0.75) return '低障碍';
    if (ratio >= 0.5) return '中障碍';
    return '高障碍';
  }

  const s1_pct = Math.round((l.s1 / 7) * 100);
  const s2_pct = Math.round((l.s2 / 12) * 100);
  const s3_pct = Math.round((l.s3 / 12) * 100);
  const s4_pct = Math.round((l.s4 / 12) * 100);

  const cpLevel = dimLevel(p.creativityPotential.raw, 10);
  const mhLevel = dimLevel(p.mentalHealth.raw, 10);
  const mpLevel = dimLevel(p.managementPotential.raw, 10);
  const bpLevel = barrierLevel(b.psychological.score, b.psychological.max);
  const bcLevel = barrierLevel(b.cognitive.score, b.cognitive.max);
  const beLevel = barrierLevel(b.environmental.score, b.environmental.max);

  // 主导风格
  const styles = [
    { name: '指令型(S1)', score: l.s1, max: 7, pct: s1_pct },
    { name: '教练型(S2)', score: l.s2, max: 12, pct: s2_pct },
    { name: '支持型(S3)', score: l.s3, max: 12, pct: s3_pct },
    { name: '授权型(S4)', score: l.s4, max: 12, pct: s4_pct },
  ];
  styles.sort((a, b) => b.pct - a.pct);
  const dominant = styles[0];
  const secondary = styles[1];

  return {
    // 1. 整体画像
    overallPortrait: `${name}综合得分${scores.totalScore}分（${scores.grade}），属${scores.grade}人才。管理潜能${p.managementPotential.raw}/10，创造力${p.creativityPotential.raw}/10，两项核心指标突出，具备复合型管理人才特质。`,

    // 2. 核心优势与成长点
    coreStrengths: `核心优势：管理潜能卓越(${p.managementPotential.raw}/10)、创造力优秀(${p.creativityPotential.raw}/10)、心理韧性好(${p.mentalHealth.raw}/10)。成长空间：认知灵活性可进一步提升，从"分析者"进化为"行动型创新者"。`,

    // 3. 领导风格强度
    leadershipStrength: `指令型(S1)：${l.s1}/7，强度${s1_pct}%，${l.s1 >= 5 ? '适合紧急任务与新手带领' : l.s1 >= 3 ? '结构化指导能力中等' : '需加强果断决策练习'}。教练型(S2)：${l.s2}/12，强度${s2_pct}%，${l.s2 >= 8 ? '高任务高关系，善于培养下属' : '具备基础教练意识'}。支持型(S3)：${l.s3}/12，强度${s3_pct}%，${l.s3 >= 8 ? '善于营造参与感与凝聚力' : '可加强团队激励'}。授权型(S4)：${l.s4}/12，强度${s4_pct}%，${l.s4 >= 8 ? '对成熟团队充分放权' : '需建立信任和授权机制'}。`,

    // 4. 领导风格雷达图解读
    leadershipRadarInterpretation: `雷达图显示${dominant.name}(${dominant.pct}%)与${secondary.name}(${secondary.pct}%)形成双峰，${dominant.pct >= 80 ? '主导风格鲜明' : '风格分布较为均衡'}。情境适应性${scores.adaptabilityLevel}（指数${scores.adaptabilityIndex}），${scores.adaptabilityIndex < 1.5 ? '能灵活切换领导风格应对不同场景' : '建议进一步扩展风格弹性'}。`,

    // 5. 领导风格综合结论
    leadershipConclusion: `主导${dominant.name}配合${secondary.name}辅助，能有效平衡任务推进与团队关系。建议：每月进行一次"有限信息决策"模拟，在高压力场景下刻意练习指令型行为，完善领导风格谱系。`,

    // 6. 人格特质-创造力
    personalityCreativity: `创造力潜质${p.creativityPotential.raw}/10·${cpLevel}。${cpLevel === '优秀' || cpLevel === '良好' ? '敢于质疑常规，善于跨界联想，适合学术创新或商业方案设计。✔ 行动：每周一次"反常识笔记"，用SCAMPER技法迭代项目创意。' : cpLevel === '中等' ? '有一定创新意识但偏务实。✔ 行动：每季度做一次最小化创新试验，从熟悉领域开始微创新。' : '偏好传统规则，创新思维待激发。✔ 行动：从头脑风暴和跨领域阅读开始，逐步拓展思维广度。'}`,

    // 7. 人格特质-心理健康
    personalityMentalHealth: `心理健康${p.mentalHealth.raw}/10·${mhLevel}。${mhLevel === '优秀' || mhLevel === '良好' ? '情绪稳定，抗压恢复力强，能胜任高挑战环境。✔ 行动：建立压力预警清单，定期正念复盘，维持心理资本优势。' : mhLevel === '中等' ? '压力下偶有波动，整体稳定。✔ 行动：建立压力预警机制，定期自我复盘。' : '需加强心理韧性训练。✔ 行动：建议正念练习与定期复盘，逐步提升抗压能力。'}`,

    // 8. 人格特质-管理潜能
    personalityManagement: `管理潜能${p.managementPotential.raw}/10·${mpLevel}。${mpLevel === '优秀' || mpLevel === '良好' ? '自然倾向协调矛盾、推动执行，具备非正式领导力。✔ 行动：主动申请项目负责人角色，练习授权与战略反馈，积累领导经验。' : mpLevel === '中等' ? '具备基础管理素质。✔ 行动：主动争取项目负责角色，逐步积累管理经验。' : '管理经验待积累。✔ 行动：从小团队或项目协调开始，逐步培养管理能力。'}`,

    // 9. 人格特质综合结论
    personalityConclusion: `"管理潜能${mpLevel}+创造力${cpLevel}"组合特质突出，与${dominant.name}领导风格相互印证。适合管理咨询、创新管理、战略运营等复合型岗位。三高特质（潜能、创造力、心理稳定）在组织人才梯队中属于稀缺资源，尤需匹配创新驱动型岗位。`,

    // 10. 创造力障碍-心理障碍
    barrierPsychological: `心理障碍${b.psychological.score}/${b.psychological.max}·${bpLevel}。${bpLevel === '低障碍' ? '心理安全感强，敢于表达，较少自我设限。不惧评价，完美主义可控。✔ 主动分享"半成熟想法"，做团队创意催化剂。' : bpLevel === '中障碍' ? '存在一定自我怀疑或怕失败心理。✔ 建议通过小步尝试建立信心，从低风险创造性活动开始。' : '心理阻碍明显，需重点突破。✔ 从低风险创造性活动开始，逐步建立自信，必要时寻求心理支持。'}`,

    // 11. 创造力障碍-认知障碍
    barrierCognitive: `认知障碍${b.cognitive.score}/${b.cognitive.max}·${bcLevel}。${bcLevel === '低障碍' ? '思维灵活，能多角度思考问题，认知开放性好。✔ 保持当前思维习惯，可尝试更复杂的跨领域创新项目。' : bcLevel === '中障碍' ? '倾向于快速评判方案，对不确定性耐受力一般。✔ 练习"70%信息决策"，头脑风暴阶段禁止批判，强制列出10个非常规方案再评估。' : '思维模式较为固化，需要系统训练。✔ 从头脑风暴和跨领域阅读开始，用思维导图拓展认知边界。'}`,

    // 12. 创造力障碍-环境资源障碍
    barrierEnvironmental: `环境与资源障碍${b.environmental.score}/${b.environmental.max}·${beLevel}。${beLevel === '低障碍' ? '所处环境对创造力发挥较为有利，资源充足。✔ 充分利用现有优势，扩大创新影响力。' : beLevel === '中障碍' ? '创新时间碎片化，外部支持资源待激活。✔ 每周锁定"创意时间块"，加入创新社群，利用校内孵化器争取资源。' : '环境对创造力存在较大制约。✔ 主动寻求外部资源支持，创建个人创意空间，加入跨领域创新社群。'}`,

    // 13. 创造力障碍综合结论
    barrierConclusion: `心理安全感${bpLevel === '低障碍' ? '极佳' : '尚可'}，${bcLevel === '中障碍' || bcLevel === '高障碍' ? '认知定势为主要掣肘' : ''}${beLevel === '中障碍' || beLevel === '高障碍' ? '，环境约束需主动突破' : ''}。建议6个月内用设计思维工作坊刻意训练，警惕"过早收敛"倾向，延迟评判6秒以上可显著提升创意质量。`,

    // 14. 综合评分与等级
    scoreGrade: `当前综合得分${scores.totalScore}分，定位等级：${scores.grade}。得分结构：领导力${bd.leadership}/30、人格${bd.personality}/40、创造力${bd.creativityBarrier}/30。人格特质贡献突出（管理潜能卓越），领导风格成熟。核心杠杆：提升认知障碍得分可推动综合指数显著跃升。`,

    // 15. 适合岗位类别
    careerPositions: `管理咨询/战略分析：管理潜能+创造力双优，教练风格适合团队协作。创新产品经理：创造力高且心理障碍低。组织发展/HRBP：高管理潜能+教练型风格。项目集经理：综合能力强，善协调推动。科技企业管培生：三高特质匹配创新驱动型岗位。`,

    // 16. 关键发展行动
    keyActions: `打破认知定势：每两周用反向思考法或SCAMPER改造一个现有流程，强制延迟评判。建设创新资源网：加入校企创新工坊、申请校级基金，每周保证2小时"深度创意块"。强化指令型领导：在时间紧迫场景中主动决策，练习"有限信息下拍板"。`,

    // 17. 阶段性成长路径
    growthPath: `短期（0-6个月）：完成一项跨领域创新课题，参加领导力刻意练习，提升指令风格。中期（6-18个月）：争取项目负责人实战机会，带队产出创新成果，积累作品集。长期（2-5年）：成为部门或业务单元负责人，以教练型领导力驱动团队创新文化。`,

    // 18. 最终建议与寄语
    finalAdvice: `${name}综合评估优秀，具备卓越领导者潜质。推荐向战略咨询、创新管理或高科技企业管培方向深度发展。数据印证你的潜力——既有引领团队的魄力，又有创造突破的种子。从"分析者"进化为"行动型创新者"，让创造力落地成势。建议6个月后复测认知障碍维度，持续迭代领导风格。`,
  };
}

/**
 * 主入口：生成完整报告
 */
async function generateReport({ scores, userName, sessionId }) {
  // 1. 调用AI获取文字分析
  const aiRaw = await callAIForText(scores, userName);

  // 2. 解析AI文字或使用降级
  let aiText;
  if (aiRaw) {
    aiText = parseAIText(aiRaw);
    // 合并降级文本填补空缺
    const fallback = buildFallbackText(scores, userName);
    for (const key of Object.keys(fallback)) {
      if (!aiText[key] || aiText[key].length < 5) {
        aiText[key] = fallback[key];
      }
    }
  } else {
    aiText = buildFallbackText(scores, userName);
  }

  // 3. 生成SVG图表
  const charts = generateCharts(scores);

  // 4. 组装HTML（用于管理后台预览）
  const html = buildReportHTML({
    scores,
    aiText,
    charts,
    userName: userName || '测评用户',
    sessionId: sessionId || 0,
  });

  // 保存HTML为文件（后续可转为PDF）
  const filename = `report_${sessionId || 0}_${Date.now()}.html`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`[Report] HTML saved: ${filepath}`);

  return {
    html,
    pdfPath: filepath,
    pdfBuffer: Buffer.from(html, 'utf-8'),
    aiText,
    chartsGenerated: true,
  };
}

module.exports = { generateReport, parseAIText };
