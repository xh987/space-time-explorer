import { createPinia } from 'pinia'
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 用户信息
    user: {
      nickname: '时空探险家',
      level: 1,
      exp: 0,
      coins: 0
    },
    // 游戏状态
    currentChapter: null,
    currentLevel: null,
    currentDifficulty: 1, // 当前难度 1/2/3
    // 答题状态
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    combo: 0,
    maxCombo: 0,
    // 答题记录
    answers: [],
    // 错题本
    wrongQuestions: [],
    // 成就系统
    achievements: [], // 已解锁成就ID列表
    perfectRounds: 0, // 完美回合数
    completedChapters: [], // 已完成章节
    streakDays: 0, // 连续打卡天数
    lastCheckInDate: null, // 上次打卡日期
    checkInDates: [], // 所有打卡日期记录（用于日历展示）
    wrongPracticeCorrect: 0, // 错题重练答对数
    perfectAccuracyRounds: 0, // 100%正确率回合
    fastRounds: 0, // 快速完成回合
    // 闯关模式数据
    unlockedLevels: ['1-1'], // 已解锁关卡列表，格式：章节-关卡，如 '1-1', '1-2', '2-1'
    levelProgress: {}, // 关卡进度 { '1-1': { stars: 3, completed: true, bestScore: 120, currentIndex: 0 } }
    currentLevelId: null, // 当前进行的关卡ID
    // 答题历史记录（最近500题）
    answerHistory: [],
    // 题目统计 { questionId: { count: 0, correct: 0, lastAnswered: timestamp } }
    questionStats: {}
  }),

  getters: {
    currentQuestion: (state) => {
      return state.questions[state.currentQuestionIndex] || null
    },
    progress: (state) => {
      if (state.questions.length === 0) return 0
      return Math.round((state.currentQuestionIndex / state.questions.length) * 100)
    }
  },

  actions: {
    // 开始游戏
    startGame(questions, difficulty = null) {
      this.questions = questions
      this.currentQuestionIndex = 0
      this.score = 0
      this.correctCount = 0
      this.wrongCount = 0
      this.combo = 0
      this.answers = []
      if (difficulty !== null) {
        this.currentDifficulty = difficulty
      }
    },

    // 更新自适应难度
    updateAdaptiveDifficulty() {
      // 取最近10题计算正确率
      const recent = this.answers.slice(-10)
      if (recent.length < 5) return this.currentDifficulty

      const correct = recent.filter(a => a.isCorrect).length
      const accuracy = correct / recent.length

      let newDifficulty = 1
      if (accuracy >= 0.9) newDifficulty = 3
      else if (accuracy >= 0.7) newDifficulty = 2

      this.currentDifficulty = newDifficulty
      return newDifficulty
    },

    // 回答题目 - 不要自动递增索引
    answerQuestion(isCorrect, timeSpent, question, userAnswer) {
      if (isCorrect) {
        this.correctCount++
        this.combo++
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo
        }
        const comboBonus = Math.min(this.combo * 2, 20)
        this.score += 10 + comboBonus
      } else {
        this.wrongCount++
        this.combo = 0
        // 加入错题本
        if (question && !this.wrongQuestions.find(q => q.id === question.id)) {
          this.wrongQuestions.push({
            ...question,
            wrongCount: 1,
            lastWrongTime: Date.now()
          })
        }
      }

      // 保存完整答题记录
      this.answers.push({
        question: question ? { ...question } : null,
        questionId: question ? question.id : null,
        userAnswer: userAnswer || null,
        isCorrect,
        timeSpent,
        timestamp: Date.now()
      })

      // 添加到答题历史
      const historyEntry = {
        id: Date.now() + Math.random(),
        questionId: question.id,
        questionContent: question.content,
        chapter: question.tags?.[0] || 'unknown',
        isCorrect,
        userAnswer,
        correctAnswer: question.answer,
        timeSpent,
        timestamp: Date.now()
      }

      this.answerHistory.unshift(historyEntry)
      // 只保留最近500条
      if (this.answerHistory.length > 500) {
        this.answerHistory = this.answerHistory.slice(0, 500)
      }

      // 更新题目统计
      if (!this.questionStats[question.id]) {
        this.questionStats[question.id] = {
          count: 0,
          correct: 0,
          lastAnswered: null
        }
      }
      this.questionStats[question.id].count++
      if (isCorrect) {
        this.questionStats[question.id].correct++
      }
      this.questionStats[question.id].lastAnswered = Date.now()

      // 不要自动递增 currentQuestionIndex
    },

    // 重置游戏
    resetGame() {
      this.currentQuestionIndex = 0
      this.questions = []
      this.score = 0
      this.correctCount = 0
      this.wrongCount = 0
      this.combo = 0
      this.answers = []
    },

    // 添加经验值
    addExp(amount) {
      this.user.exp += amount
      // 简单升级逻辑：每100经验升一级
      const newLevel = Math.floor(this.user.exp / 100) + 1
      if (newLevel > this.user.level) {
        this.user.level = newLevel
        return true // 返回true表示升级了
      }
      return false
    },

    // 添加金币
    addCoins(amount) {
      this.user.coins += amount
    },

    // 闯关模式：解锁关卡
    unlockLevel(levelId) {
      if (!this.unlockedLevels.includes(levelId)) {
        this.unlockedLevels.push(levelId)
      }
    },

    // 闯关模式：更新关卡进度
    updateLevelProgress(levelId, progress) {
      const existing = this.levelProgress[levelId] || {}
      this.levelProgress[levelId] = {
        ...existing,
        ...progress,
        lastPlayed: Date.now()
      }
    },

    // 闯关模式：完成关卡
    completeLevel(levelId, stars, score) {
      const existing = this.levelProgress[levelId] || {}
      const newStars = Math.max(existing.stars || 0, stars)
      const newBestScore = Math.max(existing.bestScore || 0, score)
      
      this.levelProgress[levelId] = {
        ...existing,
        stars: newStars,
        completed: true,
        bestScore: newBestScore,
        completedAt: Date.now()
      }
      
      // 自动解锁下一关
      const [chapter, level] = levelId.split('-').map(Number)
      
      // 同一章的下一关
      if (level < 3) {
        this.unlockLevel(`${chapter}-${level + 1}`)
      } else {
        // 下一章的第一关
        this.unlockLevel(`${chapter + 1}-1`)
      }
    },

    // 闯关模式：开始关卡
    startLevel(levelId, questions) {
      this.currentLevelId = levelId
      const progress = this.levelProgress[levelId]
      const startIndex = progress?.currentIndex || 0
      
      this.questions = questions
      this.currentQuestionIndex = startIndex
      this.score = 0
      this.correctCount = 0
      this.wrongCount = 0
      this.combo = 0
      this.answers = []
    },

    // 闯关模式：保存当前进度
    saveLevelProgress() {
      if (this.currentLevelId) {
        this.updateLevelProgress(this.currentLevelId, {
          currentIndex: this.currentQuestionIndex
        })
      }
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'space-time-explorer',
        storage: localStorage,
        paths: ['user', 'wrongQuestions', 'achievements', 'maxCombo', 'perfectRounds', 'completedChapters', 'streakDays', 'lastCheckInDate', 'checkInDates', 'wrongPracticeCorrect', 'perfectAccuracyRounds', 'fastRounds', 'unlockedLevels', 'levelProgress', 'answerHistory', 'questionStats']
      }
    ]
  }
})

// Pinia插件：持久化存储
function piniaPersistPlugin({ store }) {
  const savedState = localStorage.getItem('space-time-explorer')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      store.$patch(parsed)
    } catch (e) {
      console.error('Failed to load saved state:', e)
    }
  }

  store.$subscribe((mutation, state) => {
    const toSave = {
      user: state.user,
      wrongQuestions: state.wrongQuestions,
      achievements: state.achievements,
      maxCombo: state.maxCombo,
      perfectRounds: state.perfectRounds,
      completedChapters: state.completedChapters,
      streakDays: state.streakDays,
      lastCheckInDate: state.lastCheckInDate,
      checkInDates: state.checkInDates,
      wrongPracticeCorrect: state.wrongPracticeCorrect,
      perfectAccuracyRounds: state.perfectAccuracyRounds,
      fastRounds: state.fastRounds,
      unlockedLevels: state.unlockedLevels,
      levelProgress: state.levelProgress,
      answerHistory: state.answerHistory,
      questionStats: state.questionStats
    }
    localStorage.setItem('space-time-explorer', JSON.stringify(toSave))
  })
}

export function createStore() {
  const pinia = createPinia()
  pinia.use(piniaPersistPlugin)
  return pinia
}
