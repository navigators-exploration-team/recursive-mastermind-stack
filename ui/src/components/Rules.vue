<template>
  <ul class="d-flex flex-column w-100 align-items-start gap-3 p-4">
    <li>The game involves two players: a Code Master and a Code Breaker.</li>
    <li>
      The Code Master sets a secret combination and the Code Breaker tries to
      guess it.
    </li>
    <li>The clue indicates the following:</li>
    <ul>
      <li>
        <strong>Hits:</strong> Digits that are correctly guessed and in the
        correct position.
      </li>
    </ul>
    <ul>
      <li>
        <strong>Blows:</strong> Digits that are correct but in the wrong
        position.
      </li>
    </ul>
    <div class="d-flex flex-column align-items-start w-100">
      <div>Example:</div>
      <div class="w-100 d-flex flex-column align-items-center mt-3 gap-3">
        <div>
          <div class="my-2">Secret Code</div>
          <div class="d-flex flex-1 gap-5">
            <div
              class="d-flex gap-3 secret-container py-2 px-5 w-100 justify-content-center"
            >
              <RoundedColor
                v-for="el in secret"
                :bgColor="el.color"
                :value="el.value"
                width="40px"
                height="40px"
              />
            </div>
          </div>
          <div class="my-2">Guess And Clue</div>
          <div>
            <Guess :guess="guess" :clue="clue" :showBtn="false" />
          </div>
        </div>
      </div>
    </div>
    <ul>
      <li>Code Master's secret combination: 5 6 2 4</li>
    </ul>
    <ul>
      <li>Code Breaker's guess: 5 7 3 6</li>
    </ul>
    <ul>
      <li>Clue: 2 0 0 1</li>
    </ul>
    <ul>
      <ul>
        <li>Result: 1 hit and 1 blow.</li>
      </ul>
    </ul>
    <ul>
      <ul>
        <li>The hit is 5 in the first position.</li>
      </ul>
    </ul>
    <ul>
      <ul>
        <li>The blow is 6 in the fourth position.</li>
      </ul>
    </ul>
    <li>
      The game continues with alternating guesses and clues until the Code
      Breaker achieves 4 hits and uncovers the secret combination or fails to do
      so within
      <strong>the maximum allowed attempts.</strong>
    </li>
    <li>
      <strong>How to get Mina tokens on Devnet:</strong>
      <ul>
        <li>
          Go to the Mina Faucet:
          <a href="https://faucet.minaprotocol.com/" target="_blank"
            >https://faucet.minaprotocol.com/</a
          >
        </li>
        <li>Enter your Mina Devnet wallet address.</li>
        <li>Click on "Request" and wait a few moments.</li>
        <li>Check your balance using your Auro wallet.</li>
      </ul>
    </li>
    <li>
      <strong>Comprehensive Game Guide:</strong>
      For a complete, step-by-step walkthrough on how to play the game,
      including rules and examples, visit:
      <a href="https://app.guideflow.com/player/1pz4dqzsvr" target="_blank"
        >https://app.guideflow.com/player/1pz4dqzsvr</a
      >
    </li>
  </ul>
</template>
<script lang="ts" setup>
import RoundedColor from '@/components/RoundedColor.vue';
import Guess from '@/components/Guess.vue';

import { ref } from 'vue';

const secret = ref([
  { color: '#7FFFD4', value: 5 },
  { color: '#fcf6bd', value: 9 },
  { color: '#FFBF00', value: 3 },
  { color: '#0BDA51', value: 4 },
]);
const guess = ref([
  { color: '#7FFFD4', value: 5 },
  { color: '#73C2FB', value: 7 },
  { color: '#D473D4', value: 8 },
  { color: '#fcf6bd', value: 9 },
]);
const clue = ref([
  { color: '#66FF00', value: 2, title: 'Hit' },
  { color: '#ED2939', value: 0, title: 'Miss' },
  { color: '#ED2939', value: 0, title: 'Miss' },
  { color: '#ffd800', value: 1, title: 'Blow' },
]);
</script>
<style scoped>
.secret-container {
  border: 1px solid #eeeeee;
  width: 330px;
}

li {
  text-align: justify;
}
</style>
