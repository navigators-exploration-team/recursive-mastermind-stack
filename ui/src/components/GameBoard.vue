<template>
    <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
        <div v-if="zkAppStates.isSolved === 'true'">
            the code breaker has won
        </div>
        <div v-else-if="zkAppStates.turnCount > zkAppStates.maxAttempts * 2">
            the code master has won
        </div>
        <div class="board__container d-flex">

            <div class="color-picker__container d-flex flex-column gap-3 p-2">
                <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                    :value="el.value" @click="handlePickColor(el)" />
            </div>
            <div>
                <div class=" d-flex flex-start gap-2 p-3">Game: {{ formatAddress(zkAppAddress) }}
                    <CopyToClipBoard :text="zkAppAddress" />
                </div>
                <div v-for="(guess, row) in guesses">
                    <Guess :attemptNo="row" @setColor="handleSetColor($event, row)" :guess="guess" :clue="clues[row]" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Guess from '@/components/Guess.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import { formatAddress } from '@/utils'
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"

const { zkAppAddress, zkAppStates } = storeToRefs(useZkAppStore())

const guesses = ref<Array<AvailableColor[]>>(
    zkAppStates.value.guessesHistory.slice(0, zkAppStates.value.maxAttempts)
);
const clues = computed<Array<AvailableColor[]>>(() => zkAppStates.value.cluesHistory.slice(0, zkAppStates.value.maxAttempts)
);
const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 })
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}
const handleSetColor = (index: number, row: number) => {
    guesses.value[row][index] = { ...selectedColor.value }
}



</script>
<style lang="css">
.board__container {
    border: 1px solid #222;
}

.color-picker__container {
    border: 1px solid #222;
}
</style>