<template>
    <div class="h-100 w-100 p-9">
        <div class="d-flex justify-content-center gap-2 mb-5">
            <el-button :type="step === 'RULES' ? 'primary' : ''" size="large"
                @click="setStep('RULES')">Rules</el-button>
            <el-button :type="step === 'NEW_GAME' ? 'primary' : ''" size="large" @click="setStep('NEW_GAME')">Create New
                Game</el-button>
            <el-button :type="step === 'JOIN' ? 'primary' : ''" size="large" @click="setStep('JOIN')">Join</el-button>
        </div>
        <GuideFlow v-if="step === 'RULES'" />
        <NewGameForm v-if="step === 'NEW_GAME'" />
        <JoinGameForm v-if="step === 'JOIN'" />
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import NewGameForm from '@/components/forms/NewGameForm.vue';
import GuideFlow from '@/components/GuideFlow.vue';
import JoinGameForm from '@/components/forms/JoinGameForm.vue';

const step = ref("RULES")
const setStep = (currentStep: string) => {
    step.value = currentStep
}

</script>
<style></style>