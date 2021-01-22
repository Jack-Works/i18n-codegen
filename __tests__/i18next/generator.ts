import { i18NextParser, i18next_reactHooksGenerator } from '../../src/frameworks/i18next'
import { join } from 'path'
import { GeneratorInput, ParserInput } from '../../src/type'
import { toMatchFile } from 'jest-file-snapshot'
expect.extend({ toMatchFile })

it('should generate i18next output correctly', () => {
    const input = join(__dirname, './example.json')
    const parsed = i18NextParser(ParserInput.fromFileSystem(input))
    const out = i18next_reactHooksGenerator(
        new GeneratorInput(parsed, input, join(__dirname, './__file_snapshots__/example')),
    )
    for (const [path, content] of out) {
        expect(content).toMatchFile(path)
    }
})
