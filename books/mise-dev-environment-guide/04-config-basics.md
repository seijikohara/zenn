---
title: "基本概念と mise.toml"
---

本章では、mise の設定ファイル `mise.toml` の役割と、mise が設定ファイルを探索する順序、複数の設定が競合したときの優先順位を扱います。読了後には、`[tools]` セクションのバージョン指定構文を理解し、プロジェクト単位の `mise.toml` を自分で書けるようになります。

本章は第 3 章で mise を導入・有効化した状態を前提とします。mise 自体のインストールとシェル有効化は第 3 章を参照してください。本章は設定ファイルの中身と構文を扱います。関連する操作と機能は、次の各章で扱います。

- ツールを入れる・選ぶといったコマンド操作（`mise install` / `mise use` / `mise ls`）は第 5 章。
- 環境変数（env）は第 13 章。
- タスク（tasks）は第 14 章。

:::message
本章のコマンド出力や解決されるバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。
:::

## mise.toml の役割

mise.toml は、プロジェクトで使うツールのバージョンや環境変数、タスクを宣言する設定ファイルです[^config]。TOML[^toml] 形式で記述します。mise はディレクトリを移動するたびに mise.toml を読み込み、記述されたバージョンのツールを PATH 上で有効にします。

最小の mise.toml は、`[tools]` セクションにツール名とバージョンを並べます。次の例は、Node.js 22 系と Python 3.13 系を宣言します。

```toml:mise.toml
[tools]
node = "22"
python = "3.13"
```

mise.toml には `[tools]` 以外に、次のセクションがあります[^config]。本章は `[tools]` セクションのバージョン指定に絞って説明します。

| セクション | 役割 | 扱う章 |
| --- | --- | --- |
| `[tools]` | ツールのバージョンを宣言する | 本章 |
| `[env]` | 環境変数を定義する | 第 13 章 |
| `[tasks]` | タスクを定義する | 第 14 章 |

mise.toml はプロジェクトのルートに置き、バージョン管理システムにコミットします。チームの全員が同じバージョンのツールを使えます。

## 設定ファイルの種類と探索順

mise が読み込む設定ファイルは、適用範囲によって 2 種類に分かれます。

- プロジェクト単位の設定ファイル。
- ユーザ全体に適用するグローバル設定ファイル。

さらに、asdf[^asdf] と互換の `.tool-versions` も読み込みます。

### プロジェクト単位の設定ファイル

プロジェクト単位の設定ファイルは、プロジェクトのディレクトリに置く mise.toml です。mise は同名・別名を合わせて複数のファイル名を認識します。主なファイル名は次のとおりです[^config]。

| ファイル名 | 用途 |
| --- | --- |
| `mise.toml` | プロジェクトの標準の設定ファイル |
| `mise.local.toml` | 個人用の上書き設定。バージョン管理にコミットしない |
| `.mise.toml` | `mise.toml` の別名。先頭にドットを付けて隠しファイルにする |

`mise.local.toml` は、各開発者が個人的に上書きする設定を書くためのファイルです[^config]。バージョン管理システムの無視リスト（`.gitignore` など）に追加し、コミットしません。チーム共有の `mise.toml` を変更せずに、手元だけ別バージョンを使う用途に向きます。

:::details 環境別の設定ファイル
mise は、`mise.<環境名>.toml` という名前で環境別の設定ファイルも読み込みます[^config]。例えば `mise.production.toml` は、`MISE_ENV=production` を指定したときに読み込まれます。環境別の設定の詳細は、mise 公式ドキュメントの Configuration を参照してください[^config]。
:::

### グローバル設定ファイル

グローバル設定ファイルは `~/.config/mise/config.toml` です[^config]。プロジェクト固有の設定が無いディレクトリで適用される、既定のバージョンを宣言します。`mise use -g` でツールを追加すると、mise はグローバル設定ファイルにバージョンを書き込みます。書き込みの操作は第 5 章で扱います。

:::message
グローバル設定ファイルの場所は、環境変数 `MISE_CONFIG_DIR` や `XDG_CONFIG_HOME` で変更できます。既定では `~/.config/mise/config.toml` です。本書は既定の場所を前提に説明します。
:::

### ディレクトリ階層をさかのぼる探索

mise は、カレントディレクトリから親ディレクトリへとたどり、見つかった mise.toml をすべて読み込みます[^config]。グローバル設定ファイルも合わせて読み込みます。複数の設定ファイルが見つかった場合、各ファイルの `[tools]` を統合します。同じツールを複数のファイルが宣言している場合は、優先順位の高いファイルの値を採用します。

現在 mise が読み込んでいる設定ファイルの一覧は、`mise config ls` で確認できます[^config-ls]。次の例は、`~/work/my-app/sub` で実行した結果です。グローバル設定ファイル、プロジェクトルートの mise.toml、サブディレクトリの mise.toml の 3 つを読み込んでいます。

