# Nuxt Component Graph

A tool to analyze Nuxt components and their dependencies, generating a visual graph of the component structure.

## Usage

````
Options:
  --root <path>        Path to the root of the Nuxt project.
  --output <format>    Output format: 'ascii' or 'html'.
  --help               Show help message.
````

### ASCII Output
To generate an ASCII representation of the component dependencies, you can run the following command:

```bash
$ node ~/Documents/nuxt-analyzer/dist/index.js --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=ascii

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
$ node ~/Documents/nuxt-analyzer/dist/index.js --root /home/projects/nuxt-project /home/projects/nuxt-project/components/MyComponent.vue --output=html
```
