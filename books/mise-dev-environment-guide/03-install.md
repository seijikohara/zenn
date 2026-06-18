---
title: "インストールとシェル有効化"
---

本章では、macOS に mise を導入し、シェルで有効化して動作確認するまでを行います。読了後には、`mise` コマンドを実行できる状態になり、第 4 章以降の設定や第 5 章のバージョン操作へ進めます。

:::message
本章の手順は macOS（既定のシェルは zsh）を前提とします。bash と fish についても、対応する設定を併記します。コマンド例のバージョン表記は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。
:::

## 導入方法を選ぶ

macOS には 2 通りの導入方法があります。mise 公式ドキュメントは、macOS では Homebrew を推奨し、公式インストールスクリプト（`https://mise.run`）を代替手段として案内しています[^install-methods]。本書では Homebrew を主な方法とし、スクリプトによる導入も併記します。

| 導入方法 | コマンド | mise の配置先 |
| --- | --- | --- |
| Homebrew（推奨） | `brew install mise` | Homebrew の管理下（PATH に登録済み） |
| インストールスクリプト | `curl https://mise.run \| sh` | `~/.local/bin` |

2 つの方法の違いは、`mise` 実行ファイルの配置先と、PATH への登録方法です。

- Homebrew は `mise` を PATH に登録済みのディレクトリへ配置します。
- スクリプトは `~/.local/bin` へ配置し、シェルの有効化を通じて PATH に追加します。

後述するシェル有効化の記述が、導入方法によって変わります。

### Homebrew で導入する

Homebrew を導入済みの環境では、次のコマンドで mise をインストールします[^install-methods]。

```shell
$ brew install mise
```

Homebrew がインストールするパッケージ名は `mise` です。インストールが完了すると、`mise` 実行ファイルが PATH 上に配置され、コマンドとして呼び出せます。

### インストールスクリプトで導入する

Homebrew を使わない場合は、公式インストールスクリプトで導入します[^install-methods]。次のコマンドは、スクリプトを取得して `sh` で実行します。

```shell
$ curl https://mise.run | sh
```

スクリプトは `mise` を `~/.local/bin/mise` へ配置します[^install-methods]。スクリプトによる導入では、`~/.local/bin` が PATH に未登録でも問題ありません。mise はシェルの有効化時に、自身のディレクトリを PATH へ自動で追加します[^install-methods]。

:::message
インストールスクリプトを実行する前に、内容を確認する場合は、`curl https://mise.run` をパイプなしで実行してスクリプト本文を表示します。
:::

## シェルを有効化する

mise のインストールだけでは、mise が管理するツールを PATH 上で解決できません。シェルの設定ファイルに `mise activate` の出力を読み込ませて、mise を有効化します。`mise activate <シェル>` は、対象シェル向けの初期化スクリプトを標準出力に出力するコマンドです[^activate]。出力をシェルが評価すると、mise がプロンプト表示のたびに PATH と環境変数を更新します。

:::message
PATH 上でツールを解決する方式には、PATH activation と shims の 2 つがあります。本章では、対話的なシェルで推奨される PATH activation を設定します[^activate]。shims の設定は後述します。2 つの方式の挙動差と選択指針は、第 5 章で扱います。
:::

### zsh（既定）を有効化する

macOS の既定のシェルは zsh です。`~/.zshrc` の末尾に、次の 1 行を追記します。Homebrew で導入した場合は、`mise` が PATH 上にあるため、コマンド名をそのまま記述します[^activate]。

```shell:~/.zshrc
eval "$(mise activate zsh)"
```

インストールスクリプトで導入した場合は、`mise` が PATH に未登録の段階で評価されます。次のように `mise` を絶対パスで指定します[^getting-started]。

```shell:~/.zshrc
eval "$(~/.local/bin/mise activate zsh)"
```

追記は、次のコマンドでも行えます。`>>` はファイルの末尾への追記を表します。

