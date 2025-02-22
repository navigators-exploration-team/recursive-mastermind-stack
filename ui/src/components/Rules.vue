<template>
    <ul class="d-flex flex-column align-items-start gap-3 ">
        <li>The game involves two players: a Code Master and a Code Breaker.</li>
        <li>The Code Master sets a secret combination and the Code Breaker tries to guess it.</li>
        <li>The clue indicates the following:</li>
        <ul>
            <li><strong>Hits:</strong> Digits that are correctly guessed and in the correct position.</li>
        </ul>
        <ul>
            <li><strong>Blows:</strong> Digits that are correct but in the wrong position.</li>
        </ul>
        <div class=" d-flex flex-column align-items-start w-100">
            <div>Example:</div>
            <div class="w-100 d-flex flex-column align-items-center mt-3 gap-3">
                <div>
                    <div class="my-2">Secret Code</div>
                    <div class="d-flex flex-1 gap-5">
                        <div class="d-flex gap-3  secret-container py-2 px-5">
                            <RoundedColor v-for="(el) in secret" :bgColor="el.color" :value="el.value" width="40px"
                                height="40px" />
                        </div>
                    </div>
                    <div class="my-2">Guess And Clue</div>
                    <div class="">
                        <Guess :guess="guess" :clue="clue" />
                    </div>
                </div>

            </div>
        </div>
        <ul>
            <li>Code Master's secret combination: 5 9 3 4</li>
        </ul>
        <ul>
            <li>Code Breaker's guess: 5 7 8 9</li>
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
                <li>The blow is 9 in the fourth position.</li>
            </ul>
        </ul>
        <li>
            The game continues with alternating guesses and clues until the Code Breaker achieves 4 hits and
            uncovers the secret combination or fails to do so within <strong>the maximum allowed attempts.</strong>
        </li>
    </ul>
</template>
<script lang="ts" setup>
import RoundedColor from '@/components/RoundedColor.vue';
import Guess from '@/components/Guess.vue';

import { ref } from 'vue';

const secret = ref([
    { color: "#f9f9f9", value: 5 },
    { color: "#A1887F", value: 9 },
    { color: "#FFD54F", value: 3 },
    { color: "#22AC6A", value: 4 },
])
const guess = ref([
    { color: "#f9f9f9", value: 5 },
    { color: "#7E57C2", value: 7 },
    { color: "#FF66B2", value: 8 },
    { color: "#A1887F", value: 9 },
])
const clue = ref([
    { color: "#44e544", value: 2, title: "Hit" },
    { color: "#ff7373", value: 0, title: "Miss" },
    { color: "#ff7373", value: 0, title: "Miss" },
    { color: "#ffc14e", value: 1, title: "Blow" },
])
</script>
<style scoped>
.secret-container {
    border: 1px solid #222;

}

li {
    text-align: justify;
}
</style>