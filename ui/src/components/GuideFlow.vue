<template>
  <div class="mb-5">

    <img :src="iframeSrc" class="cropped-gif">
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const iframeSrc = ref<string>("/guideflow/rules.gif");

</script>

<style scoped>
.cropped-gif {
  position: relative;
  width: 80%;
  height: 100%;
}
</style>