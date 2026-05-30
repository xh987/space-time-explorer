<template>
  <div class="game">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <van-loading type="spinner" color="#667eea" size="48">加载题库中...</van-loading>
    </div>

    <template v-else>
      <!-- 顶部导航 -->
      <van-nav-bar
        :title="gameTitle"
        left-arrow
        @click-left="goBack"
        fixed
      />

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">
          {{ currentIndex + 1 }} / {{ questions.length }}
        </div>
      </div>

      <!-- 限时倒计时 -->
      <div v-if="route.query.mode === 'speed'" class="timer-section">
        <div class="timer-bar" :class="{ warning: timeRemaining <= 10, danger: timeRemaining <= 5 }">
          <div class="timer-fill" :style="{ width: (timeRemaining / timeLimit * 100) + '%' }"></div>
        </div>
        <div class="timer-text" :class="{ warning: timeRemaining <= 10, danger: timeRemaining <= 5 }">
          ⏱️ {{ timeRemaining }}s
        </div>
      </div>

      <!-- 连击显示 - 增强版 -->
      <div v-if="combo > 1" class="combo-display" :class="getComboClass" ref="comboEl">
        <div class="combo-bg"></div>
        <div class="combo-content">
          <span class="combo-count">{{ combo }}</span>
          <span class="combo-text">{{ comboText }}</span>
          <div v-if="combo >= 5" class="combo-effect">{{ comboEmoji }}</div>
        </div>
      </div>

      <!-- 连击里程碑特效 -->
      <div v-if="showComboMilestone" class="combo-milestone" ref="comboMilestoneEl">
        <div class="milestone-content">
          <div class="milestone-emoji">{{ milestoneEmoji }}</div>
          <div class="milestone-text">{{ milestoneText }}</div>
          <div class="milestone-combo">{{ combo }} 连击!</div>
        </div>
      </div>

      <!-- 得分飘字 -->
      <div v-if="showScoreFloat" class="score-float" ref="scoreFloatEl">
        +{{ scoreGain }}
      </div>

      <!-- 题目切换动画容器 -->
      <transition name="question-slide" mode="out-in">
        <!-- 题目区域 -->
        <div class="question-section" v-if="currentQuestion && !showResult" :key="currentIndex">
          <div class="question-meta">
            <span class="question-type" :class="currentQuestion.type">
              {{ typeLabel }}
            </span>
            <span v-if="currentQuestion.difficulty" class="question-difficulty" :class="'diff-' + currentQuestion.difficulty">
              {{ difficultyLabel }}
            </span>
          </div>
          <div class="question-content">
            {{ currentQuestion.content }}
          </div>

          <!-- 选择题选项 -->
          <div v-if="currentQuestion.type === 'choice'" class="options">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-item"
              :class="{
                'selected': selectedOption === index && !showResult,
                'correct': showResult && index === currentQuestion.answer,
                'wrong': showResult && selectedOption === index && index !== currentQuestion.answer
              }"
              @click="selectOption(index)"
            >
              <span class="option-label">{{ ['A', 'B', 'C', 'D'][index] }}</span>
              <span class="option-text">{{ option }}</span>
              <van-icon
                v-if="showResult && index === currentQuestion.answer"
                name="success"
                class="option-icon correct-icon"
              />
              <van-icon
                v-if="showResult && selectedOption === index && index !== currentQuestion.answer"
                name="cross"
                class="option-icon wrong-icon"
              />
            </div>
          </div>

          <!-- 判断题 -->
          <div v-else-if="currentQuestion.type === 'judge'" class="judge-section">
            <div
              class="judge-option"
              :class="{
                'selected': selectedOption === 0 && !showResult,
                'correct': showResult && currentQuestion.answer === true,
                'wrong': showResult && selectedOption === 0 && currentQuestion.answer === false
              }"
              @click="selectOption(0)"
            >
              <van-icon name="success" size="28" />
              <span>正确</span>
            </div>
            <div
              class="judge-option"
              :class="{
                'selected': selectedOption === 1 && !showResult,
                'correct': showResult && currentQuestion.answer === false,
                'wrong': showResult && selectedOption === 1 && currentQuestion.answer === true
              }"
              @click="selectOption(1)"
            >
              <van-icon name="cross" size="28" />
              <span>错误</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 结果反馈 -->
      <div v-if="showResult" class="result-section">
        <!-- 结果图标 -->
        <div class="result-icon-container">
          <div class="result-icon" :class="{ correct: isCorrect, wrong: !isCorrect }" ref="resultIconEl">
            <span v-if="isCorrect">✅</span>
            <span v-else>❌</span>
          </div>
          <div class="result-text" :class="{ correct: isCorrect, wrong: !isCorrect }">
            {{ isCorrect ? '回答正确！' : '回答错误' }}
          </div>
        </div>
        <div v-if="!isCorrect" class="correct-answer">
          正确答案: {{ getCorrectAnswerText() }}
        </div>
        <div class="explanation" v-if="currentQuestion.explanation">
          <div class="explanation-title">📖 解析</div>
          <div class="explanation-content">{{ currentQuestion.explanation }}</div>
        </div>
        <van-button
          type="primary"
          block
          round
          style="margin-top: 20px;"
          @click="nextQuestion"
        >
          {{ isLastQuestion ? '查看结果' : '下一题' }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores'
import { gsap } from 'gsap'
import { loadAllQuestions, filterQuestions, typeNames, difficultyNames, chapterNames, calculateStars, filterUnlockedQuestions } from '../utils/questionLoader'
import { playCorrect, playWrong, playCombo, playClick } from '../utils/audio'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

// 状态
const loading = ref(true)
const questions = ref([])
const currentIndex = ref(0)
const selectedOption = ref(null)
const showResult = ref(false)
const isCorrect = ref(false)
const combo = ref(0)
const comboEl = ref(null)
const comboMilestoneEl = ref(null)
const scoreFloatEl = ref(null)
const resultIconEl = ref(null)
const showScoreFloat = ref(false)
const scoreGain = ref(0)
const showComboMilestone = ref(false)
const milestoneText = ref('')
const milestoneEmoji = ref('')
const timeLimit = ref(0) // 限时秒数
const timeRemaining = ref(0) // 剩余秒数
const timerInterval = ref(null) // 计时器
const isTimeUp = ref(false) // 时间到

// 连击等级配置
const comboLevels = [
  { min: 5, text: '太棒了!', emoji: '🔥', class: 'combo-fire' },
  { min: 10, text: '不可思议!', emoji: '⚡', class: 'combo-lightning' },
  { min: 15, text: '神级连击!', emoji: '👑', class: 'combo-crown' },
  { min: 20, text: '传说!', emoji: '🌟', class: 'combo-legend' }
]

// 游戏标题
const gameTitle = computed(() => {
  if (route.query.mode === 'speed') {
    return `⏱️ 限时挑战 ${route.query.levelId} · ${timeRemaining.value}s`
  }
  if (route.query.mode === 'level') {
    return `关卡 ${route.query.levelId} · ${currentIndex.value + 1}/${questions.value.length}`
  }
  if (route.query.mode === 'daily') {
    return `每日挑战 · ${currentIndex.value + 1}/${questions.value.length}`
  }
  if (route.query.mode === 'wrong') {
    return `错题重练 · ${currentIndex.value + 1}/${questions.value.length}`
  }
  return `答题 · ${currentIndex.value + 1}/${questions.value.length}`
})

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value]
})

