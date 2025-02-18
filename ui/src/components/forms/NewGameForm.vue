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
            <CodePickerForm @submit="handleCreateGame" btnText="Submit Code" isRandomSalt />
        </div>
    </el-form>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import CodePickerForm from '@/components/forms/CodePickerForm.vue';
import { CodePicker } from './CodePickerForm.vue';
const { zkAppAddress } = storeToRefs(useZkAppStore())
const router = useRouter()
const { createInitGameTransaction, createNewGameTransaction } = useZkAppStore()
const rounds = ref()
const formStep = ref("INIT_GAME")

const handleInitCode = async () => {
    await createInitGameTransaction(rounds.value)
    formStep.value = 'CREATE_GAME'
}

const handleCreateGame = async (formData: CodePicker) => {
    await createNewGameTransaction(formData.code, formData.randomSalt)
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