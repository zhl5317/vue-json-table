import VueJsonTable from './VueJsonTable.vue'

const install = (v) => {
  if (install.installed) return
  v.component('VueJsonTable', VueJsonTable)
}

export default install

export const components = {
  VueJsonTable,
}
