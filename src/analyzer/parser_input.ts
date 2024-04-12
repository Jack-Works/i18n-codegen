import ts, { type JsonObjectExpression, type JsonSourceFile } from 'typescript'

export interface ParserInput<Options> {
    readonly source_file: JsonSourceFile
    readonly original_file: string
    readonly parser_options?: Options
    readonly json_node: JsonObjectExpression
}
export function create_parser_input_from_source_text<T>(file_name: string, content: string, options: T): ParserInput<T> {
    const source_file = ts.parseJsonText(file_name, content)
    const json_node = source_file.statements[0].expression
    return {
        parser_options: options,
        original_file: content,
        source_file,
        json_node
    }
}
