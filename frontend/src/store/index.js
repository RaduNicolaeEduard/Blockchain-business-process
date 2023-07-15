import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loading: false,
    message: '',
    error: ''
  },
  getters: {
    loading(state) {
      return state.loading
    }
  },
  mutations: {
    setLoading(state, payload) {
      state.loading = payload
    },
    setMessage: (state, payload) => { state.message = payload },
    setError: (state, payload) => { state.error = payload },
  },
  actions: {
    setLoading({ commit }, payload) {
      commit('setLoading', payload)
    },
    setMessage({ commit }, payload) {
      commit('setMessage', payload)
    },
    setError({ commit }, payload) {
      commit('setError', payload)
    }
  },
  modules: {
  }
})
