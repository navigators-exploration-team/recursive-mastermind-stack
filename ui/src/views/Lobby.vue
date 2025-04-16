<template>
  <div
    class="d-flex gap-5 justify-content-center flex-wrap p-4 lobby-container"
  >
    <el-table :data="games" stripe>
      <el-table-column label="Game ID" width="180">
        <template #default="scope">
          <div class="d-flex align-items-center gap-2">
            <span>{{ formatAddress(scope.row.id) }}</span>
            <CopyToClipBoard :text="scope.row.id || ''" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Max Attempts" prop="gameMaxAttempts" width="150">
      </el-table-column>
      <el-table-column label="Game Reward" prop="gameRewardAmount" width="150">
        <template #default="scope">
          <div class="d-flex align-items-center gap-2">
            <span>{{ scope.row.gameRewardAmount / 1e9 }} MINA</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="Last Accepted At"
        prop="lastAcceptanceDate"
        width="180"
      >
      </el-table-column>
      <el-table-column label="Action" width="250">
        <template #default="scope">
          <div class="d-flex">
            <el-button
              color="#00ADB5"
              size="large"
              type="primary"
              class="me-3"
              @click="handleJoinGame(scope.row.id)"
              >JOIN</el-button
            >
            <el-button
              v-if="
                scope.row.codeMaster === publicKeyBase58 &&
                scope.row.status === 'ACTIVE'
              "
              color="#9d2c2c"
              size="large"
              type="primary"
              class="me-3"
              @click="handleCancelGame(scope.row.id)"
              >Cancel</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts" setup>
import { Game } from '@/types';
import { dateToDayHourMin, formatAddress } from '@/utils';
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import CopyToClipBoard from '@/components/shared/CopyToClipBoard.vue';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
const { publicKeyBase58 } = storeToRefs(useZkAppStore());
const { cancelGame } = useZkAppStore();

const router = useRouter();
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const games = ref<Array<Game>>([]);
const handleJoinGame = (game: string) => {
  router.push({ name: 'gameplay', params: { id: game } });
};
const getActiveGames = async () => {
  const res = await axios.get(SERVER_URL + '/games/active-games');
  games.value = res?.data?.map((game: Game) => {
    return {
      id: game?._id,
      gameMaxAttempts: game?.maxAttempts,
      gameRewardAmount: game?.rewardAmount,
      codeMaster: game?.codeMaster,
      status: game.status,
      lastAcceptanceDate: dateToDayHourMin(game?.lastAcceptTimestamp),
    };
  });
};
const handleCancelGame = async (gameId: string) => {
  await cancelGame(gameId);
};
onMounted(async () => {
  await getActiveGames();
});
</script>
<style lang="css" scoped>
:deep(.el-table__row) {
  background: #171d24 !important;
  color: white;
}
:deep(
  .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell
) {
  background: #1f242b !important;
}
:deep(.el-table) {
  --el-table-row-hover-bg-color: unset;
  width: fit-content;
}
.lobby-container {
  position: absolute;
  left: 0%;
  width: 100vw;
}
</style>
