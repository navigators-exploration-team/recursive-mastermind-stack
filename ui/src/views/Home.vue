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
        :plain="step !== 'Lobby'"
        @click="setStep('Lobby')"
        >Lobby</el-button
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
    <Lobby v-if="step === 'Lobby'" />
    <NewGameForm v-if="step === 'NEW_GAME'" />
    <JoinGame v-if="step === 'JOIN'" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import NewGameForm from '@/components/forms/NewGameForm.vue';
import Lobby from '@/views/Lobby.vue';
import Rules from '@/components/Rules.vue';
import JoinGame from '@/views/JoinGame.vue';
const step = ref('RULES');
const setStep = (currentStep: string) => {
  step.value = currentStep;
};
</script>
<style></style>
