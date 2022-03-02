export type Position = [line: number, col: number] | [line: null, col: null]
export function addPosition(a: Position, b: Position): Position {
    if (a[0] === null || b[0] === null) return b
    return [a[0] + b[0], a[1] + b[1]]
}
