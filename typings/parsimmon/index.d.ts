import * as Parsimmon from 'parsimmon';

declare module 'parsimmon' {
    interface Parser<T> {
        /**
         * Returns a parser that looks for anything but whatever anotherParser wants to
         * parse, and does not consume it. Yields the same result as parser. Equivalent to
         * parser.skip(Parsimmon.notFollowedBy(anotherParser)).
         */
        notFollowedBy(anotherParser: Parser<any>): Parser<T>;
        /**
         * Returns a parser that looks for whatever arg wants to parse, but does not
         * consume it. Yields the same result as parser. Equivalent to
         * parser.skip(Parsimmon.lookahead(anotherParser)).
         */
        lookahead(arg: Parser<any> | string | RegExp): Parser<T>;
    }

    /**
     * Parses using parser, but does not consume what it parses. Yields null if the parser
     * does not match the input. Otherwise it fails.
     */
    function notFollowedBy(parser: Parser<any>): Parser<null>;

    /**
     * Parses using arg, but does not consume what it parses. Yields an empty string.
     */
    function lookahead(arg: Parser<any> | string | RegExp): Parser<''>;
}