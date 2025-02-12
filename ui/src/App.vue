<template>
  <div class="h-100">

    <h1 class="my-3">zkMastermind</h1>
    <div class="d-flex gap-2 mb-5">
      <el-button size="large">Rules</el-button>

      <el-button size="large" @click="handleCreateGame">Create New Game</el-button>

      <el-button size="large">Join</el-button>
      <el-input placeholder="Insert ZkApp Address" size="large" v-model="newGameAddress"></el-input>
    </div>

    <NewGameForm />

    <router-view />

  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import NewGameForm from './components/forms/NewGameForm.vue';
const { zkappWorkerClient, hasBeenSetup, accountExists } = storeToRefs(useZkAppStore())
const { checkAccountExists, setupZkApp } = (useZkAppStore())

const newGameAddress = ref("")
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
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
