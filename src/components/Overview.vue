<template>
  <div id="overview">
    <div id="overview-scatterplot"></div>
    <div id="overview-selector">
      <select @change="changeIndex" v-model="currentItem">
        <option v-for="item in items" :value="item" :key="item">
          {{ item }}
        </option>
      </select>
    </div>
    <div id="overview-sample">
      <div id="overview-delete" @click="deleteAll()">Delete All</div>
      <div id="overview-add" @click="addAll()">Add All</div>
    </div>
    <div id="overview-items">
      <div
        v-for="item in selectedItems"
        :key="item.name"
        :id="'overview-items-item-' + item.name"
        class="overview-items-item"
      >
        <img />
      </div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import * as d3 from "d3";
//let d3Lasso = require("@/assets/d3-lasso.min.js");
import * as d3Lasso from "d3-lasso";
import { mapState, mapActions } from "vuex";

export default {
  name: "Overview",
  components: {},
  data() {
    return {
      items: [""],
      similarity: null,
      currentItem: null,
      rand: 6,
      selectedItems: [],
      deleted: []
    };
  },
  computed: {
    ...mapState(["currentResults", "globalResults", "typeNames"])
  },
  watch: {
    currentResults(val) {
      let self = this;
      self.init();
    },
    typeNames(val) {
      let self = this;
      self.items = JSON.parse(JSON.stringify(self.typeNames));
      self.init();
    }
  },
  mounted() {
    let self = this;
    d3.json("data/data_all.json").then(data => {
      console.log(data);
      self.similarity = data;
      self.init();
    });
  },
  methods: {
    ...mapActions(["updateCurrentResults"]),
    calcDeleted() {
      let self = this;
      let currentItem = self.currentItem;
      if (currentItem == null) return;
      let currentResults = self.currentResults;
      let globalResults = self.globalResults;
      self.deleted = new Array();
      for (let i in currentResults) {
        let name = currentResults[i].name;
        let currentResult = currentResults[i].value;
        let globalResult = globalResults.filter(d => {
          return d.name == name;
        })[0].value;
        let tmp = globalResult.filter(d => {
          return d.Label == currentItem;
        });
        if (tmp.length == 0) continue;
        tmp = currentResult.filter(d => {
          return d.Label == currentItem;
        });
        if (tmp.length == 0 || tmp[0].new != null) self.deleted.push(name);
      }
    },
    init() {
      let self = this;
      if (
        self.similarity == null ||
        self.currentResults == null ||
        self.typeNames == null ||
        self.currentItem == null
      )
        return;
      self.calcDeleted();
      self.rand = parseInt(Math.ceil(Math.random() * 12));
      d3.select(self.$el)
        .select("svg")
        .remove();
      let width = $("#overview-scatterplot").width();
      let height = $("#overview-scatterplot").height();
      let padding = {
        left: 40,
        right: 20,
        top: 20,
        bottom: 40
      };
      let typeNames = self.typeNames;
      let currentResults = self.currentResults;
      let currentItem = self.currentItem;
      let similarity = self.similarity[currentItem];
      let rand = self.rand;
      let deleted = self.deleted;
      if (similarity == null) return;
      let maxVar = d3.max(similarity, d => {
        return d.var;
      });
      let svg = d3
        .select(self.$el)
        .select("#overview-scatterplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
      let xscale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding.left, width - padding.right]);
      let yscale = d3
        .scaleLinear()
        .domain([maxVar, 0])
        .range([padding.top, width - padding.bottom]);
      let circles = svg
        .append("g")
        .selectAll("circle")
        .data(similarity)
        .enter()
        .append("circle")
        .attr("cx", d => {
          return xscale(d.avg);
        })
        .attr("cy", d => {
          return yscale(d.var);
        })
        .attr("r", 3)
        .attr("fill", "red")
        .attr("fill-opacity", d => {
          let name = "Person" + d.person + "_" + d.number;
          if (deleted.indexOf(name) >= 0) return 1;
          else return 0;
        })
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      let xaxis = d3.axisBottom().scale(xscale);
      let yaxis = d3.axisLeft().scale(yscale);
      svg
        .append("g")
        .attr("transform", "translate(0, " + (width - padding.bottom) + ")")
        .call(xaxis);
      svg
        .append("g")
        .attr("transform", "translate(" + padding.left + ", 0)")
        .call(yaxis);
      svg
        .append("g")
        .append("text")
        .attr("x", width - padding.right * 2)
        .attr("y", width - padding.bottom * 1.2)
        .text("Avg");
      svg
        .append("g")
        .append("text")
        .attr("x", padding.left * 1.2)
        .attr("y", padding.top * 1.5)
        .text("Var");

      let lasso = d3Lasso.lasso();
      lasso
        .items(circles)
        .targetArea(svg)
        .on("start", () => {
          lasso
            .items()
            .classed("selected", false)
            .classed("noselected", false);
        })
        .on("draw", () => {
          lasso
            .possibleItems()
            .classed("selected", true)
            .classed("noselected", false);
          lasso
            .notPossibleItems()
            .classed("selected", false)
            .classed("noselected", true);
        })
        .on("end", () => {
          lasso
            .items()
            .classed("selected", false)
            .classed("noselected", false);
          lasso
            .selectedItems()
            .classed("selected", true)
            .classed("noselected", false);
          lasso.selectedItems().each(d => {
            let name = "Person" + d.person + "_" + d.number;
            let tmp = self.selectedItems.filter(d => {
              return d.name == name;
            });
            if (tmp.length == 0)
              self.selectedItems.push({ name: name, value: d });
          });
          self.drawItems();
        });
      svg.call(lasso);

      let div = d3.select(self.$el).select("#overview-sample");
      let size = Math.min(
        $("#overview-sample").width(),
        $("#overview-sample").height()
      );
      div.selectAll("img").remove();
      div
        .append("img")
        .attr(
          "src",
          "data/TrainingImages/" +
            currentItem +
            "/" +
            currentItem +
            "_" +
            rand +
            ".jpg"
        )
        .attr("width", size)
        .attr("height", size);

      self.selectedItems = new Array();
    },
    changeIndex() {
      let self = this;
      self.init();
    },
    drawItems() {
      let self = this;
      let selectedItems = self.selectedItems;
      let deleted = self.deleted;
      let div = d3.select(self.$el).select("#overview-items");
      for (let i in selectedItems) {
        let item = selectedItems[i];
        let name = item.name;
        let value = item.value;
        let path = "data/" + name.split("_")[0] + "/" + name + ".jpg";
        let image = new Image();
        image.onload = function() {
          let canvas = document.createElement("canvas"); // 创建canvas对象
          let ctx = canvas.getContext("2d");
          canvas.height = this.height;
          canvas.width = this.width;
          ctx.drawImage(this, 0, 0, this.width, this.height);

          let x = value.x,
            y = value.y,
            w = value.width,
            h = value.height;
          let createNewCanvas = function(content, width, height) {
            let nCanvas = document.createElement("canvas");
            let nCtx = nCanvas.getContext("2d");
            nCanvas.width = width;
            nCanvas.height = height;
            nCtx.putImageData(content, 0, 0); // 将画布上指定矩形的像素数据，通过 putImageData() 方法将图像数据放回画布
            return nCanvas.toDataURL("image/png");
          };
          let cutImage = ctx.getImageData(x, y, w, h);
          let newImage = createNewCanvas(cutImage, w, h);

          div
            .select("#overview-items-item-" + name)
            .select("img")
            .attr("src", newImage)
            .attr("height", 60)
            .attr("width", 60)
            .style("border", () => {
              if (deleted.indexOf(name) >= 0) return "2px solid red";
              else return "0px";
            })
            .on("dblclick", () => {
              let tmp = selectedItems.filter(d => {
                return d.name != name;
              });
              self.selectedItems = tmp;
              self.drawItems();
            });
        };
        image.src = path;
      }
    },
    deleteAll() {
      let self = this;
      let currentItem = self.currentItem;
      let selectedItems = self.selectedItems;
      let deleted = self.deleted;
      let currentResults = JSON.parse(JSON.stringify(self.currentResults));
      for (let i in selectedItems) {
        let name = selectedItems[i].name;
        if (deleted.indexOf(name) >= 0) continue;
        for (let j in currentResults) {
          if (currentResults[j].name == name) {
            let value = currentResults[j].value;
            let tmp = value.filter(d => {
              return d.Label != currentItem;
            });
            currentResults[j].value = tmp;
            break;
          }
        }
      }
      self.updateCurrentResults(currentResults);
    },
    addAll() {
      let self = this;
      let currentItem = self.currentItem;
      let selectedItems = self.selectedItems;
      let globalResults = self.globalResults;
      let deleted = self.deleted;
      let currentResults = JSON.parse(JSON.stringify(self.currentResults));
      for (let i in selectedItems) {
        let name = selectedItems[i].name;
        if (deleted.indexOf(name) < 0) continue;
        for (let j in currentResults) {
          if (currentResults[j].name == name) {
            let value = currentResults[j].value;
            let newItem = globalResults
              .filter(d => {
                return d.name == name;
              })[0]
              .value.filter(d => {
                return d.Label == currentItem;
              })[0];
            let tmp = value.filter(d => {
              return d.Label != currentItem;
            });
            tmp.push(newItem);
            currentResults[j].value = tmp;
            break;
          }
        }
      }
      self.updateCurrentResults(currentResults);
    }
  }
};
</script>

