/**
 * 题库加载与筛选工具模块
 */

// 题库缓存，避免重复加载
let questionCache = null

/**
 * 从JSON文件加载全部题目
 */
export async function loadAllQuestions() {
  if (questionCache) return questionCache

  try {
    const response = await fetch('/data/history-grade7-complete.json')
    if (!response.ok) throw new Error('题库加载失败')
    questionCache = await response.json()
    return questionCache
  } catch (error) {
    console.error('加载题库失败:', error)
    return []
  }
}

/**
 * 根据条件筛选题目
 * @param {Array} questions - 全部题目
 * @param {Object} options - 筛选条件
 * @param {string} options.chapter - 章节标签，如 "第1课"
 * @param {number} options.difficulty - 难度 1/2/3
 * @param {string} options.type - 题型 choice/fill/judge
 * @param {number} options.count - 需要的题目数量
 * @param {boolean} options.shuffle - 是否打乱顺序
 * @returns {Array} 筛选后的题目
 */
export function filterQuestions(questions, options = {}) {
  let filtered = [...questions]

  // 按章节筛选
  if (options.chapter) {
    filtered = filtered.filter(q =>
      q.tags && q.tags.includes(options.chapter)
    )
  }

  // 按难度筛选
  if (options.difficulty) {
    filtered = filtered.filter(q => q.difficulty === options.difficulty)
  }

  // 按题型筛选
  if (options.type) {
    filtered = filtered.filter(q => q.type === options.type)
  }

  // 打乱顺序
  if (options.shuffle !== false) {
    filtered = shuffleArray(filtered)
  }

  // 限制数量
  if (options.count && options.count > 0) {
    filtered = filtered.slice(0, options.count)
  }

  return filtered
}

/**
 * 获取所有章节列表
 * @param {Array} questions - 全部题目
 * @returns {Array} 章节信息列表
 */
export function getChapterList(questions) {
  const chapterMap = new Map()

  questions.forEach(q => {
    if (!q.tags) return
    const chapterTag = q.tags.find(t => t.startsWith('第') && t.includes('课'))
    if (chapterTag && !chapterMap.has(chapterTag)) {
      chapterMap.set(chapterTag, {
        tag: chapterTag,
        count: 0
      })
    }
    if (chapterTag) {
      chapterMap.get(chapterTag).count++
    }
  })

  return Array.from(chapterMap.values())
}

/**
 * 获取章节名称映射
 */
export const chapterNames = {
  '第1课': '远古时期的人类活动',
  '第2课': '原始农业与史前社会',
  '第3课': '中华文明的起源',
  '第4课': '夏商西周王朝的更替',
  '第5课': '动荡变化中的春秋时期',
  '第6课': '战国时期的社会变革',
  '第7课': '百家争鸣',
  '第8课': '夏商周时期的科技与文化',
  '第9课': '秦统一中国',
  '第10课': '秦末农民大起义',
  '第11课': '西汉建立和文景之治',
  '第12课': '大一统王朝的巩固',
  '第13课': '东汉的兴衰',
  '第14课': '丝绸之路的开通与经营西域',
  '第15课': '秦汉时期的科技与文化',
  '第16课': '三国鼎立',
  '第17课': '西晋的短暂统一和北方各族的内迁',
  '第18课': '东晋南朝政治和江南地区开发',
  '第19课': '北朝政治和北方民族大交融',
  '第20课': '三国两晋南北朝时期的科技与文化'
}

/**
 * 单元分组
 */
export const unitGroups = [
  {
    name: '第一单元 史前时期',
    chapters: ['第1课', '第2课', '第3课']
  },
  {
    name: '第二单元 夏商周时期',
    chapters: ['第4课', '第5课', '第6课', '第7课', '第8课']
  },
  {
    name: '第三单元 秦汉时期',
    chapters: ['第9课', '第10课', '第11课', '第12课', '第13课', '第14课', '第15课']
  },
  {
    name: '第四单元 三国两晋南北朝时期',
    chapters: ['第16课', '第17课', '第18课', '第19课', '第20课']
  }
]

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 题型中文名映射
 */
export const typeNames = {
  choice: '选择题',
  fill: '填空题',
  judge: '判断题'
}

/**
 * 难度中文名映射
 */
export const difficultyNames = {
  1: '简单',
  2: '中等',
  3: '困难'
}
