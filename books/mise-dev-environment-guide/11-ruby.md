---
title: "Ruby"
---

本章では、Ruby 本体と gem・bundler の運用を mise で管理する方法を扱います。読了後には、Ruby のバージョンを `mise.toml` で固定し、Ruby プロジェクトの設定ファイルを書けるようになります。あわせて、mise が Ruby をソースからビルドする仕組みと、ビルドに必要な依存ライブラリを整理します。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。本章はコマンドの基本操作を再説明せず、Ruby 固有の事情に集中します。rbenv からの移行手順は第 17 章で扱います。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## Ruby のバージョン管理

mise は Ruby を core backend で組み込み対応します[^ruby]。core backend は、mise が標準で内蔵するツールの取得方法です。Ruby は backend の追加設定なしに、ツール名 `ruby` で宣言できます。backend の仕組みの詳細は第 12 章で扱います。

### バージョンの指定方法

`ruby` のバージョン指定には、第 4 章で説明した構文を使います。完全指定・部分指定に加えて、`latest` のエイリアスを利用できます[^ruby]。完全指定はバージョンを固定します。

```toml:mise.toml
[tools]
ruby = "3.4.9"  # 完全指定。3.4.9 に固定
```

部分指定は、先頭の一部だけを書きます。次の例は 3.4 系の最新バージョンに解決します。

```toml:mise.toml
[tools]
ruby = "3.4"  # 3.4 系の最新に解決
```

部分指定・`latest` の解決結果を、執筆時点の値とあわせて次の表にまとめます[^ruby-downloads]。

| 指定 | 解決方法 | 執筆時点の解決結果 |
| --- | --- | --- |
| `ruby = "3.4"` | 3.4 系の最新バージョンに解決する | 3.4.9 |
| `ruby = "3"` | 3 系列の最新版に解決する | 3.4.9 |
| `ruby = "4"` | 4 系列の最新版に解決する | 4.0.5 |
| `ruby = "latest"` | 最新の安定版に解決する | 4.0.5 |

:::message
`latest` と部分指定は、インストール時点での最新版に解決します。インストール後はバージョンが固定され、自動では更新されません。再現性が必要なプロジェクトでは、完全指定でバージョンを固定します。
:::

### mise が Ruby を供給する方法

mise は、既定では ruby-build を使い、ソースコードから Ruby をコンパイルしてインストールします[^ruby]。ruby-build は rbenv に含まれるビルドツールで、Ruby のソースを取得してビルドします[^ruby-build]。Node.js のようにビルド済みの実行ファイルを取得する方式ではないため、インストールには時間がかかります。

mise の取得方法は `ruby.compile` 設定で制御します[^ruby]。設定値ごとの挙動を次の表にまとめます。

| `ruby.compile` | 取得方法 |
| --- | --- |
| 未設定（既定） | ソースからビルドする |
| `true` | 常に ruby-build でソースからビルドする |
| `false` | プリコンパイル済みバイナリを取得する |

:::message
mise は、`ruby.compile` の既定の挙動を 2026.8.0 でプリコンパイル済みバイナリの取得へ変更する予定です[^ruby]。執筆時点（2026.6.10）の既定はソースビルドです。挙動を固定したい場合は、`ruby.compile` を明示的に設定します。
:::

### ビルド要件

ruby-build でソースから Ruby をビルドするには、ビルド用の依存ライブラリをあらかじめ用意します[^ruby]。mise 公式ドキュメントは、必要な依存ライブラリを ruby-build のドキュメントに従って導入するよう案内します[^ruby]。macOS では、ruby-build の推奨する依存ライブラリを Homebrew で導入します[^ruby-build-env]。

```shell
$ xcode-select --install
$ brew install openssl@3 readline libyaml gmp autoconf
```

`xcode-select --install` は、コンパイラを含む Command Line Tools を導入します。Homebrew で導入する各ライブラリの用途は次のとおりです[^ruby-build-env]。

| ライブラリ | 用途 |
| --- | --- |
| `openssl@3` | TLS 通信 |
| `readline` | 対話シェル（irb）の行編集 |
| `libyaml` | YAML を扱う標準ライブラリ（psych） |
| `gmp` | 多倍長整数の演算 |

