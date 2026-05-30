/**
 * 成就系统定义
 */

import { getUnlockProgress } from './timelineData'

// 成就徽章列表
export const achievements = [
  {
    id: 'first_blood',
    name: '初出茅庐',
    description: '完成首次答题',
    icon: '🎯',
    condition: (stats) => stats.totalAnswered >= 1,
    rarity: 'common'
  },
  {
    id: 'perfect_10',
    name: '十全十美',
    description: '单次答题10题全对',
    icon: '💯',
    condition: (stats) => stats.perfectRounds >= 1,
    rarity: 'rare'
  },
  {
    id: 'combo_master',
    name: '连击达人',
    description: '达成10连击',
    icon: '🔥',
    condition: (stats) => stats.maxCombo >= 10,
    rarity: 'rare'
  },
  {
    id: 'combo_god',
    name: '连击之神',
    description: '达成20连击',
    icon: '⚡',
    condition: (stats) => stats.maxCombo >= 20,
    rarity: 'epic'
  },
  {
    id: 'hundred_questions',
    name: '百题斩',
    description: '累计答对100题',
    icon: '⚔️',
    condition: (stats) => stats.totalCorrect >= 100,
    rarity: 'rare'
  },
  {
    id: 'master_scholar',
    name: '学霸',
    description: '累计答对500题',
    icon: '📚',
    condition: (stats) => stats.totalCorrect >= 500,
    rarity: 'epic'
  },
  {
    id: 'accuracy_king',
    name: '准确率之王',
    description: '单次答题正确率达到100%（至少10题）',
    icon: '👑',
    condition: (stats) => stats.perfectAccuracyRounds >= 1,
    rarity: 'legendary'
  },
  {
    id: 'persistence',
    name: '持之以恒',
    description: '连续打卡7天',
    icon: '📅',
    condition: (stats) => stats.streakDays >= 7,
    rarity: 'rare'
  },
  {
    id: 'collector',
    name: '收藏家',
    description: '收集10个成就',
    icon: '🏆',
    condition: (stats) => stats.achievementsCount >= 10,
    rarity: 'epic'
  },
  {
    id: 'wrong_conqueror',
    name: '错题征服者',
    description: '错题重练答对10题',
    icon: '✅',
    condition: (stats) => stats.wrongPracticeCorrect >= 10,
    rarity: 'rare'
  },
  {
    id: 'speed_demon',
    name: '速度之星',
    description: '10题在2分钟内完成',
    icon: '⚡',
    condition: (stats) => stats.fastRounds >= 1,
    rarity: 'epic'
  },
  {
    id: 'all_chapters',
    name: '通识全才',
    description: '完成所有20个章节的练习',
    icon: '🌍',
    condition: (stats) => stats.completedChapters.length >= 20,
    rarity: 'legendary'
  },
  // 闯关成就
  {
    id: 'level_first_clear',
    name: '初出茅庐',
    description: '首次通关一个关卡',
    icon: '🗡️',
    rarity: 'common',
    condition: (stats) => Object.keys(stats.levelProgress || {}).filter(k => stats.levelProgress[k].completed).length >= 1
  },
  {
    id: 'level_three_stars',
    name: '完美通关',
    description: '获得首个三星评价',
    icon: '⭐',
    rarity: 'rare',
    condition: (stats) => Object.values(stats.levelProgress || {}).some(p => p.stars >= 3)
  },
  {
    id: 'level_five_clear',
    name: '探险家',
    description: '通关5个关卡',
    icon: '🗺️',
    rarity: 'rare',
    condition: (stats) => Object.keys(stats.levelProgress || {}).filter(k => stats.levelProgress[k].completed).length >= 5
  },
  {
    id: 'level_ten_clear',
    name: '历史学者',
    description: '通关10个关卡',
    icon: '📚',
    rarity: 'epic',
    condition: (stats) => Object.keys(stats.levelProgress || {}).filter(k => stats.levelProgress[k].completed).length >= 10
  },
  {
    id: 'streak_3',
    name: '坚持不懈',
    description: '连续打卡3天',
    icon: '🔥',
    rarity: 'common',
    condition: (stats) => (stats.streakDays || 0) >= 3
  },
  {
    id: 'streak_7',
    name: '持之以恒',
    description: '连续打卡7天',
    icon: '💪',
    rarity: 'rare',
    condition: (stats) => (stats.streakDays || 0) >= 7
  },
  {
    id: 'total_100',
    name: '勤学苦练',
    description: '累计答题100题',
    icon: '📝',
    rarity: 'common',
    condition: (stats) => (stats.totalAnswered || 0) >= 100
  },
  {
    id: 'total_500',
    name: '学海无涯',
    description: '累计答题500题',
    icon: '🎓',
    rarity: 'rare',
    condition: (stats) => (stats.totalAnswered || 0) >= 500
  },
  {
    id: 'no_wrong_10',
    name: '十全十美',
    description: '连续答对10题',
    icon: '🏆',
    rarity: 'epic',
    condition: (stats) => (stats.maxCombo || 0) >= 10
  },
  // 时间轴成就
  {
    id: 'timeline_first',
    name: '历史探索者',
    description: '解锁第一个历史事件',
    icon: '📅',
    rarity: 'common',
    condition: (stats) => (stats.timelineUnlocked || 0) >= 1
  },
  {
    id: 'timeline_half',
    name: '历史研究员',
    description: '解锁一半历史事件',
    icon: '📜',
    rarity: 'rare',
    condition: (stats) => (stats.timelineUnlocked || 0) >= 36
  },
  {
    id: 'timeline_master',
    name: '历史通',
    description: '解锁所有历史事件',
    icon: '🏛️',
    rarity: 'epic',
    condition: (stats) => (stats.timelineUnlocked || 0) >= 73
  }
]

