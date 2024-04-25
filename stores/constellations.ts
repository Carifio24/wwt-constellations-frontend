import { type $Fetch } from "ofetch";
import { defineStore } from "pinia";
import { useBreakpoints } from "@vueuse/core";
import Yallist from "yallist";

import { getHomeTimeline, getHandleTimeline, type GetSceneResponseT, type TimelineResponseT } from "~/utils/apis";
import { type SceneDisplayInfoT } from "~/utils/types";


export const useConstellationsStore = defineStore("wwt-constellations", () => {
  // Whether the user is logged in.
  const { loggedIn } = useOidcAuth();

  // Whether we seem to be in a mobile layout

  const breakpoints = useBreakpoints({
    tablet: 640,
    laptop: 1024,
    desktop: 1280,
  });

  const isMobile = breakpoints.smaller("laptop");

  // Whether the WWT viewer should be shown. This will be false for some
  // administrative screens. This is a state parameter because we don't want to
  // repeatedly create and destroy the WWT widget, so we include it in the very
  // root of the app layout.
  const showWWT = ref(true);

  // This is true when the WWT view is initially created. In that case, when the
  // first scene to display is selected, we warp straight to its location,
  // rather than slewing.
  const viewNeedsInitialization = ref(true);

  // Scenes whose information we've loaded, keyed by their IDs.
  const knownScenes = ref<Map<string, GetSceneResponseT>>(new Map());

  // The scene whose information should be displayed in the main overlay.
  const describedScene = ref<GetSceneResponseT | null>(null);

  // The desired scene for the WWT viewer to display, and the detailed
  // information that the engine needs to show it. The scene may not actually be
  // centered in the view if the user has panned elsewhere, if we're currently
  // slewing towards it, etc.
  const desiredScene = ref<SceneDisplayInfoT | null>(null);

  // "Timeline sources". We have a general concept of a timeline: an ordered
  // list of scenes that we might navigate around. That list might come from
  // various places: the global timeline, the timeline associated with a
  // particular handle, etc. This chunk of code manages these different sources.

  type NextSceneSourceType =
    { type: 'global' } |
    { type: 'single-scene', id: string } |
    { type: 'handle'; handle: string } |
    { type: 'nearby', baseID: string };

  let nextSceneSource = ref<NextSceneSourceType>({ type: 'global' });

  // This is basically an equality test for NextSceneSourceType.
  function needToChangeSceneSource(source: NextSceneSourceType) {
    return !((source.type === 'global' && nextSceneSource.value.type === 'global') ||
      (source.type === 'single-scene' && nextSceneSource.value.type === 'single-scene') ||
      (source.type === 'handle' && nextSceneSource.value.type === 'handle' && source.handle === nextSceneSource.value.handle) ||
      (source.type === 'nearby' && nextSceneSource.value.type === 'nearby' && source.baseID === nextSceneSource.value.baseID));
  }

  // In pracice, we fill out the timeline by calling the `getNextScenes`
  // function and using that to fill out `futureScenes`, a list of upcoming
  // scenes in the timeline.

  type ScenesGetter = (fetcher: $Fetch, pageNum: number) => Promise<TimelineResponseT>;
  let getNextScenes: ScenesGetter = getHomeTimeline;
  let nextNeededPage = 0;
  const futureScenes = ref<GetSceneResponseT[]>([]);

  // Use this function to set the timeline source. If the desired source is the
  // same as the current one, nothing happens and this function returns false.
  // Otherwise we update `getNextScenes`, reset the `futureScenes` state, and
  // return true.
  function updateNextSceneSource(source: NextSceneSourceType): boolean {
    if (!needToChangeSceneSource(source)) {
      return false;
    }

    if (source.type === 'global') {
      getNextScenes = getHomeTimeline;
    } else if (source.type === 'handle') {
      getNextScenes = (fetcher, page) => getHandleTimeline(fetcher, source.handle, page);
    } else if (source.type === 'nearby') {
      // TODO: How to handle pagination for the nearby timeline?
      getNextScenes = async (fetcher, page) => {
        if (page === 0) {
          return await getNearbyTimeline(fetcher, source.baseID);
        } else {
          return { results: [] };
        }
      }
    } else if (source.type === 'single-scene') {
      getNextScenes = async (_fetcher, _page) => { return { results: [] }; };
    }

    nextSceneSource.value = source;
    futureScenes.value = [];
    nextNeededPage = 0;
    return true;
  }

  // Ensure that the future scenes data structure contains at least `n` items.
  // If something fails badly in the backend, it is possible that this function
  // will give up without actually achieving its goal.
  async function ensureForwardCoverage(n: number) {
    // Note that we are currently using $backendCall, not $backendAuthCall,
    // because none of the feeds are personalized. To get personalized feeds
    // we'll need to change that. (And we might also need to fix things up so
    // that we can make authenticated calls in the server-side rendering phase.)
    const MAX_ATTEMPTS = 5;
    const targetLength = n;
    const navigationMode = nextSceneSource;
    const { $backendCall } = useNuxtApp();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      // If, during one of our asynchronous attempts, the app has
      // changed its navigation mode, return.
      if (needToChangeSceneSource(navigationMode.value)) {
        return;
      }

      if (futureScenes.value.length >= targetLength) {
        break;
      }

      const page = nextNeededPage;
      const result = await getNextScenes($backendCall, page);

      // Once again, we must make sure that the navigation situation hasn't
      // change on us while we were waiting for getNextScenes() to resolve.
      if (nextNeededPage === page && !needToChangeSceneSource(navigationMode.value)) {
        for (const scene of result.results) {
          knownScenes.value.set(scene.id, scene);
          futureScenes.value.push(scene);
        }

        nextNeededPage += 1;
      }
    }
  }


  // Separate from the timeline source, we maintain a navigable history of visited scenes.

  const sceneHistory = ref(new Yallist<GetSceneResponseT>());
  const currentHistoryNode = ref<Yallist.Node<GetSceneResponseT> | null>(sceneHistory.value.head);

  // Set the current history item. This function ties the history to
  // `desiredScene` and `describedScene`: it will set them to match the new
  // current item.
  function setCurrentHistoryNode(node: Yallist.Node<GetSceneResponseT>) {
    currentHistoryNode.value = node;

    if (node.value) {
      if (describedScene.value === null || describedScene.value.id != node.value.id) {
        describedScene.value = node.value;
      }

      if (desiredScene.value === null || desiredScene.value.id != node.value.id) {
        desiredScene.value = {
          id: node.value.id,
          place: node.value.place,
          content: node.value.content,
        };
      }

      knownScenes.value.set(node.value.id, node.value);
    }
  }

  function moveBack(count = 1) {
    if (count <= 0) {
      return;
    }

    let node = currentHistoryNode.value;
    if (node === null) {
      return;
    }

    let prevNode: Yallist.Node<GetSceneResponseT> | null = null;

    while (count > 0 && (prevNode = node.prev)) {
      if (prevNode) {
        node = prevNode;
      }

      count -= 1;
    }

    setCurrentHistoryNode(node);
  }

  // This function is async because it might need to go to the timeline to find
  // out what scenes come next.
  async function moveForward(count = 1) {
    if (count <= 0) {
      return;
    }

    // Make sure that we always have forward coverage past the target, so that
    // the "next" button remains available if it should!
    await ensureForwardCoverage(count + 1);

    // These two variables are just containers so that we don't need to update ref values more than once
    let scene: GetSceneResponseT | undefined = undefined;
    let node: Yallist.Node<GetSceneResponseT> | undefined = undefined;

    const scenesToAdd: GetSceneResponseT[] = [];

    while (count > 0) {
      const next = currentHistoryNode.value?.next;

      if (next) {
        node = next;
      } else {
        if (futureScenes.value.length === 0) {
          // Just in case ... once again, ensure that we go past the target to
          // be able to properly make the "next" button clickable or not.
          await ensureForwardCoverage(count + 1);
        }

        scene = futureScenes.value.shift();
        if (scene) {
          scenesToAdd.push(scene);
        }
      }

      count--;
    }

    sceneHistory.value.push(...scenesToAdd);
    if (scene) {
      setCurrentHistoryNode(sceneHistory.value.tail!);
    } else if (node) {
      setCurrentHistoryNode(node);
    }
  }

  // This basically makes the specified scene the current one: it appends it to
  // the history and makes it current, updating the "desired" and "described"
  // scene values.
  async function moveHistoryToScene(id: string) {
    let scene = knownScenes.value.get(id);

    if (scene === undefined) {
      const { $backendCall } = useNuxtApp();
      const fetchedScene = await getScene($backendCall, id);
      if (fetchedScene === null) {
        return;
      }

      scene = fetchedScene;
    }

    sceneHistory.value.push(scene);
    setCurrentHistoryNode(sceneHistory.value.tail!);

    if (scene !== undefined) {
      const futureIndex = futureScenes.value.findIndex(s => s.id === scene?.id);
      if (futureIndex >= 0) {
        futureScenes.value.splice(futureIndex, 1);
      }
    }
  }

  function previousScene(): GetSceneResponseT | null {
    return currentHistoryNode.value?.prev?.value ?? null;
  }


  // Set up state for a single scene

  async function setupForSingleScene(scene: GetSceneResponseT) {
    updateNextSceneSource({ type: 'single-scene', id: scene.id });
    await moveHistoryToScene(scene.id);
  }

  async function useGlobalTimeline() {
    if (updateNextSceneSource({ type: 'global' })) {
      await ensureForwardCoverage(8);
    }
  }

  async function useHandleTimeline(handle: string) {
    if (updateNextSceneSource({ type: 'handle', handle })) {
      await ensureForwardCoverage(8);
    }
  }

  async function useNearbyTimeline(baseID: string) {
    if (updateNextSceneSource({ type: 'nearby', baseID })) {
      await moveHistoryToScene(baseID);
      await ensureForwardCoverage(8);
    }
  }

  // Cross-component plumbing for the region-of-interest display

  const roiEditHeightPercentage = ref(50);
  const roiEditWidthPercentage = ref(50);

  // Cross-component plumbing for positioning the WWT camera

  const viewportLeftBlockage = ref(0);
  const viewportBottomBlockage = ref(0);

  // Various UI elements want to track whether we're in the midst of moving to a
  // scene. We can't just keep track of this with a boolean, though, because
  // multiple moves can be triggered simultaneously (by interrupting one with
  // another).

  const numActiveMoves = ref(0);
  const isMovingToScene = computed(() => numActiveMoves.value > 0);

  return {
    currentHistoryNode,
    describedScene,
    desiredScene,
    ensureForwardCoverage,
    futureScenes,
    isMobile,
    isMovingToScene,
    knownScenes,
    loggedIn,
    moveBack,
    moveForward,
    moveHistoryToScene,
    nextSceneSource,
    numActiveMoves,
    previousScene,
    roiEditHeightPercentage,
    roiEditWidthPercentage,
    sceneHistory,
    setupForSingleScene,
    showWWT,
    useGlobalTimeline,
    useHandleTimeline,
    useNearbyTimeline,
    viewNeedsInitialization,
    viewportBottomBlockage,
    viewportLeftBlockage,
  }
});
