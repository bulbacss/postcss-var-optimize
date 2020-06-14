let postcss = require('postcss')
let calc = require('postcss-calc')

module.exports = postcss.plugin('postcss-var-optimize', (opts = { }) => {
  // Work with options here
  let whitelist = opts.whitelist // Regex
  let blacklist = opts.blacklist

  function plugin (root) {
    let declared = {}
    let modified = {}
    let used = {}
    let excludes = {}

    if (opts.excludes) {
      opts.excludes.forEach(v => {
        excludes[v] = true
      })
    }

    if (opts.test) {
      opts.test.declared = opts.test.declared || declared
      opts.test.modified = opts.test.modified || modified
    }

    // Walk trough all css variables
    root.walkDecls(/^--/, decl => {
      let prop = decl.prop.slice(2)

      if (blacklist && prop.match(blacklist)) return

      if (!whitelist || prop.match(whitelist)) {
        if (declared[prop] && declared[prop] !== decl.value) {
          modified[prop] = decl.value
        } else {
          declared[prop] = decl.value
        }
      }
    })

    let unmodified = Object.assign({}, declared)

    Object.keys(modified).forEach(k => delete unmodified[k])

    Object.keys(unmodified).forEach(k => {
      unmodified[k] = replaceVar(unmodified[k], true)
    })

    function replaceVar (val, recurse) {
      let matches = val.matchAll(/var\(--([^)]*)\)/g)
      if (matches) {
        Array.from(matches).forEach(match => {
          used[match[1]] = (used[match[1]] || 0) + 1
          if (unmodified[match[1]] && !excludes[match[1]]) {
            let v = unmodified[match[1]]
            val = val.replace(match[0], recurse ? replaceVar(v, recurse) : v)
          }
        })
      }
      return val
    }

    root.walkDecls(decl => {
      let matches = decl.value.matchAll(/var\(--([^)]*)\)/g)
      if (matches) {
        Array.from(matches).forEach(match => {
          used[match[1]] = (used[match[1]] || 0) + 1
        })
      }
    })

    root.walkDecls(decl => {
      decl.value = replaceVar(decl.value)
    })

    root.walkDecls(/^--/, decl => {
      let prop = decl.prop.slice(2)
      if ((unmodified[prop] || !used[prop]) && !excludes[prop]) {
        decl.remove()
      }
    })

    let values = {}
    root.walkRules(/:root/, rule => {
      rule.walkDecls(/^--/, decl => {
        let prop = decl.prop.slice(2)
        values[prop] = decl.value
      })
    })
    root.walkRules(/^((?!:root).)*$/, rule => {
      rule.walkDecls(/^--/, decl => {
        let prop = decl.prop.slice(2)
        if (values[prop] && values[prop] === decl.value) {
          decl.remove()
        }
      })
    })
  }

  return (root, result) => {
    plugin(root)
    plugin(root) // 2 pass are needed for full minification
    calc()(root, result)
  }
})
