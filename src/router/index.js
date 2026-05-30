import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Game from '../views/Game.vue'
import Result from '../views/Result.vue'
import Profile from '../views/Profile.vue'
import Report from '../views/Report.vue'
import ChapterMap from '../views/ChapterMap.vue'
import CardCollection from '../views/CardCollection.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/game',
    name: 'Game',
    component: Game
  },
  {
    path: '/result',
    name: 'Result',
    component: Result
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/report',
    name: 'Report',
    component: Report
  },
  {
    path: '/chapter-map',
    name: 'ChapterMap',
    component: ChapterMap
  },
  {
    path: '/card-collection',
    name: 'CardCollection',
    component: CardCollection
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('../views/Timeline.vue')
  },
  {
    path: '/timeline/:eventId',
    name: 'EventDetail',
    component: () => import('../views/EventDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/space1/'),
  routes
})

export default router
