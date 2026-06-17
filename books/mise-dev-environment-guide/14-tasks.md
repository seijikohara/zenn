---
title: "タスクランナー"
---

本章では、mise の `[tasks]` セクションでビルド・テスト・lint などの定型作業を定義し、`mise run` で実行する方法を扱います。読了後には、プロジェクトで繰り返す作業を `mise.toml` にタスクとして宣言し、依存関係を持たせて実行できるようになります。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。環境変数を扱う `[env]` セクションは第 13 章で扱いました。タスクの中で環境変数を使う場合は、第 13 章を参照します。CI からタスクを実行する方法は第 16 章で扱います。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期や設定によって、表示される内容は変わります。

## tasks セクションの基本

mise のタスクは、プロジェクトで繰り返すコマンドに名前を付けて登録する機能です[^tasks]。ビルド・テスト・lint などの作業をタスクとして定義しておくと、`mise run <タスク名>` で実行できます。タスクは `mise.toml` の `[tasks]` セクションに書く方法と、スクリプトファイルとして書く方法の 2 つがあります[^tasks]。本節では `mise.toml` に書く方法を扱います。スクリプトファイルとして書く方法は後述します。

:::message
mise のタスク機能は、mise 2026.6.10 では試験的機能（experimental）ではありません。`mise settings set experimental=true` での有効化は不要です。タスクの `file` を Git リポジトリから取得する一部の記法だけが試験的機能です[^tasks-toml]。
:::

### タスクを定義する

タスクは `[tasks.<タスク名>]` のテーブルで定義します[^tasks-toml]。実行するコマンドを `run` キーに、タスクの説明を `description` キーに書きます。次の例は、`lint` と `test` の 2 つのタスクを定義します。

```toml:mise.toml
[tasks.lint]
description = "ソースコードを静的解析する"
run = "echo linting"

[tasks.test]
description = "テストを実行する"
run = "echo testing"
```

`run` には、シェルで実行するコマンドを書きます[^tasks-toml]。mise は unix では既定で `sh -c -o errexit -o pipefail` を使ってコマンドを実行します[^cli-run]。本書では動作を示すために `echo` を使いますが、実際のプロジェクトでは `eslint .` や `cargo test` などのコマンドを書きます。

`[tasks.<タスク名>]` の書き方のほかに、`[tasks]` テーブルの下にタスク名を並べる書き方もあります。次の例は、前掲の `lint` と `test` を `[tasks]` テーブルにまとめて書いたものです。

```toml:mise.toml
[tasks]
lint = "echo linting"
test = "echo testing"
```

`description` などのキーを持たず `run` だけを指定する場合は、後者の書き方が簡潔です。説明や依存関係を持たせる場合は、前者の `[tasks.<タスク名>]` の書き方を使います。

### タスクを実行する

タスクは `mise run <タスク名>` で実行します[^cli-run]。次の例は、前掲の `test` タスクを実行します。

```shell
$ mise run test
[test] $ echo testing
testing
```

mise はタスク名を角括弧で囲んだ `[test] $ echo testing` の行に、実行するコマンドを表示します。続く行に、コマンドの出力 `testing` を表示します。後述する複数タスクの実行では、最後に `Finished in <時間>` の行が加わります。

`mise run` は `mise r` と短縮できます[^cli-run]。さらに、タスク名と衝突する mise のサブコマンドが無い場合は、`run` を省いて `mise <タスク名>` でも実行できます[^running-tasks]。次の例は、`run` を省いて `test` タスクを実行します。

```shell
$ mise test
[test] $ echo testing
testing
```

:::message
スクリプトやドキュメントでは、`mise <タスク名>` の短縮形ではなく `mise run <タスク名>` を使います。mise が将来タスク名と同じサブコマンドを追加した場合、短縮形ではサブコマンドが優先され、タスクを実行できなくなる可能性があります[^running-tasks]。
:::

### タスクに引数を渡す

