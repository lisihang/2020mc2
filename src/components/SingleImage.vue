<template>
  <div id="singleimage">
    <div id="singleimage-title">
      <div id="singleimage-title-text">{{ results[index].name }}</div>
      <div id="singleimage-title-pre" @click="changeImage(-1)">Pre</div>
      <div id="singleimage-title-next" @click="changeImage(1)">Next</div>
    </div>
    <div id="singleimage-image"></div>
    <div id="singleimage-text"></div>
    <div id="singleimage-items">
      <div
        v-for="typeName in currentTypeOrder"
        :key="typeName"
        :id="'singleimage-items-' + typeName"
        class="singleimage-items-item"
      >
        <div class="singleimage-items-item-text">{{ typeName }}</div>
        <div class="singleimage-items-item-left"></div>
        <div class="singleimage-items-item-middle"></div>
        <div class="singleimage-items-item-right"></div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import * as d3 from "d3";
import { mapState, mapActions } from "vuex";

export default {
  name: "SingleImage",
  components: {},
  data() {
    return {
      results: [{ name: "" }],
      //index: 36,
      index: 0,
      rand: 1,
      currentTypeOrder: [],
      maxCount: 0,
      itemStat: {},
      currentItem: null,
      texts: null
    };
  },
  computed: {
    ...mapState(["currentResults", "typeNames"])
  },
  watch: {
    currentResults(val) {
      let self = this;
      self.results = val;
      self.init();
    },
    typeNames(val) {
      let self = this;
      self.currentTypeOrder = val;
      self.init();
    }
  },
  mounted() {
    let self = this;
    d3.csv("data/captions.csv").then(data => {
      let texts = {};
      for (let i in data) {
        let name = data[i].file_name;
        let text = data[i].caption;
        texts[name] = text;
      }
      self.texts = texts;
      //self.init();
    });
  },
  methods: {
    ...mapActions(["updateCurrentResults"]),
    changeImage(val) {
      let self = this;
      let t = self.index + val;
      t = Math.max(t, 0);
      t = Math.min(t, self.results.length - 1);
      if (t != self.index) {
        self.index = t;
        if (self.results[self.index].name != self.results[t].name)
          self.rand = parseInt(Math.ceil(Math.random() * 12));
        self.init();
      }
    },
    countItems() {
      let self = this;
      let results = self.results;
      let index = self.index;
      let name = results[index].name;
      let value = results[index].value;
      let currentTypeOrder = JSON.parse(JSON.stringify(self.typeNames));
      let currentPerson = results.filter(d => {
        return d.name.split("_")[0] == name.split("_")[0];
      });
      let itemStat = {};
      let maxCount = 0;
      for (let i in currentTypeOrder) {
        let typeName = currentTypeOrder[i];
        itemStat[typeName] = 0;
      }
      for (let i in currentPerson) {
        let res = currentPerson[i].value;
        for (let j in res) {
          let item = res[j].Label;
          itemStat[item]++;
          maxCount = Math.max(maxCount, itemStat[item]);
        }
      }
      currentTypeOrder.sort((a, b) => {
        return itemStat[b] - itemStat[a];
      });
      self.currentTypeOrder = currentTypeOrder;
      self.maxCount = maxCount;
      self.itemStat = itemStat;
      self.currentItem = null;
    },
    init() {
      let self = this;
      if (
        self.currentResults == null ||
        self.typeNames == null ||
        self.texts == null
      )
        return;
      self.countItems();
      self.addText();
      self.drawImage();
      self.drawItems();
    },
    addText() {
      let self = this;
      let results = self.results;
      let index = self.index;
      let name = results[index].name;
      let html = "";
      let text = self.texts[name];
      let items = self.typeNames;
      if (text != null) {
        let words = text.split(" ");
        for (let i in words) {
          let word = words[i].toLowerCase();
          let flag = false;
          for (let j in items) {
            let item = items[j].toLowerCase();
            if (
              (item.indexOf(word) >= 0 && word.length >= 3) ||
              word.indexOf(item) >= 0
            ) {
              flag = true;
              break;
            }
          }
          if (word == "not" || word == "make") flag = false;
          if (flag) html += "<span style='color:red;'>" + words[i] + "</span> ";
          else html += words[i] + " ";
        }
      }
      let div = document.getElementById("singleimage-text");
      if (div == null) return;
      div.innerHTML = html;
    },
    drawImage() {
      let self = this;
      let results = self.results;
      let index = self.index;
      let name = results[index].name;
      let value = results[index].value;
      let path = "data/" + name.split("_")[0] + "/" + name + ".jpg";
      let width = $("#singleimage-image").width();
      let height = $("#singleimage-image").height();

      d3.select(self.$el)
        .select("#singleimage-image")
        .select("svg")
        .remove();
      let svg = d3
        .select(self.$el)
        .select("#singleimage-image")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      svg
        .append("image")
        .attr("xlink:href", path)
        .attr("width", width)
        .attr("height", height);

      var image = new Image();
      image.onload = function() {
        let w = this.width,
          h = this.height;
        let ratio = Math.min(width / w, height / h);
        svg
          .append("g")
          .selectAll("rect")
          .data(value)
          .enter()
          .append("rect")
          .attr("x", d => {
            return (width - w * ratio) * 0.5 + parseInt(d.x) * ratio;
          })
          .attr("y", d => {
            return (height - h * ratio) * 0.5 + parseInt(d.y) * ratio;
          })
          .attr("width", d => {
            return parseInt(d.Width) * ratio;
          })
          .attr("height", d => {
            return parseInt(d.Height) * ratio;
          })
          .attr("fill-opacity", 0)
          .attr("stroke", "red")
          .attr("stroke-width", 3);

        let brush = d3
          .brush()
          .extent([
            [(width - w * ratio) * 0.5, (height - h * ratio) * 0.5],
            [
              width - (width - w * ratio) * 0.5,
              height - (height - h * ratio) * 0.5
            ]
          ])
          .on("end", () => {
            let x = d3.event.selection[0][0],
              y = d3.event.selection[0][1],
              ww = d3.event.selection[1][0] - d3.event.selection[0][0],
              hh = d3.event.selection[1][1] - d3.event.selection[0][1];
            let item = self.currentItem;
            if (item == null) return;
            let newResults = JSON.parse(JSON.stringify(results));
            let newItem = {};
            newItem.Label = item;
            newItem.Score = 1.0;
            newItem.x = (x - (width - w * ratio) * 0.5) / ratio;
            newItem.y = (y - (height - h * ratio) * 0.5) / ratio;
            newItem.Width = ww / ratio;
            newItem.Height = hh / ratio;
            newItem.new = true;
            newResults[index].value.push(newItem);
            self.updateCurrentResults(newResults);
          });

        svg.append("g").call(brush);
      };
      image.src = path;
    },
    drawItems() {
      let self = this;
      let results = self.results;
      let index = self.index;
      let name = results[index].name;
      let value = results[index].value;
      let currentTypeOrder = self.currentTypeOrder;
      let rand = self.rand;
      let path = "data/" + name.split("_")[0] + "/" + name + ".jpg";
      let maxCount = self.maxCount;
      let itemStat = self.itemStat;

      let xscale = d3
        .scaleLinear()
        .domain([0, maxCount])
        .range([0, $(".singleimage-items-item-right").width() - 30]);
      for (let i in currentTypeOrder) {
        let typeName = currentTypeOrder[i];
        let width = $(".singleimage-items-item-right").width();
        let height = $(".singleimage-items-item-right").height();
        d3.select(self.$el)
          .select("#singleimage-items-" + typeName)
          .selectAll("svg")
          .remove();
        let svg = d3
          .select(self.$el)
          .select("#singleimage-items-" + typeName)
          .select(".singleimage-items-item-right")
          .append("svg")
          .attr("width", width)
          .attr("height", height);
        svg
          .append("rect")
          .attr("x", 0)
          .attr("y", 15)
          .attr("width", xscale(itemStat[typeName]))
          .attr("height", height - 30)
          .attr("stroke-width", 1)
          .attr("fill", "lightgrey");
        svg
          .append("text")
          .attr("x", xscale(itemStat[typeName]) + 2)
          .attr("y", height * 0.5)
          .text(itemStat[typeName])
          .style("dominant-baseline", "middle");
      }

      let image = new Image();
      image.onload = function() {
        let canvas = document.createElement("canvas"); // 创建canvas对象
        let ctx = canvas.getContext("2d");
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0, this.width, this.height);
        for (let i in currentTypeOrder) {
          let typeName = currentTypeOrder[i];
          let width = $("#singleimage-items-" + typeName).width();
          let height = $("#singleimage-items-" + typeName).height();
          let div = d3
            .select(self.$el)
            .select("#singleimage-items-" + typeName);
          div.selectAll("img").remove();
          div
            .select(".singleimage-items-item-middle")
            .append("img")
            .attr(
              "src",
              "data/TrainingImages/" +
                typeName +
                "/" +
                typeName +
                "_" +
                rand +
                ".jpg"
            )
            .attr("width", height)
            .attr("height", height)
            .on("click", () => {
              d3.select(self.$el)
                .selectAll(".singleimage-items-item-middle")
                .selectAll("img")
                .style("border", "0px");
              div
                .select(".singleimage-items-item-middle")
                .select("img")
                .style("border", "5px solid red");
              for (let j in value)
                if (value[j].Label == typeName) {
                  self.currentItem = null;
                  return;
                }
              self.currentItem = typeName;
            });

          let tdata = value.filter(d => {
            return d.Label == typeName;
          });

          if (tdata.length != 0) {
            let x = tdata[0].x,
              y = tdata[0].y,
              w = tdata[0].Width,
              h = tdata[0].Height;
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
              .select(".singleimage-items-item-left")
              .append("img")
              .attr("src", newImage)
              .attr("width", height)
              .attr("height", height)
              .style("float", "right")
              .on("dblclick", () => {
                let tvalue = new Array();
                for (let j in value) {
                  if (value[j].Label != typeName) tvalue.push(value[j]);
                }
                let newResults = JSON.parse(JSON.stringify(results));
                newResults[index].value = tvalue;
                self.updateCurrentResults(newResults);
              });
          }
        }
      };
      image.src = path;
    }
  }
};
</script>

