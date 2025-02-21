<template>
  <div class="d-flex flex-column align-items-center">
    <div class="d-flex gap-3">
      <div v-for="el in cluesColors" :key="el.color">
        <RoundedColor :bgColor="el.color" :value="el.value" :title="el.title" width="18px" height="18px" />
      </div>
    </div>
    <div v-if="zkAppStates">
      <GameBoard />
    </div>
    <div v-else-if="compiled && error && !zkAppStates">
      <div class="fs-1 mt-5 ">
        404 Game Not found !
      </div>
    </div>
    <div v-else class="mt-5">
      <GameBoardSkeleton />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import GameBoard from '@/components/GameBoard.vue';
import GameBoardSkeleton from '@/components/GameBoardSkeleton.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { cluesColors } from '@/constants/colors';
const route = useRoute()
const { compiled, zkAppStates, error } = storeToRefs(useZkAppStore())
const { initZkappInstance, getZkappStates } = useZkAppStore()
const gameId = route?.params?.id
onMounted(async () => {
  if (compiled.value) {
    await initZkappInstance(gameId)
    setInterval(async () => {
      await getZkappStates()
    }, 3000)
  }
})
watch(() => compiled.value, async () => {
  if (compiled.value) {
    await initZkappInstance(gameId)
    setInterval(async () => {
      await getZkappStates()
    }, 3000)
  }
})
</script>
<style lang="css">
.board__container {
  border: 1px solid #222;
}

.color-picker__container {
  border: 1px solid #222;
}
</style>