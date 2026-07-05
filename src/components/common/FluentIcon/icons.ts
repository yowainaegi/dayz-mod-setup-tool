import add from '@fluentui/svg-icons/icons/add_24_regular.svg?raw';
import arrowAutofitContent from '@fluentui/svg-icons/icons/arrow_autofit_content_24_regular.svg?raw';
import arrowLeft from '@fluentui/svg-icons/icons/arrow_left_24_regular.svg?raw';
import arrowRight from '@fluentui/svg-icons/icons/arrow_right_24_regular.svg?raw';
import checkmark from '@fluentui/svg-icons/icons/checkmark_24_regular.svg?raw';
import checkmarkCircle from '@fluentui/svg-icons/icons/checkmark_circle_24_regular.svg?raw';
import chevronDown from '@fluentui/svg-icons/icons/chevron_down_24_regular.svg?raw';
import chevronRight from '@fluentui/svg-icons/icons/chevron_right_24_regular.svg?raw';
import dismiss from '@fluentui/svg-icons/icons/dismiss_24_regular.svg?raw';
import dismissCircle from '@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw';
import document from '@fluentui/svg-icons/icons/document_24_regular.svg?raw';
import edit from '@fluentui/svg-icons/icons/edit_24_regular.svg?raw';
import folderOpen from '@fluentui/svg-icons/icons/folder_open_24_regular.svg?raw';
import lineHorizontal from '@fluentui/svg-icons/icons/line_horizontal_1_24_regular.svg?raw';
import info from '@fluentui/svg-icons/icons/info_24_regular.svg?raw';
import question from '@fluentui/svg-icons/icons/question_24_regular.svg?raw';
import search from '@fluentui/svg-icons/icons/search_24_regular.svg?raw';
import settings from '@fluentui/svg-icons/icons/settings_24_regular.svg?raw';
import spinner from '@fluentui/svg-icons/icons/spinner_ios_20_regular.svg?raw';
import square from '@fluentui/svg-icons/icons/square_24_regular.svg?raw';
import squareMultiple from '@fluentui/svg-icons/icons/square_multiple_24_regular.svg?raw';
import subtract from '@fluentui/svg-icons/icons/subtract_24_regular.svg?raw';
import warning from '@fluentui/svg-icons/icons/warning_24_regular.svg?raw';

export const fluentIcons = {
  add,
  'arrow-autofit-content': arrowAutofitContent,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  checkmark,
  'checkmark-circle': checkmarkCircle,
  'chevron-down': chevronDown,
  'chevron-right': chevronRight,
  dismiss,
  'dismiss-circle': dismissCircle,
  document,
  edit,
  'folder-open': folderOpen,
  info,
  'line-horizontal': lineHorizontal,
  question,
  search,
  settings,
  spinner,
  square,
  'square-multiple': squareMultiple,
  subtract,
  warning,
} as const;

export type FluentIconName = keyof typeof fluentIcons;