```shell
$ cd ~/work/my-app/sub
$ mise config ls
~/.config/mise/config.toml      node, python
~/work/my-app/mise.toml         node
~/work/my-app/sub/mise.toml     node
```

## グローバルとローカルの優先順位

複数の設定ファイルが同じツールを宣言している場合、mise はカレントディレクトリに近いファイルを優先します[^config]。優先順位は、近い設定ファイルほど高くなります。

優先順位の高い順に並べると、次のようになります。

1. カレントディレクトリの mise.toml（最も優先）
2. 親ディレクトリの mise.toml（階層が近いほど優先）
3. グローバル設定ファイル `~/.config/mise/config.toml`（本章で扱う設定ファイルのうち最も優先度が低い）

ローカルの mise.toml はグローバル設定ファイルより優先されます。プロジェクト内ではローカルの mise.toml のバージョンが、プロジェクト外ではグローバルのバージョンが有効になります。

:::message
mise は、全ユーザに適用するシステム設定ファイル `/etc/mise/config.toml` も読み込みます[^config]。システム設定はグローバル設定よりさらに優先度が低く、利用する場面はまれです。本章はプロジェクト単位の設定とグローバル設定を中心に扱います。
:::

### 優先順位の動作例

優先順位は、ツールごとに個別に適用されます。あるツールがローカルの mise.toml で宣言されていない場合、mise は親ディレクトリやグローバル設定ファイルへさかのぼって、宣言を探します。次の例で、優先順位の働きを確認します。

```toml:~/.config/mise/config.toml
[tools]
node = "20"
python = "3.13"
```

```toml:~/work/my-app/mise.toml
[tools]
node = "22"
```

`~/work/my-app` で `mise ls` を実行すると、node はローカルの mise.toml が宣言した 22 系、python はグローバル設定ファイルが宣言した 3.13 系に解決されます。python はローカルの mise.toml で宣言されていないため、グローバルの値が採用されます。次の出力は、まだツールをインストールしていない状態の例です。バージョン番号の後ろの `(missing)` は、解決済みのバージョンが未インストールであることを示します。

```shell
$ cd ~/work/my-app
$ mise ls --no-header
node    22.22.3 (missing)  ~/work/my-app/mise.toml      22
python  3.13.7 (missing)   ~/.config/mise/config.toml   3.13
```

`mise ls` は、設定ファイルが解決したバージョンと、その由来となった設定ファイルの場所を表示します。インストールが済むと `(missing)` は消えます。ツールをインストールするコマンドは第 5 章で扱います。

:::message
同じディレクトリに `mise.toml` と `mise.local.toml` の両方を置いた場合、`mise.local.toml` が優先されます。`mise.local.toml` は個人用の上書き設定であり、チーム共有の `mise.toml` の値を手元で差し替えられます。
:::

## `[tools]` のバージョン指定構文

`[tools]` セクションは、ツール名をキー、バージョン指定を値として記述します。バージョン指定には複数の構文があり、固定のバージョンから、最新版を自動で選ぶ指定まで対応します[^tools]。

### 完全指定と部分指定

完全指定は、`22.22.3` のようにバージョンを最後まで書きます。宣言したバージョンだけがインストール・解決の対象になります。再現性が必要なプロジェクトでは、完全指定でバージョンを固定します。

部分指定は、`22` や `22.22` のように先頭の一部だけを書きます。mise は、その接頭辞に一致するインストール済みの最新バージョンを解決します。インストール済みのバージョンが無い場合は、接頭辞に一致する最新の公開バージョンをインストールの対象とします[^tools]。例えば `node = "22"` は、22 系の最新バージョン（執筆時点では 22.22.3）に解決されます。

```toml:mise.toml
[tools]
node = "22.22.3"   # 完全指定。22.22.3 に固定
python = "3.13"    # 部分指定。3.13 系の最新に解決
```

### latest と lts

`latest` は、ツールの最新の安定版を解決します[^tools]。`lts` は、長期サポート版（Long Term Support）のうち最新のものを解決します[^tools]。`lts` は、Node.js のように LTS の概念を持つツールで利用できます。

```toml:mise.toml
[tools]
node = "lts"      # 最新の LTS に解決
python = "latest" # 最新の安定版に解決
```

:::message
`latest` と `lts` は、インストール時点での最新版に解決されます。インストール後はバージョンが固定され、自動では更新されません。最新版へ追従するには、ツールを再インストールします。再インストールの操作は第 5 章で扱います。
:::

### 複数バージョンの指定

値を配列にすると、同じツールの複数バージョンを併存させます[^tools]。配列の先頭のバージョンが、コマンドを実行したときに優先して使われます。

