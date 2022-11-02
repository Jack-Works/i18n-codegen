import { readFileSync } from 'fs'
import type { ExpressionStatement, JsonSourceFile } from 'typescript'
import type { Position } from './utils/position.js'
import type { JSONNode } from './utils/parseJSON.js'
import { dirname, join, relative } from 'path'
import type { GeneratorList, ParserList } from './json-schema.js'
import ts from 'typescript'

export { GeneratorList, ParserList } from './json-schema.js'
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
        public sourceFile: JsonSourceFile,
        public readonly originalFile: string,
        public readonly parserOptions?: Options,
    ) {
        this.jsonNode = (this.sourceFile.getChildAt(0).getChildAt(0) as ExpressionStatement).expression as JSONNode
    }
    readonly jsonNode: JSONNode
    static fromFileSystem<T>(path: string, parserOptions?: T) {
        const orig = readFileSync(path, 'utf-8')
        return new ParserInput(ts.parseJsonText(path, orig), orig, parserOptions)
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