:::message
ruby-build は、互換性のある OpenSSL を自動で検出してリンクします[^ruby-build-env]。Homebrew で `openssl@3` を導入していれば、リンク先を指定する追加の設定は不要です。Ruby 3.4 系・4.0 系は OpenSSL 3 に対応します。
:::

:::message
ソースビルドには時間がかかります。実行環境やバージョンによって所要時間は変わりますが、プリビルドバイナリを取得する Node.js や Go と比べて、インストールは長くなります。CI では、インストール済みディレクトリをキャッシュしてビルドの繰り返しを避けます。CI での mise の利用は第 16 章で扱います。
:::

### インストールと確認

`mise use` でバージョンを宣言し、インストールします。次の例は、プロジェクトのディレクトリで Ruby 3.4.9 を宣言します。

```shell
$ mise use ruby@3.4.9
mise ruby@3.4.9  ✓ installed
mise ~/work/my-app/mise.toml tools: ruby@3.4.9
```

インストール後、`ruby --version` で有効なバージョンを確認します。`ruby -v` は `ruby --version` の短縮形です。

```shell
$ ruby --version
ruby 3.4.9 (2026-03-11 revision 76cca827ab) +PRISM [x86_64-darwin24]
```

末尾の `x86_64-darwin24` は、実行環境の CPU アーキテクチャと OS を表します。Apple Silicon の Mac では `arm64-darwin24` のように、実行環境に応じて変わります。

### .ruby-version を読み込む

mise は、rbenv が使う `.ruby-version` を読み込めます[^idiomatic]。`Gemfile` が Ruby のバージョンを指定する場合は、`Gemfile` の指定も読み込めます[^ruby]。rbenv から移行する際に、既存の設定ファイルをそのまま利用できます。mise は、asdf のレガシーバージョンファイルにならって、`.ruby-version` を idiomatic version files と呼びます[^idiomatic]。

