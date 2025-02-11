<template>
    <div class="d-flex guess__container p-2 align-items-center gap-2">
        <span>{{ attemptNo }}</span>
        <div class="d-flex gap-3">
            <RoundedColor v-for="(el, index) in guess" :bgColor="el.color" width="40px" height="40px" @click="handleSetColor(index
            )" />
        </div>
        <div class="clue__container d-flex flex-wrap gap-2">
            <RoundedColor v-for="el in clue" :bgColor="el.color" width="16px" height="16px" />
        </div>
        <el-button size="small">Check</el-button>
    </div>
</template>
<script setup lang="ts">
import RoundedColor from '@/components/RoundedColor.vue';
import { ref } from 'vue';
import { AvailableColor } from '../types';


const clue = ref([
    {
        color: "#222"
    },
    {
        color: "#222"
    },
    {
        color: "#222"
    },
    {
        color: "#222"
    },
])
const emit = defineEmits(["setColor"])
const handleSetColor = (index: number) => {
    emit("setColor", index)
}
const props = defineProps({
    attemptNo: {
        type: Number,
        required: true
    },
    guess: {
        type: Array<AvailableColor>,
        required: true
    }
})



</script>
<style>
.guess__container {
    border: 1px solid #222;
}

.clue__container {
    width: 50px;
}
</style>