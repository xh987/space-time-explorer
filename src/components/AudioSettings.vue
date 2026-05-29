<template>
  <div class="audio-settings">
    <van-popup
      v-model:show="show"
      position="bottom"
      round
      :style="{ height: 'auto' }"
    >
      <div class="settings-panel">
        <div class="panel-header">
          <span class="panel-title">🎵 音效设置</span>
          <van-icon name="cross" size="20" @click="show = false" />
        </div>

        <!-- 背景音乐 -->
        <div class="setting-item">
          <div class="setting-label">
            <van-icon name="music-o" size="20" color="#667eea" />
            <span>背景音乐</span>
          </div>
          <van-switch v-model="bgmEnabled" @change="onBGMChange" />
        </div>
        <div class="setting-item slider-item" v-if="bgmEnabled">
          <span class="slider-label">音量</span>
          <van-slider
            v-model="bgmVolume"
            :min="0"
            :max="100"
            @change="onBGMVolumeChange"
          />
          <span class="slider-value">{{ bgmVolume }}%</span>
        </div>

        <!-- 音效 -->
        <div class="setting-item">
          <div class="setting-label">
            <van-icon name="volume-o" size="20" color="#e74c3c" />
            <span>答题音效</span>
          </div>
          <van-switch v-model="soundEnabled" @change="onSoundChange" />
        </div>
        <div class="setting-item slider-item" v-if="soundEnabled">
          <span class="slider-label">音量</span>
          <van-slider
            v-model="soundVolume"
            :min="0"
            :max="100"
            @change="onSoundVolumeChange"
          />
          <span class="slider-value">{{ soundVolume }}%</span>
        </div>

        <!-- 测试按钮 -->
        <div class="test-buttons">
          <van-button size="small" type="primary" plain @click="testCorrect">
            测试正确音效
          </van-button>
          <van-button size="small" type="danger" plain @click="testWrong">
            测试错误音效
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 悬浮按钮 -->
    <div class="audio-fab" @click="show = true">
      <van-icon name="music-o" size="24" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  audioManager,
  playCorrect,
  playWrong,
  setBGMEnabled,
  setBGMVolume,
  setSoundEnabled,
  setSoundVolume
} from '../utils/audio'

const show = ref(false)
const bgmEnabled = ref(true)
const soundEnabled = ref(true)
const bgmVolume = ref(20)
const soundVolume = ref(50)

onMounted(() => {
  // 从本地存储读取设置
  const saved = localStorage.getItem('audio-settings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      bgmEnabled.value = settings.bgmEnabled ?? true
      soundEnabled.value = settings.soundEnabled ?? true
      bgmVolume.value = Math.round((settings.bgmVolume ?? 0.2) * 100)
      soundVolume.value = Math.round((settings.soundVolume ?? 0.5) * 100)
      
      // 应用设置
      setBGMEnabled(bgmEnabled.value)
      setBGMVolume(settings.bgmVolume ?? 0.2)
      setSoundEnabled(soundEnabled.value)
      setSoundVolume(settings.soundVolume ?? 0.5)
    } catch (e) {
      console.error('读取音频设置失败:', e)
    }
  } else {
    // 默认开启背景音乐
    setBGMEnabled(true)
  }
})

const saveSettings = () => {
  const settings = {
    bgmEnabled: bgmEnabled.value,
    soundEnabled: soundEnabled.value,
    bgmVolume: bgmVolume.value / 100,
    soundVolume: soundVolume.value / 100
  }
  localStorage.setItem('audio-settings', JSON.stringify(settings))
}

const onBGMChange = (val) => {
  setBGMEnabled(val)
  saveSettings()
}

const onBGMVolumeChange = (val) => {
  setBGMVolume(val / 100)
  saveSettings()
}

const onSoundChange = (val) => {
  setSoundEnabled(val)
  saveSettings()
}

const onSoundVolumeChange = (val) => {
  setSoundVolume(val / 100)
  saveSettings()
}

const testCorrect = () => {
  playCorrect()
}

const testWrong = () => {
  playWrong()
}
</script>

<style scoped>
.audio-settings {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 100;
}

.audio-fab {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.audio-fab:active {
  transform: scale(0.95);
}

.settings-panel {
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #333;
}

.slider-item {
  padding-left: 30px;
  gap: 12px;
}

.slider-label {
  font-size: 13px;
  color: #999;
  min-width: 40px;
}

.slider-value {
  font-size: 13px;
  color: #667eea;
  min-width: 45px;
  text-align: right;
}

.test-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.test-buttons .van-button {
  flex: 1;
}
</style>
