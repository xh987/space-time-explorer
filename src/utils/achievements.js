/**
 * 成就系统定义
 */

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
    fastRounds: store.fastRounds || 0
  }
}
