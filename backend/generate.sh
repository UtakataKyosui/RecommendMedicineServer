# Locoの正しい型指定とscaffoldコマンド (修正版)

# 1. 薬管理システムのコンプリートscaffold
echo "🏗️ 薬管理システムscaffold生成開始..."

# 薬マスター管理 (medicines) - 正しい外部キー指定
cargo loco generate scaffold medicine \
  --api \
  name:string! \
  description:text \
  dosage:string \
  unit:string \
  user_id:references \
  active:bool

# 服薬スケジュール管理 (medication_schedules) - 正しい外部キー指定
cargo loco generate scaffold medication_schedule \
  --api \
  medicine_id:references \
  time:time! \
  frequency:string! \
  active:bool \
  days_of_week:string

# 服薬記録管理 (medication_logs) - 正しい外部キー指定
cargo loco generate scaffold medication_log \
  --api \
  medicine_id:references \
  scheduled_time:timestamp! \
  taken_time:timestamp \
  status:string! \
  notes:text

echo "✅ 全scaffoldの生成が完了しました"

# 2. 追加のコントローラー（scaffoldでカバーされないもの）
echo "🎮 追加コントローラー生成..."

# LINE Bot webhook用 (API)
cargo loco generate controller webhook/line --api

# ダッシュボード用 (HTML)
cargo loco generate controller dashboard --html

# レポート用 (API)
cargo loco generate controller reports --api

# ユーザー管理API（既存の場合はスキップ）
cargo loco generate controller api/users --api

echo "✅ 追加コントローラー生成完了"

# 3. バックグラウンドジョブ
echo "⚙️ バックグラウンドジョブ生成..."

# 服薬リマインダータスク
cargo loco generate task medication_reminder

# 通知ワーカー
cargo loco generate worker notification_worker

# レポート生成ワーカー
cargo loco generate worker report_generator

echo "✅ バックグラウンドジョブ生成完了"

# 4. 外部キー指定の正しい方法
echo "📝 外部キー指定の正しい方法:"
echo "❌ 間違い: user:references → user_idsテーブルを探してエラー"
echo "✅ 正しい: user_id:references → usersテーブルのidカラムを参照"
echo ""
echo "❌ 間違い: medicine:references → medicine_idsテーブルを探してエラー"
echo "✅ 正しい: medicine_id:references → medicinesテーブルのidカラムを参照"
echo ""
echo "参照されるテーブル名は自動的に複数形になります:"
echo "  user_id:references → users.id を参照"
echo "  medicine_id:references → medicines.id を参照"
echo "  post_id:references → posts.id を参照"

# 5. コントローラー種類の説明
echo "📝 使用したコントローラー種類の説明:"
echo "  --api   - REST API用コントローラー (JSON レスポンス)"
echo "  --html  - HTML用コントローラー (テンプレートレンダリング)"
echo "  --htmx  - HTMX用コントローラー (部分HTML更新)"

# 6. 型指定の説明
echo "📝 使用した型指定の説明:"
echo "  string!     - 必須の文字列"
echo "  string      - オプションの文字列"
echo "  text        - 長いテキスト (TEXT型)"
echo "  bool        - ブール値 (デフォルト: false)"
echo "  time!       - 必須の時刻型 (TIME型)"
echo "  timestamp!  - 必須のタイムスタンプ (TIMESTAMP型)"
echo "  timestamp   - オプションのタイムスタンプ"
echo "  xxxx_id:references - xxxsテーブルのidを参照する外部キー"

# 7. マイグレーション実行
echo "🗄️ マイグレーション実行..."
cargo loco db migrate

echo "🎉 全ての生成作業が完了しました!"
echo ""
echo "📁 生成されたファイル構造:"
echo "src/"
echo "├── controllers/"
echo "│   ├── medicines.rs          # CRUD操作 (scaffold生成)"
echo "│   ├── medication_schedules.rs # CRUD操作 (scaffold生成)" 
echo "│   ├── medication_logs.rs    # CRUD操作 (scaffold生成)"
echo "│   ├── webhook/"
echo "│   │   └── line.rs          # LINE Bot webhook (API)"
echo "│   ├── dashboard.rs         # ダッシュボード (HTML)"
echo "│   ├── reports.rs           # レポート (API)"
echo "│   └── api/"
echo "│       └── users.rs         # ユーザー管理 (API)"
echo "├── models/"
echo "│   ├── medicines.rs         # 薬モデル (scaffold生成)"
echo "│   ├── medication_schedules.rs # スケジュールモデル (scaffold生成)"
echo "│   └── medication_logs.rs   # 記録モデル (scaffold生成)"
echo "├── tasks/"
echo "│   └── medication_reminder.rs # リマインダータスク"
echo "└── workers/"
echo "    ├── notification_worker.rs # 通知ワーカー"
echo "    └── report_generator.rs    # レポート生成ワーカー"
echo ""
echo "次のステップ:"
echo "1. src/models/users.rs に LINE Bot用フィールドを追加"
echo "2. 各コントローラーのビジネスロジックをカスタマイズ"  
echo "3. LINE Bot webhook の実装"
echo "4. フロントエンド (React) の実装"
echo "5. バックグラウンドタスクの実装"