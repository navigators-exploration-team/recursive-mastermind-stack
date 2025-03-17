<template>
  <div class="h-100 w-100 d-flex flex-column align-items-center">
    <p class="m-3 w-100" style="font-size: 40px">Mina Mastermind</p>
    <router-view />
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';

const { zkappWorkerClient, hasBeenSetup, accountExists } =
  storeToRefs(useZkAppStore());
const { checkAccountExists, setupZkApp } = useZkAppStore();
onMounted(async () => {
  await setupZkApp();
});
watch(
  [
    () => zkappWorkerClient.value,
    () => hasBeenSetup.value,
    () => accountExists.value,
  ],
  async () => {
    if (hasBeenSetup.value && !accountExists.value) {
      await checkAccountExists();
    }
  }
);
</script>
<style>
#app {
  font-family: 'Roboto Mono', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
}

.app-container {
  display: flex;
  justify-content: center;
  color: white;
  padding-top: 20px;
}
</style>
