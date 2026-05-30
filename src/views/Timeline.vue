<template>
  <div class="timeline-page">
    <van-nav-bar
      title="📅 历史时间轴"
      left-arrow
      @click-left="goBack"
      fixed
    />

    <div class="timeline-content">
      <!-- 解锁进度卡片 -->
      <div class="progress-overview">
        <div class="progress-card">
          <div class="progress-title">时间轴解锁进度</div>
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-value">{{ unlockProgress.unlocked }}</div>
              <div class="stat-label">已解锁</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ unlockProgress.total }}</div>
              <div class="stat-label">总事件</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ unlockProgress.percentage }}%</div>
              <div class="stat-label">完成度</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: unlockProgress.percentage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 时间轴主体 -->
      <div class="timeline-container">
        <div
          v-for="(chapterEvents, chapter) in groupedEvents"
          :key="chapter"
          class="chapter-section"
        >
          <!-- 章节标题 -->
          <div class="chapter-header">
            <div class="chapter-badge">{{ chapter }}</div>
            <div class="chapter-name">{{ getChapterName(chapter) }}</div>
          </div>

          <!-- 时间线 -->
          <div class="timeline-line">
            <div
              v-for="(event, index) in chapterEvents"
              :key="event.id"
              :ref="el => { if (el) eventRefs[event.id] = el }"
              class="timeline-node"
              :class="{
                'node-left': index % 2 === 0,
                'node-right': index % 2 === 1,
                'unlocked': isEventUnlocked(event.id),
                'locked': !isEventUnlocked(event.id),
                'just-unlocked': showUnlockAnimation && newlyUnlockedId === event.id
              }"
              @click="viewEventDetail(event)"
            >
              <!-- 节点连接线 -->
              <div class="node-connector"></div>

              <!-- 节点内容 -->
              <div class="node-card">
                <div class="node-icon" :style="{ background: isEventUnlocked(event.id) ? event.color : '#ccc' }">
                  {{ event.icon }}
                </div>
                <div class="node-content">
                  <div class="node-date">{{ event.date }}</div>
                  <div class="node-title">{{ event.title }}</div>
                  <div class="node-brief">{{ event.brief }}</div>
                  <div class="node-status">
                    <span v-if="isEventUnlocked(event.id)" class="status-unlocked">✅ 已解锁</span>
                    <span v-else class="status-locked">🔒 通关{{ event.unlockLevel }}解锁</span>
                  </div>
                </div>
              </div>

              <!-- 解锁动画 -->
              <div v-if="showUnlockAnimation && newlyUnlockedId === event.id" class="unlock-overlay">
                <div class="unlock-sparkle">✨</div>
                <div class="unlock-text">新解锁!</div>
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
  timelineEvents,
  getAllTimelineEvents,
  getEventById,
  getUnlockProgress
} from '../utils/timelineData'
import { chapterNames } from '../utils/questionLoader'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

// 事件引用
const eventRefs = ref({})

// 解锁动画状态
const newlyUnlockedId = ref(null)
const showUnlockAnimation = ref(false)

// 按章节分组的事件
const groupedEvents = computed(() => {
  return timelineEvents
})

// 解锁进度
const unlockProgress = computed(() => {
  return getUnlockProgress(store.unlockedLevels)
})

// 检查事件是否已解锁
const isEventUnlocked = (eventId) => {
  const event = getEventById(eventId)
  if (!event) return false
  return store.unlockedLevels.includes(event.unlockLevel)
}

// 获取章节名称
const getChapterName = (chapter) => {
  return chapterNames[chapter] || ''
}

// 查看事件详情
const viewEventDetail = (event) => {
  if (!isEventUnlocked(event.id)) {
    return
  }
  router.push(`/timeline/${event.id}`)
}

// 返回
const goBack = () => {
  router.push('/')
}

