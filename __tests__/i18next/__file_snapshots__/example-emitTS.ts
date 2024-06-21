// @ts-nocheck
/* eslint-disable */
import { createElement, useMemo, type ComponentType, type JSX } from "react";
import { useTranslation, Trans, type TransProps } from "react-i18next";
type TypedTransProps<Value, Components, Context extends string | undefined = undefined> = Omit<TransProps<string, never, never, Context>, "values" | "ns" | "i18nKey"> & ({} extends Value ? {} : {
    values: Value;
}) & {
    components: Components;
};
function createProxy(initValue: (key: string) => any) {
    function define(key: string) {
        const value = initValue(key);
        Object.defineProperty(container, key, { value, configurable: true });
        return value;
    }
    const container = {
        __proto__: new Proxy({ __proto__: null }, {
            get(_, key) {
                if (typeof key === "symbol")
                    return undefined;
                return define(key);
            }
        })
    };
    return new Proxy(container, {
        getPrototypeOf: () => null,
        setPrototypeOf: (_, v) => v === null,
        getOwnPropertyDescriptor: (_, key) => {
            if (typeof key === "symbol")
                return undefined;
            if (!(key in container))
                define(key);
            return Object.getOwnPropertyDescriptor(container, key);
        }
    });
}
export function useTypedTranslation(): {
    /**
      * `this is a normal key`
      */
    normal(): string;
    /**
      * `I am {{firstName}}`
      */
    introprolation(options: {
        readonly firstName: string;
    }): string;
    /**
      * `I am {{firstName}} {{lastName}}`
      */
    introprolationsSimple(options: Readonly<{
        firstName: string;
        lastName: string;
    }>): string;
    /**
      * `I am {{author.name.first}} {{author.name.last}}`
      */
    introprolationsComplex(options: {
        readonly author: {
            readonly name: Readonly<{
                first: string;
                last: string;
            }>;
        };
    }): string;
    /**
      * `I am {{author.name}} {{author}}`
      */
    introprolationsMixed(options: {
        readonly author: string & {
            readonly name: string;
        };
    }): string;
    /**
      * `dangerous {{- var}}`
      */
    unescaped(options: {
        readonly var: string;
    }): string;
    /**
      * `The number is {{date, number}}`
      */
    formattedNumber(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `The current date is {{date, datetime}}`
      */
    formattedDate(options: {
        readonly date: Date;
    }): string;
    /**
      * `Lorem {{val, relativetime(quarter)}}`
      */
    formattedDate2(options: {
        readonly val: string | number | bigint;
    }): string;
    /**
      * `It costs {{date, currency(USD)}}`
      */
    formattedCurrency(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `A list of {{val, list}}`
      */
    formattedList(options: {
        readonly val: readonly string[];
    }): string;
    /**
      * `No box`
      */
    box_zero(): string;
    /**
      * `1 box`
      */
    box_one(): string;
    /**
      * `{{count}} boxes`
      */
    box_other(options: {
        readonly count: string;
    }): string;
    /**
      * `1 orange box`
      */
    box_orange_one(): string;
    /**
      * `{{count}} orange boxes`
      */
    box_orange_other(options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `1 blue box`
      */
    box_blue_one(): string;
    /**
      * `{{count}} blue boxes`
      */
    box_blue_other(options: {
        readonly count: (string | number | bigint) & (string | number | bigint);
    }): string;
    /**
      * `{{x.data}}`
    
      * - mergeProps_other: `{{x.data2}}`
      */
    mergeProps(options: Readonly<{
        x: {
            readonly data: string;
        } & {
            readonly data2: string;
        };
        count?: string | number | bigint;
    }>): string;
    /**
      * `{{x.data2}}`
      */
    mergeProps_other(options: {
        readonly x: {
            readonly data2: string;
        };
    }): string;
    /**
      * - box_zero: `No box`
    
      * - box_one: `1 box`
    
      * - box_other: `{{count}} boxes`
    
      * - box_orange_one: `1 orange box`
    
      * - box_orange_other: `{{count}} orange boxes`
    
      * - box_blue_one: `1 blue box`
    
      * - box_blue_other: `{{count}} blue boxes`
      */
    box(options: Readonly<{
        count?: string | number | bigint;
        context?: "orange" | "blue";
    }>): string;
} { const { t } = useTranslation(); return useMemo(() => createProxy((key) => t.bind(null, key)), [t]); }
function createComponent(i18nKey: string) {
    return (props) => createElement(Trans, { i18nKey, ...props });
}
export const TypedTrans: {
    /**
      * `<i>hi</i>`
      */
    htmlTag: ComponentType<TypedTransProps<Readonly<{}>, {
        i: JSX.Element;
    }>>;
} = /*#__PURE__*/ createProxy(createComponent);
