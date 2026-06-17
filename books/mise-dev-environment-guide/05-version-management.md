---
title: "バージョン管理の実際"
---

本章では、mise で個々のツールのバージョンを「入れる・選ぶ・確認する・実行する」基本操作を扱います。読了後には、Node.js を例にした一連のコマンドを手元で再現し、グローバルとローカルの使い分けや複数バージョンの併存を自分の環境で実践できます。

本章は第 3 章で mise を導入・有効化し、第 4 章で mise.toml の基本を理解した状態を前提とします。mise 自体のインストールとシェル有効化は第 3 章、mise.toml の設定構文の詳細は第 4 章を参照してください。環境変数（env）は第 13 章、タスク（tasks）は第 14 章で扱います。Node.js・Python など言語ごとの個別事情は第 6 章以降で扱います。本章の例には Node.js を用いますが、操作の体系はすべてのツールで共通です。

以降のコマンド例では、バージョン番号や出力は執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## インストール可能なバージョンを確認する

ツールを入れる前に、インストールできるバージョンの一覧を `mise ls-remote` で確認します。引数にツール名を渡すと、対象ツールの公開済みバージョンを古い順に表示します[^ls-remote]。

```shell
$ mise ls-remote node
0.1.14
0.1.15
...
22.22.3
23.11.1
24.10.0
```

特定の系列だけを見たい場合は、ツール名の後ろにバージョンの接頭辞を渡します。次の例は 22 系のバージョンだけを抽出します。

```shell
$ mise ls-remote node 22
22.0.0
22.1.0
...
22.22.3
```

:::message
`mise ls-remote` の結果はキャッシュされます。最新の一覧を取得するには `mise cache clean` でキャッシュを消去してから再実行します。
:::

## ツールをインストールする

バージョンを指定してインストールするには `mise install <ツール>@<バージョン>` を実行します。次の例は Node.js 22.22.3 をインストールします。

```shell
$ mise install node@22.22.3
mise node@22.22.3  ✓ installed
```

:::message
初回のインストールでは、ダウンロード・チェックサム照合・展開の進捗が順に表示され、完了時に最終行の `✓ installed` が残ります。本書のコマンド例は、進捗行を省いて完了後の状態を示します。
:::

`mise install` は `~/.local/share/mise/installs/<ツール>/<バージョン>` にバージョンを配置します[^install]。ただし、インストールだけでは PATH にツールが入らず、コマンドとして呼び出せません。インストールと有効化を 1 つのコマンドでまとめて行うには、後述の `mise use` を使います。

`@<バージョン>` を省略すると `@latest` として扱い、最新の安定版をインストールします。

```shell
$ mise install node
mise node@24.10.0  ✓ installed
```

## グローバルとローカルを切り替える

`mise use` は、ツールをインストールしたうえで、選んだバージョンを設定ファイルに書き込みます[^use]。書き込む設定ファイルの場所によって、バージョンの適用範囲が変わります。

### ローカル（プロジェクト単位）に設定する

引数なしの `mise use` は、カレントディレクトリの `mise.toml` にバージョンを書き込みます。プロジェクトのディレクトリ内でのみ、設定したバージョンが有効になります。

```shell
$ cd ~/work/my-app
$ mise use node@22.22.3
mise node@22.22.3  ✓ installed
mise ~/work/my-app/mise.toml tools: node@22.22.3
```

書き込まれた `mise.toml` は次の内容です。

```toml:~/work/my-app/mise.toml
[tools]
node = "22.22.3"
```

`mise.toml` はプロジェクトのルートに置き、バージョン管理システムにコミットします。チームの全員が同じバージョンの Node.js を使えます。設定構文の詳細は第 4 章を参照してください。

### グローバル（ユーザ全体）に設定する

`-g`（`--global`）を付けると、グローバル設定ファイル `~/.config/mise/config.toml` にバージョンを書き込みます。プロジェクト固有の設定が無いディレクトリで適用される、既定のバージョンになります。

```shell
$ mise use -g node@22.22.3
mise node@22.22.3  ✓ installed
mise ~/.config/mise/config.toml tools: node@22.22.3
```

ローカル設定とグローバル設定の両方が存在する場合、ローカル設定が優先されます[^precedence]。プロジェクト内ではローカルの `mise.toml` のバージョンが、プロジェクト外ではグローバルのバージョンが有効になります。

設定ファイルの書き込み先を、コマンドと適用範囲の対応として整理します。

| コマンド | 書き込み先 | 適用範囲 |
| --- | --- | --- |
| `mise use node@22.22.3` | `./mise.toml` | カレントディレクトリ以下 |
| `mise use -g node@22.22.3` | `~/.config/mise/config.toml` | グローバル（既定値） |

## 状態を確認する

設定したバージョンが正しく適用されているかを、3 つのコマンドで確認します。

### `mise ls` でツールの一覧を見る

`mise ls` は、mise が把握しているツールのバージョンを一覧表示します。インストール済みのバージョンと、設定ファイルに記載された（有効な）バージョンの両方を含みます。

```shell
$ mise ls node
Tool  Version   Source                  Requested
node  22.22.3   ~/work/my-app/mise.toml  22.22.3
```

`Source` 列は、有効なバージョンを決めている設定ファイルの場所を示します。プロジェクト内ではローカルの `mise.toml`、プロジェクト外ではグローバルの `~/.config/mise/config.toml` が表示されます。同じツールに複数のバージョンをインストール済みの場合、有効でないバージョンも行として並びます。先頭の見出し行は、結果を端末に表示するときのみ出力します。

### `mise current` で有効なバージョンを見る

`mise current <ツール>` は、現在有効なバージョン番号だけを出力します。`mise ls --current` と似ていますが、バージョン番号のみを返すため、スクリプトに組み込みやすい形式です[^current]。

