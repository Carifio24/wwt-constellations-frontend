// This file is part of a quasi-hack to get the Naive UI toolkit working with
// server-side rendering in Nuxt's development server mode. I found that,
// seemingly due to different JavaScript module system standards, the Naive UI
// symbols wouldn't import properly in that particular context, leading to
// undefined values everywhere and breaking everything. See discussion here:
// https://github.com/WorldWideTelescope/wwt-constellations-frontend/pull/20

import {
  NAvatar,
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NConfigProvider,
  NDataTable,
  NDivider,
  NDrawer,
  NDrawerContent,
  NEllipsis,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NModal,
  NNotificationProvider,
  NRow,
  NScrollbar,
  NSelect,
  NSlider,
  NSpace,
  NStatistic,
  NTabs,
  NTabPane,
  NText,
  useNotification,
} from "../node_modules/naive-ui";

export {
  NAvatar,
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NConfigProvider,
  NDataTable,
  NDivider,
  NDrawer,
  NDrawerContent,
  NEllipsis,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NModal,
  NNotificationProvider,
  NRow,
  NScrollbar,
  NSelect,
  NSlider,
  NSpace,
  NStatistic,
  NTabs,
  NTabPane,
  NText,
  useNotification,
};
