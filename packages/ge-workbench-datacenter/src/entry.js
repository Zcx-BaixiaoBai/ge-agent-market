// 数据管理中心工作台 —— 客户端入口
//
// 运行时通过模块加载器注册业务面板。React 来自宿主共享基线，
// 其余界面代码随本包一起打包为单文件。

import { createPanel } from './panel.jsx'
import CSS from './styles.js'

const STYLE_ID = 'ge-workbench-datacenter-style'

function installStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

window.__ModuleLoader__.load({
  id: 'ge-workbench-datacenter',
  factory: (req) => {
    const React = req('react')
    installStyles()
    return createPanel(React)
  },
})
