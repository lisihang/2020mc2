<template>
  <div id="main">
    <Test />
  </div>
</template>

<script>
import Test from "@/components/Test";
import $ from "jquery";
import * as d3 from "d3";
import { mapState, mapActions } from "vuex";

export default {
  name: "Main",
  components: {
    Test
  },
  data() {
    return {};
  },
  computed: {},
  watch: {},
  mounted() {},
  methods: {}
};
</script>

<style lang="less" scoped>
#main {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
