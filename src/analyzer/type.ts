import type { Diagnostic, SourceFile } from 'typescript'
import { TranslateSymbol } from './symbol.js'
import type { ParserInput } from './parser_input.js'
import type { Project } from './project.js'

export { GeneratorList as EmitterList, ParserList } from '../json-schema.js'
export type Parser = (input: ParserInput<any>, namespace: string) => ParsedFile
export interface ParsedFile {
    filename: string
    source_file: SourceFile
    members: TranslateSymbol[]
    namespaces: TranslateSymbol[]
    diagnostics: Diagnostic[]
}
export type Emitter<Options = object> = (
    parsed_file: ParsedFile,
    options: Options,
    project: Project,
    output_base: string
) => EmittedFile
export interface EmittedFile {
    diagnostics: Diagnostic[]
    /** Map<absolute_output_path, content> */
    files: Map<string, string>
}
export enum DiagnosticCode {
    cannot_open_file_0,
    translation_file_should_contain_an_object,
    non_string_value_is_not_supported_yet,
    invalid_json_content,
    file_0_is_not_in_the_project,
    nested_namespace_or_object_generation_is_not_supported_yet,
    string_0_is_defined_multiple_times_in_namespace_1_this_might_be_caused_by_misconfiguration_of_i18n_codegen_or_if_you_really_mean_it_it_might_cause_problem_in_runtime,
    the_parameter_of_nesting_reference_cannot_be_parsed_as_a_valid_json_therefore_the_type_inference_of_this_string_might_be_incorrect,
    the_parameter_of_nesting_reference_must_be_a_json_object_but_found_0,
}
export enum DiagnosticMessage {
    cannot_open_file_0 = 'Cannot open file $0',
    translation_file_should_contain_an_object = 'Translation file should contain an object',
    non_string_value_is_not_supported_yet = 'Non-string value is not supported yet',
    invalid_json_content = 'Invalid JSON content',
    file_0_is_not_in_the_project = 'File "$0" is not in the project',
    nested_namespace_or_object_generation_is_not_supported_yet = 'Nested namespace or object generation is not supported yet',
    string_0_is_defined_multiple_times_in_namespace_1_this_might_be_caused_by_misconfiguration_of_i18n_codegen_or_if_you_really_mean_it_it_might_cause_problem_in_runtime = 'String "$0" is defined multiple times in namespace "$1". This might be caused by misconfiguration of i18n-codegen or if you really mean it, it might cause problem in runtime.',
    the_parameter_of_nesting_reference_cannot_be_parsed_as_a_valid_json_therefore_the_type_inference_of_this_string_might_be_incorrect = 'The parameter of nesting reference cannot be parsed as a valid JSON, therefore the type inference of this string might be incorrect.',
    the_parameter_of_nesting_reference_must_be_a_json_object_but_found_0 = 'The parameter of nesting reference must be a JSON object but found "$0"',
}
