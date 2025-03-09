<template>
    <el-form :model="form" :rules="rules" ref="ruleFormRef">
        <el-form-item prop="penalizedPlayer" class="mb-4">
            <label>Player Public Key</label>
            <el-input size="large" v-model="form.penalizedPlayer"></el-input>
        </el-form-item>
        <el-button size="large" type="primary" class="w-100" @click="handlePenalize">Penalize Player</el-button>
    </el-form>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { ElForm, ElMessage } from 'element-plus';
import { PublicKey } from 'o1js';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
const { penalizePlayerTransaction } = useZkAppStore();
const {error} = storeToRefs(useZkAppStore())
const form = ref({
    penalizedPlayer: ""
})
const ruleFormRef = ref<InstanceType<typeof ElForm>>();
const rules = ref({
    penalizedPlayer: [
        {
            required: true,
            message: `The player public key is required!`,
            trigger: "change",
        },
        {
            validator: (rule: any, value: any, callback: any) => {
                try {
                    PublicKey.fromBase58(value)
                    callback();
                } catch {
                    callback(new Error(`This is not a valid public key!`));
                }
            },
        }
    ],
});
const emit = defineEmits(['close'])
const handlePenalize = async () => {
    if (!ruleFormRef.value) return;
    ruleFormRef.value.validate(async (valid) => {
        if (valid) {
            await penalizePlayerTransaction(form.value.penalizedPlayer)
            emit("close")
            if (error.value) {
                ElMessage.error({ message: error.value, duration: 6000 });
            }
        }
    })
}


</script>