<template>
    <el-skeleton animated>
        <template #template>
            <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
                <div class="d-flex">
                    <div class="board__container d-flex">
                        <div class="color-picker__container d-flex flex-column gap-3 p-2">
                            <div v-for="el in availableColors" :key="el.color">
                                <el-skeleton-item
                                    style="--el-skeleton-circle-size: 40px"
                                    variant="circle"
                                />
                            </div>
                        </div>
                        <div>
                            <div class="d-flex flex-start gap-2 p-3">
                                <el-skeleton-item variant="p" width="100px" />
                            </div>
                            <div v-for="(_el, index) in Array.from({ length: 8 })" :key="index">
                                <GuessSkeleton />
                            </div>
                        </div>
                    </div>
                    <div class="logs__container">
                        <div class="d-flex justify-content-center p-3 logs-title">
                            <span><el-skeleton-item style="width: 50px" variant="p" /></span>
                        </div>
                        <div class="d-flex flex-column align-items-start px-3">
                            <div
                                v-for="(_el, key) in Array.from({ length: 8 })"
                                :key="key"
                                class="p-2 d-flex align-items-center gap-2"
                            >
                                <span><el-skeleton-item style="width: 100px" variant="p" /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </el-skeleton>
</template>
<script lang="ts" setup>
import { availableColors } from "@/constants/colors";
import GuessSkeleton from "./GuessSkeleton.vue";
</script>
<style scoped>
.board__container {
    border: 1px solid #eeeeee;
}

.logs__container {
    border: 1px solid #eeeeee;
    border-left: none;
}

.color-picker__container {
    border: 1px solid #eeeeee;
}

.logs-title {
    border-bottom: 1px solid #eeeeee;
}

.el-skeleton.is-animated .el-skeleton__item {
    background: linear-gradient(90deg, #eeeeee 25%, #15181d 37%, #eeeeee 63%);
    background-size: 400% 100% !important;
    animation: el-skeleton-loading 1.4s ease infinite !important;
}
</style>
