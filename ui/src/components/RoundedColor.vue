<template>
    <div class="rounded__color" @click="handleColorClick">
    </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps({
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

})
const emit = defineEmits(["click"])
const handleColorClick = () => {
    emit("click")
}

</script>
<style lang="css">
.rounded__color {
    background-color: v-bind(bgColor);
    border-radius: 50%;
    min-width: 16px;
    min-height: 16px;
    width: v-bind(width);
    height: v-bind(height);
    cursor: pointer;
}
</style>