<style lang="less" scoped>
#overview {
  position: absolute;
  width: 100%;
  height: 100%;

  #overview-selector {
    position: absolute;
    left: 20%;
    width: 30%;
    height: 20px;
  }

  #overview-scatterplot {
    position: absolute;
    width: 100%;
    top: 0;
    height: 100%;
  }

  #overview-sample {
    position: absolute;
    width: 100%;
    top: 58%;
    height: 8.25%;

    #overview-delete {
      position: absolute;
      left: 0;
      width: 20%;
      height: 2rem;
      line-height: 2rem;
      background: rgba(249, 249, 249, 1);
      border-radius: 5px;
      border: 1px solid rgba(202, 202, 202, 1);
      text-align: middle;
      font-size: 1rem;
      color: black;
    }

    #overview-add {
      position: absolute;
      right: 0;
      width: 20%;
      height: 2rem;
      line-height: 2rem;
      background: rgba(249, 249, 249, 1);
      border-radius: 5px;
      border: 1px solid rgba(202, 202, 202, 1);
      text-align: middle;
      font-size: 1rem;
      color: black;
    }
  }

  #overview-items {
    position: absolute;
    width: 100%;
    top: calc(58% + 8.25%);
    bottom: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .overview-items-item {
    position: relative;
    float: left;
    height: 60px;
    width: 60px;
    margin: 5px;
  }
}
</style>

<style lang="less">
.selected {
  stroke: orangered;
  stroke-width: 2px;
}

.noselected {
  stroke: black;
  stroke-width: 0.5px;
}
.lasso path {
  stroke: rgb(80, 80, 80);
  stroke-width: 2px;
}

.lasso .drawn {
  fill-opacity: 0.05;
}

.lasso .loop_close {
  fill: none;
  stroke-dasharray: 4, 4;
}

.lasso .origin {
  fill: #3399ff;
  fill-opacity: 0.5;
}
</style>
