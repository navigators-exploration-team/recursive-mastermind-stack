<template>
  <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
    <div class="board__container d-flex">
      <div class="color-picker__container d-flex flex-column gap-3 p-2">
        <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
          @click="handlePickColor(el)" />
      </div>
      <div>
        <div class=" d-flex flex-start p-3">Game</div>
        <div v-for="(guess, row) in guesses">
          <Guess :attemptNo="row" @setColor="handleSetColor($event, row)" :guess="guess" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Guess from '@/components/Guess.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { availableColors } from '../constants/colors';
import { AvailableColor } from '../types';

const guesses = ref<Array<AvailableColor[]>>(
  Array.from({ length: 10 }, () =>
    Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
  )
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