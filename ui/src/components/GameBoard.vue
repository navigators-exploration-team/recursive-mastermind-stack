<template>
    <div class="gameplay__container d-flex flex-column align-items-center w-100 h-100">
        <div class="w-100 d-flex justify-content-start">
            <div v-if="zkAppStates.isSolved === 'true'" class="m-4">
                the code breaker has won
            </div>
            <div v-else-if="zkAppStates.turnCount > zkAppStates.maxAttempts * 2" class="m-4">
                the code master has won
            </div>
        </div>
        <template v-if="!(zkAppStates.isSolved === 'true' || zkAppStates.turnCount > zkAppStates.maxAttempts * 2)">
            <div class="w-100 d-flex justify-content-start p-3 ps-0 gap-2 align-items-center" v-if="isCodeMasterTurn">
                Code
                Master Turn
                <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#0000ff" height="18px" />
            </div>
            <div class="w-100 d-flex justify-content-start align-items-center p-3 ps-0 gap-2 " v-else>Code Breaker Turn
                <RoundedColor bgColor="#222" width="18px" :value="0" blinkColor="#ffde21" height="18px" />
            </div>
        </template>
        <div class="d-flex">
            <div class="board__container d-flex">
                <div class="color-picker__container d-flex flex-column gap-3 p-2">
                    <RoundedColor height="40px" width="40px" v-for="el in availableColors" :bg-color="el.color"
                        :value="el.value" @click="handlePickColor(el)" />
                </div>
                <div>
                    <div class=" d-flex flex-start gap-2 p-3">Game: {{ formatAddress(zkAppAddress) }}
                        <CopyToClipBoard :text="zkAppAddress" />
                    </div>
                    <div v-for="(guess, row) in guesses">
                        <Guess :attemptNo="row" @setColor="handleSetColor($event, row)" :guess="guess"
                            :clue="clues[row]" />
                    </div>
                </div>
            </div>
            <div class="logs__container">
                <div class="d-flex justify-content-center p-3 logs-title">
                    <span>Logs</span>
                </div>
                <div class="d-flex flex-column align-items-start px-3">
                    <div v-for="(state, key) in logState" :key="key" class="p-2 d-flex align-items-center gap-2">
                        <span>{{ key }} : {{ state.value }}</span>
                        <el-tooltip placement="top-start" class="w-50">
                            <template #content>
                                <div v-html="state.information"></div>
                            </template>
                            <el-icon :size="18" class="cursor-pointer">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>

                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Guess from '@/components/Guess.vue';
