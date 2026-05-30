/**
 * 音效管理器 - 使用 Web Audio API 生成音效 + HTML5 Audio 播放背景音乐
 */

// 背景音乐配置 - 可以替换为本地文件路径
const BGM_CONFIG = {
  url: 'https://cdn.pixabay.com/audio/2024/11/01/audio_3cfe5c4eb5.mp3',
  fallbackUrl: 'https://cdn.pixabay.com/audio/2023/10/28/audio_3e8b2e8a7b.mp3',
  loop: true,
  fadeInDuration: 2
}

class AudioManager {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.volume = 0.5
    this.bgmEnabled = true
    this.bgmVolume = 0.2
    this.bgmAudio = null
    this.isPlayingBGM = false
    this.bgmSource = BGM_CONFIG.url
  }

  // 初始化音频上下文（必须用户交互后才能调用）
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // 设置是否启用音效
  setEnabled(enabled) {
    this.enabled = enabled
  }

  // 设置音量 0-1
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  // 播放正确音效（清脆的上升音）
  playCorrect() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    // 上升音调
    osc.frequency.setValueAtTime(523.25, t) // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.1) // C6

    gain.gain.setValueAtTime(this.volume * 0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3)

    osc.start(t)
    osc.stop(t + 0.3)
  }

  // 播放错误音效（低沉的下降音）
  playWrong() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, t)
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3)

    gain.gain.setValueAtTime(this.volume * 0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3)

    osc.start(t)
    osc.stop(t + 0.3)
  }

  // 播放连击音效（随连击数升高）
  playCombo(combo) {
    if (!this.enabled || combo < 2) return
    this.init()

    const t = this.ctx.currentTime
    const baseFreq = 440 + (combo * 50) // 随连击升高

    // 播放和弦
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]
    
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.frequency.value = freq
      gain.gain.setValueAtTime(this.volume * 0.1, t + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3 + i * 0.05)

      osc.start(t + i * 0.05)
      osc.stop(t + 0.3 + i * 0.05)
    })
  }

  // 播放按钮点击音效
  playClick() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.frequency.value = 800
    gain.gain.setValueAtTime(this.volume * 0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05)

    osc.start(t)
    osc.stop(t + 0.05)
  }

  // 播放得分音效
  playScore() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    
    // 快速上升音
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.frequency.value = 600 + i * 200
      gain.gain.setValueAtTime(this.volume * 0.15, t + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15 + i * 0.05)

      osc.start(t + i * 0.05)
      osc.stop(t + 0.15 + i * 0.05)
    }
  }

  // 播放升级音效
  playLevelUp() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    
    // 华丽的上升音阶
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
    
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.frequency.value = freq
      gain.gain.setValueAtTime(this.volume * 0.2, t + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4 + i * 0.1)

      osc.start(t + i * 0.1)
      osc.stop(t + 0.4 + i * 0.1)
    })
  }

  // 播放成就解锁音效
  playAchievement() {
    if (!this.enabled) return
    this.init()

    const t = this.ctx.currentTime
    
    // 胜利号角式音效
    const pattern = [
      { freq: 523.25, time: 0, duration: 0.2 },
      { freq: 523.25, time: 0.2, duration: 0.2 },
      { freq: 783.99, time: 0.4, duration: 0.4 },
      { freq: 659.25, time: 0.5, duration: 0.2 },
      { freq: 783.99, time: 0.7, duration: 0.5 }
    ]

    pattern.forEach(({ freq, time, duration }) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(this.volume * 0.15, t + time)
      gain.gain.exponentialRampToValueAtTime(0.01, t + time + duration)

      osc.start(t + time)
      osc.stop(t + time + duration)
    })
  }

  // ========== 背景音乐系统（使用 HTML5 Audio）==========
  
  // 设置背景音乐开关
  setBGMEnabled(enabled) {
    this.bgmEnabled = enabled
    if (enabled && !this.isPlayingBGM) {
      this.playBGM()
    } else if (!enabled && this.isPlayingBGM) {
      this.stopBGM()
    }
  }

  // 设置背景音乐音量
  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol))
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume
    }
  }

  // 设置背景音乐源（可替换为本地文件）
  setBGMSource(url) {
    this.bgmSource = url
    // 如果正在播放，重新加载
    if (this.isPlayingBGM) {
      this.stopBGM()
      this.playBGM()
    }
  }

  // 播放背景音乐 - 使用 HTML5 Audio
  playBGM() {
    if (!this.bgmEnabled || this.isPlayingBGM) return

    // 创建音频元素
    this.bgmAudio = new Audio(this.bgmSource)
    this.bgmAudio.loop = BGM_CONFIG.loop
    this.bgmAudio.volume = 0 // 从0开始，然后淡入
    
    // 错误处理 - 尝试备用音源，最终兜底用 Web Audio API 生成环境音
    this.bgmAudio.onerror = () => {
      console.warn('音源加载失败')
      if (this.bgmSource !== BGM_CONFIG.fallbackUrl) {
        console.warn('尝试备用音源')
        this.bgmSource = BGM_CONFIG.fallbackUrl
        this.stopBGM()
        setTimeout(() => this.playBGM(), 100)
      } else {
        console.warn('备用音源也失败，使用 Web Audio API 生成环境音')
        this.isPlayingBGM = false
        this.bgmAudio = null
        this.generateFallbackBGM()
      }
    }

    // 播放
    this.bgmAudio.play().then(() => {
      this.isPlayingBGM = true
      // 淡入效果
      this.fadeInBGM()
    }).catch(err => {
      console.error('背景音乐播放失败:', err)
      // 可能是自动播放策略限制，等待用户交互
      this.isPlayingBGM = false
      this.bgmAudio = null
    })
  }

  // 淡入背景音乐
  fadeInBGM() {
    if (!this.bgmAudio) return
    
    const targetVolume = this.bgmVolume
    const duration = BGM_CONFIG.fadeInDuration * 1000
    const steps = 20
    const stepDuration = duration / steps
    const volumeStep = targetVolume / steps
    let currentStep = 0

    const fadeInterval = setInterval(() => {
      currentStep++
      if (!this.bgmAudio || currentStep >= steps) {
        clearInterval(fadeInterval)
        if (this.bgmAudio) {
          this.bgmAudio.volume = targetVolume
        }
        return
      }
      this.bgmAudio.volume = volumeStep * currentStep
    }, stepDuration)
  }

  // 使用 Web Audio API 生成轻柔的和弦环境音作为兜底
  generateFallbackBGM() {
    if (!this.bgmEnabled || this.isPlayingBGM) return
    this.init()

    this.isPlayingBGM = true
    this._fallbackNodes = []

    const masterGain = this.ctx.createGain()
    masterGain.gain.setValueAtTime(0, this.ctx.currentTime)
    masterGain.connect(this.ctx.destination)
    this._fallbackNodes.push(masterGain)

    // 淡入
    const targetVol = this.bgmVolume * 0.4
    masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + BGM_CONFIG.fadeInDuration)

    // 和弦音符频率 (C大调和弦: C4, E4, G4, C5)
    const chordFreqs = [261.63, 329.63, 392.00, 523.25]

    const playChord = () => {
      if (!this.isPlayingBGM) return
      const now = this.ctx.currentTime

      chordFreqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq

        // 每个音符错开一点时间，产生柔和的琶音效果
        const offset = i * 0.3
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(targetVol * 0.3, now + offset + 0.5)
        gain.gain.linearRampToValueAtTime(0, now + offset + 3.5)

        osc.connect(gain)
        gain.connect(masterGain)

        osc.start(now + offset)
        osc.stop(now + offset + 4)
        this._fallbackNodes.push(osc, gain)
      })

      // 每4秒循环一次
      this._fallbackTimer = setTimeout(playChord, 4000)
    }

    playChord()
    this._fallbackMasterGain = masterGain
  }

  // 停止背景音乐
  stopBGM() {
    this.isPlayingBGM = false

    // 停止 Web Audio API 生成的环境音
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer)
      this._fallbackTimer = null
    }
    if (this._fallbackNodes) {
      this._fallbackNodes.forEach(node => {
        try { node.stop && node.stop() } catch (e) {}
        try { node.disconnect() } catch (e) {}
      })
      this._fallbackNodes = []
    }
    if (this._fallbackMasterGain) {
      try { this._fallbackMasterGain.disconnect() } catch (e) {}
      this._fallbackMasterGain = null
    }
    
    if (this.bgmAudio) {
      // 淡出效果
      const currentVolume = this.bgmAudio.volume
      const fadeOutDuration = 1000
      const steps = 10
      const stepDuration = fadeOutDuration / steps
      const volumeStep = currentVolume / steps
      let currentStep = 0

      const fadeInterval = setInterval(() => {
        currentStep++
        if (!this.bgmAudio || currentStep >= steps) {
          clearInterval(fadeInterval)
          if (this.bgmAudio) {
            this.bgmAudio.pause()
            this.bgmAudio.currentTime = 0
            this.bgmAudio = null
          }
          return
        }
        this.bgmAudio.volume = currentVolume - (volumeStep * currentStep)
      }, stepDuration)
    }
  }

  // 暂停背景音乐
  pauseBGM() {
    if (this.bgmAudio && this.isPlayingBGM) {
      this.bgmAudio.pause()
    }
  }

  // 恢复背景音乐
  resumeBGM() {
    if (this.bgmAudio && this.bgmEnabled) {
      this.bgmAudio.play().catch(() => {})
    }
  }
}

// 单例导出
export const audioManager = new AudioManager()

// 便捷函数
export const playCorrect = () => audioManager.playCorrect()
export const playWrong = () => audioManager.playWrong()
export const playCombo = (combo) => audioManager.playCombo(combo)
export const playClick = () => audioManager.playClick()
export const playScore = () => audioManager.playScore()
export const playLevelUp = () => audioManager.playLevelUp()
export const playAchievement = () => audioManager.playAchievement()

// 背景音乐控制
export const playBGM = () => audioManager.playBGM()
export const stopBGM = () => audioManager.stopBGM()
export const pauseBGM = () => audioManager.pauseBGM()
export const resumeBGM = () => audioManager.resumeBGM()
export const setBGMEnabled = (enabled) => audioManager.setBGMEnabled(enabled)
export const setBGMVolume = (vol) => audioManager.setBGMVolume(vol)
export const setSoundEnabled = (enabled) => audioManager.setEnabled(enabled)
export const setSoundVolume = (vol) => audioManager.setVolume(vol)
