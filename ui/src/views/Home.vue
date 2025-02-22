<template>
    <div class="h-100 w-100 p-9">
        <div class="d-flex justify-content-center gap-2 mb-5">
            <el-button :type="step === 'RULES' ? 'primary' : ''" size="large"
                @click="setStep('RULES')">Rules</el-button>
            <el-button :type="step === 'TUTORIAL' ? 'primary' : ''" size="large"
                @click="setStep('TUTORIAL')">Tutorial</el-button>
            <el-button :type="step === 'NEW_GAME' ? 'primary' : ''" size="large" @click="setStep('NEW_GAME')">Create New
                Game</el-button>
            <el-button :type="step === 'JOIN' ? 'primary' : ''" size="large" @click="setStep('JOIN')">Join</el-button>
        </div>
        <div class="w-100 d-flex justify-content-center">
            <div class="w-50">
                <Rules v-if="step === 'RULES'" />
            </div>
        </div>
        <GuideFlow v-if="step === 'TUTORIAL'" />
        <NewGameForm v-if="step === 'NEW_GAME'" />
        <JoinGameForm v-if="step === 'JOIN'" />
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import NewGameForm from '@/components/forms/NewGameForm.vue';
import GuideFlow from '@/components/GuideFlow.vue';
import JoinGameForm from '@/components/forms/JoinGameForm.vue';
import Rules from '@/components/Rules.vue';

const step = ref("RULES")
const setStep = (currentStep: string) => {
    step.value = currentStep
}

</script>
<style></style>