// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have permissions to edit
// the current image, as identified by a URL parameter `id`.

import { permissionsMiddleware } from "./permissionsMiddlewareBase";
import { imagePermissions } from "~/utils/apis";

export default permissionsMiddleware(
  (fetcher, to) => imagePermissions(fetcher, to.params.id as string),
  (value) => !!value && value.edit
);
