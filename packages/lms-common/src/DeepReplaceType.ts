export type DeepReplaceType<TInput, TSearch, TReplace> = TInput extends TSearch
  ? TReplace
  : TInput extends Array<infer RElement>
    ? Array<DeepReplaceType<RElement, TSearch, TReplace>>
    : TInput extends object
      ? {
          [K in keyof TInput]: DeepReplaceType<TInput[K], TSearch, TReplace>;
        }
      : TInput;

export type DeepReplaceType2<TInput, TSearch1, TReplace1, TSearch2, TReplace2> =
  TInput extends TSearch1
    ? TReplace1
    : TInput extends TSearch2
      ? TReplace2
      : TInput extends Array<infer RElement>
        ? Array<DeepReplaceType2<RElement, TSearch1, TReplace1, TSearch2, TReplace2>>
        : TInput extends object
          ? {
              [K in keyof TInput]: DeepReplaceType2<
                TInput[K],
                TSearch1,
                TReplace1,
                TSearch2,
                TReplace2
              >;
            }
          : TInput;
