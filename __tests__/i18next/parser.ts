import { i18next_parser } from '../../src/frameworks/i18next/index.js'
import { it, expect } from 'vitest'

import { join } from 'path'
import { Project } from '../../src/analyzer/project.js'
import { GeneratorList, ParserList } from '../../src/json-schema.js'
import { sys } from '../../src/sys.js'
import '../formatter.js'

it('should parse i18next format correctly', () => {
    const p = new Project()
    p.add_file_from_content(
        {
            generator: GeneratorList.i18next_reactHooks,
            parser: ParserList.i18next,
        },
        'input.json',
        sys.readFile(join(__dirname, './example.json')),
    )

    const file = p.parsed_files.get('input.json')
    file?.diagnostics.map((x) => (x.file = undefined))
    expect(file).matchSnapshot()
})
