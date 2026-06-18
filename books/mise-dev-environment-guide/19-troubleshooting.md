---
title: "トラブルシューティング"
---

本章では、mise の利用でよく起きる不具合を、読者が自力で切り分けて対処する手順を扱います。読了後には、`mise doctor` で状態を診断し、有効化漏れ・PATH の競合・shims の未更新・設定の読み込み不全を切り分け、対処できるようになります。

本章は、言語別ツールを使用中で mise を導入した開発者と、チームの開発環境を標準化する運用者を主な対象とします。第 3 章で mise を導入・有効化し、第 4 章で `mise.toml` の基本を理解し、第 5 章でバージョン操作と shims・activate の違いを理解した状態を前提とします。mise 自体のインストールと有効化の手順は第 3 章、shims と activate の挙動差は第 5 章、`mise trust` は第 15 章、idiomatic version files の設定は第 6 章で扱いました。本章は導入後に起きる不具合の切り分けに集中します。

:::message
本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期や環境によって、表示される内容は変わります。OS は macOS（既定のシェルは zsh）を前提とします。
:::

## mise doctor で診断する

不具合の切り分けは、`mise doctor` から始めます。`mise doctor` は、mise のインストールと設定を診断し、問題があれば警告を出力します[^doctor]。エイリアスは `mise dr` です[^doctor]。多くの不具合は、`mise doctor` の出力で原因の見当が付きます。

### 出力の主要項目を読む

`mise doctor` は、バージョン・有効化の状態・ディレクトリ・設定ファイルなどを順に出力します。次の例は、有効化済みの環境での出力から、切り分けに使う先頭部分を抜粋したものです。

```shell
$ mise doctor
version: 2026.6.10 macos-x64 (2026-06-14)
activated: yes
shims_on_path: no
...
```

切り分けで最初に見る項目は、`activated` と `shims_on_path` の 2 行です。各項目の意味を次の表にまとめます[^doctor][^shims]。

| 項目 | 意味 | 値 |
| --- | --- | --- |
| `activated` | PATH activation が有効か | `yes` = 有効、`no` = `mise activate` が未設定 |
| `shims_on_path` | shims ディレクトリが PATH 上にあるか | `yes` = PATH 上にある、`no` = 無い |

`activated: yes` は、シェルで `mise activate` が有効であることを示します。`activated: no` は、シェルの設定に `mise activate` が無いか、シェルへ反映されていないことを示します。有効化の確認は第 3 章で扱いました。`shims_on_path` は、shims ディレクトリ（`~/.local/share/mise/shims`）が PATH に含まれるかを示します。activate と shims の選択指針は第 5 章で扱いました。

### 問題の検出を確認する

`mise doctor` は、検出した事象を problem と warning に分けて扱います[^doctor]。検出結果と出力・終了コードの対応を次の表にまとめます[^doctor]。

| 検出結果 | 出力 | 終了コード |
| --- | --- | --- |
| problem を検出 | 末尾に problem の一覧と件数を出力 | `1` |
| problem が無い | `No problems found` を出力 | `0` |
| warning だけがある | warning を出力 | `0` |

warning は終了コードに影響しません[^doctor]。スクリプトや CI で problem の有無を判定する場合は、終了コードを利用できます。

:::message
`activated` と `shims_on_path` が両方とも `yes` の場合、PATH activation と shims を同時に有効にしています。PATH 解決の経路が二重になり、どちらが優先されるかが分かりにくくなります。第 5 章で扱ったとおり、対話的なシェルでは PATH activation を選び、対話的でない実行を主とする場合は shims を選びます。どちらか一方を有効にします。
:::

## activate 漏れを切り分ける

最もよく起きる不具合は、`mise activate` がシェルに設定されておらず、コマンドが mise の管理外のバージョンを指す症状です。`mise use` でバージョンを設定したのに古いバージョンが動く場合や、`mise.toml` のバージョンが反映されない場合は、有効化漏れを疑います。

### 症状を確認する

有効化漏れは、`mise doctor` の `activated` 行と、コマンドの実体のパスで切り分けます。`mise doctor` が `activated: no` を出力する場合、有効化漏れです。続けて、コマンドの実体のパスを `which` と `mise which` で比較します。第 5 章で扱ったとおり、`which <コマンド>` は PATH 上で先に見つかる実行ファイルを、`mise which <コマンド>` は mise が解決する実行ファイルを表示します[^which]。

```shell
$ which node
/opt/homebrew/bin/node
$ mise which node
/Users/me/.local/share/mise/installs/node/22.22.3/bin/node
```

`which node` が mise の管理外のパスを指し、`mise which node` が mise のインストール先（`~/.local/share/mise/installs`）を指す場合、有効化漏れです。mise の管理外のパスは、Homebrew の `/opt/homebrew/bin` やシステムの `/usr/bin` などです。PATH activation が有効なら、`which node` も `mise which node` と同じ mise のインストール先を指します。

