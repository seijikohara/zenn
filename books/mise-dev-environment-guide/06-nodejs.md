---
title: "Node.js 系"
---

本章では、Node.js とその周辺ツール（Deno・Bun・npm・pnpm・yarn）を mise で管理する方法を扱います。読了後には、Node.js のバージョンを `mise.toml` で固定し、Deno・Bun・パッケージマネージャまでを 1 つの設定ファイルにまとめて宣言できるようになります。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。本章はコマンドの基本操作を再説明せず、Node.js 固有の事情に集中します。nvm からの移行手順は第 17 章で扱います。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## Node.js のバージョン管理

mise は Node.js を core backend で組み込み対応します[^node]。core backend は、mise が標準で内蔵するツールの取得方法です。Node.js は backend の追加設定なしに、ツール名 `node` で宣言できます。backend の仕組みの詳細は第 12 章で扱います。

mise は、既定では nodejs.org が配布するプリビルドバイナリ（ビルド済みの実行ファイル）を取得します[^node]。ソースからのコンパイルは行わないため、インストールは短時間で完了します。

### バージョンの指定方法

`node` のバージョン指定には、第 4 章で説明した構文を使います。完全指定・部分指定に加えて、`lts` と `latest` のエイリアスを利用できます[^node]。

```toml:mise.toml
[tools]
node = "22.22.3"  # 完全指定。22.22.3 に固定
```

部分指定は、先頭の一部だけを書きます。`node = "22"` は、22 系の最新バージョン（執筆時点では 22.22.3）に解決されます。

`lts` は、最新の長期サポート版（Long Term Support、LTS）に解決します[^node]。執筆時点では Node.js 24 系の最新版に解決されます。`latest` は最新の安定版に解決します。

```toml:mise.toml
[tools]
node = "lts"  # 最新の LTS に解決
```

特定の LTS 系列を選ぶには、`lts/<コードネーム>` の形式を使います。Node.js の LTS には、メジャー系列ごとにコードネームが付きます。次の例は、コードネーム `jod` を持つ Node.js 22 系の最新版に解決します。

```toml:mise.toml
[tools]
node = "lts/jod"  # Node.js 22 系の最新 LTS に解決
```

主な LTS コードネームと、mise が解決するメジャー系列の対応を次の表にまとめます[^node-releases]。

| コードネーム | メジャー系列 |
| --- | --- |
| `lts/hydrogen` | 18 |
| `lts/iron` | 20 |
| `lts/jod` | 22 |

:::message
`lts` と `latest` は、インストール時点での最新版に解決します。インストール後はバージョンが固定され、自動では更新されません。再現性が必要なプロジェクトでは、完全指定でバージョンを固定します。
:::

### インストールと確認

`mise use` でバージョンを宣言し、インストールします。次の例は、プロジェクトのディレクトリで Node.js 22.22.3 を宣言します。

```shell
$ mise use node@22.22.3
mise node@22.22.3  ✓ installed
mise ~/work/my-app/mise.toml tools: node@22.22.3
```

インストール後、`node -v` で有効なバージョンを確認します。`-v` は `--version` の短縮形です。

```shell
$ node -v
v22.22.3
```

Node.js には npm が同梱されます。`npm -v` で、同梱された npm のバージョンを確認できます。

```shell
$ npm -v
10.9.8
```

### nvm の .nvmrc を読み込む

mise は、nvm が使う `.nvmrc` と、`.node-version` を読み込めます[^idiomatic]。nvm から移行する際に、既存の設定ファイルをそのまま利用できます。mise は、asdf のレガシーバージョンファイルにならって、これらを idiomatic version files と呼びます[^idiomatic]。

