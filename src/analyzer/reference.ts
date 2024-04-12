export class TranslateReference implements TranslateReference {
    /**
     * ns:key.a.b:ns_deep => ['ns', 'key', 'a', 'ns_deep', 'b'] and [true, false, false, true, false]
     */
    reference: string[] = [];
    reference_is_namespace: boolean[] = [];
    /**
     * The parameters that is filled on the reference site. This means two things:
     * - We can emit this parameter when inherit parameters from the referenced key.
     * - We can provide type check for this slot (if the referenced key isn't requiring this slot).
     */
    bound_slot_names: string[] = [];

    push_key_access(name: string) {
        this.reference.push(name);
        this.reference_is_namespace.push(false);
    }
    push_namespace_access(name: string) {
        this.reference.push(name);
        this.reference_is_namespace.push(true);
    }
}