タスクに引数を渡すには、`mise run <タスク名>` の後に `--` を置き、続けて引数を書きます[^running-tasks]。mise は `--` の後の引数を、`run` のコマンドの末尾に追加します。次の例は、`run = "echo hello"` を定義した `greet` タスクに `world` を渡します。

```shell
$ mise run greet -- world
[greet] $ echo hello world
hello world
```

`echo hello` の末尾に `world` が追加され、`echo hello world` が実行されます。引数がハイフンで始まらない場合は、`--` を省いて `mise run greet world` とも書けます。`--` は、続く文字列をオプションではなく引数として確実に扱わせる区切りです。引数を `run` の途中に差し込む場合や、引数を必須にする場合は、`usage` 記法による引数の宣言を使います。詳細は mise 公式ドキュメントのタスク引数のページで扱います[^task-args]。

### タスクの一覧を見る

`mise tasks ls` は、現在のディレクトリで利用できるタスクを一覧表示します[^cli-tasks]。各行は、左にタスク名、右に `description` を表示します。次の例は、前掲の `lint` と `test` に加えて `build` を定義したプロジェクトでの出力です。

```shell
$ mise tasks ls
build  成果物をビルドする
lint   ソースコードを静的解析する
test   テストを実行する
```

`mise tasks` は `mise t` と短縮できます[^cli-tasks]。個々のタスクの詳細は `mise tasks info <タスク名>` で確認します。出力には、説明・定義元のファイル・依存タスクが含まれます。次の例は、出力の冒頭を抜粋したものです。実際の出力には、続けて実行コマンドや引数仕様も表示されます。

```shell
$ mise tasks info test
Task: test
Description: テストを実行する
Source: ~/work/my-app/mise.toml
Depends on: lint
```

## 依存関係と並列実行

タスクは、別のタスクへの依存関係を持てます。`lint` を実行してから `test` を実行する、といった実行順序を宣言できます。

### depends で依存を宣言する

`depends` キーは、対象のタスクを実行する前に完了させるタスクを宣言します[^tasks-toml]。値はタスク名の配列です。次の例は、`test` が `lint` に、`build` が `test` に依存する構成です。

```toml:mise.toml
[tasks.lint]
description = "ソースコードを静的解析する"
run = "echo linting"

[tasks.test]
description = "テストを実行する"
depends = ["lint"]
run = "echo testing"

[tasks.build]
description = "成果物をビルドする"
depends = ["test"]
run = "echo building"
```

`build` を実行すると、mise は依存をたどり、`lint`・`test`・`build` の順に実行します。

```shell
$ mise run build
[lint] $ echo linting
linting
[test] $ echo testing
testing
[build] $ echo building
building
Finished in 41.2ms
```

依存関係は `mise tasks deps` で木構造として確認できます[^cli-tasks-deps]。次の例は、前掲の構成での出力です。`build` が `test` に、`test` が `lint` に依存することを表します。

```shell
$ mise tasks deps build
build
└── test
    └── lint
```

### 依存タスクの並列実行

mise は、互いに依存しない複数のタスクを並列に実行します[^running-tasks]。次の例は、`lint` が 2 つの独立したタスク `lint:eslint` と `lint:prettier` に依存する構成です。タスク名に `:` を含める場合は、TOML のキーを引用符で囲みます。

```toml:mise.toml
[tasks."lint:eslint"]
run = "echo eslint"

[tasks."lint:prettier"]
run = "echo prettier"

[tasks.lint]
description = "lint をまとめて実行する"
depends = ["lint:eslint", "lint:prettier"]
```

`lint` を実行すると、`lint:eslint` と `lint:prettier` は依存関係を持たないため、並列に実行されます。

```shell
$ mise run lint
[lint:eslint] $ echo eslint
[lint:prettier] $ echo prettier
[lint:eslint] eslint
[lint:eslint] Finished in 10.8ms
[lint:prettier] prettier
[lint:prettier] Finished in 8.7ms
Finished in 25.8ms
```

並列に実行したタスクの出力は、行ごとにタスク名の接頭辞が付きます。mise は出力を行単位で表示し、並列実行による出力の混在を防ぎます[^running-tasks]。

