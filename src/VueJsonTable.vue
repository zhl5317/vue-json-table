<template>
  <hot-table ref="hotTableComponent" :settings="obj"></hot-table>
</template>

<script>
import {HotTable} from "@handsontable/vue";
import {registerAllModules} from "handsontable/registry";
import {registerLanguageDictionary, zhCN} from "handsontable/i18n";
import "handsontable/dist/handsontable.full.css";
import _ from "lodash"

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
        highlights: [],
        fixedColumnsStart: 0,
        headerTooltips: true,
        autoWarpRow: true,
        allowInsertColumn: true,
        fillHandle: true,
        showEmptyRows: true,
        customBorders: true,
        dropdownMenu: false,
        className: "",
        multiColumnSorting: true,
        filters: true,
        contextMenu: {
          items: {
            row_above: {name: "向上插入一行"},
            row_below: {name: "向下插入一行"},
            col_left: {
              name: "向左添加一列",
              disabled: () => {
                false;
              },
              callback: (key, ops) => {
                this.add_new_column(key, ops)
              },
            },
            col_right: {
              name: "向右添加一列",
              disabled: () => {
                false;
              },
              callback: (key, ops) => {
                this.add_new_column(key, ops)
              },
            },
            remove_row: {
              name: "删除行[Delete]",
              disabled: () => {
                false;
              },
              callback: (key, ops) => {
                let hot = this.$refs.hotTableComponent.hotInstance
                const selectedRange = hot.getSelected();
                let deletedRowsIndex = []
                // this.$refs.hotTableComponent.hotInstance.alter('remove_row', v.end.row);
                selectedRange.forEach(v => {
                  if ((v[3] - v[1]) === this.obj.colHeaders.length) {
                    for (let i of Array.from({length: v[2] - v[0] + 1}, (_, i) => v[0] + i)) {
                      deletedRowsIndex.push(i)
                    }
                  }
                })
                this.obj.data = this.limitDataKeyOrder(this.obj.data.filter((v, index) => !deletedRowsIndex.includes(index)))
                hot.loadData(this.obj.data)
                this.deSelectCells()
                this.clearCrossHairs()
              },
            },
            remove_col: {
              name: "删除列[Delete]",
              disabled: () => {
                false;
              },
              callback: (key, ops) => {
                this.delete_column(key, ops)
                this.deSelectCells()
                this.clearCrossHairs()
              },
            },
            about: { // Own custom option
              name() { // `name` can be a string or a function
                return '移动到第一列'; // Name can contain HTML
              },
              callback: (key, selection, clickEvent) => { // Callback for specific option
                let moveItem = this.obj.colHeaders[selection[0].end.col]
                this.obj.colHeaders.splice(selection[0].end.col, 1)
                this.obj.colHeaders.splice(0, 0, moveItem)
              }
            },
            undo: {name: "撤销"},
            redo: {name: "恢复"},
            copy: {name: "复制"},
            cut: {name: "剪切"},
            // make_read_only: { name: "只读" },
            // alignment: { name: "对齐" },
            freeze_column: {
              name: "固定列",
              callback:(key, ops, clickEvent)=> {
                const plugin = this.$refs.hotTableComponent.hotInstance.getPlugin('ManualColumnFreeze');
                plugin.freezeColumn(ops[0].end.col);
                const element = this.obj.colHeaders.splice(ops[0].end.col, 1);
                this.obj.colHeaders.unshift(element[0]);
                this.deSelectCells()
              }
            },
            unfreeze_column: {name: "解除固定列",
              callback:(key, ops, clickEvent)=> {
                const plugin = this.$refs.hotTableComponent.hotInstance.getPlugin('ManualColumnFreeze');
                plugin.unfreezeColumn(ops[0].end.col);
                const element = this.obj.colHeaders.splice(ops[0].end.col, 1);
                this.obj.colHeaders.push(element[0]);
                this.deSelectCells()
              }
            },
          },
        },
        licenseKey: "non-commercial-and-evaluation",
        language: zhCN.languageCode,
        manualColumnFreeze: true, //手动固定列
        manualColumnMove: true, //手动移动列
        manualRowMove: false, //手动移动行
        manualColumnResize: true, //手工更改列距
        manualRowResize: true, //手动更改行距
        comments: false, //添加注释
        afterColumnFreeze: (col, freezePerformed)=> {
          console.log(col, freezePerformed)
        },
        outsideClickDeselects: () => {
          this.deSelectCells()
          this.clearCrossHairs()
          this.updateBg()
        },
        afterFilter: (conditionsStack) => {
          let hot = this.$refs.hotTableComponent.hotInstance
          let source = document.querySelector(".source-class").value
          let target = document.querySelector(".target-class").value
          const row = hot.getSelected();
          const colIndex = row ? row[0][1]: conditionsStack[0].column
          if (source.trim() !== '' || target.trim() !== '') {
            let filterColumn = colIndex
            let activeData = hot.getData()
            const regex = new RegExp(source, 'g');
            hot.batch(() => {
              for (let i = 0; i < activeData.length; i++) {
                const cellValue = activeData[i][filterColumn];
                const newValue = cellValue.toString().replace(regex, target);
                hot.setDataAtCell(i, filterColumn, newValue);
              }
            })
          }
          this.deSelectCells()
        },
        beforeKeyDown: (event) => {
          if (event.keyCode === 46) { //Delete
            this.deleteRowsOrColumns()
            event.stopImmediatePropagation();
            event.preventDefault();
            return false;
          }
        },
        afterSelection: (r, c, r2, c2) => {
          if (this.readModel && r >= 0 && c >= 0) {
            this.cellCrossHairs(c, r)
          }
        },
        afterOnCellMouseDown: (event, coords, th) => {
          if (event.ctrlKey && (coords.row === -1)) {
            this.cellSelectModel("single")
            this.deSelectCells()
            let instance = this.$refs.hotTableComponent.hotInstance,
                isColHeader = coords.row === -1,
                input = document.createElement("input"),
                rect = th.getBoundingClientRect(),
                addListeners = (events, headers, index) => {
                  events.split(" ").forEach((e) => {
                    input.addEventListener(e, () => {
                      const ori_col = headers[index];
                      if (headers[index] !== input.value && !this.obj.colHeaders.includes(input.value)) {
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
                        this.cellSelectModel("multiple")
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
              this.cellSelectModel("multiple")
            });
          }
          if (coords.row > -1 && coords.col > -1 && this.cellClickFlag) {
            this.cellClick(coords.row, coords.col, th.innerHTML);
          }
          if (this.readModel) { //点击header选中整列，移除crosshairs
            if (coords.row > -1 && coords.col > -1) {
              this.cellCrossHairs(coords.col, coords.row)
            } else { //点击header选中整列，移除crosshairs
              this.updateBg()
            }
          }
        },
        afterGetColHeader: (index, TH) => {
          let name = TH.querySelector("span").textContent
          TH.setAttribute("title", TH.querySelector("span").textContent);
          if (index !== -1 && ((this.obj.highlights.length > 0 && this.obj.highlights.includes(name)) || (this.aliasList.length > 0 && !this.aliasList.includes(name)))) {
            TH.style.background = "lightgreen";
          }
        },
        afterScrollVertically: () => {
          if (this.readModel) {
            let hot = this.$refs.hotTableComponent.hotInstance
            const selection = hot.getSelected();
            if (selection !== undefined && selection.length > 0 && selection[0][2] - selection[0][0] === 0 && selection[0][3] - selection[0][1] === 0) { // 选中一个cell
              this.cellCrossHairs(selection[0][1], selection[0][0])
            } else {
              this.updateBg()
            }
          } else {
            this.updateBg()
          }
        },
        afterScrollHorizontally: () => {
          if (this.readModel) {
            let hot = this.$refs.hotTableComponent.hotInstance
            const selection = hot.getSelected();
            if (selection !== undefined && selection.length > 0 && selection[0][2] - selection[0][0] === 0 && selection[0][3] - selection[0][1] === 0) { // 选中一个cell
              this.cellCrossHairs(selection[0][1], selection[0][0])
            } else {
              this.updateBg()
            }
          } else {
            this.updateBg()
          }
        },
        afterColumnMove: (column, dropIndex) => {
          let moveItem = this.obj.colHeaders[column[0]]
          this.obj.colHeaders.splice(column[0], 1)
          this.obj.colHeaders.splice(dropIndex, 0, moveItem)
        }
      },
      duplicatesDict: {},
      dropdowns: {
        items: {
          filter_by_condition: {name: "过滤条件"},
          filter_operators: {name: "符号"},
          filter_by_condition2: {name: "过滤条件2"},
          filter_by_value: {name: "过滤值"},
          clear_column: {name: "清空列"},
          clear_filter: {
            name: "清空筛选条件",
            callback: () => {
              let filters = this.$refs.hotTableComponent.hotInstance.getPlugin('Filters');
              filters.clearConditions();
              filters.filter();
            }
          },
          about: {
            name() {
              return '过滤替换:<br/>' +
                  '<input type="text" class="source-class" placeholder="原始值" style="border-radius: 2px;\n' +
                  '    border: 1px solid #d2d1d1;width:120px">-><input type="text" style="border-radius: 2px;\n' +
                  '    border: 1px solid #d2d1d1;width:120px" placeholder="替换值" class="target-class">'; // Name can contain HTML
            },
            isCommand: false
          },
          filter_action_bar: "filter_action_bar"
        }
      }
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
      type: [Array, String, Number],
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
    },
    unNumberList: {
      type: Array,
      require: false,
      default: () => [],
    },
    aliasList: {
      type: Array,
      require: false,
      default: () => [],
    },
    readModel: {
      type: Boolean,
      require: false,
      default: () => false,
    },
    dropdownMenu: {
      type: Boolean,
      require: false,
      default: () => false,
    },
  },
  created() {
    this.obj.data = this.jsonData
    this.initSetting(this.obj.data)
  },
  mounted() {
  },
  watch: {
    "obj.data": {
      handler(newValue, oldValue) {
        console.log(newValue)
        if (newValue.length === 0) {
          this.obj.colHeaders = []
        }
        this.$emit("input", newValue)
        if (this.repeatHighlightsCell.length > 0) {
          this.duplicatesDict = this.findDuplicates(newValue, this.repeatHighlightsCell)
          this.updateBg()
        }
      },
      deep: true,
      immediate: false,
    },
    "obj.colHeaders": {
      handler(newValue, oldValue) {
        console.log('colHeaders', newValue)
        this.handlerToolTips(newValue)
      },
      deep: true,
      immediate: false,
    }
  },
  methods: {
    clearCrossHairs() {
      if (this.readModel) {
        let hot = this.$refs.hotTableComponent.hotInstance
        hot.batch(() => {
          hot.updateSettings({
            cells: (row, col, prop) => {
              this.$nextTick(() => {
                let cell = hot.getCell(row, col)
                if (cell) {
                  cell.classList.remove("read-model-class")
                }
              });
            }
          })
        })
      }
    },
    cellCrossHairs(c, r) {
      let hot = this.$refs.hotTableComponent.hotInstance
      hot.batch(() => {
        hot.updateSettings({
          cells: (row, col, prop) => {
            this.$nextTick(() => {
              let cell = hot.getCell(row, col)
              if (cell) {
                cell.classList.remove("read-model-class")
                if ((col === c && row !== r) || (col !== c && row === r)) {
                  cell.classList.add("read-model-class")
                }
              }
            });
          }
        })
      })
    },
    deleteRowsOrColumns() {
      let hot = this.$refs.hotTableComponent.hotInstance
      const dataCopy = [...this.obj.data]
      let removedItemsArray = []
      if (hot.getSelected() !== undefined) {
        for (let f in hot.getSelected()) {
          let colStart = hot.getSelected()[f][1],
              colEnd = hot.getSelected()[f][3],
              rowStart = hot.getSelected()[f][0],
              rowEnd = hot.getSelected()[f][2],
              validHeaders = [];
          if ((rowEnd - rowStart) === this.obj.data.length) { //删列
            for (let i of Array.from({length: colEnd - colStart + 1}, (_, i) => colStart + i)) {
              validHeaders.push(this.obj.colHeaders[i])
            }
            if (validHeaders.length > 0) {
              for (let v of validHeaders) {
                this.obj.colHeaders.splice(this.obj.colHeaders.indexOf(v), 1)
                this.obj.data.forEach(h => {
                  delete h[v];
                })
                this.obj.data = [...this.obj.data]
              }
            }
          } else if ((colEnd - colStart) === this.obj.colHeaders.length) { //删行
            for (let i of Array.from({length: rowEnd - rowStart + 1}, (_, i) => rowStart + i)) {
              validHeaders.push(i)
            }
            removedItemsArray = [...removedItemsArray, ...dataCopy.filter((v, i) => {
              return validHeaders.includes(i)
            })]
          }
        }
      }
      if (removedItemsArray.length > 0) {
        this.obj.data = this.limitDataKeyOrder([..._.difference(dataCopy, removedItemsArray)])
      }
      hot.loadData(this.obj.data);
      hot.deselectCell()
      this.clearCrossHairs()
    },
    cellSelectModel(type) {
      let hot = this.$refs.hotTableComponent.hotInstance
      hot.updateSettings({
        selectionMode: type
      })
    },
    deSelectCells() {
      let hot = this.$refs.hotTableComponent.hotInstance
      hot.deselectCell()
    },
    cellClick(row, col, text) {
      this.$emit("cellClick", row, col, text)
    },
    updateBg() {
      let hot = this.$refs.hotTableComponent.hotInstance
      hot.batch(() => {
        hot.updateSettings({
          cells: (row, col, prop) => {
            let flag = false
            this.$nextTick(() => {
              let cell = hot.getCell(row, col)
              if (!cell) {
                return
              }
              if (this.unNumberList > 0 && !this.unNumberList.includes(prop)) {
                if (isNaN(cell.innerHTML.trim()) || cell.innerHTML.trim() === '') {
                  flag = true
                  cell.style.backgroundColor = 'rgb(242,223,224)'
                }
              }
              if (this.repeatHighlightsCell.length > 0 && this.repeatHighlightsCell.includes(prop)) {
                if (this.duplicatesDict[prop].includes(cell.innerHTML) && cell.innerHTML.trim() !== "") {
                  flag = true
                  cell.style.backgroundColor = 'rgb(242,223,224)'
                }
              }
              if (!flag) {
                cell.style.backgroundColor = ''
              }
            })
          }
        })
      })
    },

    // {"name": ["张三", "李四"]， "age": ["11"]}
    findDuplicates(arr, key) {
      const dup_dict = {}
      for (let k of key) {
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
        dup_dict[k] = duplicates
      }
      return dup_dict;
    },
    handlerToolTips(propData) {
      if (this.showTitle) {
        this.obj.columns = propData.length > 0 ? propData && propData.map(v => {
          return {"data": v, renderer: this.renderTitleTooltips}
        }) : []
      } else {
        this.obj.columns = propData.length > 0 ? propData && propData.map(v => {
          return {"data": v}
        }) : []
      }
    },
    initSetting(propData) {
      this.obj.colHeaders = propData.length > 0 ? propData && Object.keys(propData[0]) : []
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
      this.obj.dropdownMenu = this.dropdownMenu ? this.dropdowns : false
    },
    manualRender(newData) {
      this.obj.data = newData
      this.initSetting(this.obj.data)
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
    },
    renderTitleTooltips(instance, td, row, col, prop, value, cellProperties) {
      td.innerHTML = value;
      td.title = value;
      return td
    },
    updateColHeaders(ori_h, new_h, col_index) {
      this.obj.data.forEach((v) => {
        this.$set(v, new_h, v[ori_h]);
        delete v[ori_h];
      });
      this.$set(this.obj.colHeaders, this.obj.colHeaders.indexOf(ori_h), new_h);
      this.obj.data = this.limitDataKeyOrder(this.obj.data)
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("updateColumn", ori_h, new_h);
    },
    limitDataKeyOrder(data) {
      const sortedData = data.map(obj => {
        const newObj = {};
        this.obj.colHeaders.forEach(key => newObj[key] = obj[key]);
        return newObj;
      })
      return sortedData
    },
    add_new_column(key, ops) {
      const colIndex = ops[0].end.col;
      const newKey = `qcc_${new Date().getTime()}`;

      const isLeft = key === "col_left";
      const addIndex = isLeft ? colIndex : colIndex + 1;
      this.obj.colHeaders.splice(addIndex, 0, newKey);

      const newData = this.obj.data.map(v => ({...v, [newKey]: v[newKey] || ""}));

      this.obj.data = this.limitDataKeyOrder(newData);
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("addColumn", newKey);
    },
    delete_column(key, ops) {
      const endIndex = ops[0].end.col;
      const startIndex = ops[0].start.col;
      const deleteIndexes = Array.from({length: endIndex - startIndex + 1}, (_, i) => startIndex + i);

      const {colHeaders, data} = this.obj;
      const restHeaders = colHeaders.filter((_, index) => !deleteIndexes.includes(index));
      const restKeys = restHeaders.reduce((acc, key) => ({...acc, [key]: null}), {});

      const newData = data.map(({...rest}) => restHeaders.reduce((acc, key) => ({...acc, [key]: rest[key]}), {}));

      this.obj.colHeaders = restHeaders;
      this.obj.data = this.limitDataKeyOrder(newData);
      this.$refs.hotTableComponent.hotInstance.loadData(this.obj.data);
      this.$emit("removeColumn", colHeaders.filter((_, index) => deleteIndexes.includes(index)));
    },
  },
}
;
</script>

<style>

.htContextMenu:not(.htGhostTable) {
  z-index: 9999 !important;
}


.read-model-class {
  background-color: #f8f5b2 !important;;
}
</style>