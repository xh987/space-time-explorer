<template>
  <div class="result-page">
    <!-- 庆祝动画层 -->
    <div v-if="showCelebration" class="celebration-layer">
      <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
      <div class="star-burst" v-for="n in 5" :key="n" :class="'star-' + n">⭐</div>
    </div>

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

      <!-- 关卡结算 -->
      <div v-if="route.query.mode === 'level'" class="level-result-section">
        <div class="level-result-title">关卡结算</div>
        <div class="level-result-stars">
          <span v-for="n in 3" :key="n" class="result-star" :class="{ active: levelStars >= n }">&#11088;</span>
        </div>
        <div class="level-result-info">
          <span>关卡: {{ route.query.levelId }}</span>
          <span>正确率: {{ accuracy }}%</span>
        </div>
        <div class="level-result-message">
          {{ levelResultMessage }}
        </div>
      </div>

      <!-- 知识卡片 -->
      <div v-if="route.query.mode === 'level' && knowledgeCard" class="knowledge-card-section">
        <div class="knowledge-card">
          <div class="knowledge-header">
            <span class="knowledge-icon">📜</span>
            <span class="knowledge-title">{{ knowledgeCard.title }}</span>
          </div>
          <div class="knowledge-period">{{ knowledgeCard.period }}</div>
          <div class="knowledge-points">
            <div class="point-title">📌 核心知识点</div>
            <div v-for="(point, index) in knowledgeCard.keyPoints" :key="index" class="point-item">
              <span class="point-num">{{ index + 1 }}.</span>
              <span>{{ point }}</span>
            </div>
          </div>
          <div class="knowledge-summary">
            <div class="summary-title">💡 知识总结</div>
            <p>{{ knowledgeCard.summary }}</p>
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
          {{ route.query.mode === 'level' ? '继续闯关' : '再玩一次' }}
        </van-button>
        <van-button
          v-if="route.query.mode !== 'level' && store.wrongCount > 0"
          type="default"
          block
          round
          style="margin-top: 12px;"
          @click="reviewWrong"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores'
import { typeNames } from '../utils/questionLoader'
import { checkAchievements, calculateStats, rarityConfig, achievements } from '../utils/achievements'
import { playAchievement } from '../utils/audio'
import { getKnowledgeCard } from '../utils/knowledgeCards'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

// 是否展开回顾
const showReview = ref(true)

// 新解锁的成就
const newAchievements = ref([])

// 庆祝动画
const showCelebration = ref(false)
const confettiCanvas = ref(null)
let confettiAnimation = null

// 总题数
const totalCount = computed(() => {
  return store.correctCount + store.wrongCount
})

// 知识卡片
const knowledgeCard = computed(() => {
  if (route.query.mode !== 'level' || !route.query.chapter) return null
  return getKnowledgeCard(route.query.chapter)
})

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

// 关卡星星数
const levelStars = computed(() => {
  if (route.query.mode !== 'level') return 0
  const total = store.correctCount + store.wrongCount
  if (total === 0) return 0
  const acc = store.correctCount / total
  if (acc >= 0.9) return 3
  if (acc >= 0.7) return 2
  if (acc >= 0.5) return 1
  return 0
})

// 关卡结算消息
const levelResultMessage = computed(() => {
  const stars = levelStars.value
  if (stars === 3) return '🎉 完美通关！太厉害了！'
  if (stars === 2) return '👍 表现不错！继续加油！'
  if (stars === 1) return '💪 勉强过关，再练练吧！'
  return '😢 没有通过，再试一次！'
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

  // 三星通关或高分触发庆祝
  if (route.query.mode === 'level') {
    const progress = store.levelProgress[route.query.levelId]
    if (progress && progress.stars === 3) {
      showCelebration.value = true
      startConfetti()
    }
  }
  // 90%以上正确率也庆祝
  const accuracy = totalCount.value > 0 ? Math.round((store.correctCount / totalCount.value) * 100) : 0
  if (accuracy >= 90) {
    showCelebration.value = true
    startConfetti()
  }

  // 播放胜利音效
  if (showCelebration.value) {
    playAchievement()
  }
})

onUnmounted(() => {
  if (confettiAnimation) {
    cancelAnimationFrame(confettiAnimation)
  }
})

// 彩带动画
const startConfetti = () => {
  if (!confettiCanvas.value) return
  const canvas = confettiCanvas.value
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = []
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe']

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => {
      p.y += p.speedY
      p.x += p.speedX
      p.rotation += p.rotationSpeed

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()

      if (p.y > canvas.height) {
        p.y = -20
        p.x = Math.random() * canvas.width
      }
    })

    confettiAnimation = requestAnimationFrame(animate)
  }

  animate()

  // 5秒后停止
  setTimeout(() => {
    if (confettiAnimation) {
      cancelAnimationFrame(confettiAnimation)
      showCelebration.value = false
    }
  }, 5000)
}

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
  if (route.query.mode === 'level') {
    const completedLevelId = route.query.levelId
    store.resetGame()
    router.push({ path: '/chapter-map', query: { highlight: completedLevelId } })
    return
  }
  // 保持原有的 unlockedOnly 参数
  const currentQuery = { ...route.query }
  if (currentQuery.unlockedOnly !== '1' && route.query.mode !== 'wrong') {
    currentQuery.unlockedOnly = '1'
  }
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
.result-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 46px;
  position: relative;
}

.celebration-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.confetti-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.star-burst {
  position: absolute;
  font-size: 40px;
  animation: starBurst 1s ease-out forwards;
}

.star-1 { top: 20%; left: 20%; animation-delay: 0s; }
.star-2 { top: 30%; right: 20%; animation-delay: 0.2s; }
.star-3 { top: 50%; left: 10%; animation-delay: 0.4s; }
.star-4 { top: 60%; right: 15%; animation-delay: 0.6s; }
.star-5 { top: 40%; left: 50%; animation-delay: 0.8s; }

@keyframes starBurst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.5) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

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

/* 关卡结算 */
.level-result-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.level-result-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.level-result-stars {
  font-size: 36px;
  margin-bottom: 12px;
}

.result-star {
  opacity: 0.2;
  display: inline-block;
  transition: all 0.3s ease;
}

.result-star.active {
  opacity: 1;
  transform: scale(1.2);
}

.level-result-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.level-result-message {
  font-size: 16px;
  color: #333;
  font-weight: bold;
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

/* 知识卡片 */
.knowledge-card-section {
  margin-bottom: 16px;
}

.knowledge-card {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #f0d86e;
}

.knowledge-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.knowledge-icon {
  font-size: 24px;
}

.knowledge-title {
  font-size: 18px;
  font-weight: bold;
  color: #856404;
}

.knowledge-period {
  font-size: 13px;
  color: #b8860b;
  margin-bottom: 16px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  display: inline-block;
}

.knowledge-points {
  margin-bottom: 16px;
}

.point-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.point-item {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  padding-left: 4px;
  margin-bottom: 4px;
}

.point-num {
  color: #667eea;
  font-weight: bold;
  margin-right: 4px;
}

.knowledge-summary {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 12px;
}

.summary-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.knowledge-summary p {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  margin: 0;
}
</style>
