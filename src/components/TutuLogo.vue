<template>
  <svg class="tutu-logo-svg" :width="props.size" :height="props.size" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <!-- 天线 -->
    <line x1="60" y1="40" x2="60" y2="20" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
    <circle cx="60" cy="15" r="6" fill="#2563eb"/>
    <!-- 抬起打招呼的右手 -->
    <path d="M88 58 q14 -4 12 -16" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
    <circle cx="100" cy="38" r="5" fill="none" stroke="#2563eb" stroke-width="3"/>
    <!-- 身体 -->
    <rect x="28" y="45" width="64" height="52" rx="12" fill="#ffffff" stroke="#2563eb" stroke-width="3"/>
    <!-- 屏幕/脸 -->
    <rect x="38" y="55" width="44" height="28" rx="7" fill="#e8f0fe" stroke="#2563eb" stroke-width="2"/>
    <!-- 眼睛 -->
    <circle cx="52" cy="66" r="4" fill="#2563eb"/>
    <circle cx="68" cy="66" r="4" fill="#2563eb"/>
    <!-- 微笑 -->
    <path d="M50 77 Q60 84 70 77" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
    <!-- 耳朵 -->
    <rect x="20" y="58" width="8" height="16" rx="4" fill="#2563eb" opacity="0.35"/>
    <rect x="92" y="58" width="8" height="16" rx="4" fill="#2563eb" opacity="0.35"/>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number }>(), { size: 96 })
</script>

<style scoped>
.tutu-logo-svg { display: block; }
</style>