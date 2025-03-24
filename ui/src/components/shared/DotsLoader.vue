<template>
    <div class="dots mb-1">
        <span class="dot" v-for="(_dot, index) in 3" :key="index" :style="{ animationDelay: `${index * 0.3}s` }">
        </span>
    </div>
</template>
<style lang="css" scoped>
.dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

.dot {
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
    animation: blink 1s infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 0.2;
    }

    50% {
        opacity: 1;
    }
}
</style>