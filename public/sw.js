// Service Worker for 时空探险家 PWA
const CACHE_NAME = 'space-time-explorer-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/history-grade7-complete.json'
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

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// 拦截请求，优先从缓存读取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中直接返回
      if (response) {
        return response
      }
      
      // 否则发起网络请求
      return fetch(event.request).then((fetchResponse) => {
        // 只缓存成功的 GET 请求
        if (
          fetchResponse.status === 200 &&
          fetchResponse.type === 'basic' &&
          event.request.method === 'GET'
        ) {
          const responseToCache = fetchResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return fetchResponse
      }).catch(() => {
        // 网络失败时返回离线页面（如果有的话）
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
    })
  )
})
