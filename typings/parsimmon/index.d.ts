import * as Parsimmon from 'parsimmon';

declare module 'parsimmon' {
    interface Parser<T> {
        notFollowedBy<TParser>(parser: Parser<TParser>): this;
    }
}