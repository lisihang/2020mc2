<template>
  <div id="evaluation"></div>
</template>

<script>
import $ from "jquery";
import * as d3 from "d3";
import { mapState, mapActions } from "vuex";

export default {
  name: "Evaluation",
  components: {},
  data() {
    return {
      typeStat: null,
      item: ""
    };
  },
  computed: {
    ...mapState(["globalResults", "currentResults", "typeNames"])
  },
  watch: {
    globalResults(val) {
      let self = this;
      self.init();
    },
    currentResults(val) {
      let self = this;
      self.init();
    },
    typeNames(val) {
      let self = this;
      self.init();
    }
  },
  mounted() {},
  methods: {
    init() {
      let self = this;
      self.typeStatistic();
      self.drawScatterplot();
    },
    typeStatistic() {
      let self = this;
      if (
        self.globalResults == null ||
        self.currentResults == null ||
        self.typeNames == null
      )
        return;
      let typeNames = self.typeNames;
      let currentResults = self.currentResults;
      let globalResults = self.globalResults;

      let typeStat = {};
      let addStat = function(item, x, w) {
        if (item == "") return;
        if (typeStat[item] == null) {
          typeStat[item] = {};
          typeStat[item]["correct"] = new Array();
          typeStat[item]["wrong"] = new Array();
          typeStat[item]["missing"] = new Array();
        }
        typeStat[item][x].push(w);
      };
      for (let i in currentResults) {
        let current = currentResults[i].value,
          global = globalResults[i].value;
        for (let j in global) {
          let t = global[j];
          let tmp = current.filter(d => {
            return d.Label == t.Label;
          });
          if (tmp.length > 0) addStat(t.Label, "correct", parseFloat(t.Score));
          else addStat(t.Label, "wrong", parseFloat(t.Score));
        }
        for (let j in current) {
          let t = current[j];
          let tmp = global.filter(d => {
            return d.Label == t.Label;
          });
          if (tmp.length == 0) addStat(t.Label, "missing", globalResults[i]);
        }
      }
      self.typeStat = typeStat;
    },
    drawScatterplot() {
      let self = this;
      let height = self.$el.clientHeight;
      let width = self.$el.clientWidth;
      let padding = {
        left: 40,
        right: 20,
        top: 20,
        bottom: 40
      };
      let typeStat = self.typeStat;
      d3.select(self.$el)
        .select("#evaluation-svg")
        .remove();
      let svg = d3
        .select(self.$el)
        .append("svg")
        .attr("id", "evaluation-svg")
        .attr("width", width)
        .attr("height", height);

      let data = new Array();
      for (let i in typeStat) data.push({ name: i, value: typeStat[i] });

      let xscale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding.left, width - padding.right]);

      let yscale = d3
        .scaleLinear()
        .domain([1, 0])
        .range([padding.top, width - padding.bottom]);

      let xx = padding.left * 0.5 - 20;

      svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("id", d => {
          return "evaluation-svg-circle-" + d.name;
        })
        .attr("cx", d => {
          if (d.value["correct"].length + d.value["wrong"].length == 0) {
            xx += 20;
            return xx;
          } else
            return xscale(
              d.value["correct"].length /
                (d.value["correct"].length + d.value["wrong"].length)
            );
        })
        .attr("cy", d => {
          if (d.value["correct"].length + d.value["wrong"].length == 0)
            return width - padding.bottom * 0.4;
          else
            return yscale(
              1 -
                d.value["missing"].length /
                  (d.value["missing"].length + d.value["correct"].length)
            );
        })
        .attr("r", 4)
        .attr("fill-opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("click", d => {
          svg.selectAll("circle").attr("fill-opacity", 0);
          if (self.item == d.name) {
            self.item = "";
            svg.select("#evaluation-svg-title").text("All");
            self.drawLines(svg, "");
            return;
          }
          svg
            .select("#evaluation-svg-circle-" + d.name)
            .attr("fill-opacity", 1)
            .attr("fill", "orange");
          self.item = d.name;
          svg.select("#evaluation-svg-title").text(d.name);
          self.drawLines(svg, d.name);
        });

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
        .text("Acc");

      svg
        .append("g")
        .append("text")
        .attr("x", padding.left * 1.2)
        .attr("y", padding.top * 1.5)
        .text("1 - MissingRate");
      if (self.item != "")
        svg
          .select("#evaluation-svg-circle-" + self.item)
          .attr("fill-opacity", 1)
          .attr("fill", "orange");
      svg
        .append("g")
        .append("text")
        .attr("id", "evaluation-svg-title")
        .text(self.item == "" ? "All" : self.item)
        .attr("x", width / 2)
        .attr("y", padding.top)
        .style("text-align", "middle");
      self.drawLines(svg, self.item);
    },
    drawLines(svg, item) {
      let self = this;
      let stat;
      let line;
      let pace = 0.05;
      let xscale;
      let yscale;
      let mx;
      let xaxis;
      let yaxis;
      let height = self.$el.clientHeight;
      let width = self.$el.clientWidth;
      let padding = {
        left: 40,
        right: 20,
        top: 20,
        bottom: 20
      };
      svg.select("#evaluation-svg-lines").remove();
      let group = svg.append("g").attr("id", "evaluation-svg-lines");
      let typeStat = self.typeStat;
      if (item != "" && typeStat[item] == null) item = "";
      let sty = width;
      if (sty > height) sty = height * 0.5;
      sty -= 10;
      sty += 10;
      let h = (height - sty) / 2;
      let correct = new Array();
      let wrong = new Array();
      if (item == "")
        for (let i in typeStat) {
          correct = correct.concat(typeStat[i]["correct"]);
          wrong = wrong.concat(typeStat[i]["wrong"]);
        }
      else {
        correct = typeStat[item]["correct"];
        wrong = typeStat[item]["wrong"];
      }

      // correct
      stat = new Array();
      stat.push([0, 0]);
      mx = 0;
      for (let i = 0; i < 1.0; i += pace) {
        let count = correct.filter(d => {
          return d >= i && d <= i + pace;
        }).length;
        stat.push([i + pace * 0.5, count]);
        mx = Math.max(mx, count);
      }
      stat.push([1, 0]);
      xscale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding.left, width - padding.right]);
      yscale = d3
        .scaleLinear()
        .domain([0, mx])
        .range([sty + h - padding.bottom, sty + padding.top]);
      line = d3
        .line()
        .x(d => {
          return xscale(d[0]);
        })
        .y(d => {
          return yscale(d[1]);
        })
        .curve(d3.curveMonotoneX);
      group
        .append("g")
        .append("path")
        .attr("d", line(stat))
        .attr("fill", "darkturquoise")
        .attr("stroke-width", 0);
      xaxis = d3.axisBottom().scale(xscale);
      yaxis = d3
        .axisLeft()
        .scale(yscale)
        .tickFormat(function(e) {
          if (Math.floor(e) != e) {
            return;
          }
          return e;
        });
      group
        .append("g")
        .attr("transform", "translate(0, " + (sty + h - padding.bottom) + ")")
        .call(xaxis);
      group
        .append("g")
        .attr("transform", "translate(" + padding.left + ", 0)")
        .call(yaxis);
      group
        .append("g")
        .append("text")
        .text("Correct")
        .attr("x", 5)
        .attr("y", sty + padding.top * 0.5)
        .style("dominant-baseline", "middle");
      group
        .append("g")
        .append("text")
        .attr("x", width - padding.right * 3)
        .attr("y", sty + h - padding.bottom * 1.2)
        .text("Score");

      // wrong
      stat = new Array();
      stat.push([0, 0]);
      mx = 0;
      for (let i = 0; i < 1.0; i += pace) {
        let count = wrong.filter(d => {
          return d >= i && d <= i + pace;
        }).length;
        stat.push([i + pace * 0.5, count]);
        mx = Math.max(mx, count);
      }
      stat.push([1, 0]);
      xscale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding.left, width - padding.right]);
      yscale = d3
        .scaleLinear()
        .domain([0, mx])
        .range([sty + h + h - padding.bottom, sty + h + padding.top]);
      line = d3
        .line()
        .x(d => {
          return xscale(d[0]);
        })
        .y(d => {
          return yscale(d[1]);
        })
        .curve(d3.curveMonotoneX);
      group
        .append("g")
        .append("path")
        .attr("d", line(stat))
        .attr("fill", "orangered")
        .attr("stroke-width", 0);
      xaxis = d3.axisBottom().scale(xscale);
      yaxis = d3
        .axisLeft()
        .scale(yscale)
        .tickFormat(function(e) {
          if (Math.floor(e) != e) {
            return;
          }
          return e;
        });
      group
        .append("g")
        .attr(
          "transform",
          "translate(0, " + (sty + h + h - padding.bottom) + ")"
        )
        .call(xaxis);
      group
        .append("g")
        .attr("transform", "translate(" + padding.left + ", 0)")
        .call(yaxis);
      group
        .append("g")
        .append("text")
        .text("Wrong")
        .attr("x", 5)
        .attr("y", sty + h + padding.top * 0.5)
        .style("dominant-baseline", "middle");
      group
        .append("g")
        .append("text")
        .attr("x", width - padding.right * 3)
        .attr("y", sty + h + h - padding.bottom * 1.2)
        .text("Score");
    }
  }
};
</script>

<style lang="less" scoped>
#evaluation {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
