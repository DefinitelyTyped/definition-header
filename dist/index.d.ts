// Type definitions for definition-header 0.0.1
// Project: https://github.com/DefinitelyTyped/definition-header
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../ownTypings/parsimmon.d.ts" />
/// <reference path="../typings/xregexp/xregexp.d.ts" />

declare module "definition-header" {

    // dist/index.d.ts
    export var REPOSITORY: string;
    export interface IHeader {
        label: ILabel;
        project: IProject;
        authors: IAuthor[];
        repository: IRepository;
    }
    export interface ILabel {
        name: string;
        version: string;
    }
    export interface IProject {
        url: string;
    }
    export interface IAuthor {
        name: string;
        url: string;
    }
    export interface IRepository {
        url: string;
    }
    export function parse(source: string): IHeader;
    export function serialise(header: IHeader): string[];
    export function assert(header: IHeader): any;
    export function analise(header: IHeader): any;
    export function fromPackage(pkg: any): IHeader;

}
