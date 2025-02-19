<template>
    <div>
        <div v-if="formStep === 'INIT_GAME'">
            <el-form :model="game" :rules="rules" ref="ruleFormRef">
                <el-form-item>
                    <label>Number of Attempts</label>
                    <el-input type="number" v-model.number="game.rounds" size="large"
                        placeholder="Select a number between 5 and 15" :max="15" :min="5"
                        @blur="setAttempts"></el-input>
                </el-form-item>
            </el-form>
            <el-button type="primary" size="large" @click="handleInitCode" class="mt-2 w-100" :loading="!compiled"
                :disabled="!compiled">Init Game</el-button>
        </div>
        <div v-if="formStep === 'CREATE_GAME'">
            <CodePickerForm @submit="handleCreateGame" btnText="Submit Code" isRandomSalt />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useZkAppStore } from "@/store/zkAppModule"
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import CodePickerForm from '@/components/forms/CodePickerForm.vue';
import { CodePicker } from './CodePickerForm.vue';
import { ElForm, ElMessage } from 'element-plus';
const { zkAppAddress, compiled, error } = storeToRefs(useZkAppStore())
const router = useRouter()
const { createInitGameTransaction, createNewGameTransaction } = useZkAppStore()
const formStep = ref("INIT_GAME")
const game = ref({
    rounds: 8
})
const ruleFormRef = ref<InstanceType<typeof ElForm>>();
const rules = ref({
    rounds: [
        {
            required: true,
            message: `The number of attempts is required !`,
            trigger: "change",
        },
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value >= 5 && value <= 15) {
                    callback();
                } else {
                    callback(new Error(`The number of attempts should be between 5 and 15`));
                }
            },
        }
    ]
});
const setAttempts = () => {
    if (game.value.rounds > 15) {
        game.value.rounds = 15
    } else if (game.value.rounds < 5) {
        game.value.rounds = 5
    }
}
const handleInitCode = async () => {
    await createInitGameTransaction(game.value.rounds)
    if (error.value) {
        ElMessage.error({ message: error.value, duration: 6000 });
    } else {
        formStep.value = 'CREATE_GAME'
    }
}

const handleCreateGame = async (formData: CodePicker) => {
    await createNewGameTransaction(formData.code, formData.randomSalt)
    if (error.value) {
        ElMessage.error({ message: error.value, duration: 6000 });
    } else {
        router.push({
            name: "gameplay", params: {
                id: zkAppAddress.value
            }
        })
    }
}


</script>

<style scoped>
.color-picker__container {
    border: 1px solid #222;
}
</style>