### 対処する

有効化漏れの対処は、シェルの設定に `mise activate` を追記し、シェルへ反映する手順です。第 3 章で扱ったとおり、zsh では次の手順を実行します。

1. `~/.zshrc` に次の 1 行を追記します。

   ```shell:~/.zshrc
   eval "$(mise activate zsh)"
   ```

2. シェルを再起動するか、`source ~/.zshrc` で設定を再読み込みします。
3. `mise doctor` が `activated: yes` を出力し、`which node` が mise のインストール先を指すことを確認します。

bash・fish の追記先と、インストールスクリプトで導入した場合の絶対パス指定は、第 3 章で扱いました。

## PATH の競合を切り分ける

`mise activate` を設定しても、Homebrew やシステムが入れたツールを PATH 上で mise より前に置くと、mise の管理するバージョンではなく、別のバージョンが使われます。`activated: yes` なのに意図したバージョンが動かない場合は、PATH の順序を疑います。

### PATH の順序を確認する

PATH 上のどのディレクトリにコマンドの実体があるかは、`which -a <コマンド>` で確認します。`-a` を付けると、PATH 上で見つかるすべての実行ファイルを、PATH の順序で表示します。

```shell
$ which -a node
/opt/homebrew/bin/node
/Users/me/.local/share/mise/installs/node/22.22.3/bin/node
```

上の例では、Homebrew の `/opt/homebrew/bin/node` が mise のインストール先より前にあります。先に見つかる Homebrew のバージョンが使われ、mise のバージョンは使われません。mise が PATH へ挿入したディレクトリは、`mise doctor path` でも確認できます[^doctor]。

### 対処する

PATH activation は、シェルがプロンプトを表示するたびに、mise が解決するツールのパスを PATH の前方へ挿入します[^shims]。Homebrew の PATH 設定より後で `mise activate` を評価すると、mise のパスが Homebrew のパスより前に来ます。`~/.zshrc` で Homebrew の初期化（`eval "$(/opt/homebrew/bin/brew shellenv)"` など）を書いている場合は、次の手順で対処します。

1. `mise activate` の行を Homebrew の初期化の後に置きます。

   ```shell:~/.zshrc
   eval "$(/opt/homebrew/bin/brew shellenv)"
   eval "$(mise activate zsh)"
   ```

2. シェルを再起動するか `source ~/.zshrc` で再読み込みします。
3. `which -a node` の先頭が mise のインストール先になることを確認します。

Apple シリコンの Homebrew は `/opt/homebrew`、Intel の Homebrew は `/usr/local` に配置されます。配置先の違いは第 3 章と第 18 章で扱いました。

## shims が更新されない場合に対処する

shims 方式では、ツールの実行ファイルごとに shim を `~/.local/share/mise/shims` に作ります[^shims]。新しく追加したコマンドの shim が無いと、コマンドを実行できません。`command not found` が出る場合は、shim が作られているかを確認します。

### shims の自動生成と手動生成

mise は、ツールのインストール・更新・削除のたびに、shims を自動で再生成します[^reshim]。次の経路で導入したコマンドは、手動の操作を要しません[^reshim]。

- `mise install` や `mise use` でツールを導入した場合。
- `npm install -g` で導入したコマンド。

一方、mise が把握しない方法でコマンドが追加された場合は、shims が自動生成されません[^reshim]。次の経路が該当します[^reshim]。

- yarn や pnpm でグローバルに導入したコマンド。
- pip で導入したコマンド。

shim が無いコマンドを実行できるようにするには、`mise reshim` で shims を再生成します[^reshim]。

```shell
$ mise reshim
```

`mise reshim` は、現在インストール済みの全ツールの bin ディレクトリを調べ、新しい shims を作ります[^reshim]。`mise reshim` は、`mise.toml` で有効なツールだけでなく、インストール済みの全ツールの shims を作ります[^reshim]。

:::message
shims が更新されない不具合は、PATH activation を使う場合は起きません。PATH activation は、プロンプトを表示するたびに PATH を更新し、shim を介さずに実行ファイルを解決するためです。第 5 章で扱ったとおり、対話的なシェルでは PATH activation を選ぶと、shims の再生成を意識せずに済みます。
:::

## よくあるエラーと対処

ここまでの有効化・PATH・shims のほかに、設定の読み込みに関する不具合があります。代表的な症状・原因・確認・対処を次の表にまとめます。詳細は各章を参照してください。

