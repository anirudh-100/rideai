/// <reference types="nativewind/types" />

// Force css-interop's `declare module "react-native"` augmentations (which add
// `className` to ViewProps, TextProps, etc.) to load by side-effect-importing
// the types module — a `reference types` alone doesn't apply them reliably
// when the file is module-shaped (it has top-level imports).
import 'react-native-css-interop/types';