// 进度
const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return ((currentIndex.value + 1) / questions.value.length) * 100
})

// 是否最后一题
const isLastQuestion = computed(() => {
  return currentIndex.value === questions.value.length - 1
})

// 题型标签
const typeLabel = computed(() => {
  if (!currentQuestion.value) return ''
  return typeNames[currentQuestion.value.type] || currentQuestion.value.type
})

// 难度标签
const difficultyLabel = computed(() => {
  if (!currentQuestion.value) return ''
  return difficultyNames[currentQuestion.value.difficulty] || ''
})

// 连击样式类
const getComboClass = computed(() => {
  if (combo.value >= 20) return 'combo-legend'
  if (combo.value >= 15) return 'combo-crown'
  if (combo.value >= 10) return 'combo-lightning'
  if (combo.value >= 5) return 'combo-fire'
  return ''
})

// 连击文字
const comboText = computed(() => {
  if (combo.value >= 20) return '传说!'
  if (combo.value >= 15) return '神级!'
  if (combo.value >= 10) return '超神!'
  if (combo.value >= 5) return '很棒!'
  return '连击!'
})

// 连击表情
const comboEmoji = computed(() => {
  if (combo.value >= 20) return '🌟'
  if (combo.value >= 15) return '👑'
  if (combo.value >= 10) return '⚡'
  if (combo.value >= 5) return '🔥'
  return '✨'
})

// 选择选项
const selectOption = (index) => {
  if (showResult.value) return
  playClick() // 播放点击音效
  selectedOption.value = index
  checkAnswer()
}

