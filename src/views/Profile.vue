<template>
  <div class="profile">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="个人中心"
      left-arrow
      @click-left="goBack"
      fixed
    />

    <!-- 用户账户卡片 -->
    <div class="account-card" @click="showAuthDialog = true">
      <div v-if="!isCloudLoggedIn" class="account-info">
        <div class="account-avatar">&#x1F464;</div>
        <div class="account-text">
          <div class="account-title">未登录</div>
          <div class="account-desc">登录以保存和同步学习进度</div>
        </div>
        <van-icon name="arrow" />
      </div>
      <div v-else class="account-info">
        <div class="account-avatar logged-in">&#x1F464;</div>
        <div class="account-text">
          <div class="account-title">{{ cloudUsername }}</div>
          <div class="account-desc">数据已同步到云端 &#x2705;</div>
        </div>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="avatar-section">
        <van-icon name="user-circle-o" size="80" color="#FF9F43" />
      </div>
      <div class="user-name">{{ store.user.nickname }}</div>
      <div class="user-level">Lv.{{ store.user.level }} 时空学徒</div>
      <div class="exp-section">
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
        <div class="exp-text">{{ store.user.exp % 100 }} / 100 EXP</div>
      </div>
    </div>

    <!-- 资源统计 -->
    <div class="resources-card">
      <div class="resource-item">
        <van-icon name="gem-o" size="32" color="#FF9F43" />
        <div class="resource-value">{{ store.user.coins }}</div>
        <div class="resource-label">金币</div>
      </div>
      <div class="resource-item">
        <van-icon name="star-o" size="32" color="#FFD700" />
        <div class="resource-value">{{ store.user.exp }}</div>
        <div class="resource-label">总经验</div>
      </div>
      <div class="resource-item">
        <van-icon name="records-o" size="32" color="#e74c3c" />
        <div class="resource-value">{{ store.wrongQuestions.length }}</div>
        <div class="resource-label">错题</div>
      </div>
    </div>

    <!-- 答题设置卡片 -->
    <div class="settings-card">
      <div class="card-title">⚙️ 答题设置</div>
      <div class="settings-list">
        <div class="setting-item">
          <span class="setting-label">每轮题数</span>
          <van-radio-group v-model="questionCount" direction="horizontal" @change="saveSettings">
            <van-radio :name="5">5题</van-radio>
            <van-radio :name="10">10题</van-radio>
            <van-radio :name="15">15题</van-radio>
            <van-radio :name="20">20题</van-radio>
          </van-radio-group>
        </div>
        <div class="setting-item">
          <span class="setting-label">题目难度</span>
          <van-radio-group v-model="difficulty" direction="horizontal" @change="saveSettings">
            <van-radio :name="0">全部</van-radio>
            <van-radio :name="1">简单</van-radio>
            <van-radio :name="2">中等</van-radio>
            <van-radio :name="3">困难</van-radio>
          </van-radio-group>
        </div>
        <div class="setting-item">
          <span class="setting-label">题目类型</span>
          <van-radio-group v-model="questionType" direction="horizontal" @change="saveSettings">
            <van-radio name="">全部</van-radio>
            <van-radio name="choice">选择</van-radio>
            <van-radio name="judge">判断</van-radio>
          </van-radio-group>
        </div>
        <div class="setting-item">
          <van-checkbox v-model="useAdaptive" shape="square" @change="saveSettings">
            启用自适应难度
          </van-checkbox>
          <span class="setting-hint">根据答题表现自动调整</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group>
        <van-cell title="错题本" is-link @click="showWrongQuestions">
          <template #icon>
            <van-icon name="records" class="menu-icon" color="#e74c3c" />
          </template>
          <template #value>
            <van-tag type="danger" v-if="store.wrongQuestions.length > 0">
              {{ store.wrongQuestions.length }}
            </van-tag>
            <span v-else class="no-data">暂无</span>
          </template>
        </van-cell>
        <van-cell title="错题重练" is-link @click="startWrongPractice" :class="{ disabled: store.wrongQuestions.length === 0 }">
          <template #icon>
            <van-icon name="replay" class="menu-icon" color="#e67e22" />
          </template>
        </van-cell>
        <van-cell title="清除错题本" is-link @click="clearWrongQuestions" :class="{ disabled: store.wrongQuestions.length === 0 }">
          <template #icon>
            <van-icon name="delete-o" class="menu-icon" color="#95a5a6" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 错题本弹窗 -->
    <van-popup
      v-model:show="showWrongList"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <div class="wrong-list-popup">
        <div class="popup-header">
          <span class="popup-title">错题本 ({{ store.wrongQuestions.length }})</span>
          <div class="popup-actions">
            <span class="practice-btn" @click="startWrongPractice" v-if="store.wrongQuestions.length > 0">全部重练</span>
            <van-icon name="cross" size="20" @click="showWrongList = false" />
          </div>
        </div>

        <div v-if="store.wrongQuestions.length === 0" class="empty-state">
          <van-icon name="smile-o" size="48" color="#ccc" />
          <p>还没有错题，继续保持！</p>
        </div>

        <div v-else class="wrong-list">
          <div
            v-for="(question, index) in store.wrongQuestions"
            :key="question.id || index"
            class="wrong-item"
          >
            <div class="wrong-item-header">
              <span class="wrong-type-tag" :class="question.type">
                {{ typeLabel(question.type) }}
              </span>
              <span class="wrong-tags" v-if="question.tags">
                {{ question.tags.find(t => t.includes('课')) || '' }}
              </span>
              <van-icon
                name="delete-o"
                class="delete-btn"
                @click="removeWrongQuestion(index)"
              />
            </div>
            <div class="wrong-question">{{ question.content }}</div>
            <div class="wrong-answer">
              正确答案: {{ formatAnswer(question) }}
            </div>
            <div v-if="question.explanation" class="wrong-explanation">
              {{ question.explanation }}
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 登录/注册弹窗 -->
    <AuthDialog v-model="showAuthDialog" @loginSuccess="onLoginSuccess" @logoutSuccess="onLogoutSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores'
