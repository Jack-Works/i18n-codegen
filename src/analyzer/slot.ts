import type { TypeNode } from 'typescript';

/**
 * A TranslateSlot is the interpolation name used by a translation string.
 * For example, "string {{ x.name }}" means the string need a slot named "x" with a property named "name" on it.
 *
 * This information is collected to generate the correct TypeScript type of the slot.
 */

export class TranslateSlot {
    constructor(key: string[]) {
        this.key = key;
    }
    // x.name => ['x', 'name']
    key: string[];
    // {{ x, datetime }} => Date (in TypeScript). This type will be merged with other properties used on the same object.
    type: TypeNode | undefined;
    optional?: boolean;
}
