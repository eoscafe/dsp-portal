<template>
    <div class="ui error message alert-message" v-if="error">
      <i class="close icon" @click="$store.dispatch('wallet/CLEAR')"></i>

      <div class="header">Error</div>
      <slot>
        <p> {{ error }} </p>
      </slot>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data () {
    return {

    }
  },

  computed: {
    ...mapState({
      error: state => state.error
    })
  },

  methods: {

  },
  created () {

  }
}
</script>

<style scoped>
a {
  color: #1046A8;
}

.alert-message {
  overflow-wrap: break-word !important;
}
</style>
