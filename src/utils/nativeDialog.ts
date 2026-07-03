type NativeDialogType = 'none' | 'info' | 'error' | 'question' | 'warning';

interface NativeDialogOptions {
  type?: NativeDialogType;
  title: string;
  message?: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

interface NativeDialogResult {
  response: number;
  checkboxChecked?: boolean;
}

export async function showNativeDialog(options: NativeDialogOptions): Promise<NativeDialogResult> {
  return window.ipcRenderer.invoke('showNativeDialog', options);
}

export async function confirmNativeDialog(options: {
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
}): Promise<boolean> {
  const result = await showNativeDialog({
    type: 'question',
    title: options.title,
    message: options.message ?? options.title,
    buttons: [options.cancelText, options.confirmText],
    defaultId: 1,
    cancelId: 0,
  });

  return result.response === 1;
}

export async function warningNativeDialog(options: {
  title: string;
  message?: string;
  okText: string;
}): Promise<void> {
  await showNativeDialog({
    type: 'warning',
    title: options.title,
    message: options.message ?? options.title,
    buttons: [options.okText],
    defaultId: 0,
    cancelId: 0,
  });
}

export async function errorNativeDialog(options: {
  title: string;
  message: string;
  okText: string;
}): Promise<void> {
  await showNativeDialog({
    type: 'error',
    title: options.title,
    message: options.message,
    buttons: [options.okText],
    defaultId: 0,
    cancelId: 0,
  });
}
