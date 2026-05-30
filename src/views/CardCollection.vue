<template>
  <div class="card-collection-page">
    <van-nav-bar
      title="📜 历史知识图鉴"
      left-arrow
      @click-left="goBack"
      fixed
    />

    <div class="collection-content">
      <!-- 收集进度 -->
      <div class="collection-header">
        <div class="header-card">
          <div class="header-title">知识图鉴</div>
          <div class="header-subtitle">通关章节解锁对应知识卡片</div>
          <div class="header-stats">
            <div class="collected-count">
              <span class="count-num">{{ collectedCount }}</span>
              <span class="count-label">/ {{ totalCount }}</span>
            </div>
            <div class="progress-ring">
              <div class="progress-fill" :style="{ width: (collectedCount / totalCount * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 单元分组展示 -->
      <div v-for="unit in unitGroups" :key="unit.name" class="unit-section">
        <div class="unit-title">{{ unit.name }}</div>
        <div class="cards-grid">
          <div
            v-for="chapter in unit.chapters"
            :key="chapter"
            class="card-item"
            :class="{ unlocked: isUnlocked(chapter), locked: !isUnlocked(chapter) }"
            @click="viewCard(chapter)"
          >
            <!-- 未解锁 -->
            <div v-if="!isUnlocked(chapter)" class="card-locked">
              <div class="card-lock-icon">🔒</div>
              <div class="card-chapter">{{ chapter }}</div>
              <div class="card-hint">通关解锁</div>
            </div>
            <!-- 已解锁 -->
            <div v-else class="card-unlocked">
              <div class="card-bg-icon">{{ getCardIcon(chapter) }}</div>
              <div class="card-chapter">{{ chapter }}</div>
              <div class="card-name">{{ knowledgeCards[chapter]?.title || '' }}</div>
              <div class="card-period">{{ knowledgeCards[chapter]?.period || '' }}</div>
              <div class="card-badge">✅</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片详情弹窗 -->
      <van-popup
        v-model:show="showDetail"
        round
        position="bottom"
        :style="{ maxHeight: '85vh' }"
        closeable
      >
        <div v-if="currentCard" class="card-detail">
          <div class="detail-header">
            <span class="detail-icon">{{ getCardIcon(currentChapter) }}</span>
            <div class="detail-title-area">
              <div class="detail-title">{{ currentCard.title }}</div>
              <div class="detail-period">{{ currentCard.period }}</div>
            </div>
          </div>

          <div class="detail-body">
            <div class="detail-section">
              <div class="section-title">📌 核心知识点</div>
              <div class="points-list">
                <div
                  v-for="(point, index) in currentCard.keyPoints"
                  :key="index"
                  class="point-item"
                >
                  <span class="point-index">{{ index + 1 }}</span>
                  <span class="point-text">{{ point }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">💡 知识总结</div>
              <div class="summary-text">{{ currentCard.summary }}</div>
            </div>
          </div>
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores'
import { knowledgeCards } from '../utils/knowledgeCards'
import { unitGroups, getChapterLevels, getUnlockedChapters } from '../utils/questionLoader'

const router = useRouter()
const store = useGameStore()

// 弹窗状态
const showDetail = ref(false)
const currentChapter = ref('')
const currentCard = computed(() => {
  if (!currentChapter.value) return null
  return knowledgeCards[currentChapter.value] || null
})

// 总数
const totalCount = computed(() => {
  return Object.keys(knowledgeCards).length
})

// 已解锁的章节
const unlockedChapters = computed(() => {
  return getUnlockedChapters(store.unlockedLevels)
})

// 已收集数量（章节的Boss关通关即算解锁该章节卡片）
const collectedCount = computed(() => {
  let count = 0
  unlockedChapters.value.forEach(ch => {
    if (knowledgeCards[ch]) count++
  })
  return count
})

// 判断章节是否解锁
const isUnlocked = (chapter) => {
  return unlockedChapters.value.includes(chapter)
}

// 卡片图标（根据章节内容）
const cardIcons = {
  '第1课': '🦴', '第2课': '🌾', '第3课': '🏯',
  '第4课': '👑', '第5课': '⚔️', '第6课': '🗡️',
  '第7课': '📖', '第8课': '🏺', '第9课': '🏛️',
  '第10课': '🔥', '第11课': '🛡️', '第12课': '🌊',
  '第13课': '📜', '第14课': '🐪', '第15课': '🔬',
  '第16课': '⚔️', '第17课': '🐎', '第18课': '🌸',
  '第19课': '🏔️', '第20课': '🎨'
}

const getCardIcon = (chapter) => {
  return cardIcons[chapter] || '📖'
}

// 查看卡片详情
const viewCard = (chapter) => {
  if (!isUnlocked(chapter)) {
    return
  }
  currentChapter.value = chapter
  showDetail.value = true
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.card-collection-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding-top: 46px;
}

.collection-content {
  padding: 16px;
}

/* 收集进度头部 */
.collection-header {
  margin-bottom: 20px;
}

.header-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  color: white;
}

.header-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 16px;
}

.header-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.collected-count {
  font-size: 16px;
}

.count-num {
  font-size: 32px;
  font-weight: bold;
  color: #ffd700;
}

.count-label {
  font-size: 16px;
  opacity: 0.6;
}

.progress-ring {
  width: 120px;
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

/* 单元分组 */
.unit-section {
  margin-bottom: 24px;
}

.unit-title {
  font-size: 15px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  padding-left: 4px;
  border-left: 3px solid #ffd700;
  padding-left: 10px;
}

/* 卡片网格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card-item {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-item:active {
  transform: scale(0.96);
}

/* 未解锁卡片 */
.card-locked {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px 12px;
  text-align: center;
}

.card-lock-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.4;
}

.card-chapter {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.card-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* 已解锁卡片 */
.card-unlocked {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 170, 0, 0.1) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  position: relative;
}

.card-bg-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.card-unlocked .card-chapter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.card-name {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-period {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
}

/* 卡片详情弹窗 */
.card-detail {
  padding: 24px 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.detail-icon {
  font-size: 48px;
}

.detail-title-area {
  flex: 1;
}

.detail-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.detail-period {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
  padding: 2px 10px;
  background: #f0f0f0;
  border-radius: 10px;
  display: inline-block;
}

.detail-body {
  padding-bottom: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.point-index {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-top: 1px;
}

.point-text {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
}

.summary-text {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  padding: 16px;
  background: linear-gradient(135deg, #fff9e6, #fff3cd);
  border-radius: 12px;
  border: 1px solid #f0d86e;
}
</style>
