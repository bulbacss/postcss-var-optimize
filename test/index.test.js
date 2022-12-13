const fs = require('fs')
const { resolve } = require('path')
const postcss = require('postcss')

let plugin = require('./../index')

// eslint-disable-next-line no-extend-native
RegExp.prototype.toJSON = RegExp.prototype.toString;

async function run (file, options = {}, useSnapshot = false) {
  let input = fs.readFileSync(resolve(__dirname, 'input/' + file + '.css'))
  let result = await postcss([plugin(options)])
    .process(input, { from: undefined })
  if (useSnapshot) {
    expect(result.css).toMatchSnapshot(file + ' ' + JSON.stringify(options))
    expect(result.warnings()).toHaveLength(0)
  } else if (fs.existsSync(resolve(__dirname, 'output/' + file + '.css'))) {
    let output = fs.readFileSync(resolve(__dirname, 'output/' + file + '.css'))
    expect(result.css).toEqual(output.toString())
    expect(result.warnings()).toHaveLength(0)
  } else {
    fs.writeFileSync(resolve(__dirname, 'output/' + file + '.css'), result.css)
  }
}

describe('internal workings', () => {
  it('finds variables declared and modified', async () => {
    let opts = {test: {}}
    let css = 'a{ } :root{--a: 1;--b: 2} .theme{--b: 3}'

    await postcss([plugin(opts)]).process(css, {from: undefined})

    expect(Object.keys(opts.test.declared)).toHaveLength(2)
    expect(opts.test.declared.a).toEqual('1')
    expect(opts.test.declared.b).toBeTruthy()
    expect(Object.keys(opts.test.modified)).toHaveLength(1)
    expect(opts.test.modified.b).toBe('2')
  })
});

describe('simple test cases', () => {
  it('removes the unmodified variables and replace them', async () => {
    await run('simple-theme')
  })

  it('works with nested variables', async () => {
    await run('theme-with-nested-variables')
  })
});

describe('options', () => {
  it('uses whitelist', async () => {
    await run('simple-theme', {
      whitelist: ['a', /^b$/]
    }, true)
    await run('theme-with-nested-variables', {
      whitelist: /^b|c$/
    }, true)
  })

  it('uses blacklist', async () => {
    await run('simple-theme', {
      blacklist: ['a', /^b$/]
    }, true)
    await run('theme-with-nested-variables', {
      blacklist: /^b|c$/
    }, true)
  })
})

describe('advanced test cases', () => {
  it ('removes everything in a file without customisation', async () => {
    await run('bulma-no-theme')
  })
  it('works with complex frameworks', async () => {
    await run('bulma-with-theme')
  })
});
