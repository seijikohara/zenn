---
title: "環境変数の管理"
---

本章では、mise の `[env]` セクションでプロジェクト固有の環境変数を管理する方法を扱います。読了後には、環境変数を `mise.toml` で宣言し、`.env` ファイルの読み込みや direnv の代替として mise を使えるようになります。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。`mise.toml` の構文は第 4 章で扱いました。第 7 章では Python の仮想環境を `_.python.venv` で自動有効化し、第 8 章では Go の toolchain を固定するために `[env]` で `GOTOOLCHAIN` を設定しました。第 7 章と第 8 章は `[env]` の一般的な使い方を本章へ誘導しています。本章は `[env]` の総説として、変数の定義から `.env` 連携・機密情報・direnv との関係までをまとめます。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期や設定によって、表示される内容は変わります。

## env セクションの基本

`mise.toml` の `[env]` セクションは、プロジェクトで使う環境変数を宣言します[^env]。`mise activate` でシェルに mise を組み込むと、`[env]` を持つディレクトリへ入ったときに mise が環境変数を設定し、ディレクトリを離れると解除します。環境変数の設定・解除を手動で行う必要はありません。`mise activate` の設定は第 3 章で扱いました。

### 変数の定義

変数は `KEY = "value"` の形式で定義します[^env]。次の例は、`NODE_ENV` と `APP_NAME` の 2 つを定義します。

```toml:mise.toml
[env]
NODE_ENV = "development"
APP_NAME = "my-app"
```

### 他の変数や既存の環境変数を参照する

`[env]` の値には、mise のテンプレートを書けます[^env]。テンプレートは Tera[^tera] という記法で評価されます。既存の環境変数は `{{env.KEY}}` で参照します[^env]。次の例は、既存の `PATH` の先頭に `/custom` を加えた値を `PATH_WITH_LOCAL` に設定します。

```toml:mise.toml
[env]
PATH_WITH_LOCAL = "/custom:{{env.PATH}}"
```

`{{config_root}}` は、`mise.toml` を置いたディレクトリの絶対パスに展開されます[^env]。プロジェクトのルートを基準にパスを組み立てるときに使います。次の例は、プロジェクト直下の `config` ディレクトリへの絶対パスを `APP_CONFIG_DIR` に設定します。

```toml:mise.toml
[env]
APP_CONFIG_DIR = "{{config_root}}/config"
```

同じ `[env]` 内で先に定義した変数も、`{{env.KEY}}` で参照できます[^env]。変数の評価では定義の順序が意味を持つため、参照する変数は参照される変数より後に書きます[^env]。

### 変数を削除する

`KEY = false` と書くと、mise はすでに設定済みの環境変数を削除します[^env]。グローバルの `mise.toml` で設定した変数を、特定のプロジェクトでだけ無効化したい場合に使います。次の例は、上位の設定が定義した `NODE_ENV` を削除します。

```toml:mise.toml
[env]
NODE_ENV = false  # 上位の設定で定義された NODE_ENV を削除する
```

### 既定値を設定する

`KEY = { default = "value" }` と書くと、変数が未設定または空のときだけ既定値を設定します[^env]。すでに値が設定済みの場合は、既存の値を保持します。利用者が任意で上書きできる変数に既定値を与えるときに使います。

```toml:mise.toml
[env]
APP_ENV = { default = "development" }  # 未設定なら development を使う
```

### mise env で確認する

`mise env` は、`[env]` の評価結果を環境変数として出力します[^cli-env]。`mise activate` を使わない構成でも、`eval "$(mise env)"` で一度だけ環境変数を読み込めます。シェルは `-s`（`--shell`）で指定します。次の例は、前掲の変数を定義したプロジェクトで `mise env -s bash` を実行した結果です。

```shell
$ mise env -s bash
export APP_CONFIG_DIR=~/work/my-app/config
export APP_NAME=my-app
export NODE_ENV=development
export PATH='~/work/my-app/bin:/usr/local/bin:...'
```

