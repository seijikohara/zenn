---
title: "既存ツールからの移行"
---

本章では、nvm・pyenv・rbenv・asdf といった既存のバージョンマネージャから mise へ移行する手順を扱います。読了後には、既存のシェル統合を mise に置き換え、既存のバージョンファイルを活かしたまま、または `mise.toml` へ書き換えて移行できるようになります。

本章は、nvm・pyenv・rbenv などの言語別ツールを使用中で mise へ移行したい開発者を主な対象とします。第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールとシェル有効化は第 3 章、`mise.toml` の構文と `.tool-versions` の扱いは第 4 章で扱いました。各言語のバージョンファイルの詳細は、Node.js が第 6 章、Python が第 7 章、Ruby が第 11 章で扱いました。本章は移行の手順に集中し、各ツールの個別事情は再説明しません。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。OS は macOS（既定のシェルは zsh）を前提とします。

## 移行の全体方針

nvm・pyenv・rbenv は、いずれもシェルの設定ファイルに初期化コードを書いて有効化します。mise も `mise activate`（第 3 章）でシェルに統合します。両方の初期化が同時に有効だと、PATH の先頭をどちらが取るかで競合が起き、意図しないバージョンが選ばれます。移行では、既存ツールのシェル統合を外し、mise の有効化に一本化します。

### 既存ツールのシェル統合を外す

既存ツールは、`~/.zshrc` に初期化コードを書いて有効化します。代表的な記述を次に示します。nvm・pyenv・rbenv のいずれも、PATH を操作し、初期化コマンドを評価します。

```shell:~/.zshrc（移行前。既存ツールの初期化）
# nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# rbenv
eval "$(rbenv init - zsh)"
```

移行では、既存ツールの初期化行を `~/.zshrc` から削除し、mise の有効化に置き換えます。mise の有効化は第 3 章で設定した 1 行です。

```shell:~/.zshrc（移行後。mise の有効化に一本化）
eval "$(mise activate zsh)"
```

書き換えた `~/.zshrc` を反映するには、シェルを再起動するか `source ~/.zshrc` を実行します。反映後、`mise doctor` の `activated` 行で mise の有効化を確認します。`mise doctor` の確認方法は第 3 章で扱いました。

:::message
既存ツールの初期化を残したまま `mise activate` を追加すると、PATH の競合で意図しないバージョンが選ばれます。移行では既存ツールの初期化行を削除します。シェル統合を外しても、`~/.nvm` や `~/.pyenv` のインストール済みディレクトリは残ります。動作を確認したあとに削除します。
:::

### 段階的に移行する 2 つの方法

mise への移行には、2 つの方法があります。プロジェクトの状況に応じて選びます。

1. 既存のバージョンファイル（`.nvmrc`・`.python-version`・`.ruby-version`・`.tool-versions`）をそのまま使い続ける方法。mise が既存ファイルを読む設定を有効にします。
2. `mise.toml` へ書き換える方法。`[tools]` セクションにツールとバージョンを宣言します。

mise は、`.nvmrc`・`.node-version`・`.python-version`・`.ruby-version` を idiomatic version files と呼びます[^idiomatic]。idiomatic version files の読み込みは既定で無効です[^idiomatic]。一方、asdf 互換の `.tool-versions` は、設定なしで読み込みます[^config]。両者で既定の挙動が異なる点に注意します。各ファイルの対応を次の表にまとめます。

| ファイル | 由来 | mise が既定で読むか | 有効化の方法 |
| --- | --- | --- | --- |
| `.nvmrc` | nvm | 読まない | `idiomatic_version_file_enable_tools` に `node` を追加 |
| `.node-version` | nodenv ほか | 読まない | `idiomatic_version_file_enable_tools` に `node` を追加 |
| `.python-version` | pyenv | 読まない | `idiomatic_version_file_enable_tools` に `python` を追加 |
| `.ruby-version` | rbenv | 読まない | `idiomatic_version_file_enable_tools` に `ruby` を追加 |
| `.tool-versions` | asdf | 読む | 設定不要 |

新規のプロジェクトでは `mise.toml` を使い、`mise.toml` の機能（`[env]`・`[tasks]`）を活用します。既存のバージョンファイルは、移行期間中の互換性の維持に向きます。移行が済んだプロジェクトは、`mise.toml` へ集約すると設定を一元化できます。

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。
:::

