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

      <!-- 闯关模式入口 -->
      <div class="adventure-mode">
        <div class="adventure-card" @click="goToChapterMap">
          <div class="adventure-bg"></div>
          <div class="adventure-content">
            <div class="adventure-icon">🗺️</div>
            <div class="adventure-info">
              <div class="adventure-title">时空探险</div>
              <div class="adventure-desc">闯关模式 • {{ unlockedLevelsCount }}/{{ totalLevelsCount }}关</div>
              <div class="adventure-progress">
                <div class="progress-bar-mini">
                  <div class="progress-fill-mini" :style="{ width: adventureProgress + '%' }"></div>
                </div>
                <span class="progress-text">{{ adventureProgress }}%</span>
              </div>
            </div>
            <van-icon name="arrow" class="adventure-arrow" />
          </div>
        </div>
      </div>

      <!-- 六宫格功能区 -->
      <div class="main-grid">
        <div class="grid-row">
          <div class="grid-item challenge-item" @click="handleDailyClick">
            <div class="grid-icon">🔥</div>
            <div class="grid-title">每日挑战</div>
            <div class="grid-desc">连续{{ store.streakDays }}天</div>
          </div>
          <div class="grid-item recommend-item" @click="handleRecommendClick">
            <div class="grid-icon">🤖</div>
            <div class="grid-title">智能推荐</div>
            <div class="grid-desc">{{ recommendations.weakChapters.length }}个薄弱章节</div>
          </div>
        </div>
        <div class="grid-row">
          <div class="grid-item quick-item" @click="showQuickPopup = true">
            <div class="grid-icon">⚡</div>
            <div class="grid-title">快速开始</div>
            <div class="grid-desc">已解锁{{ unlockedQuestionCount }}题</div>
          </div>
          <div class="grid-item chapter-item" @click="showChapterPopup = true">
            <div class="grid-icon">📚</div>
            <div class="grid-title">章节练习</div>
            <div class="grid-desc">{{ unlockedChaptersCount }}/20章</div>
          </div>
        </div>
        <div class="grid-row">
          <div class="grid-item card-item" @click="goToCardCollection">
            <div class="grid-icon">📜</div>
            <div class="grid-title">知识图鉴</div>
            <div class="grid-desc">{{ collectedCardCount }}/{{ totalCardCount }}张</div>
          </div>
          <div class="grid-item timeline-item" @click="goToTimeline">
            <div class="grid-icon">📅</div>
            <div class="grid-title">历史时间轴</div>
            <div class="grid-desc">{{ timelineProgress.unlocked }}/{{ timelineProgress.total }}个</div>
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
          @click="goToCardCollection"
          style="margin-bottom: 12px;"
        >
          <template #icon>
            <span style="font-size: 18px;">📜</span>
          </template>
          知识图鉴 <span class="card-count-badge">{{ collectedCardCount }}/{{ totalCardCount }}</span>
        </van-button>
        <van-button
          type="default"
          size="large"
          round
          block
          @click="goToTimeline"
          style="margin-bottom: 12px;"
        >
          <template #icon>
            <span style="font-size: 18px;">📅</span>
          </template>
          历史时间轴 <span class="card-count-badge">{{ timelineProgress.unlocked }}/{{ timelineProgress.total }}</span>
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

    <!-- 快速开始弹窗 -->
    <van-popup v-model:show="showQuickPopup" round position="bottom" :style="{ maxHeight: '60%' }">
      <div class="popup-header">
        <div class="popup-title">⚡ 快速开始</div>
        <div class="popup-subtitle">已解锁 {{ unlockedQuestionCount }} 题</div>
      </div>
      <div class="popup-content">
        <div class="quick-options">
          <div class="quick-option" @click="startRandom(10); showQuickPopup = false" :class="{ disabled: unlockedQuestionCount < 10 }">
            <div class="option-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <van-icon name="shuffle" />
            </div>
            <div class="option-info">
              <div class="option-title">随机10题</div>
              <div class="option-desc">快速练习</div>
            </div>
          </div>
          <div class="quick-option" @click="startRandom(20); showQuickPopup = false" :class="{ disabled: unlockedQuestionCount < 20 }">
            <div class="option-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <van-icon name="fire-o" />
            </div>
            <div class="option-info">
              <div class="option-title">随机20题</div>
              <div class="option-desc">深度练习</div>
            </div>
          </div>
          <div class="quick-option" @click="startWrongMode(); showQuickPopup = false" :class="{ disabled: store.wrongQuestions.length === 0 }">
            <div class="option-icon" style="background: linear-gradient(135deg, #FF9F43, #F9CA24);">
              <van-icon name="edit" />
            </div>
            <div class="option-info">
              <div class="option-title">错题重练</div>
              <div class="option-desc">{{ store.wrongQuestions.length }}道错题</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 章节选择弹窗 -->
    <van-popup v-model:show="showChapterPopup" round position="bottom" :style="{ maxHeight: '80%' }">
      <div class="popup-header">
        <div class="popup-title">📚 章节练习</div>
        <div class="popup-subtitle">选择已解锁的章节</div>
      </div>
      <div class="popup-content chapter-popup-content">
        <div v-for="unit in unitGroups" :key="unit.name" class="unit-group">
          <div class="unit-name">{{ unit.name }}</div>
          <div class="chapter-grid-popup">
            <div
              v-for="chapter in unit.chapters"
              :key="chapter"
              class="chapter-card-popup"
              :class="{ locked: !isChapterUnlocked(chapter) }"
              @click="isChapterUnlocked(chapter) && startChapter(chapter); showChapterPopup = false"
            >
              <div v-if="!isChapterUnlocked(chapter)" class="chapter-lock">🔒</div>
              <div class="chapter-tag">{{ chapter }}</div>
              <div class="chapter-name">{{ chapterNames[chapter] || chapter }}</div>
              <div class="chapter-count">{{ getChapterCount(chapter) }}题</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 音效设置面板 -->
    <AudioSettings />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores'