`depends` に複数のタスクを並べる代わりに、ワイルドカードでまとめて依存させる書き方もあります。`depends = ["lint:*"]` と書くと、`lint:` で始まる全タスクに依存します[^running-tasks]。タスクを追加するたびに `depends` を書き換える必要がなくなります。

```toml:mise.toml
[tasks.lint]
depends = ["lint:*"]
```

### 並列度を指定する

mise は既定で、最大 4 個のタスクを並列に実行します[^running-tasks]。並列度は `mise run` の `--jobs`（`-j`）オプションで変更します。次の例は、並列度を 1 にして、タスクを 1 個ずつ順に実行します。

```shell
$ mise run --jobs 1 lint
```

:::message
`--jobs` は、タスク名の後ではなく `run` の直後に置きます。タスク名の後に書いた引数は、mise がタスクへの引数として扱うためです。
:::

並列度は `MISE_JOBS` 環境変数でも指定できます[^running-tasks]。並列度を 1 にすると、mise は出力を行単位ではなくそのまま流す形式に切り替えます[^running-tasks]。

:::message
`depends` で宣言した依存関係は、並列度に関わらず守られます。`build` が `test` に依存する場合、`test` の完了を待ってから `build` を実行します。並列度は、互いに依存しないタスクを同時に実行する数の上限です。
:::

## ファイルタスク

タスクは、`mise.toml` ではなくスクリプトファイルとしても定義できます[^file-tasks]。スクリプトファイルとして定義したタスクをファイルタスクと呼びます。シェルスクリプトとして書けるため、エディタの構文ハイライトや lint を利用できます[^file-tasks]。複数行にわたる処理や、条件分岐を含む処理を書く場合に使います。

### ファイルタスクを配置する

ファイルタスクは、決められたディレクトリにスクリプトファイルを置いて定義します。mise は次のディレクトリを探索します[^file-tasks]。

- `mise-tasks/`
- `.mise-tasks/`
- `mise/tasks/`
- `.mise/tasks/`
- `.config/mise/tasks/`

ファイル名がタスク名になります[^file-tasks]。例えば `mise-tasks/build` に置いたスクリプトは、`build` タスクになります。スクリプトには実行権限が必要です。実行権限が無いファイルは、mise がタスクとして検出しません[^file-tasks]。

次の例は、`build` タスクをファイルタスクとして定義します。先頭行の shebang でインタプリタを指定し、`cargo build` を実行します。

```bash:mise-tasks/build
#!/usr/bin/env bash
#MISE description="Rust の CLI をビルドする"
cargo build
```

スクリプトを配置したら、`chmod` で実行権限を付与します。

```shell
$ chmod +x mise-tasks/build
```

実行権限を付与すると、mise はファイルタスクを検出します。`mise run build` で実行でき、`mise tasks ls` の一覧にも表示されます。実行時は、`mise.toml` のタスクと同じく `[build] $` の接頭辞付きで出力されます。

### #MISE コメントで設定する

ファイルタスクの説明や依存関係は、ファイル先頭の `#MISE` コメントで指定します[^file-tasks]。`#MISE <キー>=<値>` の形式で書き、`mise.toml` のタスクと同じキーを使えます。次の例は、説明・別名・入力ファイル・出力ファイル・依存タスクを指定します。

```bash:mise-tasks/build
#!/usr/bin/env bash
#MISE description="Rust の CLI をビルドする"
#MISE alias="b"
#MISE sources=["Cargo.toml", "src/**/*.rs"]
#MISE outputs=["target/debug/mycli"]
#MISE depends=["lint", "test"]
cargo build
```

`depends` を指定すると、`mise.toml` のタスクと同じく、依存タスクを先に実行します。ファイルタスクへ渡した引数は、スクリプトに位置引数として渡ります。`mise run build arg1 arg2` を実行すると、スクリプト内で `$1` が `arg1`、`$2` が `arg2` になります。

