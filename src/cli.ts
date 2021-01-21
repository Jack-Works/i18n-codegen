#!/usr/bin/env node
import yargs from 'yargs'
// @ts-ignore
import { hideBin } from 'yargs/helpers'
import { runCli } from './index'

yargs(hideBin(process.argv))
    .scriptName('i18n-codegen')
    .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Specify a different configuration file',
        default: './.i18n-codegen.json',
    })
    .option('cwd', {
        type: 'string',
        description: 'Current working directory',
    })
    .option('watch', {
        alias: 'w',
        type: 'string',
        description: 'Current working directory',
    })
    .command(
        'gen',
        'Generate the i18n files',
        (yargs) => {
            yargs.positional('watch', {
                describe: 'watch mode',
                default: false,
                alias: 'w',
            })
        },
        runCli,
    ).argv