// 稀有度配置
export const rarityConfig = {
  common: { color: '#95a5a6', name: '普通', bg: '#ecf0f1' },
  rare: { color: '#3498db', name: '稀有', bg: '#d6eaf8' },
  epic: { color: '#9b59b6', name: '史诗', bg: '#e8daef' },
  legendary: { color: '#f39c12', name: '传说', bg: '#fdebd0' }
}

/**
 * 检查并解锁成就
 * @param {Object} currentAchievements - 当前已解锁成就ID列表
 * @param {Object} stats - 用户统计数据
 * @returns {Array} 新解锁的成就列表
 */
export function checkAchievements(currentAchievements = [], stats = {}) {
  const unlockedIds = new Set(currentAchievements)
  const newlyUnlocked = []

  achievements.forEach(achievement => {
    if (!unlockedIds.has(achievement.id)) {
      if (achievement.condition(stats)) {
        newlyUnlocked.push(achievement)
      }
    }
  })

  return newlyUnlocked
}

/**
 * 获取成就进度
 * @param {String} achievementId - 成就ID
 * @param {Object} stats - 用户统计数据
 * @returns {Object} { current, target, percentage }
 */
export function getAchievementProgress(achievementId, stats = {}) {
  const achievement = achievements.find(a => a.id === achievementId)
  if (!achievement) return null

  // 根据成就类型计算进度
  let current = 0
  let target = 1

  switch (achievementId) {
    case 'first_blood':
      current = Math.min(stats.totalAnswered || 0, 1)
      target = 1
      break
    case 'perfect_10':
      current = stats.perfectRounds || 0
      target = 1
      break
    case 'combo_master':
      current = Math.min(stats.maxCombo || 0, 10)
      target = 10
      break
    case 'combo_god':
      current = Math.min(stats.maxCombo || 0, 20)
      target = 20
      break
    case 'hundred_questions':
      current = Math.min(stats.totalCorrect || 0, 100)
      target = 100
      break
    case 'master_scholar':
      current = Math.min(stats.totalCorrect || 0, 500)
      target = 500
      break
    case 'persistence':
      current = Math.min(stats.streakDays || 0, 7)
      target = 7
      break
    case 'collector':
      current = stats.achievementsCount || 0
      target = 10
      break
    case 'wrong_conqueror':
      current = Math.min(stats.wrongPracticeCorrect || 0, 10)
      target = 10
      break
    case 'all_chapters':
      current = (stats.completedChapters || []).length
      target = 20
      break
    default:
      current = 0
      target = 1
  }

  return {
    current,
    target,
    percentage: Math.min(100, Math.round((current / target) * 100))
  }
}

/**
 * 计算用户统计数据
 * @param {Object} store - Pinia store 实例
 * @returns {Object} 统计数据
 */
export function calculateStats(store) {
  const answers = store.answers || []
  const totalAnswered = answers.length
  const totalCorrect = answers.filter(a => a.isCorrect).length

  // 计算完美回合（单次答题全对）
  // 这里简化处理，实际应该在游戏结束时记录
  const perfectRounds = store.perfectRounds || 0

  // 计算时间轴解锁数量
  const timelineProgress = getUnlockProgress(store.unlockedLevels || [])

  return {
    totalAnswered,
    totalCorrect,
    maxCombo: store.maxCombo || 0,
    perfectRounds,
    achievementsCount: (store.achievements || []).length,
    streakDays: store.streakDays || 0,
    completedChapters: store.completedChapters || [],
    wrongPracticeCorrect: store.wrongPracticeCorrect || 0,
    perfectAccuracyRounds: store.perfectAccuracyRounds || 0,
    fastRounds: store.fastRounds || 0,
    levelProgress: store.levelProgress || {},
    timelineUnlocked: timelineProgress.unlocked
  }
}
