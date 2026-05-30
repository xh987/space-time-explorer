<template>
  <div class="chapter-map-page">
    <van-nav-bar
      title="🗺️ 时空探险地图"
      left-arrow
      @click-left="goBack"
      fixed
    />

    <div class="map-content">
      <!-- 探险进度概览 -->
      <div class="progress-overview">
        <div class="progress-card">
          <div class="progress-title">探险进度</div>
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-value">{{ completedLevels }}/{{ totalLevels }}</div>
              <div class="stat-label">已通关</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalStars }}</div>
              <div class="stat-label">总星星</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ unlockedChapters.length }}</div>
              <div class="stat-label">已解锁章节</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 章节列表 -->
      <div class="chapters-list">
        <div
          v-for="unit in unitGroups"
          :key="unit.name"
          class="unit-section"
        >
          <div class="unit-header">
            <span class="unit-name">{{ unit.name }}</span>
          </div>

          <div class="chapters-grid">
            <div
              v-for="chapterTag in unit.chapters"
              :key="chapterTag"
              class="chapter-card"
              :class="{ locked: !isChapterUnlocked(chapterTag) }"
            >
              <div class="chapter-header">
                <div class="chapter-icon">📖</div>
                <div class="chapter-info">
                  <div class="chapter-tag">{{ chapterTag }}</div>
                  <div class="chapter-name">{{ chapterNames[chapterTag] }}</div>
                </div>
                <div v-if="!isChapterUnlocked(chapterTag)" class="lock-icon">🔒</div>
              </div>

              <!-- 关卡列表 -->
              <div class="levels-row">
                <div
                  v-for="level in getChapterLevelsData(chapterTag)"
                  :key="level.id"
                  :ref="el => { if (el) levelRefs[level.id] = el }"
                  class="level-node"
                  :class="{
                    locked: !isLevelUnlocked(level.id),
                    completed: isLevelCompleted(level.id),
                    'in-progress': isLevelInProgress(level.id),
                    boss: level.isBoss,
                    'just-unlocked': showUnlockAnimation && newlyUnlockedId === level.id,
                    'highlight': highlightLevelId === level.id
                  }"
                  @click="startLevel(level)"
                >
                  <div class="level-icon">
                    <span v-if="level.isBoss">👹</span>
                    <span v-else-if="level.levelNum === 1">🔍</span>
                    <span v-else-if="level.levelNum === 2">📜</span>
                  </div>
                  <div class="level-name">{{ level.name }}</div>
                  <div class="level-stars">
                    <span
                      v-for="n in 3"
                      :key="n"
                      class="star"
                      :class="{ active: getLevelStars(level.id) >= n }"
                    >⭐</span>
                  </div>
                  <div class="level-count">{{ level.questionCount }}题</div>
                  <div v-if="isLevelCompleted(level.id)" class="speed-btn" @click.stop="startSpeedChallenge(level)">
                    ⏱️
                  </div>
                  <!-- 解锁动画覆盖层 -->
                  <div v-if="showUnlockAnimation && newlyUnlockedId === level.id" class="unlock-overlay">
                    <div class="unlock-sparkle">✨</div>
                    <div class="unlock-text">已解锁!</div>
                  </div>
                </div>
              </div>

              <!-- 章节进度 -->
              <div class="chapter-progress">
                <span class="progress-text">{{ getChapterProgress(chapterTag) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores'
import {
  loadAllQuestions,
  getChapterList,
  chapterNames,
  unitGroups,
  getChapterLevels,
  getLevelQuestions,
  getUnlockedChapters
} from '../utils/questionLoader'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

// 数据
const questions = ref([])
const loading = ref(true)

// 解锁动画状态
const highlightLevelId = ref(null)
const newlyUnlockedId = ref(null)
const showUnlockAnimation = ref(false)
const levelRefs = ref({})

// 计算属性
const unlockedChapters = computed(() => {
  return getUnlockedChapters(store.unlockedLevels)
})

const totalLevels = computed(() => {
  let count = 0
  unitGroups.forEach(unit => {
    unit.chapters.forEach(chapter => {
      const levels = getChapterLevels(chapter, questions.value)
      count += levels.length
    })
  })
  return count
})

const completedLevels = computed(() => {
  return Object.values(store.levelProgress).filter(p => p.completed).length
})

const totalStars = computed(() => {
  return Object.values(store.levelProgress).reduce((sum, p) => sum + (p.stars || 0), 0)
})

const progressPercent = computed(() => {
  if (totalLevels.value === 0) return 0
  return Math.round((completedLevels.value / totalLevels.value) * 100)
})

// 方法
const isChapterUnlocked = (chapterTag) => {
  return unlockedChapters.value.includes(chapterTag)
}

const isLevelUnlocked = (levelId) => {
  return store.unlockedLevels.includes(levelId)
}

const isLevelCompleted = (levelId) => {
  return store.levelProgress[levelId]?.completed || false
}

const isLevelInProgress = (levelId) => {
  const progress = store.levelProgress[levelId]
  return progress && !progress.completed && progress.currentIndex > 0
}

const getLevelStars = (levelId) => {
  return store.levelProgress[levelId]?.stars || 0
}

const getChapterLevelsData = (chapterTag) => {
  return getChapterLevels(chapterTag, questions.value)
}

const getChapterProgress = (chapterTag) => {
  const levels = getChapterLevels(chapterTag, questions.value)
  const completed = levels.filter(l => isLevelCompleted(l.id)).length
  const totalStars = levels.reduce((sum, l) => sum + getLevelStars(l.id), 0)
  const maxStars = levels.length * 3
  return `${completed}/${levels.length}关 ⭐${totalStars}/${maxStars}`
}

const startLevel = (level) => {
  if (!isLevelUnlocked(level.id)) {
    return
  }

  const levelQuestions = getLevelQuestions(level.id, questions.value)
  if (levelQuestions.length === 0) {
    return
  }

  store.startLevel(level.id, levelQuestions)

  router.push({
    path: '/game',
    query: {
      mode: 'level',
      levelId: level.id,
      chapter: level.chapter
    }
  })
}

const startSpeedChallenge = (level) => {
  if (!isLevelCompleted(level.id)) return

  const levelQuestions = getLevelQuestions(level.id, questions.value)
  if (levelQuestions.length === 0) return

  store.startLevel(level.id + '-speed', levelQuestions)

  router.push({
    path: '/game',
    query: {
      mode: 'speed',
      levelId: level.id,
      chapter: level.chapter,
      timeLimit: 60
    }
  })
}

const goBack = () => {
  router.push('/')
}

// 初始化
onMounted(async () => {
  questions.value = await loadAllQuestions()
  loading.value = false

  // 检查是否从关卡结算页跳转过来，需要播放解锁动画
  const completedId = route.query.highlight
  if (completedId) {
    highlightLevelId.value = completedId

    // 计算下一个解锁的关卡
    const [chapter, level] = completedId.split('-').map(Number)
    let nextId = null
    if (level < 3) {
      nextId = `${chapter}-${level + 1}`
    } else {
      nextId = `${chapter + 1}-1`
    }

    // 滚动到已完成的关卡位置
    await nextTick()
    const completedEl = levelRefs.value[completedId]
    if (completedEl) {
      completedEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // 延迟后播放下一关解锁动画
    setTimeout(async () => {
      if (nextId && isLevelUnlocked(nextId) && !isLevelCompleted(nextId)) {
        newlyUnlockedId.value = nextId
        showUnlockAnimation.value = true

        // 滚动到新解锁的关卡
        await nextTick()
        const nextEl = levelRefs.value[nextId]
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }

        // 3秒后关闭动画
        setTimeout(() => {
          showUnlockAnimation.value = false
          newlyUnlockedId.value = null
          highlightLevelId.value = null
        }, 3000)
      } else {
        highlightLevelId.value = null
      }
    }, 800)
  }
})
</script>

<style scoped>
.chapter-map-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 46px;
}

.map-content {
  padding: 16px;
}

/* 进度概览 */
.progress-overview {
  margin-bottom: 20px;
}

.progress-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.progress-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 章节列表 */
.unit-section {
  margin-bottom: 24px;
}

.unit-header {
  margin-bottom: 12px;
}

.unit-name {
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

.chapters-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chapter-card.locked {
  opacity: 0.7;
  background: #f5f5f5;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.chapter-icon {
  font-size: 32px;
}

.chapter-info {
  flex: 1;
}

.chapter-tag {
  font-size: 12px;
  color: #667eea;
  font-weight: bold;
}

.chapter-name {
  font-size: 15px;
  color: #333;
  font-weight: bold;
}

.lock-icon {
  font-size: 24px;
}

/* 关卡列表 */
.levels-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.level-node {
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
}

.level-node:not(.locked):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.level-node.locked {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e9ecef;
}

.level-node.completed {
  background: #d4edda;
  border-color: #28a745;
}

.level-node.in-progress {
  background: #fff3cd;
  border-color: #ffc107;
  animation: pulse 2s infinite;
}

.level-node.boss {
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
}

.level-node.boss.completed {
  background: linear-gradient(135deg, #28a745, #20c997);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.level-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.level-name {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-node.boss .level-name {
  color: white;
}

.level-stars {
  font-size: 10px;
  margin-bottom: 2px;
}

.star {
  opacity: 0.3;
}

.star.active {
  opacity: 1;
}

.level-count {
  font-size: 10px;
  color: #999;
}

.level-node.boss .level-count {
  color: rgba(255, 255, 255, 0.8);
}

/* 高亮和解锁动画 */
.level-node.highlight {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
  transition: box-shadow 0.3s ease;
}

.level-node.just-unlocked {
  animation: unlockBounce 0.6s ease;
  border-color: #ffd700 !important;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
}

@keyframes unlockBounce {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.15); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

/* 解锁覆盖层 */
.unlock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 12px;
  animation: unlockFadeIn 0.5s ease;
  z-index: 10;
  pointer-events: none;
}

.unlock-sparkle {
  font-size: 28px;
  animation: sparkleRotate 1s ease infinite;
}

.unlock-text {
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  animation: unlockTextPulse 1s ease infinite;
}

@keyframes unlockFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes sparkleRotate {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
}

@keyframes unlockTextPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* 章节进度 */
.chapter-progress {
  text-align: center;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.speed-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 14px;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  background: rgba(255, 107, 107, 0.2);
}

.speed-btn:active {
  transform: scale(0.9);
}
</style>
