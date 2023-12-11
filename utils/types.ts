// Copyright 2023 the .NET Foundation

import * as t from "io-ts";
import * as tc from "io-ts-types";

import { Color } from "@wwtelescope/engine";

export const PlaceDetails = t.type({
  ra_rad: t.number,
  dec_rad: t.number,
  roll_rad: t.union([t.number, t.undefined]),
  roi_height_deg: t.number,
  roi_aspect_ratio: t.number,
});

export type PlaceDetailsT = t.TypeOf<typeof PlaceDetails>;

export const ImageWwt = t.type({
  base_degrees_per_tile: t.number,
  bottoms_up: t.boolean,
  center_x: t.number,
  center_y: t.number,
  file_type: t.string,
  offset_x: t.number,
  offset_y: t.number,
  projection: t.string,
  quad_tree_map: t.string,
  rotation: t.number,
  tile_levels: t.number,
  width_factor: t.number,
  thumbnail_url: t.string,
});

export type ImageWwtT = t.TypeOf<typeof ImageWwt>;

export const ImageStorage = t.type({
  legacy_url_template: t.union([t.string, t.undefined]),
});

export type ImageStorageT = t.TypeOf<typeof ImageStorage>;

export const ImagePermissions = t.intersection([
  t.type({
    copyright: t.string,
    license: t.string,
  }),
  t.partial({
    credits: t.string,
  })
]);

export type ImagePermissionsT = t.TypeOf<typeof ImagePermissions>;

export const ImageDisplayInfo = t.intersection([
  t.type({
    id: t.string,
    wwt: ImageWwt,
    storage: ImageStorage,
    permissions: ImagePermissions,
  }),
  t.partial({
    alt_text: t.string,
  })
]);

export type ImageDisplayInfoT = t.TypeOf<typeof ImageDisplayInfo>;

export const SceneImageLayer = t.type({
  image_id: t.string,
  opacity: t.number,
});

export type SceneImageLayerT = t.TypeOf<typeof SceneImageLayer>;

export const SceneImageLayerHydrated = t.type({
  image: ImageDisplayInfo,
  opacity: t.number,
});

export type SceneImageLayerHydratedT = t.TypeOf<typeof SceneImageLayerHydrated>;

export const SceneContent = t.type({
  image_layers: t.array(SceneImageLayer),
});

export type SceneContentT = t.TypeOf<typeof SceneContent>;

export const SceneContentHydrated = t.intersection([
  t.partial({
    background: ImageDisplayInfo,
  }),
  t.type({
    image_layers: t.union([t.array(SceneImageLayerHydrated), t.undefined]),
  })
]);

export type SceneContentHydratedT = t.TypeOf<typeof SceneContentHydrated>;

export const SceneDisplayInfo = t.type({
  id: t.string,
  place: PlaceDetails,
  content: SceneContentHydrated,
});

export type SceneDisplayInfoT = t.TypeOf<typeof SceneDisplayInfo>;

export const SceneCreationInfo = t.intersection([
  t.partial({
    outgoing_url: t.string,
  }),
  t.type({
    place: PlaceDetails,
    content: SceneContent,
    text: t.string,
  })
]);

export type SceneCreationInfoT = t.TypeOf<typeof SceneCreationInfo>;

export const ScenePreviews = t.partial({
  video: t.string,
  thumbnail: t.string,
});

export type ScenePreviewsT = t.TypeOf<typeof ScenePreviews>;

export interface SkymapSceneInfo {
  id: string;
  place: PlaceDetailsT;
  content: SceneContentHydratedT;
  color: Color;
  linewidth: number;
  current: boolean;
  adjacent: boolean;
}

export const TessellationCell = t.type({
  neighbors: t.array(t.string),
  location: t.type({
    ra: t.number,
    dec: t.number,
  }),
  scene_id: t.string
});

export type TessellationCellT = t.TypeOf<typeof TessellationCell>;

export const SceneFeature = t.type({
  id: t.string,
  feature_time: tc.date,
  scene: SceneContentHydrated,
});

export type SceneFeatureT = t.TypeOf<typeof SceneFeature>;

// Older types, potentially to be removed:

export interface FitsColorMaps {
  wwt: string;
  desc: string;
}

export class BackgroundImageset {
  public imagesetName: string;
  public displayName: string;

  constructor(displayName: string, imagesetName: string) {
    this.displayName = displayName;
    this.imagesetName = imagesetName;
  }
}
