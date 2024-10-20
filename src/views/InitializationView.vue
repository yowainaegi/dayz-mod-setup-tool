<template>
  <div class="Initialization" :style="{opacity: opacity}">
    <h2 v-if="checkStatus === 'checking'">{{ $t('InitializationView.checking') }}</h2>
    <h2 v-if="checkStatus === 'checkSuccess'">{{ $t('InitializationView.checkSuccess') }}</h2>
    <h2 v-if="checkStatus === 'checkFailed'">{{ $t('InitializationView.checkFailed') }}</h2>
    <a-progress :percent="percent" :show-info="false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getWindowsUserName, getDayZLauncherDataFolderPath } from "@/server/api/SettingsApi";
import {useRouter} from "vue-router";
import {Modal} from "ant-design-vue";
import {i18n} from "@/i18n";


const router = useRouter();

let percent = ref(0);
let opacity = ref(1);
let checkStatus = ref('checking');


// 检测缓存文件夹是否存在
getWindowsUserName().then((osUserName: string) => {
  getDayZLauncherDataFolderPath(osUserName).then((dayZLauncherDataFolderPath: string) => {
    percent.value = 100;
    checkStatus.value = 'checkSuccess'
    opacity.value = 0
    router.push('/Index')
  }).catch((err: any) => {
    checkStatus.value = 'checkFailed'
    Modal.error({
      centered: true,
      title: i18n.global.t('common.modal.error.title.UnknownError'),
      content: i18n.global.t('InitializationView.messageContent'),
      okText: i18n.global.t('InitializationView.messageBoxOkBtn'),
      onOk: () => {
        opacity.value = 0
        router.push('/Settings')
      }
    })
  })
})

</script>

<style scoped lang="less">
.Initialization {
  width: 80%;
  text-align: center;
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
}

</style>