<template>
  <div>
    <div class="d-flex flex-column align-items-start">
      <label class="mb-2">Secret Code</label>
      <div class="d-flex gap-2 align-items-center w-100">
        <div class="board__container w-100">
          <div class="d-flex gap-2 p-2 justify-content-center w-100">
            <RoundedColor height="40px" width="40px"  v-for="(secret) in hiddenSecret" :bg-color="secret.color"
              :value="secret.value" v-if="isSecretHidden" />
            <RoundedColor height="40px" width="40px" editable v-for="(secret, index) in secretCode" v-else
              :bg-color="secret.color" :value="secret.value" @input="handleSetSecretCode($event, index)"
              @focusNext="focusNextInput(index)" @focusPrev="focusPrevInput(index)" ref="inputRefs" />
          </div>
        </div>
        <el-icon :size="25" class="cursor-pointer" @click="toggleSecret">
          <View v-if="isSecretHidden" />
          <Hide v-else />
        </el-icon>
      </div>


    </div>
    <el-form :model="form" :rules="rules" ref="ruleFormRef">
      <el-form-item class="mt-4" prop="randomSalt">
        <label>Salt</label>
        <div class="d-flex w-100 gap-2 align-items-center">
          <el-input type="text" size="large" v-if="isSaltHidden" :model-value="hiddenSalt"></el-input>
          <el-input type="text" size="large" v-model="form.randomSalt" :readonly="isRandomSalt" v-else></el-input>
          <CopyToClipBoard :text="form.randomSalt || ''" />
          <el-icon :size="25" class="cursor-pointer" @click="toggleSalt">
            <View v-if="isSaltHidden" />
            <Hide v-else />
          </el-icon>
        </div>
      </el-form-item>
      <el-tooltip placement="bottom" :visible="!compiled" content="Please wait for compilation">
        <el-button size="large" color="#00ADB5" type="primary" :disabled="!combinationValidation.isValid || !compiled"
          :loading="!compiled || loading" :title="combinationValidation.message" @click="handleSubmitForm"
          class="my-5 w-100">{{ btnText }}</el-button>
      </el-tooltip>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { AvailableColor } from '@/types';
import { Field } from 'o1js';
import RoundedColor from '@/components/RoundedColor.vue';
import CopyToClipBoard from '@/components/shared/CopyToClipBoard.vue';
import { generateRandomSalt, validateColorCombination } from '../../utils';
import { ElForm } from 'element-plus';
import { storeToRefs } from 'pinia';
import { useZkAppStore } from '@/store/zkAppModule';

const { compiled, loading, zkAppAddress } = storeToRefs(useZkAppStore());

const props = defineProps({
  isRandomSalt: {
    type: Boolean,
    required: true,
  },
  btnText: {
    type: String,
    required: false,
    default: 'Submit',
  },
  hideOnMount: {
    type: Boolean,
    required: false,
    default: true,
  }
});
const emit = defineEmits(['submit']);

const inputRefs = ref<(InstanceType<typeof RoundedColor> | null)[]>([]);
const isSaltHidden = ref(props.hideOnMount)
const isSecretHidden = ref(props.hideOnMount)
const toggleSalt = () => {
  isSaltHidden.value = !isSaltHidden.value
}
const toggleSecret = () => {
  isSecretHidden.value = !isSecretHidden.value
}
const focusNextInput = (index: number) => {
  if (index < inputRefs.value.length - 1) {
    nextTick(() => inputRefs.value[index + 1]?.focus());
  }
};
const focusPrevInput = (index: number) => {
  if (index > 0) {
    nextTick(() => inputRefs.value[index - 1]?.focus());
  }
};
const ruleFormRef = ref<InstanceType<typeof ElForm>>();
const rules = ref({
  randomSalt: [
    {
      required: true,
      message: `The salt is required !`,
      trigger: 'change',
    },
    {
      validator: (_rule: any, value: any, callback: any) => {
        try {
          Field(value);
          callback();
        } catch {
          callback(new Error(`This is not a field !`));
        }
      },
    },
  ],
});
const initialSecret = () => {
  if (props.isRandomSalt) {
    return {
      secretCode: Array.from({ length: 4 }, () => ({ color: '#222', value: 0 })),
      randomSalt: generateRandomSalt(20)
    }
  } else {
    let storedGames = localStorage.getItem("games")
    if (storedGames) {
      const jsonGames = JSON.parse(storedGames)
      if (jsonGames && jsonGames[zkAppAddress.value as string]) {
        return {
          secretCode: (jsonGames[zkAppAddress.value as string]).secretCode,
          randomSalt: (jsonGames[zkAppAddress.value as string]).randomSalt
        }
      }
    }
    return {
      secretCode: Array.from({ length: 4 }, () => ({ color: '#222', value: 0 })),
      randomSalt: ""
    }
  }
}
const form = ref({
  randomSalt: initialSecret().randomSalt,
});
const secretCode = ref<Array<AvailableColor>>(
  initialSecret().secretCode
);
const combinationValidation = computed(() => {
  return validateColorCombination(secretCode.value);
});
const hiddenSecret = Array.from({ length: 4 }, () => ({ color: '#fff', value: "x" }))
const hiddenSalt = "xxxxxxxxxxxxxxxxxxxx"
const handleSetSecretCode = (selectedColor: AvailableColor, index: number) => {
  secretCode.value[index] = { ...selectedColor };
};
const handleSubmitForm = () => {
  if (!ruleFormRef.value) return;
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      emit('submit', {
        code: secretCode.value,
        randomSalt: form.value.randomSalt,
      });
    }
  });
};

</script>
<style scoped>
.color-picker__container {
  border: 1px solid #222;
}
</style>
