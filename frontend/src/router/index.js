import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/userprofile',
    name: 'userprofile',
    meta: {
      isAuthenticated: true
    },
    component: () => import(/* webpackChunkName: "about" */ '../views/UserProfile.vue')
  },
  {
    path: '/profilesetup',
    name: 'profilesetup',
    meta: {
      isAuthenticated: true
    },
    component: () => import(/* webpackChunkName: "about" */ '../views/incomplete-auth.vue')
  },
  {
    path: '/about',
    name: 'about',
    meta: {
      isAuthenticated: true
    },
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/elections',
    name: 'elections',
    component: () => import(/* webpackChunkName: "about" */ '../views/electionView.vue')
  },
  {
    path: '/myelections',
    name: 'myelections',
    component: () => import(/* webpackChunkName: "about" */ '../views/myElections.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    meta: {
      isAuthenticated: true
    },
    component: () => import(/* webpackChunkName: "about" */ '../views/AdminView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.isAuthenticated) {
    // Get the actual url of the app, it's needed for Keycloak
    const basePath = window.location.toString()
    if (!Vue.$keycloak.authenticated) {
      // The page is protected and the user is not authenticated. Force a login.
      Vue.$keycloak.login({ redirectUri: basePath.slice(0, -1) + to.path })
    } else {
      // The user was authenticated, and has the app role
      Vue.$keycloak.updateToken(70)
        .then(() => {
          next()
        })
        .catch(err => {
          console.error(err)
        })
    } 
  } else {
    next()
  }
})
export default router
