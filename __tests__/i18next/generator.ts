import { i18nNextParser } from '../../src/parser/i18next'
import { i18next_reactHooksGenerator } from '../../src/generator/i18next/react-hooks'
import { join } from 'path'
import { GeneratorInput, ParserInput } from '../../src/type'
import { toMatchFile } from 'jest-file-snapshot'
expect.extend({ toMatchFile })

it('should generate i18next output correctly', () => {
    const input = join(__dirname, './example.json')
    const parsed = i18nNextParser(ParserInput.fromFileSystem(input))
    const out = i18next_reactHooksGenerator(
        new GeneratorInput(parsed, input, join(__dirname, './__file_snapshots__/example')),
    )
    for (const [path, content] of out) {
        expect(content).toMatchFile(path)
    }
})
