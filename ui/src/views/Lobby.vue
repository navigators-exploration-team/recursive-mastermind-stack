<template>
  <div class="d-flex gap-5 justify-content-center w-100 flex-wrap p-4">
    <el-table :data="games" stripe class="w-100">
      <el-table-column label="Game ID" width="180">
        <template #default="scope">
          <div class="d-flex align-items-center gap-2">
            <span>{{ formatAddress(scope.row.name) }}</span>
            <CopyToClipBoard :text="scope.row.name || ''" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Max Attempts" prop="gameMaxAttempts">
      </el-table-column>
      <el-table-column label="Game Reward" prop="gameRewardAmount">
        <template #default="scope">
          <div class="d-flex align-items-center gap-2">
            <span>{{ scope.row.gameRewardAmount / 1e9 }} MINA</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Action">
        <template #default="scope">
          <el-button
            color="#00ADB5"
            size="large"
            type="primary"
            class="me-3"
            @click="handleJoinGame(scope.row.name)"
            >JOIN</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts" setup>
import { Game } from '@/types';
import { formatAddress } from '@/utils';
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import CopyToClipBoard from '@/components/shared/CopyToClipBoard.vue';

const router = useRouter();
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const games = ref<Array<Game>>([]);
const handleJoinGame = (game: string) => {
  router.push({ name: 'gameplay', params: { id: game } });
};
const getActiveGames = async () => {
  const res = await axios.get(SERVER_URL + '/games/active-games');
  games.value = res?.data?.games.map((game: Game) => ({
    name: game?.name,
    gameMaxAttempts: game?.metadata?.gameMaxAttempts,
    gameRewardAmount: game?.metadata?.gameRewardAmount,
  }));
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
}
</style>
