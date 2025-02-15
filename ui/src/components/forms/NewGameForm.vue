<template>
    <el-form>
        <div v-if="formStep === 'INIT_GAME'">
            <el-form-item>
                <label>Number of Attempts</label>
                <el-input type="number" v-model.number="rounds" size="large" :max="15" :min="5"></el-input>
            </el-form-item>
            <el-button type="primary" size="large" @click="handleInitCode" class="mt-2 w-100">Init Game</el-button>
        </div>
        <div v-if="formStep === 'CREATE_GAME'">
            <div class="d-flex mb-2 flex-column align-items-start">
                <label class="mb-2">Secret Code</label>
                <div class="board__container">
                    <div class="d-flex gap-2 p-2 justify-content-center w-100">
                        <RoundedColor height="40px" width="40px" v-for="(secret, index) in secretCode"
                            :value="secret.value" :bg-color="secret.color" @click="handleSetSecretCode(index)" />
                    </div>
                    <div class="color-picker__container d-flex  gap-3 p-2 ">
                        <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                            :value="el.value" @click="handlePickColor(el)" />
                    </div>
                </div>
            </div>
            <el-form-item class="mt-3">
                <label>Salt</label>
                <div class="d-flex w-100 gap-2 align-items-center">
                    <el-input type="text" size="large" readonly :model-value="randomSalt"></el-input>
                    <CopyToClipBoard :text="randomSalt" />
                </div>
            </el-form-item>
            <el-button size="large" type="primary" @click="handleCreateGame" class=" w-100 my-2">Submit Code</el-button>
        </div>
    </el-form>
</template>
<script lang="ts" setup>
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import RoundedColor from '@/components/RoundedColor.vue';
import { ref } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { Field } from 'o1js';
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
const { zkAppAddress } = storeToRefs(useZkAppStore())
const router = useRouter()
const { createInitGameTransaction, createNewGameTransaction } = useZkAppStore()
const rounds = ref()
const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 })
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}
const formStep = ref("INIT_GAME")
const randomSalt = JSON.stringify(Field.random()).replace(/"/g, '')

const secretCode = ref<Array<AvailableColor>>(
    Array.from({ length: 4 }, () =>
        ({ color: "#222", value: 0 }))
);
const handleSetSecretCode = (index: number) => {
    secretCode.value[index] = { ...selectedColor.value }
}
const handleInitCode = async () => {
    await createInitGameTransaction(rounds.value)
    formStep.value = 'CREATE_GAME'
}
const handleCreateGame = async () => {
    const code = secretCode.value.map((e: AvailableColor) => e.value)
    await createNewGameTransaction(code, randomSalt)
    router.push({
        name: "gameplay", params: {
            id: zkAppAddress.value
        }
    })
}


</script>

<style scoped>
.color-picker__container {
    border: 1px solid #222;
}
</style>