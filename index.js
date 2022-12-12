let Calc = require('postcss-calc')

const plugin = (opts = {}) => {
  // Work with options here
  const whitelist = opts.whitelist // Regex
  const blacklist = opts.blacklist

  const declared = {}
  const modified = {}
  const used = {}
  const excludes = {}
  const values = {}

  if (opts.excludes) {
    opts.excludes.forEach(v => {
      excludes[v] = true
    })
  }

  if (opts.test) {
    opts.test.declared = declared
    opts.test.modified = modified
  }


  function wasUsed(key) {
    used[key] = (used[key] || 0) + 1
  }

  function interpolate(value, useModified = false) {
    return value.replaceAll(/var\(--([^)]*)\)/g, (match, key) => {
      wasUsed(key);
      if (useModified) {
       return !(key in modified) && !excludes[key] && key in declared ? interpolate(declared[key], useModified) : match
      }
      return !excludes[key] && key in declared ? interpolate(declared[key], useModified) : match
    })
  }

  return {
    postcssPlugin: 'postcss-var-optimize',

    OnceExit(root, args) {
      new Calc().OnceExit(root, args)
    },
    Once(root) {
      // Warmup variables map
      root.walkDecls(/^--/, (decl) => {
        declared[decl.prop.slice(2)] = decl.value
      });
      root.walkDecls((decl) => {
        // Walk trough all css variables
        if (decl.prop.startsWith('--')) {
          const prop = decl.prop.slice(2)

          if (blacklist && prop.match(blacklist)) return

          if (!whitelist || prop.match(whitelist)) {
            const value = interpolate(decl.value)
            if (interpolate(declared[prop]) !== value) {
              modified[prop] = value
            }
          }
        }

        let matches = decl.value.matchAll(/var\(--([^)]*)\)/g)
        if (matches) {
          Array.from(matches).forEach(match => {
            wasUsed(match[1]);
          })
        }
      });

      root.walkRules(/:root/, rule => {
        rule.walkDecls(/^--/, decl => {
          const prop = decl.prop.slice(2)
          values[prop] = decl.value
        })
      })
    },
    Declaration(decl) {
      if (decl.prop.startsWith('--')) {
        const prop = decl.prop.slice(2)
        if ((!(prop in modified) || !(prop in used)) && !excludes[prop]) {
          decl.remove()
          return;
        }
      }

      decl.value = interpolate(decl.value, true)
    },
    AtRule(rule) {
      if (!rule.name.startsWith(':root')) {
        rule.walkDecls(/^--/, decl => {
          const prop = decl.prop.slice(2)
          // Remove duplicate variable declarations
          if (values[prop] && values[prop] === decl.value) {
            decl.remove()
          }
        })
      }
    }
  }
}
plugin.postcss = true

module.exports = plugin
