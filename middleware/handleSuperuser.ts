// Copyright 2023 the .NET Foundation

// A middleware to redirect the user away if they don't have superuser permissions.

import { permissionsMiddleware } from "./permissionsMiddlewareBase";
import { amISuperuser } from "~/utils/apis";

export default permissionsMiddleware(
  (fetcher, _to) => amISuperuser(fetcher),
  (value) => !!value && value.result
);
