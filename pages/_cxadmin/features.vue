<template>
  <div id="features-root">
    <h1>Featured Scenes</h1>

    <div v-if="isSuperuser">
      <n-tabs default-value="scheduled">
        <n-tab-pane name="scheduled" tab="Scheduled">
          <h3>Current scheduled scenes</h3>
          <n-button @click="showAddFeatureModal = true">
            <p>Add a feature</p>
          </n-button>
          <n-modal
            v-model:show="showAddFeatureModal"
            title="Add a feature"
            size="larger"
          >
            <n-card>
              <n-input
                v-model:value="addFeatureSceneID"
                type="text"
                placeholder="Enter scene ID"
              >
              </n-input>
              <n-date-picker
                v-model:value="addFeatureTime"
                type="datetime"
              >
              </n-date-picker>
              <n-button @click="addFeature(addFeatureSceneID, addFeatureTime)">Add feature</n-button>
            </n-card>
          </n-modal>
          <n-calendar
            v-model:value="timestamp"
            #="{ year, month, date: day }"
            :on-panel-change="onCalendarPanelChange"
            @update:value="handleChangeDate"
          >
            <div>{{ year }}-{{ month }}-{{ day }}</div>
            <n-text
              v-if="currentFeatures[(new Date(year, month-1, day, 0, 0, 0)).getTime()]?.length > 0"
            >
              {{ `${currentFeatures[(new Date(year, month-1, day, 0, 0, 0)).getTime()]?.length} feature(s) scheduled` }}
            </n-text>
          </n-calendar>

          <n-modal
            v-model:show="showDateFeaturesModal"
            :title="`Features for ${date.toLocaleDateString()}`"
            size="large"
            role="dialog"
            aria-modal="true"
          >
            <n-card>
              <h4>
                {{ `Scenes for ${(new Date(timestamp)).toDateString()}` }}
              </h4>
                <n-card
                  v-for="feature in currentFeatures[timestamp]"
                  class="feature-item"
                >
                  <template #cover>
                    <n-button
                      class="remove-button"
                      @click="() => removeFeature(feature)"
                      :bordered="false"
                      aria-label="Remove feature button"
                    >
                      <n-icon size="30">
                        <CloseOutlined />
                      </n-icon>
                    </n-button>
                  </template>
                  <p>{{ `@${feature.scene.handle.handle}` }}</p>
                  <n-ellipsis
                    :tooltip="false"
                    line-clamp="4"
                    class="feature-text"
                  >
                    {{ feature.scene.text }}
                  </n-ellipsis>
                  <n-text>Change time for feature</n-text>
                  <n-date-picker
                    :value="(new Date(feature.feature_time)).getTime()"
                    type="datetime"
                    :on-update:value="(time: number) => updateFeatureTime(feature, time)"
                  >
                  </n-date-picker>
                </n-card>
            </n-card>
          </n-modal>
        </n-tab-pane>

        <n-tab-pane name="queue" tab="Queue">
          <h3>Featured Scene Queue</h3>
          <p>If there aren't any scenes schedules to be featured on a given day, we pull the top item from this queue of scenes.</p>
             <n-button class="queue-add-button" @click="() => showAddQueueSceneModal = true" :bordered="false" aria-label="Remove feature button">
               <n-icon size="30">
                 <AddRound />
               </n-icon>
               Add a scene to the queue
             </n-button>
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
          <n-modal
            v-model:show="showAddQueueSceneModal"
            title="Select scene to add"
            size="large"
            role="dialog"
            aria-modal="true"
          >
            <n-card>
              <n-input
                v-model:value="addToQueueSceneID"
                type="text"
                placeholder="Enter scene ID"
              >
              </n-input>
              <div class="button-row">
                <n-button @click="() => addSceneToQueue(addToQueueSceneID)">Add to queue</n-button>
              </div>
            </n-card>
          </n-modal>
        </n-tab-pane>
      </n-tabs>
    </div>
    <n-spin v-else
      size="large"
    >
      <template #description>
        Verifying superuser status and loading features
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import {
  Container,
  Draggable,
  DropResult
} from "vue3-smooth-dnd";

import {
  AddRound,
  CloseOutlined
} from "@vicons/material";

import {
  NButton,
  NCalendar,
  NCard,
  NDatePicker,
  NEllipsis,
  NIcon,
  NInput,
  NModal,
  NSpin,
  NTabs,
  NTabPane,
  NText,
} from "~/utils/fixnaive.mjs";

import {
  amISuperuser,
  createFeature,
  deleteFeature,
  getFeaturesInRange,
  updateFeature,
  getFeatureSceneQueue,
  updateFeatureQueue,
  GetSceneResponseT,
  SceneFeatureT,
} from "~/utils/apis";

import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

const { $backendAuthCall } = useNuxtApp();
const notification = useNotification();
const constellationsStore = useConstellationsStore();
const {
  loggedIn,
} = storeToRefs(constellationsStore);

definePageMeta({
  layout: 'admin',
  middleware: ['handle-superuser'],
});

const isSuperuser = ref(false); 

let currentFeatures: Record<number, SceneFeatureT[]> = reactive({});
let queue: Ref<GetSceneResponseT[]> = ref([]);

