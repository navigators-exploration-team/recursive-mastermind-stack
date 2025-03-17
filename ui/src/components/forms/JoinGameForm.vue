<template>
  <div class="d-flex gap-4 align-items-center w-100 justify-content-center">
    <el-form
      :model="game"
      :rules="rules"
      ref="ruleFormRef"
      class="w-100"
      style="max-width: 400px"
      @submit.prevent
    >
      <el-form-item prop="gameAddress" class="w-100">
        <label>ZkApp Address</label>
        <el-input
          placeholder="Insert ZkApp Address"
          size="large"
          v-model="game.gameAddress"
          class="w-100"
        >
          <template #append>
            <el-button
              type="primary"
              class="d-flex align-items-center justify-content-center gap-2"
              :icon="FolderOpened"
              @click="pasteFromClipboard"
            >
              Paste
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-tooltip
        placement="bottom"
        :visible="!compiled"
        content="Please wait for compilation"
      >
        <el-button
          class="w-100 mt-2"
          color="#00ADB5"
          size="large"
          type="primary"
          @click="handleJoinGame"
          :loading="!compiled"
          :disabled="!compiled"
        >
          Play
        </el-button>
      </el-tooltip>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ElForm, ElMessage } from 'element-plus';
import { PublicKey } from 'o1js';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useZkAppStore } from '@/store/zkAppModule';

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

const handleJoinGame = () => {
  if (!ruleFormRef.value) return;
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      router.push({ name: 'gameplay', params: { id: game.value.gameAddress } });
    }
  });
};

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text.trim()) {
      game.value.gameAddress = text.trim();
    } else {
      ElMessage.warning('Clipboard is empty!');
    }
  } catch (error) {
    console.error('Failed to read clipboard: ', error);
    ElMessage.error('Failed to access clipboard!');
  }
};
import { FolderOpened } from '@element-plus/icons-vue';
</script>