```toml:mise.toml
[tools]
go = ["1.22", "1.21"]
```

上記の例では、go の 1.22 系と 1.21 系の両方をインストールし、既定では 1.22 系を使います。複数バージョンを併存させる用途と、一時的に別バージョンを使う `mise exec` の使い分けは、第 5 章で扱います。

### 特殊なバージョン指定

mise は、接頭辞を付けた特殊なバージョン指定にも対応します。主な指定を次の表にまとめます[^tools]。

| 指定 | 記法の例 | 意味 |
| --- | --- | --- |
| `prefix:` | `prefix:22` | 接頭辞に一致する最新バージョンを明示的に解決します。`22` のような部分指定と同じ結果になります |
| `ref:` | `ref:master` | Git のブランチ・タグ・コミットを指定し、ソースからビルドします |
| `path:` | `path:/opt/node` | 指定したパスにある実行ファイルを使います。mise はインストールやビルドを行いません |
| `sub-N:` | `sub-1:lts` | 基準となるバージョンから N を引いたバージョンを解決します。`sub-1:lts` は最新 LTS の 1 つ前のメジャー系列を選びます |

`sub-N:` は、基準のバージョンから指定した数を引きます。`sub-1:lts` は、最新 LTS が Node.js 24 系のとき、1 つ前の 23 系に解決されます。`sub-0.1:latest` は、最新が 3.14 系のとき、マイナー番号を 0.1 引いて 3.13 系に解決されます。

## .tool-versions（asdf 互換）

mise は、asdf[^asdf] が使う `.tool-versions` 形式の設定ファイルも読み込みます[^config]。asdf からの移行時に、既存の `.tool-versions` をそのまま利用できます。`.tool-versions` は、1 行に 1 ツールを「ツール名 バージョン」の形式で書きます。

```text:.tool-versions
node 22.22.3
python 3.13.7
```

`.tool-versions` は、mise.toml と同じディレクトリ階層の探索の対象です。ただし、同じディレクトリに mise.toml と `.tool-versions` の両方がある場合、mise.toml が優先されます[^config]。新規のプロジェクトでは mise.toml を使い、`.tool-versions` は asdf からの移行や互換性の維持に用います。asdf からの移行手順は第 17 章で扱います。

:::message
`.tool-versions` は `[env]` や `[tasks]` を記述できません。環境変数やタスクを使う場合は mise.toml を使います。mise.toml は、`.tool-versions` の機能を包含します。
:::

## 本章のまとめ

- mise.toml は、プロジェクトで使うツールのバージョンや環境変数、タスクを宣言する TOML 形式の設定ファイルです。`[tools]` セクションにツール名とバージョンを並べます。
- 設定ファイルには、プロジェクト単位の mise.toml、グローバルの `~/.config/mise/config.toml`、asdf 互換の `.tool-versions` があります。mise.toml には別名 `.mise.toml` と、個人用の上書き設定 `mise.local.toml` があります。
- mise はカレントディレクトリから親ディレクトリへさかのぼって設定ファイルを探索し、グローバル設定ファイルも合わせて読み込みます。読み込み中の設定ファイルは `mise config ls` で確認できます。
- 同じツールを複数のファイルが宣言する場合、カレントディレクトリに近いファイルが優先されます。ローカルの mise.toml はグローバル設定ファイルより優先されます。
- `[tools]` のバージョン指定には、完全指定・部分指定・`latest`・`lts`・配列による複数指定・`prefix:`・`ref:`・`path:`・`sub-N:` があります。
- 同じディレクトリに mise.toml と `.tool-versions` の両方がある場合、mise.toml が優先されます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^toml]: TOML（Tom's Obvious, Minimal Language）は、設定ファイル向けの記述形式です。仕様は TOML 公式サイトを参照してください。<https://toml.io/ja/>
[^asdf]: asdf は、複数言語のバージョンを 1 つのツールで管理するバージョンマネージャです。mise は asdf の `.tool-versions` と互換性があります。<https://asdf-vm.com/>
[^config]: 設定ファイルの種類・ファイル名・探索順・優先順位、および `.tool-versions` の扱い。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^config-ls]: `mise config ls` の仕様。mise 公式ドキュメント「mise config ls」<https://mise.jdx.dev/cli/config/ls.html>
[^tools]: `[tools]` のバージョン指定構文（完全指定・部分指定・`latest`・`lts`・配列・`prefix:`・`ref:`・`path:`・`sub-N:`）。`prefix:`・`ref:`・`path:`・`sub-N:` の定義は mise 公式ドキュメント「Configuration」の Scopes 節 <https://mise.jdx.dev/configuration.html> に、ツール全体の概要は「Tools」<https://mise.jdx.dev/dev-tools/> にあります。
