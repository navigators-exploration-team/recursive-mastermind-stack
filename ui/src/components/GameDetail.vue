<template>
    <div class="d-flex flex-column gap-4 align-items-start w-100">
        <div>Number of Attempts {{ zkAppStates.maxAttempts }}</div>
        <div>Reward Amount {{ zkAppStates.rewardAmount }}</div>
        <el-button size="large" type="primary" class="w-100" @click="handleAcceptGame">Accept game</el-button>
    </div>
</template>
<script lang="ts" setup>
import { useZkAppStore } from "@/store/zkAppModule";
import { storeToRefs } from "pinia";

const { zkAppStates } = storeToRefs(useZkAppStore())
const { acceptGame } = useZkAppStore()

const handleAcceptGame = async () => {
    await acceptGame()
}
</script>
<style scoped></style>