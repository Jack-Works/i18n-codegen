import { i18nNextParser } from '../../src/parser/i18next'

import { join } from 'path'
import { ParserInput } from '../../src/type'

it('should parse i18next format correctly', () => {
    expect(i18nNextParser(ParserInput.fromFileSystem(join(__dirname, './example.json')))).toMatchSnapshot(
        'i18next-parse-example',
    )
})
