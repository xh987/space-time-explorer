<template>
  <div class="report-page">
    <van-nav-bar
      title="学习报告"
      left-arrow
      @click-left="goBack"
      fixed
    />

    <div class="report-content">
      <!-- 周期切换 -->
      <div class="period-tabs">
        <div
          class="tab-item"
          :class="{ active: period === 'week' }"
          @click="period = 'week'"
        >
          本周
        </div>
        <div
          class="tab-item"
          :class="{ active: period === 'month' }"
          @click="period = 'month'"
        >
          本月
        </div>
      </div>

      <!-- 概览卡片 -->
      <div class="overview-card">
        <div class="overview-title">{{ period === 'week' ? '本周' : '本月' }}概览</div>
        <div class="overview-stats">
          <div class="stat-box">
            <div class="stat-num">{{ reportData.total }}</div>
            <div class="stat-label">答题总数</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">{{ reportData.accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">{{ reportData.streakDays }}</div>
            <div class="stat-label">连续打卡</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">{{ reportData.achievements }}</div>
            <div class="stat-label">获得成就</div>
          </div>
        </div>
      </div>

      <!-- 趋势图表 -->
      <div class="chart-card">
        <div class="chart-title">📈 答题趋势</div>
        <div class="chart-container">
          <div class="chart-bars">
            <div
              v-for="(item, index) in reportData.dailyData"
              :key="index"
              class="bar-item"
            >
              <div class="bar-wrapper">
                <div
                  class="bar correct"
                  :style="{ height: getBarHeight(item.correct, item.count) }"
                ></div>
                <div
                  class="bar wrong"
                  :style="{ height: getBarHeight(item.count - item.correct, item.count) }"
                ></div>
              </div>
              <div class="bar-label">{{ item.date }}</div>
            </div>
          </div>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot correct"></span>正确
            </span>
            <span class="legend-item">
              <span class="legend-dot wrong"></span>错误
            </span>
          </div>
        </div>
      </div>

      <!-- 薄弱章节 -->
      <div class="weak-card" v-if="reportData.weakChapters.length > 0">
        <div class="card-title">⚠️ 需要加强的章节</div>
        <div class="weak-list">
          <div
            v-for="ch in reportData.weakChapters"
            :key="ch.tag"
            class="weak-chapter-item"
            @click="startChapter(ch.tag)"
          >
            <div class="chapter-info">
              <div class="chapter-name">{{ ch.name }}</div>
              <div class="chapter-tag">{{ ch.tag }}</div>
            </div>
            <div class="chapter-stats">
              <div class="accuracy-bar">
                <div
                  class="accuracy-fill"
                  :style="{ width: ch.accuracy + '%' }"
                  :class="{ low: ch.accuracy < 50 }"
                ></div>
              </div>
              <div class="accuracy-text">{{ ch.accuracy }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 知识点掌握度 -->
      <div class="mastery-card">
        <div class="card-title">🎯 知识点掌握度</div>
        <div class="mastery-summary">
          <div class="mastery-item excellent">
            <div class="mastery-count">{{ mastery.excellent.length }}</div>
            <div class="mastery-label">优秀</div>
            <div class="mastery-desc">≥90%</div>
          </div>
          <div class="mastery-item good">
            <div class="mastery-count">{{ mastery.good.length }}</div>
            <div class="mastery-label">良好</div>
            <div class="mastery-desc">70-89%</div>
          </div>
          <div class="mastery-item average">
            <div class="mastery-count">{{ mastery.average.length }}</div>
            <div class="mastery-label">一般</div>
            <div class="mastery-desc">50-69%</div>
          </div>
          <div class="mastery-item weak">
            <div class="mastery-count">{{ mastery.weak.length }}</div>
            <div class="mastery-label">薄弱</div>
            <div class="mastery-desc"><50%</div>
          </div>
        </div>
      </div>

      <!-- 学习建议 -->
      <div class="advice-card">
        <div class="card-title">💡 学习建议</div>
        <div class="advice-content">
          <div v-if="reportData.weakChapters.length > 0" class="advice-item">
            <van-icon name="warning-o" color="#e74c3c" />
            <span>你在「{{ reportData.weakChapters[0]?.name }}」章节表现较弱，建议重点复习</span>
          </div>
          <div v-if="reportData.accuracy >= 90" class="advice-item">
            <van-icon name="like-o" color="#2ecc71" />
            <span>表现优异！可以尝试更高难度的题目挑战自己</span>
          </div>
          <div v-else-if="reportData.accuracy >= 70" class="advice-item">
            <van-icon name="smile-o" color="#f39c12" />
            <span>学习状态良好，继续保持，争取更高正确率</span>
          </div>
          <div v-else class="advice-item">
            <van-icon name="fire-o" color="#e74c3c" />
            <span>建议多进行错题重练，巩固基础知识</span>
          </div>
          <div class="advice-item">
            <van-icon name="clock-o" color="#667eea" />
            <span>已连续打卡 {{ store.streakDays }} 天，坚持就是胜利！</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores'
import { generateReport } from '../utils/smartAnalysis'
import { analyzeKnowledgeMastery } from '../utils/smartAnalysis'
import { chapterNames } from '../utils/questionLoader'

const router = useRouter()
const store = useGameStore()

// 周期选择
const period = ref('week')

// 报告数据
const reportData = computed(() => {
  return generateReport(store, period.value)
})

// 知识点掌握度
const mastery = computed(() => {
  return analyzeKnowledgeMastery(store.answers)
})

// 获取柱状图高度
const getBarHeight = (value, max) => {
  if (!max || max === 0) return '0%'
  const height = (value / max) * 100
  return Math.max(height, 4) + '%' // 最小高度4%
}

// 开始章节练习
const startChapter = (chapter) => {
  router.push({ path: '/game', query: { chapter } })
}

// 返回
const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 46px;
}