// 初始化
onMounted(async () => {
  // 检查是否从关卡结算页跳转过来，需要播放解锁动画
  const completedId = route.query.highlight
  if (completedId) {
    // 找到对应的事件ID
    const allEvents = getAllTimelineEvents()
    const completedEvent = allEvents.find(e => e.unlockLevel === completedId)

    if (completedEvent) {
      // 延迟后检查是否有新解锁的事件
      setTimeout(async () => {
        // 获取所有事件
        const events = getAllTimelineEvents()

        // 找到第一个未解锁但现在已解锁的事件
        for (const event of events) {
          if (isEventUnlocked(event.id)) {
            // 检查这个事件是否是刚刚解锁的（通过判断其unlockLevel是否匹配）
            const [chapter, level] = completedId.split('-').map(Number)
            let nextLevelId = null
            if (level < 3) {
              nextLevelId = `${chapter}-${level + 1}`
            } else {
              nextLevelId = `${chapter + 1}-1`
            }

            if (event.unlockLevel === nextLevelId && !newlyUnlockedId.value) {
              newlyUnlockedId.value = event.id
              showUnlockAnimation.value = true

              // 滚动到新解锁的事件
              await nextTick()
              const eventEl = eventRefs.value[event.id]
              if (eventEl) {
                eventEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }

              // 3秒后关闭动画
              setTimeout(() => {
                showUnlockAnimation.value = false
                newlyUnlockedId.value = null
              }, 3000)
              break
            }
          }
        }
      }, 500)
    }
  }
})
</script>

<style scoped>
.timeline-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding-top: 46px;
}

.timeline-content {
  padding: 16px;
}

/* 进度概览 */
.progress-overview {
  margin-bottom: 20px;
}

.progress-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.progress-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
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
  color: #ffd700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffaa00);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 章节区域 */
.chapter-section {
  margin-bottom: 32px;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-left: 8px;
}

.chapter-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

.chapter-name {
  font-size: 16px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

/* 时间线 */
.timeline-line {
  position: relative;
  padding: 0 8px;
}

.timeline-line::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
  transform: translateX(-50%);
}

/* 时间节点 */
.timeline-node {
  position: relative;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

.timeline-node.node-left {
  justify-content: flex-start;
  padding-right: 50%;
}

.timeline-node.node-right {
  justify-content: flex-end;
  padding-left: 50%;
}

.node-connector {
  position: absolute;
  left: 50%;
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  transform: translateX(-50%);
  border: 3px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.timeline-node.locked .node-connector {
  background: #999;
}

.timeline-node.unlocked .node-connector {
  background: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* 节点卡片 */
.node-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  width: calc(100% - 20px);
  transition: all 0.3s ease;
}

.timeline-node.node-left .node-card {
  margin-right: 20px;
}

.timeline-node.node-right .node-card {
  margin-left: 20px;
  flex-direction: row-reverse;
  text-align: right;
}

.timeline-node.node-right .node-content {
  text-align: right;
}

.timeline-node.unlocked .node-card {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
  cursor: pointer;
}

.timeline-node.unlocked .node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.2);
}

.timeline-node.locked .node-card {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.05);
}

.node-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-date {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 4px;
}

.node-title {
  font-size: 15px;
  font-weight: bold;
  color: white;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-brief {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-status {
  font-size: 11px;
}

.status-unlocked {
  color: #4ade80;
}

.status-locked {
  color: rgba(255, 255, 255, 0.4);
}

/* 解锁动画 */
.timeline-node.just-unlocked .node-card {
  animation: unlockPulse 0.6s ease;
  border-color: #ffd700 !important;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
}

@keyframes unlockPulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.98); }
  100% { transform: scale(1); opacity: 1; }
}

.unlock-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.unlock-sparkle {
  font-size: 36px;
  animation: sparkleRotate 1s ease infinite;
}

.unlock-text {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  animation: unlockTextPulse 1s ease infinite;
  margin-top: 4px;
}

@keyframes sparkleRotate {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
}

@keyframes unlockTextPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* 响应式调整 */
@media (max-width: 375px) {
  .node-card {
    padding: 12px;
  }

  .node-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .node-title {
    font-size: 14px;
  }

  .node-brief {
    font-size: 11px;
  }
}
</style>
