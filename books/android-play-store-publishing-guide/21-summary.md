---
title: "まとめ"
---

本書では、Android アプリをゼロから作成し、Google Play で公開し、自動化と収益化までを扱いました。本章で全体を振り返り、公開前のチェックリストを示します。

## 公開までの流れ

公開に必須の手順は次のとおりです。

1. 開発環境を整え、デベロッパーアカウントを登録する。
2. サンプルアプリを作成する。
3. アップロード鍵を作成し、署名設定を追加する。
4. リリース用の AAB をビルドする。
5. Play Console にアプリを登録する。
6. ストアの掲載情報を整える。
7. アプリのコンテンツを宣言する。
8. テストトラックで配信し、クローズドテストを完了する。
9. 製品版を申請して公開する。

## 公開までのチェックリスト

公開の前に、次の項目を確認します。

- [ ] デベロッパーアカウントの登録と本人確認が完了している。
- [ ] `applicationId` を、公開後に変更しない値として確定している。
- [ ] アップロード鍵を作成し、安全に保管している。
- [ ] `keystore.properties` とキーストアを `.gitignore` で除外している。
- [ ] 署名済みの AAB をビルドできる。
- [ ] ストアの掲載情報（アプリ名・説明・アイコン・スクリーンショット）を入力している。
- [ ] プライバシーポリシーの URL を登録している。
- [ ] データセーフティ・コンテンツのレーティング・広告・金融・健康の各宣言を完了している。
- [ ] アプリのカテゴリと連絡先情報を登録している。
- [ ] 新規の個人アカウントは、12 人・14 日のクローズドテストを完了している。
- [ ] ターゲット API レベルが要件を満たしている。

## 次のステップ

公開後は、運用と発展に取り組みます。

- リリースを自動化する場合は、「GitHub Actions で自動リリース」章を参照してください。
- 収益化する場合は、「収益化モデルの全体像」章から各実装章へ進みます。

## 参考リンク

- [Play Console を使ってみる](https://support.google.com/googleplay/android-developer/answer/6112435)
- [ターゲット API レベルの要件](https://developer.android.com/google/play/requirements/target-sdk)
- [Android App Bundle について](https://developer.android.com/guide/app-bundle)
- [アプリに署名する](https://developer.android.com/studio/publish/app-signing)
- [新しい個人用デベロッパー アカウントのアプリテスト要件](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google Play Developer API スタートガイド](https://developers.google.com/android-publisher/getting_started)
- [Google Play 課金システム](https://developer.android.com/google/play/billing)
