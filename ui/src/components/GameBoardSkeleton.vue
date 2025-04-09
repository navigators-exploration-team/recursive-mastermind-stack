<template>
  <el-skeleton animated>
    <template #template>
      <div class="d-flex flex-column align-items-center w-100 h-100">
        <div>
          <div class="board__container d-flex">
            <div>
              <div class="d-flex flex-start gap-2 p-3">
                <el-skeleton-item variant="p" width="100px" />
              </div>
              <div
                v-for="(_el, index) in Array.from({ length: 5 })"
                :key="index"
              >
                <GuessSkeleton />
              </div>
            </div>
          </div>
          <div class="color-picker__container d-flex mt-4 gap-3 p-2">
            <div v-for="el in availableColors" :key="el.color">
              <el-skeleton-item
                style="--el-skeleton-circle-size: 40px"
                variant="circle"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-skeleton>
</template>
<script lang="ts" setup>
import { availableColors } from '@/constants/colors';
import GuessSkeleton from './GuessSkeleton.vue';
</script>
<style scoped>
.board__container {
  border-radius: 10px;
  border: 1px solid #222;
  box-shadow: 0 0 10px #00ffcc55;
}

.el-skeleton.is-animated .el-skeleton__item {
  background: linear-gradient(90deg, #222 25%, #15181d 37%, #222 63%);
  background-size: 400% 100% !important;
  animation: el-skeleton-loading 1.4s ease infinite !important;
}
</style>
