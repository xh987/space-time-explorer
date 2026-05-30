import cloudbase from '@cloudbase/js-sdk'

// 初始化 CloudBase
const envId = 'space-time-explorer-d2bp1cbc071c'

let app = null
let db = null

try {
  app = cloudbase.init({
    env: envId
  })
  db = app.database()
  console.log('CloudBase initialized successfully')
} catch (e) {
  console.warn('CloudBase init failed, running in local-only mode:', e)
}

export { app, db, envId }
