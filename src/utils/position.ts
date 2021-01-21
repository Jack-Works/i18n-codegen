export type Position = [line: number, col: number]
export function addPosition(a: Position, b: Position): Position {
    return [a[0] + b[0], a[1] + b[1]]
}
