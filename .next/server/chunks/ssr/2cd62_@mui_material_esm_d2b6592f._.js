module.exports = {

"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "alignProperty": (()=>alignProperty),
    "convertLength": (()=>convertLength),
    "fontGrid": (()=>fontGrid),
    "getUnit": (()=>getUnit),
    "isUnitless": (()=>isUnitless),
    "responsiveProperty": (()=>responsiveProperty),
    "toUnitless": (()=>toUnitless)
});
function isUnitless(value) {
    return String(parseFloat(value)).length === String(value).length;
}
function getUnit(input) {
    return String(input).match(/[\d.\-+]*\s*(.*)/)[1] || '';
}
function toUnitless(length) {
    return parseFloat(length);
}
function convertLength(baseFontSize) {
    return (length, toUnit)=>{
        const fromUnit = getUnit(length);
        // Optimize for cases where `from` and `to` units are accidentally the same.
        if (fromUnit === toUnit) {
            return length;
        }
        // Convert input length to pixels.
        let pxLength = toUnitless(length);
        if (fromUnit !== 'px') {
            if (fromUnit === 'em') {
                pxLength = toUnitless(length) * toUnitless(baseFontSize);
            } else if (fromUnit === 'rem') {
                pxLength = toUnitless(length) * toUnitless(baseFontSize);
            }
        }
        // Convert length in pixels to the output unit
        let outputLength = pxLength;
        if (toUnit !== 'px') {
            if (toUnit === 'em') {
                outputLength = pxLength / toUnitless(baseFontSize);
            } else if (toUnit === 'rem') {
                outputLength = pxLength / toUnitless(baseFontSize);
            } else {
                return length;
            }
        }
        return parseFloat(outputLength.toFixed(5)) + toUnit;
    };
}
function alignProperty({ size, grid }) {
    const sizeBelow = size - size % grid;
    const sizeAbove = sizeBelow + grid;
    return size - sizeBelow < sizeAbove - size ? sizeBelow : sizeAbove;
}
function fontGrid({ lineHeight, pixels, htmlFontSize }) {
    return pixels / (lineHeight * htmlFontSize);
}
function responsiveProperty({ cssProperty, min, max, unit = 'rem', breakpoints = [
    600,
    900,
    1200
], transform = null }) {
    const output = {
        [cssProperty]: `${min}${unit}`
    };
    const factor = (max - min) / breakpoints[breakpoints.length - 1];
    breakpoints.forEach((breakpoint)=>{
        let value = min + factor * breakpoint;
        if (transform !== null) {
            value = transform(value);
        }
        output[`@media (min-width:${breakpoint}px)`] = {
            [cssProperty]: `${Math.round(value * 10000) / 10000}${unit}`
        };
    });
    return output;
}
}}),
"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript) <export getUnit as unstable_getUnit>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "unstable_getUnit": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnit"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript)");
}}),
"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript) <export toUnitless as unstable_toUnitless>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "unstable_toUnitless": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toUnitless"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript)");
}}),
"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/Skeleton/skeletonClasses.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__),
    "getSkeletonUtilityClass": (()=>getSkeletonUtilityClass)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$generateUtilityClasses$2f$generateUtilityClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+utils@7.1.1_@types+react@19.1.8_react@19.1.0/node_modules/@mui/utils/esm/generateUtilityClasses/generateUtilityClasses.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$generateUtilityClass$2f$generateUtilityClass$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+utils@7.1.1_@types+react@19.1.8_react@19.1.0/node_modules/@mui/utils/esm/generateUtilityClass/generateUtilityClass.js [app-ssr] (ecmascript)");
