const CACHE_NAME = "axel-marketplace-v2"

const urlsToCache = [
  "/",
  "/produits",
  "/panier",
  "/comparateur",
  "/faq",
  "/contact",
  "/a-propos",
  "/cgu",
  "/confidentialite",
  "/manifest.json",
  "/images/logo-favicon.png",
  "/icons/logo-192.png",
  "/icons/logo-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name)
      }))
    )
  )
})
