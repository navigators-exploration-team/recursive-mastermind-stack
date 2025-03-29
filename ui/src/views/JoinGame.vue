<template>
    <div class="d-flex flex-column gap-4 align-items-center w-100 justify-content-center">
        <JoinGameForm />
        <div class="mt-2" v-if="games.length > 0">
            Recently Played Games
        </div>
        <div class="w-100 px-4 games-list">
            <div v-for="game in games" :key="game" class="d-flex gap-3 justify-content-around align-items-center mt-4">
                <div>{{ formatAddress(game) }}</div>
                <el-button color="#00ADB5" size="large" type="primary" @click="handleJoinGame(game)">JOIN</el-button>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import JoinGameForm from "@/components/forms/JoinGameForm.vue"
import axios from "axios";
import { onMounted, ref, watch } from "vue";
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from "pinia";
import { formatAddress } from "@/utils"
import { useRouter } from 'vue-router';

const { publicKeyBase58 } = storeToRefs(useZkAppStore());
const games = ref<string[]>([])
const router = useRouter();

const getUserGames = async () => {
    if (publicKeyBase58.value) {
        const res = await axios.get(SERVER_URL + '/games/' + publicKeyBase58.value)
        if (res?.data?.games) {
            games.value = res.data.games
        }
    }
}
const handleJoinGame = (game: string) => {
    router.push({ name: 'gameplay', params: { id: game } })
}
onMounted(async () => {
    await getUserGames()

})
watch(() => publicKeyBase58.value, async () => {
    await getUserGames()
})
</script>
<style lang="css" scoped>
.games-list {
    max-height: 300px;
    overflow-y: auto;
}
</style>