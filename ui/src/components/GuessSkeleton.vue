<template>
  <el-skeleton animated>
    <template #template>
      <div class="d-flex guess__container p-2 align-items-center gap-2">
        <span class="pe-2">
          <el-skeleton-item variant="p" style="width: 20px" />
        </span>
        <div class="d-flex flex-1 gap-5">
          <div class="d-flex gap-3 guesses">
            <el-skeleton-item
              v-for="el in Array.from({ length: 4 })"
              :key="el"
              style="--el-skeleton-circle-size: 40px"
              variant="circle"
            />
          </div>
          <div class="clue__container d-flex flex-wrap gap-2">
            <el-skeleton-item
              v-for="el in Array.from({ length: 4 })"
              :key="el"
              style="--el-skeleton-circle-size: 18px"
              variant="circle"
            />
          </div>
        </div>
      </div>
    </template>
  </el-skeleton>
</template>
<script lang="ts" setup></script>
<style scoped>
.guess__container {
  border: 1px solid #222;
}

.clue__container {
  width: 50px;
}
.el-skeleton.is-animated .el-skeleton__item {
  background: linear-gradient(90deg, #222 25%, #15181d 37%, #222 63%);
  background-size: 400% 100% !important;
  animation: el-skeleton-loading 1.4s ease infinite !important;
}
</style>