ただし、idiomatic version files の読み込みは既定で無効です[^idiomatic]。`.ruby-version` を置いただけでは、mise は Ruby のバージョンを解決しません。読み込みを有効にするには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools ruby
```

設定を追加すると、mise は `.ruby-version` の内容を Ruby のバージョンとして解決します。次の例は、`3.4.9` を記述した `.ruby-version` を読み込んだ結果です。`Source` 列が `.ruby-version` を指します。

```shell
$ mise ls ruby
Tool  Version   Source                          Requested
ruby  3.4.9     ~/work/my-app/.ruby-version     3.4.9
```

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。新規のプロジェクトでは `mise.toml` を使い、`.ruby-version` は rbenv からの移行や互換性の維持に用います。rbenv からの移行手順は第 17 章で扱います。
:::

## gem と bundler の扱い

Ruby のパッケージは gem の形式で配布します。Ruby には gem を扱う RubyGems[^rubygems] が同梱され、`gem` コマンドで gem をインストールできます。Ruby のインストールに付随するため、mise で gem 本体を個別に宣言する必要はありません。`gem --version` で、利用できる RubyGems のバージョンを確認します。`gem -v` は `gem --version` の短縮形です。

```shell
$ gem --version
3.6.9
```

### gem のインストール先

mise は、Ruby のインストールごとに独立したディレクトリを作ります。gem のインストール先も Ruby のバージョンごとに分かれます。`gem environment gemdir` で、gem のインストール先を確認します。

```shell
$ gem environment gemdir
~/.local/share/mise/installs/ruby/3.4.9/lib/ruby/gems/3.4.0
```

インストール先が Ruby のバージョンごとに分かれるため、`gem install` した gem は、バージョンを切り替えると見えなくなります。プロジェクトで同じ gem を使うには、各 Ruby のバージョンで `gem install` するか、後述の bundler で `Gemfile` から依存を管理します。

:::message
mise には、Ruby のインストール後に gem を自動でインストールする `ruby.default_packages_file` 設定があります[^ruby]。設定したファイルに gem 名を列挙すると、mise は Ruby のインストール時にその gem を `gem install` します。ただし `ruby.default_packages_file` は非推奨です[^ruby]。プロジェクトの依存は、`ruby.default_packages_file` ではなく bundler の `Gemfile` で管理します。
:::

### bundler の扱い

bundler は、`Gemfile` に記述した依存 gem をプロジェクト単位で解決・固定するツールです[^bundler]。bundler は Ruby 2.6 以降に default gem として同梱されるため、Ruby をインストールすれば `bundle` コマンドを利用できます[^rubygems]。`bundle --version` で、同梱された bundler のバージョンを確認します。

```shell
$ bundle --version
Bundler version 2.6.9
```

mise の registry には bundler が登録されていません。`mise.toml` の `[tools]` に `bundler` を宣言する運用は取りません。bundler を更新する場合は、gem として導入します。

```shell
$ gem install bundler
```

bundler は、`Gemfile` と `Gemfile.lock` を使って依存 gem のバージョンを固定します。mise は Ruby 本体のバージョンを固定し、bundler はプロジェクトの依存 gem を固定します。両者を組み合わせて、Ruby のバージョンと依存 gem の両方を再現できる状態にします。

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、Ruby プロジェクトの `mise.toml` の例を示します。Ruby のバージョンを固定します。依存 gem は bundler の `Gemfile` で管理するため、`mise.toml` には記述しません。

```toml:mise.toml
[tools]
ruby = "3.4.9"  # Ruby のバージョンを固定
```

設定後、`mise install` でツールをインストールします。インストール後、Ruby と gem・bundler のバージョンを確認します。

```shell
$ mise install
mise ruby@3.4.9  ✓ installed
$ ruby --version
ruby 3.4.9 (2026-03-11 revision 76cca827ab) +PRISM [x86_64-darwin24]
$ gem --version
3.6.9
$ bundle --version
Bundler version 2.6.9
```

依存 gem を `Gemfile` に記述したら、`bundle install` で依存を解決します。`bundle install` は、解決した依存を `Gemfile.lock` に書き出します。

```shell
$ bundle install
```

`mise.toml` と `Gemfile`・`Gemfile.lock` をバージョン管理システムにコミットすると、チームの全員が同じバージョンの Ruby と依存 gem を再現できます。

## 本章のまとめ

- mise は Ruby を core backend で組み込み対応します。ツール名 `ruby` で宣言し、完全指定・部分指定・`latest` でバージョンを指定します。
- mise は既定で ruby-build を使い、ソースから Ruby をビルドします。`ruby.compile` で取得方法を制御します。既定の挙動は 2026.8.0 でプリコンパイル済みバイナリの取得へ変わる予定です。
- ソースビルドには依存ライブラリが必要です。macOS では Homebrew で `openssl@3 readline libyaml gmp autoconf` を導入します。
- mise は rbenv の `.ruby-version` を読み込めますが、mise 2025.10.0 以降は既定で無効です。`idiomatic_version_file_enable_tools` にツール名を追加して有効にします。
- Ruby には RubyGems が同梱され、gem のインストール先は Ruby のバージョンごとに分かれます。bundler は registry に無いため gem として導入し、依存 gem は `Gemfile` で管理します。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^ruby]: mise での Ruby の管理（core backend・ruby-build によるソースビルド・`ruby.compile` 設定・ビルド依存・`ruby.default_packages_file` 設定・`Gemfile` の読み込み）。mise 公式ドキュメント「Ruby」<https://mise.jdx.dev/lang/ruby.html>
[^ruby-build]: ruby-build は Ruby のソースを取得してコンパイルするツールで、rbenv に含まれます。mise はソースビルドに ruby-build を使います。rbenv 公式リポジトリ「ruby-build」<https://github.com/rbenv/ruby-build>
[^ruby-build-env]: ruby-build がソースビルドに推奨する macOS の依存ライブラリ（`openssl@3`・`readline`・`libyaml`・`gmp`・`autoconf`）と、OpenSSL の自動検出。rbenv 公式リポジトリ「ruby-build Wiki」<https://github.com/rbenv/ruby-build/wiki>
[^ruby-downloads]: Ruby の最新安定版（執筆時点で 4.0.5）と各系列の最新版。Ruby 公式「Downloads」<https://www.ruby-lang.org/en/downloads/>
[^idiomatic]: mise が読み込む idiomatic version files（`.ruby-version` など）と、既定で無効である点、`idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^rubygems]: RubyGems は Ruby に同梱される gem 管理システムです。bundler は Ruby 2.6 以降に default gem として同梱されます。RubyGems 公式「RubyGems Guides」<https://guides.rubygems.org/>
[^bundler]: bundler は `Gemfile` に記述した依存 gem を解決・固定するツールです。Bundler 公式「Bundler」<https://bundler.io/>
