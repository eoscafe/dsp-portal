import numbro from 'numbro'

/**
 * Converts "1000.0000 EOS" to { amount: 1000, symbol: { code: "EOS", precision: 4 }}
 * @param {*} quantity
 */
export function split (quantity) {
  const [amount, code] = quantity.split(' ')
  const precision = (amount.split('.')[1] || []).length

  return {
    amount: +amount,
    symbol: {
      code,
      precision
    }
  }
}

/**
 * Converts 1000 to 1,000.0000
 * @param {*} number
 */
export function displayNumberAsAmount (number, precision = 4, trimMantissa = false) {
  return numbro(number).format({ thousandSeparated: true, mantissa: precision, trimMantissa })
}

/**
 * Converts 1000 to "1,000.0000 EOS"
 * @param {*} number
 */
export function displayNumberAsAsset (number, symbol = 'EOS', precision = 4, trimMantissa = false) {
  const amount = numbro(number).format({ thousandSeparated: true, mantissa: precision, trimMantissa })
  return `${amount} ${symbol}`
}

/**
 * Converts 1000 to 1,000
 * @param {*} number
 */
export function displayNumber (number) {
  return numbro(number).format({ thousandSeparated: true })
}

/**
 * Converts "1000.0000 EOS" to "1,000.0000 EOS"
 * @param {*} asset
 */
export function displayAsset (asset) {
  const { amount, symbol: { code } } = split(asset)
  return `${displayNumber(amount)} ${code}`
}

export function parseSeconds (seconds) {
  let days = 0
  let hours = 0
  let minutes = 0
  let parsedDate = ''

  // Days
  if (seconds > 86400) {
    days += Math.floor(seconds / 86400)
    seconds -= days * 86400
    parsedDate += `${days} ${days === 1 ? 'Day' : 'Days'} `
  }

  // Hours
  if (seconds > 3600) {
    hours += Math.floor(seconds / 3600)
    seconds -= hours * 3600
    parsedDate += `${hours} Hours `
  }

  // Minutes
  if (seconds > 60) {
    minutes += Math.floor(seconds / 60)
    seconds -= minutes * 60
    parsedDate += `${minutes} Minutes `
  }

  // Seconds
  if (seconds > 0) {
    parsedDate += `${seconds} Seconds `
  }

  return parsedDate
}
