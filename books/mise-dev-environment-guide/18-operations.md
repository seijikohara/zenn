---
title: "運用とアップデート"
---

本章では、導入後の mise 本体と管理対象のツールを継続的に保守する運用を扱います。読了後には、mise 本体を導入方法に応じて更新し、ツールを安全に更新・整理し、settings やプラグインを保守できるようになります。

本章は、言語別ツールを使用中で mise を導入した開発者と、チームの開発環境を標準化する運用者を主な対象とします。第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、各 backend の詳細は第 12 章、ロックファイル `mise.lock` は第 15 章で扱いました。環境変数を扱う `[env]` は第 13 章、タスクを扱う `[tasks]` は第 14 章、CI は第 16 章で扱いました。本章は導入後の保守に集中します。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示される内容は変わります。OS は macOS（既定のシェルは zsh）を前提とします。

## mise 本体を更新する

mise 本体の更新方法は、第 3 章で選んだ導入方法によって変わります。先に導入方法を確認し、対応する更新方法を選びます。

| 導入方法 | 更新方法 |
| --- | --- |
| Homebrew | `brew upgrade mise` |
| 公式インストールスクリプト | `mise self-update` |

### 導入方法を確認する

導入方法は、`mise` 実行ファイルの配置先で判別できます。配置先は `which mise` で確認します。

```shell
$ which mise
/opt/homebrew/bin/mise
```

配置先と導入方法は、第 3 章で扱った 2 通りの導入方法に対応します。

| 配置先 | 導入方法 |
| --- | --- |
| `/opt/homebrew` 以下 | Homebrew |
| `~/.local/bin/mise` | 公式インストールスクリプト |

:::message
Homebrew の配置先は CPU アーキテクチャによって変わります。Apple シリコンでは `/opt/homebrew`、Intel では `/usr/local` です。
:::

### Homebrew で導入した場合

Homebrew で導入した mise は、Homebrew で更新します。次のコマンドは、Homebrew のパッケージ情報を更新してから mise を更新します。

```shell
$ brew update
$ brew upgrade mise
```

`brew update` は Homebrew が参照するパッケージ情報を最新化し、`brew upgrade mise` は mise を最新のバージョンへ更新します。更新後、`mise --version` で反映を確認します。`mise --version` の確認方法は第 3 章で扱いました。

:::message
Homebrew で導入した mise に対して `mise self-update` を実行すると、mise は更新せず、パッケージマネージャ経由では利用できないと案内します[^self-update]。Homebrew で導入した場合は `brew upgrade mise` を使います。
:::

### インストールスクリプトで導入した場合

公式インストールスクリプトで導入した mise は、`mise self-update` で更新します[^self-update]。`mise self-update` は GitHub Releases API で最新リリースを調べ、対応するバイナリへ mise 自身を置き換えます[^self-update]。

```shell
$ mise self-update
```

`mise self-update` は、更新前に確認を求めます。`mise self-update` は、既定でインストール済みのプラグインも併せて更新します[^self-update]。主なオプションを次にまとめます。

- `-y`（`--yes`）: 更新前の確認を省略する[^self-update]。
- バージョンを引数に渡す: 指定したバージョンへ更新する[^self-update]。
- `--no-plugins`: プラグインの更新を無効にする[^self-update]。

## ツールを更新する

mise が管理するツールは、`mise outdated` で更新可能なものを確認し、`mise upgrade` で更新します。更新の挙動は、`mise.toml` のバージョン指定（第 4 章）によって変わります。緩い指定では指定した範囲内の最新へ、`--bump` を付けると範囲を超えた最新へ更新します。

### mise outdated で更新可能なツールを確認する

`mise outdated` は、更新可能なツールの一覧を表示します[^outdated]。引数なしで実行すると、グローバルとローカルの設定ファイルで宣言された全ツールを対象とします[^outdated]。次の例は、`node = "20.19"` を宣言し、20.19.5 を導入済みのプロジェクトでの出力です。範囲内に 20.19.6 が公開されています。

