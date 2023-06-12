<template>
  <div style="width: 100%; margin: 0 auto">
    <VueJsonTable
        :jsonData="[...data]"
        v-model="data"
        :width="width"
        :height="height"
        :colWidths="colWidths"
        :stretchH="stretchH"
        :multiColumnSorting="multiColumnSorting"
        :manualColumnResize="manualColumnResize"
        :showTitle="showTitle"
        :highlights="highlights"
        :className="className"
        :repeatHighlightsCell="repeatHighlightsCell"
        :aliasList="aliasList"
        :unNumberList="unNumberList"
        :readModel="readModel"
        :dropdownMenu="dropdownMenu"
        @removeColumn="removeColumn"
        @updateColumn="updateColumn"
        @addColumn="addColumn"
        @cellClick="cellClick"
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
        { name: "张三", age: 12, tel: "15370001322", address: "企查查科技有限公司", country: "中国" },
        { name: "李四", age: 11, tel: "15370001322", address: "小米科技有限公司", country: "中国"},
        { name: "张三", age: 23, tel: "15370001322", address: "阿里科技有限公司", country: "中国" },
        { name: "赵五", age: 45, tel: "15370001322", address: "百度科技有限公司", country: "中国" },
        { name: "钱六", age: 23, tel: "15370001322", address: "腾讯科技有限公司", country: "中国" }
        ],
      width: "100%",
      height: "200px",
      colWidths: 450,
      fixColumnIndex: 0,
      className: 'custom-table1',
      stretchH: 'none',
      multiColumnSorting: false,
      manualColumnResize: true,
      showTitle: true,
      highlights: ['name'],
      repeatHighlightsCell: ['name'],
      aliasList:[ "age"],
      unNumberList: ["address"],  //用逗号分隔的正则表达式列表，用于生成不规则列的不编辑
      cellClickFlag: false,
      readModel: true,
      dropdownMenu: true
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
  methods: {
    cellClick(row, col, text){
      console.log(row, col, text)
    },
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
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
}

</style>>