import RoundedColor from '@/components/RoundedColor.vue';
import { availableColors } from '@/constants/colors';
import { AvailableColor } from '@/types';
import { useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
import { formatAddress } from '@/utils'
import CopyToClipBoard from "@/components/CopyToClipBoard.vue"

const { zkAppAddress, zkAppStates } = storeToRefs(useZkAppStore())
const isCodeMasterTurn = computed(() => {
    return zkAppStates.value?.turnCount % 2 === 0;
});
const guesses = ref<Array<AvailableColor[]>>(
    zkAppStates.value.guessesHistory.slice(0, zkAppStates.value.maxAttempts)
);
const clues = computed<Array<AvailableColor[]>>(() => zkAppStates.value.cluesHistory.slice(0, zkAppStates.value.maxAttempts)
);
const selectedColor = ref<AvailableColor>({ color: "#222", value: 0 })
const handlePickColor = (pickedColor: AvailableColor) => {
    selectedColor.value = pickedColor
}
const handleSetColor = (index: number, row: number) => {
    guesses.value[row][index] = { ...selectedColor.value }
}
const logState = computed(() => {
    return {
        turnCount: {
            value: zkAppStates.value.turnCount,
            information: `
                <ul>
                    <li>
                        This state is essential for tracking game progress.
                        It helps determine when the maximum number of attempts (maxAttempts) has been reached <br> and also
                        identifies
                        whose turn it is to make a move.
                        <br> If the turnCount is even, it's the Code Master's turn to give a clue; if it's odd, it's the Code
                        Breaker's
                        turn to make a guess.

                    </li>
                </ul>
`
        },
        codemasterId: {
            value: zkAppStates.value.codemasterId.length > 10 ? formatAddress(zkAppStates.value.codemasterId) : zkAppStates.value.codemasterId,
            information: `
    <ul>
        <li>

            This state represent the unique identifier of the code master, which is stored as the hash of his PublicKey.
        </li>
        <li>
            We avoid storing the PublicKey directly because it occupies two fields. By hashing the PublicKey, we save
            two
            storage states, reducing the total required states from four to two.
        </li>
        <li>
            Player identifiers are crucial for correctly associating each method call with the appropriate player, such
            as
            linking makeGuess to the Code Breaker and giveClue to the Code Master.
        </li>
        <li>
            Restricting access to methods ensures that only the intended players can interact with the zkApp, preventing
            intruders from disrupting the 1 vs 1 interactive game.
        </li>
    </ul>
                `
        },
        codebreakerId: {
            value: zkAppStates.value.codebreakerId.length > 10 ? formatAddress(zkAppStates.value.codebreakerId) : zkAppStates.value.codebreakerId,
            information: `
    <ul>
        <li>
            This state represent the unique identifier of the code breaker, which is stored as the hash of his
            PublicKey.
        </li>
        <li>
            We avoid storing the PublicKey directly because it occupies two fields. By hashing the PublicKey, we save
            two
            storage states, reducing the total required states from four to two.
        </li>
        <li>
            Player identifiers are crucial for correctly associating each method call with the appropriate player, such
            as
            linking makeGuess to the Code Breaker and giveClue to the Code Master.
        </li>
        <li>
            Restricting access to methods ensures that only the intended players can interact with the zkApp, preventing
            intruders from disrupting the 1 vs 1 interactive game.
        </li>
    </ul>

            `
        },
        solutionHash: {
            value: zkAppStates.value.solutionHash.length > 10 ? formatAddress(zkAppStates.value.solutionHash) : zkAppStates.value.solutionHash,
            information: `
    <ul>
        <li>
            The solution must remain private; otherwise, the game loses its purpose. Therefore, whenever the Code Master
            provides a clue, they should enter the secretCombination as a method parameter.
        </li>
        <li>
            To maintain the integrity of the solution, the solution is hashed and stored on-chain when the game is first
            created.
        </li>
        <li>
            Each time the Code Master calls the giveClue method, the entered private secret combination is salted,
            hashed,
            and compared against the solutionHash stored on-chain. <br> This process ensures the integrity of the
            combination and helps prevent side-channel attacks.
        </li>
        <li>
            Note: Unlike player IDs, where hashing is used for data compression, here it is used to preserve the privacy
            of
            the on-chain state and to ensure the integrity of the values entered privately with each method call.
        </li>
    </ul>
`
        }
        ,
        maxAttempts: {
            value: zkAppStates.value.maxAttempts,
            information: `
                <ul>
                    <li>
                        This state is set during game initialization and and ensures the number of attempts is limited between 5 and
                        15.
                    </li>
                </ul>
    ` },
        isSolved: {
            value: zkAppStates.value.isSolved, information: `
            <ul>
                <li>
                    This state is a Bool that indicates whether the Code Breaker has successfully uncovered the solution.
                </li>
                <li>
                    It is crucial for determining the end of the game, signaling completion once the Code Breaker achieves 4
                    hits
                    within the allowed maxAttempts.
                </li>
            </ul>
            ` },
        packedGuessHistory: {
            value: zkAppStates.value.packedGuessHistory,
            information: `
    <ul>
        <li>
            This state represents the history of guesses made by the Code Breaker, serialized and packed into a single
            Field
            element.
        </li>

        <li>
            It not only plays a role in storing the history of the game but also serves as a means for the Code Master
            to
            provide clues based on the latest guess.</li>

        <li>The latest guess is retrieved within the zkApp's giveClue method by unpacking the guesses and indexing the
            most
            recent one based on the turnCount state.</li>

        <li>After deserializing and fetching the correct guess, the guess represents the Code Breaker's move as a single
            Field encoded in decimal.

            <ul>
                <li>For example, if the guess is 4 5 2 3, it would be used as a Field value of 4523.</li>

            </ul>
        </li>
        <li>The Code Master will later split it into its individual digits to compare against the solution.
        </li>
                <li>
            Currently, the value of this state is ${zkAppStates.value.packedGuessHistory}, and we can break down how this value was derived step by step.<br>
            <strong>Deserialization Process</strong><br>
            When deserializing ${zkAppStates.value.packedGuessHistory}, we obtain the following array of guesses:<br>
            ${zkAppStates.value.unpackedGuessHistory}<br>
            <strong>Binary Representation of Guesses</strong><br>
            Each guess is converted into its 14-bit binary equivalent:<br>
            ${zkAppStates.value.unpackedBinaryGuessHistory.replace(/\[0,0,0,0,0,0,0,0,0,0,0,0,0,0\],/g, '').replace('[0,0,0,0,0,0,0,0,0,0,0,0,0,0]', '[0,0,0,0,0,0,0,0,0,0,0,0,0,0],.....,[0,0,0,0,0,0,0,0,0,0,0,0,0,0]')}<br>
            <strong>Flattening and Conversion to Field</strong><br>
            Finally, we treat this sequence as a little-endian binary number, meaning the least significant bits come first. When converting this back into a Field value, we get:
                    ${zkAppStates.value.packedGuessHistory}
        </li>
    </ul>
`
        },
        packedClueHistory: {
            value: zkAppStates.value.packedClueHistory,
            information: `
    <ul>
        <li>This state represents the history of clues provided by the Code Master.</li>
        <li>
            Unlike packedGuessHistory, this state is not directly used within the zkApp but serves as an untampered
            record
            of clues, showing the results of all the Code Breaker's guesses.
        </li>
        <li>
            Note: The Code Breaker is expected to fetch this state off-chain, unpack the clues, retrieve and deserialize
            the
            latest clue<br> and interpret the result to accurately understand the outcome of their previous guess and
            adjust
            their strategy accordingly.
        </li>
        <li>
            This state is a single Field element that represents a packed and serialized value of the clues.
            <ul>
                <li>
                    Essentially, this state compacts multiple small states (binary-encoded clues) into one on-chain
                    Field.
                </li>
            </ul>
        </li>
        <li>
            Each clue consists of four digits, where each digit can be 0, 1, or 2, meaning the clue digits fall within
            the
            range of a 2-bit number. These digits are combined and encoded as an 8-bit Field in decimal format.
            <ul>
                <li>
                    For example, if the clue is 1 1 1 1, it would be stored as a field of value 15.
                </li>
            </ul>
        </li>
        <li>
            The packedClueHistory state demonstrates an efficient packing technique that stores multiple small Field
            elements (binary-encoded) into a single compact value.
        </li>
        <li>
            Currently, the value of this state is ${zkAppStates.value.packedClueHistory}, and we can break down how this value was derived step by step.<br>
            <strong>Deserialization Process</strong><br>
            When deserializing ${zkAppStates.value.packedClueHistory}, we obtain the following array of clues:<br>
            ${zkAppStates.value.unpackedClueHistory}<br>
            <strong>Binary Representation of Clues</strong><br>
            Each clue is converted into its 8-bit binary equivalent:<br>
            ${zkAppStates.value.unpackedBinaryClueHistory.replace(/\[0,0,0,0,0,0,0,0\],/g, '').replace('[0,0,0,0,0,0,0,0]', '[0,0,0,0,0,0,0,0],.....,[0,0,0,0,0,0,0,0]')}<br>
            <strong>Flattening and Conversion to Field</strong><br>
            Finally, we treat this sequence as a little-endian binary number, meaning the least significant bits come first. When converting this back into a Field value, we get:
                    ${zkAppStates.value.packedClueHistory}
        </li>

    </ul>
` },

    }

})
watch(() => zkAppStates.value?.turnCount, () => {
    guesses.value =
        zkAppStates.value.guessesHistory.slice(0, zkAppStates.value.maxAttempts)
})

</script>
<style scoped>
.board__container {
    border: 1px solid #222;
}

.logs__container {
    border: 1px solid #222;
    border-left: none;
}

.color-picker__container {
    border: 1px solid #222;
}

.logs-title {
    border-bottom: 1px solid #222;
}

:deep(.el-popper) {
    width: 70% !important;
}
</style>