`sources` と `outputs` を指定すると、mise は入力ファイルが前回の実行から変わっていないときにタスクをスキップします[^tasks-toml]。`sources` に指定したファイルが変わった場合だけ `outputs` を作り直すため、ビルドの実行時間を抑えられます。同じキーは `mise.toml` のタスクでも指定できます。

### TOML タスクとファイルタスクの使い分け

`mise.toml` のタスク（以下、TOML タスク）とファイルタスクは、同じプロジェクトに混在させられます。両者の使い分けの目安を次の表にまとめます。

| 観点 | TOML タスク | ファイルタスク |
| --- | --- | --- |
| 定義場所 | `mise.toml` の `[tasks]` | `mise-tasks/` などのスクリプトファイル |
| 向いている処理 | 1 行のコマンド | 複数行・条件分岐を含む処理 |
| 設定の書き方 | TOML のキー | `#MISE` コメント |
| エディタ支援 | TOML として扱う | シェルスクリプトとして構文ハイライト・lint |

短いコマンドは TOML タスクで簡潔に書けます。処理が複雑になり、TOML の文字列に収めると読みにくくなる場合は、ファイルタスクへ切り出します。同じ名前のタスクを TOML とファイルの両方で定義した場合は、設定の対象ファイルの優先順位に従って解決されます。詳細は mise 公式ドキュメントのファイルタスクのページで扱います[^file-tasks]。

## npm scripts・Makefile との比較

タスクランナーには、Node.js の npm scripts や、ビルドツールの Make があります。mise のタスクは、両者と次の点で異なります。

### npm scripts との違い

npm scripts は `package.json` の `scripts` フィールドにコマンドを書き、`npm run <スクリプト名>` で実行します[^npm-scripts]。Node.js プロジェクトに限られ、`package.json` が前提です。mise のタスクは言語に依存しません。Node.js・Python・Go・Rust などの言語を問わず、同じ `mise.toml` にタスクを定義できます。

### Make との違い

Make は `Makefile` にターゲットと依存関係を書き、`make <ターゲット>` で実行します[^make]。依存関係と、入力ファイルの変更に応じた再実行を扱えます。mise のタスクも `depends` で依存関係を、`sources` と `outputs` で入力ファイルの変更に応じたスキップを扱えます。Make との違いは、mise が言語ランタイムのバージョン管理と環境変数の設定を同じ `mise.toml` で扱う点です。

### バージョン管理・環境変数との統合

mise のタスクは、`[tools]` で宣言したツールと `[env]` で宣言した環境変数を、タスクの実行環境に反映します[^tasks]。`[tools]` に `node = "22.20.0"` を宣言したプロジェクトでは、タスクは Node.js 22.20.0 を使って実行されます。ツールのバージョン・環境変数・タスクを 1 つの設定ファイルに集約できるため、別のタスクランナーを追加せずにプロジェクトの作業を一元化できます。

:::message
mise のタスクは、既存の npm scripts や Makefile を置き換えるとは限りません。既存の `package.json` の `scripts` を残したまま、`mise.toml` のタスクから `npm run build` を呼び出す構成もとれます。チームの状況に応じて、既存の定義を活かすか、mise のタスクへ移すかを選びます。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、`[tasks]` を使う `mise.toml` の例を示します。Node.js のバージョンを固定し、lint・test・build のタスクを定義し、依存関係を持たせます。

```toml:mise.toml
[tools]
node = "22.20.0"  # Node.js のバージョンを固定

[tasks.lint]
description = "ソースコードを静的解析する"
run = "eslint ."

[tasks.test]
description = "テストを実行する"
depends = ["lint"]   # lint の後に実行する
run = "vitest run"

[tasks.build]
description = "成果物をビルドする"
depends = ["test"]   # test の後に実行する
sources = ["src/**/*.ts"]   # 入力ファイル
outputs = ["dist/**/*.js"]  # 出力ファイル
run = "tsc"
```

`build` を実行すると、mise は `lint`・`test`・`build` の順に実行します。`tools` に宣言した Node.js 22.20.0 を使うため、タスクごとに Node.js のバージョンを指定する必要はありません。

