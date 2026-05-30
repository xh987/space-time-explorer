/**
 * 题库加载与筛选工具模块
 */

// 题库缓存，避免重复加载
let questionCache = null

// 获取基础路径（兼容部署在子目录的情况）
function getBasePath() {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : base + '/'
}

/**
 * 从JSON文件加载全部题目
 */
export async function loadAllQuestions() {
  if (questionCache) return questionCache

  try {
    const response = await fetch(`${getBasePath()}data/history-grade7-complete.json`)
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

// 每个章节的关卡名称（根据内容定制）
export const chapterLevelNames = {
  '第1课': ['发现北京人', '山顶洞人探秘', '远古人类大挑战'],
  '第2课': ['河姆渡之旅', '半坡遗址探秘', '农耕文明挑战'],
  '第3课': ['炎黄传说', '尧舜禹故事', '文明起源挑战'],
  '第4课': ['夏朝建立', '商周更替', '王朝兴衰挑战'],
  '第5课': ['春秋五霸', '孔子与老子', '春秋风云挑战'],
  '第6课': ['战国七雄', '商鞅变法', '战国变革挑战'],
  '第7课': ['儒家思想', '道法墨兵', '百家争鸣挑战'],
  '第8课': ['甲骨文探秘', '青铜器文明', '科技文化挑战'],
  '第9课': ['秦始皇统一', '中央集权', '大秦帝国挑战'],
  '第10课': ['陈胜吴广', '楚汉争霸', '秦末风云挑战'],
  '第11课': ['西汉建立', '休养生息', '文景之治挑战'],
  '第12课': ['汉武帝改革', '丝绸之路', '大汉盛世挑战'],
  '第13课': ['光武中兴', '外戚宦官', '东汉兴衰挑战'],
  '第14课': ['张骞通西域', '丝路贸易', '西域经营挑战'],
  '第15课': ['造纸术发明', '医学成就', '秦汉科技挑战'],
  '第16课': ['官渡之战', '赤壁之战', '三国鼎立挑战'],
  '第17课': ['西晋统一', '五胡乱华', '民族迁徙挑战'],
  '第18课': ['东晋建立', '江南开发', '南朝风云挑战'],
  '第19课': ['北魏孝文帝', '民族融合', '北朝政治挑战'],
  '第20课': ['圆周率计算', '书法艺术', '魏晋文化挑战']
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

// ==================== 闯关模式工具函数 ====================

/**
 * 获取章节编号（如 "第1课" → 1）
 */
export function getChapterNumber(chapterTag) {
  const match = chapterTag.match(/第(\d+)课/)
  return match ? parseInt(match[1]) : 0
}

/**
 * 获取关卡ID对应的章节和关卡编号
 * @param {string} levelId - 关卡ID，如 "1-1", "1-2", "2-1"
 * @returns {Object} { chapter: number, level: number }
 */
export function parseLevelId(levelId) {
  const [chapter, level] = levelId.split('-').map(Number)
  return { chapter, level }
}

/**
 * 构建关卡ID
 * @param {number} chapter - 章节号
 * @param {number} level - 关卡号
 * @returns {string} 关卡ID，如 "1-1"
 */
export function buildLevelId(chapter, level) {
  return `${chapter}-${level}`
}

/**
 * 获取章节的关卡配置
 * 每章固定分为3个关卡，均分题目
 * @param {string} chapterTag - 章节标签，如 "第1课"
 * @param {Array} questions - 全部题目
 * @returns {Array} 关卡配置列表 [{ id: '1-1', name: '初探远古', questionCount: 12, isBoss: false }, ...]
 */
export function getChapterLevels(chapterTag, questions) {
  const chapterQuestions = questions.filter(q => 
    q.tags && q.tags.includes(chapterTag)
  )
  
  const chapterNum = getChapterNumber(chapterTag)
  const totalCount = chapterQuestions.length
  
  // 每章固定3关，均分题目
  const questionsPerLevel = Math.ceil(totalCount / 3)
  
  // 获取该章节的自定义关卡名
  const customNames = chapterLevelNames[chapterTag] || ['第一关', '第二关', '第三关']
  
  return [1, 2, 3].map(levelNum => {
    const startIndex = (levelNum - 1) * questionsPerLevel
    const endIndex = Math.min(startIndex + questionsPerLevel, totalCount)
    const count = endIndex - startIndex
    
    return {
      id: buildLevelId(chapterNum, levelNum),
      chapter: chapterTag,
      chapterNum,
      levelNum,
      name: customNames[levelNum - 1] || `第${levelNum}关`,
      questionCount: count,
      isBoss: levelNum === 3, // 第3关是Boss关
      startIndex,
      endIndex
    }
  }).filter(l => l.questionCount > 0) // 过滤掉没有题目的关卡
}

/**
 * 获取关卡对应的题目
 * @param {string} levelId - 关卡ID，如 "1-1"
 * @param {Array} questions - 全部题目
 * @returns {Array} 该关卡的题目列表
 */
export function getLevelQuestions(levelId, questions) {
  const { chapter, level } = parseLevelId(levelId)
  const chapterTag = `第${chapter}课`
  
  const chapterQuestions = questions.filter(q => 
    q.tags && q.tags.includes(chapterTag)
  )
  
  const levelConfig = getChapterLevels(chapterTag, questions)
    .find(l => l.levelNum === level)
  
  if (!levelConfig) return []
  
  return chapterQuestions.slice(levelConfig.startIndex, levelConfig.endIndex)
}

/**
 * 计算关卡星级
 * @param {number} correctCount - 答对题数
 * @param {number} totalCount - 总题数
 * @returns {number} 星级 0-3
 */
export function calculateStars(correctCount, totalCount) {
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0
  if (accuracy >= 0.9) return 3
  if (accuracy >= 0.7) return 2
  if (accuracy >= 0.5) return 1
  return 0
}

/**
 * 获取已解锁章节列表（基于关卡解锁状态）
 * @param {Array} unlockedLevels - 已解锁关卡列表
 * @returns {Array} 已解锁的章节标签列表
 */
export function getUnlockedChapters(unlockedLevels) {
  const chapters = new Set()
  unlockedLevels.forEach(levelId => {
    const { chapter } = parseLevelId(levelId)
    chapters.add(`第${chapter}课`)
  })
  return Array.from(chapters)
}

/**
 * 筛选已解锁章节的题目
 * @param {Array} questions - 全部题目
 * @param {Array} unlockedLevels - 已解锁关卡列表
 * @returns {Array} 已解锁章节的题目
 */
export function filterUnlockedQuestions(questions, unlockedLevels) {
  const unlockedChapters = getUnlockedChapters(unlockedLevels)
  return questions.filter(q => 
    q.tags && q.tags.some(tag => unlockedChapters.includes(tag))
  )
}
