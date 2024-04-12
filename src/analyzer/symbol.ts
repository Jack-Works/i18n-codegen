import type { Node } from 'typescript'
import { TranslateSlot } from './slot.js'
import type { TranslateReference } from './reference.js'

// Checker
// TranslateSymbol and TranslateSlot _does not_ contain cross-file knowledge.
// It only keeps the unresolved references to other symbols.

export class TranslateSymbol {
    constructor(contributed_by: string, key: string, node?: Node, debug_name?: string) {
        this.contributed_by = contributed_by
        this.name = key
        this.node = node
        if (debug_name) this.debugName = debug_name
    }
    /** @internal */
    set debugName(name: string) {
        this[Symbol.toStringTag] = `Symbol (${name})`
    }
    // Namespace
    // A name can contain a translate object (members) or a namespace.
    private namespace: Map<string, TranslateSymbol[]> = new Map()
    private members: Map<string, TranslateSymbol[]> = new Map()
    add_namespace(symbol: TranslateSymbol) {
        if (!this.namespace.has(symbol.name)) this.namespace.set(symbol.name, [])
        this.namespace.get(symbol.name)!.push(symbol)
    }
    add_member(symbol: TranslateSymbol) {
        if (!this.members.has(symbol.name)) this.members.set(symbol.name, [])
        this.members.get(symbol.name)!.push(symbol)
    }
    get_namespace(name: string) {
        return this.namespace.get(name) || []
    }
    get_member(name: string) {
        return this.members.get(name) || []
    }
    get member_names() {
        return new Set(Array.from(this.members.keys()))
    }
    get namespaces(): readonly TranslateSymbol[] {
        return Array.from(this.namespace.values()).flat()
    }
    get all_members(): readonly TranslateSymbol[] {
        return Array.from(this.members.values()).flat()
    }
    // Translate string
    /** Variables used in the parser */
    references: TranslateReference[] = []
    slots: TranslateSlot[] = []
    tags: string[] = []
    string: string | undefined
    contextual_symbol: [symbol: TranslateSymbol, context: string] | undefined
    plural_symbol: [symbol: TranslateSymbol, count: string] | undefined

    // Meta
    /**
     * The file that contributed this symbol. A symbol should only be contributed by one file.
     */
    contributed_by: string
    name: string
    node?: Node;
    /** @internal */
    [Symbol.toStringTag]!: string
}

export function for_each_symbol_child(
    symbol: TranslateSymbol,
    current_path: readonly string[],
    current_path_is_namespace: readonly boolean[],
    callback: (
        type: 'member' | 'namespace',
        symbol: TranslateSymbol,
        path: string[],
        path_is_namespace: boolean[],
    ) => void,
) {
    for (const member of symbol.all_members) {
        callback('member', member, current_path.concat(member.name), current_path_is_namespace.concat(false))
    }
    for (const namespace of symbol.namespaces) {
        callback('namespace', namespace, current_path.concat(namespace.name), current_path_is_namespace.concat(true))
    }
}