```shell
$ mise run build
[lint] $ eslint .
[test] $ vitest run
[build] $ tsc
Finished in 3.2s
```

`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じタスクを共有できます。新たに参加した開発者は、`mise tasks ls` でプロジェクトのタスクを把握し、`mise run build` で同じ手順を再現できます。

## 本章のまとめ

- mise の `[tasks]` セクションは、プロジェクトで繰り返すコマンドにタスクとして名前を付けます。`run` に実行するコマンドを、`description` に説明を書きます。mise 2026.6.10 では試験的機能ではありません。
- タスクは `mise run <タスク名>` で実行します。`mise <タスク名>` の短縮形もありますが、スクリプトやドキュメントでは `mise run <タスク名>` を使います。`mise tasks ls` で一覧を、`mise tasks info <タスク名>` で詳細を確認します。
- `depends` で依存タスクを宣言します。mise は依存をたどって実行し、互いに依存しないタスクを並列に実行します。並列度は既定で 4 個とし、`--jobs` で変更します。
- ファイルタスクは、`mise-tasks/` などのディレクトリにスクリプトファイルを置いて定義します。説明や依存関係は `#MISE` コメントで指定します。複数行や条件分岐を含む処理に向きます。
- mise のタスクは言語に依存せず、`[tools]` のバージョン管理と `[env]` の環境変数を同じ設定ファイルで扱います。npm scripts や Makefile を呼び出す構成もとれます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^tasks]: mise のタスク機能の概要（タスクの定義方法・`[tools]` と `[env]` の反映・TOML タスクとファイルタスクの 2 形態）。mise 公式ドキュメント「Tasks」<https://mise.jdx.dev/tasks/>
[^tasks-toml]: TOML タスクの仕様（`[tasks.<名前>]`・`run`・`description`・`depends`・`sources`・`outputs` などのキー、`file` を Git から取得する記法が試験的機能である点）。mise 公式ドキュメント「TOML Tasks」<https://mise.jdx.dev/tasks/toml-tasks.html>
[^file-tasks]: ファイルタスクの仕様（配置ディレクトリ・ファイル名がタスク名になる点・実行権限・`#MISE` コメントでの設定）。mise 公式ドキュメント「File Tasks」<https://mise.jdx.dev/tasks/file-tasks.html>
[^running-tasks]: タスクの実行（`mise run`・`mise <タスク名>` の短縮・引数の渡し方・並列実行・既定の並列度 4・`--jobs` と `MISE_JOBS`・ワイルドカード依存）。mise 公式ドキュメント「Running Tasks」<https://mise.jdx.dev/tasks/running-tasks.html>
[^task-args]: タスクの引数の宣言（`usage` 記法による引数とフラグの定義）。mise 公式ドキュメント「Task Arguments」<https://mise.jdx.dev/tasks/task-arguments.html>
[^cli-run]: `mise run` コマンド（タスクの実行・`mise r`・`--jobs`・既定のシェル `sh -c -o errexit -o pipefail`）。mise 公式ドキュメント「mise run」<https://mise.jdx.dev/cli/run.html>
[^cli-tasks]: `mise tasks` コマンド（タスクの管理・`mise t`・`ls`・`info`）。mise 公式ドキュメント「mise tasks」<https://mise.jdx.dev/cli/tasks.html>
[^cli-tasks-deps]: `mise tasks deps` コマンド（依存関係の木構造の表示）。mise 公式ドキュメント「mise tasks deps」<https://mise.jdx.dev/cli/tasks/deps.html>
[^npm-scripts]: npm scripts は `package.json` の `scripts` に定義したコマンドを実行する仕組みです。npm 公式ドキュメント「scripts」<https://docs.npmjs.com/cli/v10/using-npm/scripts/>
[^make]: Make は `Makefile` のターゲットと依存関係に従ってコマンドを実行するビルドツールです。GNU Make 公式マニュアル<https://www.gnu.org/software/make/manual/make.html>
