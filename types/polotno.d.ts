// zory-studio/types/polotno.d.ts

declare module "polotno/model/store" {
  export type Element = {
    id?: string;
    type: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    src?: string;
    stroke?: string;
    strokeWidth?: number;
    locked?: boolean;
    selectable?: boolean;
    name?: string;
  };

  export type Page = {
    width: number;
    height: number;
    children: Element[];
    addElement(el: Element): Element;
    set(props: Partial<Page>): void;
  };

  export type Store = {
    width: number;
    height: number;
    pages: Page[];
    activePage: Page;
    addPage(opts?: { width?: number; height?: number }): Page;
    toDataURL(): Promise<string>;
  };

  export function createStore(): Store;
}

declare module "polotno/canvas/workspace" {
  import type { Store } from "polotno/model/store";
  export const Workspace: (props: { store: Store }) => any;
}

declare module "polotno/toolbar/toolbar" {
  export const Toolbar: (props: { store: any }) => any;
}

declare module "polotno/toolbar/zoom-buttons" {
  export const ZoomButtons: (props: { store: any }) => any;
}
