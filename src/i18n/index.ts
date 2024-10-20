// index.ts
import { createI18n } from 'vue-i18n';
import zh_CN from '@/i18n/lang/zh_CN';
import en_US from '@/i18n/lang/en_US';
import ja_JP from '@/i18n/lang/ja_JP';
import { getAppConfigByConfigName } from '@/server/api/SettingsApi';
import { APP_LANGUAGE } from '@/constants/AppConfig';
import AppConfig from '@/server/models/AppConfig';

const messages = {
    zh_CN,
    en_US,
    ja_JP
}

// 从数据库中获取语言
let res: AppConfig = await getAppConfigByConfigName(APP_LANGUAGE)
const i18n = createI18n({
    locale: res.config_value as string, // 首先从缓存里拿，没有的话就用浏览器语言，
    fallbackLocale: 'zh_CN', // 设置备用语言
    messages,
})

export {
    i18n
}