```shell
$ mise outdated
node  20.19  20.19.5  20.19.6  ~/work/my-app/mise.toml
```

各列は、宣言した指定・現在のバージョン・宣言した範囲内の最新・宣言元の設定ファイルを表します。既定の `mise outdated` は、`mise.toml` で宣言した範囲内で更新可能なバージョンを表示します[^outdated]。範囲内に新しいバージョンがなければ、`mise All tools are up to date` を表示し、更新候補は並びません。

宣言した範囲を超えて、利用可能な最新まで比較するには `--bump`（`-l`）を付けます[^outdated]。次の例は、`node = "20.19"` に対して範囲外の最新を表示します。

```shell
$ mise outdated --bump
node  20.19  20.19.5  26.3  26.3.0  ~/work/my-app/mise.toml
```

`--bump` の出力は、宣言した指定・現在のバージョン・`--bump` で書き換わるバージョン・利用可能な最新・宣言元を表します。`--bump` を付けると、`mise.toml` の指定範囲にかかわらず、利用可能な最新のバージョンを比較対象にします[^outdated]。`node = "20.19"` のように指定したツールでも、26 系以降の新しいメジャーバージョンを更新候補として確認できます。

### mise upgrade で更新する

`mise upgrade` は、更新可能なツールを更新します[^upgrade]。エイリアスは `mise up` です[^upgrade]。引数なしで実行すると、現在のツールをすべて対象にします[^upgrade]。既定では `mise.toml` で宣言した範囲を保ち、範囲内の最新へ更新します[^upgrade]。`node = "20"` を宣言している場合は、20 系の最新へ更新し、`mise.toml` の記述は変更しません。

更新の前に、何が行われるかを確認するには `--dry-run`（`-n`）を付けます[^upgrade]。`--dry-run` は、更新内容を表示するだけで実際には更新しません[^upgrade]。

```shell
$ mise upgrade --dry-run
```

`mise.toml` のバージョン指定そのものを引き上げるには `--bump`（`-l`）を付けます[^upgrade]。`--bump` は、利用可能な最新のバージョンをインストールし、`mise.toml` の記述を新しいバージョンへ書き換えます[^upgrade]。書き換えは、元の指定と同じ精度を保ちます[^upgrade]。`node = "20"` は `node = "22"` に、`node = "20.0.0"` は `node = "22.1.0"` のように書き換わります[^upgrade]。次の例は、`jq = "1.6"` を宣言したプロジェクトで `--bump` と `--dry-run` を併用した結果です。

```shell
$ mise upgrade --bump --dry-run
Would uninstall jq@1.6
Would install jq@1.8.1
Would bump jq@1.8 in ~/work/my-app/mise.toml
```

`--dry-run` の出力は、`--bump` が古いバージョンを削除し、最新をインストールし、`mise.toml` の指定を引き上げる流れを示します。出力を確認したうえで、`--dry-run` を外して実行すると `mise.toml` を更新できます。

:::message
`--bump` は `mise.toml` の記述を書き換えます。チームで共有する `mise.toml` を更新したときは、変更をコミットして共有します。`mise.lock`（第 15 章）を有効にしている場合は、`mise upgrade` がロックファイルも併せて更新します[^upgrade]。`mise.toml` と `mise.lock` の両方をコミットすると、チームの全員が同じバージョンへそろえられます。
:::

## 古いバージョンを整理する

ツールを更新すると、古いバージョンがディスクに残ります。`mise prune` は、どの設定ファイルからも参照されていないツールバージョンを削除します[^prune]。mise は、使用した設定ファイルを `~/.local/state/mise/tracked-configs` で追跡し、追跡対象のどの設定でも最新でなくなったバージョンを削除対象とします[^prune]。

### 削除対象を確認する

