import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";
import {useStore} from "vuex";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/Index'
    },
    {
        path: '/Index',
        name: 'IndexView',
        meta: {index: 0},
        component: () => import('@/views/IndexView.vue')
    },
    {
        path: '/SelectType',
        name: 'SelectTypeView',
        meta: {index: 1},
        component: () => import('@/views/SelectTypeView.vue')
    },
    {
        path: '/ConfigFileList',
        name: 'ConfigFileListView',
        meta: {index: 2},
        component: () => import('@/views/ConfigFileListView.vue')
    },
    {
        path: '/ConfigFileEdit',
        name: 'ConfigFileEditView',
        meta: {index: 3},
        component: () => import('@/views/ConfigFileEditView.vue')
    },
    {
        path: '/ModChoose',
        name: 'ModChooseView',
        meta: {index: 4},
        component: () => import('@/views/ModChooseView.vue')
    },
    {
        path: '/EditServer',
        name: 'EditServerView',
        meta: {index: 5},
        component: () => import('@/views/EditServerView.vue')
    },
    {
        path: '/LogList',
        name: 'LogListView',
        meta: {index: 98},
        component: () => import('@/views/LogListView.vue')
    },
    {
        path: '/Settings',
        name: 'SettingsView',
        meta: {index: 99},
        component: () => import('@/views/SettingsView.vue')
    },
    {
        path: '/Initialization',
        name: 'InitializationView',
        meta: {index: 100},
        component: () => import('@/views/InitializationView.vue')
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
