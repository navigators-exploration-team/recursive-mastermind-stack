<template>
    <div class="rounded__color d-flex align-items-center justify-content-center fs-9"
        :class="{ blinkColor: blinkColor }" @click="handleColorClick">
        <span class="rounded__value" v-if="bgColor !== '#222'">{{ value }}</span>
    </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps({
    value: {
        type: Number,
        required: true
    },
    bgColor: {
        type: String,
        required: true
    },
    width: {
        type: String,
        required: true
    },
    height: {
        type: String,
        required: true
    },
    blinkColor: {
        type: String,
        required: false
    }
})
const emit = defineEmits(["click"])
const handleColorClick = () => {
    emit("click")
}

</script>
<style>
.rounded__color {
    background-color: v-bind(bgColor);
    border-radius: 50%;
    min-width: 16px;
    min-height: 16px;
    width: v-bind(width);
    height: v-bind(height);
    cursor: pointer;
}

.rounded__value {
    font-size: 12px;
    color: #444444;
}

.blinkColor {
    background-color: v-bind(blinkColor);
    animation: blink 1s infinite alternate;
}

@keyframes blink {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0.2;
    }
}
</style>