削除対象のバージョンは、`mise ls --prunable` で一覧表示します[^prune][^ls]。削除対象は、追跡対象のどの設定でも最新でなくなったバージョンです。`jq = "1.7"` を導入したあと、設定を `jq = "1.8"` へ引き上げると、1.7 はどの設定でも最新でなくなり、削除対象に並びます。

```shell
$ mise ls --prunable
jq  1.7
```

削除する前に、`mise prune --dry-run`（`-n`）で削除内容を確認します[^prune]。`--dry-run` は、削除対象を表示するだけで実際には削除しません[^prune]。次の例は、削除対象を `jq` に絞り、削除内容を確認します。ツール名を引数に渡すと、対象を限定できます[^prune]。

```shell
$ mise prune jq --dry-run
mise pruned configuration links [dryrun]
mise jq@1.7 [dryrun]  uninstall
mise jq@1.7 [dryrun]  remove ~/.local/share/mise/installs/jq/1.7
mise jq@1.7 [dryrun]  remove ~/Library/Caches/mise/jq/1.7
mise jq@1.7 [dryrun]  ✓ done
```

先頭の行は、実体のない設定への追跡リンクを整理する処理を示します。続く行は、削除されるツールとバージョン、および削除されるインストール先とキャッシュのディレクトリを示します。`[dryrun]` の表示は、実際には削除していないことを表します。キャッシュのパスは macOS の既定値（`~/Library/Caches/mise`）です。

### 削除する

削除対象を確認したら、`--dry-run` を外して `mise prune` を実行します[^prune]。

```shell
$ mise prune jq
mise pruned configuration links
mise jq@1.7  uninstall
mise jq@1.7  remove ~/.local/share/mise/installs/jq/1.7
mise jq@1.7  remove ~/Library/Caches/mise/jq/1.7
mise jq@1.7  ✓ done
```

`mise prune` は、削除対象のバージョンを `~/.local/share/mise/installs` から削除します[^prune]。削除の対象を絞り込むオプションを次の表にまとめます[^prune]。

| オプション | 動作 |
| --- | --- |
| `--dry-run`（`-n`） | 削除内容を表示するだけで実際には削除しない |
| `--tools` | 未使用のツールバージョンのみを削除し、設定リンクを整理しない |
| `--configs` | 実体のない設定への追跡リンクのみを削除する |
| ツール名を指定 | 指定したツールのみを削除対象にする |

:::message
`mise prune` は、設定ファイルから参照されていないバージョンを削除します。環境変数 `MISE_<TOOL>_VERSION` でのみ使ったバージョンや、`mise exec <TOOL>@<VERSION>` でコマンドラインからのみ参照したバージョンも削除対象です[^prune]。削除する前に `mise ls --prunable` と `mise prune --dry-run` で対象を確認します。
:::

## settings で挙動を調整する

mise の挙動は settings で調整します。`mise settings` で現在の設定を確認し、`mise settings set` で変更します。本書で扱った設定の多くは、settings のキーに対応します。

### settings を確認する

`mise settings` は、明示的に設定済みのキーを一覧表示します[^settings]。出力は、グローバル設定ファイル（`~/.config/mise/config.toml`）の内容を反映します[^settings]。各行は、キー・値・設定元のファイルを表します。次の例は、`experimental` と `idiomatic_version_file_enable_tools` を設定済みの環境での出力です。

```shell
$ mise settings
experimental                         true     ~/.config/mise/config.toml
idiomatic_version_file_enable_tools  ["node"] ~/.config/mise/config.toml
```

`mise settings` は、設定ファイルに書かれていないキーを既定値とともに表示しません。既定値を含む全キーの一覧を表示するには `--all`（`-a`）を付けます[^settings]。特定のキーの値だけを確認するには、`mise settings get <キー>` を実行します[^settings]。次の例は、`experimental` の現在値を表示します。設定していないキーは、既定値を返します。

