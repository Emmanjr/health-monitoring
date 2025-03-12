/* global self */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log("Workbox is loaded");
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
} else {
  console.log("Workbox didn't load");
}

self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
  event.waitUntil(clients.claim());
});