// 检查答案
const checkAnswer = async () => {
  const question = currentQuestion.value
  let userAns = null

  if (question.type === 'judge') {
    // 判断题：answer 是布尔值 true/false
    // selectedOption: 0 = 正确, 1 = 错误
    isCorrect.value = (selectedOption.value === 0 && question.answer === true) ||
                       (selectedOption.value === 1 && question.answer === false)
    userAns = selectedOption.value === 0 ? true : false
  } else {
    // 选择题：answer 是索引数字
    isCorrect.value = selectedOption.value === question.answer
    userAns = selectedOption.value
  }

  showResult.value = true

  // 保存到store（传递完整题目和用户答案）
  store.answerQuestion(isCorrect.value, 0, question, userAns)

  // 如果是自适应模式，更新难度
  if (route.query.adaptive) {
    store.updateAdaptiveDifficulty()
  }

  // 等待DOM更新后播放动画和音效
  await nextTick()

  if (isCorrect.value) {
    combo.value++
    playCorrect() // 播放正确音效
    playCombo(combo.value) // 播放连击音效

    // 计算得分
    const comboBonus = Math.min(combo.value * 2, 20)
    scoreGain.value = 10 + comboBonus
    showScoreFloat.value = true

    // 连击动画
    if (comboEl.value) {
      gsap.fromTo(comboEl.value,
        { scale: 1.5 },
        { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
      )
    }

    // 检查连击里程碑 (5, 10, 15, 20)
    const milestone = comboLevels.find(l => combo.value === l.min)
    if (milestone) {
      milestoneText.value = milestone.text
      milestoneEmoji.value = milestone.emoji
      showComboMilestone.value = true
      
      await nextTick()
      
      if (comboMilestoneEl.value) {
        // 里程碑全屏动画
        const tl = gsap.timeline({
          onComplete: () => {
            showComboMilestone.value = false
          }
        })
        
        tl.fromTo(comboMilestoneEl.value,
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
        )
        .to(comboMilestoneEl.value, {
          opacity: 0,
          scale: 1.2,
          duration: 0.3,
          delay: 1.2
        })
      }
    }

    // 得分飘字动画
    await nextTick()
    if (scoreFloatEl.value) {
      gsap.fromTo(scoreFloatEl.value,
        { y: 0, opacity: 1, scale: 0.5 },
        { y: -80, opacity: 0, scale: 1.2, duration: 1, ease: 'power2.out', onComplete: () => {
          showScoreFloat.value = false
        }}
      )
    }

    // 正确动画 - 缩放弹出
    await nextTick()
    if (resultIconEl.value) {
      gsap.fromTo(resultIconEl.value,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
      )
      // 添加光晕效果
      gsap.to(resultIconEl.value, {
        boxShadow: '0 0 30px rgba(46, 204, 113, 0.6)',
        duration: 0.3,
        yoyo: true,
        repeat: 1
      })
    }
  } else {
    combo.value = 0
    playWrong() // 播放错误音效

    // 错误动画 - 抖动 + 缩放
    await nextTick()
    if (resultIconEl.value) {
      gsap.fromTo(resultIconEl.value,
        { scale: 0, opacity: 0, x: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
      )
      // 抖动效果
      gsap.to(resultIconEl.value, {
        x: -8,
        duration: 0.08,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut'
      })
    }
  }
}

// 获取正确答案文本
const getCorrectAnswerText = () => {
  const question = currentQuestion.value
  if (question.type === 'choice') {
    return question.options[question.answer]
  } else if (question.type === 'fill') {
    return question.answer.join(' / ')
  } else if (question.type === 'judge') {
    return question.answer ? '正确 ✓' : '错误 ✗'
  }
  return ''
}

// 下一题
const nextQuestion = () => {
  if (isLastQuestion.value) {
    // 关卡模式：保存进度并计算星星
    if (route.query.mode === 'level' && route.query.levelId) {
      const total = questions.value.length
      const accuracy = total > 0 ? store.correctCount / total : 0
      const stars = calculateStars(store.correctCount, total)
      
      store.completeLevel(route.query.levelId, stars, store.score)
    }
    // 传递当前模式参数到结果页
    router.push({ path: '/result', query: { ...route.query } })
  } else {
    currentIndex.value++
    store.currentQuestionIndex++
    selectedOption.value = null
    showResult.value = false
    isCorrect.value = false
  }
}

// 返回首页
const goBack = () => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  // 关卡模式：保存当前进度
  if (route.query.mode === 'level' && route.query.levelId) {
    store.saveLevelProgress()
  }
  store.resetGame()
  router.push('/')
}

// 初始化：加载题库
onMounted(async () => {
  const mode = route.query.mode || 'random'
  const chapter = route.query.chapter || ''
  const difficulty = route.query.difficulty ? parseInt(route.query.difficulty) : null
  const type = route.query.type || ''
  const count = route.query.count ? parseInt(route.query.count) : 10
  const isAdaptive = route.query.adaptive === '1'
  const unlockedOnly = route.query.unlockedOnly === '1'

  try {
    let allQuestions = []

    if (mode === 'wrong') {
      // 错题重练模式
      allQuestions = store.wrongQuestions.map(q => ({
        ...q,
        options: q.options || [],
        answer: q.type === 'judge' ? q.answer : (q.type === 'choice' ? q.answer : (q.answer || []))
      }))
      if (allQuestions.length === 0) {
        // 没有错题，提示并返回
        alert('暂无错题记录，快去答题吧！')
        router.push('/')
        return
      }
    } else if (mode === 'level') {
      // 关卡模式：题目已在 store.startLevel 中设置
      questions.value = store.questions
      loading.value = false
      return
    } else {
      // 从JSON加载题库
      const loaded = await loadAllQuestions()
      if (loaded.length === 0) {
        alert('题库加载失败，请刷新重试')
        return
      }

      // 如果是只使用已解锁题目，先过滤
      let baseQuestions = loaded
      if (unlockedOnly) {
        baseQuestions = filterUnlockedQuestions(loaded, store.unlockedLevels)
      }

      // 自适应模式下，使用当前store中的难度
      let targetDifficulty = difficulty
      if (isAdaptive) {
        targetDifficulty = store.currentDifficulty
      }

      allQuestions = filterQuestions(baseQuestions, {
        chapter: chapter || undefined,
        difficulty: targetDifficulty || undefined,
        type: type || undefined,
        count: count,
        shuffle: true
      })
    }

    questions.value = allQuestions
    store.startGame(allQuestions, isAdaptive ? store.currentDifficulty : null)
    loading.value = false

    // 限时模式启动计时器
    if (route.query.mode === 'speed' && route.query.timeLimit) {
      timeLimit.value = parseInt(route.query.timeLimit)
      timeRemaining.value = timeLimit.value
      timerInterval.value = setInterval(() => {
        timeRemaining.value--
        if (timeRemaining.value <= 0) {
          clearInterval(timerInterval.value)
          isTimeUp.value = true
          // 时间到，自动跳转结果
          if (route.query.levelId) {
            const lid = route.query.levelId
            const total = questions.value.length
            const stars = calculateStars(store.correctCount, total)
            store.completeLevel(lid.replace('-speed', ''), stars, store.score)
          }
          router.push({ path: '/result', query: { ...route.query } })
        }
      }, 1000)
    }
  } catch (error) {
    console.error('初始化游戏失败:', error)
    alert('加载题库失败，请刷新重试')
  }
})
</script>

<style scoped>
.game {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 46px;
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  flex-direction: column;
  gap: 16px;
  color: #666;
  font-size: 16px;
}

.progress-section {
  padding: 16px;
  background: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
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

.progress-text {
  font-size: 14px;
  color: #666;
  min-width: 50px;
  text-align: right;
}

.combo-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #FF9F43, #F9CA24);
  color: white;
  font-weight: bold;
  overflow: hidden;
}

.combo-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.combo-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.combo-count {
  font-size: 32px;
}

.combo-text {
  font-size: 18px;
}

/* 连击等级样式 */
.combo-fire {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.combo-fire .combo-bg {
  background: radial-gradient(circle, rgba(255,100,0,0.3) 0%, transparent 70%);
  animation: fire-pulse 0.5s ease infinite alternate;
}

.combo-lightning {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.combo-lightning .combo-bg {
  background: radial-gradient(circle, rgba(155,89,182,0.4) 0%, transparent 70%);
  animation: lightning-flash 0.3s ease infinite;
}

.combo-crown {
  background: linear-gradient(135deg, #f39c12, #d68910);
}

.combo-crown .combo-bg {
  background: radial-gradient(circle, rgba(243,156,18,0.4) 0%, transparent 70%);
  animation: crown-glow 0.8s ease infinite alternate;
}

.combo-legend {
  background: linear-gradient(135deg, #1abc9c, #16a085);
}

.combo-legend .combo-bg {
  background: radial-gradient(circle, rgba(26,188,156,0.5) 0%, transparent 70%);
  animation: legend-shine 1s ease infinite alternate;
}

.combo-effect {
  font-size: 24px;
  animation: fire 0.3s ease infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes fire {
  from { transform: scale(1) rotate(-5deg); }
  to { transform: scale(1.2) rotate(5deg); }
}

@keyframes fire-pulse {
  from { opacity: 0.3; transform: scale(1); }
  to { opacity: 0.6; transform: scale(1.1); }
}

@keyframes lightning-flash {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
}

@keyframes crown-glow {
  from { opacity: 0.3; }
  to { opacity: 0.7; }
}

@keyframes legend-shine {
  from { opacity: 0.4; transform: scale(1); }
  to { opacity: 0.8; transform: scale(1.15); }
}

/* 连击里程碑特效 */
.combo-milestone {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.milestone-content {
  text-align: center;
  color: white;
  animation: milestone-bounce 0.5s ease;
}

.milestone-emoji {
  font-size: 80px;
  margin-bottom: 16px;
  animation: emoji-spin 0.6s ease;
}

.milestone-text {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.milestone-combo {
  font-size: 24px;
  color: #F9CA24;
}

@keyframes milestone-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes emoji-spin {
  0% { transform: rotate(-180deg) scale(0); }
  100% { transform: rotate(0) scale(1); }
}

/* 题目切换动画 */
.question-slide-enter-active,
.question-slide-leave-active {
  transition: all 0.3s ease;
}

.question-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.question-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 得分飘字 */
.score-float {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  pointer-events: none;
  z-index: 1000;
}

.question-section {
  padding: 20px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.question-type {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.question-type.choice {
  background: #667eea;
  color: white;
}

.question-type.fill {
  background: #2ecc71;
  color: white;
}

.question-type.judge {
  background: #e67e22;
  color: white;
}

.question-difficulty {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.diff-1 {
  background: #d4edda;
  color: #155724;
}

.diff-2 {
  background: #fff3cd;
  color: #856404;
}

.diff-3 {
  background: #f8d7da;
  color: #721c24;
}

.question-content {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* 选择题 */
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.option-item:active {
  transform: scale(0.98);
}

.option-item.selected {
  border-color: #667eea;
  background: #f0f3ff;
}

.option-item.correct {
  border-color: #2ecc71;
  background: #e8f8f5;
}

.option-item.wrong {
  border-color: #e74c3c;
  background: #fdedec;
}

.option-label {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.option-item.correct .option-label {
  background: #2ecc71;
  color: white;
}

.option-item.wrong .option-label {
  background: #e74c3c;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 16px;
}

.option-icon {
  margin-left: 8px;
  flex-shrink: 0;
}

.correct-icon {
  color: #2ecc71;
}

.wrong-icon {
  color: #e74c3c;
}

/* 填空题 */
.fill-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

/* 判断题 */
.judge-section {
  display: flex;
  gap: 16px;
}

.judge-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.judge-option:active {
  transform: scale(0.98);
}

.judge-option.selected {
  border-color: #667eea;
  background: #f0f3ff;
}

.judge-option.correct {
  border-color: #2ecc71;
  background: #e8f8f5;
  color: #2ecc71;
}

.judge-option.wrong {
  border-color: #e74c3c;
  background: #fdedec;
  color: #e74c3c;
}

/* 结果反馈 */
.result-section {
  padding: 20px;
  text-align: center;
}

.result-icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.result-icon.correct {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  animation: correctPulse 0.6s ease;
}

.result-icon.wrong {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  animation: wrongShake 0.5s ease;
}

@keyframes correctPulse {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-10px); }
  80% { transform: translateX(10px); }
}

.result-text {
  font-size: 18px;
  font-weight: bold;
}

.result-text.correct {
  color: #27ae60;
}

.result-text.wrong {
  color: #e74c3c;
}

.correct-answer {
  font-size: 16px;
  color: #2ecc71;
  margin-bottom: 16px;
  font-weight: bold;
}

.explanation {
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: left;
  margin-bottom: 20px;
}

.explanation-title {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
  font-size: 16px;
}

.explanation-content {
  color: #666;
  line-height: 1.6;
  font-size: 15px;
}

/* 限时倒计时 */
.timer-section {
  padding: 8px 16px;
  background: white;
}

.timer-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.timer-fill {
  height: 100%;
  background: #667eea;
  border-radius: 3px;
  transition: width 1s linear;
}

.timer-bar.warning .timer-fill {
  background: #f39c12;
}

.timer-bar.danger .timer-fill {
  background: #e74c3c;
  animation: pulse-timer 0.5s infinite;
}

@keyframes pulse-timer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-text {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.timer-text.warning {
  color: #f39c12;
}

.timer-text.danger {
  color: #e74c3c;
}
</style>
