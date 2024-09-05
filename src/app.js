/** @format */

import { createApp } from "vue";
import { router } from "./router";

import "element-plus/dist/index.css";
import "vue-json-pretty/lib/styles.css"
import "@/common/css/common.css";
import "@/common/utils/Object";

import App from "./App.vue";

const app = createApp(App);

app.use(router);
app.mount("#app");
