/**
 * 智能学习分析系统
 * 分析用户答题数据，提供个性化推荐
 */

import { chapterNames, unitGroups } from './questionLoader'

/**
 * 分析薄弱章节
 * @param {Array} answers - 答题记录
 * @returns {Array} 薄弱章节列表（按错误率排序）
 */
export function analyzeWeakChapters(answers = []) {
  if (answers.length === 0) return []

  // 按章节统计
  const chapterStats = {}

  answers.forEach(record => {
    if (!record.question) return

    // 获取章节标签
    const chapterTag = record.question.tags?.find(t => t.startsWith('第') && t.includes('课'))
    if (!chapterTag) return

    if (!chapterStats[chapterTag]) {
      chapterStats[chapterTag] = {
        tag: chapterTag,
        total: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0
      }
    }

    chapterStats[chapterTag].total++
    if (record.isCorrect) {
      chapterStats[chapterTag].correct++
    } else {
      chapterStats[chapterTag].wrong++
    }
  })

  // 计算正确率并筛选（至少答过3题才统计）
  const result = Object.values(chapterStats)
    .filter(stat => stat.total >= 3)
    .map(stat => ({
      ...stat,
      accuracy: Math.round((stat.correct / stat.total) * 100),
      name: chapterNames[stat.tag] || stat.tag
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // 按正确率升序（低的在前）

  return result
}

/**
 * 分析薄弱知识点
 * @param {Array} wrongQuestions - 错题本
 * @returns {Array} 薄弱知识点列表
 */
export function analyzeWeakPoints(wrongQuestions = []) {
  if (wrongQuestions.length === 0) return []

  // 按知识点标签统计（非章节标签）
  const pointStats = {}

  wrongQuestions.forEach(q => {
    if (!q.tags) return

    q.tags.forEach(tag => {
      // 跳过章节标签
      if (tag.startsWith('第') && tag.includes('课')) return

      if (!pointStats[tag]) {
        pointStats[tag] = { tag, count: 0 }
      }
      pointStats[tag].count++
    })
  })

  return Object.values(pointStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // 取前5个薄弱点
}

/**
 * 生成个性化推荐
 * @param {Object} store - Pinia store
 * @returns {Object} 推荐内容
 */
export function generateRecommendations(store) {
  const answers = store.answers || []
  const wrongQuestions = store.wrongQuestions || []

  const recommendations = {
    // 薄弱章节推荐
    weakChapters: analyzeWeakChapters(answers).slice(0, 3),

    // 薄弱知识点
    weakPoints: analyzeWeakPoints(wrongQuestions),

    // 推荐练习模式
    suggestedMode: null,

    // 推荐章节
    suggestedChapters: [],

    // 学习建议
    advice: ''
  }

  // 决定推荐模式
  if (wrongQuestions.length >= 5) {
    recommendations.suggestedMode = 'wrong'
    recommendations.advice = '你有较多错题等待复习，建议先进行错题重练'
  } else if (recommendations.weakChapters.length > 0) {
    recommendations.suggestedMode = 'chapter'
    recommendations.suggestedChapters = recommendations.weakChapters.map(c => c.tag)
    const weakName = recommendations.weakChapters[0].name
    recommendations.advice = `你在「${weakName}」章节正确率较低，建议针对性练习`
  } else if (answers.length < 10) {
    recommendations.suggestedMode = 'random'
    recommendations.advice = '刚开始学习，建议随机练习熟悉题型'
  } else {
    recommendations.suggestedMode = 'daily'
    recommendations.advice = '表现不错！坚持每日挑战保持状态'
  }

  return recommendations
}

/**
 * 计算学习进度
 * @param {Array} answers - 答题记录
 * @returns {Object} 各单元进度
 */
export function calculateProgress(answers = []) {
  const progress = {}

  unitGroups.forEach(unit => {
    const unitAnswers = answers.filter(a => {
      if (!a.question?.tags) return false
      return a.question.tags.some(tag => unit.chapters.includes(tag))
    })

    const total = unitAnswers.length
    const correct = unitAnswers.filter(a => a.isCorrect).length

    progress[unit.name] = {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      chapters: unit.chapters.map(ch => {
        const chAnswers = answers.filter(a =>
          a.question?.tags?.includes(ch)
        )
        return {
          tag: ch,
          name: chapterNames[ch],
          total: chAnswers.length,
          correct: chAnswers.filter(a => a.isCorrect).length
        }
      })
    }
  })

  return progress
}

/**
 * 生成学习报告数据
 * @param {Object} store - Pinia store
 * @param {string} period - 'week' | 'month'
 * @returns {Object} 报告数据
 */
export function generateReport(store, period = 'week') {
  const answers = store.answers || []

  // 时间范围
  const now = Date.now()
  const days = period === 'week' ? 7 : 30
  const startTime = now - days * 24 * 60 * 60 * 1000

  // 筛选时间段内的记录
  const periodAnswers = answers.filter(a => a.timestamp >= startTime)

  // 按天统计
  const dailyStats = {}
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    dailyStats[dateKey] = { date: dateKey, count: 0, correct: 0 }
  }

  periodAnswers.forEach(a => {
    const date = new Date(a.timestamp)
    const dateKey = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    if (dailyStats[dateKey]) {
      dailyStats[dateKey].count++
      if (a.isCorrect) dailyStats[dateKey].correct++
    }
  })

  const total = periodAnswers.length
  const correct = periodAnswers.filter(a => a.isCorrect).length

  return {
    period,
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    dailyData: Object.values(dailyStats).reverse(),
    weakChapters: analyzeWeakChapters(periodAnswers).slice(0, 5),
    streakDays: store.streakDays || 0,
    achievements: store.achievements?.length || 0
  }
}

/**
 * 自适应难度推荐
 * @param {Array} recentAnswers - 最近答题记录
 * @returns {number} 推荐难度 1/2/3
 */
export function recommendDifficulty(recentAnswers = []) {
  if (recentAnswers.length < 5) return 1 // 默认简单

  // 取最近10题
  const recent = recentAnswers.slice(-10)
  const correct = recent.filter(a => a.isCorrect).length
  const accuracy = correct / recent.length

  if (accuracy >= 0.9) return 3 // 困难
  if (accuracy >= 0.7) return 2 // 中等
  return 1 // 简单
}

/**
 * 知识点掌握度分析
 * @param {Array} answers - 答题记录
 * @returns {Object} 各知识点掌握度
 */
export function analyzeKnowledgeMastery(answers = []) {
  const mastery = {
    excellent: [], // >=90%
    good: [],      // 70-89%
    average: [],   // 50-69%
    weak: []       // <50%
  }

  const chapterStats = {}

  answers.forEach(record => {
    if (!record.question) return
    const chapterTag = record.question.tags?.find(t => t.startsWith('第') && t.includes('课'))
    if (!chapterTag) return

    if (!chapterStats[chapterTag]) {
      chapterStats[chapterTag] = { tag: chapterTag, total: 0, correct: 0 }
    }
    chapterStats[chapterTag].total++
    if (record.isCorrect) chapterStats[chapterTag].correct++
  })

  Object.values(chapterStats).forEach(stat => {
    if (stat.total < 3) return // 至少3题才统计

    const accuracy = (stat.correct / stat.total) * 100
    const item = {
      tag: stat.tag,
      name: chapterNames[stat.tag],
      accuracy: Math.round(accuracy),
      total: stat.total
    }

    if (accuracy >= 90) mastery.excellent.push(item)
    else if (accuracy >= 70) mastery.good.push(item)
    else if (accuracy >= 50) mastery.average.push(item)
    else mastery.weak.push(item)
  })

  return mastery
}
