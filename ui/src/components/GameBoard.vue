<template>
  <div>
    <div class="d-flex justify-content-between">
      <div v-for="el in cluesColors" :key="el.color">
        <RoundedColor :bgColor="el.color" :value="el.value" :title="el.title" width="24px" height="24px" />
      </div>
    </div>
    <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100 mt-2">
      <div class="w-100 d-flex justify-content-start">
        <template v-if="!isGameEnded">
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
            <div class="my-4 w-100 d-flex justify-content-between align-items-center">
              <span v-if="isGameSolved"> The code breaker has won!</span>
              <span v-else> The code master has won!</span>
              <div v-if="isWinner && !isRewardClaimed">
                <el-button class="claim-btn" @click="handleClaimReward" v-if="showRewardButton" :disabled="loading"
                  :loading="loading">
                  Claim Reward
                </el-button>
                <div v-else>
                  <div class="ms-1 d-flex align-items-end gap-2">
                    Submitting proof
                    <DotsLoader />
                  </div>
                  <div v-if="lastTransactionLink">
                    <a :href="`https://minascan.io/devnet/tx/${lastTransactionLink}?type=zk-tx`" target="_blank"
                      rel="noopener noreferrer">
                      Transaction Hash
                    </a>
                  </div>
                </div>
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
import CopyToClipBoard from '@/components/shared/CopyToClipBoard.vue';
import { cluesColors } from '@/constants/colors';
import { ElNotification } from 'element-plus';
import { ElMessage } from 'element-plus';
import DotsLoader from '@/components/shared/DotsLoader.vue';

const { claimRewardTransaction, getRole, getZkAppStates } = useZkAppStore();
const { zkAppAddress, zkProofStates, zkAppStates, userRole, lastTransactionLink, error, loading, currentTransactionLink } =
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
const isRewardClaimed = ref(false)
const handleSetColor = (
  payload: { index: number; selectedColor: AvailableColor },
  row: number
) => {
  guesses.value[row][payload.index] = { ...payload.selectedColor };
};
const handleClaimReward = async () => {
  await claimRewardTransaction()
  if (error.value) {
    ElMessage.error({ message: error.value, duration: 6000 });
  } else {
    isRewardClaimed.value = true
    ElNotification({
      title: 'Success',
      message: `Transaction Hash : ${currentTransactionLink.value}`,
      type: 'success',
      duration: 5000,
    });

  }
}
const isGameSolved = computed(() => {
  return clues.value?.some((clue: AvailableColor[]) =>
    clue?.every((el: AvailableColor) => el.value === 2)
  );
});
const isWinner = computed(() => {
  return (isGameSolved.value && userRole.value === 'CODE_BREAKER'
    || (zkProofStates.value?.turnCount > zkAppStates.value?.maxAttempts * 2)
    && userRole.value === 'CODE_MASTER')
})
const isGameEnded = computed(() => {
  return isGameSolved.value ||
    zkProofStates?.value?.turnCount > zkAppStates?.value?.maxAttempts * 2
})
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
</style>
