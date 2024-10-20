import { createApp } from "vue";
import App from "./App.vue";
const app = createApp(App);

// 存储
import store from "./store/index";
app.use(store);

// 路由
import router from "./router/index";
app.use(router);

// 国际化
import {i18n} from "@/i18n/index";
app.use(i18n);

// 全局css
import "@/styles/style.less";

// Ant-Design
import AntDesign, { message } from "ant-design-vue";
message.config({
    top: '40px'
})
app.use(AntDesign);

// 全局组件
import {install} from "@/components/global/globalComponentsInstall";
install(app);

// 全局异常处理
import { globalErrorHandler } from "@/config/globalErrorHandler";
window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler(event.reason);
})


app.mount("#app");
