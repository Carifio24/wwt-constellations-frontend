<template>
  <div id="features-root">
    <h1>Featured Scenes</h1>

    <div v-if="isSuperuser">
      <h3>Current scheduled scenes</h3>
      <n-calendar
        v-model="date"
        #="{ year, month, date }"
        :on-panel-change="onCalendarPanelChange"
        @update:value="handleChangeDate"
      >
      <div>{{ year }}-{{ month }}-{{ date }}</div>
       
      </n-calendar>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NCalendar,
} from "~/utils/fixnaive.mjs";

import {
  amISuperuser,
  getFeaturesInRange,
} from "~/utils/apis";

import {
  SceneFeatureT
} from "~/utils/types";


const { $backendAuthCall } = useNuxtApp();

definePageMeta({
  layout: 'admin'
});

const isSuperuser = ref(true);  // TODO: Update this
const superuserStatus = ref("unknown");

const knownFeatures: Map<number, SceneFeatureT[]> = new Map();

const date = ref(0);
const calendarStartDate = ref(0);
const calendarEndDate = ref(0);

function stripTime(date: Date | number): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// It's better to update the start and end dates here,
// rather than as computed values based on `date`.
// They'll only need to update when the panel changes, but `date` can change
// within the same month
function onCalendarPanelChange() {
  const d = stripTime(date.value);
  d.setUTCDate(1);
  calendarStartDate.value = d.getTime();
  d.setUTCMonth(d.getUTCMonth() + 1);
  calendarEndDate.value = d.getTime();
}

async function fetchCurrentFeatures(): Promise<SceneFeatureT[]> {
  const fetcher = await $backendAuthCall();
  return getFeaturesInRange(fetcher, calendarStartDate.value, calendarEndDate.value);
}


function handleChangeDate(timestamp: number) {
  console.log(timestamp);
  console.log(new Date(timestamp));
}

onMounted(async () => {
  onCalendarPanelChange();
  const features = await fetchCurrentFeatures();
  features.forEach(feature => {
    const featureTime = new Date(feature.feature_time);
    const dateTimestamp = stripTime(featureTime).getTime();
    if (knownFeatures.has(dateTimestamp)) {
      knownFeatures.get(dateTimestamp)?.push(feature);
    } else {
      knownFeatures.set(dateTimestamp, [feature]);
    }
  });
});
</script>

<style scoped>
.n-calendar {
  margin: auto;
  width: 60rem;
}
</style>
