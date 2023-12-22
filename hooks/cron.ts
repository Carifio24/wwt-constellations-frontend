import { ofetch, $Fetch } from "ofetch";
import { CronJob } from "cron";
import { publicRuntimeConfig } from "../nuxt.config";
import { getNextQueuedScene, popNextQueuedScene } from "../utils/apis";

async function dailyFeatureSetup(backendCall: $Fetch) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const features = await getFeaturesInRange(backendCall, now.getTime(), tomorrow.getTime());

  if (features.length === 0) {
    features.forEach(feature => {
      const date = new Date(feature.feature_time);
      const featureJob = new CronJob(date, () => {
          miscUpdateTimeline(backendCall, feature.scene.id);
        },
        null, true, "America/New_York");
      });
  } else {
    const nextInQueue = await getNextQueuedScene(backendCall);
    await miscUpdateTimeline(backendCall, nextInQueue.id);
    popNextQueuedScene(backendCall);
  }
}


export default function schedulerHook() {
  const backendCall = ofetch.create({
    baseURL: publicRuntimeConfig.apiUrl,
    headers: {
      "Accept": "application/json"
    },
  });

  const dailyJob = new CronJob(
    "59 23 * * *",
    async () => {
     dailyFeatureSetup(backendCall); 
    },
    null, true, "America/New_York"
  );
}
