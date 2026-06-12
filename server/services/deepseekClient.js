/**
 * DeepSeek API 调用工具 — 带重试 + 指数退避
 * 防止 429 限流和临时网络错误导致报告生成失败
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 调用 DeepSeek Chat API，带自动重试
 * @param {object} opts
 * @param {string} opts.prompt - 用户提示词
 * @param {number} [opts.maxTokens=4096] - 最大输出token
 * @param {number} [opts.temperature=0.7] - 温度
 * @param {boolean} [opts.jsonMode=false] - 是否启用 JSON mode
 * @param {number} [opts.timeoutMs=120000] - 超时（毫秒）
 * @returns {Promise<string|null>} AI 返回的文本内容，失败返回 null
 */
async function callDeepSeek(opts) {
  const {
    prompt,
    maxTokens = 4096,
    temperature = 0.7,
    jsonMode = false,
    timeoutMs = 120000,
  } = opts;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 30) {
    console.warn('[DeepSeek] API key not configured');
    return null;
  }

  const body = {
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);

      // 429 限流→ 退避重试
      if (response.status === 429) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[DeepSeek] 429 rate limited, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        if (attempt < MAX_RETRIES) {
          await sleep(delay);
          continue;
        }
        return null;
      }

      // 5xx 服务端错误→ 退避重试
      if (response.status >= 500) {
        console.warn(`[DeepSeek] ${response.status} server error, attempt ${attempt}/${MAX_RETRIES}`);
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * attempt);
          continue;
        }
        return null;
      }

      if (!response.ok) {
        console.error(`[DeepSeek] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      if (!content || content.length < 50) {
        console.error('[DeepSeek] Empty or too short response');
        return null;
      }

      console.log(`[DeepSeek] Success (attempt ${attempt}, ${content.length} chars)`);
      return content;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[DeepSeek] Request timeout');
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS);
          continue;
        }
        return null;
      }
      console.error(`[DeepSeek] Network error (attempt ${attempt}): ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * attempt);
      }
    }
  }

  return null;
}

module.exports = { callDeepSeek };
