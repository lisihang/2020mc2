<template>
  <div id="test">
    <div id="test-head">{{ title }}</div>
    <div id="test-svg"></div>
  </div>
</template>

<script>
import $ from "jquery";
import * as d3 from "d3";
import { mapState, mapActions } from "vuex";

export default {
  name: "Test",
  components: {},
  data() {
    return {
      title: ""
    };
  },
  computed: {},
  watch: {},
  mounted() {
    let self = this;
    d3.csv("GroundTruth.csv").then(data => {
      console.log(data);

      let typeStat = {};
      for (let i = 0; i < data.length; i++) {
        if (i != 0 && data[i].file_name == data[i - 1].file_name) continue;
        let tdata = data.filter(d => {
          return d.file_name == data[i].file_name;
        });

        let items = new Array();
        for (let j in tdata[0])
          if (j.startsWith("ground_truth") && tdata[0][j] != "")
            items.push(tdata[0][j]);

        // 0 正确 1 误判 2 漏判
        let tmp = new Array();
        for (let j in tdata) {
          let label = tdata[j].Label,
            score = tdata[j].Score;
          if (label == "") continue;
          if (items.indexOf(label) >= 0) {
            tmp.push(label);
            if (typeStat[label] == null) {
              typeStat[label] = new Array(3);
              typeStat[label][0] = new Array();
              typeStat[label][1] = new Array();
              typeStat[label][2] = new Array(2).fill(0);
            }
            typeStat[label][0].push(score);
          } else {
            if (typeStat[label] == null) {
              typeStat[label] = new Array(3);
              typeStat[label][0] = new Array();
              typeStat[label][1] = new Array();
              typeStat[label][2] = new Array(2).fill(0);
            }
            typeStat[label][1].push(score);
          }
        }

        for (let j in items) {
          let label = items[j];
          if (typeStat[label] == null) {
            typeStat[label] = new Array(3);
            typeStat[label][0] = new Array();
            typeStat[label][1] = new Array();
            typeStat[label][2] = new Array(2).fill(0);
          }

          typeStat[label][2][1]++;

          if (tmp.indexOf(label) < 0) typeStat[label][2][0]++;
        }
      }
      console.log(typeStat);

      self.draw(typeStat);
    });
  },
  methods: {
    draw(typeStat) {
      let self = this;
      let height = $("#test-svg").height();
      let width = $("#test-svg").width();
      let size = Math.min(height, width);
      let padding = {
        left: 50,
        right: 50,
        top: 50,
        bottom: 50
      };
      let svg = d3
        .select(self.$el)
        .select("#test-svg")
        .append("svg")
        .attr("width", size)
        .attr("height", size);

      let data = new Array();
      for (let i in typeStat) data.push({ name: i, stat: typeStat[i] });

      let xscale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding.left, size - padding.right]);

      let yscale = d3
        .scaleLinear()
        .domain([1, 0])
        .range([padding.top, size - padding.bottom]);

      let xx = padding.left * 0.5 - 20;

      svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("id", d => {
          return "test-svg-circle-" + d.name;
        })
        .attr("cx", d => {
          if (d.stat[1].length == 0) {
            xx += 20;
            return xx;
          } else
            return xscale(
              d.stat[0].length / (d.stat[0].length + d.stat[1].length)
            );
        })
        .attr("cy", d => {
          if (d.stat[1].length == 0) return size - padding.bottom * 0.5;
          else return yscale((d.stat[2][1] - d.stat[2][0]) / d.stat[2][1]);
        })
        .attr("r", 4)
        .attr("fill-opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("click", d => {
          svg.selectAll("circle").attr("fill-opacity", 0);
          svg
            .select("#test-svg-circle-" + d.name)
            .attr("fill-opacity", 1)
            .attr("fill", "orange");

          self.changeText(d);
        });

      let xaxis = d3.axisBottom().scale(xscale);
      let yaxis = d3.axisLeft().scale(yscale);
      svg
        .append("g")
        .attr("transform", "translate(0, " + (size - padding.bottom) + ")")
        .call(xaxis);
      svg
        .append("g")
        .attr("transform", "translate(" + padding.left + ", 0)")
        .call(yaxis);

      svg
        .append("g")
        .append("text")
        .attr("x", size - padding.right * 2)
        .attr("y", size - padding.bottom * 1.2)
        .text("正确率");

      svg
        .append("g")
        .append("text")
        .attr("x", padding.left * 1.2)
        .attr("y", padding.top * 1.2)
        .text("1-漏判率");
    },
    changeText(d) {
      let self = this;
      let title = "";
      let empty = "         ";
      title += d.name;
      title += empty;
      title += "正确判断：";
      title += d.stat[0].length;
      title += empty;
      title += "错误判断：";
      title += d.stat[1].length;
      title += empty;
      title += "漏判率：";
      title += d.stat[2][0] + " / " + d.stat[2][1];
      self.title = title;
    }
  }
};
</script>

<style lang="less" scoped>
#test {
  position: absolute;
  width: 100%;
  height: 100%;

  #test-head {
    position: absolute;
    width: 100%;
    height: 5%;
  }

  #test-svg {
    position: absolute;
    width: 100%;
    top: 5%;
    height: 95%;
  }
}
</style>
