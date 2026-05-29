<template>
  <div class="home">
    <!-- 顶部用户信息 -->
    <div class="user-header">
      <div class="avatar">
        <van-icon name="user-circle-o" size="40" color="#FF9F43" />
      </div>
      <div class="user-info">
        <div class="nickname">{{ store.user.nickname }}</div>
        <div class="level">Lv.{{ store.user.level }} 时空学徒</div>
      </div>
      <div class="resources">
        <div class="resource-item">
          <van-icon name="gem-o" color="#FFD700" />
          <span>{{ store.user.coins }}</span>
        </div>
      </div>
    </div>

    <!-- 经验条 -->
    <div class="exp-bar">
      <div class="exp-progress" :style="{ width: expPercent + '%' }"></div>
      <span class="exp-text">EXP: {{ store.user.exp % 100 }}/100</span>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 游戏标题 -->
      <div class="game-title">
        <h1>时空探险家</h1>
        <p>在探险中学习历史与地理</p>
      </div>

      <!-- 每日挑战 -->
      <div class="daily-challenge" v-if="!hasCheckedInToday">
        <div class="challenge-header">
          <div class="challenge-icon">📅</div>
          <div class="challenge-info">
            <div class="challenge-title">每日挑战</div>
            <div class="challenge-desc">完成10题打卡，已连续 {{ store.streakDays }} 天</div>
          </div>
          <van-button type="primary" size="small" round @click="startDailyChallenge">
            开始挑战
          </van-button>
        </div>
        <div class="challenge-progress">
          <div class="streak-days">
            <span v-for="n in 7" :key="n" class="day-dot" :class="{ active: isDayCheckedIn(n) }">
              {{ n }}
            </span>
          </div>
          <div class="streak-reward">连续7天额外奖励100金币！</div>
        </div>
      </div>

      <div class="daily-challenge completed" v-else>
        <div class="challenge-header">
          <div class="challenge-icon">✅</div>
          <div class="challenge-info">
            <div class="challenge-title">今日已完成</div>
            <div class="challenge-desc">已连续打卡 {{ store.streakDays }} 天</div>
          </div>
          <van-button type="default" size="small" round disabled>
            已完成
          </van-button>
        </div>
        <div class="challenge-progress">
          <div class="streak-days">
            <span v-for="n in 7" :key="n" class="day-dot" :class="{ active: isDayCheckedIn(n) }">
              {{ n }}
            </span>
          </div>
          <div class="streak-reward">连续7天额外奖励100金币！</div>
        </div>
      </div>

      <!-- 智能推荐 -->
      <div class="smart-recommend" v-if="recommendations.advice">
        <div class="recommend-header">
          <div class="recommend-icon">🤖</div>
          <div class="recommend-info">
            <div class="recommend-title">智能推荐</div>
            <div class="recommend-advice">{{ recommendations.advice }}</div>
          </div>
        </div>
        <div class="recommend-actions">
          <van-button
            v-if="recommendations.suggestedMode === 'wrong'"
            type="primary"
            block
            round
            @click="startWrongMode"
          >
            开始错题重练
          </van-button>
          <van-button
            v-else-if="recommendations.suggestedMode === 'chapter' && recommendations.suggestedChapters.length > 0"
            type="primary"
            block
            round
            @click="startChapter(recommendations.suggestedChapters[0])"
          >
            练习推荐章节
          </van-button>
          <van-button
            v-else-if="recommendations.suggestedMode === 'daily'"
            type="primary"
            block
            round
            @click="startDailyChallenge"
          >
            开始每日挑战
          </van-button>
          <van-button
            v-else
            type="primary"
            block
            round
            @click="startRandom(10)"
          >
            随机练习
          </van-button>
        </div>
        <!-- 薄弱章节展示 -->
        <div v-if="recommendations.weakChapters.length > 0" class="weak-chapters">
          <div class="weak-title">📊 薄弱章节</div>
          <div class="weak-list">
            <div
              v-for="ch in recommendations.weakChapters"
              :key="ch.tag"
              class="weak-item"
              @click="startChapter(ch.tag)"
            >
              <span class="weak-name">{{ ch.name }}</span>
              <span class="weak-accuracy" :class="{ low: ch.accuracy < 50 }">
                {{ ch.accuracy }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速开始 -->
      <div class="quick-start">
        <div class="section-title">快速开始</div>
        <div class="quick-buttons">
          <div class="quick-btn" @click="startRandom(10)">
            <div class="quick-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <van-icon name="shuffle" size="24" />
            </div>
            <span>随机10题</span>
          </div>
          <div class="quick-btn" @click="startRandom(20)">
            <div class="quick-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <van-icon name="fire-o" size="24" />
            </div>
            <span>随机20题</span>
          </div>
          <div class="quick-btn" @click="startWrongMode" :class="{ disabled: store.wrongQuestions.length === 0 }">
            <div class="quick-icon" style="background: linear-gradient(135deg, #FF9F43, #F9CA24);">
              <van-icon name="edit" size="24" />
            </div>
            <span>错题重练</span>
            <van-badge v-if="store.wrongQuestions.length > 0" :content="store.wrongQuestions.length" class="wrong-badge" />
          </div>
        </div>
      </div>

      <!-- 章节选择 -->
      <div class="chapter-section">
        <div class="section-title">按章节练习</div>
        <div class="unit-list">
          <div v-for="unit in unitGroups" :key="unit.name" class="unit-group">
            <div class="unit-name">{{ unit.name }}</div>
            <div class="chapter-grid">
              <div
                v-for="chapter in unit.chapters"
                :key="chapter"
                class="chapter-card"
                @click="startChapter(chapter)"
              >
                <div class="chapter-tag">{{ chapter }}</div>
                <div class="chapter-name">{{ chapterNames[chapter] || chapter }}</div>
                <div class="chapter-count">{{ getChapterCount(chapter) }}题</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自适应难度显示 -->
      <div class="adaptive-difficulty" v-if="store.answers.length >= 5">
        <div class="adaptive-header">
          <span class="adaptive-label">🎯 自适应难度</span>
          <span class="adaptive-value" :class="'diff-' + recommendedDifficulty">
            {{ difficultyNames[recommendedDifficulty] }}
          </span>
        </div>
        <div class="adaptive-desc">
          根据你最近{{ Math.min(store.answers.length, 10) }}题的正确率自动推荐
        </div>
      </div>

      <!-- 筛选设置 -->
      <div class="filter-section">
        <div class="section-title">答题设置</div>
        <div class="filter-row">
          <span class="filter-label">每轮题数</span>
          <van-radio-group v-model="questionCount" direction="horizontal">
            <van-radio :name="5">5题</van-radio>
            <van-radio :name="10">10题</van-radio>
            <van-radio :name="15">15题</van-radio>
            <van-radio :name="20">20题</van-radio>
          </van-radio-group>
        </div>
        <div class="filter-row">
          <span class="filter-label">题目难度</span>
          <van-radio-group v-model="difficulty" direction="horizontal">
            <van-radio :name="0">全部</van-radio>
            <van-radio :name="1">简单</van-radio>
            <van-radio :name="2">中等</van-radio>
            <van-radio :name="3">困难</van-radio>
          </van-radio-group>
        </div>
        <div class="filter-row">
          <span class="filter-label">题目类型</span>
          <van-radio-group v-model="questionType" direction="horizontal">
            <van-radio name="">全部</van-radio>
            <van-radio name="choice">选择</van-radio>
            <van-radio name="fill">填空</van-radio>
            <van-radio name="judge">判断</van-radio>
          </van-radio-group>
        </div>
        <div class="filter-row adaptive-row">
          <van-checkbox v-model="useAdaptive" shape="square">
            启用自适应难度
          </van-checkbox>
          <span class="adaptive-hint">根据答题表现自动调整</span>
        </div>
      </div>

      <!-- 功能按钮 -->
      <div class="action-buttons">
        <van-button
          type="default"
          size="large"
          round
          block
          @click="goToReport"
          style="margin-bottom: 12px;"
        >
          <template #icon>
            <van-icon name="chart-trending-o" />
          </template>
          学习报告
        </van-button>
        <van-button
          type="default"
          size="large"
          round
          block
          @click="goToProfile"
        >
          <template #icon>
            <van-icon name="user-o" />
          </template>
          个人中心
        </van-button>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalQuestions }}</div>
          <div class="stat-label">已答题</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ correctRate }}%</div>
          <div class="stat-label">正确率</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ store.wrongQuestions.length }}</div>
          <div class="stat-label">错题本</div>
        </div>
      </div>
    </div>

    <!-- 音效设置面板 -->
    <AudioSettings />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores'
