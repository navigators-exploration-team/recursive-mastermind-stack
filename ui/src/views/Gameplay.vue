<template>
  <!--   <el-button size="large" @click="refreshStates">Refresh States</el-button>-->
  <div class="d-flex gap-3">
    <div v-for="el in cluesColors" :key="el.color">
      <RoundedColor :bgColor="el.color" :value="el.value" :title="el.title" width="18px" height="18px" />
    </div>

  </div>
  <div v-if="zkAppStates">
    <div class="w-100 d-flex justify-content-start p-3 ps-0 gap-2 align-items-center" v-if="isCodeMasterTurn">Code
      Master Turn
      <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#0000ff" height="18px" />
    </div>
    <div class="w-100 d-flex justify-content-start align-items-center p-3 ps-0 gap-2 " v-else>Code Breaker Turn
      <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#ffde21" height="18px" />
    </div>
    <GameBoard />

  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import GameBoard from '../components/GameBoard.vue';
import RoundedColor from '../components/RoundedColor.vue';
import { cluesColors } from '../constants/colors';
const route = useRoute()
const { compiled, zkAppStates } = storeToRefs(useZkAppStore())
const { initZkappInstance, getZkappStates } = useZkAppStore()

const gameId = route?.params?.id
const refreshStates = async () => {
  await getZkappStates()
}
const isCodeMasterTurn = computed(() => {
  return zkAppStates.value?.turnCount % 2 === 0;
});
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