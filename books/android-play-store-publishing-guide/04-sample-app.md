---
title: "サンプルアプリを作る"
---

本章では、公開対象となる最小の Android アプリを Jetpack Compose で作成します。Jetpack Compose は Kotlin のコードで画面を組み立てる Android の UI ツールキットです（「前提知識と用語」章を参照）。Android Studio で新規プロジェクトを作成し、テンプレートに「Empty Activity」を選びます。「Empty Activity」は Jetpack Compose を使った最小構成のテンプレートです。

## バージョン構成

本書のサンプルは次のバージョンで構成します。いずれも 2026 年 6 月時点の最新安定版です。

| ツール / ライブラリ | バージョン |
| --- | --- |
| Android Studio | Quail（2026.1.1） |
| Android Gradle Plugin（AGP） | 9.2.1 |
| Gradle | 9.4.1 |
| Kotlin | 2.3.10 |
| Jetpack Compose BOM | 2026.05.01 |
| compileSdk / targetSdk | 36（Android 16） |
| minSdk | 24（Android 7.0） |
| JDK | 17 |

AGP・Gradle・バージョンカタログ・BOM・`compileSdk` / `targetSdk` / `minSdk` の各用語は「前提知識と用語」章にまとめています。意味が分からない場合は参照してください。

:::message
新規アプリとアプリ更新は、ターゲット API レベルを Android 15（API 35）以上にする必要があります（2025 年 8 月 31 日から適用）[^target-api]。ターゲット API レベルの要件は毎年 8 月ごろに 1 つ引き上げられ、2026 年 8 月には Android 16（API 36）が必須になる見込みです。本書は targetSdk を 36 に設定し、要件を満たします。
:::

