import { i18NextParser } from '../../src/frameworks/i18next'
import { it, expect } from '@jest/globals'

import { join } from 'path'
import { ParserInput } from '../../src/type'

it('should parse i18next format correctly', () => {
    expect(i18NextParser(ParserInput.fromFileSystem(join(__dirname, './example.json')))).toMatchSnapshot(
        'i18next-parse-example',
    )
})
