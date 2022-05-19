import { readFileSync } from 'fs'
import { SourceFile } from 'typescript'
import { Position } from './utils/position'
import { JSONNode, parseJson } from './utils/parseJSON'
import { dirname, join, relative } from 'path'
import { GeneratorList, ParserList } from './json-schema'

export { GeneratorList, ParserList } from './json-schema'
export interface PluginConfig {
    input: string
    output: string
    parser: ParserList
    generator: GeneratorList
    generatorOptions?: object
    parserOptions?: object
}
export type Parser = (input: ParserInput<any>) => ParseNode<any>
/** Result is a Map<absolute path, file content> */
export type Generator = (input: GeneratorInput<any, any>) => Map<string, GeneratorResult>
export type GeneratorResult = string
export class ParserInput<Options> {
    private constructor(
        public sourceFile: JSONNode,
        public readonly originalFile: string,
        public readonly parserOptions?: Options,
    ) {}
    readonly mockSourceFile: SourceFile = { text: this.originalFile } as any
    static fromFileSystem<T>(path: string, parserOptions?: T) {
        const orig = readFileSync(path, 'utf-8')
        return new ParserInput(parseJson(path, orig), orig, parserOptions)
    }
}
export class GeneratorInput<R extends object, Options> {
    constructor(
        public parseResult: R,
        public inputPath: string,
        public outputBase: string,
        public generatorOptions?: Options,
    ) {}
    relativeToInput(x: string) {
        return join(this.inputPath, x)
    }
    relativeToOutput(x: string) {
        return join(this.outputBase, x)
    }
    get outputRelativePathToInput() {
        return relative(dirname(this.outputBase), this.inputPath).replace(/\\/g, '/')
    }
}
export type StringParseNode<T extends object> = {
    type: 'key'
    position: Position
    value: string
    value_position: Position
} & T
export type MapParseNode<T extends object> = {
    type: 'object'
    position: Position
    items: Map<string, ParseNode<T>>
}
export type ArrayParseNode<T extends object> = {
    type: 'array'
    position: Position
    items: ParseNode<T>[]
}
export type ParseNode<T extends object> = MapParseNode<T> | ArrayParseNode<T> | StringParseNode<T>