import { loadAllQuestions, getChapterList, chapterNames, unitGroups, difficultyNames } from '../utils/questionLoader'
import { generateRecommendations, recommendDifficulty } from '../utils/smartAnalysis'
import AudioSettings from '../components/AudioSettings.vue'

const router = useRouter()
const store = useGameStore()

// 答题设置
const questionCount = ref(10)
const difficulty = ref(0)
const questionType = ref('')
const useAdaptive = ref(true) // 默认启用自适应难度

// 章节题目数量缓存
const chapterCounts = ref({})

// 经验值百分比
const expPercent = computed(() => {
  return (store.user.exp % 100)
})

// 总答题数
const totalQuestions = computed(() => {
  return store.answers.length
})

// 正确率
const correctRate = computed(() => {
  if (store.answers.length === 0) return 0
  const correct = store.answers.filter(a => a.isCorrect).length
  return Math.round((correct / store.answers.length) * 100)
})

// 今日是否已打卡
const hasCheckedInToday = computed(() => {
  if (!store.lastCheckInDate) return false
  const today = new Date().toDateString()
  return store.lastCheckInDate === today
})

// 判断最近第 n 天是否打卡（n=1 表示今天，n=2 表示昨天...）
const isDayCheckedIn = (n) => {
  const dates = store.checkInDates || []
  if (dates.length === 0) return false
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() - (n - 1))
  const targetStr = targetDate.toDateString()
  return dates.includes(targetStr)
}

