import Vue from 'vue'
import App from './App.vue'
import store from './store'
import './registerServiceWorker'
import API from '@/plugins/api'
import { Tabs, Tab } from 'vue-tabs-component'
import Semantic from 'semantic-ui-vue'

import Error from '@/components/Error'
import Success from '@/components/Success'

Vue.config.productionTip = false
Vue.use(API)

Vue.component('error', Error)
Vue.component('success', Success)
Vue.component('tabs', Tabs)
Vue.component('tab', Tab)
Vue.use(Semantic)

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