.report-content {
  padding: 16px;
}

/* 周期切换 */
.period-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
}

/* 概览卡片 */
.overview-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.overview-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-box {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 图表卡片 */
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.chart-container {
  padding: 10px 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 150px;
  padding: 0 10px;
  margin-bottom: 12px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  width: 24px;
  height: 120px;
  gap: 1px;
}

.bar {
  width: 100%;
  border-radius: 2px;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bar.correct {
  background: linear-gradient(to top, #2ecc71, #27ae60);
}

.bar.wrong {
  background: linear-gradient(to top, #e74c3c, #c0392b);
}

.bar-label {
  font-size: 11px;
  color: #999;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.correct {
  background: #2ecc71;
}

.legend-dot.wrong {
  background: #e74c3c;
}

/* 薄弱章节卡片 */
.weak-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-chapter-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.weak-chapter-item:active {
  background: #e9ecef;
}

.chapter-info {
  flex: 1;
}

.chapter-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.chapter-tag {
  font-size: 12px;
  color: #667eea;
}

.chapter-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.accuracy-bar {
  width: 80px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.accuracy-fill.low {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.accuracy-text {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 掌握度卡片 */
.mastery-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.mastery-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.mastery-item {
  text-align: center;
  padding: 16px 8px;
  border-radius: 12px;
}

.mastery-item.excellent {
  background: #e8f8f5;
}

.mastery-item.good {
  background: #fff9e6;
}

.mastery-item.average {
  background: #fff3e0;
}

.mastery-item.weak {
  background: #fdedec;
}

.mastery-count {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.mastery-item.excellent .mastery-count {
  color: #2ecc71;
}

.mastery-item.good .mastery-count {
  color: #f39c12;
}

.mastery-item.average .mastery-count {
  color: #e67e22;
}

.mastery-item.weak .mastery-count {
  color: #e74c3c;
}

.mastery-label {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.mastery-desc {
  font-size: 11px;
  color: #999;
}

/* 建议卡片 */
.advice-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.advice-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.advice-item .van-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