| 症状 | 原因 | 確認 | 対処 |
| --- | --- | --- | --- |
| `Config files in ... are not trusted` が出る | `mise.toml` が信頼されていない（第 15 章） | `mise trust --show` で信頼状態を確認 | `mise trust` で設定ファイルを信頼する |
| `command not found` になる | ツールが未インストール | `mise ls` でインストール状態を確認 | `mise install` で `mise.toml` の全ツールを導入する |
| `.nvmrc`・`.python-version` を読まない | idiomatic version files が既定で無効（第 6 章） | `mise settings get idiomatic_version_file_enable_tools` で対象を確認 | `mise settings add idiomatic_version_file_enable_tools <ツール名>` で有効にする |
| 追加したコマンドが実行できない | shims が未生成（shims 方式） | `mise which <コマンド>` でパスを確認 | `mise reshim` で shims を再生成する |

:::details 各症状の背景
各症状の背景を補足します。

- 信頼されていない設定ファイルの不具合は、`[env]` のテンプレートやスクリプトを含む `mise.toml` で起きます[^trust]。プレーンな `[tools]` だけの設定は信頼を要しません[^trust]。信頼の仕組みは第 15 章で扱いました。
- ツールが未インストールの場合は、`mise install` を引数なしで実行すると、`mise.toml` で宣言した全ツールを導入できます[^install]。
- idiomatic version files は、mise 2025.10.0 以降、既定で無効です[^idiomatic]。`.nvmrc` や `.python-version` を読み込むには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します[^idiomatic]。設定の手順は第 6 章で扱いました。
:::

:::message
本章の表で対処できない不具合に出会った場合は、mise 公式ドキュメントの Troubleshooting を参照します[^troubleshooting]。`mise doctor` の出力を添えて mise のリポジトリへ Issue を報告する方法も、Troubleshooting に記載があります[^troubleshooting]。
:::

## 本章のまとめ

- 不具合の切り分けは `mise doctor`（エイリアス `mise dr`）から始めます。`activated` で PATH activation の有効化を、`shims_on_path` で shims の PATH 登録を確認します。problem があれば末尾に一覧を出力し、終了コードを `1` で返します。warning は終了コードに影響しません。
- activate 漏れは、`mise doctor` の `activated: no` と、`which`・`mise which` のパスの食い違いで切り分けます。対処は、シェルの設定に `mise activate` を追記してシェルへ反映する手順です（第 3 章）。
- PATH の競合は、`which -a <コマンド>` で PATH の順序を確認します。Homebrew の PATH 設定より後に `mise activate` を置くと、mise のパスが前方に来ます。
- shims が更新されない不具合は、shims 方式で起きます。mise はインストール・更新・削除と `npm install -g` では自動で再生成しますが、yarn・pnpm・pip など mise が把握しない経路では `mise reshim` を実行します。PATH activation を使う場合は起きません。
- 設定の読み込みに関する不具合は、信頼（第 15 章）・未インストール・idiomatic version files（第 6 章）が代表例です。症状・原因・確認・対処の対応を押さえ、対処できない場合は公式の Troubleshooting を参照します。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^doctor]: `mise doctor` コマンド（用途・エイリアス `mise dr`・`activated` と `shims_on_path` の出力・`mise doctor path` サブコマンド）。mise 公式ドキュメント「mise doctor」<https://mise.jdx.dev/cli/doctor.html>。problem と warning の区別、および problem の有無で決まる終了コード（`1` または `0`）は、`mise doctor --help` の出力と mise 2026.6.10 の実行結果で確認できます。
[^which]: `mise which` コマンド（mise が解決する実行ファイルのパス表示）。mise 公式ドキュメント「mise which」<https://mise.jdx.dev/cli/which.html>
[^shims]: PATH activation と shims の違い・shims ディレクトリ・PATH 解決の挙動。mise 公式ドキュメント「Shims」<https://mise.jdx.dev/dev-tools/shims.html>
[^reshim]: `mise reshim` コマンド（shims の再生成・インストール時などの自動再生成・`npm install -g` の自動対応・yarn / pnpm など把握しない経路での手動実行・全ツールを対象とする点）。mise 公式ドキュメント「mise reshim」<https://mise.jdx.dev/cli/reshim.html>
[^trust]: `mise trust` コマンドと信頼の仕組み（信頼が不要な安全な設定の条件・`--show`）。mise 公式ドキュメント「mise trust」<https://mise.jdx.dev/cli/trust.html>
[^install]: `mise install` コマンド（引数なしで `mise.toml` の全ツールを導入する点）。mise 公式ドキュメント「mise install」<https://mise.jdx.dev/cli/install.html>
[^idiomatic]: idiomatic version files（`.nvmrc`・`.python-version` など）の既定が無効である点（mise 2025.10.0 以降）と `idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Settings」<https://mise.jdx.dev/configuration/settings.html>
[^troubleshooting]: mise の一般的な不具合と対処、および Issue の報告方法。mise 公式ドキュメント「Troubleshooting」<https://mise.jdx.dev/troubleshooting.html>
