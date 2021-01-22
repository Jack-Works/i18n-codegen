#!/usr/bin/env node
import yargs from 'yargs'
// @ts-ignore
import { hideBin } from 'yargs/helpers'
import { runCli } from './index'

const argv = yargs(hideBin(process.argv))
    .scriptName('i18n-codegen')
    .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Specify a different configuration file',
        default: './.i18n-codegen.json',
        normalize: true,
    })
    .option('cwd', { type: 'string', description: 'Current working directory' })
    .option('quite', { type: 'boolean', default: false, description: "Don't write to stdout", alias: 'q' })
    .command('gen', 'Generate the i18n files', { watch: { alias: 'w', type: 'boolean' } }).argv

let hasError = false
runCli(argv, (error, config, i, o) => {
    hasError = true
    if (!argv.quite) console.error('Error happened:', error, i, '=>', o, 'with config', config)
})
if (!argv.watch && hasError) process.exit(1)
