/// <reference path="../typings/tsd.d.ts" />

declare module "definition-header" {

    // dist/index.d.ts
    export interface Header {
        label: Label;
        project: Project;
        authors: Author[];
        repository: Repository;
    }
    export interface Label {
        name: string;
        version: string;
    }
    export interface Project {
        url: string;
    }
    export interface Author {
        name: string;
        url: string;
    }
    export interface Repository {
        url: string;
    }
    export function parse(source: string): Header;
    export function analise(header: Header): any;
    export function serialise(header: Header): string[];

}
