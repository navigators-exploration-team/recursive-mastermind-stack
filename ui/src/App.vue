<template>
  <div class="h-100">
    <h1 class="my-3">Mina-Mastermind</h1>
    <router-view />
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';

const { zkappWorkerClient, hasBeenSetup, accountExists } = storeToRefs(useZkAppStore())
const { checkAccountExists, setupZkApp } = (useZkAppStore())
onMounted(async () => {
  await setupZkApp()
})
watch([() => zkappWorkerClient.value, () => hasBeenSetup.value, () => accountExists.value], async () => {
  if (hasBeenSetup.value && !accountExists.value) {
    await checkAccountExists()
  }
})

</script>
<style>
#app {
  font-family: "Roboto Mono", Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  background: #121212;


}

.app-container {
  display: flex;
  justify-content: center;
  color: white;
  padding-top: 20px;
}
</style>