import { loadAllQuestions, getChapterList, chapterNames, unitGroups, difficultyNames, filterUnlockedQuestions, getUnlockedChapters } from '../utils/questionLoader'
import { knowledgeCards } from '../utils/knowledgeCards'
import { getUnlockProgress } from '../utils/timelineData'
import { generateRecommendations, recommendDifficulty } from '../utils/smartAnalysis'
import AudioSettings from '../components/AudioSettings.vue'
import { showToast } from 'vant'

const router = useRouter()
const store = useGameStore()

// 弹窗显示状态
const showQuickPopup = ref(false)
const showChapterPopup = ref(false)

// 章节题目数量缓存
const chapterCounts = ref({})

// 全部题目缓存
const allQuestions = ref([])

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

// 闯关模式进度
const totalLevelsCount = computed(() => {
  // 20章 × 3关 = 60关
  return 60
})

const unlockedLevelsCount = computed(() => {
  return store.unlockedLevels.length
})

const adventureProgress = computed(() => {
  const completed = Object.values(store.levelProgress).filter(p => p.completed).length
  return Math.round((completed / totalLevelsCount.value) * 100)
})

// 已解锁的章节列表
const unlockedChaptersList = computed(() => {
  return getUnlockedChapters(store.unlockedLevels)
})

// 已解锁章节数量
const unlockedChaptersCount = computed(() => {
  return getUnlockedChapters(store.unlockedLevels).length
})

// 已解锁题目数量
const unlockedQuestionCount = computed(() => {
  if (!allQuestions.value || allQuestions.value.length === 0) return 0
  return filterUnlockedQuestions(allQuestions.value, store.unlockedLevels).length
})

// 判断章节是否解锁
const isChapterUnlocked = (chapterTag) => {
  return unlockedChaptersList.value.includes(chapterTag)
}

// 处理每日挑战点击
const handleDailyClick = () => {
  if (hasCheckedInToday.value) {
    showToast('今日已打卡')
  } else {
    startDailyChallenge()
  }
}

// 处理章节点击
const handleChapterClick = (chapter) => {
  if (!isChapterUnlocked(chapter)) {
    alert('🔒 该章节尚未解锁\n请先在「时空探险」中通关解锁！')
    return
  }
  startChapter(chapter)
}

// 获取章节题目数量
const getChapterCount = (chapter) => {
  return chapterCounts.value[chapter] || 0
}

// 构建查询参数
function buildQuery(overrides = {}) {
  const query = { count: store.questionCount || 10 }
  // 如果启用自适应难度且用户没有手动选择难度，使用推荐难度
  if (store.useAdaptive && store.difficulty === 0 && store.answers.length >= 5) {
    query.difficulty = recommendedDifficulty.value
    query.adaptive = 1 // 标记为自适应模式
  } else if (store.difficulty > 0) {
    query.difficulty = store.difficulty
  }
  if (store.questionType) query.type = store.questionType
  return { ...query, ...overrides }
}

