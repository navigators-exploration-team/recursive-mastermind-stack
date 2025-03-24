import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
  },
  {
    path: '/:id',
    name: 'gameplay',
    component: () =>
      import(/* webpackChunkName: "gameplay" */ '@/views/Gameplay.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