import { showDialog, showConfirmDialog } from 'vant'
import { typeNames } from '../utils/questionLoader'
import { isLoggedIn, getCurrentUser } from '../utils/cloudSync'
import AuthDialog from '../components/AuthDialog.vue'

const router = useRouter()
const store = useGameStore()
const showWrongList = ref(false)
const showAuthDialog = ref(false)
const isCloudLoggedIn = ref(false)
const cloudUsername = ref('')

// 答题设置
const questionCount = ref(10)
const difficulty = ref(0)
const questionType = ref('')
const useAdaptive = ref(false)

// 加载设置
onMounted(() => {
  questionCount.value = store.questionCount || 10
  difficulty.value = store.difficulty || 0
  questionType.value = store.questionType || ''
  useAdaptive.value = store.useAdaptive || false
  checkCloudLoginState()
})

// 检查云端登录状态
const checkCloudLoginState = () => {
  try {
    const loggedIn = isLoggedIn()
    isCloudLoggedIn.value = loggedIn
    if (loggedIn) {
      const user = getCurrentUser()
      cloudUsername.value = user ? user.username : ''
    }
  } catch (e) {
    isCloudLoggedIn.value = false
  }
}

// 登录成功回调
const onLoginSuccess = (username) => {
  isCloudLoggedIn.value = true
  cloudUsername.value = username
}

// 退出登录回调
const onLogoutSuccess = () => {
  isCloudLoggedIn.value = false
  cloudUsername.value = ''
}

// 保存设置
const saveSettings = () => {
  store.questionCount = questionCount.value
  store.difficulty = difficulty.value
  store.questionType = questionType.value
  store.useAdaptive = useAdaptive.value
}

// 经验值百分比
const expPercent = computed(() => {
  return store.user.exp % 100
})

// 题型标签
const typeLabel = (type) => {
  return typeNames[type] || type
}

// 返回
const goBack = () => {
  router.push('/')
}

// 显示错题本
const showWrongQuestions = () => {
  showWrongList.value = true
}

// 格式化答案显示
const formatAnswer = (question) => {
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

// 删除单条错题
const removeWrongQuestion = (index) => {
  store.wrongQuestions.splice(index, 1)
}

// 清除全部错题
const clearWrongQuestions = () => {
  if (store.wrongQuestions.length === 0) return
  showConfirmDialog({
    title: '确认清除',
    message: '确定要清除全部错题记录吗？此操作不可撤销。'
  }).then(() => {
    store.wrongQuestions = []
  }).catch(() => {
    // 取消
  })
}

// 开始错题重练
const startWrongPractice = () => {
  if (store.wrongQuestions.length === 0) return
  showWrongList.value = false
  store.resetGame()
  router.push({ path: '/game', query: { mode: 'wrong' } })
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 46px;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 20px;
  text-align: center;
  color: white;
}

/* 账户卡片 */
.account-card {
  background: white;
  margin: 16px;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.account-card:active {
  opacity: 0.9;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.account-avatar.logged-in {
  background: #e8f5e9;
}

.account-text {
  flex: 1;
}

.account-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.account-desc {
  font-size: 13px;
  color: #999;
}

.avatar-section {
  margin-bottom: 16px;
}

.user-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.user-level {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 20px;
}

.exp-section {
  max-width: 300px;
  margin: 0 auto;
}

.exp-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.exp-fill {
  height: 100%;
  background: #2ecc71;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 14px;
  opacity: 0.9;
}

.resources-card {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 24px 16px;
  margin: -20px 16px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.resource-item {
  text-align: center;
}

.resource-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 8px 0 4px;
}

.resource-label {
  font-size: 14px;
  color: #999;
}

.menu-section {
  padding: 0 16px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin: 16px;
  margin-top: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: #666;
}

.setting-hint {
  font-size: 12px;
  color: #999;
  margin-left: 24px;
}

.menu-icon {
  margin-right: 8px;
  font-size: 20px;
}

.no-data {
  font-size: 14px;
  color: #999;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 错题本弹窗 */
.wrong-list-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
}

.popup-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.practice-btn {
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
  cursor: pointer;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-state p {
  margin-top: 16px;
}

.wrong-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.wrong-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.wrong-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.wrong-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.wrong-type-tag.choice {
  background: #667eea;
}

.wrong-type-tag.fill {
  background: #2ecc71;
}

.wrong-type-tag.judge {
  background: #e67e22;
}

.wrong-tags {
  font-size: 12px;
  color: #999;
  flex: 1;
}

.delete-btn {
  color: #ccc;
  cursor: pointer;
  padding: 4px;
}

.delete-btn:active {
  color: #e74c3c;
}

.wrong-question {
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
}

.wrong-answer {
  font-size: 14px;
  color: #2ecc71;
  font-weight: bold;
  margin-bottom: 6px;
}

.wrong-explanation {
  font-size: 13px;
  color: #888;
  line-height: 1.5;
  padding: 8px 12px;
  background: #f0f3ff;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}
</style>
