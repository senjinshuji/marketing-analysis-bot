export const marketingTemplate = {
  // 基本の媒体データベース（簡易分析用）
  mediaDatabase: {
    '1': { mediaName: 'リスティング', target: '指名検索', method: '指名入札' },
    '2': { mediaName: 'リスティング', target: '一般検索', method: '一般入札' },
    '3': { mediaName: 'GDN（静止画）', target: 'ブロード', method: 'バナー' },
    '4': { mediaName: 'GDN（静止画）', target: 'リターゲティング', method: 'リスト×バナー' },
    '5': { mediaName: 'デマンド静止画', target: 'discover,Youtube限定', method: 'ニュース風正方形バナー' },
    '6': { mediaName: 'デマンド静止画', target: 'gmail限定', method: 'メール風テキスト×画像' },
    '7': { mediaName: 'デマンドロング', target: 'YT面限定', method: '語り' },
    '8': { mediaName: 'デマンドロング', target: 'YT面限定', method: '文字' },
    '9': { mediaName: 'デマンドロング', target: 'YT面限定', method: '漫画' },
    '10': { mediaName: 'デマンドロング', target: 'YT面限定', method: 'ドラマ' },
    '11': { mediaName: 'デマンドロング', target: 'YT面限定', method: 'イラスト、AI' },
    '12': { mediaName: 'デマンドロング', target: 'YT面限定', method: '通常' },
    '13': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '語り' },
    '14': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '文字' },
    '15': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '漫画' },
    '16': { mediaName: 'デマンドshorts', target: 'YT面限定', method: 'ドラマ' },
    '17': { mediaName: 'デマンドshorts', target: 'YT面限定', method: 'イラスト、AI' },
    '18': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '通常' },
    '19': { mediaName: 'ByteDance', target: 'tiktok限定', method: '語り' },
    '20': { mediaName: 'ByteDance', target: 'tiktok限定', method: '漫画' },
    '21': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'ドラマ' },
    '22': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'イラスト、AI' },
    '23': { mediaName: 'ByteDance', target: 'tiktok限定', method: '通常' },
    '24': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'バナー' },
    '25': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '語り' },
    '26': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '漫画' },
    '27': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: 'ドラマ' },
    '28': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: 'イラスト、AI' },
    '29': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '通常' },
    '30': { mediaName: 'meta', target: '縦型', method: 'バナー' },
    '31': { mediaName: 'meta', target: '正方形', method: 'バナー' },
    '32': { mediaName: 'LINE', target: 'apng', method: '文字のみ/AI人物/通知風/ピクトグラム/イラスト/有名人・芸能人/商品画像' },
    '33': { mediaName: 'LINE', target: 'ニュース', method: 'ニュース風正方形バナー' },
    '34': { mediaName: 'LINE', target: 'voom', method: '通常語り' },
    '35': { mediaName: 'LINE', target: 'adnetwork', method: '通常語り' }
  },
  
  // 全媒体の完全なデータベース（GPT-4用）
  fullMediaDatabase: {
    '1': { mediaName: 'リスティング', target: '指名検索', method: '指名入札' },
    '2': { mediaName: 'リスティング', target: '一般検索', method: '一般入札' },
    '3': { mediaName: 'GDN（静止画）', target: 'ブロード', method: 'バナー' },
    '4': { mediaName: 'GDN（静止画）', target: 'リターゲティング', method: 'リスト×バナー' },
    '5': { mediaName: 'デマンド静止画', target: 'discover,Youtube限定', method: 'ニュース風正方形バナー' },
    '6': { mediaName: 'デマンド静止画', target: 'gmail限定', method: 'メール風テキスト×画像' },
    '7': { mediaName: 'デマンドロング', target: 'YT面限定', method: '語り' },
    '8': { mediaName: 'デマンドロング', target: 'YT面限定', method: '文字' },
    '9': { mediaName: 'デマンドロング', target: 'YT面限定', method: '漫画' },
    '10': { mediaName: 'デマンドロング', target: 'YT面限定', method: 'ドラマ' },
    '11': { mediaName: 'デマンドロング', target: 'YT面限定', method: 'イラスト、AI' },
    '12': { mediaName: 'デマンドロング', target: 'YT面限定', method: '通常' },
    '13': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '語り' },
    '14': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '文字' },
    '15': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '漫画' },
    '16': { mediaName: 'デマンドshorts', target: 'YT面限定', method: 'ドラマ' },
    '17': { mediaName: 'デマンドshorts', target: 'YT面限定', method: 'イラスト、AI' },
    '18': { mediaName: 'デマンドshorts', target: 'YT面限定', method: '通常' },
    '19': { mediaName: 'ByteDance', target: 'tiktok限定', method: '語り' },
    '20': { mediaName: 'ByteDance', target: 'tiktok限定', method: '漫画' },
    '21': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'ドラマ' },
    '22': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'イラスト、AI' },
    '23': { mediaName: 'ByteDance', target: 'tiktok限定', method: '通常' },
    '24': { mediaName: 'ByteDance', target: 'tiktok限定', method: 'バナー' },
    '25': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '語り' },
    '26': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '漫画' },
    '27': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: 'ドラマ' },
    '28': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: 'イラスト、AI' },
    '29': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '通常' },
    '30': { mediaName: 'meta', target: '縦型', method: 'バナー' },
    '31': { mediaName: 'meta', target: '正方形', method: 'バナー' },
    '32': { mediaName: 'LINE', target: 'apng', method: '文字のみ/AI人物/通知風/ピクトグラム/イラスト/有名人・芸能人/商品画像' },
    '33': { mediaName: 'LINE', target: 'ニュース', method: 'ニュース風正方形バナー' },
    '34': { mediaName: 'LINE', target: 'voom', method: '通常語り' },
    '35': { mediaName: 'LINE', target: 'adnetwork', method: '通常語り' }
  },
  
  classificationMapping: {
    'ニッチ_自分ごと化': ['1', '2', '7', '19', '22', '23', '24', '25', '28', '29', '30', '31', '33'],
    'ニッチ_toB向け': ['1', '2', '3', '4', '5', '6', '7', '25', '28', '29', '30', '31'],
    'マス_オファー魅力': ['7', '10', '11', '13', '16', '17', '19', '21', '22', '24', '25', '27', '28', '30', '31'],
    'マス_権威性': ['7', '8', '11', '12', '13', '14', '17', '18', '19', '22', '23', '24', '25', '28', '29', '31'],
    'マス_新事実': ['7', '25', '32', '33']
  }
}