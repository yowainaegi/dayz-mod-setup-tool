import { createApp } from "vue";
import App from "./App.vue";
import "ant-design-vue/dist/reset.css";
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

// 全局异常处理
import { globalErrorHandler } from "@/config/globalErrorHandler";
window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler(event.reason);
})

const browserHistoryMouseButtons = new Set([3, 4]);
const browserHistoryKeys = new Set(['BrowserBack', 'BrowserForward']);
const browserHistoryAltArrowKeys = new Set(['ArrowLeft', 'ArrowRight', 'Left', 'Right']);

function preventBrowserHistoryNavigation(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}

function preventBrowserHistoryMouseNavigation(event: MouseEvent) {
    if (browserHistoryMouseButtons.has(event.button)) {
        preventBrowserHistoryNavigation(event);
    }
}

function preventBrowserHistoryKeyboardNavigation(event: KeyboardEvent) {
    if (browserHistoryKeys.has(event.key) || (event.altKey && browserHistoryAltArrowKeys.has(event.key))) {
        preventBrowserHistoryNavigation(event);
    }
}

const browserHistoryMouseEventOptions: AddEventListenerOptions = { capture: true, passive: false };
window.addEventListener('mousedown', preventBrowserHistoryMouseNavigation, browserHistoryMouseEventOptions);
window.addEventListener('mouseup', preventBrowserHistoryMouseNavigation, browserHistoryMouseEventOptions);
window.addEventListener('click', preventBrowserHistoryMouseNavigation, browserHistoryMouseEventOptions);
window.addEventListener('auxclick', preventBrowserHistoryMouseNavigation, browserHistoryMouseEventOptions);
window.addEventListener('keydown', preventBrowserHistoryKeyboardNavigation, { capture: true });

app.mount("#app");
