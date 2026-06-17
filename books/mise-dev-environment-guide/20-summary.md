---
title: "まとめ"
---

本章は、本書全 20 章で扱った内容を総括し、mise[^mise] の推奨構成を 1 つの `mise.toml` にまとめ、次の一歩を示します。読了後には、複数言語のランタイム・CLI ツール・環境変数・タスクを 1 つの設定ファイルで宣言し、チームと CI で再現できる状態に到達します。

本章のバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。OS は macOS（既定のシェルは zsh）を前提とします。

## mise 運用のベストプラクティス

本書を通じて示した運用方針を 5 点にまとめます。各項目は、該当する章で詳しく扱いました。

設定を 1 つの `mise.toml` に集約します。ツールのバージョン・環境変数・タスクを 1 ファイルで宣言し、プロジェクトの設定を一元管理します（第 4 章）。言語別のバージョン管理ツールを併用せず、mise に統合します。

再現性が必要なプロジェクトでは、バージョンを固定します。`[tools]` で完全指定するか、ロックファイル `mise.lock` で解決済みのバージョンとチェックサムを固定します（第 5・15 章）。緩いバージョン指定を保ちながら全員のバージョンをそろえる場合は、`[tools]` を部分指定にして `mise.lock` を併用します。

チームで設定とロックファイルを共有します。`mise.toml` と `mise.lock` をバージョン管理システムにコミットし、新メンバーは `mise install` を一度実行して環境をそろえます（第 15 章）。

CI で同じ設定を再利用します。`jdx/mise-action` などで `mise.toml` のツールを導入し、ローカルと CI のバージョンをそろえます（第 16 章）。

環境変数とタスクを `mise.toml` で管理します。`[env]` でプロジェクト固有の環境変数と PATH を宣言し（第 13 章）、`[tasks]` で lint・test などの定型作業を定義します（第 14 章）。

## つまずきやすい点

本書で扱った落とし穴を再確認します。各項目は、該当する章で対処方法を示しました。

idiomatic version files は、mise 2025.10.0 以降、既定で無効です（第 6 章）。`.nvmrc` や `.python-version` を読み込むには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。設定をしないと、`.nvmrc` などのバージョンファイルは反映されません。

PATH activation の有効化が漏れると、mise の管理外のバージョンが使われます（第 3・19 章）。シェルの設定に `mise activate` を追記し、シェルへ反映します。`mise doctor` の `activated` 行で有効化を確認します。

PATH activation と shims を同時に有効にすると、PATH 解決の経路が二重になります（第 5・19 章）。対話的なシェルでは PATH activation を選び、対話的でない実行を主とする場合は shims を選び、どちらか一方を有効にします。

Go は、`go.mod` の `go` ディレクティブが指すバージョンによっては、`GOTOOLCHAIN` の働きで mise が固定したバージョンと異なるツールチェーンを自動で取得します（第 8 章）。mise が固定したバージョンを使うには、`GOTOOLCHAIN=local` を設定します。

`[env]` のテンプレートやスクリプトを含む `mise.toml` は、信頼するまで読み込まれません（第 15 章）。`mise trust` で設定ファイルを信頼します。プレーンな `[tools]` だけの設定は、信頼を要しません。

## 推奨構成の mise.toml

本書の要点をまとめた `mise.toml` の最終形を次に示します。`[settings]`・`[tools]`・`[env]`・`[tasks]` を 1 ファイルにまとめ、複数言語と CLI ツール・環境変数・定型タスクを宣言します。

```toml:mise.toml
[settings]
lockfile = true        # mise.lock の読み書きを明示する（既定でも有効）

[tools]
node = "22"            # 22 系。解決されるバージョンは mise.lock で固定
python = "3.13"        # 3.13 系。解決されるバージョンは mise.lock で固定
jq = "1.7"             # JSON 処理ツール

[env]
NODE_ENV = "development"                    # アプリケーションの動作環境
APP_CONFIG_DIR = "{{config_root}}/config"   # 設定ファイルの場所
_.path = "./bin"                            # プロジェクトの bin を PATH に追加
_.file = ".env"                             # .env を読み込む

[tasks.lint]
description = "ソースコードを静的解析する"
run = "eslint ."

[tasks.test]
description = "テストを実行する"
depends = ["lint"]     # lint の後に実行する
run = "vitest run"
```

各セクションの役割を補足します。`[settings]` の `lockfile` は、ロックファイル `mise.lock` の読み書きを制御します[^lockfile]。`lockfile` は既定（未設定）で有効で、`mise.lock` があれば読み書きします。`lockfile = true` は既定の挙動を明示する指定で、`lockfile = false` で無効にできます[^lockfile]。`[tools]` は、Node.js・Python・jq を部分指定で宣言します。部分指定でも、`mise.lock` を併用すると、解決されるバージョンを全員でそろえられます[^tools]。`[env]` は、環境変数 `NODE_ENV`・`APP_CONFIG_DIR` を定義し、`_.path` でプロジェクトの `bin` を PATH へ追加し、`_.file` で `.env` を読み込みます[^env]。`[tasks]` は、`lint` と `test` を定義し、`test` の `depends` で `lint` を先に実行します[^tasks]。

