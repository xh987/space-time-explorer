// Service Worker for 时空探险家 PWA
const CACHE_NAME = 'space-time-explorer-v4'
const BASE = '/space1'
const STATIC_ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/data/history-grade7-complete.json'
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 激活时清理旧缓存并通知客户端
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      // 通知所有客户端有新版本
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_NAME
          })
        })
      })
    })
  )
  self.clients.claim()
})

// 拦截请求，优先从缓存读取，但JS/CSS/HTML始终检查更新
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // JS/CSS/HTML文件：网络优先，失败回退缓存
  const isAsset = url.pathname.match(/\.(js|css|html)$/)
  const isIndex = url.pathname === BASE + '/' || url.pathname === BASE + '/index.html'
  
  if (isAsset || isIndex) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          // 更新缓存
          if (response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // 网络失败使用缓存
          return caches.match(request)
        })
    )
    return
  }
  
  // 其他资源：缓存优先
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response
      }
      return fetch(request).then((fetchResponse) => {
        if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
          const responseToCache = fetchResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return fetchResponse
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match(BASE + '/index.html')
        }
      })
    })
  )
})

// 监听消息
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
