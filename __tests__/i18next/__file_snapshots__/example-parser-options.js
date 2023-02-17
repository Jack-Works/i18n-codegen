/* eslint-disable */
import { createElement, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
export function useMyHooks() {
    const { t } = useTranslation("my.namespace");
    return useMemo(() => ({
        normal: () => t("normal"),
        introprolation: x => t("introprolation", x),
        introprolations_simple: x => t("introprolations_simple", x),
        introprolations_complex: x => t("introprolations_complex", x),
        introprolations_mixed: x => t("introprolations_mixed", x),
        unescaped: x => t("unescaped", x),
        formatted_number: x => t("formatted_number", x),
        formatted_Date: x => t("formatted_Date", x),
        formatted_Date2: x => t("formatted_Date2", x),
        formatted_currency: x => t("formatted_currency", x),
        formatted_list: x => t("formatted_list", x),
        ["box@zero"]: () => t("box@zero"),
        ["box@one"]: () => t("box@one"),
        ["box@other"]: x => t("box@other", x),
        ["box@orange@one"]: () => t("box@orange@one"),
        ["box@orange@other"]: x => t("box@orange@other", x),
        ["box@blue@one"]: () => t("box@blue@one"),
        ["box@blue@other"]: x => t("box@blue@other", x),
        merge_props: x => t("merge_props", x),
        ["merge_props@other"]: x => t("merge_props@other", x),
        box: x => t("box", x)
    }), [t]);
}
function createComponent(i18nKey) {
    return (props) => createElement(Trans, Object.assign({ i18nKey, ns: "my.namespace", shouldUnescape: true }, props));
}
export const TypedMyTrans = {
    html_tag: /*#__PURE__*/ createComponent("html_tag")
};