ただし、idiomatic version files の読み込みは既定で無効です[^idiomatic]。`.nvmrc` を置いただけでは、mise は Node.js のバージョンを解決しません。読み込みを有効にするには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools node
```

設定を追加すると、mise は `.nvmrc` の内容を Node.js のバージョンとして解決します。次の例は、`22.22.3` を記述した `.nvmrc` を読み込んだ結果です。`Source` 列が `.nvmrc` を指します。

```shell
$ mise ls node
Tool  Version   Source                   Requested
node  22.22.3   ~/work/my-app/.nvmrc     22.22.3
```

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。新規のプロジェクトでは `mise.toml` を使い、`.nvmrc` は nvm からの移行や互換性の維持に用います。nvm からの移行手順は第 17 章で扱います。
:::

## Deno と Bun

mise は、Node.js 以外の JavaScript ランタイムである Deno と Bun も管理できます。どちらも core backend で組み込み対応します[^deno][^bun]。ツール名 `deno`・`bun` で、Node.js と同じく `mise.toml` に宣言します。

```toml:mise.toml
[tools]
deno = "latest"
bun = "latest"
```

バージョン指定の構文は Node.js と共通です。完全指定・部分指定・`latest` を利用できます[^deno][^bun]。`deno = "2"` は 2 系の最新版に、`bun = "1"` は 1 系の最新版に解決します。

インストール後の確認コマンドは、ツールごとに異なります。Deno は `deno --version` で、本体・V8・TypeScript の 3 行を出力します[^deno-version]。

```shell
$ deno --version
deno 2.8.3 (stable, release, x86_64-apple-darwin)
v8 14.9.207.2-rusty
typescript 6.0.3
```

Bun は `bun --version` でバージョン番号だけを出力します。

```shell
$ bun --version
1.3.14
```

## パッケージマネージャの管理

Node.js のパッケージマネージャには、npm・pnpm・yarn があります。mise での扱いは、ツールごとに異なります。

### npm は Node.js に同梱される

npm は Node.js に同梱されるため、`node` をインストールすれば npm も利用できます。npm のバージョンは Node.js のバージョンに対応します。mise で npm を個別にバージョン管理する必要は、通常はありません。Node.js のバージョンを固定すれば、npm のバージョンも一定に保てます。

### pnpm と yarn のバージョン管理

pnpm と yarn は Node.js に同梱されません。mise で管理する場合は、ツール名 `pnpm`・`yarn` で宣言します。

```toml:mise.toml
[tools]
node = "22.22.3"
pnpm = "9"
```

pnpm と yarn は core backend ではなく、core 以外の backend を経由して取得します。pnpm は aqua backend でプリビルドバイナリを取得し、取得できない場合は npm レジストリ経由の backend をフォールバックとして使います[^pnpm-registry]。yarn は複数の backend に対応します[^yarn-registry]。backend の使い分けの詳細は第 12 章で扱います。

:::message alert
mise のツール名 `yarn` で取得する yarn は、Yarn 2 以降（Berry）が中心です[^yarn-registry]。Yarn 1 系（Classic）を使う場合は、`yarn = "1.22.22"` のように完全指定でバージョンを固定します。
:::

インストール後の確認は、`pnpm -v`・`yarn -v` で行います。どちらもバージョン番号だけを出力します。

```shell
$ pnpm -v
9.15.9
```

### Corepack との使い分け

Corepack は、Node.js に同梱されるパッケージマネージャ管理ツールです[^corepack]。`package.json` の `packageManager` フィールドに記述したバージョンの pnpm・yarn を、必要に応じてダウンロードして使わせます。Corepack は既定で無効で、`corepack enable` で有効にします[^corepack]。

```json:package.json
{
  "packageManager": "pnpm@9.15.9"
}
```

mise でパッケージマネージャを宣言する方法と、Corepack で `packageManager` フィールドに固定する方法は、どちらも pnpm・yarn のバージョンを固定します。両者は固定の仕組みが異なるため、併用すると優先順位の問題が起きます。プロジェクトでは、どちらか一方に統一します。使い分けの指針を次に示します。

- `mise.toml` でツールを一元管理する場合は、`pnpm`・`yarn` を `[tools]` に宣言します。Corepack は有効にしません。
- `package.json` の `packageManager` フィールドでチームのバージョンを固定する場合は、Corepack を使います。`pnpm`・`yarn` は `[tools]` に宣言しません。

mise には、Node.js のインストール後、Corepack の shim を導入する `node.corepack` 設定があります[^node]。既定では無効です。`package.json` の `packageManager` フィールドを正とする運用で、mise からも Corepack の shim を導入したい場合に利用します。

:::message
Corepack が同梱されるのは、Node.js 14.19.0 から 25.0.0 未満までです[^corepack]。Node.js 25 以降には同梱されません。Node.js 25 以降で Corepack を使う場合は、別途インストールします。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、Node.js プロジェクトの `mise.toml` の例を示します。Node.js を LTS に固定し、パッケージマネージャに pnpm を宣言します。

```toml:mise.toml
[tools]
node = "lts/jod"  # Node.js 22 系の最新 LTS に固定
pnpm = "9"        # pnpm 9 系の最新に固定
```

設定後、`mise install` でツールをまとめてインストールします。インストール後、各ツールのバージョンを確認します。

```shell
$ mise install
mise node@22.22.3  ✓ installed
mise pnpm@9.15.9   ✓ installed
$ node -v
v22.22.3
$ pnpm -v
9.15.9
```

`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じバージョンの Node.js と pnpm を使えます。

