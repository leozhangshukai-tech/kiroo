/**
 * 兰大综合报告 — 固定HTML模版
 *
 * ⚠️ 严格约束：此模版的CSS、模块顺序、表格结构、图表样式全部锁定。
 * 仅 {scores}、{aiText}、{charts} 为动态数据。
 * 排版、字体、字号、颜色、间距、圆角均不可变。
 * 参考模版：E:\kiroo\知识库\学生系统\报告模版兰大最终.html
 */

const { nowChinaDate } = require('../utils/timeUtils');

function buildReportHTML({ scores, aiText, charts, userName, sessionId }) {
  const now = new Date();
  const chinaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const reportId = `LZU-${chinaNow.getUTCFullYear()}${String(chinaNow.getUTCMonth() + 1).padStart(2, '0')}${String(chinaNow.getUTCDate()).padStart(2, '0')}-${String(sessionId).padStart(3, '0')}`;
  const reportDate = nowChinaDate();

  const l = scores.leadership;
  const p = scores.personality;
  const b = scores.creativityBarrier;
  const breakdown = scores.breakdown;

  // 百分比计算
  const s1_pct = Math.round((l.s1 / 7) * 100);
  const s2_pct = Math.round((l.s2 / 12) * 100);
  const s3_pct = Math.round((l.s3 / 12) * 100);
  const s4_pct = Math.round((l.s4 / 12) * 100);

  // 障碍程度emoji
  function barrierEmoji(level) {
    return level === '低障碍' ? '✅' : level === '中障碍' ? '⚠️' : '🔴';
  }

  // CSS水平条形图
  const personalityBarHtml = `
    <div class="bar-item"><span class="bar-label">创造力</span><div class="bar-bg"><div class="bar-fill" style="width:${p.creativityPotential.raw * 10}%;">${p.creativityPotential.raw}</div></div></div>
    <div class="bar-item"><span class="bar-label">心理健康</span><div class="bar-bg"><div class="bar-fill" style="width:${p.mentalHealth.raw * 10}%;">${p.mentalHealth.raw}</div></div></div>
    <div class="bar-item"><span class="bar-label">管理潜能</span><div class="bar-bg"><div class="bar-fill" style="width:${p.managementPotential.raw * 10}%;">${p.managementPotential.raw}</div></div></div>`;

  const barrierBarHtml = `
    <div class="bar-item"><span class="bar-label">心理障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round((b.psychological.score / b.psychological.max) * 100)}%; background:#2c5f8a;">${b.psychological.score}/${b.psychological.max}</div></div></div>
    <div class="bar-item"><span class="bar-label">认知障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round((b.cognitive.score / b.cognitive.max) * 100)}%; background:#2c5f8a;">${b.cognitive.score}/${b.cognitive.max}</div></div></div>
    <div class="bar-item"><span class="bar-label">环境与资源障碍</span><div class="bar-bg"><div class="bar-fill" style="width:${Math.round((b.environmental.score / b.environmental.max) * 100)}%; background:#2c5f8a;">${b.environmental.score}/${b.environmental.max}</div></div></div>`;

  // 解析职业标签（从AI文本中提取岗位名称）
  function parseCareerTags(text) {
    if (!text) return '';
    // 尝试按常见分隔符拆分岗位名称
    const items = text.split(/[，,；;。\n]/).filter(s => s.trim());
    return items.map(item => {
      const match = item.match(/^[\s*★☆🎯💡📈⚙️🚀🏆]*([^：:]+)/);
      if (match) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 30) {
          return `<span class="career-tag">${name}</span>`;
        }
      }
      return '';
    }).filter(Boolean).join('\n');
  }

  // 解析行动列表
  function parseActionList(text) {
    if (!text) return '';
    return text.split(/[；;。\n]/).filter(s => s.trim()).map(s =>
      `<li>${s.replace(/^[\s•·\-—🔹📌]+/, '').trim()}</li>`
    ).join('\n');
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
<base href="/">
<title>职业发展测评报告 | 兰大版 · 精准评估与规划</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #eef2f5;
    font-family: 'Segoe UI', 'Roboto', 'Georgia', 'Times New Roman', serif;
    padding: 48px 32px;
    color: #1e2f3e;
  }
  .formal-report {
    max-width: 1280px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    padding: 40px 48px;
    border: 1px solid #e2edf2;
  }
  @media (max-width: 760px) {
    body { padding: 20px 12px; }
    .formal-report { padding: 24px 20px; }
  }
  @media print {
    body { background: white; padding: 0; margin: 0; }
    .formal-report { box-shadow: none; border: 1px solid #ccc; padding: 20px; max-width: 100%; margin: 0; border-radius: 0; }
    .graph-card, .insight-box { break-inside: avoid; page-break-inside: avoid; }
    h2, h3 { break-after: avoid; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    .bar-fill { background-color: #2c5f8a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .legend-color, .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    footer { margin-top: 20px; break-before: avoid; }
  }
  h1 {
    font-size: 1.9rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1e4663;
    border-left: 4px solid #eab308;
    padding-left: 20px;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 2rem 0 1rem 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #e9edf2;
    color: #1e4663;
  }
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 1.4rem 0 0.8rem 0;
    color: #2c5a7a;
  }
  .info-section { margin: 20px 0 20px 0; }
  .info-line { font-size: 0.9rem; margin-bottom: 8px; color: #2c3e50; }
  .badge {
    display: inline-block;
    background: #eef2f8;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    color: #2c5f8a;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2rem 0;
    font-size: 0.85rem;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
  }
  th, td {
    border: 1px solid #e2e8f0;
    padding: 12px 16px;
    vertical-align: top;
    text-align: left;
  }
  th {
    background: #f8fafd;
    font-weight: 600;
    color: #1e3a5f;
  }
  .insight-box {
    background: #f8fafc;
    padding: 14px 18px;
    margin: 16px 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: #2c3e50;
    border-radius: 8px;
  }
  .insight-box p { margin-bottom: 0.6em; }
  .insight-box p:last-child { margin-bottom: 0; }
  .insight-box ul, .insight-box .action-list { margin: 6px 0 4px 20px; padding-left: 0; }
  .insight-box li { margin-bottom: 4px; }
  .card-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: #1e4663;
    border-left: 3px solid #eab308;
    padding-left: 12px;
  }
  .graph-card {
    margin: 20px 0;
    padding: 16px;
    border: 1px solid #e2edf2;
    border-radius: 12px;
    background: #ffffff;
  }
  .graph-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2c5a7a;
    margin-bottom: 12px;
    text-align: center;
  }
  .small-meta {
    font-size: 0.7rem;
    color: #5f6f82;
    margin-top: 8px;
    text-align: center;
  }
  .horizontal-bar-container { margin: 12px 0; }
  .bar-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 0.85rem; }
  .bar-label { width: 160px; font-weight: 500; }
  .bar-bg { flex: 1; background: #e2e8f0; border-radius: 10px; height: 28px; overflow: hidden; margin-left: 10px; }
  .bar-fill {
    background: #2c5f8a;
    height: 100%;
    width: 0%;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
  }
  footer {
    margin-top: 40px;
    padding-top: 20px;
    text-align: center;
    font-size: 0.75rem;
    color: #6b7b8f;
    border-top: 1px solid #e2edf2;
  }
  @media (max-width: 850px) { .bar-label { width: 130px; } }
  .radar-canvas-wrapper { display: flex; justify-content: center; margin: 10px 0; }
  .radar-canvas-wrapper svg { max-width: 400px; width: 100%; height: auto; }
  .gauge-container { display: flex; justify-content: center; margin: 10px 0; }
  .gauge-container svg { max-width: 360px; width: 100%; height: auto; }
  .gauge-caption {
    text-align: center;
    font-weight: 500;
    margin-top: 8px;
    color: #1e4663;
    font-size: 0.85rem;
  }
  .legend-colors {
    display: flex;
    justify-content: center;
    gap: 18px;
    margin-top: 12px;
    flex-wrap: wrap;
    font-size: 0.7rem;
  }
  .legend-item { display: inline-flex; align-items: center; gap: 6px; }
  .legend-color { width: 16px; height: 16px; border-radius: 12px; }
  .career-tag {
    background: #eef2fa;
    border-radius: 40px;
    padding: 6px 16px;
    font-size: 0.85rem;
    display: inline-block;
    margin: 6px 8px 6px 0;
    font-weight: 500;
  }
  .compact-list { margin: 8px 0 0 18px; }
</style>
</head>
<body>
<div class="formal-report">
  <h1>职业发展测评报告：管理类研究生综合评估（兰大版）</h1>
  <div class="info-section">
    <div class="info-line"><span class="badge">报告编号：${reportId}</span> &nbsp;&nbsp;<span class="badge">测评对象：${userName}</span></div>
    <div class="info-line">测评日期：${reportDate}</div>
    <div class="info-line" style="margin-top: 16px; font-weight: 500;">测评工具：领导风格问卷 + 16PF人格测验（创造力/心理健康/管理潜能） + 创造力障碍测试，综合权重：领导风格30% | 16PF人格特质40% | 创造力障碍30%</div>

    <!-- 整体综合结论 -->
    <div class="insight-box" style="margin-top: 20px;">
      <div class="card-title">整体综合结论</div>
      ${aiText.overallPortrait ? `<p><strong>核心画像</strong>：${aiText.overallPortrait}</p>` : ''}
      ${aiText.coreStrengths ? `<p>${aiText.coreStrengths.replace(/\n/g, '<br>')}</p>` : ''}
    </div>
  </div>

  <!-- ========= 二、领导风格分析 ========= -->
  <h2>二、领导风格分析（${breakdown.leadership}/30）</h2>
  <h3>风格强度得分与主导风格</h3>
  <table>
    <thead><tr><th>领导风格类型</th><th>得分</th><th>满分</th><th>强度水平</th><th>行为特征描述</th></tr></thead>
    <tbody>
      <tr><td>指令型 (S1)${l.s1 >= 5 ? ' ⭐' : ''}</td><td>${l.s1}</td><td>7</td><td>${l.s1 >= 5 ? '中等偏高' : l.s1 >= 3 ? '中等偏低' : '偏低'}</td><td>结构化指导，适合紧急任务，当前使用${l.s1 >= 5 ? '充分' : '谨慎'}</td></tr>
      <tr><td>教练型 (S2)${l.dominantStyle.includes('S2') ? ' ⭐ 主导风格' : ''}</td><td>${l.s2}</td><td>12</td><td>${l.s2 >= 8 ? '高' : l.s2 >= 5 ? '中等' : '偏低'}</td><td>高任务+高关系，指导工作与成长并重</td></tr>
      <tr><td>支持型 (S3)${l.dominantStyle.includes('S3') ? ' ⭐ 辅助风格' : ''}</td><td>${l.s3}</td><td>12</td><td>${l.s3 >= 8 ? '较高' : l.s3 >= 5 ? '中等' : '偏低'}</td><td>高关系低任务，营造参与感与凝聚力</td></tr>
      <tr><td>授权型 (S4)</td><td>${l.s4}</td><td>12</td><td>${l.s4 >= 8 ? '中等偏高' : l.s4 >= 5 ? '中等' : '偏低'}</td><td>低任务低关系，对成熟团队可放权</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">领导风格雷达图：相对强度百分比</div>
    <div class="radar-canvas-wrapper">${charts.leadershipRadar || ''}</div>
    <div class="small-meta">教练型(${s2_pct}%)与支持型(${s3_pct}%)${s2_pct >= 70 && s3_pct >= 70 ? '双高，情境适应性良好' : ''}；可适度强化指令型以应对高压场景。</div>
  </div>

  <div class="insight-box">
    <div class="card-title">领导风格综合结论</div>
    ${aiText.leadershipStrength ? `<p>${aiText.leadershipStrength.replace(/\n/g, '</p><p>')}</p>` : ''}
    ${aiText.leadershipRadarInterpretation ? `<p>${aiText.leadershipRadarInterpretation.replace(/\n/g, '</p><p>')}</p>` : ''}
    ${aiText.leadershipConclusion ? `<p>${aiText.leadershipConclusion.replace(/\n/g, '</p><p>')}</p>` : (!aiText.leadershipStrength ? '<p>暂无综合结论</p>' : '')}
  </div>

  <!-- ========= 三、16PF人格测验 ========= -->
  <h2>三、16PF人格测验（${breakdown.personality}/40）</h2>
  <h3>核心维度得分及评价</h3>
  <table>
    <thead><tr><th>16PF核心维度</th><th>得分(满分10)</th><th>标准分(1-10)</th><th>评价等级</th><th>子维度权重</th></tr></thead>
    <tbody>
      <tr><td>创造力</td><td>${p.creativityPotential.raw}</td><td>${p.creativityPotential.standard}</td><td>${p.creativityPotential.level}</td><td>40%</td></tr>
      <tr><td>心理健康</td><td>${p.mentalHealth.raw}</td><td>${p.mentalHealth.standard}</td><td>${p.mentalHealth.level}</td><td>30%</td></tr>
      <tr><td>管理潜能</td><td>${p.managementPotential.raw}</td><td>${p.managementPotential.standard}</td><td>${p.managementPotential.level}</td><td>30%</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">16PF核心维度得分（满分10）</div>
    <div class="horizontal-bar-container">
      ${personalityBarHtml}
    </div>
    <div class="small-meta">管理潜能${p.managementPotential.level}，创造力${p.creativityPotential.level}，心理健康${p.mentalHealth.level} —— 复合型管理人才特质底座</div>
  </div>

  <h3>维度解读与行动指南</h3>
  <div class="insight-box">
    <div class="card-title">创造力 (${p.creativityPotential.raw}/10 · ${p.creativityPotential.level}）</div>
    ${aiText.personalityCreativity ? `<p>${aiText.personalityCreativity.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">心理健康 (${p.mentalHealth.raw}/10 · ${p.mentalHealth.level}）</div>
    ${aiText.personalityMentalHealth ? `<p>${aiText.personalityMentalHealth.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">管理潜能 (${p.managementPotential.raw}/10 · ${p.managementPotential.level}）</div>
    ${aiText.personalityManagement ? `<p>${aiText.personalityManagement.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">16PF综合结论</div>
    ${aiText.personalityConclusion ? `<p>${aiText.personalityConclusion.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无综合结论</p>'}
  </div>

  <!-- ========= 四、创造力障碍测试 ========= -->
  <h2>四、创造力障碍测试（${breakdown.creativityBarrier}/30）</h2>
  <h3>障碍类型得分、程度及抵抗水平</h3>
  <table>
    <thead><tr><th>障碍类型</th><th>得分（越高障碍越少）</th><th>满分</th><th>障碍程度</th><th>创造阻力解读</th></tr></thead>
    <tbody>
      <tr><td>心理障碍</td><td>${b.psychological.score}</td><td>${b.psychological.max}</td><td>${b.psychological.level} ${barrierEmoji(b.psychological.level)}</td><td>${b.psychological.level === '低障碍' ? '心理安全感强，敢于表达，较少自我设限' : b.psychological.level === '中障碍' ? '存在一定自我怀疑或怕失败心理' : '心理阻碍明显，需重点突破'}</td></tr>
      <tr><td>认知障碍</td><td>${b.cognitive.score}</td><td>${b.cognitive.max}</td><td>${b.cognitive.level} ${barrierEmoji(b.cognitive.level)}</td><td>${b.cognitive.level === '低障碍' ? '思维灵活，能多角度思考' : b.cognitive.level === '中障碍' ? '倾向于快速评判，对不确定性耐受力一般' : '思维模式较为固化'}</td></tr>
      <tr><td>环境与资源障碍</td><td>${b.environmental.score}</td><td>${b.environmental.max}</td><td>${b.environmental.level} ${barrierEmoji(b.environmental.level)}</td><td>${b.environmental.level === '低障碍' ? '环境支持有力，资源充足' : b.environmental.level === '中障碍' ? '创新时间碎片化，外部资源待激活' : '环境制约较大，需主动寻求资源'}</td></tr>
    </tbody>
  </table>

  <div class="graph-card">
    <div class="graph-title">创造力障碍横向对比（得分越高障碍越小）</div>
    <div class="horizontal-bar-container">
      ${barrierBarHtml}
    </div>
    <div class="small-meta">${b.primaryBarrierType}是主要制约因素，需优先突破</div>
  </div>

  <h3>维度解读与改善锚点</h3>
  <div class="insight-box">
    <div class="card-title">心理障碍（${b.psychological.level}）</div>
    ${aiText.barrierPsychological ? `<p>${aiText.barrierPsychological.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">认知障碍（${b.cognitive.level}）</div>
    ${aiText.barrierCognitive ? `<p>${aiText.barrierCognitive.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">环境与资源障碍（${b.environmental.level}）</div>
    ${aiText.barrierEnvironmental ? `<p>${aiText.barrierEnvironmental.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无解读</p>'}
  </div>
  <div class="insight-box">
    <div class="card-title">创造力障碍综合结论</div>
    ${aiText.barrierConclusion ? `<p>${aiText.barrierConclusion.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无综合结论</p>'}
  </div>

  <!-- ========= 五、综合评分汇总与等级评定 ========= -->
  <h2>五、综合评分汇总与等级评定</h2>
  <div class="graph-card">
    <div class="graph-title">综合等级仪表盘</div>
    <div class="gauge-container">
      ${charts.scoreGauge || ''}
    </div>
    <div class="gauge-caption">
      🎯 当前综合得分 <strong>${scores.totalScore}分</strong> · 定位等级：<strong style="color:#eab308;">${scores.grade} (${getGradeRangeText(scores.grade)}分)</strong>
    </div>
    <div class="legend-colors">
      <span class="legend-item"><span class="legend-color" style="background:#9ca3af;"></span> 待发展型 (0-59)</span>
      <span class="legend-item"><span class="legend-color" style="background:#60a5fa;"></span> 成长型 (60-74)</span>
      <span class="legend-item"><span class="legend-color" style="background:#eab308;"></span> 进取型 (75-89)</span>
      <span class="legend-item"><span class="legend-color" style="background:#10b981;"></span> 卓越型 (90-100)</span>
    </div>
    <div class="small-meta">指针指向${scores.totalScore}，处于${scores.grade}${scores.totalScore >= 75 && scores.totalScore < 90 ? '，距卓越型仅差' + (90 - scores.totalScore) + '分' : ''}，核心杠杆为降低认知障碍。</div>
  </div>

  <div class="insight-box">
    ${aiText.scoreGrade ? `<p>${aiText.scoreGrade.replace(/\n/g, '</p><p>')}</p>` : `<p>综合得分${scores.totalScore}分，等级"${scores.grade}"。${scores.gradeDescription}</p>`}
  </div>

  <!-- ========= 六、职业发展建议与方向定位 ========= -->
  <h2>六、职业发展建议与方向定位</h2>
  <div class="insight-box">
    <div class="card-title">适合岗位类别（匹配度高）</div>
    <div style="margin: 8px 0;">
      ${parseCareerTags(aiText.careerPositions) || '<span class="career-tag">管理咨询/战略分析</span><span class="career-tag">创新产品经理</span><span class="career-tag">组织发展/HRBP</span>'}
    </div>
    ${aiText.careerPositions ? `<p>${aiText.careerPositions.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无职业建议</p>'}
  </div>

  <div class="insight-box">
    <div class="card-title">关键发展行动（3项核心）</div>
    ${aiText.keyActions ? `<ul class="compact-list">${parseActionList(aiText.keyActions)}</ul>` : '<p>暂无行动建议</p>'}
  </div>

  <div class="insight-box">
    <div class="card-title">阶段性成长路径</div>
    ${aiText.growthPath ? `<ul class="compact-list">${parseActionList(aiText.growthPath)}</ul>` : '<p>暂无成长路径</p>'}
  </div>

  <div class="insight-box">
    <div class="card-title">最终建议</div>
    ${aiText.finalAdvice ? `<p>${aiText.finalAdvice.replace(/\n/g, '</p><p>')}</p>` : '<p>暂无最终建议</p>'}
    <p><strong>一句话寄语</strong>：数据印证你的潜力 —— 既有引领团队的魄力，又有创造突破的种子。从"分析者"进化为"行动型创新者"，让创造力落地成势。</p>
  </div>

  <footer>
    本报告依据兰州大学管理学院职业发展测评系统生成（领导风格问卷 + 16PF人格测验 + 创造力障碍测试），结果用于职业规划参考。综合发展建议以能力提升与方向聚焦为主。<br>
    * 打印或生成PDF时，请确保浏览器打印设置勾选"背景图形"，以保证图表颜色完整呈现。
  </footer>
</div>

</body>
</html>`;
}

// ======================= 辅助函数 =======================

function getGradeRangeText(grade) {
  switch (grade) {
    case '卓越型': return '90-100';
    case '进取型': return '75-89';
    case '成长型': return '60-74';
    default: return '60以下';
  }
}

module.exports = { buildReportHTML };
