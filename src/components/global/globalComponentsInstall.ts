import { defineAsyncComponent, App } from 'vue';

const componentsContext = require.context('../global', true, /\/index\.vue$/);
// require.context('../global', true, /\/index\.vue$/);

export function install(app: App): void {
  componentsContext.keys().forEach((key: any) => {
    // 注册组件名字，如果没有抛出Name，引用文件组件文件夹名字
    const name = (componentsContext(key).default?.name || key.slice(2, key.lastIndexOf('/'))) as string;
    const value = defineAsyncComponent(() => import(`../global/${key.slice(2)}`));
    app.component(name, value);
  });
}