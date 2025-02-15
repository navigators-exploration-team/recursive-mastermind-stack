<template>
    <div class="d-flex guess__container p-2 align-items-center gap-2">
        <span>{{ attemptNo + 1 }}</span>
        <div class="d-flex flex-1 gap-5">
            <div class="d-flex gap-3  guesses">
                <RoundedColor v-for="(el, index) in guess" :bgColor="el.color" :value="el.value" width="40px"
                    height="40px" @click="handleSetColor(index)" />
            </div>

            <div class="clue__container d-flex flex-wrap gap-2">
                <RoundedColor v-for="el in clue" :bgColor="el.color" width="18px" :value="el.value" height="18px" />
            </div>

        </div>

        <div v-show="isCurrentRound">
            <el-button size="small" @click="handleVerifyGuess" v-if="isCodeMasterTurn">Verify</el-button>
            <el-button size="small" @click="handleSubmitGuess" v-else>Check</el-button>
        </div>
        <el-dialog v-model="isVerifyGuessModalOpen" modal-class="dialog-class" custom-class="dialog-class"
            style="padding: 0px!important;">
            <div class="d-flex flex-column align-items-start">
                <label class="mb-2">Secret Code</label>
                <div class="board__container w-100">
                    <div class="d-flex gap-2 p-2 justify-content-center w-100">
                        <RoundedColor height="40px" width="40px" v-for="(secret, index) in secretCode"
                            :bg-color="secret.color" @click="handleSetSecretCode(index)" :value="secret.value" />
                    </div>
                    <div class="color-picker__container d-flex justify-content-center gap-3 p-2">
                        <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                            :value="el.value" @click="handlePickColor(el)" />
                    </div>
                </div>
            </div>
            <el-form-item class="mt-4">
                <label>Salt</label>
                <div class="d-flex w-100 gap-2 align-items-center">
                    <el-input type="text" size="large" v-model="randomSalt"></el-input>
                    <CopyToClipBoard :text="randomSalt || ''" />
                </div>
            </el-form-item>
            <el-button size="large" type="primary" @click="handleGiveClue" class="my-5 w-100">Give clue</el-button>
        </el-dialog>
    </div>
</template>
<script setup lang="ts">
import RoundedColor from "@/components/RoundedColor.vue";
import { computed, ref } from "vue";
import { AvailableColor } from "../types";
import { useZkAppStore } from "@/store/zkAppModule";
import { availableColors } from "../constants/colors";
import { storeToRefs } from "pinia";
import CopyToClipBoard from "@/components/CopyToClipBoard.vue";
const { createGuessTransaction, createGiveClueTransaction, getZkappStates } = useZkAppStore();
const { zkAppStates } = storeToRefs(useZkAppStore());

const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 });
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor;
};
const handleGiveClue = async () => {
    const code = secretCode.value.map((e: AvailableColor) => e.value);
    isVerifyGuessModalOpen.value = false
    await createGiveClueTransaction(code, randomSalt.value);
    await getZkappStates()
};
const isVerifyGuessModalOpen = ref(false);
const isCodeMasterTurn = computed(() => {
    return zkAppStates.value.turnCount % 2 === 0;
});
const isCurrentRound = computed(() => {
    return Math.ceil(zkAppStates.value.turnCount / 2) === props.attemptNo + 1;
});
const emit = defineEmits(["setColor"]);
const handleSetColor = (index: number) => {
    if (isCurrentRound.value) {
        emit("setColor", index);
    }
};
const props = defineProps({
    attemptNo: {
        type: Number,
        required: true,
    },
    guess: {
        type: Array<AvailableColor>,
        required: true,
    },
    clue: {
        type: Array<AvailableColor>,
        required: true,
    },
});
const handleSubmitGuess = async () => {
    const code = props.guess.map((e: AvailableColor) => e.value);
    await createGuessTransaction(code);
    await getZkappStates()
};

const handleVerifyGuess = () => {
    isVerifyGuessModalOpen.value = true;
};
const randomSalt = ref();

const secretCode = ref<Array<AvailableColor>>(
    Array.from({ length: 4 }, () => ({ color: "#222", value: 0 }))
);

const handleSetSecretCode = (index: number) => {
    secretCode.value[index] = { ...selectedColor.value };
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
    border: 1px solid #222;
}

.clue__container {
    width: 50px;
}
</style>
