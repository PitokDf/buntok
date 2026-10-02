export type FPFnInput = (...args: any[]) => any;

export type FPArity = 1 | 2 | 3 | 4;

export type FPFn<Fn extends FPFnInput, Arity extends FPArity> = Arity extends 4
	? FPFn4<
			ReturnType<Fn>,
			Parameters<Fn>[3],
			Parameters<Fn>[2],
			Parameters<Fn>[1],
			Parameters<Fn>[0]
		>
	: Arity extends 3
		? FPFn3<
				ReturnType<Fn>,
				Parameters<Fn>[2],
				Parameters<Fn>[1],
				Parameters<Fn>[0]
			>
		: Arity extends 2
			? FPFn2<ReturnType<Fn>, Parameters<Fn>[1], Parameters<Fn>[0]>
			: Arity extends 1
				? FPFn1<ReturnType<Fn>, Parameters<Fn>[0]>
				: never;

export interface FPFn1<Result, Arg> {
	(): FPFn1<Result, Arg>;
	(arg: Arg): Result;
}

export interface FPFn2<Result, Arg2, Arg1> {
	(): FPFn2<Result, Arg2, Arg1>;
	(arg2: Arg2): FPFn1<Result, Arg1>;
	(arg2: Arg2, arg1: Arg1): Result;
}

export interface FPFn3<Result, Arg3, Arg2, Arg1> {
	(): FPFn3<Result, Arg3, Arg2, Arg1>;
	(arg3: Arg3): FPFn2<Result, Arg2, Arg1>;
	(arg3: Arg3, arg2: Arg2): FPFn1<Result, Arg1>;
	(arg3: Arg3, arg2: Arg2, arg1: Arg1): Result;
}

export interface FPFn4<Result, Arg4, Arg3, Arg2, Arg1> {
	(): FPFn4<Result, Arg4, Arg3, Arg2, Arg1>;
	(arg4: Arg4): FPFn3<Result, Arg3, Arg2, Arg1>;
	(arg4: Arg4, arg3: Arg3): FPFn2<Result, Arg2, Arg1>;
	(arg4: Arg4, arg3: Arg3, arg2: Arg2): FPFn1<Result, Arg1>;
	(arg4: Arg4, arg3: Arg3, arg2: Arg2, arg1: Arg1): Result;
}

function convertToFPInner(
	fn: FPFnInput,
	arity: number,
	curriedArgs: unknown[],
): unknown {
	return curriedArgs.length >= arity
		? fn(...curriedArgs.slice(0, arity).reverse())
		: (...args: unknown[]) =>
				convertToFPInner(fn, arity, curriedArgs.concat(args));
}

export function convertToFP<Fn extends FPFnInput, Arity extends FPArity>(
	fn: Fn,
	arity: Arity,
): FPFn<Fn, Arity> {
	return convertToFPInner(fn, arity, []) as FPFn<Fn, Arity>;
}
