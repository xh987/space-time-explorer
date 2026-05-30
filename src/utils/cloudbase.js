import cloudbase from '@cloudbase/js-sdk'

// 初始化 CloudBase
const envId = 'space-time-explorer-d2bp1cbc071c'
const region = 'ap-shanghai'

// Publishable Key - 用于匿名访问数据库
// 请在 CloudBase 控制台 → API Key 配置中生成
const accessKey = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL3NwYWNlLXRpbWUtZXhwbG9yZXItZDJicDFjYmMwNzFjLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJzcGFjZS10aW1lLWV4cGxvcmVyLWQyYnAxY2JjMDcxYyIsImV4cCI6NDA4MzgzNDU0MiwiaWF0IjoxNzgwMTUxMzQyLCJub25jZSI6IlBGS2hkcDVpUWlPN3dkX3lMaHczY0EiLCJhdF9oYXNoIjoiUEZLaGRwNWlRaU83d2RfeUxodzNjQSIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJzcGFjZS10aW1lLWV4cGxvcmVyLWQyYnAxY2JjMDcxYyIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.nM3_gkHYRc0JTs9wWPBSS4qCxSEymFDK_VkXkY2psJQEm6GSN9nyk9GyhXPRaLVJ3Za6Pe9Q_jZFkx3xQIC1PKLmXQ8E3RiSCoaoE7fPYk2AKAv4PmHt_CyvjCdNdRe_VyDWUD1n0mlu_J1dpFnq56CFouMdaPw2vOd3ujcNNFTVEy5mEpr4aC8IhFqgq2L78yZA37T8oPiHPvE57uuByyOoj4HnSal41Bt1_Iwr_dpi0LZojhJ8HiLTyjGnWIPbHQBSN6onVHD0qU6vinQorg4E4jMGXnmQ_t5e6B3yeVBMpX5WV4iOWmTEUyiAFwywTgrtpP6puHcOTsHlTm0r0A'

let app = null
let db = null

try {
  const initConfig = {
    env: envId,
    region: region
  }
  
  // 如果有 Publishable Key，添加到配置中
  if (accessKey) {
    initConfig.accessKey = accessKey
  }
  
  app = cloudbase.init(initConfig)
  db = app.database()
  console.log('CloudBase initialized successfully, env:', envId)
} catch (e) {
  console.warn('CloudBase init failed, running in local-only mode:', e)
}

export { app, db, envId }
