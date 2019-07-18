import axios from 'axios'
import { JsonRpc } from 'eosjs'
import _ from 'lodash'

function thousandSeperator (number) {
  return number.toString().replace(/\B(?=(?=\d*\.)(\d{3})+(?!\d))/g, ',')
}

function thousandSeperatorInteger (number) {
  return number.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

function parseSeconds (us) {
  us = us * 1000000
  let parsedValue = 0
  let parsedText = ''

  if (us < 1000) {
    parsedValue = us
    parsedText = 'µs'
  } else if (us < 1000000) {
    parsedValue = us / 1000
    parsedText = 'ms'
  } else if (us < 60000000) {
    parsedValue = us / 1000000
    parsedText = 's'
  } else if (us < 3600000000) {
    parsedValue = us / 60000000
    parsedText = 'min'
  } else if (us < 3600000000000) {
    parsedValue = us / 3600000000
    parsedText = parsedValue === 1 ? 'hour' : 'hours'
  } else {
    parsedValue = us / 86400000000
    parsedText = 'days'
  }

  return `${thousandSeperator(+parsedValue.toFixed(2))} ${parsedText}`
}

export default class API {
  constructor () {
    this.initialize()
  }

  initialize () {
    this.eos = new JsonRpc('https://eos.eoscafeblock.com', { fetch })
  }

  async getDappStats () {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 1,
        scope: '......2ke1.o4',
        table: 'statext'
      })

      if (!result || !result.rows || !result.rows.length) {
        return {}
      } else {
        return result.rows[0]
      }
    } catch (e) {
      console.log(e)
      return {}
    }
  }

  async getDspPackages () {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 500,
        scope: 'dappservices',
        table: 'package'
      })
      return result && result.rows && result.rows.length
        ? result.rows
        : []
    } catch (e) {
      console.log(e)
      return []
    }
  }

  async getDapphodlBalance (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappairhodl1',
        json: true,
        limit: 1,
        scope: account,
        table: 'accounts'
      })
      return result && result.rows && result.rows.length
        ? result.rows[0]
        : {}
    } catch (e) {
      return {}
    }
  }

  async getDappBalance (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 1,
        scope: account,
        table: 'accounts'
      })
      return result && result.rows && result.rows.length
        ? result.rows[0]
        : {}
    } catch (e) {
      return {}
    }
  }

  async getDappStakes (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 100,
        scope: account,
        table: 'staking'
      })
      return result && result.rows && result.rows.length
        ? result.rows.map(row => {
          row.scope = account
          return row
        })
        : []
    } catch (e) {
      return []
    }
  }

  async getDapphodlStakes (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 1000,
        scope: 'dappairhodl1',
        table: 'staking'
      })
      if (!result) return []

      let rows = result.rows
      if (result.more) {
        rows = rows.concat(await this.getDapphodlStakes(account))
      }

      return rows
        .filter(row => row.account === account)
        .map(row => {
          row.scope = 'dappairhodl1'
          return row
        })
    } catch (e) {
      return []
    }
  }

  async getDappUnstakes (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 100,
        scope: account,
        table: 'refunds'
      })
      return result && result.rows && result.rows.length
        ? result.rows.map(row => {
          row.scope = account
          return row
        })
        : []
    } catch (e) {
      return []
    }
  }

  async getDapphodlUnstakes (account) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 1000,
        scope: 'dappairhodl1',
        table: 'refunds'
      })
      if (!result) return []

      let rows = result.rows
      if (result.more) {
        rows = rows.concat(await this.getDapphodlUnstakes(account))
      }
      return rows
        .filter(row => row.account === account)
        .map(row => {
          row.scope = 'dappairhodl1'
          return row
        })
    } catch (e) {
      return []
    }
  }

  async getTokenSupply (contract, symbol) {
    try {
      const stats = await this.eos.get_currency_stats(contract, symbol)
      let supply = stats[symbol].supply
      let parsedSupply = Number(supply.substring(0, supply.length - 4))
      return parsedSupply
    } catch (err) {
      console.log(err)
    }
  }

  async getDspAccounts (lower_bound = undefined) {
    try {
      const result = await this.eos.get_table_rows({
        code: 'dappservices',
        json: true,
        limit: 500,
        scope: '......2ke1.o4',
        table: 'accountext',
        // eslint-disable-next-line camelcase
        ...(lower_bound && { lower_bound })
      })

      if (!result || !result.rows || !result.rows.length) {
        return []
      }

      if (result.more) {
        const newRows = await this.getDspAccounts(result.rows[result.rows.length - 1].id)
        newRows.shift()
        return result.rows.concat(newRows)
      } else {
        return result.rows
      }
    } catch (e) {
      console.log(e)
      return []
    }
  }

  async getJsonsAndRewards () {
    // 1: Retrieve packages
    let dspPackages = (await this.getDspPackages())
      .reverse()
      .filter(pkg => pkg.api_endpoint !== '' && pkg.api_endpoint !== 'null')
      .map(pkg => {
        pkg.quota = +pkg.quota.split(' ')[0] * 10000
        pkg.quotaText = `${thousandSeperatorInteger(pkg.quota)} TXs / ${parseSeconds(pkg.package_period)}`
        pkg.min_stake_quantity = +pkg.min_stake_quantity.split(' ')[0]
        return pkg
      })

    // 2: Retrieve JSONS for these packages
    let pkgJsons = await Promise.all(
      dspPackages.map(
        async (pkg) => {
          try {
            const result = await axios.get(pkg.package_json_uri)
            return {
              ...pkg,
              data: result.data
            }
          } catch (e) {
            return {}
          }
        }
      )
    )
    pkgJsons = pkgJsons.filter(
      pkgJson => pkgJson &&
                 pkgJson.data &&
                 typeof pkgJson.data !== 'string' &&
                 Object.keys(pkgJson.data).length &&
                 pkgJson.data.dsp_json_uri !== ''
    )
    pkgJsons = _.uniq(pkgJsons, 'provider')

    // 3: Retrieve DSP JSONs
    const dspJsons = await Promise.all(
      pkgJsons.map(
        async (pkg) => {
          try {
            const result = await axios.get(pkg.data.dsp_json_uri)
            return {
              provider: pkg.provider,
              ...result.data
            }
          } catch (e) {
            return {}
          }
        }
      )
    )

    const dspJsonsByProvider = {}
    for (const dspJson of dspJsons) {
      dspJsonsByProvider[dspJson.provider] = dspJson
    }

    // 4: Calculate rewaards by DSP
    const dailyInflation = 0.00007326105
    const dappSupply = await this.getTokenSupply('dappservices', 'DAPP')
    const dailyRewards = dailyInflation * dappSupply

    let { staked } = await this.getDappStats()
    staked = +staked.split(' ')[0]

    const dspAccounts = await this.getDspAccounts()
    let dspRewards = dspAccounts.map(account => {
      account.balance = +account.balance.split(' ')[0]
      return account
    }).reduce((acc, account) => {
      if (!acc[account.provider]) {
        acc[account.provider] = {
          dappStakedNumber: 0,
          users: new Set(),
          packages: 0,
          services: 0
        }
      }

      acc[account.provider]['dappStakedNumber'] += account.balance
      acc[account.provider]['users'].add(account.account)
      return acc
    }, {})

    for (const key in dspRewards) {
      const percentage = dspRewards[key]['dappStakedNumber'] / staked
      dspRewards[key]['provider'] = key
      dspRewards[key]['percentageStaked'] = +((percentage * 100).toFixed(2))
      dspRewards[key]['users'] = Array.from(dspRewards[key]['users']).length
      dspRewards[key]['dailyRewardNumber'] = +(percentage * dailyRewards)
      dspRewards[key]['dailyReward'] = thousandSeperator(+(dspRewards[key]['dailyRewardNumber']).toFixed(4))
      dspRewards[key]['dappStaked'] = thousandSeperator(+dspRewards[key]['dappStakedNumber'].toFixed(4))
      dspRewards[key]['apr'] = (dspRewards[key]['dailyRewardNumber'] * 365) / dspRewards[key]['dappStakedNumber']
    }

    // Add packages and services count
    for (const pkg of dspPackages) {
      dspRewards[pkg.provider]['packages']++
    }

    dspRewards = Object.values(dspRewards).sort(
      (a, b) => b.dappStakedNumber - a.dappStakedNumber
    )

    // FINISHED

    const ctx = {
      dspJsonsByProvider,
      dspRewards
    }

    return ctx
  }
}
