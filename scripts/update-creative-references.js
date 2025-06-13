const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// CSVファイルを読み込んで参考クリエイティブデータを更新するスクリプト
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('使用方法: node scripts/update-creative-references.js <CSVファイルパス>');
  process.exit(1);
}

try {
  // CSVファイルを読み込む
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  // TypeScriptファイルに書き込むためのデータを準備
  const creativeReferences = records.map((record, index) => {
    return {
      id: record.id || `creative_${index + 1}`,
      mediaId: record.mediaId || record['媒体ID'] || '',
      mediaName: record.mediaName || record['媒体名'] || '',
      target: record.target || record['ターゲット'] || '',
      method: record.method || record['配信手法'] || '',
      creativeUrl: record.creativeUrl || record['クリエイティブURL'] || '',
      description: record.description || record['説明'] || '',
      performance: record.performance || record['実績'] || '',
      tags: record.tags || record['タグ'] || ''
    };
  });

  // TypeScriptファイルのテンプレート
  const tsContent = `// 参考クリエイティブデータベース
// 自動生成されたファイル - ${new Date().toISOString()}

export interface CreativeReference {
  id: string
  mediaId: string
  mediaName: string
  target: string
  method: string
  creativeUrl?: string
  description?: string
  performance?: string
  tags?: string[]
}

export const creativeReferences: CreativeReference[] = ${JSON.stringify(
  creativeReferences.map(ref => ({
    ...ref,
    tags: ref.tags ? ref.tags.split(',').map(t => t.trim()) : []
  })), null, 2
)};

// 市場タイプと行動理由から参考クリエイティブを取得
export function getRecommendedCreatives(
  marketType: string,
  actionReason: string,
  recommendedMediaIds: string[]
): CreativeReference[] {
  return creativeReferences.filter(creative => 
    recommendedMediaIds.includes(creative.mediaId)
  );
}
`;

  // ファイルに書き込む
  const outputPath = path.join(__dirname, '../lib/creative-references.ts');
  fs.writeFileSync(outputPath, tsContent);

  console.log(`✅ 参考クリエイティブデータを更新しました`);
  console.log(`   - 読み込んだレコード数: ${records.length}`);
  console.log(`   - 出力先: ${outputPath}`);

} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
}