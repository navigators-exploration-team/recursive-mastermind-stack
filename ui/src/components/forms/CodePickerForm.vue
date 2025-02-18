<template>
    <div>
        <div class="d-flex flex-column align-items-start">
            <label class="mb-2">Secret Code</label>
            <div class="board__container w-100">
                <div class="d-flex gap-2 p-2 justify-content-center w-100">
                    <RoundedColor height="40px" width="40px" v-for="(secret, index) in secretCode"
                        :bg-color="secret.color" @click="handleSetSecretCode(index)" :value="secret.value" />
                </div>
                <div class="color-picker__container d-flex justify-content-center gap-3 p-2">
                    <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                        :value="el.value" @click="handlePickColor(el)" />
                </div>
            </div>
        </div>
        <el-form-item class="mt-4">
            <label>Salt</label>
            <div class="d-flex w-100 gap-2 align-items-center">
                <el-input type="text" size="large" v-model="randomSalt" :readonly="isRandomSalt"></el-input>
                <CopyToClipBoard :text="randomSalt || ''" />
            </div>
        </el-form-item>
        <el-button size="large" type="primary" @click="handleSubmitForm" class="my-5 w-100">{{ btnText }}</el-button>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { AvailableColor } from '@/types';
import { availableColors } from '@/constants/colors';
import { Field } from 'o1js';
import RoundedColor from '@/components/RoundedColor.vue';
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"

export interface CodePicker {
    code: string;
    randomSalt: string;
}

const props = defineProps({
    isRandomSalt: {
        type: Boolean,
        required: true
    },
    btnText: {
        type: String,
        required: false,
        default: 'Submit'
    }
})
const emit = defineEmits(['submit'])
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}

const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 });
const randomSalt = ref(props.isRandomSalt ? JSON.stringify(Field.random()).replace(/"/g, '') : '')

const secretCode = ref<Array<AvailableColor>>(
    Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
);

const handleSetSecretCode = (index: number) => {
    secretCode.value[index] = { ...selectedColor.value };
};
const handleSubmitForm = () => {
    emit("submit", {
        code: secretCode.value.map((e: AvailableColor) => e.value),
        randomSalt: randomSalt.value
    })
}
</script>
<style scoped>
.color-picker__container {
    border: 1px solid #222;
}
</style>