mise は変数をキー名で整列して出力します。値に `:` などの特殊文字を含む場合は、mise が単一引用符で囲みます。`PATH` には `_.path` で追加したディレクトリが含まれ、区切りの `:` を含むため引用符が付きます。出力例のホームディレクトリは、実際にはフルパスで表示されます。本書では可読性のため `~` と `...` で短縮します。`--json` で JSON 形式、`--dotenv` で `KEY=value` 形式の出力も選べます[^cli-env]。

:::message
`mise env` は環境変数を出力するだけで、シェルには適用しません。シェルへ反映するには `eval "$(mise env -s bash)"` のように評価します。常時自動で反映する場合は、第 3 章で扱った `mise activate` を使います。
:::

### mise set と mise unset で編集する

`mise set` と `mise unset` は、`mise.toml` の `[env]` をコマンドで編集します[^cli-set][^cli-unset]。エディタを開かずに変数を追加・削除できます。`mise set` を引数なしで実行すると、現在の環境変数を名前・値・定義元のファイルの一覧で表示します[^cli-set]。

```shell
$ mise set
NODE_ENV      development                     ~/work/my-app/mise.toml
APP_NAME      my-app                          ~/work/my-app/mise.toml
DATABASE_URL  postgres://localhost:5432/myapp ~/work/my-app/.env
```

変数を追加・変更するには、`KEY=value` を渡します[^cli-set]。次の例は、`NODE_ENV` を `production` に設定します。コマンドは `mise.toml` の `[env]` を直接書き換えます。

```shell
$ mise set NODE_ENV=production
```

変数を削除するには、`mise unset` にキー名を渡します[^cli-unset]。次の例は、`mise.toml` から `NODE_ENV` の行を削除します。

```shell
$ mise unset NODE_ENV
```

既定では、`mise set` と `mise unset` はカレントディレクトリの `mise.toml` を対象とします。グローバルの設定を編集するには、`-g`（`--global`）を付けます[^cli-set][^cli-unset]。

## PATH への追加

`_.path` ディレクティブは、PATH にディレクトリを追加します[^env]。プロジェクト内のスクリプトや、依存パッケージが置く実行ファイルを PATH へ通す用途で使います。先頭が `_.` で始まるキーは、通常の環境変数ではなく mise が解釈する特殊なディレクティブです。

文字列で 1 つのディレクトリを指定します。相対パスは `mise.toml` のあるディレクトリが基準です[^env]。次の例は、プロジェクト直下の `bin` を PATH に追加します。

```toml:mise.toml
[env]
_.path = "./bin"
```

複数のディレクトリを追加するには、配列で指定します[^env]。`~` はホームディレクトリに、`{{config_root}}` は `mise.toml` のあるディレクトリに展開されます。

```toml:mise.toml
[env]
_.path = ["~/.local/bin", "{{config_root}}/node_modules/.bin"]
```

`_.path` で追加したディレクトリは、既存の PATH の先頭に置かれます。前掲の `mise env` の出力では、`PATH` の先頭に `~/work/my-app/bin` が追加されていました。

## .env ファイルの読み込み

`_.file` ディレクティブは、`.env` ファイルを読み込んで環境変数に展開します[^env]。多くのツールやフレームワークが利用する `.env` を、mise の環境変数として取り込めます。

文字列で 1 つのファイルを指定します。次の例は、プロジェクト直下の `.env` を読み込みます。

```toml:mise.toml
[env]
_.file = ".env"
```

読み込む `.env` の内容は、`KEY=value` の形式で書きます。

```dotenv:.env
DATABASE_URL=postgres://localhost:5432/myapp
LOG_LEVEL=debug
```

複数のファイルを読み込むには、配列で指定します[^env]。次の例は、共通の `.env` を読み込んだ後に、ローカル専用の `.env.local` を読み込みます。同じ変数を複数のファイルが定義したときに、どちらの値が残るかは `mise env` の出力で確認できます。

```toml:mise.toml
[env]
_.file = [".env", ".env.local"]
```

`_.file` のほかに、シェルスクリプトを読み込む `_.source` ディレクティブもあります[^env]。`_.source` は bash で実行できるスクリプトを source し、`export` した変数を取り込みます[^env]。`.env` 形式では表せない処理を経て変数を決める場合に使います。

