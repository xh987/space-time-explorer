import { db } from './cloudbase'

const USER_COLLECTION = 'users'
const DATA_COLLECTION = 'user_game_data'

// 本地存储当前用户信息
const STORAGE_KEY = 'space_time_user'

/**
 * 获取当前登录用户
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY)
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  } catch (e) {
    return null
  }
}

/**
 * 判断是否已登录（正式用户，非游客）
 */
export function isLoggedIn() {
  const user = getCurrentUser()
  return user && user.username && !user.isGuest
}

/**
 * 判断是否是游客状态
 */
export function isGuest() {
  const user = getCurrentUser()
  return !user || user.isGuest
}

/**
 * 保存登录状态到本地
 */
function saveLoginState(userInfo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo))
}

/**
 * 清除登录状态
 */
function clearLoginState() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 生成游客ID
 */
function generateGuestId() {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 初始化游客模式
 */
export function initGuestMode() {
  const existing = getCurrentUser()
  if (existing && existing.isGuest) {
    return existing
  }
  
  const guestUser = {
    userId: generateGuestId(),
    username: '游客',
    isGuest: true,
    createdAt: Date.now()
  }
  saveLoginState(guestUser)
  return guestUser
}

/**
 * 用户名密码注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{success: boolean, message: string, user?: object}>}
 */
export async function register(username, password) {
  if (!db) {
    return { success: false, message: '云服务不可用' }
  }
  
  try {
    // 检查用户名是否已存在
    const checkRes = await db.collection(USER_COLLECTION)
      .where({ username })
      .get()
    
    if (checkRes.data && checkRes.data.length > 0) {
      return { success: false, message: '用户名已存在' }
    }
    
    // 创建新用户
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const userInfo = {
      userId,
      username,
      password, // 实际应用中应该加密
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    }
    
    await db.collection(USER_COLLECTION).add(userInfo)
    
    // 保存登录状态
    const loginInfo = {
      userId,
      username,
      isGuest: false,
      loginAt: Date.now()
    }
    saveLoginState(loginInfo)
    
    return { success: true, message: '注册成功', user: loginInfo }
  } catch (e) {
    console.error('Register failed:', e)
    return { success: false, message: '注册失败：' + (e.message || '网络错误') }
  }
}

/**
 * 用户名密码登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{success: boolean, message: string, user?: object}>}
 */
export async function login(username, password) {
  if (!db) {
    return { success: false, message: '云服务不可用' }
  }
  
  try {
    const res = await db.collection(USER_COLLECTION)
      .where({ username, password })
      .get()
    
    if (!res.data || res.data.length === 0) {
      return { success: false, message: '用户名或密码错误' }
    }
    
    const userRecord = res.data[0]
    
    // 更新最后登录时间
    await db.collection(USER_COLLECTION)
      .doc(userRecord._id)
      .update({ lastLoginAt: Date.now() })
    
    // 保存登录状态
    const loginInfo = {
      userId: userRecord.userId,
      username: userRecord.username,
      isGuest: false,
      loginAt: Date.now()
    }
    saveLoginState(loginInfo)
    
    return { success: true, message: '登录成功', user: loginInfo }
  } catch (e) {
    console.error('Login failed:', e)
    return { success: false, message: '登录失败：' + (e.message || '网络错误') }
  }
}

/**
 * 退出登录
 */
export function logout() {
  clearLoginState()
  // 重新初始化为游客
  return initGuestMode()
}

/**
 * 保存游戏数据到云端
 * @param {object} data - 游戏数据
 */
export async function saveGameData(data) {
  if (!db) {
    console.warn('CloudBase db not available')
    return { success: false }
  }
  
  const user = getCurrentUser()
  if (!user || !user.userId) {
    console.warn('No user logged in')
    return { success: false }
  }
  
  try {
    const collection = db.collection(DATA_COLLECTION)
    
    // 查询是否已有记录
    const res = await collection.where({ userId: user.userId }).get()
    
    const dataToSave = {
      ...data,
      _localUpdatedAt: Date.now()
    }
    
    if (res.data && res.data.length > 0) {
      // 更新已有记录
      const docId = res.data[0]._id
      await collection.doc(docId).update({
        data: dataToSave,
        updatedAt: Date.now()
      })
    } else {
      // 新增记录
      await collection.add({
        userId: user.userId,
        data: dataToSave,
        updatedAt: Date.now()
      })
    }
    
    return { success: true }
  } catch (e) {
    console.warn('Save game data failed:', e)
    return { success: false }
  }
}

/**
 * 从云端加载游戏数据
 * @returns {Promise<object|null>} 游戏数据或null
 */
export async function loadGameData() {
  if (!db) {
    console.warn('CloudBase db not available')
    return null
  }
  
  const user = getCurrentUser()
  if (!user || !user.userId) {
    return null
  }
  
  try {
    const res = await db.collection(DATA_COLLECTION)
      .where({ userId: user.userId })
      .get()
    
    if (res.data && res.data.length > 0) {
      return {
        ...res.data[0].data,
        _cloudUpdatedAt: res.data[0].updatedAt
      }
    }
    return null
  } catch (e) {
    console.warn('Load game data failed:', e)
    return null
  }
}

/**
 * 同步本地数据到云端
 * 游客注册后调用，将游客数据迁移到正式账户
 * @param {object} localData - 本地游戏数据
 */
export async function migrateGuestData(localData) {
  if (!db) {
    return { success: false, message: '云服务不可用' }
  }
  
  const user = getCurrentUser()
  if (!user || !user.userId || user.isGuest) {
    return { success: false, message: '未登录或仍是游客状态' }
  }
  
  try {
    await saveGameData(localData)
    return { success: true, message: '数据迁移成功' }
  } catch (e) {
    console.error('Migrate guest data failed:', e)
    return { success: false, message: '数据迁移失败' }
  }
}

/**
 * 检查用户名是否可用
 */
export async function checkUsernameAvailable(username) {
  if (!db) {
    return { available: false, message: '云服务不可用' }
  }
  
  try {
    const res = await db.collection(USER_COLLECTION)
      .where({ username })
      .get()
    
    return {
      available: !(res.data && res.data.length > 0),
      message: res.data && res.data.length > 0 ? '用户名已存在' : '用户名可用'
    }
  } catch (e) {
    return { available: false, message: '检查失败' }
  }
}