```shell
$ mise settings get experimental
false
```

`mise settings get` は、指定したキーの現在値だけを出力します[^settings]。設定の一覧から目的のキーを探す手間を省けます。

### settings を変更する

設定を変更するには、`mise settings set <キー> <値>` を実行します[^settings]。次の例は、`experimental` を有効にします。

```shell
$ mise settings set experimental true
```

`mise settings set` は、グローバル設定ファイルにキーを書き込みます[^settings]。書き込み先や削除などの操作は、次のオプションとサブコマンドで切り替えます。

- `--local`（`-l`）: 現在のディレクトリの `mise.toml` の `[settings]` に書き込む[^settings]。プロジェクト単位で設定する場合に使う。
- `mise settings unset <キー>`: 設定を削除する[^settings]。
- `mise settings add`: 複数の値を持つ設定にキーを追加する（第 17 章）。

本書で扱った主な settings のキーを次の表にまとめます。

| キー | 役割 | 扱った章 |
| --- | --- | --- |
| `idiomatic_version_file_enable_tools` | `.nvmrc`・`.python-version` などの読み込みを有効にするツールの一覧 | 第 17 章 |
| `experimental` | 試験的機能を有効にする | 第 13 章 |
| `lockfile` | ロックファイル `mise.lock` の読み書きを制御する | 第 15 章 |

`idiomatic_version_file_enable_tools` は、既存ツールのバージョンファイルを読み込む対象を指定します。`.nvmrc` や `.python-version` の読み込みは、第 17 章で扱いました。`experimental` は、暗号化機能（第 13 章）など試験的機能を有効にします。`lockfile` は、`mise.lock` の読み書きを制御します（第 15 章）。各キーの完全な一覧と既定値は、mise 公式ドキュメントの Settings に記載があります[^settings-doc]。

:::message
`mise settings` で変更できる設定は、環境変数でも指定できます。設定のキーを大文字にし、`MISE_` を接頭辞に付けた環境変数が対応します。`experimental` 設定は環境変数 `MISE_EXPERIMENTAL` で指定できます[^settings-doc]。CI など一時的に設定を変える場面では、設定ファイルを書き換えず環境変数で指定する方法がとれます。CI での設定は第 16 章で扱いました。
:::

## backends とプラグインを保守する

mise は、ツールごとに backend を通じてインストール方法を解決します（第 12 章）。registry に登録済みのツールは、mise が backend を自動で選ぶため、保守の操作を要しません。一方、asdf・vfox のプラグインを使う場合は、プラグインの更新が保守の対象になります。

### registry の扱い

mise の registry は、ツール名から backend への対応を定義する組み込みのカタログです[^registry]。registry は mise 本体に同梱されるため、mise 本体を更新すると registry も最新化されます[^registry]。registry のツールを使う場合、利用者がカタログを個別に更新する操作は要りません。registry に登録済みのツールは、第 12 章で扱ったとおりツール名をそのまま宣言できます。

### asdf・vfox プラグインを更新する

registry に無いツールは、asdf・vfox のプラグインを backend として導入する場合があります（第 12 章）。導入済みのプラグインは、`mise plugins ls` で一覧表示します[^plugins]。

```shell
$ mise plugins ls
```

プラグインを更新するには、`mise plugins update` を実行します[^plugins]。`mise plugins update` は、導入済みのプラグインを最新へ更新します[^plugins]。対象は引数で切り替えます。

- 引数なし: すべてのプラグインを対象にする[^plugins]。
- プラグイン名を引数に渡す: 指定したプラグインだけを更新する[^plugins]。

```shell
$ mise plugins update
```

`mise plugins` の主なサブコマンドを次の表にまとめます[^plugins]。

| サブコマンド | 役割 |
| --- | --- |
| `mise plugins ls` | 導入済みのプラグインを一覧表示する |
| `mise plugins install` | プラグインを導入する |
| `mise plugins update` | プラグインを最新へ更新する |
| `mise plugins uninstall` | プラグインを削除する |

