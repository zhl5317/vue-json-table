<template>
  <div style="width: 100%; display: block">
    <VueJsonTable
    :jsonData="[...data]"
    v-model="data"
    :width="width"
    :height="height"
    :colWidths="colWidths"
    :stretchH="stretchH"
    :className="className"
    :multiColumnSorting="multiColumnSorting"
    :fixColumnIndex="fixColumnIndex"
    :manualColumnResize="manualColumnResize"
    :showTitle="showTitle"
    @removeColumn="removeColumn"
    @updateColumn="updateColumn"
    @addColumn="addColumn"
    ></VueJsonTable>
    <div style="width:100%; height: 300px;">
      <pre>{{ JSON.stringify(data, null, 4) }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data: [
          { name: "张三111", age: 12, tel: "15370001322", address: "苏州市企查查科技有限公司234444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444", country: "中国" },
          { name: "李四", age: 11, tel: "15370001322", address: "苏州市企查查科技有限公司", country: "中国"},
          { name: "王二", age: 23, tel: "15370001322", address: "苏州市企查查科技有限公司", country: "中国" },
          { name: "赵五", age: 45, tel: "15370001322", address: "苏州市企查查科技有限公司", country: "中国" },
          { name: "钱六", age: 23, tel: "15370001322", address: "苏州市企查查科技有限公司", country: "中国" }],
      width: "100%",
      height: "auto",
      colWidths: 100,
      fixColumnIndex: 0,
      stretchH: 'none',
      multiColumnSorting: false,
      manualColumnResize: true,
      className: "custom-table1",
      showTitle: true
    }
  },
  watch: {
    data: {
      immediate: false,
      deep: true,
      handler(val) {
        console.log(val);
      },
    },
  },
  created(){

  },
  methods: {
    addColumn(){},
    updateColumn(or, ne){
      console.log(or, ne)
    },
    removeColumn(e) {
      console.log(e)
    }
  },
};
</script>
<style lang="less">
  .custom-table1 td {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}

</style>>