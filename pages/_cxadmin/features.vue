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
              v-for="feature in currentFeatures[(new Date(year, month-1, day, 0, 0, 0)).getTime()]"
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
            <n-container>
              <h4>
                {{ `Scenes for ${(new Date(timestamp)).toDateString()}` }}
              </h4>
              <n-card
                v-for="feature in currentFeatures[timestamp]"
              >
                <template #cover>
                  <img :src="feature.scene.previews.thumbnail">
                </template>
                <n-ellipsis
                  :tooltip="false"
                  line-clamp="4"
                >
                  {{ feature.scene.text }}
                </n-ellipsis>
                <n-text>Change time for feature</n-text>
                <n-date-picker
                  type="datetime"
                >
                </n-date-picker>
              </n-card>
            </n-container>
          </n-modal>
        </n-tab-pane>

        <n-tab-pane name="queue" tab="Queue">
          <h3>Featured Scene Queue</h3>
          <p>If there aren't any scenes schedules to be featured on a given day, we pull the top item from this queue of scenes.</p>
          <Container
            id="queue-container"
            @drop="onDrop"
          >
            <Draggable v-for="scene in queue" :key="scene.id">
              <n-card>
                <template #cover>
                  <img :src="scene.previews.thumbnail">
                </template>
                <n-ellipsis
                  :tooltip="false"
                  line-clamp="4"
                >
                  {{ scene.text }}
                </n-ellipsis>
              </n-card>
            </Draggable>
          </Container>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Container,
  Draggable,
DropResult
} from "vue3-smooth-dnd";

import {
  NCalendar,
  NCard,
  NDatePicker,
  NEllipsis,
  NModal,
  NTabs,
  NTabPane,
  NText,
} from "~/utils/fixnaive.mjs";

import {
  amISuperuser,
  getFeaturesInRange,
  getFeatureSceneQueue,
  updateFeatureQueue,
  GetSceneResponseT,
  SceneFeatureT,
} from "~/utils/apis";


const { $backendCall } = useNuxtApp();

definePageMeta({
  layout: 'admin'
});

const isSuperuser = ref(true);  // TODO: Update this
const superuserStatus = ref("unknown");

let currentFeatures: Record<number, SceneFeatureT[]> = reactive({});
let queue: Ref<GetSceneResponseT[]> = ref([]);

const showModal = ref(false);

const timestamp = ref(new Date().getTime());
const date = computed<Date>(() => {
  return new Date(timestamp.value);
});
const calendarStartDate = ref(0);
const calendarEndDate = ref(0);
const featureTime = ref(0);

function stripTime(date: Date | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// It's better to update the start and end dates here,
// rather than as computed values based on `date`.
// They'll only need to update when the panel changes, but `date` can change
// within the same month
function onCalendarPanelChange() {
  const d = stripTime(timestamp.value);
  d.setDate(1);
  calendarStartDate.value = d.getTime();
  d.setMonth(d.getMonth() + 1);
  calendarEndDate.value = d.getTime();
}

async function fetchCurrentFeatures(): Promise<SceneFeatureT[]> {
  return getFeaturesInRange($backendCall, calendarStartDate.value, calendarEndDate.value);
}


function handleChangeDate(ts: number) {
  timestamp.value = ts;
}

function onDrop(result: DropResult) {
  queue.value = applyDrag(queue.value, result);
  updateFeatureQueue($backendCall, queue.value.map(item => item.id));
}

function applyDrag(arr: GetSceneResponseT[], dragResult: DropResult) {
  const { removedIndex, addedIndex, payload } = dragResult;

  if (removedIndex === null && addedIndex === null) return arr;
  const result = [...arr];
  let itemToAdd = payload;
  
  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0];
  }
  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd);
  }
  return result;
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

  queue.value = await getFeatureSceneQueue($backendCall);
});

watch(timestamp, () => {
  showModal.value = true; 
});
</script>

<style scoped lang="less">
html {
  background-color: none;
}

.n-calendar {

  margin: auto;
  width: 60rem;

  .n-calendar-cell {
    background: red;
  }
}

.n-card {
  max-height: 200px;
  max-width: 50%;
  margin: 5px;
  overflow: hidden;
}

#queue-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
