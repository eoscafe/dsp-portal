import API from './backend'

const EosjsPlugin = {
  install (Vue) {
    Vue.prototype.$api = new API()
  }
}

export default EosjsPlugin
