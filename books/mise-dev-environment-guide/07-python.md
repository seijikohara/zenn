---
title: "Python"
---

本章では、Python とその周辺ツール（uv・pipx・poetry）を mise で管理する方法を扱います。読了後には、Python のバージョンを `mise.toml` で固定し、依存・プロジェクト管理ツールと仮想環境の自動有効化までを 1 つの設定ファイルにまとめて宣言できるようになります。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。前提となる内容は、次の章で扱いました。

- mise 自体のインストール: 第 3 章
- `mise.toml` の構文: 第 4 章
- `mise install` / `mise use` / `mise ls` などの操作: 第 5 章

本章はコマンドの基本操作を再説明せず、Python 固有の事情に集中します。pyenv からの移行手順は第 17 章で扱います。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## Python のバージョン管理

mise は Python を core backend で組み込み対応します[^python]。core backend は、mise が標準で内蔵するツールの取得方法です。Python は backend の追加設定なしに、ツール名 `python` で宣言できます。backend の仕組みの詳細は第 12 章で扱います。

### バージョンの指定方法

`python` のバージョン指定には、第 4 章で説明した構文を使います。指定方法は次の 3 つです[^python]。

- 完全指定: バージョンを 1 つに固定する。
- 部分指定: 先頭の一部だけを書き、該当系列の最新に解決する。
- `latest`: 最新の安定版に解決するエイリアス。

完全指定は、3.13.7 のようにバージョンを 1 つに固定します。

```toml:mise.toml
[tools]
python = "3.13.7"  # 完全指定。3.13.7 に固定
```

部分指定は、先頭の一部だけを書きます。`python = "3.13"` は、3.13 系の最新バージョン（執筆時点では 3.13.7）に解決されます。`latest` は最新の安定版に解決します。

```toml:mise.toml
[tools]
python = "3.13"  # 3.13 系の最新に解決
```

Python には Node.js の LTS のような長期サポートの系列指定はありません。再現性が必要なプロジェクトでは、完全指定でバージョンを固定します。

### mise が Python を供給する方法

mise は、既定でプリコンパイル済みのスタンドアロンビルドを取得します[^python]。スタンドアロンビルドは、Astral が配布する python-build-standalone[^pbs] のバイナリです。ビルド済みの実行ファイルを取得するため、インストールは短時間で完了します。

ソースからのコンパイルが必要になる場合もあります。mise の取得方法は `python.compile` 設定で制御します[^python-compile]。設定値ごとの挙動を次の表にまとめます。

| `python.compile` | 取得方法 |
| --- | --- |
| 未設定（既定） | プリコンパイル済みバイナリを優先する。対象プラットフォーム向けが無ければソースからビルドする |
| `false` | 常にプリコンパイル済みバイナリを取得する |
| `true` | 常に python-build でソースからビルドする |

未設定の場合、mise はプリコンパイル済みバイナリを優先し、対象プラットフォーム向けが無いときだけソースからビルドします[^python-compile]。macOS の一般的な構成では、プリコンパイル済みバイナリを取得します。

:::details ソースからビルドする場合の依存
ソースからビルドする場合、mise は python-build を使います[^python]。python-build は pyenv に含まれるビルドツールです。ソースビルドには pyenv と同じビルド依存が必要で、OpenSSL などのライブラリをあらかじめ用意します[^python]。Homebrew で OpenSSL を導入し、ビルド時のフラグを指定する手順は mise 公式ドキュメントの Python ページで扱います[^python]。
:::

:::message
プリコンパイル済みバイナリとソースビルドは、ビルドオプションが異なる場合もあります。プリコンパイル済みバイナリで不具合が出るときは、`python.compile = true` を設定してソースからビルドします。macOS で追加のビルド依存が不要なのは、プリコンパイル済みバイナリを使う場合です。
:::

### インストールと確認

`mise use` でバージョンを宣言し、インストールします。次の例は、プロジェクトのディレクトリで Python 3.13.7 を宣言します。

```shell
$ mise use python@3.13.7
mise python@3.13.7  ✓ installed
mise ~/work/my-app/mise.toml tools: python@3.13.7
```

インストール後、`python --version` で有効なバージョンを確認します。

```shell
$ python --version
Python 3.13.7
```

mise が供給する Python には、標準ライブラリの `venv` モジュールと `pip` が含まれます。`pip --version` で、利用できる pip を確認します。

```shell
$ pip --version
pip 25.2 from ~/.local/share/mise/installs/python/3.13.7/lib/python3.13/site-packages/pip (python 3.13)
```

### pyenv の .python-version を読み込む

mise は、pyenv が使う `.python-version` を読み込めます[^idiomatic]。pyenv から移行する際に、既存の設定ファイルをそのまま利用できます。mise は、asdf のレガシーバージョンファイルにならって、`.python-version` を idiomatic version files と呼びます[^idiomatic]。

