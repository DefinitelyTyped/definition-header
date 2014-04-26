interface Foo {
	foo(): any;
}
interface Bar {
	bar(): any;
}
var foos: Foo[];
var bars: Bar[];
function foo2bar(foo: Foo): Bar {
	var bar: Bar;
	return bar;
}
bars = foos.map(f => foo2bar(f));
