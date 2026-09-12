// Regex for default and conventional commits.
const RE_DEFAULT_COMMIT =
  /^(?::.*:|(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))\s(?<emoji>\((?<scope>.*)\)\s)?.*$/;
export default {
  rules: {
    'cz-emoji': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'cz-emoji': ({ header }: { header: string | null }) => {
          const isValid = RE_DEFAULT_COMMIT.test(header ?? '');
          const message = 'Your commit message should be: <emoji> (<scope>)?: <subject>';

          return [isValid, message];
        },
      },
    },
  ],
};
