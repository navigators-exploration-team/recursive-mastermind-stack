import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "gameplay",
    meta: {
      requiresAuth: false,
    },
    component: () =>
      import(/* webpackChunkName: "Gameplay" */ "@/views/Gameplay.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
