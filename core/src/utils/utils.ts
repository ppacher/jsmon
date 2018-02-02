export function stringify(token: any): string {
  if (typeof token === 'string') {
    return token
  }

  if (token instanceof Array) {
    return '[' + token.map(stringify).join(', ') + ']'
  }

  if (token === null) {
    return '' + token
  }

  if (token.name) {
    return `${token.name}`
  }

  const res = token.toString()

  if (res === null) {
    return '' + res
  }

  const newLine = res.indexOf('\n')
  return newLine === -1 ? res : res.substring(0, newLine)
}

/**
 * Returns true if `value` is "Observable lik"
 */
export function isObservableLike(value: any): boolean {
  if (!('prototype' in value)) {
    console.log('Does not have a prototype')
    return false
  }
  Object.keys(value.prototype).forEach(p => console.log('prototype', p))
  return 'subscribe' in value.prototype
}

/**
 * Returns true if `value` is "Promise-like"
 */
export function isPromiseLike(value: any): boolean {
  if (!('prototype' in value)) {
    return false
  }

  return 'then' in value.prototype && 'catch' in value.prototype
}
