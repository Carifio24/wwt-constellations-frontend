<template>
  <n-config-provider inline-theme-disabled :theme="darkTheme">
    <n-notification-provider>
      <n-layout style="height: 100%; background: none;" position="absolute">
        <!-- Can't figure out how to use n-space to get the internal spacing to work out how I want here -->
        <n-layout-header id="header" :class="{ 'header-mobile': isMobile }">
          <n-button id="drawer-btn" v-model="drawer" @click="drawer = !drawer" :bordered="false" size="small"
            style="padding-right: 0px;" aria-label="Open drawer button">
            <n-icon size="24" aria-labelledby="drawer-btn">
              <MenuRound />
            </n-icon>
          </n-button>

          <n-divider vertical style="height: 24px;" />

          <img :src="require('~/assets/images/wwtlogo.png')" style="width: 24px;" alt="WorldWide Telescope logo" />

          <Breadcrumb />

          <a href="/webclient/" target="_blank">
            <n-button strong type="info" size="small" id="webclient-button" aria-label="Open the WWT webclient">
              <n-icon size="18" aria-labelledby="webclient-button">
                <SendTimeExtensionRound />
              </n-icon>
              <n-text class="icon-button-label">
                WWT Webclient
              </n-text>
            </n-button>
          </a>

          <!-- <WhatsNew /> -->

          <div style="flex: 1;"></div>

          <n-button v-show="screenfull.isEnabled" @click="toggleFullscreen()" quaternary class="fullscreen-button">
            <template #icon>
              <n-icon size="24" aria-label="Exit fullscreen" v-if="fullscreenModeActive"
                :component="FullscreenExitOutlined" />
              <n-icon size="24" aria-label="Enter fullscreen" v-else :component="FullscreenOutlined" />
            </template>
          </n-button>
        </n-layout-header>

        <n-layout-content position="absolute" :class="{ 'content': true, 'content-desktop': !isMobile }">
          <!-- NDrawer has some kind of problem that seems to prevent it from
            working in Nuxt SSR dev mode, no matter what I try. But I don't see
            any ways in which it is particularly important to SSR the drawer,
            and if we make it client-only, things work. So that's what we do for
            now. -->
          <ClientOnly>
            <n-drawer v-model:show="drawer" :width="502" style="max-width: 70%;" :placement="placement"
              aria-label="Drawer">
              <n-drawer-content header-style="justify-content:center">
                <template #header>
                  <n-space :align="'center'" :size="'small'">
                    <img :src="require('/assets/images/wwtlogo.png')" style="width: 24px;"
                      alt="WorldWide Telescope logo" />
                    WorldWide Telescope
                  </n-space>
                  <div style="margin-top: 3px; width: 100%; text-align: center; font-size: smaller">a <NuxtLink
                      to="https://numfocus.org/" target="_blank">NumFOCUS
                    </NuxtLink> project</div>
                </template>
                <n-button v-for="menuItem in menuItems" text tag="a" :href=menuItem.url target="_blank" class="menu-item">
                  {{ menuItem.name }}
                </n-button>
                <template #footer>
                  <n-text style="font-size: smaller">WWT has been supported by
                    <a href="https://numfocus.org" target="_blank">NumFOCUS</a>,
                    the <a href="https://cfa.harvard.edu" target="_blank">Center
                      for Astrophysics | Harvard &amp; Smithsonian</a>, the <a href="https://aas.org"
                      target="_blank">American Astronomical
                      Society</a> (AAS), the
                    <a href="https://dotnetfoundation.org" target="_blank">.NET
                      Foundation</a>, and other sponsors. See <a
                      href="https://worldwidetelescope.org/about/acknowledgments/" target="_blank">the Acknowledgements
                      page</a> for more
                    information. This material is based upon work supported by
                    the National Science Foundation under Grant Nos. <a
                      href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1550701" target="_blank">1550701</a>, <a
                      href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1642446" target="_blank">1642446</a>, and <a
                      href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2004840" target="_blank">2004840</a>. Any
                    opinions, findings, and
                    conclusions or recommendations expressed in this material
                    are those of the author(s) and do not necessarily reflect
                    the views of the National Science Foundation.</n-text>
                  <n-button @click="logInOut">
                    {{ loggedIn ? 'Log out' : 'Log in' }}
                  </n-button>
                </template>
              </n-drawer-content>
            </n-drawer>
          </ClientOnly>

          <slot />
        </n-layout-content>
      </n-layout>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import * as screenfull from "screenfull";
