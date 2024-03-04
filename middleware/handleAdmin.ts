// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have admin permissions
// on the current handle. Assumes that there is a URL parameter `handle` that
// (should) correspond to a handle.

import { permissionsMiddleware } from "./permissionsMiddleware";
import { handlePermissions } from "~/utils/apis";

export default permissionsMiddleware(
  (fetcher, to) => handlePermissions(fetcher, to.params.handle as string),
  (value) => !!value && value.view_dashboard
);

