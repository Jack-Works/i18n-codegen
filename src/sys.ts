import { readFileSync as r, writeFileSync as w } from 'fs'
import type { EmittedFile } from './analyzer/type.js'
import type { Diagnostic } from 'typescript'
import { isAbsolute } from 'path'
export const sys = {
    readFile(path: string) {
        try {
            return r(path, 'utf-8')
        } catch (error) {
            return new Error(`Failed to read file ${path}`, { cause: error })
        }
    },
    writeFile(path: string, str: string) {
        return w(path, str, 'utf-8')
    },
}

export function write_emitted_result(result: EmittedFile, error_reporter: (diagnostics: Diagnostic[]) => void) {
    if (result.diagnostics.length) error_reporter(result.diagnostics)
    for (const [file, content] of result.files) {
        if (!isAbsolute(file))
            throw new Error(`Internal error: emitted file should be an absolute path but found ${file}`)
        sys.writeFile(file, content)
    }
}
