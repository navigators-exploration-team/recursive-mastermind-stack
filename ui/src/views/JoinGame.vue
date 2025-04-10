<template>
  <div
    class="d-flex flex-column gap-4 align-items-center w-100 justify-content-center"
  >
    <div>
      <JoinGameForm />
      <div v-if="games.length > 0" class="mb-3 w-100">
        <div class="my-4">Recently Played Games</div>
        <div class="d-flex justify-content-around">
          <div class="games-list w-100">
            <div
              v-for="game in games"
              :key="game"
              class="d-flex gap-9 align-items-center justify-content-between mb-4 w-100"
            >
              <div>{{ formatAddress(game._id) }}</div>
              <el-button
                color="#00ADB5"
                size="large"
                type="primary"
                class="me-3"
                @click="handleJoinGame(game._id)"
                >JOIN</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import JoinGameForm from '@/components/forms/JoinGameForm.vue';
import axios from 'axios';
import { onMounted, ref, watch } from 'vue';
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
import { formatAddress } from '@/utils';
import { useRouter } from 'vue-router';
import { Game } from '@/types';

const { publicKeyBase58 } = storeToRefs(useZkAppStore());
const games = ref<Game[]>([]);
const router = useRouter();

const getUserGames = async () => {
  if (publicKeyBase58.value) {
    const res = await axios.get(SERVER_URL + '/games/' + publicKeyBase58.value);
    if (res?.data?.games) {
      games.value = res.data.games;
    }
  }
};
const handleJoinGame = (game: string) => {
  router.push({ name: 'gameplay', params: { id: game } });
};
onMounted(async () => {
  await getUserGames();
});
watch(
  () => publicKeyBase58.value,
  async () => {
    await getUserGames();
  }
);
</script>
<style lang="css" scoped>
.games-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
