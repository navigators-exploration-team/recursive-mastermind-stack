<template>
    <el-form>
        <el-form-item>
            <label>Number of Attempts</label>
            <el-input type="number" v-model.number="rounds" size="large" :max="15" :min="5"></el-input>
        </el-form-item>
        <el-button @click="handleInitCode" class="mt-5">Init Game</el-button>
        <div class="d-flex flex-column align-items-start">
            <label class="mb-2">Secret Code</label>
            <div class="board__container">
                <div class="d-flex gap-2 p-2 justify-content-center w-100">
                    <RoundedColor height="40px" width="40px" v-for="(secret, index) in secretCode"
                        :bg-color="secret.color" @click="handleSetSecretCode(index)" />
                </div>
                <div class="color-picker__container d-flex  gap-3 p-2 ">
                    <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                        @click="handlePickColor(el)" />
                </div>
            </div>
        </div>
        <el-form-item>
            <label>Salt</label>
            <div class="d-flex w-100 gap-2 align-items-center">
                <el-input type="text" size="large" readonly :model-value="randomSalt"></el-input>
                <el-tooltip :visible="copyTextTooltipVisible" content="Copied!" placement="top">
                    <el-icon :size="25" class="cursor-pointer" @click="copyToClipBoard">
                        <CopyDocument />
                    </el-icon>
                </el-tooltip>
            </div>
        </el-form-item>
        <el-button @click="handleCreateGame" class="my-5">Submit Code</el-button>
        <el-button @click="handleGiveClue" class="my-5">Give clue</el-button>
    </el-form>
</template>
<script lang="ts" setup>
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import RoundedColor from '@/components/RoundedColor.vue';
import { ref } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { Field } from 'o1js';
const { createInitGameTransaction, createNewGameTransaction, createGiveClueTransaction } = useZkAppStore()
const rounds = ref()
const copyTextTooltipVisible = ref(false)
const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 })
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}
const randomSalt = Field.random()
const secretCode = ref<Array<AvailableColor>>(
    Array.from({ length: 4 }, () =>
        ({ color: "#222", value: 0 }))
);
const handleSetSecretCode = (index: number) => {
    secretCode.value[index] = { ...selectedColor.value }
}
const handleInitCode = async () => {
    await createInitGameTransaction(rounds.value)
}
const handleCreateGame = async () => {
    const code = secretCode.value.map((e: AvailableColor) => e.value)
    await createNewGameTransaction(code, JSON.stringify(randomSalt).replace(/"/g, ''))
}
const handleGiveClue = async () => {
    const code = secretCode.value.map((e: AvailableColor) => e.value)
    await createGiveClueTransaction(code, JSON.stringify(randomSalt).replace(/"/g, ''))
}
const copyToClipBoard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(randomSalt).replace(/"/g, ''));
    copyTextTooltipVisible.value = true;
    setTimeout(() => {
        copyTextTooltipVisible.value = false;
    }, 400);
}
</script>

<style scoped>
.color-picker__container {
    border: 1px solid #222;
}
</style>