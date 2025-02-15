<template>
    <div class="d-flex gap-4 align-items-center">
        <el-input placeholder="Insert ZkApp Address" size="large" v-model="newGameAddress"></el-input>
        <el-button size="large" type="primary" @click="handleJoinGame"> Play </el-button>

    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter()
const newGameAddress = ref("")
const handleJoinGame = () => {
    router.push({ name: "gameplay", params: { id: newGameAddress.value } })
}
</script>