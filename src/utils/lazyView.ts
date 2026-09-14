import { defineAsyncComponent } from 'vue'

/**
 * 统一懒加载路由组件包装：
 * - 切换时有 loading 态
 * - chunk 加载失败（dev HMR 抖动 / 网络瞬断）时给出可重试提示，而非整页白屏
 */
export function lazyView(loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    delay: 120,
    timeout: 30000,
    loadingComponent: {
      template: '<div class="route-loading"><div class="route-loading-spinner"></div></div>',
    },
    errorComponent: {
      template:
        '<div class="route-error"><p>页面加载失败，系统将自动重试…</p></div>',
    },
    onError(_error, retry, _fail, attempts) {
      // dev 环境 HMR 瞬断时最多自动重试 3 次，避免直接白屏
      if (attempts <= 3) {
        retry()
      }
    },
  })
}