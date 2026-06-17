---
title: "mise とは"
---

本章では、mise の位置づけと、言語別のバージョン管理ツールを 1 つに統合する利点を説明します。読了後には、mise が何を解決するツールなのかを理解し、第 3 章のインストールへ進めます。

本章は概念の説明を中心とし、コマンドは最小限にとどめます。インストール手順は第 3 章、設定ファイル `mise.toml` の構文は第 4 章、バージョン操作のコマンドは第 5 章で扱います。

## 言語別ツールを併用する負担

開発者は、言語ごとに専用のバージョン管理ツールを使うことが多くあります。各ツールは、対象言語のバージョンを切り替える機能を提供します。次の言語別ツールが広く使われています。

- Node.js には nvm。
- Python には pyenv。
- Ruby には rbenv。

3 つの言語を扱うプロジェクトでは、3 つのツールを併用します。ツールごとに、インストール方法・設定ファイル・コマンド体系が異なります。次の表は、3 つのツールの設定ファイルとバージョン切り替えコマンドの違いを示します[^nvm][^pyenv][^rbenv]。

| ツール | 対象言語 | 設定ファイル | バージョンを固定するコマンド |
| --- | --- | --- | --- |
| nvm | Node.js | `.nvmrc` | `nvm use` |
| pyenv | Python | `.python-version` | `pyenv local` |
| rbenv | Ruby | `.ruby-version` | `rbenv local` |

ツールごとに設定ファイルの名前が異なり、コマンドの体系も統一されていません。併用には次の負担が伴います。

- 新しいメンバーがプロジェクトへ参加するたびに、3 つのツールの導入と使い方を説明します。
- 開発環境を更新するときも、3 つのツールを個別に管理します。
- 言語が増えるほど、併用するツールと覚える操作が増えます。

## mise の位置づけ

mise は、複数言語のランタイムや CLI ツールのバージョンを、1 つのツールと 1 つの設定ファイルで横断管理するツールです[^about]。設定ファイルは `mise.toml` です。Node.js・Python・Ruby・Go など複数の言語を、`mise.toml` の `[tools]` セクションにまとめて宣言します。

次の `mise.toml` は、Node.js・Python・Go の 3 言語のバージョンを 1 ファイルで宣言します。

```toml:mise.toml
[tools]
node = "22"
python = "3.13"
go = "1.24"
```

nvm・pyenv・rbenv で同じ 3 言語を管理する場合、3 つのツールと 3 つの設定ファイル（`.nvmrc`・`.python-version`・`.ruby-version`）が必要です。mise は、1 つの `mise.toml` に集約します。ディレクトリを移動すると、mise が `mise.toml` を読み込み、宣言されたバージョンのツールを PATH 上で有効にします[^about]。

mise が扱うのは、ツールのバージョンだけではありません。`mise.toml` には、次のセクションもあります[^about]。

- 環境変数を定義する `[env]` セクション。管理は第 13 章で扱います。
- タスクを定義する `[tasks]` セクション。実行は第 14 章で扱います。

本章では、mise がバージョン管理に加えて環境変数とタスクも 1 つの設定ファイルで扱える点を押さえてください。

## nvm・pyenv・rbenv との違い

mise と言語別ツールの違いを、3 つの観点で整理します。

### 1 つのツールで複数言語を管理する

nvm・pyenv・rbenv は、それぞれ Node.js・Python・Ruby の単一言語を対象とします[^nvm][^pyenv][^rbenv]。複数言語を扱うには、言語の数だけツールを導入します。mise は、1 つのツールで複数言語のバージョンを管理します[^about]。新しい言語を追加するときも、別のツールを導入せず、`mise.toml` にツール名を 1 行加えます。

### 設定を 1 ファイルに集約する

言語別ツールは、言語ごとに別の設定ファイルを使います。mise は、複数言語のバージョンを `mise.toml` の `[tools]` セクションに集約します。設定ファイルが 1 つになり、バージョン管理システムにコミットするファイルも 1 つで済みます。

### 起動の速さ

各ツールは、次の仕組みでコマンドを有効にします。

| ツール | 起動の仕組み |
| --- | --- |
| nvm | シェルの起動時にシェル関数として読み込まれます |
| pyenv・rbenv | shims と呼ばれる仕組みでコマンドを横取りします |
| mise | Rust で実装されています[^architecture] |

mise は PATH activation と shims の 2 つの方式に対応し、対話的なシェルでは PATH activation を推奨します。2 つの方式の挙動差は第 5 章で扱います。

言語別ツールにも利点があります。次の点が挙げられます。

- 単一言語に特化しているため、対象言語の事情に踏み込んだ機能を持つ場合があります。
- 広く使われており、利用例や情報も多く蓄積されています。

mise は、複数言語の統合管理と設定の一元化を主な利点とします。

:::message
mise は、nvm・pyenv・rbenv が使う既存の設定ファイル（`.nvmrc`・`.python-version`・`.ruby-version`）や、asdf 互換の `.tool-versions` を読み込めます[^idiomatic]。言語別ツールから段階的に移行できます。移行の手順は第 17 章で扱います。
:::

## rtx から mise への改名

