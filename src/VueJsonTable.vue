<template>
  <hot-table ref="hotTableComponent" :settings="obj"></hot-table>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import { registerAllModules } from "handsontable/registry";
import { registerLanguageDictionary, zhCN } from "handsontable/i18n";
import "handsontable/dist/handsontable.full.css";
registerAllModules();
registerLanguageDictionary(zhCN);
export default {
  name: "VueJsonTable",
  data: function () {
    return {
      obj: {
        data: [],
        colHeaders: [],
        rowHeaders: true,
        width: "",
        height: "",
        colWidths: [],
        autoColumnSize: {syncLimit: '20%'},
        stretchH: 'all',
        columns: [],
        highlights:[],
        fixedColumnsStart: 0,
        headerTooltips: true,
        customBorders: true,
        autoWarpRow: true,
        allowInsertColumn: true,
        showEmptyRows: true,
        dropdownMenu: false,
        className: "",
        afterOnCellMouseDown: (event, coords, th) => {
          if (event.ctrlKey && (coords.row === -1 || coords.col === -1)) {
              let instance = this.$refs.hotTableComponent.hotInstance,
              isColHeader = coords.row === -1,
              input = document.createElement("input"),
              rect = th.getBoundingClientRect(),
              addListeners = (events, headers, index) => {
                events.split(" ").forEach((e) => {
                  input.addEventListener(e, () => {
                    const ori_col = headers[index];
                    if (headers[index] !== input.value) {
                      headers[index] = input.value;
                      instance.updateSettings(
                        isColHeader
                          ? {
                              colHeaders: headers,
                            }
                          : {
                              rowHeaders: headers,
                            }
                      );
                      this.updateColHeaders(ori_col, input.value, index);
                    }
                    setTimeout(() => {
                      if (input.parentNode) input.parentNode.removeChild(input);
                    });
                  });
                });
              },
              appendInput = () => {
                input.setAttribute("type", "text");
                input.style.cssText =
                  "" +
                  "position:absolute;" +
                  "left:" +
                  rect.left +
                  "px;" +
                  "top:" +
                  rect.top +
                  "px;" +
                  "width:" +
                  (rect.width - 4) +
                  "px;" +
                  "height:" +
                  (rect.height - 4) +
                  "px;" +
                  "z-index:9999;" +
                  "text-align:center";
                document.body.appendChild(input);
              };
            input.value = th.querySelector(
              isColHeader ? ".colHeader" : ".rowHeader"
            ).innerText;
            appendInput();
            setTimeout(() => {
              input.select();
              addListeners(
                "change blur",
                instance[isColHeader ? "getColHeader" : "getRowHeader"](),
                coords[isColHeader ? "col" : "row"]
              );
            });
          }
          if (coords.row > -1 && coords.col > -1  && this.cellClickFlag ) {
            this.cellClick(coords.row , coords.col, th.innerHTML);
            // let instance = this.$refs.hotTableComponent.hotInstance
            // let header = instance.getColHeader(coords.col, coords.row)
            // if (this.obj.highlights.includes(header)) {
            //   this.cellClick(coords.row , coords.col, th.innerHTML);
            // }
          }
        },
        afterGetColHeader: (index, TH) => {
          let name= TH.querySelector("span").textContent
          TH.setAttribute("title", TH.querySelector("span").textContent);
          if(this.obj.highlights.includes(name)) {
            TH.style.background = "lightgreen";
          }
        },
        multiColumnSorting: true,
        contextMenu: {
          items: {
            row_above: { name: "向上插入一行" },
            row_below: { name: "向下插入一行" },
            col_left: {
              name: "向左添加一列",
              disabled: () => {
                false;
              },
              callback:(key, ops)=> {
                this.add_new_column(key, ops)
              },
            },
            col_right: {
              name: "向右添加一列",
              disabled: () => {
                false;
              },
              callback:(key, ops)=> {
                this.add_new_column(key, ops)
              },
            },
            remove_row: {
              name: "删除一行",
              disabled: () => {
                false;
              }
            },
            remove_col: {
              name: "删除一列",
              disabled: () => {
                false;
              },
              callback:(key, ops)=> {
                this.delete_column(key, ops)
              },
            },
            hsep1: "---------",
            undo: { name: "撤销" },
            redo: { name: "恢复" },
            copy: { name: "复制" },
            cut: { name: "剪切" },
            make_read_only: { name: "只读" },
            alignment: { name: "对齐" },
            freeze_column: { name: "固定列" },
            unfreeze_column: { name: "解除固定列" },
          },
        },
        filters: true,
        licenseKey: "non-commercial-and-evaluation",
        language: zhCN.languageCode,
        manualColumnFreeze: true, //手动固定列
        manualColumnMove: true, //手动移动列
        manualRowMove: false, //手动移动行
        manualColumnResize: true, //手工更改列距
        manualRowResize: true, //手动更改行距
        comments: false, //添加注释
      },
      duplicatesDict: {}
    };
  },
  components: {
    HotTable,
  },
  props: {
    jsonData: {
      type: Array,
      require: true,
      default: () => [],
    },
    width: {
      type: String,
      require: false,
      default: () => "100%",
    },
    height: {
      type: String,
      require: false,
      default: () => "auto",
    },
    colWidths: {
      type: [Array,String,Number],
      require: false,
      default: () => 120,
    },
    showRowsNum: {
      type: Boolean,
      require: false,
      default: () => true,
    },
    fixColumnIndex: {
      type: Number,
      require: false,
      default: () => 0,
    },
    stretchH: {
      type: String,
      require: false,
      default: () => 'all',
    },
    multiColumnSorting: {
      type: Boolean,
      require: false,
      default: () => true,
    },
    manualColumnResize: {
      type: Boolean,
      require: false,
      default: () => true,
    },
    className: {
      type: String,
      require: false,
      default: () => "",
    },
    showTitle: {
      type: Boolean,
      require: false,
      default: () => false,
    },
    highlights: {
      type: Array,
      require: false,
      default: () => [],
    },
    repeatHighlightsCell: {
      type: Array,
      require: false,
      default: () => [],
    },
    cellClickFlag: {
      type: Boolean,
      require: false,
      default: () => false,
    }
  },
  created(){
    this.obj.data = this.jsonData
    this.initSetting(this.obj.data)
  },
  mounted(){
  },
  watch: {
    "obj.data": {
      handler(newValue, oldValue) {
        this.$emit("input", newValue)
        if(this.repeatHighlightsCell) {
          this.duplicatesDict = this.findDuplicates(newValue, this.repeatHighlightsCell)
          this.updateBg()
        }
      },
      deep: true,
      immediate: false,
    }
  },
  methods: {
    cellClick(row, col, text){
      this.$emit("cellClick", row, col, text)
    },
    updateBg(){
      let hot = this.$refs.hotTableComponent.hotInstance
      hot.updateSettings({
        cells:(row, col, prop)=>{
          if (this.repeatHighlightsCell && this.repeatHighlightsCell.includes(prop)) {
            let cell = hot.getCell(row, col)
            if (this.duplicatesDict[prop].includes(cell.innerHTML)) {
              this.$nextTick(()=>{
                  cell.style.background = 'rgb(242,223,224)'
              })
            }
          }
        }
      })
    },
    findDuplicates(arr, key) {
      const dup_dict = {}
      for(let k of key) {
        const map = new Map();
        const duplicates = [];
        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          if (!map.has(item[k])) {
            map.set(item[k], [item]);
          } else {
            const values = map.get(item[k]);
            values.push(item);
            if (values.length === 2) {
              duplicates.push(values[0][k]);
            }
          }
        }
        dup_dict[k] =duplicates
      }
      return dup_dict;
    },
    initSetting(propData) {
      if (this.showTitle) {
        this.obj.columns = propData.length>0? propData && Object.keys(propData[0]).map(v=> {
          return { "data": v,  renderer: this.renderTitleTooltips}
        }): []
      } else {
        this.obj.columns = propData.length>0? propData && Object.keys(propData[0]).map(v=> {
          return { "data": v}
        }): []
      }
      this.obj.colHeaders = propData.length>0? propData && Object.keys(propData[0]): []
      this.obj.width = this.width
      this.obj.height = this.height
      this.obj.stretchH = this.stretchH
      this.obj.manualColumnResize = this.manualColumnResize
      this.obj.multiColumnSorting = this.multiColumnSorting
      this.obj.colWidths = this.colWidths
      this.obj.rowHeaders = this.showRowsNum
      this.obj.fixedColumnsStart = this.fixColumnIndex
      this.obj.className = this.className
      this.obj.highlights = this.highlights
    },
    manualRender (newData) {
      this.obj.data = newData
      this.initSetting(this.obj.data)
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
    },
    renderTitleTooltips(instance, td, row, col, prop, value, cellProperties){
      td.innerHTML = value;
      td.title = value;
      return td
    },
    updateColHeaders(ori_h, new_h, col_index) {
      this.obj.data.forEach((v) => {
        this.$set(v, new_h, v[ori_h]);   
        delete v[ori_h];
      });
      this.$set(this.obj.colHeaders, col_index, new_h);
      this.obj.columns = this.obj.colHeaders.map(v=> {
          return {data: v}
      })
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("updateColumn", ori_h, new_h);
    },
    add_new_column(key, ops) {
      const col_index = ops[0].end.col
      const new_key = new Date().getTime()
      if (key === "col_left") {
        this.obj.colHeaders.splice(col_index, 0, `qcc_${new_key}`);
      } else {
        this.obj.colHeaders.splice(col_index + 1, 0, `qcc_${new_key}`);
      }
      this.obj.data = this.obj.data.map((v) => {
        let _obj = {};
        for (let k of this.obj.colHeaders) {
          _obj[k] = v[k] === undefined?  "": v[k];
        }
        return _obj;
      });
      this.obj.columns = this.obj.colHeaders.map(v=> {
          return {data: v}
      })
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("addColumn", `qcc_${new_key}`);
    },
    delete_column(key, ops){
      const col_index = ops[0].end.col
      this.obj.columns.splice(col_index, 1)
      let delete_name = this.obj.colHeaders.splice(col_index, 1)
      this.obj.data.forEach(v=> {
         delete v[delete_name[0]];
      })
      this.obj.data = JSON.parse(JSON.stringify(this.obj.data))
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("removeColumn", delete_name[0]);
    },
  },
};
</script>

<style>

.htContextMenu:not(.htGhostTable) {
  z-index: 9999 !important;
}

</style>