```toml:mise.toml
[env]
_.source = "./setup-env.sh"
```

## 機密情報の扱い

API キーやデータベースのパスワードなどの機密情報は、扱いに注意します。平文の値を `mise.toml` に直接書いたり、平文の `.env` をバージョン管理システムにコミットしたりすると、機密情報がリポジトリの履歴に残ります。

### コミットしない運用

機密情報を含むファイルは、`.gitignore` に追加してコミット対象から外します。次の例は、`.env` とローカル専用の設定をコミットから除外します。

```text:.gitignore
.env
.env.local
mise.local.toml
```

`_.file` で読み込むファイル名を `.env` のように固定しておけば、`.gitignore` の 1 行で除外できます。チームには `.env` のキーだけを書いた `.env.example` を共有し、各自が値を埋めて `.env` を作る運用がとれます。

### 暗号化された環境変数

mise は、sops[^sops] と age[^age] で暗号化した環境変数の読み込みに対応します[^secrets]。暗号化したファイルをリポジトリにコミットし、復号鍵を持つ環境でだけ値を展開できます。sops で暗号化した `.env.json` などは、通常の `_.file` で読み込みます[^secrets-sops]。age は、`mise set --age-encrypt` で個々の値を暗号化します[^secrets-age]。

:::message
mise の暗号化機能（sops・age）は experimental（試験的機能）です[^secrets]。利用するには `mise settings set experimental=true` で試験的機能を有効にし、別途 sops や age のバイナリと復号鍵を用意します[^secrets-age]。設定方法の詳細は mise 公式ドキュメントの secrets ページで扱います[^secrets]。チームでの機密情報の共有は第 15 章で扱います。
:::

`_.file` や `_.source` には、出力をマスクする `redact` オプションがあります[^env]。`{ path = ".env", redact = true }` のようにテーブルで指定すると、mise は読み込んだ変数の値をログなどで伏せ字にします[^env]。

```toml:mise.toml
[env]
_.file = { path = ".env", redact = true }  # 読み込んだ値をマスクする
```

## direnv との比較

direnv[^direnv] は、ディレクトリ単位で環境変数を設定するツールです。`.envrc` に変数を書き、ディレクトリへ入ったときに読み込みます。mise の `[env]` セクションは、direnv の主用途であるディレクトリ単位の環境変数の設定を代替できます[^mise-direnv]。

direnv の `.envrc` と mise の `[env]` は、どちらもディレクトリ単位で環境変数を設定します。mise を使う場合は、バージョン管理する `mise.toml` の `[env]` に環境変数をまとめられます。ツールのバージョン管理（`[tools]`）と環境変数（`[env]`）を 1 つのファイルで宣言できるため、direnv を別に導入せずにプロジェクトの設定を一元化できます。

mise の公式ドキュメントは、mise と direnv を併用しないことを推奨します[^mise-direnv]。direnv との非互換から生じる問題は mise の不具合として扱わない、と明記しています[^mise-direnv]。direnv をすでに使っている場合は、`.envrc` の環境変数を `mise.toml` の `[env]` へ移し、mise に一本化する方針がとれます。

:::message
mise には direnv 連携用の `mise direnv activate` サブコマンドがありますが、`.envrc` で使う `use mise` 記法は非推奨です[^mise-direnv]。新規に環境を構築する場合は、direnv を介さずに mise の `[env]` を使います。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、`[env]` を使う `mise.toml` の例を示します。Node.js のバージョンを固定し、環境変数を定義し、`.env` を読み込み、プロジェクトの `bin` を PATH に追加します。

```toml:mise.toml
[tools]
node = "22.20.0"  # Node.js のバージョンを固定

[env]
NODE_ENV = "development"               # アプリケーションの動作環境
APP_CONFIG_DIR = "{{config_root}}/config"  # 設定ファイルの場所
_.path = "./bin"                       # プロジェクトの bin を PATH に追加
_.file = ".env"                        # .env を読み込む
```

`.env` には、機密情報を含む変数を書きます。`.gitignore` に `.env` を追加してコミットから除外します。