ただし、idiomatic version files の読み込みは既定で無効です[^idiomatic]。`.python-version` を置いただけでは、mise は Python のバージョンを解決しません。読み込みを有効にするには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools python
```

設定を追加すると、mise は `.python-version` の内容を Python のバージョンとして解決します。次の例は、`3.13.7` を記述した `.python-version` を読み込んだ結果です。`Source` 列が `.python-version` を指します。

```shell
$ mise ls python
Tool    Version   Source                          Requested
python  3.13.7    ~/work/my-app/.python-version   3.13.7
```

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。新規のプロジェクトでは `mise.toml` を使い、`.python-version` は pyenv からの移行や互換性の維持に用います。pyenv からの移行手順は第 17 章で扱います。
:::

## uv・pipx・poetry の管理

Python の開発では、パッケージや依存を扱うツールを Python 本体と別に導入します。代表的なツールに uv・pipx・poetry があります。mise はこれらを registry に登録しており、ツール名で `mise.toml` に宣言できます[^registry]。registry は、mise が認識するツール名と取得方法の対応表です。取得に使う backend はツールごとに異なります。backend の使い分けの詳細は第 12 章で扱います。

各ツールの役割と取得に使う backend は次のとおりです[^registry]。

| ツール | 役割 | backend |
| --- | --- | --- |
| uv | パッケージ・プロジェクト管理 | aqua |
| pipx | コマンドラインアプリケーションの隔離環境への導入 | aqua |
| poetry | 依存・パッケージ管理 | vfox |

```toml:mise.toml
[tools]
python = "3.13.7"
uv = "latest"
```

### uv

uv は Astral が開発する Python のパッケージ・プロジェクトマネージャです。mise はツール名 `uv` で uv を宣言できます。mise は aqua backend で uv のプリビルドバイナリを取得します[^registry]。aqua backend は、プリビルドバイナリの配布定義を集めた仕組みです。

uv 自体も Python のバージョンを管理する機能を持ちます。本書は mise を Python のバージョン管理の主とし、uv は依存・プロジェクト管理に使う立場をとります。mise が管理する Python を uv から利用できるため、両者を併用できます。Python のバージョンは `mise.toml` の `[tools]` で固定し、依存の解決とロックは uv に任せます。

インストール後の確認は、`uv --version` で行います。

```shell
$ uv --version
uv 0.9.7
```

### pipx

pipx は、Python 製のコマンドラインアプリケーションを専用の隔離環境にインストールするツールです。mise はツール名 `pipx` で pipx を宣言できます。mise は aqua backend で pipx を取得します[^registry]。

mise には、ツール名としての `pipx` とは別に、pipx backend があります[^pipx-backend]。pipx backend は、`pipx:` を接頭辞に付けて PyPI のアプリケーションを直接インストールする取得方法です。例えば `pipx:black` は、コードフォーマッタの black を PyPI から導入します。ツール名の `pipx`（pipx 本体）と、backend の `pipx:`（pipx 経由のアプリ導入）は別物です。

```toml:mise.toml
[tools]
"pipx:black" = "latest"  # pipx backend で black を導入
```

### poetry

poetry は Python の依存・パッケージ管理ツールです。mise はツール名 `poetry` で poetry を宣言できます。mise は vfox backend で poetry を取得します[^registry]。uv と pipx が aqua backend で取得されるのに対し、poetry は vfox backend で取得される点が異なります。vfox backend は、vfox プラグインを通じてツールを導入する仕組みです。

```toml:mise.toml
[tools]
poetry = "2.2.1"  # 完全指定でバージョンを固定
```

poetry もバージョン指定構文に対応します。完全指定でバージョンを固定すると、チームの全員が同じバージョンの poetry を使えます。

## 仮想環境との住み分け

Python では、プロジェクトごとの依存を仮想環境（venv）で隔離します。venv は、標準ライブラリの `venv` モジュールが作る独立した環境です。mise と venv は役割が異なります。mise は Python インタプリタのバージョンを管理し、venv はプロジェクトの依存を隔離します。両者を組み合わせて、Python のバージョンと依存の両方を固定します。

### mise による venv の自動有効化

mise は、`mise.toml` の `[env]` セクションで venv を自動有効化できます[^python]。`_.python.venv` キーで venv のパスを指定すると、mise はディレクトリへ入ったときに venv を有効化します。文字列でパスだけを指定する記法と、テーブルでオプションを指定する記法があります[^python]。

```toml:mise.toml
[tools]
python = "3.13.7"