ロックファイル `mise.lock` は、自動では生成されません[^mise-lock]。空の `mise.lock` を用意してから `mise install` を実行するか、`mise lock` を実行すると生成します[^lockfile]。

```shell
$ touch mise.lock
$ mise install
```

生成した `mise.lock` は、`mise.toml` と併せてバージョン管理システムにコミットします[^mise-lock]。リポジトリをクローンした開発者は、プロジェクトのディレクトリで `mise install` を一度実行すると、`[tools]` のツールがすべて手元にそろいます[^cli-install]。`mise.lock` を共有しているため、導入されるバージョンはチームの全員でそろいます。

:::message
`mise install` は、ツールを導入するだけで `mise.toml` を書き換えません。`mise.lock` が無いプロジェクトに `mise install` を実行しても、`mise.lock` は生成されません。ロックファイルを使う場合は、空の `mise.lock` を用意してから `mise install` を実行します。`mise.lock` があれば、`mise install` と `mise use` が解決済みのバージョンで `mise.lock` を更新します。
:::

## 次の一歩

本書は、mise の基礎から複数言語・CLI ツール・環境変数・タスク・CI・チーム共有・移行までを扱いました。さらに踏み込む場合は、mise 公式ドキュメント[^docs]を一次情報として参照します。コマンドの仕様・設定項目・backend の対応は、公式ドキュメントで最新の情報を確認できます。

本書で扱わなかった発展的なトピックを次に挙げます。深入りはしません。各トピックの存在を知り、必要になったら公式ドキュメントで調べる足がかりとしてください。

- Windows ネイティブと WSL（Windows Subsystem for Linux）での利用。本書は macOS を前提としました。
- 本書で扱った backend 以外の backend。aqua・github・ubi・asdf・vfox 以外にも、ツールを取得する方式があります（第 12 章）。
- 暗号化した機密情報の運用。mise は sops・age による暗号化に対応します（experimental）。設定方法は公式ドキュメントの Secrets ページで扱います（第 13 章）。

## 本書のまとめ

- 設定を 1 つの `mise.toml` に集約し、複数言語のランタイム・CLI ツール・環境変数・タスクを一元管理します（第 4 章）。言語別のバージョン管理ツールを併用せず、mise に統合します。
- バージョンの固定は、`[tools]` の完全指定か、ロックファイル `mise.lock` で行います（第 5・15 章）。部分指定と `mise.lock` を併用すると、緩い指定を保ちながら解決されるバージョンをそろえられます。
- チームでは `mise.toml` と `mise.lock` をコミットして共有し、新メンバーは `mise install` で環境をそろえます（第 15 章）。CI でも同じ設定を再利用します（第 16 章）。
- つまずきやすい点は、idiomatic version files の既定無効（第 6 章）と、PATH activation の有効化漏れ・shims との競合（第 3・5・19 章）です。Go の `GOTOOLCHAIN`（第 8 章）と `mise trust`（第 15 章）も該当します。各章で対処方法を示しました。
- さらに踏み込む場合は、mise 公式ドキュメントを一次情報として参照します。Windows・WSL、より多くの backend、暗号化した機密情報の運用などの発展的なトピックがあります。

[^mise]: mise は、複数言語のランタイムや CLI ツールのバージョンを管理する開発環境マネージャです。旧称は rtx です。詳細は第 2 章で説明します。
[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^docs]: mise 公式ドキュメント。<https://mise.jdx.dev> を参照してください。
[^tools]: `[tools]` のバージョン指定構文（完全指定・部分指定・`latest`・`lts`・配列・`prefix:`・`ref:`・`path:`・`sub-N:`）。`prefix:`・`ref:`・`path:`・`sub-N:` の定義は mise 公式ドキュメント「Configuration」の Scopes 節 <https://mise.jdx.dev/configuration.html> に、ツール全体の概要は「Tools」<https://mise.jdx.dev/dev-tools/> にあります。
[^env]: mise の `[env]` セクションの仕様。変数の定義と参照（`{{env.KEY}}`・`{{config_root}}`）、`KEY = false` での削除、`{ default = ... }` での既定値を扱います。`_.path`・`_.file`・`_.source` の各ディレクティブと `redact` オプションも含みます。mise 公式ドキュメント「Environments」<https://mise.jdx.dev/environments/>
[^tasks]: mise のタスク機能の概要（タスクの定義方法・`[tools]` と `[env]` の反映・TOML タスクとファイルタスクの 2 形態）。mise 公式ドキュメント「Tasks」<https://mise.jdx.dev/tasks/>
[^lockfile]: ロックファイルの設定（`lockfile` 設定・既定値 None・`mise.lock` の命名規則・生成方法・`lockfile_platforms`）。mise 公式ドキュメント「Settings」の lockfile 節 <https://mise.jdx.dev/configuration/settings.html#lockfile>
[^mise-lock]: ロックファイル `mise.lock` の概要（役割・自動生成されない点・コミットの方針・`mise.local.lock` を除外する点）。mise 公式ドキュメント「mise.lock Lockfile」<https://mise.jdx.dev/dev-tools/mise-lock.html>
[^cli-install]: `mise install` コマンド（引数なしで `mise.toml` の全ツールを導入する点・並列インストール・インストール先・`--locked`）。mise 公式ドキュメント「mise install」<https://mise.jdx.dev/cli/install.html>
