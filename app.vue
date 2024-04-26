<template>
  <div id="app">
    <WWTViewSSR ref="wwt" v-show="showWWT" />
    <NuxtLayout class="page">
      <NuxtPage />
    </NuxtLayout>
    <CookieControl locale="en">
      <template #bar>
        <h3>Cookie Consent</h3>
        <p>This website uses cookies. Click ‘Accept’ to allow cookies from all
          sources, ‘Decline’ to reject all nonessential cookies, or the ‘Learn more …’
          button for details. For more information, see our
          <NuxtLink to="https://numfocus.org/privacy-policy" target="_blank">Privacy Policy</NuxtLink>.
        </p>
      </template>
      <template #cookie="{ config }">
        <span v-for="c in config" :key="c.id" v-text="c.cookies" />
      </template>
    </CookieControl>
    <VueAxePopup v-if="showAxePopup" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { VueAxePopup } from 'vue-axe';
import { useConstellationsStore } from "~/stores/constellations";
import { initializeSession } from "~/utils/apis";

const constellationsStore = useConstellationsStore();
const { showWWT } = storeToRefs(constellationsStore);

const { $backendCall } = useNuxtApp();

const showAxePopup = ref(false);

onMounted(() => {
  initializeSession($backendCall);

  showAxePopup.value = process.env.NODE_ENV !== 'production';
});
</script>

<style lang="less">
#app {
  width: 100vw;

  // We need to use 100% for the height, not 100vh, because on mobile the latter
  // will include any area dedicated to a browser address bar overlay, so some
  // of our UI might get obscured. 100%, on the other hand, gives us the height
  // of the view area not including any overlays.
  height: 100%;
  margin: 0;
  overflow: hidden;
  position: fixed;

  .wwtelescope-component {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
    pointer-events: all;
  }
}

.page {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  // Don't eat up WWT events by default. Children should re-enable pointer
  // events as needed.
  pointer-events: none;
}

a {
  text-decoration: none;
  color: #7fe7c4;

  &:hover {
    color: #5acea7;
    text-decoration: underline;
  }

  &:visited {
    color: #7fe7c4;
  }
}

.cookieControl__ModalClose {
  display: none;
}
</style>
