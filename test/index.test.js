const fs = require('fs')
const { resolve } = require('path')
const postcss = require('postcss')

let plugin = require('./../index')

async function run (caseNum, plugins) {
  plugins = plugins || []
  let input = fs.readFileSync(resolve(__dirname, 'input/' + caseNum + '.css'))
  let output = fs.readFileSync(resolve(__dirname, 'output/' + caseNum + '.css'))
  let result = await postcss([plugin(), ...plugins])
    .process(input, { from: undefined })
  expect(result.css).toEqual(output.toString())
  expect(result.warnings()).toHaveLength(0)
}

it('finds variables declared and modified', async () => {
  let opts = { test: {} }
  let css = 'a{ } :root{--a: 1;--b: 2} .theme{--b: 3}'

  await postcss([plugin(opts)]).process(css, { from: undefined })

  expect(Object.keys(opts.test.declared)).toHaveLength(2)
  expect(opts.test.declared.a).toEqual('1')
  expect(opts.test.declared.b).toBeTruthy()
  expect(Object.keys(opts.test.modified)).toHaveLength(1)
  expect(opts.test.modified.b).toBe('3')
})

it('removes the unmodified variables and replace them', async () => {
  await run(1)
})

it('works with nested variables', async () => {
  await run(2)
})

it('works with complex frameworks', async () => {
  await run(3)
  await run(4)
})
