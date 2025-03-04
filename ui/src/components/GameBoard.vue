<template>
    <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
        <div class="w-100 d-flex justify-content-start">
            <template v-if="!(zkAppStates.isSolved === 'true' || zkAppStates.turnCount > zkAppStates.maxAttempts * 2)">
                <div class="w-100 d-flex justify-content-start p-3 ps-0 gap-2 align-items-center"
                    v-if="isCodeMasterTurn">
                    Code
                    Master Turn
                    <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#0000ff" height="18px" />
                </div>
                <div class="w-100 d-flex justify-content-start align-items-center p-3 ps-0 gap-2 " v-else>Code Breaker
                    Turn
                    <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#ffde21" height="18px" />
                </div>
            </template>
            <template v-else>
                <div class="w-100 d-flex align-items-center justify-content-between">
                    <div v-if="zkAppStates.isSolved === 'true'" class="my-4">
                        The code breaker has won!
                    </div>
                    <div v-else-if="zkAppStates.turnCount > zkAppStates.maxAttempts * 2" class="my-4">
                        The code master has won!
                    </div>
                    <el-button size="large" type="primary" @click="handleSubmitGameProof">Submit game proof</el-button>
                </div>

            </template>
        </div>

        <div class="d-flex">
            <div class="board__container d-flex">
                <div class="color-picker__container d-flex flex-column gap-3 p-2">
                    <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                        :value="el.value" @click="handlePickColor(el)" />
                </div>
                <div>
                    <div class=" d-flex flex-start gap-2 p-3"> Game: {{ formatAddress(zkAppAddress) }}
                        <CopyToClipBoard :text="zkAppAddress" />
                    </div>
                    <Guess @setColor="handleSetColor" :guess="guesses" :clue="clues" />
                </div>
            </div>
        </div>
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

const { submitGameProof } = useZkAppStore()
const { zkAppAddress, zkAppStates } = storeToRefs(useZkAppStore())
const isCodeMasterTurn = computed(() => {
    return zkAppStates.value?.turnCount % 2 === 0;
});
const guesses = ref<Array<AvailableColor>>(
    zkAppStates.value?.guessesHistory
);
const clues = computed<Array<AvailableColor>>(() => zkAppStates.value?.turnCount <= 2 ?
    Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
    : zkAppStates.value?.cluesHistory);
const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 })
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}
const handleSetColor = (index: number) => {
    guesses.value[index] = { ...selectedColor.value }
}

const handleSubmitGameProof = async () => {
    await submitGameProof()
}

watch(() => zkAppStates.value?.turnCount, () => {
    guesses.value = zkAppStates.value.guessesHistory
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
</style>