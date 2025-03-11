<template>
    <div class="d-flex flex-column gap-4 align-items-start w-100">
        <div class="d-flex align-items-center gap-2"> Game ID : {{ formatAddress(zkAppAddress) }}
            <CopyToClipBoard :text="zkAppAddress" />
        </div>
        <div>Number of Attempts {{ zkAppStates.maxAttempts }}</div>
        <div>Reward Amount {{ zkAppStates.rewardAmount }}</div>
        <div class="d-flex align-items-end gap-2" v-if="userRole === 'CODE_MASTER'">
            Waiting for code breaker to accept the game
            <div class="dots mb-1">
                <span class="dot" v-for="(dot, index) in 3" :key="index"
                    :style="{ animationDelay: `${index * 0.3}s` }"></span>
            </div>

        </div>
        <el-button v-else size="large" :disabled="loading" :loading="loading" type="primary" class="w-100"
            @click="handleAcceptGame">Accept game</el-button>
    </div>
</template>
<script lang="ts" setup>
import { useZkAppStore } from "@/store/zkAppModule";
import { storeToRefs } from "pinia";
import { ElMessage } from 'element-plus';
import { formatAddress } from '@/utils'
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"
import { onMounted } from "vue";
import { ElNotification } from 'element-plus';

const { zkAppStates, loading, error, zkAppAddress, userRole, currentTransactionLink } = storeToRefs(useZkAppStore())
const { acceptGame, getRole } = useZkAppStore()

const handleAcceptGame = async () => {
    await acceptGame()
    if (error.value) {
        ElMessage.error({ message: error.value, duration: 6000 });
    } else {
        ElNotification({
            title: 'Success',
            message: `Transaction Hash :  ${currentTransactionLink.value}`,
            type: 'success',
            duration: 5000
        })
    }
}
onMounted(async () => {
    await getRole()
})
</script>
<style scoped>
.dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

.dot {
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
    animation: blink 1s infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 0.2;
    }

    50% {
        opacity: 1;
    }
}
</style>