<template>
    <div class="ui success message alert-message" v-if="success">
      <i class="close icon" @click="$store.dispatch('wallet/CLEAR')"></i>

      <div class="header">Success</div>
      <slot>
        <p>
          Check transaction at
          <a :href="`https://bloks.iotransaction/${success.transaction_id}`">
            {{ success.transaction_id }}
          </a>
        </p>
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
      success: state => state.success
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
