export function formatTelegramMarkdownV2Messages(text: string) {
  const escape = /[_*[\]()~`>#+\-=|{}.!]/
  const replaceEscape = /[~>+=|.!]/
  const doubleEscape = /[`_*]/
  const bracketsEscape = /[{}[\]()]/

  // 以换行符分割字符串
  const strArr = text.split('\n')

  // ? not support table(|) and newline code(```)
  for (const [rowIndex, rawStr] of strArr.entries()) {
    const stack: string[] = []
    const indexes: number[] = []
    // 处理特殊字符 * 与连续的 #, 如 **bold**, 一般都是由两个*组成的
    let rawArr = rawStr.replace(/\*{2}|#{2,}\s/g, match => match?.[0] ?? '').split('')

    for (const [i, char] of rawArr.entries()) {
      // 跳过不需要转义的字符
      if (!escape.test(char))
        continue
      // 跳过已转义的字符
      if (rawArr[i - 1] === '\\')
        continue

      // 处理特殊字符 #
      if (char === '#') {
        if (i === 0) {
          rawArr = ['*', formatTelegramMarkdownV2Messages(rawArr.slice(rawArr[i + 1] === ' ' ? 2 : 1).join('')), '*']
          break
        }
        rawArr[i] = '\\#'
      }

      // 处理特殊字符 -, 格式化后续的空格
      if (char === '-') {
        if (rawArr[i + 1] === ' ' && i === 0) {
          rawArr[i] = ''
          rawArr[i + 1] = ''
        }
        else {
          rawArr[i] = '\\-'
        }
        continue
      }

      // 处理需要直接替换的字符
      if (replaceEscape.test(char)) {
        // 开头的 > 无需转义
        if (i === 0 && char === '>')
          continue
        rawArr[i] = `\\${char}`
        continue
      }

      // 处理需要双重转义的字符
      if (doubleEscape.test(char)) {
        if (stack.at(-1) === char) {
          stack.pop()
          indexes.pop()
        }
        else {
          stack.push(char)
          indexes.push(i)
        }
        continue
      }

      // 处理括号, 非链接形式的括号都需要转义, 先收集再转义
      if (bracketsEscape.test(char)) {
        stack.push(char)
        indexes.push(i)
        continue
      }
    }

    // 检查括号是否匹配
    let start = 0
    for (const [i, char] of stack.entries()) {
      if (char === '[') {
        start = i
      }
      else if (char === ')' && i - start === 3) {
        for (let j = start; j <= i; j++) {
          indexes[j] = -1
        }
      }
    }

    // 转义非法字符
    for (const i of indexes) {
      if (i === -1)
        continue
      rawArr[i] = `\\${rawArr[i]}`
    }

    strArr[rowIndex] = rawArr.join('')
  }

  return strArr.join('\n')
}
