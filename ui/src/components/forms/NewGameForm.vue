<template>
  <div class="d-flex flex-column align-items-center w-100 h-100">
    <el-form
      :model="game"
      :rules="rules"
      style="max-width: 400px; width: 100%"
      ref="ruleFormRef"
    >
      <el-form-item prop="rewardAmount">
        <label>Reward Amount</label>
        <el-input
          type="number"
          placeholder="Reward amount greater than 9 MINA"
          v-model.number="game.rewardAmount"
          size="large"
          :min="10"
          @blur="setRewardAmount"
        ></el-input>
      </el-form-item>
      <el-form-item prop="refereePubKeyBase58">
        <label>Refree Public Key</label>
        <PasteFromClipBoard
          placeholder="Insert refree public key"
          @change="handleRefreeChange"
          :inputValue="game.refereePubKeyBase58"
        />
      </el-form-item>
      <CodePickerForm
        @submit="handleInitGame"
        btnText="Submit Code"
        isRandomSalt
        :hideOnMount="false"
      />
    </el-form>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useZkAppStore } from '@/store/zkAppModule';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import CodePickerForm from '@/components/forms/CodePickerForm.vue';
import { ElForm, ElMessage } from 'element-plus';
import { AvailableColor, CodePicker } from '@/types';
import { GameParams } from '../../types';
import { PublicKey } from 'o1js';
import { ElNotification } from 'element-plus';
import PasteFromClipBoard from '@/components/shared/PasteFromClipBoard.vue';

const { zkAppAddress, error, currentTransactionLink } =
  storeToRefs(useZkAppStore());
const router = useRouter();
const { createInitGameTransaction } = useZkAppStore();

const game = ref<GameParams>({
  rewardAmount: null,
  refereePubKeyBase58: '',
});
const ruleFormRef = ref<InstanceType<typeof ElForm>>();
const rules = ref({
  rewardAmount: [
    {
      required: true,
      message: `The reward amount is required !`,
      trigger: 'change',
    },
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (value >= 10) {
          callback();
        } else {
          callback(
            new Error(`The reward amount should be greater than 10 MINA`)
          );
        }
      },
    },
  ],
  refereePubKeyBase58: [
    {
      required: true,
      message: `The refree public key is required!`,
      trigger: 'change',
    },
    {
      validator: (_rule: any, value: any, callback: any) => {
        try {
          PublicKey.fromBase58(value);
          callback();
        } catch {
          callback(new Error(`This is not a valid public key!`));
        }
      },
    },
  ],
});
const setRewardAmount = () => {
  if (!game.value.rewardAmount) return;
  if (game.value.rewardAmount < 10) {
    game.value.rewardAmount = 10;
  }
};
const handleInitGame = async (formData: CodePicker) => {
  if (!ruleFormRef.value) return;
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      await createInitGameTransaction(
        formData.code.map((e: AvailableColor) => e.value),
        formData.randomSalt,
        game.value.refereePubKeyBase58 as string,
        game.value.rewardAmount! * 1e9
      );
      if (error.value) {
        ElMessage.error({ message: error.value, duration: 6000 });
      } else {
        ElNotification({
          title: 'Success',
          message: `Transaction Hash : ${currentTransactionLink.value}`,
          type: 'success',
          duration: 5000,
        });
        let games = {};
        const storedGames = localStorage.getItem('games');
        if (storedGames) {
          games = { ...JSON.parse(storedGames) };
        }
        games = {
          ...games,
          [zkAppAddress.value as string]: {
            randomSalt: formData.randomSalt,
            secretCode: formData.code,
          },
        };
        localStorage.setItem('games', JSON.stringify(games));
        router.push({
          name: 'gameplay',
          params: {
            id: zkAppAddress.value,
          },
        });
      }
    }
  });
};
const handleRefreeChange = (input: string) => {
  game.value.refereePubKeyBase58 = input;
};
</script>

<style scoped>
.color-picker__container {
  border: 1px solid #222;
}
</style>
