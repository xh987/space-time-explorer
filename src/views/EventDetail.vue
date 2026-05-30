<template>
  <div class="event-detail-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="event?.title || '事件详情'"
      left-arrow
      @click-left="goBack"
      fixed
      :style="{ '--nav-bar-background': event?.color || '#667eea' }"
    />

    <div v-if="event" class="detail-content">
      <!-- 顶部信息卡片 -->
      <div class="hero-card" :style="{ background: `linear-gradient(135deg, ${event.color} 0%, ${darkenColor(event.color, 20)} 100%)` }">
        <div class="hero-icon">{{ event.icon }}</div>
        <div class="hero-info">
          <div class="hero-date">{{ event.date }}</div>
          <div class="hero-title">{{ event.title }}</div>
          <div class="hero-brief">{{ event.brief }}</div>
        </div>
      </div>

      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="info-title">📍 基本信息</div>
        <div class="info-grid">
          <div class="info-item" v-if="event.location">
            <div class="info-label">地点</div>
            <div class="info-value">{{ event.location }}</div>
          </div>
          <div class="info-item" v-if="event.figures && event.figures.length > 0">
            <div class="info-label">人物</div>
            <div class="info-value">{{ event.figures.join('、') }}</div>
          </div>
          <div class="info-item" v-if="event.chapter">
            <div class="info-label">章节</div>
            <div class="info-value">{{ event.chapter }}</div>
          </div>
        </div>
      </div>

      <!-- 详情标签页 -->
      <div class="tabs-card">
        <van-tabs v-model:active="activeTab" type="card" swipeable>
          <van-tab title="概览" name="overview">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">📖 事件简介</div>
                <div class="section-text">{{ event.brief }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="起因" name="cause" v-if="event.cause">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">🔍 事件起因</div>
                <div class="section-text">{{ event.cause }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="经过" name="process" v-if="event.process">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">⚡ 事件经过</div>
                <div class="section-text">{{ event.process }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="结果" name="result" v-if="event.result">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">🎯 事件结果</div>
                <div class="section-text">{{ event.result }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="背景" name="background" v-if="event.background">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">🌍 历史背景</div>
                <div class="section-text">{{ event.background }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="目的" name="purpose" v-if="event.purpose">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">🎪 事件目的</div>
                <div class="section-text">{{ event.purpose }}</div>
              </div>
            </div>
          </van-tab>

          <van-tab title="影响" name="impact" v-if="event.impact">
            <div class="tab-content">
              <div class="content-section">
                <div class="section-title">💫 历史影响</div>
                <div class="section-text">{{ event.impact }}</div>
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>

      <!-- 底部操作区 -->
      <div class="action-area">
        <van-button
          type="primary"
          block
          round
          :color="event.color"
          @click="goBack"
        >
          返回时间轴
        </van-button>
      </div>
    </div>

    <!-- 加载中或事件不存在 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">事件不存在或已删除</div>
      <van-button type="primary" round @click="goBack">返回</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getEventById } from '../utils/timelineData'

const router = useRouter()
const route = useRoute()

// 当前激活的标签页
const activeTab = ref('overview')

// 获取事件数据
const event = computed(() => {
  const eventId = route.params.eventId
  if (!eventId) return null
  return getEventById(eventId)
})

// 颜色加深函数
const darkenColor = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0)
  const B = Math.max((num & 0x0000FF) - amt, 0)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

// 返回
const goBack = () => {
  router.push('/timeline')
}

// 初始化
onMounted(() => {
  // 可以在这里添加页面访问统计或其他初始化逻辑
})
</script>

<style scoped>
.event-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 46px;
}

/* 自定义导航栏颜色 */
:deep(.van-nav-bar) {
  background: v-bind('event?.color || "#667eea"') !important;
}

:deep(.van-nav-bar__title) {
  color: white;
  font-weight: bold;
}

:deep(.van-nav-bar .van-icon) {
  color: white;
}

/* 内容区域 */
.detail-content {
  padding: 16px;
}

/* 顶部信息卡片 */
.hero-card {
  border-radius: 20px;
  padding: 24px;
  color: white;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.hero-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-date {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
  font-weight: 500;
}

.hero-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  line-height: 1.3;
}

.hero-brief {
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 基本信息卡片 */
.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.info-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

/* 标签页卡片 */
.tabs-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

:deep(.van-tabs__nav--card) {
  border-color: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.van-tab--card) {
  border-color: #e0e0e0;
  color: #666;
  font-size: 13px;
}

:deep(.van-tab--card.van-tab--active) {
  background: v-bind('event?.color || "#667eea"');
  border-color: v-bind('event?.color || "#667eea"');
  color: white;
}

.tab-content {
  padding: 16px 0;
}

.content-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-text {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  text-align: justify;
}

/* 底部操作区 */
.action-area {
  padding: 8px 0 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 24px;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .hero-card {
    padding: 20px;
  }

  .hero-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }

  .hero-title {
    font-size: 18px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
