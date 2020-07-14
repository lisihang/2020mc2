import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const types = {
  UPDATE_TYPE_NAMES: "UPDATE_TYPE_NAMES",
  UPDATE_GLOBAL_RESULTS: "UPDATE_GLOBAL_RESULTS",
  UPDATE_CURRENT_RESULTS: "UPDATE_CURRENT_RESULTS",
  UPDATE_GROUND_TRUTH: "UPDATE_GROUND_TRUTH"
};

export default new Vuex.Store({
  state: {
    typeNames: null,
    globalResults: null,
    currentResults: null,
    groundTruth: null
  },
  mutations: {
    [types.UPDATE_TYPE_NAMES](state, data) {
      state.typeNames = data;
    },
    [types.UPDATE_GLOBAL_RESULTS](state, data) {
      state.globalResults = data;
    },
    [types.UPDATE_CURRENT_RESULTS](state, data) {
      state.currentResults = data;
    },
    [types.UPDATE_GROUND_TRUTH](state, data) {
      state.groundTruth = data;
    }
  },
  actions: {
    updateTypeNames({ commit }, data) {
      commit(types.UPDATE_TYPE_NAMES, data);
    },
    updateGlobalResults({ commit }, data) {
      commit(types.UPDATE_GLOBAL_RESULTS, data);
    },
    updateCurrentResults({ commit }, data) {
      commit(types.UPDATE_CURRENT_RESULTS, data);
    },
    updateGroundTruth({ commit }, data) {
      commit(types.UPDATE_GROUND_TRUTH, data);
    }
  },
  modules: {}
});
