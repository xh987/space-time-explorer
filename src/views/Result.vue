<template>
  <div class="result">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="答题结果"
      left-arrow
      @click-left="goHome"
      fixed
    />

    <div class="result-content">
      <!-- 得分卡片 -->
      <div class="score-card">
        <div class="score-title">本次得分</div>
        <div class="score-value">{{ store.score }}</div>
        <div class="score-detail">
          <span>答对 {{ store.correctCount }} 题</span>
          <span>答错 {{ store.wrongCount }} 题</span>
          <span>正确率 {{ accuracy }}%</span>
        </div>
        <div v-if="store.maxCombo > 1" class="combo-info">
          最高连击: {{ store.maxCombo }}
        </div>
      </div>

      <!-- 经验奖励 -->
      <div class="reward-section">
        <div class="reward-title">获得奖励</div>
        <div class="reward-items">
          <div class="reward-item">
            <van-icon name="star-o" size="24" color="#FFD700" />
            <span class="reward-text">+{{ earnedExp }} 经验</span>
          </div>
          <div class="reward-item">
            <van-icon name="gem-o" size="24" color="#FF9F43" />
            <span class="reward-text">+{{ earnedCoins }} 金币</span>
          </div>
        </div>
      </div>

      <!-- 每题回顾 -->
      <div class="review-section">
        <div class="review-title" @click="showReview = !showReview">
          <span>答题回顾</span>
          <van-icon :name="showReview ? 'arrow-up' : 'arrow-down'" />
        </div>
        <div v-if="showReview" class="review-list">
          <div
            v-for="(record, index) in answerRecords"
            :key="index"
            class="review-item"
            :class="{ 'review-correct': record.isCorrect, 'review-wrong': !record.isCorrect }"
          >
            <div class="review-header">
              <span class="review-index">{{ index + 1 }}</span>
              <span class="review-status">
                <van-icon :name="record.isCorrect ? 'success' : 'cross'" />
                {{ record.isCorrect ? '正确' : '错误' }}
              </span>
            </div>
            <div v-if="record.question" class="review-body">
              <div class="review-question">{{ record.question.content }}</div>
              <div v-if="!record.isCorrect" class="review-answer-info">
                <div class="your-answer">
                  你的答案: {{ formatUserAnswer(record) }}
                </div>
                <div class="correct-answer-text">
                  正确答案: {{ formatCorrectAnswer(record.question) }}
                </div>
              </div>
              <div v-if="record.question.explanation" class="review-explanation">
                {{ record.question.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就解锁 -->
      <div v-if="newAchievements.length > 0" class="achievement-section">
        <div class="achievement-title">🏆 解锁新成就</div>
        <div class="achievement-list">
          <div
            v-for="ach in newAchievements"
            :key="ach.id"
            class="achievement-item"
            :style="{ background: rarityConfig[ach.rarity].bg }"
          >
            <div class="achievement-icon">{{ ach.icon }}</div>
            <div class="achievement-info">
              <div class="achievement-name" :style="{ color: rarityConfig[ach.rarity].color }">
                {{ ach.name }}
              </div>
              <div class="achievement-desc">{{ ach.description }}</div>
            </div>
            <div class="achievement-rarity" :style="{ color: rarityConfig[ach.rarity].color }">
              {{ rarityConfig[ach.rarity].name }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          type="primary"
          block
          round
          color="linear-gradient(to right, #667eea, #764ba2)"
          @click="playAgain"
        >
          再玩一次
        </van-button>
        <van-button
          type="default"
          block
          round
          style="margin-top: 12px;"
          @click="reviewWrong"
          v-if="store.wrongCount > 0"
        >
          错题重练
        </van-button>
        <van-button
          type="default"
          block
          round
          style="margin-top: 12px;"
          @click="goHome"
        >
          返回首页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores'
import { typeNames } from '../utils/questionLoader'
import { checkAchievements, calculateStats, rarityConfig, achievements } from '../utils/achievements'
import { playAchievement } from '../utils/audio'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

// 是否展开回顾
const showReview = ref(true)

// 新解锁的成就
const newAchievements = ref([])

// 答题记录（从store获取）
const answerRecords = computed(() => {
  return store.answers || []
})

// 正确率
const accuracy = computed(() => {
  const total = store.correctCount + store.wrongCount
  if (total === 0) return 0
  return Math.round((store.correctCount / total) * 100)
})

// 计算获得的经验
const earnedExp = computed(() => {
  return 10 + store.correctCount * 10
})

// 计算获得的金币
const earnedCoins = computed(() => {
  return 5 + store.correctCount * 5
})

// 格式化用户答案
const formatUserAnswer = (record) => {
  const q = record.question
  if (!q) return '-'
  if (q.type === 'choice') {
    const labels = ['A', 'B', 'C', 'D']
    const idx = record.userAnswer
    return idx !== null && idx !== undefined ? `${labels[idx]}. ${q.options[idx] || ''}` : '未作答'
  } else if (q.type === 'fill') {
    return record.userAnswer || '未作答'
  } else if (q.type === 'judge') {
    return record.userAnswer === true ? '正确' : record.userAnswer === false ? '错误' : '未作答'
  }
  return '-'
}

// 格式化正确答案
const formatCorrectAnswer = (question) => {
  if (!question) return '-'
  if (question.type === 'choice') {
    const labels = ['A', 'B', 'C', 'D']
    const idx = question.answer
    return idx !== null && idx !== undefined ? `${labels[idx]}. ${question.options[idx] || ''}` : '-'
  } else if (question.type === 'fill') {
    return Array.isArray(question.answer) ? question.answer.join(' / ') : String(question.answer)
  } else if (question.type === 'judge') {
    return question.answer ? '正确' : '错误'
  }
  return '-'
}

onMounted(() => {
  const leveledUp = store.addExp(earnedExp.value)
  store.addCoins(earnedCoins.value)
  if (leveledUp) {
    console.log('升级了！')
  }

  // 更新统计数据
  updateGameStats()

  // 检查成就
  checkNewAchievements()
})

// 更新游戏统计数据
const updateGameStats = () => {
  const total = store.correctCount + store.wrongCount
  const accuracy = total > 0 ? store.correctCount / total : 0

  // 每日挑战打卡
  if (route.query.mode === 'daily' && total >= 10) {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    // 避免重复打卡（同一天只算一次）
    if (store.lastCheckInDate !== today) {
      // 检查是否连续打卡
      if (store.lastCheckInDate === yesterday) {
        store.streakDays = (store.streakDays || 0) + 1
      } else {
        store.streakDays = 1
      }

      store.lastCheckInDate = today

      // 记录打卡日期
      if (!store.checkInDates) {
        store.checkInDates = []
      }
      if (!store.checkInDates.includes(today)) {
        store.checkInDates.push(today)
      }

      // 连续7天额外奖励
      if (store.streakDays >= 7) {
        store.addCoins(100)
      }

      // 立即持久化到 localStorage，防止数据丢失
      try {
        const saved = localStorage.getItem('space-time-explorer')
        const parsed = saved ? JSON.parse(saved) : {}
        parsed.streakDays = store.streakDays
        parsed.lastCheckInDate = store.lastCheckInDate
        parsed.checkInDates = store.checkInDates
        localStorage.setItem('space-time-explorer', JSON.stringify(parsed))
      } catch (e) {
        console.error('保存打卡数据失败:', e)
      }
    }
  }

  // 检查是否完美回合（全对且至少10题）
  if (store.wrongCount === 0 && total >= 10) {
    store.perfectRounds = (store.perfectRounds || 0) + 1
  }

  // 检查是否100%正确率
  if (store.wrongCount === 0 && total >= 10) {
    store.perfectAccuracyRounds = (store.perfectAccuracyRounds || 0) + 1
  }

  // 记录完成的章节
  const chapter = route.query.chapter
  if (chapter && !store.completedChapters.includes(chapter)) {
    store.completedChapters.push(chapter)
  }

  // 错题重练模式统计
  if (route.query.mode === 'wrong') {
    store.wrongPracticeCorrect = (store.wrongPracticeCorrect || 0) + store.correctCount
  }
}

// 检查新成就
const checkNewAchievements = () => {
  const stats = calculateStats(store)
  const unlocked = checkAchievements(store.achievements, stats)

  if (unlocked.length > 0) {
    newAchievements.value = unlocked
    // 保存到store
    unlocked.forEach(ach => {
      if (!store.achievements.includes(ach.id)) {
        store.achievements.push(ach.id)
      }
    })
    // 播放成就解锁音效
    playAchievement()
  }
}

// 再玩一次
const playAgain = () => {
  const currentQuery = { ...route.query }
  store.resetGame()
  router.push({ path: '/game', query: currentQuery })
}

// 错题重练
const reviewWrong = () => {
  store.resetGame()
  router.push({ path: '/game', query: { mode: 'wrong' } })
}

// 返回首页
const goHome = () => {
  store.resetGame()
  router.push('/')
}
</script>

<style scoped>
.result {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 46px;
}

.result-content {
  padding: 20px;
}

.score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.score-title {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.score-value {
  font-size: 64px;
  font-weight: bold;
  margin-bottom: 16px;
}

.score-detail {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 16px;
  opacity: 0.9;
}

.combo-info {
  margin-top: 12px;
  font-size: 16px;
  color: #F9CA24;
}

.reward-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.reward-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.reward-items {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.reward-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 答题回顾 */
.review-section {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.review-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.review-list {
  max-height: 600px;
  overflow-y: auto;
}

.review-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.review-correct .review-index {
  background: #2ecc71;
}

.review-wrong .review-index {
  background: #e74c3c;
}

.review-status {
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.review-correct .review-status {
  color: #2ecc71;
}

.review-wrong .review-status {
  color: #e74c3c;
}

.review-body {
  padding-left: 4px;
}

.review-question {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.5;
}

.review-answer-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.your-answer {
  font-size: 14px;
  color: #e74c3c;
  margin-bottom: 4px;
}

.correct-answer-text {
  font-size: 14px;
  color: #2ecc71;
  font-weight: bold;
}

.review-explanation {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
  padding: 8px 12px;
  background: #f0f3ff;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.action-buttons {
  margin-top: 32px;
}

/* 成就解锁 */
.achievement-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.achievement-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.achievement-icon {
  font-size: 40px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 13px;
  color: #666;
}

.achievement-rarity {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
}
</style>