// 智能推荐
const recommendations = computed(() => {
  return generateRecommendations(store)
})

// 自适应推荐难度
const recommendedDifficulty = computed(() => {
  return recommendDifficulty(store.answers)
})

// 获取章节题目数量
const getChapterCount = (chapter) => {
  return chapterCounts.value[chapter] || 0
}

// 构建查询参数
function buildQuery(overrides = {}) {
  const query = { count: questionCount.value }
  // 如果启用自适应难度且用户没有手动选择难度，使用推荐难度
  if (useAdaptive.value && difficulty.value === 0 && store.answers.length >= 5) {
    query.difficulty = recommendedDifficulty.value
    query.adaptive = 1 // 标记为自适应模式
  } else if (difficulty.value > 0) {
    query.difficulty = difficulty.value
  }
  if (questionType.value) query.type = questionType.value
  return { ...query, ...overrides }
}

// 随机挑战
const startRandom = (count) => {
  router.push({ path: '/game', query: buildQuery({ mode: 'random', count }) })
}

// 错题重练
const startWrongMode = () => {
  if (store.wrongQuestions.length === 0) return
  router.push({ path: '/game', query: { mode: 'wrong' } })
}

// 按章节练习
const startChapter = (chapter) => {
  router.push({ path: '/game', query: buildQuery({ chapter }) })
}

// 去个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 去学习报告
const goToReport = () => {
  router.push('/report')
}

// 开始每日挑战
const startDailyChallenge = () => {
  router.push({ path: '/game', query: { mode: 'daily', count: 10 } })
}

