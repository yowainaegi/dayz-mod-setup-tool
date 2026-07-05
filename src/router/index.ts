import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";
import {useStore} from "vuex";
import IndexView from "@/views/IndexView.vue";
import SelectTypeView from "@/views/SelectTypeView.vue";
import ConfigFileListView from "@/views/ConfigFileListView.vue";
import ConfigFileEditView from "@/views/ConfigFileEditView.vue";
import ModChooseView from "@/views/ModChooseView.vue";
import EditServerView from "@/views/EditServerView.vue";
import ModMountConfigView from "@/views/ModMountConfigView.vue";
import LogListView from "@/views/LogListView.vue";
import SettingsView from "@/views/SettingsView.vue";
import InitializationView from "@/views/InitializationView.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/Index'
    },
    {
        path: '/Index',
        name: 'IndexView',
        meta: {index: 0},
        component: IndexView
    },
    {
        path: '/SelectType',
        name: 'SelectTypeView',
        meta: {index: 1},
        component: SelectTypeView
    },
    {
        path: '/ConfigFileList',
        name: 'ConfigFileListView',
        meta: {index: 2},
        component: ConfigFileListView
    },
    {
        path: '/ConfigFileEdit',
        name: 'ConfigFileEditView',
        meta: {index: 3},
        component: ConfigFileEditView
    },
    {
        path: '/ModChoose',
        name: 'ModChooseView',
        meta: {index: 4},
        component: ModChooseView
    },
    {
        path: '/EditServer',
        name: 'EditServerView',
        meta: {index: 5},
        component: EditServerView
    },
    {
        path: '/ModMountConfig',
        name: 'ModMountConfigView',
        meta: {index: 6},
        component: ModMountConfigView
    },
    {
        path: '/LogList',
        name: 'LogListView',
        meta: {index: 98},
        component: LogListView
    },
    {
        path: '/Settings',
        name: 'SettingsView',
        meta: {index: 99},
        component: SettingsView
    },
    {
        path: '/Initialization',
        name: 'InitializationView',
        meta: {index: 100},
        component: InitializationView
    },
    {
        path: '/Dialog',
        name: 'DialogView',
        meta: {index: -1, dialog: true},
        component: () => import('@/views/DialogView.vue')
    },
    {
        path: '/TextFilePreview',
        name: 'TextFilePreviewView',
        meta: {index: -1, dialog: true},
        component: () => import('@/views/TextFilePreviewView.vue')
    },
    {
        path: '/TextFileEditor',
        name: 'TextFileEditorView',
        meta: {index: -1, dialog: true},
        component: () => import('@/views/TextFileEditorView.vue')
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

/**
 * 路由状态更新时处理
 */
router.beforeEach((to: any, from: any, next) => {
    const store = useStore();
    if (to.meta.dialog) {
        next();
        return;
    }
    if (to.path !== '/Settings' && to.path !== '/LogList') {
        if (to.path === '/') {
            store.commit('updateRouterHistory', [to.path]);
        } else {
            store.state.routerHistory.push(to.path);
        }
    }
    if (!to.meta.index || !from.meta.index) {
        store.commit('updateSideAnimation', 'slide_left');
    } else if (to.meta.index > from.meta.index) {
        //设置动画名称
        store.commit('updateSideAnimation', 'slide_left');
    } else {
        store.commit('updateSideAnimation', 'slide_right');
    }
    next();
})

export default router;
