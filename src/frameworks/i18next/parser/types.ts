import type { ParseNode, StringParseNode } from '../../../type.js'
import type { TypeNode } from 'typescript'
import type { Position } from '../../../utils/position.js'

export interface I18NextParseNodeInfo {
    interpolations: Map<string, [position: Position, type: TypeNode, required: boolean]>
    tags: Map<string, Position>
    relatedContexts?: string[]
    comments?: string
}
export interface I18NextParsedFile {
    root: ParseNode<I18NextParseNodeInfo>
    // Map<baseName, Map<pluralName, ParseNode>>
    plurals: Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>
    // Map<baseName, Map<contextName, ParseNode>>
    contexts: Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>
    // Map<baseName, Map<variantName, string>>
    variantList: Map<string, [string, string][]>
}
export type I18NextParseNode = ParseNode<I18NextParseNodeInfo>
export type I18NextParseNode_String = StringParseNode<I18NextParseNodeInfo>
