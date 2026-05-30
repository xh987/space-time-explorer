<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { onMounted } from 'vue'
import { initGuestMode, loadGameData } from './utils/cloudSync'
import { useGameStore } from './stores'

const store = useGameStore()

onMounted(async () => {
  try {
    // 初始化游客模式
    initGuestMode()
    // 如果已登录，加载云端数据
    const cloudData = await loadGameData()
    if (cloudData) {
      // 合并云端数据到本地store
      store.mergeFromCloud(cloudData)
    }
  } catch (e) {
    console.log('Cloud init failed:', e)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}
</style>