;
;
function getSkeletonUtilityClass(slot) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$generateUtilityClass$2f$generateUtilityClass$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])('MuiSkeleton', slot);
}
const skeletonClasses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$generateUtilityClasses$2f$generateUtilityClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])('MuiSkeleton', [
    'root',
    'text',
    'rectangular',
    'rounded',
    'circular',
    'pulse',
    'wave',
    'withChildren',
    'fitContent',
    'heightAuto'
]);
const __TURBOPACK__default__export__ = skeletonClasses;
}}),
"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/Skeleton/Skeleton.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$composeClasses$2f$composeClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+utils@7.1.1_@types+react@19.1.8_react@19.1.0/node_modules/@mui/utils/esm/composeClasses/composeClasses.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$system$40$7$2e$1$2e$1_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$sty_b32eef80901a0649c3aab998a7f5a52a$2f$node_modules$2f40$mui$2f$system$2f$esm$2f$colorManipulator$2f$colorManipulator$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+system@7.1.1_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+sty_b32eef80901a0649c3aab998a7f5a52a/node_modules/@mui/system/esm/colorManipulator/colorManipulator.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__getUnit__as__unstable_getUnit$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript) <export getUnit as unstable_getUnit>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__toUnitless__as__unstable_toUnitless$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/cssUtils.js [app-ssr] (ecmascript) <export toUnitless as unstable_toUnitless>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$emotion$2f$react$2f$dist$2f$emotion$2d$react$2e$development$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0/node_modules/@emotion/react/dist/emotion-react.development.esm.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$styled$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__styled$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/styles/styled.js [app-ssr] (ecmascript) <locals> <export default as styled>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$utils$2f$memoTheme$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/utils/memoTheme.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DefaultPropsProvider$2f$DefaultPropsProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/DefaultPropsProvider/DefaultPropsProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Skeleton$2f$skeletonClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/Skeleton/skeletonClasses.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
const useUtilityClasses = (ownerState)=>{
    const { classes, variant, animation, hasChildren, width, height } = ownerState;
    const slots = {
        root: [
            'root',
            variant,
            animation,
            hasChildren && 'withChildren',
            hasChildren && !width && 'fitContent',
            hasChildren && !height && 'heightAuto'
        ]
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$utils$40$7$2e$1$2e$1_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$mui$2f$utils$2f$esm$2f$composeClasses$2f$composeClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(slots, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Skeleton$2f$skeletonClasses$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSkeletonUtilityClass"], classes);
};
const pulseKeyframe = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$emotion$2f$react$2f$dist$2f$emotion$2d$react$2e$development$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["keyframes"]`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`;
const waveKeyframe = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$emotion$2f$react$2f$dist$2f$emotion$2d$react$2e$development$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["keyframes"]`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`;
// This implementation is for supporting both Styled-components v4+ and Pigment CSS.
// A global animation has to be created here for Styled-components v4+ (https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/errors.md#12).
// which can be done by checking typeof indeterminate1Keyframe !== 'string' (at runtime, Pigment CSS transform keyframes`` to a string).
const pulseAnimation = typeof pulseKeyframe !== 'string' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$emotion$2f$react$2f$dist$2f$emotion$2d$react$2e$development$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["css"]`
        animation: ${pulseKeyframe} 2s ease-in-out 0.5s infinite;
      ` : null;
const waveAnimation = typeof waveKeyframe !== 'string' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0$2f$node_modules$2f40$emotion$2f$react$2f$dist$2f$emotion$2d$react$2e$development$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["css"]`
        &::after {
          animation: ${waveKeyframe} 2s linear 0.5s infinite;
        }
      ` : null;
const SkeletonRoot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$styled$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__styled$3e$__["styled"])('span', {
    name: 'MuiSkeleton',
    slot: 'Root',
    overridesResolver: (props, styles)=>{
        const { ownerState } = props;
        return [
            styles.root,
            styles[ownerState.variant],
            ownerState.animation !== false && styles[ownerState.animation],
            ownerState.hasChildren && styles.withChildren,
            ownerState.hasChildren && !ownerState.width && styles.fitContent,
            ownerState.hasChildren && !ownerState.height && styles.heightAuto
        ];
    }
})((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$utils$2f$memoTheme$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(({ theme })=>{
    const radiusUnit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__getUnit__as__unstable_getUnit$3e$__["unstable_getUnit"])(theme.shape.borderRadius) || 'px';
    const radiusValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$styles$2f$cssUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__toUnitless__as__unstable_toUnitless$3e$__["unstable_toUnitless"])(theme.shape.borderRadius);
    return {
        display: 'block',
        // Create a "on paper" color with sufficient contrast retaining the color
        backgroundColor: theme.vars ? theme.vars.palette.Skeleton.bg : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$system$40$7$2e$1$2e$1_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$sty_b32eef80901a0649c3aab998a7f5a52a$2f$node_modules$2f40$mui$2f$system$2f$esm$2f$colorManipulator$2f$colorManipulator$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["alpha"])(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.11 : 0.13),
        height: '1.2em',
        variants: [
            {
                props: {
                    variant: 'text'
                },
                style: {
                    marginTop: 0,
                    marginBottom: 0,
                    height: 'auto',
                    transformOrigin: '0 55%',
                    transform: 'scale(1, 0.60)',
                    borderRadius: `${radiusValue}${radiusUnit}/${Math.round(radiusValue / 0.6 * 10) / 10}${radiusUnit}`,
                    '&:empty:before': {
                        content: '"\\00a0"'
                    }
                }
            },
            {
                props: {
                    variant: 'circular'
                },
                style: {
                    borderRadius: '50%'
                }
            },
            {
                props: {
                    variant: 'rounded'
                },
                style: {
                    borderRadius: (theme.vars || theme).shape.borderRadius
                }
            },
            {
                props: ({ ownerState })=>ownerState.hasChildren,
                style: {
                    '& > *': {
                        visibility: 'hidden'
                    }
                }
            },
            {
                props: ({ ownerState })=>ownerState.hasChildren && !ownerState.width,
                style: {
                    maxWidth: 'fit-content'
                }
            },
            {
                props: ({ ownerState })=>ownerState.hasChildren && !ownerState.height,
                style: {
                    height: 'auto'
                }
            },
            {
                props: {
                    animation: 'pulse'
                },
                style: pulseAnimation || {
                    animation: `${pulseKeyframe} 2s ease-in-out 0.5s infinite`
                }
            },
            {
                props: {
                    animation: 'wave'
                },
                style: {
                    position: 'relative',
                    overflow: 'hidden',
                    /* Fix bug in Safari https://bugs.webkit.org/show_bug.cgi?id=68196 */ WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                    '&::after': {
                        background: `linear-gradient(
                90deg,
                transparent,
                ${(theme.vars || theme).palette.action.hover},
                transparent
              )`,
                        content: '""',
                        position: 'absolute',
                        transform: 'translateX(-100%)' /* Avoid flash during server-side hydration */ ,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        top: 0
                    }
                }
            },
            {
                props: {
                    animation: 'wave'
                },
                style: waveAnimation || {
                    '&::after': {
                        animation: `${waveKeyframe} 2s linear 0.5s infinite`
                    }
                }
            }
        ]
    };
}));
const Skeleton = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(function Skeleton(inProps, ref) {
    const props = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DefaultPropsProvider$2f$DefaultPropsProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDefaultProps"])({
        props: inProps,
        name: 'MuiSkeleton'
    });
    const { animation = 'pulse', className, component = 'span', height, style, variant = 'text', width, ...other } = props;
    const ownerState = {
        ...props,
        animation,
        component,
        variant,
        hasChildren: Boolean(other.children)
    };
    const classes = useUtilityClasses(ownerState);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$4_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsx"])(SkeletonRoot, {
        as: component,
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(classes.root, className),
        ownerState: ownerState,
        ...other,
        style: {
            width,
            height,
            ...style
        }
    });
});
("TURBOPACK compile-time truthy", 1) ? Skeleton.propTypes = {
    // ┌────────────────────────────── Warning ──────────────────────────────┐
    // │ These PropTypes are generated from the TypeScript type definitions. │
    // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
    // └─────────────────────────────────────────────────────────────────────┘
    /**
   * The animation.
   * If `false` the animation effect is disabled.
   * @default 'pulse'
   */ animation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOf([
        'pulse',
        'wave',
        false
    ]),
    /**
   * Optional children to infer width and height from.
   */ children: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].node,
    /**
   * Override or extend the styles applied to the component.
   */ classes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].object,
    /**
   * @ignore
   */ className: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].string,
    /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */ component: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].elementType,
    /**
   * Height of the skeleton.
   * Useful when you don't want to adapt the skeleton to a text element but for instance a card.
   */ height: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOfType([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].number,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].string
    ]),
    /**
   * @ignore
   */ style: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].object,
    /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */ sx: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOfType([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].arrayOf(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOfType([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].func,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].object,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].bool
        ])),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].func,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].object
    ]),
    /**
   * The type of content that will be rendered.
   * @default 'text'
   */ variant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ /* @typescript-to-proptypes-ignore */ ["default"].oneOfType([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOf([
            'circular',
            'rectangular',
            'rounded',
            'text'
        ]),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].string
    ]),
    /**
   * Width of the skeleton.
   * Useful when the skeleton is inside an inline element with no width of its own.
   */ width: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].oneOfType([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].number,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$prop$2d$types$40$15$2e$8$2e$1$2f$node_modules$2f$prop$2d$types$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].string
    ])
} : ("TURBOPACK unreachable", undefined);
const __TURBOPACK__default__export__ = Skeleton;
}}),
"[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/Skeleton/Skeleton.js [app-ssr] (ecmascript) <export default as Skeleton>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Skeleton": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Skeleton$2f$Skeleton$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$mui$2b$material$40$7$2e$1$2e$2_$40$emotion$2b$react$40$11$2e$14$2e$0_$40$types$2b$react$40$19$2e$1$2e$8_react$40$19$2e$1$2e$0_$5f40$emotion$2b$s_9e006404fc3586f7b9058af5f597a2e0$2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Skeleton$2f$Skeleton$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@mui+material@7.1.2_@emotion+react@11.14.0_@types+react@19.1.8_react@19.1.0__@emotion+s_9e006404fc3586f7b9058af5f597a2e0/node_modules/@mui/material/esm/Skeleton/Skeleton.js [app-ssr] (ecmascript)");
}}),

};

//# sourceMappingURL=2cd62_%40mui_material_esm_d2b6592f._.js.map