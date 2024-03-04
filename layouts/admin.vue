<template>
  <n-notification-provider>
    <div id="admin-root">
      <slot />
    </div>
  </n-notification-provider>
</template>

<style lang="less">
#admin-root {
  color: #FFF;
  pointer-events: all;
  margin: 15px;
}
</style>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { NNotificationProvider } from "~/utils/fixnaive.mjs";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { showWWT } = storeToRefs(constellationsStore);

onMounted(() => {
  showWWT.value = false;
});

onUnmounted(() => {
  showWWT.value = true;
});
</script>