mise は、開発初期に rtx という名前で公開されていました。2024 年 1 月に rtx から mise へ改名しました[^rename]。改名の理由は、rtx という名前が NVIDIA の GPU 製品の名称と混同されるためです[^rename]。

:::message
過去の記事やコマンド例では、rtx の名前が残っている場合があります。rtx と mise は同じツールを指します。現在の名前は mise であり、コマンド名も `mise` です。本書は、改名後の名前 mise で統一します。
:::

正式名称は mise-en-place です[^about]。料理で「すべてを定位置に」を意味するフランス語の調理用語に由来します[^about]。ツール名・コマンド名としては mise を使います。

## backends とプラグイン

mise が管理できるのは、言語ランタイムだけではありません。mise は backends と呼ばれる仕組みを通じて、CLI ツールやフォーマッタなど、言語以外のツールも管理します[^backends]。backends は、ツールの入手元ごとに用意された取得の仕組みです。

mise が対応する主な backends には、次の種類があります[^backends]。

| backend | 概要 |
| --- | --- |
| core | mise が組み込みで対応する言語ランタイム。Node.js・Python・Go・Ruby など |
| aqua | aqua レジストリで配布されるツールを取得する |
| ubi | GitHub のリリースなどからバイナリを直接取得する |
| asdf | asdf のプラグインを利用してツールを取得する |
| vfox | vfox のプラグインを利用してツールを取得する |

backends により、1 つの `mise.toml` で言語ランタイムと CLI ツールをまとめて宣言できます。各 backends の使い分けは第 12 章で扱います。本章では、mise が言語以外のツールも管理できる点を押さえてください。

## mise の開発主体とライセンス

mise は、GitHub のリポジトリ jdx/mise で開発されるオープンソースソフトウェアです。作者は Jeff Dickey です[^about]。ソースコードは MIT ライセンスで公開されています[^license]。

mise は Rust で実装されています[^architecture]。本書のコマンド例は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値を用います。

## 本書で扱う範囲

本書は、mise の基礎から実践、チームへの展開までを段階的に扱います。各段階で扱う範囲は次のとおりです。

- 第 3 章から第 5 章で、インストール・設定ファイル・バージョン操作の共通の基礎を固めます。
- 第 6 章から第 12 章で、Node.js・Python・Go・Rust・JVM・Ruby の言語別の実践と、CLI ツールの管理を扱います。
- 第 13 章以降で、環境変数（env）・タスク（tasks）・CI・チーム共有・移行を扱い、mise を個人の環境からチームの標準へ広げます。

## 本章のまとめ

- nvm・pyenv・rbenv は、それぞれ Node.js・Python・Ruby の単一言語を対象とします。複数言語を扱うと、ツール・設定ファイル・コマンド体系がツールの数だけ増えます。
- mise は、複数言語のランタイムや CLI ツールのバージョンを、1 つのツールと 1 つの設定ファイル `mise.toml` で横断管理します。`mise.toml` は環境変数（`[env]`）とタスク（`[tasks]`）も扱います。
- mise の利点は、1 ツールでの複数言語管理と設定の一元化です。言語別ツールは単一言語への特化と豊富な情報を利点とします。
- mise の旧名は rtx で、2024 年 1 月に改名しました。正式名称は mise-en-place です。rtx と mise は同じツールを指します。
- mise は backends を通じて、言語ランタイムだけでなく CLI ツールも管理します。主な backends に core・aqua・ubi・asdf・vfox があります。
- mise は jdx/mise で開発される MIT ライセンスのオープンソースソフトウェアで、Rust で実装されています。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^about]: mise の概要・正式名称・設定ファイル・作者。mise 公式ドキュメント「About」<https://mise.jdx.dev/about.html>
[^architecture]: mise は Rust で実装されています。mise 公式ドキュメント「mise Architecture」<https://mise.jdx.dev/architecture.html>
[^rename]: rtx から mise への改名の理由。mise 公式ドキュメント「Coming from rtx」<https://mise.jdx.dev/rtx.html>。改名の告知（2024 年 1 月）は GitHub Discussion「rtx -> mise rename」<https://github.com/jdx/mise/discussions/1338> を参照してください。
[^backends]: mise が対応する backends の種類（core・aqua・ubi・asdf・vfox など）。mise 公式ドキュメント「Backends」<https://mise.jdx.dev/dev-tools/backends/>
[^idiomatic]: mise が読み込む既存の設定ファイル（`.nvmrc`・`.python-version`・`.tool-versions` など）。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^license]: mise は MIT ライセンスで公開されています。ライセンス全文はリポジトリの LICENSE を参照してください。<https://github.com/jdx/mise/blob/main/LICENSE>
[^nvm]: nvm は Node.js のバージョンマネージャです。設定ファイル `.nvmrc` とコマンドは公式リポジトリを参照してください。<https://github.com/nvm-sh/nvm>
[^pyenv]: pyenv は Python のバージョンマネージャです。設定ファイル `.python-version` とコマンドは公式リポジトリを参照してください。<https://github.com/pyenv/pyenv>
[^rbenv]: rbenv は Ruby のバージョンマネージャです。設定ファイル `.ruby-version` とコマンドは公式リポジトリを参照してください。<https://github.com/rbenv/rbenv>
