import { expect } from "vitest"

import ts from 'typescript'

const ts_printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    omitTrailingSemicolon: false,
    removeComments: true,
})
expect.addSnapshotSerializer({
    serialize(val, config, indentation, depth, refs, printer) {
        if (ts.isTypeNode(val)) {
            return `"${ts_printer.printNode(ts.EmitHint.Unspecified, val, val.getSourceFile())}"`
        }
        return `${ts.SyntaxKind[val.kind]} { ... }`
    },

    test(val) {
        return val && Object.prototype.hasOwnProperty.call(val, 'kind')
    },
})