// 初始化：预加载题库统计
onMounted(async () => {
  try {
    const allQuestions = await loadAllQuestions()
    const chapters = getChapterList(allQuestions)
    chapters.forEach(ch => {
      chapterCounts.value[ch.tag] = ch.count
    })
  } catch (e) {
    console.error('预加载题库失败:', e)
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  padding-bottom: 40px;
}

.user-header {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.avatar {
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.level {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.resources {
  display: flex;
  align-items: center;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: bold;
  color: #FF9F43;
}

.exp-bar {
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.exp-progress {
  height: 100%;
  background: linear-gradient(90deg, #2ECC71, #27AE60);
  border-radius: 12px;
  transition: width 0.3s ease;
}

.exp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: white;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.main-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 32px 24px;
}

.game-title {
  text-align: center;
  margin-bottom: 24px;
}

.game-title h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-title p {
  font-size: 16px;
  color: #666;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  padding-left: 4px;
  border-left: 4px solid #667eea;
  padding-left: 12px;
}

/* 智能推荐 */
.smart-recommend {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  color: white;
}

.recommend-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.recommend-icon {
  font-size: 36px;
}

.recommend-info {
  flex: 1;
}

.recommend-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.recommend-advice {
  font-size: 13px;
  opacity: 0.95;
  line-height: 1.4;
}

.recommend-actions {
  margin-bottom: 16px;
}

.weak-chapters {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
}

.weak-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  opacity: 0.9;
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weak-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.weak-item:active {
  background: rgba(255, 255, 255, 0.4);
}

.weak-name {
  font-size: 13px;
  flex: 1;
  margin-right: 8px;
}

.weak-accuracy {
  font-size: 14px;
  font-weight: bold;
  color: #f1c40f;
}

.weak-accuracy.low {
  color: #e74c3c;
}

/* 每日挑战 */
.daily-challenge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  color: white;
}

.daily-challenge.completed {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.challenge-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.challenge-icon {
  font-size: 40px;
}

.challenge-info {
  flex: 1;
}

.challenge-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.challenge-desc {
  font-size: 14px;
  opacity: 0.9;
}

.challenge-progress {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
}

.streak-days {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.day-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.day-dot.active {
  background: #f39c12;
  box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
}

.streak-reward {
  font-size: 13px;
  text-align: center;
  opacity: 0.9;
}

/* 快速开始 */
.quick-start {
  margin-bottom: 28px;
}

.quick-buttons {
  display: flex;
  gap: 12px;
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.quick-btn:active {
  transform: scale(0.96);
}

.quick-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.quick-btn span {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.wrong-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 章节选择 */
.chapter-section {
  margin-bottom: 28px;
}

.unit-group {
  margin-bottom: 20px;
}

.unit-name {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
  padding-left: 4px;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.chapter-card {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.chapter-card:active {
  transform: scale(0.96);
}

.chapter-card:hover {
  border-color: #667eea;
  background: #f0f3ff;
}

.chapter-tag {
  font-size: 12px;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 4px;
}

.chapter-name {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapter-count {
  font-size: 12px;
  color: #999;
}

/* 筛选设置 */
.filter-section {
  margin-bottom: 28px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 14px;
  color: #666;
  min-width: 70px;
  flex-shrink: 0;
}

/* 自适应难度 */
.adaptive-difficulty {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.adaptive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.adaptive-label {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.adaptive-value {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
}

.adaptive-value.diff-1 {
  background: #d4edda;
  color: #155724;
}

.adaptive-value.diff-2 {
  background: #fff3cd;
  color: #856404;
}

.adaptive-value.diff-3 {
  background: #f8d7da;
  color: #721c24;
}

.adaptive-desc {
  font-size: 13px;
  color: #666;
}

.adaptive-row {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
}

.adaptive-hint {
  font-size: 12px;
  color: #999;
}

/* 功能按钮 */
.action-buttons {
  margin-bottom: 24px;
}

/* 统计信息 */
.stats {
  display: flex;
  justify-content: space-around;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}
</style>
