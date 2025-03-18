<template>
  <div>
    <div class="d-flex justify-content-between">
      <div v-for="el in cluesColors" :key="el.color">
        <RoundedColor :bgColor="el.color" :value="el.value" :title="el.title" width="24px" height="24px" />
      </div>
    </div>
    <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100 mt-2">
      <div class="w-100 d-flex justify-content-start">
        <template v-if="
          !(
            isGameSolved ||
            zkProofStates?.turnCount > zkAppStates?.maxAttempts * 2
          )
        ">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="w-100 d-flex justify-content-start p-3 ps-0 gap-2 align-items-center" v-if="isCodeMasterTurn">
              Code Master Turn
              <RoundedColor bgColor="#222" width="8px" :value="0" blinkColor="#0000ff" height="8px" />
            </div>
            <div class="w-100 d-flex justify-content-start align-items-center p-3 ps-0 gap-2" v-else>
              Code Breaker Turn
              <RoundedColor bgColor="#222" width="8px" :value="0" blinkColor="#ffde21" height="8px" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="w-100 d-flex align-items-center justify-content-between">
            <div v-if="isGameSolved" class="my-4 w-100 d-flex justify-content-between align-items-center">
              The code breaker has won!
              <div v-if="userRole === 'CODE_BREAKER'">
                <el-button class="claim-btn" @click="claimRewardTransaction" v-if="showRewardButton">
                  Claim Reward
                </el-button>
                <div v-else>
                  Waiting for last proof submission
                  <div class="dots mb-1">
                    <span class="dot" v-for="(_dot, index) in 3" :key="index"
                      :style="{ animationDelay: `${index * 0.3}s` }"></span>
                  </div>
                </div>
              </div>

            </div>
            <div v-else-if="zkProofStates.turnCount > zkAppStates.maxAttempts * 2"
              class="my-4 w-100 d-flex justify-content-between align-items-center">
              The code master has won!
              <div v-if="userRole === 'CODE_MASTER'">
                <el-button class="claim-btn" @click="claimRewardTransaction" v-if="showRewardButton">
                  Claim Reward
                </el-button>
              </div>

            </div>
          </div>
        </template>
      </div>

      <div class="d-flex mt-1">
        <div class="board__container d-flex">
          <div class="color-picker__container d-flex flex-column gap-3 p-2">
            <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
              :value="el.value" />
          </div>

          <div>
            <div class="d-flex flex-start gap-2 p-3">
              Game: {{ formatAddress(zkAppAddress as string) }}
              <CopyToClipBoard :text="zkAppAddress as string" />
            </div>
            <div v-for="(guess, row) in guesses?.slice(0, zkAppStates.maxAttempts)">
              <Guess :attemptNo="row" @setColor="handleSetColor($event, row)" :guess="guess" :clue="clues[row]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Guess from '@/components/Guess.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
import { formatAddress } from '@/utils';
import CopyToClipBoard from '@/components/CopyToClipBoard.vue';
import { cluesColors } from '@/constants/colors';

const { claimRewardTransaction, getRole, getZkAppStates } = useZkAppStore();
const { zkAppAddress, zkProofStates, zkAppStates, userRole } =
  storeToRefs(useZkAppStore());
const isCodeMasterTurn = computed(() => {
  return zkProofStates.value?.turnCount % 2 === 0;
});
const intervalId = ref<number | null>(null);
const guesses = ref<Array<AvailableColor[]>>(
  zkProofStates.value?.guessesHistory
);
const clues = computed<Array<AvailableColor[]>>(
  () => zkProofStates.value?.cluesHistory
);

const handleSetColor = (
  payload: { index: number; selectedColor: AvailableColor },
  row: number
) => {
  guesses.value[row][payload.index] = { ...payload.selectedColor };
};

const isGameSolved = computed(() => {
  return clues.value?.some((clue: AvailableColor[]) =>
    clue?.every((el: AvailableColor) => el.value === 2)
  );
});
const showRewardButton = computed(() => {
  return zkAppStates.value?.turnCount > zkAppStates.value?.maxAttempts * 2
    || zkAppStates.value?.isSolved === '1'
})
watch(
  () => zkProofStates.value?.turnCount,
  () => {
    guesses.value = zkProofStates.value.guessesHistory;
    if (zkProofStates.value?.turnCount > zkAppStates.value?.maxAttempts * 2 || isGameSolved.value) {
      intervalId.value = setInterval(async () => {
        await getZkAppStates()
        if (showRewardButton.value) {
          clearInterval(intervalId.value as number)
        }
      }, 30000)
    }
  }
);
onMounted(async () => {
  await getRole()
})
</script>
<style scoped>
.board__container {
  border: 1px solid #eeeeee;
}

.logs__container {
  border: 1px solid #eeeeee;
  border-left: none;
}

.color-picker__container {
  border: 1px solid #eeeeee;
}

.logs-title {
  border-bottom: 1px solid #eeeeee;
}

:deep(.el-popper) {
  width: 70% !important;
}

.separator {
  border: 1px solid #eeeeee;
  width: 2px;
}

.claim-btn {
  background-color: #17b14d;
  color: white;
}

.dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }
}
</style>
