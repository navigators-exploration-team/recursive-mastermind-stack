<template>
    <div>
        <div class="d-flex gap-3">
            <div v-for="el in cluesColors" :key="el.color">
                <RoundedColor :bgColor="el.color" :value="el.value" :title="el.title" width="18px" height="18px" />
            </div>
        </div>
        <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
            <div class="w-100 d-flex justify-content-start">
                <template
                    v-if="!(zkAppStates.isSolved === 'true' || zkProofStates?.turnCount > zkAppStates?.maxAttempts * 2)">
                    <div class="d-flex align-items-center justify-content-between w-100">
                        <div class="w-100 d-flex justify-content-start p-3 ps-0 gap-2 align-items-center"
                            v-if="isCodeMasterTurn">
                            Code
                            Master Turn
                            <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#0000ff" height="18px" />
                        </div>
                        <div class="w-100 d-flex justify-content-start align-items-center p-3 ps-0 gap-2 " v-else>Code
                            Breaker
                            Turn
                            <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#ffde21" height="18px" />
                        </div>
                        <el-button  class="penalize-player-btn" @click="handleShowPenalizeDialog">
                            Penalize Player
                        </el-button>
                    </div>
                </template>
                <template v-else>
                    <div class="w-100 d-flex align-items-center justify-content-between">
                        <div v-if="zkAppStates.isSolved === 'true'" class="my-4">
                            The code breaker has won!
                        </div>
                        <div v-else-if="zkProofStates.turnCount > zkAppStates.maxAttempts * 2" class="my-4">
                            The code master has won!
                        </div>
                        <el-button size="large" type="primary" @click="handleSubmitGameProof">Submit game
                            proof</el-button>
                    </div>

                </template>
            </div>

            <div class="d-flex mt-1">
                <div class="board__container d-flex">
                    <div class="color-picker__container d-flex flex-column gap-3 p-2">
                        <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                            :value="el.value"  />
                    </div>

                    <div>
                        <div class=" d-flex flex-start gap-2 p-3"> Game: {{ formatAddress(zkAppAddress) }}
                            <CopyToClipBoard :text="zkAppAddress" />
                        </div>
                        <div v-for="(guess, row) in guesses?.slice(0, zkAppStates.maxAttempts)">
                            <Guess :attemptNo="row" @setColor="handleSetColor($event, row)" :guess="guess"
                                :clue="clues[row]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <el-dialog v-model="isPenalizeDialogVisible" style="padding: 0px!important;" destroy-on-close>
            <PenalizePlayerForm @close="closePenalizePlayerDialog" />
        </el-dialog>
    </div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Guess from '@/components/Guess.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import { formatAddress } from '@/utils'
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"
import { cluesColors } from '@/constants/colors';
import PenalizePlayerForm from './forms/PenalizePlayerForm.vue';
import Test from './Test.vue';

const { submitGameProof } = useZkAppStore()
const { zkAppAddress, zkProofStates, zkAppStates } = storeToRefs(useZkAppStore())
const isCodeMasterTurn = computed(() => {
    return zkProofStates.value?.turnCount % 2 === 0;
});
const guesses = ref<Array<AvailableColor[]>>(
    zkProofStates.value?.guessesHistory
);
const clues = computed<Array<AvailableColor>>(() => zkProofStates.value?.cluesHistory);

const handleSetColor = (payload: {index:number,selectedColor:AvailableColor}, row: number) => {
    guesses.value[row][payload.index] = { ...payload.selectedColor }
}
const handleSubmitGameProof = async () => {
    await submitGameProof()
}
const isPenalizeDialogVisible = ref(false)
const handleShowPenalizeDialog = () => {
    isPenalizeDialogVisible.value = true
}
const closePenalizePlayerDialog = () => {
    isPenalizeDialogVisible.value = false
}
watch(() => zkProofStates.value?.turnCount, () => {
    guesses.value = zkProofStates.value.guessesHistory
})

</script>
<style scoped>
.board__container {
    border: 1px solid #222;
}

.logs__container {
    border: 1px solid #222;
    border-left: none;
}

.color-picker__container {
    border: 1px solid #222;
}

.logs-title {
    border-bottom: 1px solid #222;
}

:deep(.el-popper) {
    width: 70% !important;
}

.separator {
    border: 1px solid #222;
    width: 2px;
}

.penalize-player-btn {
    background-color: #FF4D4D;
    color: white;
}
</style>