## nvm からの移行

nvm は、`.nvmrc` に Node.js のバージョンを記述します。mise は `.nvmrc` を読み込めます[^idiomatic]。移行では、`.nvmrc` をそのまま使う方法と、`mise.toml` へ書き換える方法を選びます。

### .nvmrc をそのまま使う

`.nvmrc` を残したまま移行する場合は、mise が `.nvmrc` を読む設定を有効にします。`idiomatic_version_file_enable_tools` に `node` を追加します。設定の追加は `mise settings add` で行います。

```shell
$ mise settings add idiomatic_version_file_enable_tools node
```

設定後、mise は `.nvmrc` の内容を Node.js のバージョンとして解決します。次の例は、`22.22.3` を記述した `.nvmrc` を読み込んだ結果です。`Source` 列が `.nvmrc` を指します。

```shell
$ mise ls node
Tool  Version   Source                   Requested
node  22.22.3   ~/work/my-app/.nvmrc     22.22.3
```

設定を追加すると、`.nvmrc` を持つすべてのプロジェクトで mise が `.nvmrc` を読みます。nvm を併用せず、mise だけで Node.js を解決できます。

### mise.toml へ書き換える

`mise.toml` へ移行する場合は、`.nvmrc` の内容を `[tools]` の `node` に書き写します。次は、`22.22.3` を記述した `.nvmrc` を `mise.toml` に書き換える例です。

```text:.nvmrc（移行前）
22.22.3
```

```toml:mise.toml（移行後）
[tools]
node = "22.22.3"
```

`mise.toml` へ書き換えると、`idiomatic_version_file_enable_tools` の設定なしに Node.js のバージョンを固定できます。`mise.toml` には Node.js 以外のツールや `[env]`・`[tasks]` も記述できます。書き換え後は `.nvmrc` を削除できます。`.nvmrc` を削除する前に、`node --version` で `mise.toml` のバージョンが有効になることを確認します。

:::message
`.nvmrc` には、`lts/jod` のようなエイリアスや、`node`（最新版を表す nvm の記法）を記述する場合があります。`mise.toml` へ書き換える際は、mise のバージョン指定構文（第 4 章）に置き換えます。Node.js のエイリアス（`lts`・`lts/<コードネーム>`）は第 6 章で扱いました。
:::

## pyenv からの移行

pyenv は、`.python-version` に Python のバージョンを記述します。mise は `.python-version` を読み込めます[^idiomatic]。移行の手順は nvm と同じく、`.python-version` をそのまま使う方法と、`mise.toml` へ書き換える方法を選びます。

### .python-version をそのまま使う

`.python-version` を残す場合は、`idiomatic_version_file_enable_tools` に `python` を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools python
```

設定後、mise は `.python-version` の内容を Python のバージョンとして解決します。`Source` 列が `.python-version` を指します。

```shell
$ mise ls python
Tool    Version   Source                          Requested
python  3.13.7    ~/work/my-app/.python-version   3.13.7
```

### mise.toml へ書き換える

`mise.toml` へ移行する場合は、`.python-version` の内容を `[tools]` の `python` に書き写します。

```text:.python-version（移行前）
3.13.7
```

```toml:mise.toml（移行後）
[tools]
python = "3.13.7"
```

pyenv では、仮想環境の管理に pyenv-virtualenv プラグインを使う場合があります。mise は `mise.toml` の `[env]` セクションで venv を自動有効化します。pyenv-virtualenv と mise の違い、および venv の自動有効化は第 7 章で扱いました。

:::message
`.python-version` には、複数行に複数バージョンを記述する場合があります。mise が `.python-version` から解決するのは Python のバージョンです。複数バージョンの併存や、用途ごとのバージョン切り替えは、`mise.toml` の `[tools]` で宣言する方法に置き換えます。複数バージョンの指定は第 4 章で扱いました。
:::

## rbenv からの移行

rbenv は、`.ruby-version` に Ruby のバージョンを記述します。mise は `.ruby-version` を読み込めます[^idiomatic]。移行の手順は nvm・pyenv と同じです。

### .ruby-version をそのまま使う

`.ruby-version` を残す場合は、`idiomatic_version_file_enable_tools` に `ruby` を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools ruby
```

