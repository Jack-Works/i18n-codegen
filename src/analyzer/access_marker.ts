import type { TypeNode } from "typescript"

export class AccessMarker {
    #mark: T = Object.create(null)

    mark_type(path: string[], type: TypeNode) {
        let node = this.#mark
        for (const key of path) {
            if (!node[key]) {
                node[key] = Object.create(null)
            }
            node = node[key]!
        }
        if (!node[symbol]) {
            node[symbol] = new Set()
        }
        node[symbol].add(type)
    }
    get_type(path: string[]) {
        let node = this.#mark
        for (const key of path) {
            if (!node[key]) {
                return undefined
            }
            node = node[key]!
        }
        return node[symbol]
    }
}

const symbol = Symbol('type')
type T = {
    [key: string]: T | undefined
    [symbol]: Set<TypeNode> | undefined
}
