<template>
  <van-popup v-model:show="visible" round position="bottom" :style="{ maxHeight: '70%' }">
    <div class="auth-dialog">
      <!-- 未登录状态 -->
      <div v-if="!isLoggedIn" class="auth-content">
        <div class="auth-header">
          <div class="auth-icon">&#x1F464;</div>
          <div class="auth-title">{{ isRegister ? '注册账户' : '登录账户' }}</div>
          <div class="auth-subtitle">{{ isRegister ? '创建账户保存你的学习进度' : '登录以同步你的学习进度' }}</div>
        </div>

        <van-form @submit="handleSubmit">
          <van-cell-group inset>
            <van-field
              v-model="username"
              name="username"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="password"
              name="password"
              label="密码"
              type="password"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
            <van-field
              v-if="isRegister"
              v-model="confirmPassword"
              name="confirmPassword"
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              :rules="[{ validator: validateConfirm, message: '两次密码不一致' }]"
            />
          </van-cell-group>
          <div class="auth-actions">
            <van-button round block type="primary" native-type="submit" :loading="loading">
              {{ isRegister ? '注册' : '登录' }}
            </van-button>
            <div class="auth-switch" @click="isRegister = !isRegister">
              {{ isRegister ? '已有账户？去登录' : '没有账户？去注册' }}
            </div>
          </div>
        </van-form>
      </div>

      <!-- 已登录状态 -->
      <div v-else class="auth-content">
        <div class="auth-header">
          <div class="auth-icon logged-in">&#x2705;</div>
          <div class="auth-title">已登录</div>
          <div class="auth-subtitle">{{ currentUser }}</div>
        </div>
        <div class="auth-actions">
          <van-button round block type="danger" @click="handleLogout">
            退出登录
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { register, login, logout, getCurrentUser, isLoggedIn as checkIsLoggedIn, isGuest, migrateGuestData } from '../utils/cloudSync'
import { useGameStore } from '../stores'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'loginSuccess', 'logoutSuccess'])

const store = useGameStore()

const visible = ref(props.modelValue)
const isRegister = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref('')

// 双向绑定 v-model
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    checkLoginState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 检查登录状态
const checkLoginState = () => {
  // 先检查是否是游客
  if (isGuest()) {
    isLoggedIn.value = false
    currentUser.value = ''
    return
  }
  // 正式用户才算已登录
  const loggedIn = checkIsLoggedIn()
  isLoggedIn.value = loggedIn
  if (loggedIn) {
    const user = getCurrentUser()
    currentUser.value = user ? user.username : ''
  }
}

// 验证确认密码
const validateConfirm = (val) => {
  return val === password.value
}

// 提交表单
const handleSubmit = async () => {
  if (loading.value) return
  loading.value = true

  try {
    if (isRegister.value) {
      // 注册
      const result = await register(username.value, password.value)
      if (!result.success) {
        showToast({ message: result.message, type: 'fail' })
        loading.value = false
        return
      }
      showToast({ message: '注册成功', type: 'success' })

      // 注册成功后，将本地数据同步到云端
      const localData = getLocalGameData()
      if (localData) {
        await migrateGuestData(localData)
      }

      isLoggedIn.value = true
      currentUser.value = username.value
      emit('loginSuccess', username.value)
    } else {
      // 登录
      const result = await login(username.value, password.value)
      if (!result.success) {
        showToast({ message: result.message, type: 'fail' })
        loading.value = false
        return
      }
      showToast({ message: '登录成功', type: 'success' })

      isLoggedIn.value = true
      currentUser.value = username.value
      emit('loginSuccess', username.value)
    }

    // 关闭弹窗
    setTimeout(() => {
      visible.value = false
    }, 500)
  } catch (e) {
    const errMsg = e?.message || (isRegister.value ? '注册失败' : '登录失败')
    showToast({ message: errMsg, type: 'fail' })
  } finally {
    loading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await logout()
    isLoggedIn.value = false
    currentUser.value = ''
    showToast({ message: '已退出登录', type: 'success' })
    emit('logoutSuccess')
    visible.value = false
  } catch (e) {
    showToast({ message: '退出失败', type: 'fail' })
  }
}

// 获取本地游戏数据
const getLocalGameData = () => {
  return {
    user: { ...store.user },
    wrongQuestions: [...store.wrongQuestions],
    achievements: [...store.achievements],
    maxCombo: store.maxCombo,
    streakDays: store.streakDays,
    lastCheckInDate: store.lastCheckInDate,
    checkInDates: [...store.checkInDates],
    unlockedLevels: [...store.unlockedLevels],
    levelProgress: { ...store.levelProgress },
    answerHistory: [...store.answerHistory],
    questionStats: { ...store.questionStats },
    completedChapters: [...store.completedChapters],
    perfectRounds: store.perfectRounds,
    wrongPracticeCorrect: store.wrongPracticeCorrect,
    perfectAccuracyRounds: store.perfectAccuracyRounds,
    fastRounds: store.fastRounds
  }
}
</script>

<style scoped>
.auth-dialog {
  padding: 24px 16px;
}

.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.auth-icon.logged-in {
  font-size: 48px;
}

.auth-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #999;
}

.auth-actions {
  width: 100%;
  padding: 16px;
}

.auth-switch {
  text-align: center;
  font-size: 14px;
  color: #667eea;
  margin-top: 16px;
  cursor: pointer;
}

.auth-switch:active {
  opacity: 0.7;
}
</style>
