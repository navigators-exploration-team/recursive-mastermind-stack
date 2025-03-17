<template>
  <div class="h-100 w-100" style="max-width: 640px">
    <div class="d-flex justify-content-around gap-2 m-3 align-items-center">
      <el-button
        type="primary"
        color="#00ADB5"
        size="large"
        style="width: 120px; text-align: center; white-space: normal"
        :plain="step !== 'RULES'"
        @click="setStep('RULES')"
        >Rules</el-button
      >
      <el-button
        type="primary"
        color="#00ADB5"
        size="large"
        style="width: 120px; text-align: center; white-space: normal"
        :plain="step !== 'TUTORIAL'"
        @click="setStep('TUTORIAL')"
        >Tutorial</el-button
      >
      <el-button
        type="primary"
        color="#00ADB5"
        size="large"
        style="width: 120px; text-align: center; white-space: normal"
        :plain="step !== 'NEW_GAME'"
        @click="setStep('NEW_GAME')"
        >Create New Game</el-button
      >
      <el-button
        type="primary"
        color="#00ADB5"
        size="large"
        style="width: 120px; text-align: center; white-space: normal"
        :plain="step !== 'JOIN'"
        @click="setStep('JOIN')"
        >Join</el-button
      >
    </div>
    <Rules v-if="step === 'RULES'" />
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

const step = ref('RULES');
const setStep = (currentStep: string) => {
  step.value = currentStep;
};
</script>
<style></style>
