<template>
  <div class="ui container" id="top-container">
    <div class="ui primary button fluid" @click="LOGIN" v-if="!actor">
      Login
    </div>
    <div class="ui success message" v-else>
      Logged in as {{ actor }}. <span @click="LOGOUT" style="cursor: pointer"><b>Logout</b></span>
    </div>

    <div class="ui padded segment" id="table-header">
      <h2 style="padding-top: 0px;">
        DSP Portal
        <button class="right floated middle aligned ui labeled icon secondary button" id="inline-button" style="margin-top: 0px;" @click="refresh" v-if="actor">
          <i class="refresh icon"></i>
          Refresh DAPPHDL
        </button>
      </h2>

      <tabs :options="{ useUrlFragment: false }" ref="dappTabs">
        <tab name="Balance">
          <div v-if="dappBalance && dapphodlBalance">
            <h2> DAPP/DAPPHDL Balance </h2>
            <p><label><b>DAPP Balance:</b></label>{{ dappBalance.balance ? displayAsset(dappBalance.balance) : '0.0000 DAPP' }}</p>
            <p><label><b>DAPPHDL Balance:</b></label>{{ dapphodlBalance.balance ? displayAsset(dapphodlBalance.balance) : '0.0000 DAPPHDL' }}</p>
            <p><label><b>DAPPHDL Vesting:</b></label>{{ dapphodlBalance.allocation ? displayAsset(dapphodlBalance.allocation) : '0.0000 DAPPHDL' }}</p>

            <p>
              <label><b>Total Staked:</b></label>{{ stakedDapp ? displayNumberAsAsset(stakedDapp, 'DAPP', 4) : '0.0000 DAPP' }}
              ({{ unstakedDapp || '0.0000' }} Unstaking)
            </p>

            <div class="ui blue button" @click="refresh" v-if="claimable">
              Claim {{ claimable }} DAPPHDL
            </div>
            <br>
          </div>
          <span v-else>
            <br>
            Please login to view balance
          </span>
        </tab>

        <tab :name="`Stakes (${stakes.length})`">
          <span v-if="!actor">
            <br>
            Please login to view stakes
          </span>
          <table class="ui selectable very basic unstackable table"  v-else-if="stakes.length">
            <!--Table Titles-->
            <thead class="table-header">
              <tr>
                <th class="one wide"><p class="table-header-text">#</p></th>
                <th class="three wide"><p class="table-header-text">Service</p></th>
                <th class="three wide"><p class="table-header-text">Provider</p></th>
                <th class="three wide"><p class="table-header-text">Balance</p></th>
                <th class="three wide"><p class="table-header-text">Actions</p></th>
              </tr>
            </thead>

            <!--Table Content-->
            <tbody>
              <tr v-for="(stake, index) in stakes" :key="stake.id">
                <td>{{ index + 1 }}</td>
                <td>{{ stake.service }}</td>
                <td>{{ stake.provider }}</td>
                <td>{{ displayAsset(stake.balance) }}</td>
                <td>
                  <div class="ui button" @click="unstake(stake)">
                    Unstake
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else>
            <br>
            No stakes found for user.
          </div>
        </tab>

        <tab :name="`Unstaking (${unstakes.length})`">
          <span v-if="!actor">
            <br>
            Please login to view unstakes
          </span>
          <table class="ui selectable very basic unstackable table" v-else-if="unstakes.length">
            <!--Table Titles-->
            <thead class="table-header">
              <tr>
                <th class="one wide"><p class="table-header-text">#</p></th>
                <th class="three wide"><p class="table-header-text">Amount</p></th>
                <th class="three wide"><p class="table-header-text">Provider</p></th>
                <th class="three wide"><p class="table-header-text">Service</p></th>
                <th class="three wide"><p class="table-header-text">Unstake Completed</p></th>
              </tr>
            </thead>

            <!--Table Content-->
            <tbody>
              <tr v-for="(unstake, index) in unstakes" :key="unstake.id">
                <td>{{ index + 1 }}</td>
                <td>{{ unstake.amount }}</td>
                <td>{{ unstake.provider }}</td>
                <td>{{ unstake.service }}</td>
                <td>{{ formatDate(unstake.unstake_time) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else>
            <br>
            No unstakes found for user.
          </div>
        </tab>

        <tab name="Stake" id="stake" v-if="selectedPackageForStaking">
          <h3 style="padding-top: 15px;"> Package Summary </h3>

          <div v-if="selectedPackageJson">
            <div v-if="selectedPackageJson.name">
              <img :src="selectedPackageJson.logo.logo_256"
                   height="40" width="40"
                   style="vertical-align: middle;"
                   v-if="selectedPackageJson.logo && selectedPackageJson.logo.logo_256"/>
              &nbsp;
              <b>{{ selectedPackageJson.name }}</b>
            </div>
            <br>
            <div>
              {{ selectedPackageJson.description }}
            </div>
            <br>
          </div>

          <div v-if="selectedPackageForStaking">
            Staking to package <b>{{ selectedPackageForStaking.package_id }}</b> for service <b>{{ selectedPackageForStaking.service }}</b> from DSP
            <router-link :to="`/account/${selectedPackageForStaking.provider}`">
              <b>{{ selectedPackageForStaking.provider }}</b>.
            </router-link>
            <br><br>
          </div>

          <div class="ui button" v-if="selectedPackageDspJson" @click="showPackageJson = false; showDspJson = !showDspJson">
            Full DSP Data
          </div>
          <div class="ui button" v-if="selectedPackageJson" @click="showDspJson = false; showPackageJson = !showPackageJson">
            Full Package Data
          </div>
          <div v-if="showDspJson">
            <JsonTree :data="selectedPackageDspJson"/>
          </div>
          <div v-if="showPackageJson">
            <JsonTree :data="selectedPackageJson"/>
          </div>
          <div v-if="selectedPackageDspJson || selectedPackageJson">
            <br><br>
          </div>

          <h3> Stake to Package </h3>
          <div>
            <label><b>DAPP to Stake</b></label>
            <div class="ui input">
              <input type="text" v-model="stakeDappInput" placeholder="DAPP Amount">
              <span style="display: inline-block;line-height: 40px; color: #2185d0; cursor: pointer;"
                    @click="stakeDappInput = dappBalanceNumber"> &nbsp; Max ({{dappBalanceNumber}})</span>
            </div>
          </div>
          <div>
            <label><b>DAPPHDL to Stake</b></label>
            <div class="ui input">
              <input type="text" v-model="stakeDapphodlInput" placeholder="DAPPHDL Amount">
              <span style="display: inline-block;line-height: 40px; color: #2185d0; cursor: pointer;"
                    @click="stakeDapphodlInput = dapphodlBalanceNumber"> &nbsp; Max ({{dapphodlBalanceNumber}})</span>
            </div>
            <br><br>
          </div>

          <div class="ui blue button" @click="stake(selectedPackageForStaking, +stakeDappInput, +stakeDapphodlInput)">
            Stake {{ (+stakeDappInput + +stakeDapphodlInput).toFixed(4) }}
          </div>
        </tab>
      </tabs>

      <success/>
      <error/>
    </div>

    <div class="ui padded segment" id="table-header">
      <h2 style="padding-top: 0px;">
        Packages and DSPs
      </h2>

      <tabs :options="{ useUrlFragment: false }">
        <tab name="Packages">
          <div class="ui fluid action input" v-if="dspPackages.length">
            <input type="text" v-model="dspFilter" placeholder="Search by ID, service or provider...">
          </div>

          <sui-dropdown
            placeholder="Filter by Provider"
            selection
            direction="downward"
            :options="providerSelectOptions"
            v-model="providerSelectFilter"
            style="margin-top: 10px;"
          /> <span class="mobile hidden">&nbsp;&nbsp;</span>

          <sui-dropdown
            placeholder="Filter by Service"
            selection
            direction="downward"
            :options="serviceSelectOptions"
            v-model="serviceSelectFilter"
          /> <span class="mobile hidden">&nbsp;&nbsp;</span>

          <sui-dropdown
            placeholder="Order by"
            selection
            direction="downward"
            :options="orderBySelectOptions"
            v-model="orderSelectFilter"
          /> <span class="mobile hidden">&nbsp;&nbsp;</span>

          <div class="ui input">
            <input type="text" placeholder="Minimum Quota..." v-model="minimumQuota">
          </div> <span class="mobile hidden">&nbsp;&nbsp;</span>

          <div class="ui input">
            <input type="text" placeholder="Minimum Stake..." v-model="minimumStake">
          </div>

          <div id="table-wrapper" style="padding-top: 30px;" v-if="dspPackages.length">
            <!--Start of Table -->
            <table class="ui selectable very basic unstackable table">
              <!--Table Titles-->
              <thead class="table-header">
                <tr>
                  <th class="one wide"><p class="table-header-text">#</p></th>
                  <th class="three wide"><p class="table-header-text">Provider</p></th>
                  <th class="two wide"><p class="table-header-text">Package ID</p></th>
                  <th class="two wide"><p class="table-header-text">Service</p></th>
                  <th class="two wide"><p class="table-header-text">Quota</p></th>
                  <th class="two wide"><p class="table-header-text">Minimum Stake</p></th>
                  <th class="two wide"><p class="table-header-text">Unstake Time</p></th>
                  <th class="two wide"><p class="table-header-text">Actions</p></th>
                </tr>
              </thead>

              <!--Table Content-->
              <tbody>
                <tr v-for="(pkg, index) in displayPackages" :key="pkg.id">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <img
                      v-if="allDspJsons[pkg.provider] && allDspJsons[pkg.provider].branding && allDspJsons[pkg.provider].branding.logo_256"
                      :src="allDspJsons[pkg.provider].branding.logo_256"
                      @error="e => e.target.src = '/img/smallwhite.jpg'"
                      width="28"
                      height="28"
                      style="vertical-align: middle"
                    />
                    <div v-else style="height: 28px; width: 28px; display: inline-block;vertical-align: middle;">
                    </div>

                    <router-link :to="'/account/' + pkg.provider">
                      &nbsp; {{ pkg.provider }}
                    </router-link>
                  </td>
                  <td>{{ pkg.package_id }}</td>
                  <td>{{ pkg.service }}</td>
                  <td>{{ pkg.quotaText }}</td>
                  <td>{{ displayNumberAsAsset(pkg.min_stake_quantity, 'DAPP', 4) }}</td>
                  <td>{{ parseSeconds(pkg.min_unstake_period) }}</td>
                  <td>
                    <div class="ui button" @click="e => selectPackage(pkg, e)">
                      Stake
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </tab>
        <tab name="DSPs">
          <div style="padding-top: 10px;" v-if="totalDappStaked">
            <b>Total DAPP Staked:</b> {{ displayNumberAsAsset(totalDappStaked, 'DAPP', 4) }}
          </div>

          <div id="table-wrapper" style="padding-top: 30px;" v-if="dspRewards.length">
            <!--Start of Table -->
            <table class="ui selectable very basic unstackable table">
              <!--Table Titles-->
              <thead class="table-header">
                <tr>
                  <th class="one wide"><p class="table-header-text">#</p></th>
                  <th class="two wide"><p class="table-header-text">Provider</p></th>
                  <th class="two wide"><p class="table-header-text">Location</p></th>
                  <th class="two wide"><p class="table-header-text">Links</p></th>
                  <th class="two wide"><p class="table-header-text">Total Staked</p></th>
                  <th class="two wide"><p class="table-header-text">Percentage Staked</p></th>
                  <th class="two wide"><p class="table-header-text">Daily Reward</p></th>
                  <th class="one wide"><p class="table-header-text">Users</p></th>
                  <th class="one wide"><p class="table-header-text">Packages</p></th>
                </tr>
              </thead>

              <!--Table Content-->
              <tbody>
                <tr v-for="(dsp, index) in dspRewards" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <img
                      v-if="allDspJsons[dsp.provider] && allDspJsons[dsp.provider].branding && allDspJsons[dsp.provider].branding.logo_256"
                      :src="allDspJsons[dsp.provider].branding.logo_256"
                      @error="e => e.target.src = '/img/smallwhite.jpg'"
                      width="28"
                      height="28"
                      style="vertical-align: middle"
                    />
                    <div v-else style="height: 28px; width: 28px; display: inline-block;vertical-align: middle;">
                    </div>

                    <router-link :to="'/account/' + dsp.provider">
                      &nbsp; {{ dsp.provider }}
                    </router-link>
                  </td>
                  <td>
                    <div class="ui unstackable items" v-if="allDspJsons[dsp.provider] && allDspJsons[dsp.provider].location && allDspJsons[dsp.provider].location.country">
                      <div class="item">
                        <div class="middle aligned content">
                          <i class="flag" :class="allDspJsons[dsp.provider].location.country.toLowerCase()"/> &nbsp;
                          {{ allDspJsons[dsp.provider].location.name }}, {{ allDspJsons[dsp.provider].location.country }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a v-if="allDspJsons[dsp.provider] && allDspJsons[dsp.provider].website !== ''" :href="allDspJsons[dsp.provider].website" target="_blank">
                      <i class="globe icon"></i>
                    </a>
                    <a v-if="allDspJsons[dsp.provider] && allDspJsons[dsp.provider].social && allDspJsons[dsp.provider].social.telegram && allDspJsons[dsp.provider].social.telegram !== ''" :href="`https://t.me/${allDspJsons[dsp.provider].social.telegram}`" target="_blank">
                      <i class="telegram icon"></i>
                    </a>
                    <a v-if="allDspJsons[dsp.provider] && allDspJsons[dsp.provider].social && allDspJsons[dsp.provider].social.github && allDspJsons[dsp.provider].social.github !== ''" :href="`https://github.com/${allDspJsons[dsp.provider].social.github}`" target="_blank">
                      <i class="github icon"></i>
                    </a>
                  </td>
                  <td>{{ dsp.dappStaked }}</td>
                  <td>{{ dsp.percentageStaked }}</td>
                  <td>{{ dsp.dailyReward }}</td>
                  <td>{{ dsp.users }}</td>
                  <td>{{ dsp.packages }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </tab>
        <tab name="Users">
          <div id="table-wrapper" style="padding-top: 30px;" v-if="dspAccounts.length">
            <!--Start of Table -->
            <table class="ui selectable very basic unstackable table">
              <!--Table Titles-->
              <thead class="table-header">
                <tr>
                  <th class="one wide"><p class="table-header-text">#</p></th>
                  <th class="two wide"><p class="table-header-text">Account</p></th>
                  <th class="two wide"><p class="table-header-text">Provider</p></th>
                  <th class="two wide"><p class="table-header-text">Package</p></th>
                  <th class="two wide"><p class="table-header-text">Service</p></th>
                  <th class="two wide"><p class="table-header-text">Quota</p></th>
                  <th class="two wide"><p class="table-header-text">Staked</p></th>
                </tr>
              </thead>

              <!--Table Content-->
              <tbody>
                <tr v-for="(account, index) in dspAccounts" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ account.account }}</td>
                  <td>
                    <img
                      v-if="allDspJsons[account.provider] && allDspJsons[account.provider].branding && allDspJsons[account.provider].branding.logo_256"
                      :src="allDspJsons[account.provider].branding.logo_256"
                      @error="e => e.target.src = '/img/smallwhite.jpg'"
                      width="28"
                      height="28"
                      style="vertical-align: middle"
                    />
                    <div v-else style="height: 28px; width: 28px; display: inline-block;vertical-align: middle;">
                    </div>

                    <router-link :to="'/account/' + account.provider">
                      &nbsp; {{ account.provider }}
                    </router-link>
                  </td>
                  <td>{{ account.package }}</td>
                  <td>{{ account.service }}</td>

                  <td>
                    {{ displayNumber(split(account.quota).amount * 10000) }} TXs
                  </td>
                  <td>
                    {{ displayNumberAsAmount(account.balance, 4) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </tab>
        <tab name="Services">
          <div id="table-wrapper" style="padding-top: 30px;" v-if="balanceByService.length">
            <!--Start of Table -->
            <table class="ui selectable very basic unstackable table">
              <!--Table Titles-->
              <thead class="table-header">
                <tr>
                  <th class="one wide"><p class="table-header-text">#</p></th>
                  <th class="two wide"><p class="table-header-text">Service</p></th>
                  <th class="two wide"><p class="table-header-text">Staked</p></th>
                </tr>
              </thead>

              <!--Table Content-->
              <tbody>
                <tr v-for="(service, index) in balanceByService" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ service.service }}</td>
                  <td>{{ displayNumberAsAmount(service.balance, 4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </tab>
      </tabs>
    </div>

    <div style="padding-top: 40px;">
      <h3>
        DAPP Network by &nbsp;
        <a href="https://liquidapps.io" target="_blank" rel="nofollow">
          <img style="vertical-align: middle; cursor: pointer;" height="60" width="300" src="/img/partners/liquidapps.png">
        </a>
      </h3>
    </div>
  </div>
</template>

<!--Vue in page script-->
<script>
import moment from 'moment'
import axios from 'axios'
import JsonTree from 'vue-json-tree'
import { split, parseSeconds, displayAsset, displayNumber, displayNumberAsAsset, displayNumberAsAmount } from '@/numberUtils'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'DSPs',
  components: {
    JsonTree
  },

  data () {
    return {
      dspPackages: [],
      dapphodlBalance: {},
      dappBalance: {},
      stakes: [],
      unstakes: [],
      dappStakes: [],
      dapphodlStakes: [],

      selectedPackageForStaking: undefined,
      selectedPackageJson: undefined,
      selectedPackageDspJson: undefined,
      stakeDappInput: 0,
      stakeDapphodlInput: 0,

      dspFilter: '',
      dspRewards: [],
      dspAccounts: [],
      balanceByService: [],
      showDspJson: false,
      showPackageJson: false,
      allPackageJsons: {},
      allDspJsons: {},

      // More filter
      providerSelectFilter: '*',
      serviceSelectFilter: '*',
      orderSelectFilter: '',
      minimumQuota: '',
      minimumStake: '',
      orderBySelectOptions: [
        { text: 'Order Alphabetically', value: '' },
        { text: 'Order by Min. Stake', value: 'minstake' },
        { text: 'Order by Unstake Time', value: 'unstake' }
      ]
    }
  },

  watch: {
    actor: {
      immediate: true,
      handler: function (newAccount, oldAccount) {
        if (newAccount) {
          this.updateAccount()
        } else {
          this.dappBalance = undefined
          this.dapphodlBalance = undefined
          this.stakes = []
          this.unstakes = []
        }
      }
    },

    success: function (newSuccess, oldSuccess) {
      if (newSuccess) {
        setTimeout(() => {
          this.updateAccount()
        }, 1000)
      }
    }
  },

  computed: {
    ...mapState({
      actor: state => state.user.actor,
      provider: state => state.provider
    }),

    displayPackages () {
      return this.dspPackages.filter(
        pkg =>
          (this.dspFilter === '' ||
          pkg.package_id.indexOf(this.dspFilter) !== -1 ||
          pkg.service.indexOf(this.dspFilter) !== -1 ||
          pkg.provider.indexOf(this.dspFilter) !== -1) &&

          (this.providerSelectFilter === '*' || this.providerSelectFilter === pkg.provider) &&
          (this.serviceSelectFilter === '*' || this.serviceSelectFilter === pkg.service) &&
          (!this.minimumQuota || pkg.quota > this.minimumQuota) &&
          (!this.minimumStake || pkg.min_stake_quantity > this.minimumStake)
      ).sort(
        (b, a) => this.orderSelectFilter === ''
          ? b.provider > a.provider
            ? 1
            : -1
          : this.orderSelectFilter === 'minstake'
            ? b.min_stake_quantity > a.min_stake_quantity
              ? -1
              : 1
            : this.orderSelectFilter === 'unstake'
              ? b.min_unstake_period > a.min_unstake_period
                ? -1
                : 1
              : 0
      )
    },

    providerSelectOptions () {
      const uniqueProviders = Array.from(new Set(
        this.dspPackages.map(pkg => pkg.provider)
      ))
      return [
        { text: 'All Providers', value: '*' },
        ...(uniqueProviders.map(provider => ({ text: provider, value: provider })))
      ]
    },

    serviceSelectOptions () {
      const uniqueServices = Array.from(new Set(
        this.dspPackages.map(pkg => pkg.service)
      ))
      return [
        { text: 'All Services', value: '*' },
        ...(uniqueServices.map(service => ({ text: service, value: service })))
      ]
    },

    claimed () {
      return this.dapphodlBalance && this.dapphodlBalance.claimed === 1
    },

    claimable () {
      return !this.claimed && this.dapphodlBalance && this.dapphodlBalance.allocation
        ? split(this.dapphodlBalance.allocation).amount
        : 0
    },

    dappBalanceNumber () {
      return (this.dappBalance && this.dappBalance.balance && split(this.dappBalance.balance).amount) || 0
    },

    dapphodlBalanceNumber () {
      return (this.dapphodlBalance && this.dapphodlBalance.balance && split(this.dapphodlBalance.balance).amount) || 0
    },

    stakedDapp () {
      const dapphodlStaked = (
        this.dapphodlBalance &&
        this.dapphodlBalance.staked &&
        split(this.dapphodlBalance.staked).amount
      ) || 0

      const dappStaked = (
        this.dappStakes &&
        this.dappStakes.length &&
        this.dappStakes.reduce((acc, stake) => acc + split(stake.balance).amount, 0)
      ) || 0

      return dapphodlStaked + dappStaked
    },

    unstakedDapp () {
      return (this.unstakes &&
              this.unstakes.length &&
              this.unstakes.reduce((acc, unstake) => acc + split(unstake.amount).amount, 0)) || 0
    },

    totalDappStaked () {
      return this.dspRewards &&
             this.dspRewards.length &&
             this.dspRewards.reduce((acc, reward) => acc + reward.dappStakedNumber, 0)
    }
  },

  methods: {
    ...mapActions([
      'LOGIN',
      'LOGOUT',
      'TRANSACT'
    ]),

    split,
    parseSeconds,
    displayNumber,
    displayNumberAsAsset,
    displayNumberAsAmount,
    displayAsset,

    packageToId (pkg) {
      return `${pkg.package_id}-${pkg.provider}-${pkg.service}`
    },

    async selectPackage (pkg, e) {
      this.selectedPackageForStaking = undefined
      this.selectedPackageJson = undefined
      this.selectedPackageDspJson = undefined

      this.stakeDappInput = this.dappBalanceNumber
      this.stakeDapphodlInput = this.dapphodlBalanceNumber

      this.selectedPackageForStaking = pkg

      this.$refs.dappTabs.selectTab('#balance', e)

      this.$nextTick(() => {
        this.$refs.dappTabs.selectTab('#stake', e)
        window.scrollTo(0, 0)
      })

      const existingPkg = this.allPackageJsons[this.packageToId(pkg)]
      if (existingPkg) {
        this.selectedPackageJson = existingPkg
      } else {
        const retrievedPackageJson = await axios.get(pkg.package_json_uri).then(result => result.data).catch(e => ({}))
        if (retrievedPackageJson && typeof retrievedPackageJson !== 'string' && Object.keys(retrievedPackageJson).length) {
          this.allPackageJsons[this.packageToId(pkg)] = retrievedPackageJson
          this.selectedPackageJson = retrievedPackageJson
        }
      }

      if (this.selectedPackageJson) {
        this.selectedPackageDspJson = await axios.get(this.selectedPackageJson.dsp_json_uri).then(result => result.data)
      }
    },

    formatDate (timestamp) {
      return moment.unix(+timestamp / 1000).format('MMM-DD-YYYY, hh:mm:ss A')
    },

    async fetchPackages () {
      this.dspPackages = (await this.$api.getDspPackages())
        .reverse()
        .filter(pkg => pkg.api_endpoint !== '' && pkg.api_endpoint !== 'null')
        .map(pkg => {
          pkg.quota = split(pkg.quota).amount * 10000
          pkg.quotaText = `${displayNumber(pkg.quota)} TXs / ${this.parseSeconds(pkg.package_period)}`
          pkg.min_stake_quantity = split(pkg.min_stake_quantity).amount
          return pkg
        })

      const {
        dspJsonsByProvider,
        dspRewards
      } = await this.$api.getJsonsAndRewards()
      this.allDspJsons = dspJsonsByProvider
      this.dspRewards = dspRewards

      this.dspAccounts = (await this.$api.getDspAccounts())
        .map(quota => {
          quota.balance = split(quota.balance).amount
          return quota
        })
        .sort((a, b) => b.balance - a.balance)

      const balanceByService = {}
      for (const acc of this.dspAccounts) {
        if (!balanceByService[acc.service]) {
          balanceByService[acc.service] = {
            service: acc.service,
            balance: 0
          }
        }

        balanceByService[acc.service].balance += acc.balance
      }
      this.balanceByService = Object.values(balanceByService).sort((a, b) => b.balance - a.balance)
    },

    async updateAccount () {
      // DAPP and DAPPHODL Balances
      this.dapphodlBalance = await this.$api.getDapphodlBalance(this.actor)
      this.dappBalance = await this.$api.getDappBalance(this.actor)

      // DAPP and DAPPHODL Stakes
      this.dappStakes = await this.$api.getDappStakes(this.actor)
      this.dapphodlStakes = await this.$api.getDapphodlStakes(this.actor)
      this.stakes = this.dappStakes.concat(this.dapphodlStakes)

      // Unstakes
      let dappUnstakes = await this.$api.getDappUnstakes(this.actor)
      let dapphodlUnstakes = await this.$api.getDapphodlUnstakes(this.actor)
      this.unstakes = dappUnstakes.concat(dapphodlUnstakes)

      // Get quotas
      // const quotas = await this.$api.getDspAccounts(this.actor)
      // console.log('Quotas:', quotas)
    },

    _refresh () {
      return {
        account: 'dappairhodl1',
        name: 'refresh',
        data: {
          owner: this.actor
        }
      }
    },

    refresh () {
      let actions = [this._refresh()]
      this.TRANSACT(actions)
    },

    unstake (stake) {
      let actions = []

      if (stake.scope === 'dappairhodl1') {
        actions = [{
          account: 'dappairhodl1',
          name: 'unstake',
          data: {
            owner: this.actor,
            provider: stake.provider,
            service: stake.service,
            quantity: stake.balance
          }
        }]
      } else {
        actions = [{
          account: 'dappservices',
          name: 'unstake',
          data: {
            to: this.actor,
            provider: stake.provider,
            service: stake.service,
            quantity: stake.balance
          }
        }]
      }

      if (actions.length) {
        this.TRANSACT(actions)
      }
    },

    _stakeDapp (from, provider, service, quantity) {
      return {
        account: 'dappservices',
        name: 'stake',
        data: {
          from,
          provider,
          service,
          quantity: `${quantity.toFixed(4)} DAPP`
        }
      }
    },
    _stakeDapphodl (owner, provider, service, quantity) {
      return {
        account: 'dappairhodl1',
        name: 'stake',
        data: {
          owner,
          provider,
          service,
          quantity: `${quantity.toFixed(4)} DAPPHDL`
        }
      }
    },
    stake (pkg, dappAmount, dapphodlAmount) {
      if (!dappAmount && !dapphodlAmount) {
        this.$store.commit('wallet/SET_ERROR', `Must stake positive DAPP or DAPPHDL`)
        return
      }

      let actions = [{
        account: 'dappservices',
        name: 'selectpkg',
        data: {
          owner: this.actor,
          provider: pkg.provider,
          service: pkg.service,
          package: pkg.package_id
        }
      }]

      if (dappAmount > 0) {
        actions.push(this._stakeDapp(this.actor, pkg.provider, pkg.service, dappAmount))
      }

      if (dapphodlAmount > 0) {
        actions.push(this._stakeDapphodl(this.actor, pkg.provider, pkg.service, dapphodlAmount))
      }

      this.TRANSACT(actions)
    }
  },

  created () {
    this.fetchPackages()
  }
}
</script>

<!--Vue in page CSS-->
<style scoped>
label {
  min-width: 170px;
  display: inline-block;
}
</style>
