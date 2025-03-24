<template>
    <el-input :placeholder="placeholder" size="large" :model-value="inputValue" @input="handleInputChange"
        class="w-100">
        <template #append>
            <el-button type="primary" class="d-flex align-items-center justify-content-center gap-2"
                :icon="FolderOpened" @click="pasteFromClipboard">
                Paste
            </el-button>
        </template>
    </el-input>
</template>
<script lang="ts" setup>
import { FolderOpened } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
const props = defineProps({
    placeholder: {
        type: String,
        required: true
    },
    inputValue: {
        type: String,
        required: true
    }

})
const emit = defineEmits(["change"])

const handleInputChange = (value: string) => {
    emit("change", value)
}
const pasteFromClipboard = async () => {
    try {
        const text = await navigator.clipboard.readText();
        const trimedText = text.trim()
        if (trimedText) {
            emit('change', trimedText)
        } else {
            ElMessage.warning('Clipboard is empty!');
        }
    } catch (error) {
        console.error('Failed to read clipboard: ', error);
        ElMessage.error('Failed to access clipboard!');
    }
};
</script>