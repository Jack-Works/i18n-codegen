import ts from 'typescript'
import { DiagnosticCode, DiagnosticMessage, type ParsedFile } from './type.js'

export function create_parsed_file_missing(filename: string, error: Error): ParsedFile {
    return {
        filename,
        members: [],
        namespaces: [],
        diagnostics: [
            {
                category: ts.DiagnosticCategory.Error,
                code: DiagnosticCode.cannot_open_file_0,
                messageText: format_diagnostic_message(DiagnosticMessage.cannot_open_file_0, filename),
                file: undefined,
                start: undefined,
                length: undefined,
            },
        ],
    }
}
export function format_diagnostic_message(message: string, a: string) {
    return message.replace('$0', a)
}
