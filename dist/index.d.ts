// Type definitions for definition-header 0.0.1
// Project: https://github.com/DefinitelyTyped/definition-header
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../typings/tsd.d.ts" />

declare module "definition-header" {

    // dist/index.d.ts
    export var REPOSITORY: string;
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
    export function assert(header: Header): any;
    export function analise(header: Header): any;
    export function fromPackage(pkg: any): Header;
    export function serialise(header: Header): string[];

}