```dotenv:.env
DATABASE_URL=postgres://localhost:5432/myapp
LOG_LEVEL=debug
```

設定後、プロジェクトのディレクトリで `mise env` を実行すると、`[env]` と `.env` の内容をあわせた環境変数を確認できます。

```shell
$ mise env -s bash
export APP_CONFIG_DIR=~/work/my-app/config
export DATABASE_URL='postgres://localhost:5432/myapp'
export LOG_LEVEL=debug
export NODE_ENV=development
export PATH='~/work/my-app/bin:/usr/local/bin:...'
```

`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じ環境変数とパスの設定を共有できます。機密情報を含む `.env` はコミットせず、各自が用意します。

## 本章のまとめ

- mise の `[env]` セクションは、プロジェクト固有の環境変数を宣言します。`mise activate` を使うと、ディレクトリへの出入りに応じて環境変数を自動で設定・解除します。
- 変数は `KEY = "value"` で定義します。`{{env.KEY}}` で既存の変数を、`{{config_root}}` で `mise.toml` のあるディレクトリを参照します。`KEY = false` で削除し、`{ default = "value" }` で既定値を設定します。
- `mise env` で評価結果を確認し、`mise set` と `mise unset` で `[env]` をコマンドから編集します。
- `_.path` は PATH にディレクトリを追加し、`_.file` は `.env` を読み込み、`_.source` はシェルスクリプトを source します。
- 機密情報は `.gitignore` でコミットから除外します。mise は sops・age による暗号化（experimental）にも対応します。
- mise の `[env]` は direnv のディレクトリ単位の環境変数を代替します。mise 公式は direnv との併用を推奨せず、mise への一本化を案内します。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^env]: mise の `[env]` セクションの仕様。変数の定義と参照（`{{env.KEY}}`・`{{config_root}}`）、`KEY = false` での削除、`{ default = ... }` での既定値を扱います。`_.path`・`_.file`・`_.source` の各ディレクティブと `redact` オプションも含みます。mise 公式ドキュメント「Environments」<https://mise.jdx.dev/environments/>
[^tera]: mise のテンプレートが使う記法。Tera 公式ドキュメント<https://keats.github.io/tera/docs/>
[^cli-env]: `mise env` コマンド（環境変数の出力・`-s`/`--shell`・`--json`・`--dotenv`）。mise 公式ドキュメント「mise env」<https://mise.jdx.dev/cli/env.html>
[^cli-set]: `mise set` コマンド（環境変数の一覧表示・`KEY=value` での設定・`-g`/`--global`）。mise 公式ドキュメント「mise set」<https://mise.jdx.dev/cli/set.html>
[^cli-unset]: `mise unset` コマンド（環境変数の削除・`-g`/`--global`）。mise 公式ドキュメント「mise unset」<https://mise.jdx.dev/cli/unset.html>
[^sops]: 構造化ファイルを暗号化するツール。SOPS 公式リポジトリ<https://github.com/getsops/sops>
[^age]: ファイル暗号化ツールおよびフォーマット。age 公式リポジトリ<https://github.com/FiloSottile/age>
[^secrets]: mise の機密情報管理（sops・age への対応、experimental である点）。mise 公式ドキュメント「Secrets」<https://mise.jdx.dev/environments/secrets/>
[^secrets-sops]: sops で暗号化した環境変数ファイルの読み込み（`_.file` での読み込み・experimental・前提となる sops と age のバイナリと鍵）。mise 公式ドキュメント「sops」<https://mise.jdx.dev/environments/secrets/sops.html>
[^secrets-age]: age による環境変数の暗号化（`mise set --age-encrypt`・鍵の用意）。mise 公式ドキュメント「age」<https://mise.jdx.dev/environments/secrets/age.html>
[^direnv]: ディレクトリ単位で環境変数を設定するツール。direnv 公式サイト<https://direnv.net/>
[^mise-direnv]: mise と direnv の関係（mise が direnv を代替できる点・併用を推奨しない公式の見解・`mise direnv activate`・`use mise` が非推奨である点）。mise 公式ドキュメント「direnv」<https://mise.jdx.dev/direnv.html>
