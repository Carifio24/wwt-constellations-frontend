// Copyright 2023 the .NET Foundation

import { RouteLocationNormalized } from ".nuxt/vue-router";
import { RouteMiddleware } from "nuxt/app";
import { $Fetch } from "ofetch";
import { storeToRefs } from "pinia";

import { useConstellationsStore } from "~/stores/constellations";

export type PermissionsGetter<P> = (fetcher: $Fetch, to: RouteLocationNormalized) => Promise<P>;
export type AsyncDataType<P> = ReturnType<typeof useAsyncData<P>>['data']['value'];
export type PermissionsValidator<P> = (permissions: AsyncDataType<P>) => boolean;

export function permissionsMiddleware<P>(getter: PermissionsGetter<P>, validator: PermissionsValidator<P>): RouteMiddleware {

  return defineNuxtRouteMiddleware(async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {

    // We only know we're logged in when we're running on the client, so at the
    // server-side rendering stage we have to OK the access.
    if (process.server) {
      return;
    }

    const { $keycloak, $backendAuthCall } = useNuxtApp();
    // We may need to make sure that the Keycloak state is initialized. Since
    // we're checking that the user is allowed to see some page, we require login
    // here.

    if (!$keycloak.refreshToken) {
      const constellationsStore = useConstellationsStore();
      const { loggedIn } = storeToRefs(constellationsStore);

      await $keycloak.init({
        onLoad: 'login-required',
      });

      loggedIn.value = $keycloak.authenticated ?? false;
    }

    // Now we can actually check what we want to check
    const { data } = await useAsyncData(async () => {
      const fetcher = await $backendAuthCall();
      return getter(fetcher, to);
    });

    const allowed = validator(data.value);

    if (!allowed) {
      // The abortNavigation() option sounds appealing but seems to yield 500
      // errors, which is not what we want.
      return navigateTo("/");
    }

  });
  

}
