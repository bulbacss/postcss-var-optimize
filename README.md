# PostCSS Var Optimize

[PostCSS] plugin to optimize css variables usage, it will convert the ones that are declared only once, it will also remove the ones that are redeclared with the same value

[PostCSS]: https://github.com/postcss/postcss

```css
a {
  border: var(--d);
  background: var(--c);
  padding: var(--a);
}

:root {
  --a: 1%;
  --b: calc(var(--a) + 2%);
  --c: hsl(20deg, var(--b), var(--a));
  --d: var(--c) var(--b) var(--a);
}

.theme {
  --b: 3;
}
```

```css
a {
  border: hsl(20deg, var(--b), 1%) var(--b) 1%;
  background: hsl(20deg, var(--b), 1%);
  padding: 1%;
}

:root {
  --b: 3%;
}

.theme {
  --b: 3;
}
```

## Usage

Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you already use PostCSS, add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-var-optimize'),
    require('autoprefixer')
  ]
}
```

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

[official docs]: https://github.com/postcss/postcss#usage

## Options

- `whitelist`: a regex or a string indicating the name of the variables allowed to be optimized away (do not include the --), if set only the matching ones will be optimized
- `blacklist`: a regex or a string indicating the name of the variables disallowed to be optimized away (do not include the --)