// 随机挑战（只从已解锁题目中抽取）
const startRandom = (count) => {
  if (unlockedQuestionCount.value < count) {
    alert(`🔒 已解锁题目不足 ${count} 题\n请先在「时空探险」中解锁更多章节！`)
    return
  }
  router.push({ path: '/game', query: buildQuery({ mode: 'random', count, unlockedOnly: '1' }) })
}

// 错题重练
const startWrongMode = () => {
  if (store.wrongQuestions.length === 0) return
  router.push({ path: '/game', query: { mode: 'wrong' } })
}

// 按章节练习（只使用已解锁章节）
const startChapter = (chapter) => {
  router.push({ path: '/game', query: buildQuery({ chapter, unlockedOnly: '1' }) })
}

// 去个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 去学习报告
const goToReport = () => {
  router.push('/report')
}

const goToChapterMap = () => {
  router.push('/chapter-map')
}

const goToCardCollection = () => {
  router.push('/card-collection')
}

const goToTimeline = () => {
  router.push('/timeline')
}

// 处理智能推荐点击
const handleRecommendClick = () => {
  if (recommendations.value.suggestedMode === 'wrong') {
    startWrongMode()
  } else if (recommendations.value.suggestedMode === 'chapter' && recommendations.value.suggestedChapters.length > 0) {
    startChapter(recommendations.value.suggestedChapters[0])
  } else if (recommendations.value.suggestedMode === 'daily') {
    startDailyChallenge()
  } else {
    startRandom(10)
  }
}

// 知识卡片收集数量
const totalCardCount = computed(() => {
  return Object.keys(knowledgeCards).length
})

const collectedCardCount = computed(() => {
  const unlocked = getUnlockedChapters(store.unlockedLevels)
  return unlocked.filter(ch => knowledgeCards[ch]).length
})

// 时间轴解锁进度
const timelineProgress = computed(() => {
  return getUnlockProgress(store.unlockedLevels)
})

// 开始每日挑战（只从已解锁题目中抽取）
const startDailyChallenge = () => {
  if (unlockedQuestionCount.value < 10) {
    alert('🔒 已解锁题目不足 10 题\n请先在「时空探险」中解锁更多章节！')
    return
  }
  router.push({ path: '/game', query: { mode: 'daily', count: 10, unlockedOnly: '1' } })
}

// 初始化：预加载题库统计
onMounted(async () => {
  try {
    allQuestions.value = await loadAllQuestions()
    const chapters = getChapterList(allQuestions.value)
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

.unlocked-hint {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.lock-hint {
  text-align: center;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 14px;
  margin-top: 12px;
}

/* 闯关模式入口 */
.adventure-mode {
  margin-bottom: 24px;
}

.adventure-card {
  position: relative;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.adventure-card:active {
  transform: scale(0.98);
}

.adventure-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.5;
}

.adventure-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
}

.adventure-icon {
  font-size: 48px;
}

.adventure-info {
  flex: 1;
  color: white;
}

.adventure-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.adventure-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.adventure-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-mini {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: white;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: bold;
  min-width: 35px;
  text-align: right;
}

.adventure-arrow {
  color: white;
  font-size: 24px;
}

/* 四宫格布局 */
.main-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.grid-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.grid-item {
  background: white;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.grid-item:active {
  transform: scale(0.96);
}

.challenge-item {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

.recommend-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.quick-item {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.chapter-item {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.card-item {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.timeline-item {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
  color: white;
}

.grid-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.grid-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.grid-desc {
  font-size: 12px;
  opacity: 0.9;
}

/* 弹窗样式 */
.popup-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.popup-subtitle {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.popup-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.quick-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
}

.quick-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.option-info {
  flex: 1;
}

.option-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.option-desc {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.chapter-popup-content {
  padding: 16px;
}

.chapter-grid-popup {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.chapter-card-popup {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
}

.chapter-card-popup.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.chapter-lock {
  font-size: 20px;
  margin-bottom: 4px;
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

/* 功能按钮 */
.action-buttons {
  margin-bottom: 24px;
}

.card-count-badge {
  font-size: 12px;
  color: #999;
  font-weight: normal;
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
