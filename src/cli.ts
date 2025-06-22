#!/usr/bin/env node
import { program } from 'commander'
import { generateAsciiTree, generateHtmlTree, Options } from './index.js'

program
    .name('vue-component-graph')
    .description('Generate ASCII or HTML tree of Vue component dependencies')
    .option('-r, --root <dir>', 'root directory to scan for .vue files', process.cwd())
    .option('-o, --output <type>', 'ascii or html', 'ascii')
    .argument('<entry>', 'entry .vue file or directory')
    .action(async (entry, opts: { root: string; output: 'ascii' | 'html' }) => {
        const params: Options = {
            root: opts.root,
            entry,
            output: opts.output
        }
        let result: string
        if (opts.output === 'html') {
            result = await generateHtmlTree(params)
        } else {
            result = await generateAsciiTree(params)
        }
        process.stdout.write(result)
    })
    .parse()
