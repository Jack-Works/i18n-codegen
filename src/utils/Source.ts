import { SourceNode, StartOfSourceMap } from 'source-map'

export class Source extends SourceNode {
    static of(...args: (SourceNode | string)[]) {
        return new SourceNode(null, null, null, args)
    }
    addLine(...args: (SourceNode | string)[]) {
        return super.add(args.concat('\n'))
    }
    append(...args: (SourceNode | string)[]) {
        return super.add(args)
    }
    toStringWithInlineSourceMap(startOfSourceMap: StartOfSourceMap | undefined) {
        const x = this.toStringWithSourceMap(startOfSourceMap)

        return (
            x.code +
            '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
            Buffer.from(x.map.toString()).toString('base64')
        )
    }
}