:::message
mise の registry に登録済みのツールは、プラグインを手動で導入する操作を要しません。`mise plugins install` でのプラグインの手動導入が必要なのは、registry に無いツールを asdf・vfox のプラグインで使う場合です。asdf プラグインはレガシー扱いです（第 12 章）。新たにツールを追加する際は、registry に登録済みの backend を優先します。
:::

## 本章のまとめ

- mise 本体の更新方法は導入方法によって変わります。`which mise` で配置先を確認し、Homebrew で導入した場合は `brew upgrade mise`、インストールスクリプトで導入した場合は `mise self-update` を使います。`mise self-update` は、パッケージマネージャ経由で導入した mise では利用できません。
- ツールは `mise outdated` で更新可能なものを確認し、`mise upgrade`（エイリアス `mise up`）で更新します。既定では `mise.toml` の指定範囲を保ち、`--bump` で範囲を超えた最新へ更新して `mise.toml` の記述も引き上げます。`--dry-run` で更新内容を事前に確認できます。
- 古いバージョンは `mise prune` で整理します。`mise ls --prunable` で削除対象を確認し、`mise prune --dry-run` で削除内容を事前に確認します。削除対象は、どの設定ファイルからも参照されていないバージョンです。
- mise の挙動は settings で調整します。`mise settings` で確認し、`mise settings get` で特定のキーを参照し、`mise settings set` で変更します。`idiomatic_version_file_enable_tools`・`experimental`・`lockfile` などが本書で扱った主なキーです。
- registry は mise 本体に同梱され、本体の更新で最新化されます。registry に無いツールで使う asdf・vfox プラグインは、`mise plugins update` で更新します。registry に登録済みのツールはプラグインの手動導入を要しません。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^self-update]: `mise self-update` コマンド（GitHub Releases API で更新する点・パッケージマネージャ経由では利用できない点・`--yes`・バージョン指定・`--no-plugins`）。mise 公式ドキュメント「mise self-update」<https://mise.jdx.dev/cli/self-update.html>
[^outdated]: `mise outdated` コマンド（更新可能なツールの表示・対象範囲・`--bump`）。mise 公式ドキュメント「mise outdated」<https://mise.jdx.dev/cli/outdated.html>
[^upgrade]: `mise upgrade` コマンド（エイリアス `mise up`・既定で範囲を保つ点・`--bump`・`--dry-run`・ロックファイルの更新）。mise 公式ドキュメント「mise upgrade」<https://mise.jdx.dev/cli/upgrade.html>
[^prune]: `mise prune` コマンド（未参照バージョンの削除・`tracked-configs` での追跡・`--dry-run`・`--tools`・`--configs`・環境変数やコマンドラインのみの参照を削除する点）。mise 公式ドキュメント「mise prune」<https://mise.jdx.dev/cli/prune.html>
[^ls]: `mise ls` コマンドと `--prunable` オプション（削除可能なツールの一覧表示）。mise 公式ドキュメント「mise ls」<https://mise.jdx.dev/cli/ls.html>
[^settings]: `mise settings` コマンドとサブコマンド（`get`・`set`・`unset`・`add`・`ls`・`--local`）。mise 公式ドキュメント「mise settings」<https://mise.jdx.dev/cli/settings.html>
[^settings-doc]: settings の全キー・既定値、および環境変数（`MISE_` 接頭辞）での指定。mise 公式ドキュメント「Settings」<https://mise.jdx.dev/configuration/settings.html>
[^registry]: mise の registry（ツール名から backend への対応カタログ・本体に同梱される点）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^plugins]: `mise plugins` コマンドとサブコマンド（`ls`・`install`・`update`・`uninstall`）。mise 公式ドキュメント「mise plugins」<https://mise.jdx.dev/cli/plugins.html>