設定後、mise は `.ruby-version` の内容を Ruby のバージョンとして解決します。`Source` 列が `.ruby-version` を指します。

```shell
$ mise ls ruby
Tool  Version   Source                          Requested
ruby  3.4.9     ~/work/my-app/.ruby-version     3.4.9
```

### mise.toml へ書き換える

`mise.toml` へ移行する場合は、`.ruby-version` の内容を `[tools]` の `ruby` に書き写します。

```text:.ruby-version（移行前）
3.4.9
```

```toml:mise.toml（移行後）
[tools]
ruby = "3.4.9"
```

mise は既定で ruby-build を使い、Ruby をソースからビルドします。ビルドに必要な依存ライブラリと `ruby.compile` 設定は第 11 章で扱いました。rbenv も ruby-build を使うため、rbenv でビルドできていた環境では、mise でも同じ依存ライブラリでビルドできます。

## .tool-versions の流用と asdf からの移行

asdf は、`.tool-versions` に複数ツールのバージョンをまとめて記述します。mise は asdf の代替として動作し、同じ `.tool-versions` を読み込めます[^asdf-compat]。idiomatic version files と異なり、`.tool-versions` は設定なしで読み込みます[^config]。`.tool-versions` を持つプロジェクトは、mise を有効化するだけでバージョンを解決できます。

```text:.tool-versions
node 22.22.3
python 3.13.7
ruby 3.4.9
```

`mise install` を実行すると、mise は `.tool-versions` のツールをまとめてインストールします。

```shell
$ mise install
mise node@22.22.3    ✓ installed
mise python@3.13.7   ✓ installed
mise ruby@3.4.9      ✓ installed
```

### asdf プラグインを backend として使う

asdf は、ツールごとにプラグインを追加して対応します。mise は asdf backend を通じて asdf プラグインを利用できます[^asdf-compat]。registry に登録のないツールを asdf プラグインで導入していた場合は、`asdf:` を接頭辞に付けてプラグインを指定します[^asdf-backend]。`asdf:` は、`<owner>/<plugin>` の形式で asdf プラグインのリポジトリを指します。

```toml:mise.toml
[tools]
"asdf:owner/plugin" = "latest"  # asdf プラグインを backend として使う
```

mise の registry に登録済みのツールは、ツール名をそのまま宣言できます。registry とツール名による宣言は第 12 章で扱いました。asdf プラグインの指定が必要なのは、registry に無いツールだけです。

:::message alert
mise は、asdf のインストール済みディレクトリ（`~/.asdf`）を再利用しません[^asdf-compat]。asdf でインストール済みのツールは、mise で改めてインストールします。`mise install` を実行すると、mise は自身の管理下にツールをインストールし直します。
:::

### asdf からの移行手順

mise 公式ドキュメントは、asdf からの移行手順を案内しています[^asdf-migrate]。手順は次のとおりです。

1. mise をインストールし、`mise activate` を有効化する（第 3 章）。
2. asdf の初期化を `~/.zshrc` から削除する。
3. `.tool-versions` を持つディレクトリで `mise install` を実行する。

asdf は `~/.tool-versions` をグローバル設定として扱います。mise は `~/.tool-versions` をグローバル設定として扱わず、グローバル設定に `~/.config/mise/config.toml` を使います[^asdf-migrate]。グローバルの `~/.tool-versions` を mise のグローバル設定へ移すには、`mise use -g` で各ツールを宣言し直します。`mise use -g` の操作は第 5 章で扱いました。

```shell
$ mise use -g node@22.22.3
$ mise use -g python@3.13.7
```

`mise use -g` は、宣言したツールを `~/.config/mise/config.toml` に書き込みます。動作を確認したあとに、グローバルの `~/.tool-versions` を削除します。

:::message
`mise use` は、既定でバージョンを `mise.toml` に書き込みます[^use]。書き込み先を `.tool-versions` にしても、mise は既定でファジーなバージョン（部分指定）を書き出すため、asdf と互換のない記法になる場合があります[^use]。`--pin` を付けると、mise は解決済みの完全なバージョンを書き出します[^use]。asdf と併用する移行期間中に `.tool-versions` の互換性を保つには、`--pin` を使います。移行が済んだら `mise.toml` へ集約します。
:::