```shell
$ mise current node
22.22.3
```

### `mise which` で実行ファイルの場所を見る

`mise which <コマンド名>` は、コマンドが指す実行ファイルの絶対パスを表示します。実際にどのバージョンが呼び出されるかを確認できます[^which]。

```shell
$ mise which node
/Users/me/.local/share/mise/installs/node/22.22.3/bin/node
```

パスにバージョン番号が含まれるため、有効なバージョンを実行ファイルの場所から確かめられます。

## 複数バージョンを併存させて一時的に使う

mise は同じツールの複数バージョンを同時にインストールできます。設定ファイルを変更せず、特定のコマンドだけを別バージョンで実行するには `mise exec` を使います。エイリアスは `mise x` です[^exec]。

`mise exec <ツール>@<バージョン> -- <コマンド>` の形式で、`--` の後ろに実行するコマンドを書きます。次の例は、プロジェクトの設定が node@22.22.3 のままでも、node@24.10.0 で 1 回だけバージョンを表示します。

```shell
$ mise exec node@24.10.0 -- node --version
v24.10.0
```

指定したバージョンが未インストールの場合、`mise exec` は実行前に自動でインストールします。設定ファイルを変更しないため、別バージョンでの動作確認や、一時的なコマンド実行に向きます。`mise exec` を `mise x` と書いても同じ動作です。

```shell
$ mise x node@24.10.0 -- node --version
v24.10.0
```

:::message
`mise exec` で上書きできるのは、引数で指定したツールだけです。`mise.toml` に node と python が記載された状態で `mise exec python@3.13 -- ...` を実行すると、python だけが上書きされ、node は設定ファイルのバージョンのまま読み込まれます。
:::

## shims と activate の違いと選択指針

mise がツールの実行ファイルを PATH 上で解決する方式には、PATH activation と shims の 2 つがあります[^shims]。第 3 章では PATH activation を設定しました。両者の違いを理解すると、対話的なシェルとスクリプト実行のどちらにも適切な方式を選べます。

PATH activation は、シェルの設定ファイルに `eval "$(mise activate zsh)"` を書いて有効化します。プロンプトを表示するたびに、mise がカレントディレクトリの設定に応じて PATH と環境変数を更新します。対話的なシェルで、ディレクトリを移動するたびに有効なバージョンが切り替わります。

shims は、`~/.local/share/mise/shims` に置いた小さな実行ファイル（shim）でコマンドを横取りし、呼び出し時に適切なバージョンを解決します。PATH の先頭に shims ディレクトリを追加して有効化します。シェルのプロンプトに依存しないため、cron やスクリプトなど対話的でない実行でもバージョンを解決できます。

2 つの方式には、次の挙動差があります[^shims]。

| 観点 | PATH activation | shims |
| --- | --- | --- |
| PATH の更新契機 | プロンプト表示のたび | shim の呼び出し時 |
| 対話的でない実行 | `mise hook-env` を手動で呼ぶ必要がある | そのまま解決できる |
| mise の env で定義した環境変数 | すべてのコマンドで利用できる | mise のツールにのみ反映される |
| `which <コマンド>` の表示 | 実行ファイルの実体のパス | shim のパス（実体が分かりにくい） |

mise の公式ドキュメントは、対話的なシェルでは PATH activation（`mise activate`）の利用を推奨しています[^shims]。環境変数（env）とシェルのフックを完全に利用でき、`which` が実行ファイルの実体を指すためです。対話的でない実行を主とする場合や、シェルの有効化を避けたい場合に shims を選びます。両方式の設定手順は第 3 章で扱います。

## 本章のまとめ

- インストール可能なバージョンは `mise ls-remote <ツール>` で確認し、接頭辞を渡すと特定の系列に絞り込めます。
- `mise install <ツール>@<バージョン>` はバージョンを `~/.local/share/mise/installs` に配置しますが、PATH には反映しません。
- `mise use` はローカルの `mise.toml` に、`mise use -g` はグローバルの `~/.config/mise/config.toml` にバージョンを書き込みます。ローカル設定がグローバル設定より優先されます。
- 状態の確認には、一覧の `mise ls`、有効なバージョンの `mise current`、実行ファイルの場所の `mise which` を使います。
- `mise exec <ツール>@<バージョン> -- <コマンド>`（エイリアス `mise x`）は、設定ファイルを変更せずに別バージョンでコマンドを 1 回実行します。
- PATH 解決の方式には PATH activation と shims があり、対話的なシェルでは PATH activation が推奨されます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^ls-remote]: `mise ls-remote` の仕様。mise 公式ドキュメント「mise ls-remote」<https://mise.jdx.dev/cli/ls-remote.html>
[^install]: `mise install` の仕様とインストール先。mise 公式ドキュメント「mise install」<https://mise.jdx.dev/cli/install.html>
[^use]: `mise use` の仕様と書き込み先の決定順序。mise 公式ドキュメント「mise use」<https://mise.jdx.dev/cli/use.html>
[^precedence]: 設定ファイルの優先順位。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^current]: `mise current` の仕様。コマンド一覧は mise 公式ドキュメント「CLI Reference」<https://mise.jdx.dev/cli/> を参照。等価な `mise ls --current` は「mise ls」<https://mise.jdx.dev/cli/ls.html> に記載があります。
[^which]: `mise which` の仕様。mise 公式ドキュメント「mise which」<https://mise.jdx.dev/cli/which.html>
[^exec]: `mise exec` の仕様とエイリアス。mise 公式ドキュメント「mise exec」<https://mise.jdx.dev/cli/exec.html>
[^shims]: PATH activation と shims の違いと推奨。mise 公式ドキュメント「Shims」<https://mise.jdx.dev/dev-tools/shims.html>
