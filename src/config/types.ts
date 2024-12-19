import { STATUS_ICONS } from "./constants";

export type StatusIcon = (typeof STATUS_ICONS)[keyof typeof STATUS_ICONS];
