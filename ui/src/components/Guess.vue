<template>
  <div class="d-flex guess__container p-2 align-items-center gap-2">
    <span v-if="attemptNo !== -1">{{ attemptNo + 1 }}</span>
    <div class="d-flex flex-1 gap-5">
      <div class="d-flex gap-3 guesses">
        <RoundedColor
          v-for="(el, index) in guess"
          :bgColor="el.color"
          :value="el.value"
          width="40px"
          height="40px"
          :editable="
            isCurrentRound && !isCodeMasterTurn && userRole === 'CODE_BREAKER'
          "
          @input="handleSetColor($event, index)"
          @focusNext="focusNextInput(index)"
          @focusPrev="focusPrevInput(index)"
          ref="inputRefs"
        />
      </div>
      <div class="clue__container d-flex flex-wrap gap-2">
        <RoundedColor
          v-for="el in clue"
          :bgColor="el.color"
          width="18px"
          :value="el.value"
          height="18px"
        />
      </div>
    </div>
    <div class="btn-container" v-if="showBtn">
      <div v-if="isCurrentRound">
        <el-button
          :disabled="userRole !== 'CODE_MASTER'"
          @click="handleVerifyGuess"
          v-if="isCodeMasterTurn && userRole === 'CODE_MASTER'"
          :loading="loading"
          class="multi-line-button w-100"
          size="small"
          >{{ stepDisplay ? stepDisplay : 'Verify' }}</el-button
        >
        <el-button
          :disabled="
            !combinationValidation.isValid || userRole !== 'CODE_BREAKER'
          "
          @click="handleSubmitGuess"
          :title="combinationValidation.message"
          :loading="loading"
          class="multi-line-button w-100"
          size="small"
          v-if="!isCodeMasterTurn && userRole === 'CODE_BREAKER'"
        >
          {{ stepDisplay ? stepDisplay : 'Check' }}
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="isVerifyGuessModalOpen"
      modal-class="dialog-class"
      custom-class="dialog-class"
      style="padding: 0px !important"
      destroy-on-close
      width="80%"
    >
      <CodePickerForm
        @submit="handleGiveClue"
        btnText="Give clue"
        :isRandomSalt="false"
      />
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import RoundedColor from '@/components/RoundedColor.vue';
import { computed, nextTick, onMounted, ref } from 'vue';
import { AvailableColor, CodePicker } from '@/types';
import { useZkAppStore } from '@/store/zkAppModule';
import { storeToRefs } from 'pinia';
import CodePickerForm from './forms/CodePickerForm.vue';
import { validateColorCombination } from '../utils';
import { ElMessage } from 'element-plus';
const { createGuessProof, createGiveClueProof, getRole } = useZkAppStore();
const { error, zkProofStates, loading, userRole, stepDisplay } =
  storeToRefs(useZkAppStore());

const inputRefs = ref<(InstanceType<typeof RoundedColor> | null)[]>([]);

onMounted(async () => {
  await getRole();
});

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

const handleGiveClue = async (formData: CodePicker) => {
  isVerifyGuessModalOpen.value = false;
  await createGiveClueProof(
    formData.code.map((e: AvailableColor) => e.value),
    formData.randomSalt
  );
  if (error.value) {
    ElMessage.error({ message: error.value, duration: 6000 });
  }
};
const isVerifyGuessModalOpen = ref(false);
const isCodeMasterTurn = computed(() => {
  return zkProofStates.value?.turnCount % 2 === 0;
});
const isCurrentRound = computed(() => {
  return Math.ceil(zkProofStates.value?.turnCount / 2) === props.attemptNo + 1;
});
const combinationValidation = computed(() => {
  return validateColorCombination(props.guess);
});

const emit = defineEmits(['setColor']);
const handleSetColor = (selectedColor: AvailableColor, index: number) => {
  if (isCurrentRound.value && !isCodeMasterTurn.value) {
    emit('setColor', { index, selectedColor });
  }
};
const props = defineProps({
  attemptNo: {
    type: Number,
    required: false,
    default: -1,
  },
  guess: {
    type: Array<AvailableColor>,
    required: true,
  },
  clue: {
    type: Array<AvailableColor>,
    required: true,
  },
  showBtn: {
    type: Boolean,
    default:true
  }
});
const handleSubmitGuess = async () => {
  const code = props.guess.map((e: AvailableColor) => e.value);
  await createGuessProof(code);
  if (error.value) {
    ElMessage.error({ message: error.value, duration: 6000 });
  }
};

const handleVerifyGuess = () => {
  isVerifyGuessModalOpen.value = true;
};
</script>
<style>
.dialog-class {
  padding: 0px !important;
  --el-dialog-padding-primary: -20px !important;
  padding: none !important;
  padding: 0px !important;
}

:deep(.el-dialog) {
  padding: 0px !important;
  --el-dialog-padding-primary: 0px !important;
  padding: none !important;
}

.el-dialog__body {
  background: #121212 !important;
  padding: 20px !important;
}

.el-dialog__header {
  background: #121212 !important;
}

.guess__container {
  border: 1px solid #eeeeee;
}

.clue__container {
  width: 50px;
}
.multi-line-button {
  white-space: normal;
  text-align: center;
  word-wrap: break-word;
  padding: 15px;
}
.btn-container {
  width: 120px;
}
</style>
