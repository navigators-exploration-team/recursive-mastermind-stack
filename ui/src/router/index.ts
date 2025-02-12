import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: () =>
      import(/* webpackChunkName: "home" */ "@/views/Gameplay.vue"),
  },
  {
    path: "/:id",
    name: "created-gameplay",
    component: () =>
      import(/* webpackChunkName: "created-gameplay" */ "@/views/Gameplay.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