[env]
_.python.venv = { path = ".venv", create = true }
```

テーブルで指定するオプションは次のとおりです[^python]。

- `path`: venv のパス。プロジェクトのルートからの相対パスで指定する。
- `create`: `true` にすると、指定したパスに venv が無いときに mise が venv を作成する。省略した場合、venv はあらかじめ手動で作成しておく必要がある。

venv の作成には、`[tools]` で解決した Python が使われます[^python]。別のバージョンを使う場合は、`python` オプションでバージョンを指定します。`[tools]` で uv を宣言してインストール済みの場合、mise は venv の作成に uv を使い、uv が無い場合は標準の `python -m venv` を使います[^python]。

:::message
venv の有効化は、`mise activate` でシェルに mise を組み込んだ状態で機能します[^python]。`mise activate` でディレクトリに入ると、mise は環境変数 `VIRTUAL_ENV` を設定し、venv の `bin` ディレクトリを PATH の先頭に加えます。shim だけを使う構成では venv の `bin` が PATH に加わりません。`mise activate` の設定は第 3 章で扱いました。
:::

自動有効化を設定したディレクトリに入ると、`python` は venv 内のインタプリタを指します。`which python` で、PATH 上の `python` が venv の `bin` を指すことを確認できます。

```shell
$ cd ~/work/my-app
$ echo $VIRTUAL_ENV
~/work/my-app/.venv
$ which python
~/work/my-app/.venv/bin/python
```

ディレクトリを離れると、mise は venv を無効化します。`VIRTUAL_ENV` は解除され、`python` は mise が管理するバージョンに戻ります。venv を手動で有効化・無効化する必要はありません。

### pyenv-virtualenv との違い

pyenv では、仮想環境の管理に pyenv-virtualenv プラグインを使います。pyenv-virtualenv は、venv や virtualenv を pyenv が管理するバージョンの 1 つとして扱い、`.python-version` でバージョンと同じ仕組みで切り替えます。mise の自動有効化は仕組みが異なります。mise は venv の作成を標準の `venv` モジュール（または uv）に任せ、`mise.toml` の `[env]` で venv のパスを指定して有効化します。venv は通常のディレクトリとして残るため、mise を介さずに有効化する操作も可能です。

:::message
venv の自動有効化は Python 固有の設定のため、本章で扱いました。`[env]` セクションによる環境変数の管理は、Python 以外のツールでも共通に使えます。`[env]` の一般的な使い方は第 13 章で扱います。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、Python プロジェクトの `mise.toml` の例を示します。Python のバージョンを固定し、依存管理に uv を宣言し、venv を自動有効化します。

```toml:mise.toml
[tools]
python = "3.13.7"  # Python のバージョンを固定
uv = "latest"      # 依存・プロジェクト管理に uv を使う

[env]
_.python.venv = { path = ".venv", create = true }  # .venv を自動で作成・有効化
```

設定後、`mise install` でツールをまとめてインストールします。インストール後、各ツールのバージョンと venv の有効化を確認します。

```shell
$ mise install
mise python@3.13.7  ✓ installed
mise uv@0.9.7       ✓ installed
$ python --version
Python 3.13.7
$ uv --version
uv 0.9.7
$ echo $VIRTUAL_ENV
~/work/my-app/.venv
```

`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じバージョンの Python と uv を使い、同じパスの venv を自動で有効化できます。

## 本章のまとめ

- mise は Python を core backend で組み込み対応します。ツール名 `python` で宣言し、完全指定・部分指定・`latest` でバージョンを指定します。
- mise は既定でプリコンパイル済みのスタンドアロンビルド（python-build-standalone）を取得します。`python.compile = true` を設定すると、python-build でソースからビルドします。
- mise は pyenv の `.python-version` を読み込めますが、mise 2025.10.0 以降は既定で無効です。`idiomatic_version_file_enable_tools` にツール名を追加して有効にします。
- uv・pipx・poetry は registry に登録され、ツール名で宣言します。uv と pipx は aqua backend、poetry は vfox backend で取得します。pipx backend（`pipx:`）は、ツール名の pipx とは別に PyPI のアプリケーションを導入します。
- mise は Python インタプリタのバージョンを管理し、venv はプロジェクトの依存を隔離します。`mise.toml` の `[env]` で `_.python.venv` を指定すると、mise が venv を自動で作成・有効化します。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^python]: mise での Python の管理（core backend・プリコンパイル済みバイナリの取得・python-build を使うソースビルド・`_.python.venv` による venv 自動有効化・uv 連携）。mise 公式ドキュメント「Python」<https://mise.jdx.dev/lang/python.html>
[^pbs]: プリコンパイル済みの Python スタンドアロンビルドの配布元。Astral「python-build-standalone」<https://github.com/astral-sh/python-build-standalone>
[^python-compile]: `python.compile` 設定の値（未設定・`false`・`true`）と取得方法の対応。mise 公式ドキュメント「Settings」<https://mise.jdx.dev/configuration/settings.html>
[^idiomatic]: mise が読み込む idiomatic version files（`.python-version` など）と、既定で無効である点、`idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^registry]: mise registry でのツール名と backend の対応（uv は aqua、pipx は aqua、poetry は vfox で取得）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^pipx-backend]: pipx backend の記法（`pipx:` を接頭辞に PyPI などのアプリケーションを導入）。mise 公式ドキュメント「pipx backend」<https://mise.jdx.dev/dev-tools/backends/pipx.html>
