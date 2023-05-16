import Vue from 'vue'
import VueJsonTable from '../src/index.js'
import App from './App.vue'
Vue.use(VueJsonTable)
new Vue({
  el: '#app',
  render: h => (h)(App)
})