const showDateFeaturesModal = ref(false);
const showAddQueueSceneModal = ref(false);
const showAddFeatureModal = ref(false);
const addFeatureTime = ref(new Date().getTime());
const addFeatureSceneID = ref("");
const addToQueueSceneID = ref("");

const timestamp = ref(new Date().getTime());
const date = computed<Date>(() => {
  return new Date(timestamp.value);
});
const calendarStartDate = ref(0);
const calendarEndDate = ref(0);


function stripTime(date: Date | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// It's better to update the start and end dates here,
// rather than as computed values based on `date`.
// They'll only need to update when the panel changes, but `date` can change
// within the same month
function onCalendarPanelChange(info?: { year: number, month: number }) {
  const d = info !== undefined ? new Date(info.year, info.month - 1) : new Date(timestamp.value);
  calendarStartDate.value = d.getTime();
  d.setMonth(d.getMonth() + 1);
  calendarEndDate.value = d.getTime();
  addCurrentPanelFeatures();
}

async function addCurrentPanelFeatures(): Promise<void> {
  const fetcher = await $backendAuthCall();
  const features = await getFeaturesInRange(fetcher, calendarStartDate.value, calendarEndDate.value);
  features.forEach(feature => {
    addToCurrentFeatures(feature);
  });
}

function handleChangeDate(_ts: number) {
  showDateFeaturesModal.value = true;
}

function addToCurrentFeatures(feature: SceneFeatureT) {
  const featureTime = new Date(feature.feature_time);
  const time = stripTime(featureTime).getTime();
  if (time in currentFeatures) {
    currentFeatures[time].push(feature);
  } else {
    currentFeatures[time] = [feature];
  }
}

function removeFromCurrentFeatures(feature: SceneFeatureT) {
    const featureTime = new Date(feature.feature_time);
    const time = stripTime(featureTime).getTime();
    const idx = currentFeatures[time].indexOf(feature);
    if (idx >= 0) {
      currentFeatures[time].splice(idx, 1);
    }
}

async function updateFeatureTime(feature: SceneFeatureT, time: number) {
  console.log("Feature time changed");
  const fetcher = await $backendAuthCall();
  const update = { feature_time: time };
  try {
    await updateFeature(fetcher, feature.id, update); 
    const newDate = new Date(time);
    feature.feature_time = newDate.toISOString();
    removeFromCurrentFeatures(feature);
    addToCurrentFeatures(feature);
  } catch (err) {
    console.error(err);
  }
}

async function addFeature(sceneID: string, time: number) {
  try {
    const fetcher = await $backendAuthCall();
    const id = await createFeature(fetcher, sceneID, time);
    const feature = await getFeature(fetcher, id);
    addToCurrentFeatures(feature);
    showAddFeatureModal.value = false;
    notification.success({ content: "Feature created.", duration: 3000 });
  } catch (err) {
    notification.error({ content: "Error creating feature.", duration: 3000 });
    console.error(err);
  }
}

async function removeFeature(feature: SceneFeatureT) {
  try {
    const fetcher = await $backendAuthCall();
    await deleteFeature(fetcher, feature.id);
    removeFromCurrentFeatures(feature);
    notification.success({ content: "Feature removed.", duration: 3000 });
  } catch (err) {
    notification.error({ content: "Error removing feature.", duration: 3000 });
    console.error(err);
  }
}

async function addSceneToQueue(sceneID: string) {
  const fetcher = await $backendAuthCall();
  const scene = await getScene(fetcher, sceneID);
  if (scene === null) {
    notification.error({ content: "Invalid scene ID.", duration: 3000 });
    return;
  }
  const queueToTry = queue.value.map(scene => scene.id);
  queueToTry.push(sceneID);
  try {
    await updateFeatureQueue(fetcher, queueToTry); 
    queue.value.push(scene);
    notification.success({ content: "Scene added to front of queue.", duration: 3000 });
  } catch (err) {
    notification.error({ content: "Error adding scene to queue.", duration: 3000 }); 
  }

}

async function onDrop(result: DropResult) {
  const fetcher = await $backendAuthCall();
  queue.value = applyDrag(queue.value, result);
  updateFeatureQueue(fetcher, queue.value.map(item => item.id));
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

watch(
  loggedIn,
  async (newLoggedIn) => {
    if (!newLoggedIn) {
      isSuperuser.value = false;
    } else {
      const fetcher = await $backendAuthCall();
      isSuperuser.value = (await amISuperuser(fetcher)).result;
      if (!isSuperuser.value) {
        return;
      }

      currentFeatures = reactive({});
      onCalendarPanelChange();
      queue.value = await getFeatureSceneQueue(fetcher);
    }
  },
  { immediate: true }
);
</script>

<style lang="less">
html {
  background-color: none;
}

.n-calendar {

  margin: auto;
  width: 60rem;

}

.n-card {

  max-height: 90vh;
  width: 70%;
  background: black;

  .n-card-cover {
    display: flex;
    flex-direction: row;
  }
}

.n-button {
  cursor: pointer;
}

#queue-container {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.feature-item {
  width: 100%;
  
  .n-card__content {
    display: flex;
    flex-direction: column;
  }

  .remove-button {
    margin-left: auto;
  }
}
</style>
