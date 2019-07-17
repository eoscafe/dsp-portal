import Vue from 'vue'
import Vuex from 'vuex'

import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'
import ScatterLynx from 'scatterjs-plugin-lynx'
import { Api } from 'eosjs'

Vue.use(Vuex)

ScatterJS.plugins(new ScatterEOS(), new ScatterLynx())

const ENDPOINT = {
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
  port: 443,
  protocol: 'https',
  host: 'eos.greymass.com',
  httpEndpoint: 'https://eos.greymass.com',
  blockchain: 'eos'
}

const initialState = () => ({
  error: undefined,
  success: undefined,
  user: {
    actor: undefined,
    permission: undefined
  },
  scatter: undefined,
  provider: undefined
})

export default new Vuex.Store({
  state: initialState(),
  actions: {
    async LOGIN ({ commit, state }) {
      let connected = await ScatterJS.scatter.connect('BloksDSP')

      if (connected) {
        commit('SET_SCATTER', ScatterJS.scatter)
        window.scatter = null

        let identity = await state.scatter.getIdentity({ accounts: [ ENDPOINT ] })
        commit('SET_USER', {
          actor: identity.accounts[0].name,
          permission: identity.accounts[0].authority
        })

        let provider = state.scatter.eos(ENDPOINT, Api, { rpc: this._vm.$api.eos })
        commit('SET_PROVIDER', provider)
      }
    },

    async LOGOUT ({ commit }) {
      commit('RESET')
    },

    async TRANSACT ({ state, commit }, actions) {
      const authorization = [{
        actor: state.user.actor,
        permission: state.user.permission
      }]

      actions = actions.map(action => {
        action.authorization = authorization
        return action
      })

      let obj1 = {
        actions: actions
      }

      let obj2 = {
        blocksBehind: 3,
        expireSeconds: 3600,
        broadcast: true
      }

      try {
        const success = await state.provider.transact(obj1, obj2)
        commit('SET_SUCCESS', success)
        return success
      } catch (e) {
        commit('SET_ERROR', e.reason || e.message || e.toString() || e)
      }
    }
  },

  mutations: {
    SET_SCATTER (state, scatter) {
      state.scatter = scatter
    },

    SET_USER (state, user) {
      state.user = user
    },

    SET_PROVIDER (state, provider) {
      state.provider = provider
    },

    SET_SUCCESS (state, success) {
      state.success = success
    },

    SET_ERROR (state, error) {
      state.error = error
    },

    RESET (state) {
      Object.assign(state, initialState())
    }
  }
})