## 本章のまとめ

- mise は Node.js を core backend で組み込み対応し、nodejs.org のプリビルドバイナリを取得します。ツール名 `node` で宣言します。
- Node.js のバージョンは、完全指定・部分指定に加えて、`lts`・`latest`・`lts/<コードネーム>` で指定できます。`lts/jod` は Node.js 22 系の最新 LTS に解決します。
- mise は nvm の `.nvmrc` と `.node-version` を読み込めますが、mise 2025.10.0 以降は既定で無効です。`idiomatic_version_file_enable_tools` にツール名を追加して有効にします。
- Deno と Bun も core backend で管理できます。ツール名 `deno`・`bun` で宣言します。
- npm は Node.js に同梱され、通常は個別管理しません。pnpm と yarn は core 以外の backend で取得し、ツール名 `pnpm`・`yarn` で宣言します。
- パッケージマネージャの固定は、mise の `[tools]` と Corepack の `packageManager` フィールドのどちらか一方に統一します。Corepack は Node.js 25 以降には同梱されません。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^node]: mise での Node.js の管理（core backend・プリビルドバイナリの取得・`lts`/`latest`・`node.corepack` 設定）。既定の取得元は `node.mirror_url` 設定で変更でき、既定値は nodejs.org のリリース配布元です。mise 公式ドキュメント「Node.js」<https://mise.jdx.dev/lang/node.html>
[^node-releases]: Node.js の各 LTS 系列のコードネーム。Node.js 公式リポジトリ「Release」<https://github.com/nodejs/release#release-schedule>
[^idiomatic]: mise が読み込む idiomatic version files（`.nvmrc`・`.node-version` など）と、既定で無効である点、`idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^deno]: mise での Deno の管理（core backend・バージョン指定）。mise 公式ドキュメント「Deno」<https://mise.jdx.dev/lang/deno.html>
[^bun]: mise での Bun の管理（core backend・バージョン指定）。mise 公式ドキュメント「Bun」<https://mise.jdx.dev/lang/bun.html>
[^deno-version]: Deno のバージョン情報は、Deno 本体・V8・TypeScript の 3 要素で構成されます。Deno 公式ドキュメント「Get the current Deno version」<https://docs.deno.com/examples/deno_version/>
[^pnpm-registry]: mise での pnpm の取得（aqua backend と npm backend のフォールバック）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^yarn-registry]: mise での yarn の取得（複数 backend と Berry 系中心の扱い）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^corepack]: Corepack の概要・有効化・同梱バージョン帯（Node.js 14.19.0 から 25.0.0 未満）。Node.js 公式リポジトリ「corepack」<https://github.com/nodejs/corepack>
