<template>
  <div id="features-root">
    <h1>Featured Scenes</h1>

    <div v-if="isSuperuser">
      <n-tabs default-value="scheduled">
        <n-tab-pane name="scheduled" tab="Scheduled">
          <h3>Current scheduled scenes</h3>
          <n-calendar
            v-model="timestamp"
            #="{ year, month, date: day }"
            :on-panel-change="onCalendarPanelChange"
            @update:value="handleChangeDate"
          >
            <div>{{ year }}-{{ month }}-{{ day }}</div>
            <n-text
              v-for="feature in currentFeatures[Date.UTC(year, month-1, day, 0, 0, 0)]"
              strong
              style="font-size: smaller;"
            >
              {{ (new Date(feature.feature_time)).toLocaleTimeString() }}
            </n-text>
          </n-calendar>

          <n-modal
            v-model:show="showModal"
            :title="`Features for ${date.toLocaleDateString()}`"
            :bordered="false"
            size="huge"
            role="dialog"
            aria-modal="true"
          >
          <n-text>MODAL</n-text>
          </n-modal>
        </n-tab-pane>

        <n-tab-pane name="queue" tab="Queue">
          <h3>Featured Scene Queue</h3>
          <p>If there aren't any scenes schedules to be featured on a given day, we pull the top item from this queue.</p>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NCalendar,
  NModal,
  NTabs,
  NTabPane,
  NText,
} from "~/utils/fixnaive.mjs";

import {
  amISuperuser,
  getFeaturesInRange,
} from "~/utils/apis";

import {
  SceneFeatureT
} from "~/utils/apis";


const { $backendCall } = useNuxtApp();

definePageMeta({
  layout: 'admin'
});

const isSuperuser = ref(true);  // TODO: Update this
const superuserStatus = ref("unknown");

let currentFeatures: Record<number, SceneFeatureT[]> = reactive({});

const showModal = ref(false);

const timestamp = ref(new Date().getTime());
const date = computed<Date>(() => {
  return new Date(timestamp.value);
});
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
  const d = stripTime(timestamp.value);
  d.setUTCDate(1);
  calendarStartDate.value = d.getTime();
  d.setUTCMonth(d.getUTCMonth() + 1);
  calendarEndDate.value = d.getTime();
}

async function fetchCurrentFeatures(): Promise<SceneFeatureT[]> {
  return getFeaturesInRange($backendCall, calendarStartDate.value, calendarEndDate.value);
}


function handleChangeDate(ts: number) {
  timestamp.value = ts;
}

onBeforeMount(async () => {
  onCalendarPanelChange();
  currentFeatures = reactive({});
  const features = await fetchCurrentFeatures();
  features.forEach(feature => {
    const featureTime = new Date(feature.feature_time);
    const dateTimestamp = stripTime(featureTime).getTime();
    if (dateTimestamp in currentFeatures) {
      currentFeatures[dateTimestamp].push(feature);
    } else {
      currentFeatures[dateTimestamp] = [feature];
    }
  });
  console.log(currentFeatures);
});

watch(timestamp, () => {
  console.log("HERE");
  showModal.value = true; 
});
</script>

<style scoped lang="less">
.n-calendar {

  margin: auto;
  width: 60rem;

  .n-calendar-cell {
    background: red;
  }
}
</style>
