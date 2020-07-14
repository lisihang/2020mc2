<template>
  <div id="main">
    <div id="main-left">
      <Overview />
    </div>
    <div id="main-middle">
      <SingleImage />
    </div>
    <div id="main-right">
      <Evaluation />
    </div>
  </div>
</template>

<script>
import Overview from "@/components/Overview";
import SingleImage from "@/components/SingleImage";
import Evaluation from "@/components/Evaluation";
import $ from "jquery";
import * as d3 from "d3";
import { mapState, mapActions } from "vuex";

export default {
  name: "Main",
  components: {
    Overview,
    SingleImage,
    Evaluation
  },
  data() {
    return {};
  },
  computed: {},
  watch: {},
  mounted() {
    let self = this;
    d3.csv("data/GroundTruth.csv").then(data => {
      let typeNames = new Array();
      let groundTruth = new Array();
      let results = new Array();
      for (let i = 0; i < data.length; i++) {
        if (i != 0 && data[i].file_name == data[i - 1].file_name) continue;
        let tdata = data.filter(d => {
          return d.file_name == data[i].file_name;
        });
        results.push({ name: tdata[0].file_name, value: tdata });

        let items = new Array();
        for (let j in tdata[0])
          if (
            j.startsWith("ground_truth") &&
            tdata[0][j] != "" &&
            tdata[0][j] != "null"
          ) {
            items.push(tdata[0][j]);
            if (typeNames.indexOf(tdata[0][j]) < 0) typeNames.push(tdata[0][j]);
          }
        groundTruth.push({ name: tdata[0].file_name, value: items });
      }
      typeNames.sort();
      console.log(typeNames, results, groundTruth);
      self.updateTypeNames(typeNames);
      self.updateGlobalResults(results);
      self.updateCurrentResults(results);
      self.updateGroundTruth(groundTruth);
    });
  },
  methods: {
    ...mapActions([
      "updateTypeNames",
      "updateGlobalResults",
      "updateCurrentResults",
      "updateGroundTruth"
    ])
  }
};
</script>

<style lang="less" scoped>
#main {
  position: absolute;
  width: 100%;
  height: 100%;

  #main-left {
    position: absolute;
    left: 0%;
    width: 33%;
    height: 100%;
  }

  #main-middle {
    position: absolute;
    left: 33%;
    width: 34%;
    height: 100%;
  }

  #main-right {
    position: absolute;
    left: 67%;
    width: 33%;
    height: 100%;
  }
}
</style>