## プロジェクトの mise.toml への移行例

複数の言語別ツールを併用していたプロジェクトを、`mise.toml` へ集約する例を示します。移行前は、Node.js を `.nvmrc`、Python を `.python-version`、Ruby を `.ruby-version` で個別に管理しています。

```text:.nvmrc（移行前）
22.22.3
```

```text:.python-version（移行前）
3.13.7
```

```text:.ruby-version（移行前）
3.4.9
```

3 つのバージョンファイルを、1 つの `mise.toml` に集約します。`[tools]` セクションに各ツールとバージョンを宣言します。

```toml:mise.toml（移行後）
[tools]
node = "22.22.3"
python = "3.13.7"
ruby = "3.4.9"
```

集約後、`mise install` でツールをまとめてインストールします。インストール後、各ツールのバージョンを確認します。

```shell
$ mise install
mise node@22.22.3    ✓ installed
mise python@3.13.7   ✓ installed
mise ruby@3.4.9      ✓ installed
$ node --version
v22.22.3
$ python --version
Python 3.13.7
$ ruby --version
ruby 3.4.9 (2026-03-11 revision 76cca827ab) +PRISM [arm64-darwin24]
```

`mise.toml` へ集約すると、3 つのバージョンファイルが 1 つの設定ファイルにまとまります。`mise.toml` には `[env]` で環境変数、`[tasks]` でタスクも記述できます。環境変数は第 13 章、タスクは第 14 章で扱いました。バージョンファイルを `mise.toml` へ集約したら、`.nvmrc`・`.python-version`・`.ruby-version` を削除します。`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じツール構成を再現できます。

## 本章のまとめ

- mise への移行では、nvm・pyenv・rbenv のシェル統合を `~/.zshrc` から外し、`mise activate` に一本化します。既存ツールの初期化を残すと PATH の競合が起きます。
- 移行には、既存のバージョンファイルをそのまま使う方法と、`mise.toml` へ書き換える方法があります。`.nvmrc`・`.python-version`・`.ruby-version` は idiomatic version files です。読み込みを有効にするには、`idiomatic_version_file_enable_tools` にツール名を追加します。
- `.tool-versions` は asdf 互換で、設定なしで読み込みます。mise は asdf の代替として動作し、asdf プラグインを `asdf:` 接頭辞の backend で利用できます。
- mise は asdf のインストール済みディレクトリ（`~/.asdf`）を再利用しません。asdf でインストール済みのツールは mise で入れ直します。グローバルの `~/.tool-versions` は `mise use -g` で `~/.config/mise/config.toml` へ移します。
- 複数のバージョンファイルを `mise.toml` の `[tools]` に集約すると、設定を一元化でき、`[env]`・`[tasks]` も同じファイルに記述できます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^config]: 設定ファイルの種類・探索順・優先順位、および `.tool-versions` を設定なしで読み込む点。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic]: mise が読み込む idiomatic version files（`.nvmrc`・`.node-version`・`.python-version`・`.ruby-version`）と、既定で無効である点。読み込みは `idiomatic_version_file_enable_tools` 設定で有効にします。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^asdf-compat]: mise の asdf 互換（`.tool-versions` の読み込み・asdf プラグインの利用・`~/.asdf` を再利用しない点）。mise 公式ドキュメント「Comparison to asdf」<https://mise.jdx.dev/dev-tools/comparison-to-asdf.html>
[^use]: `mise use` の書き込み先（既定は `mise.toml`）と `--pin` オプション（解決済みの完全なバージョンを書き出す。既定はファジーなバージョン）。mise 公式ドキュメント「mise use」<https://mise.jdx.dev/cli/use.html>
[^asdf-backend]: asdf backend の記法（`asdf:<owner>/<plugin>`）と、asdf プラグインがレガシー扱いである点。mise 公式ドキュメント「asdf Backend」<https://mise.jdx.dev/dev-tools/backends/asdf.html>
[^asdf-migrate]: asdf から mise への移行手順（シェル統合の削除・`mise install`・`~/.tool-versions` をグローバル設定として扱わない点）。mise 公式ドキュメント「FAQ」の「How do I migrate from asdf?」<https://mise.jdx.dev/faq.html>
