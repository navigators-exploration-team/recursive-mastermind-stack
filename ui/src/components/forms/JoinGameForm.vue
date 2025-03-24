<template>
  <div class="d-flex gap-4 align-items-center w-100 justify-content-center">
    <el-form :model="game" :rules="rules" ref="ruleFormRef" class="w-100" style="max-width: 400px" @submit.prevent>
      <el-form-item prop="gameAddress" class="w-100">
        <label>ZkApp Address</label>
        <PasteFromClipBoard placeholder="Insert ZkApp Address" @change="handleZkAppAddress"
          :inputValue="game.gameAddress" />
      </el-form-item>

      <el-tooltip placement="bottom" :visible="!compiled" content="Please wait for compilation">
        <el-button class="w-100 mt-2" color="#00ADB5" size="large" type="primary" @click="handleJoinGame"
          :loading="!compiled" :disabled="!compiled">
          Play
        </el-button>
      </el-tooltip>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ElForm } from 'element-plus';
import { PublicKey } from 'o1js';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useZkAppStore } from '@/store/zkAppModule';
import PasteFromClipBoard from '@/components/shared/PasteFromClipBoard.vue';

const router = useRouter();
const ruleFormRef = ref<InstanceType<typeof ElForm>>();
const { compiled } = storeToRefs(useZkAppStore());

const rules = ref({
  gameAddress: [
    {
      required: true,
      message: `The zkApp address is required!`,
      trigger: 'change',
    },
    {
      validator: (_rule: any, value: any, callback: any) => {
        try {
          PublicKey.fromBase58(value);
          callback();
        } catch {
          callback(new Error(`This is not a valid address!`));
        }
      },
    },
  ],
});

const game = ref({ gameAddress: '' });
const handleZkAppAddress = (input: string) => {
  game.value.gameAddress = input
}
const handleJoinGame = () => {
  if (!ruleFormRef.value) return;
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      router.push({ name: 'gameplay', params: { id: game.value.gameAddress } });
    }
  });
};

</script>
