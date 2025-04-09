<template>
  <div class="d-flex flex-column align-items-center">
    <div v-if="zkAppStates" class="w-100">
      <GameDetail v-if="zkAppStates.codeBreakerId === '0'" />
      <GameBoard v-else />
    </div>
    <div v-else class="mt-5">
      <GameBoardSkeleton />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import GameBoard from '@/components/GameBoard.vue';
import GameDetail from '@/components/GameDetail.vue';
import GameBoardSkeleton from '@/components/GameBoardSkeleton.vue';

const route = useRoute();
const { compiled, zkAppStates } = storeToRefs(useZkAppStore());
const { initZkappInstance, joinGame, getZkAppStates } = useZkAppStore();
const gameId = route?.params?.id as string;
const initializeGame = async () => {
  if (compiled.value) {
    await initZkappInstance(gameId);
    await joinGame(gameId);
    intervalId.value = setInterval(async () => {
      await getZkAppStates();
      if (zkAppStates.value && zkAppStates.value.codeBreakerId !== '0') {
        if (intervalId.value) {
          clearInterval(intervalId.value);
        }
      }
    }, 30000);
  }
};
onMounted(async () => {
  await initializeGame();
});
watch(
  () => compiled.value,
  async () => {
    await initializeGame();
  }
);

const intervalId = ref<number | null>(null);

onUnmounted(async () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});
</script>
<style lang="css" scoped>
.board__container {
  border: 1px solid #222;
  box-shadow: 0 0 10px #00ffcc55;
}
</style>
