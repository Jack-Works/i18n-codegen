import { i18NextParser, i18next_reactHooksGenerator } from '../../src/frameworks/i18next/index.js'
import { join } from 'path'
import { GeneratorInput, ParserInput } from '../../src/type.js'
import { toMatchFile } from 'jest-file-snapshot'
import { it, expect } from 'vitest'
import type { Parser_I18NextConfig } from '../../src/index.js'

expect.extend({ toMatchFile })

it('should generate default i18next output correctly', () => {
    const input = join(__dirname, './example.json')
    const parsed = i18NextParser(ParserInput.fromFileSystem(input))
    const out = i18next_reactHooksGenerator(
        new GeneratorInput(parsed, input, join(__dirname, './__file_snapshots__/example')),
    )
    for (const [path, content] of out) {
        expect(content).toMatchFile(path)
    }
})

it('should generate i18next output correctly, with options', () => {
    const input = join(__dirname, './example-parser-options.json')
    const parsed = i18NextParser(
        ParserInput.fromFileSystem<Parser_I18NextConfig>(input, { contextSeparator: '@', pluralSeparator: '@' }),
    )
    const out = i18next_reactHooksGenerator(
        new GeneratorInput(parsed, input, join(__dirname, './__file_snapshots__/example-parser-options'), {
            es6Proxy: false,
            hooks: 'useMyHooks',
            namespace: 'my.namespace',
            trans: 'TypedMyTrans',
        }),
    )
    for (const [path, content] of out) {
        expect(content).toMatchFile(path)
    }
})

it('should generate i18next output correctly, with emitTS', () => {
    const input = join(__dirname, './example.json')
    const parsed = i18NextParser(ParserInput.fromFileSystem(input))
    const out = i18next_reactHooksGenerator(
        new GeneratorInput(parsed, input, join(__dirname, './__file_snapshots__/example-emitTS'), { emitTS: true }),
    )
    for (const [path, content] of out) {
        expect(content).toMatchFile(path)
    }
})