[^target-api]: ターゲット API レベルの要件は [ターゲット API レベルの要件を満たす](https://developer.android.com/google/play/requirements/target-sdk) を参照してください。

## 新規プロジェクトを作成する

Android Studio を起動し、ウェルカム画面で「New Project」を選びます。次に、テンプレート選択画面で「Empty Activity」を選び、「Next」を押します。続く「Configure your project」画面で、次の項目を設定します[^create-project]。

- **Name**: アプリの表示名。本書では `MyComposeApp` を使います。
- **Package name**: アプリのパッケージ名。`app/build.gradle.kts` の `applicationId` の初期値になります。本書では `com.example.mycomposeapp` を使います。
- **Save location**: プロジェクトを保存するローカルのフォルダ。
- **Language**: サンプルコードを生成する言語。`Kotlin` を選びます。
- **Minimum API level**: 動作対象とする最小の API レベル。`API 24 (Android 7.0)` を選びます。
- **Build configuration language**: ビルド設定ファイルの記述言語。`Kotlin DSL (build.gradle.kts)` を選びます。

設定後に「Finish」を押すと、Android Studio がプロジェクトの雛形を生成します。

[^create-project]: ウィザードの各項目は [Create a project](https://developer.android.com/studio/projects/create-project) を参照してください。`Build configuration language` の既定は Kotlin DSL です。

:::message
`Package name` の値は、世界で一意になるよう、所有するドメインを逆順にした形で入力します。本書では例として `com.example.mycomposeapp` を使います。`Build configuration language` で `Kotlin DSL` を選ぶと、ビルド設定ファイルの拡張子が `.kts` になり、本書のコード（`app/build.gradle.kts`）と一致します。
:::

## プロジェクトの構成

テンプレートが生成するプロジェクトは、次のディレクトリ構成を持ちます。本書で編集するファイルのみを抜粋します。

```text
MyComposeApp/
├── settings.gradle.kts            # 参加モジュールとリポジトリの定義
├── gradle/
│   └── libs.versions.toml         # 依存とプラグインのバージョンカタログ
└── app/
    ├── build.gradle.kts           # app モジュールのビルド設定
    └── src/
        └── main/
            ├── AndroidManifest.xml # アプリの構成宣言
            └── java/
                └── com/example/mycomposeapp/
                    └── MainActivity.kt # 起動時の画面
```

テンプレートは上記以外にも、テーマ定義・テストコード・リソースファイルなどを生成します。本書で内容を編集するファイルは、`gradle/libs.versions.toml`・`app/build.gradle.kts`・`MainActivity.kt` の 3 つです。`settings.gradle.kts` と `AndroidManifest.xml` は、生成された内容のまま使います。

## バージョンカタログ

依存とプラグインのバージョンは `gradle/libs.versions.toml` で一元管理します。生成された内容を、次のように置き換えます。

```toml:gradle/libs.versions.toml
[versions]
agp = "9.2.1"
kotlin = "2.3.10"
composeBom = "2026.05.01"
activityCompose = "1.13.0"
lifecycle = "2.10.0"

[libraries]
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
```

AGP 9.0 以降は Kotlin の組み込みサポートが既定で有効になり、`org.jetbrains.kotlin.android` プラグインは適用しません。Compose コンパイラプラグインは引き続き適用し、バージョンは組み込みの Kotlin に合わせます。AGP 9.2 は Kotlin 2.3.10 を同梱するため、カタログの `kotlin` も 2.3.10 にそろえます。

:::message alert
`org.jetbrains.kotlin.android` プラグインを適用するとビルドが失敗します[^builtin-kotlin]。
:::

[^builtin-kotlin]: 組み込み Kotlin への移行は [Migrate to built-in Kotlin](https://developer.android.com/build/migrate-to-built-in-kotlin) を参照してください。

## モジュールのビルド設定

`app/build.gradle.kts` を次のように設定します。署名設定は「アプリに署名する」章で追加するため、現時点では含めません。

```kotlin:app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.example.mycomposeapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.mycomposeapp"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
```

## アプリ識別子とバージョン

ビルド設定には、公開で重要な 4 つの値があります。意味を取り違えると公開後に修正できないため、先に理解します。各用語の概要は「前提知識と用語」章にもまとめています。

| 項目 | 役割 |
| --- | --- |
| `namespace` | ビルド時の Kotlin パッケージ名。`R` クラスや `BuildConfig` の名前空間を決める |
| `applicationId` | 配布時のアプリ一意 ID。Google Play と端末上でアプリを識別する。公開後は変更不可 |
| `versionCode` | 内部のバージョン番号（整数）。更新ごとに増やす。ユーザーには表示されない |
| `versionName` | ユーザーに表示するバージョン文字列。例として `1.0` |

:::message alert
`applicationId` は、世界で一意になるよう、所有するドメインを逆順にした形（例として `com.example.mycomposeapp`）にします。公開後は変更できないため、慎重に決めてください。
:::

## 画面を実装する

最小の画面を Composable で実装します。Composable は Compose で画面の部品を定義する関数です（「前提知識と用語」章を参照）。テンプレートが生成した `MainActivity.kt` を、次の内容に置き換えます。

```kotlin:app/src/main/java/com/example/mycomposeapp/MainActivity.kt
package com.example.mycomposeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Play Store",
                        modifier = Modifier.padding(innerPadding),
                    )
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(text = "Hello, $name!", modifier = modifier)
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MaterialTheme {
        Greeting(name = "Play Store")
    }
}
```

`MainActivity` は、アプリの起動時に表示する Activity です。Activity は Android アプリの画面の単位です（「前提知識と用語」章を参照）。`Greeting` は文字列を表示する Composable で、`GreetingPreview` は Android Studio のプレビュー表示用の関数です。

## アプリを実行する

実装したアプリを、エミュレータまたは実機で実行します。Android Studio のツールバーで、対象とするデバイスを選びます。デバイスの準備は次のとおりです。

- エミュレータがない場合は、Device Manager で仮想デバイスを作成します。
- 実機を使う場合は、端末で USB デバッグを有効にしてから USB ケーブルで接続します。

対象デバイスを選んだら、次の手順で実行します。

1. ツールバーの Run（実行）ボタン（緑の三角アイコン）を押します。
2. Android Studio がアプリをビルドし、選んだデバイスに APK をインストールして起動します。
3. 起動すると、`Hello, Play Store!` と表示する画面が現れます。

APK は端末にインストールできる Android アプリの実行ファイルです（「前提知識と用語」章を参照）。

本書のサンプルは、上記の構成で実機ビルドを確認しています（`assembleDebug` による APK 生成を確認済み）。ビルドの検証手順は「トラブルシューティング」章で扱います。

## 確認

- Android Studio がプロジェクトの雛形を生成し、`app/build.gradle.kts` と `MainActivity.kt` を編集できる。
- Run（実行）ボタンでアプリがビルドされ、エミュレータまたは実機にインストールされる。
- 起動したアプリに `Hello, Play Store!` の画面が表示される。
- `applicationId` を、公開後に変更しない値として確定している。