```shell
$ echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

### bash を有効化する

bash を使う場合は、`~/.bashrc` の末尾に次の 1 行を追記します[^getting-started]。

```shell:~/.bashrc
eval "$(mise activate bash)"
```

### fish を有効化する

fish を使う場合は、`~/.config/fish/config.fish` の末尾に次の 1 行を追記します。fish では `eval` を使わず、`mise activate fish` の出力を `source` に渡します[^getting-started]。

```fish:~/.config/fish/config.fish
mise activate fish | source
```

## 設定を反映して動作確認する

設定ファイルへの追記は、新しいシェルの起動時に反映されます。シェルを再起動するか、設定ファイルを再読み込みします。再読み込みのコマンドはシェルごとに異なります。

| シェル | 再読み込みのコマンド |
| --- | --- |
| zsh | `source ~/.zshrc` |
| bash | `source ~/.bashrc` |

反映後、mise が有効になったかを 2 つのコマンドで確認します。

### `mise --version` でバージョンを確認する

`mise --version` は、インストール済みの mise のバージョンを出力します。出力はバージョン番号・ビルド対象・ビルド日付で構成されます。

```shell
$ mise --version
2026.6.10 macos-x64 (2026-06-14)
```

バージョン番号が表示されれば、`mise` コマンドを実行できる状態です。表示される値は、インストールした mise のバージョンによって変わります。

### `mise doctor` で設定を確認する

`mise doctor` は、mise の設定や有効化の状態を診断し、問題があれば警告を出力します[^doctor]。エイリアスは `mise dr` です。シェルの有効化が完了しているかは、出力の `activated` 行で確認できます。

```shell
$ mise doctor
version: 2026.6.10 macos-x64 (2026-06-14)
activated: yes
shims_on_path: no
...
```

`activated: yes` は、PATH activation が有効であることを示します。`activated: no` が表示される場合は、シェルの有効化の追記内容と、シェルの再起動を確認します。`mise doctor` が問題を検出すると、末尾に該当箇所と対処の指針を出力します。

:::message
`mise doctor` の出力は環境によって異なります。設定ファイルのパスやインストール済みのツールが、追加の行として表示されます。本書の例は、有効化の確認に必要な先頭部分のみを示します。
:::

## shims を有効化する（補足）

CI・スクリプト・一部の統合開発環境（IDE）など、対話的でない実行を主とする場合は、PATH activation の代わりに shims を使います[^activate]。shims は、PATH の先頭に shims ディレクトリを追加して有効化します。`mise activate --shims <シェル>` が、追加する PATH の設定を出力します[^activate]。

```shell
$ mise activate --shims zsh
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

zsh で shims を使う場合は、出力された 1 行を `~/.zshrc` の末尾に追記します。

```shell:~/.zshrc
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

shims は、シェルのプロンプトに依存せずツールを解決します。一方で、mise の一部の機能は PATH activation でのみ利用できます[^activate]。PATH activation と shims の挙動差、および対話的なシェルと対話的でない実行での使い分けは、第 5 章で扱います。

## 本章のまとめ

- macOS では Homebrew（`brew install mise`）での導入が推奨され、公式インストールスクリプト（`curl https://mise.run | sh`）が代替手段です。
- mise を有効化するには、シェルの設定ファイルに `mise activate <シェル>` の出力を読み込ませます。zsh は `~/.zshrc`、bash は `~/.bashrc`、fish は `~/.config/fish/config.fish` に追記します。
- 追記後はシェルを再起動するか設定ファイルを再読み込みし、`mise --version` と `mise doctor` で有効化を確認します。`mise doctor` の `activated: yes` が有効化の成功を示します。
- 対話的でない実行を主とする場合は、`mise activate --shims <シェル>` の出力で shims を有効化します。挙動差と選択指針は第 5 章を参照してください。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^install-methods]: macOS での推奨と代替の導入方法、およびインストールスクリプトの仕様。mise 公式ドキュメント「Installing Mise」<https://mise.jdx.dev/installing-mise.html>
[^getting-started]: 各シェルへの有効化の追記内容と反映手順。mise 公式ドキュメント「Getting Started」<https://mise.jdx.dev/getting-started.html>
[^activate]: `mise activate` の仕様と `--shims` オプションは mise 公式ドキュメント「mise activate」<https://mise.jdx.dev/cli/activate.html> を参照。対話的なシェルでの PATH activation 推奨と、対話的でない実行での shims の利用は「Shims」<https://mise.jdx.dev/dev-tools/shims.html> に記載があります。
[^doctor]: `mise doctor` の用途とエイリアス。mise 公式ドキュメント「mise doctor」<https://mise.jdx.dev/cli/doctor.html>
