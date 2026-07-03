<template>
  <span
    class="fluent-icon"
    :class="{ 'fluent-icon-spin': spin }"
    :style="iconStyle"
    aria-hidden="true"
    v-html="svg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { fluentIcons, type FluentIconName } from './icons';

const props = withDefaults(defineProps<{
  name: FluentIconName,
  size?: number | string,
  color?: string,
  spin?: boolean,
}>(), {
  size: '1em',
  color: 'currentColor',
  spin: false,
});

const svg = computed(() => fluentIcons[props.name]);

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size;

  return {
    width: size,
    height: size,
    color: props.color,
  };
});
</script>

<style scoped lang="less">
.fluent-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex: 0 0 auto;
  vertical-align: -0.125em;
}

.fluent-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  fill: currentColor;
}

.fluent-icon :deep(path) {
  fill: currentColor;
}

.fluent-icon-spin {
  animation: fluent-icon-spin 1s linear infinite;
}

@keyframes fluent-icon-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