import { storeToRefs } from "pinia";
import { ref } from "vue";

import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  MenuRound,
  SendTimeExtensionRound,
} from "@vicons/material";

import {
  darkTheme,
  type DrawerPlacement,
} from "naive-ui";

import {
  NButton,
  NConfigProvider,
  NDivider,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NNotificationProvider,
  NSpace,
  NText,
} from "~/utils/fixnaive.mjs";

import { useConstellationsStore } from "~/stores/constellations";

const constellationsStore = useConstellationsStore();
const { isMobile, loggedIn } = storeToRefs(constellationsStore);

const { signIn, signOut } = useAuth();

const drawer = ref(false)
const placement = ref<DrawerPlacement>('left')
const menuItems: Array<MenuItem> = [
  { name: "About WWT", url: "https://worldwidetelescope.org/home/" },
  { name: "WWT Webclient", url: "https://worldwidetelescope.org/webclient/" },
  { name: "WWT Swag!", url: "https://numfocus.myspreadshop.com/worldwide+telescope+logo?idea=65144eaf404a6d6dbf0f8dc2" },
  { name: "Support WWT", url: "https://numfocus.org/donate-for-worldwide-telescope" },
  { name: "Acknowledgments", url: "https://worldwidetelescope.org/about/acknowledgments/" },
  { name: "Privacy Policy", url: "https://numfocus.org/privacy-policy" },
  { name: "Terms of Use", url: "https://worldwidetelescope.org/terms/" },
]
interface MenuItem {
  name: string,
  url: string
}

function logInOut() {
  if (loggedIn.value) {
    // It would be nice to redirect to the current path, but since redirect URLs
    // have to belong to a specific list, that's not generically possible.
    signOut().then(() => {
      loggedIn.value = false;
    }).catch((error: Error) => {
      console.log(`Error logging out: ${error.message}`);
    });
  } else {
    signIn("keycloak").then(() => {
      loggedIn.value = true;
    }).catch((error: Error) => {
      console.log(`Error logging in: ${error.message}`);
    });
  }
}

// Fullscreen handling

const fullscreenModeActive = ref(false);

onMounted(() => {
  if (screenfull.isEnabled) {
    fullscreenModeActive.value = screenfull.isFullscreen;
    screenfull.on("change", onFullscreenEvent);
  }
});

onBeforeUnmount(() => {
  if (screenfull.isEnabled) {
    screenfull.off("change", onFullscreenEvent);
  }
});

function toggleFullscreen() {
  if (screenfull.isEnabled) {
    screenfull.toggle();
  }
}

function onFullscreenEvent() {
  fullscreenModeActive.value = screenfull.isFullscreen;
}
</script>

<style type="less">
#header {
  padding: 2px;
  pointer-events: all;
  line-height: 1em;
  background: none;
  z-index: 100;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px 8px;
  flex-wrap: wrap;
}

.header-mobile {
  position: absolute !important;
}

.content {
  background: none;
  pointer-events: none;
}

.content-desktop {
  /* In desktop mode, the main overlay is at the top of the screen, but we need
   * to make sure that it doesn't overlap the header. Sync this value with
   * desktopPaddingTop in MainOverlay.vue!*/
  padding-top: 32px;
}

.menu-item {
  font-size: 1.2rem;
  width: 100%;
  padding: 10px 0px;
}

#webclient-button {
  background-color: rgba(102, 175, 211, 0.5);

  i {
    color: rgba(255, 255, 255, 0.82);
  }
}
</style>
