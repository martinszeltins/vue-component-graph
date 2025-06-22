# Nuxt Component Graph

Visualize your Vue component dependency graph as an ASCII tree or interactive HTML view.

## Installation

```bash
# Install locally in your project
npm install @martinszeltins/vue-component-graph

# Or install globally for direct CLI use
npm install -g @martinszeltins/vue-component-graph
```

## Usage

1. As a library (in code)

```javascript
import { generateAsciiTree, generateHtmlTree } from '@martinszeltins/vue-component-graph'

async function run() {
    const ascii = await generateAsciiTree({
        root: '/path/to/your-vue-project',
        entry: 'src/App.vue',
        output: 'ascii'
    })

    console.log(ascii)

    const html = await generateHtmlTree({
        root: '/path/to/your-vue-project',
        entry: 'src/App.vue',
        output: 'html'
    })

    // e.g. write html to file:
    // await fs.promises.writeFile('graph.html', html)
}
```

2. From the CLI

```bash
# If installed locally:
npx @martinszeltins/vue-component-graph --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=ascii

# If installed globally:
vue-component-graph --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=ascii
```


## Options

````
Usage: vue-component-graph [options] <entry>

Generate ASCII or HTML tree of Vue component dependencies.

Arguments:
  entry                   Entry .vue file or directory

Options:
  -r, --root <dir>        Root directory to scan for .vue files  [default: process.cwd()]
  -o, --output <type>     Output format: 'ascii' or 'html'      [default: "ascii"]
  -h, --help              display help for command
````

## Configuration

All you need is:
- A valid Vue project tree under `<root>`, with .vue files.
- An entry component (src/App.vue or any .vue file or directory).

Your graph will include both:
- Imported components (import { MyComp } from './MyComp.vue')
- Static `<MyComp>` tags in template content

## Contributing & Support
- Repo: https://github.com/martinszeltins/vue-component-graph
- Issues: https://github.com/martinszeltins/vue-component-graph/issues
- License: MIT

### ASCII Output
To generate an ASCII representation of the component dependencies, you can run the following command:

```bash
$ npx @martinszeltins/vue-component-graph --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=ascii

MyComponent.vue
├── app-layout.vue
│   ├── order-load-error.vue
│   │   └── support-button.vue
│   ├── support-button.vue
│   ├── page-info-block.vue
│   ├── app-alert.vue
│   ├── customer-support-modal.vue
│   │   └── customer-support-contacts.vue
```

### HTML Output
To generate an HTML representation of the component dependencies, you can run the following command:

```bash
$ npx @martinszeltins/vue-component-graph --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=html
```