<style lang="less" scoped>
#singleimage {
  position: absolute;
  width: 100%;
  height: 100%;

  #singleimage-title {
    position: absolute;
    width: 100%;
    height: 5%;

    #singleimage-title-text {
      position: absolute;
      width: 100%;
      height: 2rem;
      line-height: 2rem;
      text-align: middle;
      font-size: 1.5rem;
      color: black;
    }

    #singleimage-title-pre {
      position: absolute;
      left: 0;
      width: 20%;
      height: 2rem;
      line-height: 2rem;
      background: rgba(249, 249, 249, 1);
      border-radius: 5px;
      border: 1px solid rgba(202, 202, 202, 1);
      text-align: middle;
      font-size: 1.5rem;
      color: black;
    }

    #singleimage-title-next {
      position: absolute;
      right: 0;
      width: 20%;
      height: 2rem;
      line-height: 2rem;
      background: rgba(249, 249, 249, 1);
      border-radius: 5px;
      border: 1px solid rgba(202, 202, 202, 1);
      text-align: middle;
      font-size: 1.5rem;
      color: black;
    }
  }

  #singleimage-image {
    position: absolute;
    width: 100%;
    top: 5%;
    height: 30%;
  }

  #singleimage-text {
    position: absolute;
    width: 100%;
    top: 35%;
    height: 10%;
    text-align: left;
  }

  #singleimage-items {
    position: absolute;
    width: 100%;
    top: 45%;
    height: 55%;
    overflow-y: auto;
  }

  .singleimage-items-item {
    position: relative;
    float: left;
    width: 100%;
    height: 15%;
    margin-top: 1%;
    margin-bottom: 1%;
  }

  .singleimage-items-item-text {
    position: absolute;
    left: 5%;
    width: 20%;
    top: 0;
    height: 100%;
    text-align: left;
  }

  .singleimage-items-item-left {
    position: absolute;
    left: 25%;
    width: 25%;
    top: 0;
    height: 100%;
  }

  .singleimage-items-item-middle {
    position: absolute;
    left: 50%;
    width: 20%;
    top: 0;
    height: 100%;
    text-align: middle;
  }

  .singleimage-items-item-right {
    position: absolute;
    left: 70%;
    width: 30%;
    top: 0;
    height: 100%;
  }
}
</style>
