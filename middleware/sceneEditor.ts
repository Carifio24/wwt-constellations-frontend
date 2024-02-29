// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have permissions to edit
// the current scene, as identified by a URL parameter `id`.

import { permissionsMiddleware } from "./permissionsMiddlewareBase";
import { scenePermissions } from "~/utils/apis";

export default permissionsMiddleware(
  (fetcher, to) => scenePermissions(fetcher, to.params.id as string),
  (value) => !!value && value.edit
);
