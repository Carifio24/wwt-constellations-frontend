<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-global-style />
    <n-notification-provider>
      <div id="admin-root">
        <slot />
      </div>
    </n-notification-provider>
  </n-config-provider>
</template>

<style lang="less">
#admin-root {
  pointer-events: all;
  margin: 15px;
}
</style>

<script setup lang="ts">
import {
  darkTheme
} from "naive-ui";
import { storeToRefs } from "pinia";

import { NConfigProvider, NGlobalStyle, NNotificationProvider } from "~/utils/fixnaive.mjs";

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
