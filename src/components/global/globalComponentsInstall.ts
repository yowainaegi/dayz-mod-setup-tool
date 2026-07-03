import { defineAsyncComponent, App } from 'vue';

const componentsContext = import.meta.glob('./*/index.vue');

export function install(app: App): void {
  Object.entries(componentsContext).forEach(([key, loader]) => {
    // 注册组件名字，如果没有抛出Name，引用文件组件文件夹名字
    const name = key.slice(2, key.lastIndexOf('/'));
    const value = defineAsyncComponent(loader as any);
    app.component(name, value);
  });
}
