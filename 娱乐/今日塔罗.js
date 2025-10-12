// ==UserScript==
// @name         每日塔罗
// @author       米线
// @version      1.0.0
// @description  一个简单的塔罗牌
// @timestamp    1672066028
// @license      Apache-2
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==

// ================================
// 配置区域
// ================================

const CONFIG = {
  EXT_ID: 'dailyTarotSimple',
  EXT_NAME: '每日塔罗',
  AUTHOR: '米线',
  VERSION: '1.0.0',
  STORAGE_KEY: 'dailyTarotData',
  SYSTEM_NAME: '命运塔罗牌',
  DRAW_CMD: '塔罗牌',
  INFO_CMD: '塔罗牌信息',
  LIST_CMD: '塔罗牌列表',
  HELP_CMD: '塔罗牌help',
  DRAW_TEXT: '在{player}的虔诚祈祷下\n命运之轮开始转动...\n\n你抽到了：{card}\n\n牌义解读：{meaning}',
  ALREADY_DRAWN_TEXT: '{player}，你今天已经抽过塔罗牌了！\n\n你今天的塔罗牌是：{card}\n\n牌义解读：{meaning}',
  COOLDOWN_HOURS: 24,
  ALLOW_DUPLICATES: false
};

const TAROT_CARDS = [
  {
    name: "0. 愚者 The Fool",
    upright: "新的开始，冒险，自由，天真，自发性",
    reversed: "鲁莽，粗心，风险，愚蠢，停滞"
  },
  {
    name: "1. 魔术师 The Magician",
    upright: "意志力，能力，技能，创造力，资源",
    reversed: "操纵，欺骗，未使用的潜力，延迟"
  },
  {
    name: "2. 女祭司 The High Priestess",
    upright: "直觉，神圣女性，潜意识，神秘，智慧",
    reversed: "秘密，压抑，冷漠，困惑，肤浅"
  },
  {
    name: "3. 女皇 The Empress",
    upright: "生育，美丽，自然，丰富，感官享受",
    reversed: "创造力受阻，依赖，懒惰，浪费"
  },
  {
    name: "4. 皇帝 The Emperor",
    upright: "权威，结构，控制，父亲形象，领导力",
    reversed: "专制，僵化，控制欲，缺乏纪律"
  },
  {
    name: "5. 教皇 The Hierophant",
    upright: "传统，信仰，教育，服从，精神指导",
    reversed: "叛逆，新方法，自由思想，挑战传统"
  },
  {
    name: "6. 恋人 The Lovers",
    upright: "爱情，和谐，关系，价值观一致，选择",
    reversed: "不和谐，失衡，价值观冲突，优柔寡断"
  },
  {
    name: "7. 战车 The Chariot",
    upright: "控制，意志力，胜利，断言，决心",
    reversed: "缺乏控制，攻击性，没有方向，停滞"
  },
  {
    name: "8. 力量 Strength",
    upright: "勇气，说服力，影响力，同情心，内心力量",
    reversed: "软弱，自我怀疑，缺乏纪律，滥用权力"
  },
  {
    name: "9. 隐士 The Hermit",
    upright: "灵魂搜索，内省，独处，内在指导",
    reversed: "孤立，孤独，退缩，拒绝给予指导"
  },
  {
    name: "10. 命运之轮 Wheel of Fortune",
    upright: "好运，业力，命运，转折点，机会",
    reversed: "坏运气，抵抗变化，打破循环"
  },
  {
    name: "11. 正义 Justice",
    upright: "正义，公平，真相，原因和结果，法律",
    reversed: "不公正，不诚实，不负责任，错误的决定"
  },
  {
    name: "12. 倒吊人 The Hanged Man",
    upright: "暂停，投降，放手，新视角",
    reversed: "拖延，抵抗，僵局，不愿牺牲"
  },
  {
    name: "13. 死神 Death",
    upright: "结束，改变，转变，过渡，放手",
    reversed: "抵抗变化，停滞，恐惧改变"
  },
  {
    name: "14. 节制 Temperance",
    upright: "平衡，适度，耐心，目的，意义",
    reversed: "不平衡，过度，不耐烦，缺乏长期愿景"
  },
  {
    name: "15. 恶魔 The Devil",
    upright: "束缚，成瘾，暴力，依恋，限制",
    reversed: "自由，释放，恢复力量，探索黑暗"
  },
  {
    name: "16. 高塔 The Tower",
    upright: "突然变化，动荡，混乱，启示，觉醒",
    reversed: "害怕改变，灾难避免，拖延不可避免"
  },
  {
    name: "17. 星星 The Star",
    upright: "希望，信念，目的，更新，精神意识",
    reversed: "缺乏信仰，绝望，自我怀疑，气馁"
  },
  {
    name: "18. 月亮 The Moon",
    upright: "幻觉，恐惧，焦虑，潜意识，直觉",
    reversed: "释放恐惧，压抑情绪，内心混乱"
  },
  {
    name: "19. 太阳 The Sun",
    upright: "积极性，活力，自信，成功，喜悦",
    reversed: "暂时的沮丧，成功延迟，过度自负"
  },
  {
    name: "20. 审判 Judgement",
    upright: "反思，清算，觉醒，复兴，责任",
    reversed: "自我怀疑，拒绝召唤，害怕审判"
  },
  {
    name: "21. 世界 The World",
    upright: "完成，成就，成功，履行，旅行",
    reversed: "未完成，缺乏完成，没有目标"
  }
];

// ================================
// 核心代码区域
// ================================

let ext = seal.ext.find(CONFIG.EXT_ID);
if (!ext) {
  ext = seal.ext.new(CONFIG.EXT_ID, CONFIG.AUTHOR, CONFIG.VERSION);
  seal.ext.register(ext);
}

const getUserId = (ctx) => {
  return ctx.player?.userId || 'default_user';
};

const getGroupId = (ctx) => {
  return ctx.group?.id || 'private_' + getUserId(ctx);
};

const checkTodayDrawn = (lastDrawTime) => {
  if (!lastDrawTime) return false;
  
  const now = new Date();
  const lastDraw = new Date(lastDrawTime);
  
  return now.getFullYear() === lastDraw.getFullYear() &&
         now.getMonth() === lastDraw.getMonth() &&
         now.getDate() === lastDraw.getDate();
};

const drawTarotCard = (userId, drawnCards = []) => {
  let availableCards = TAROT_CARDS;
  
  if (!CONFIG.ALLOW_DUPLICATES && drawnCards.length > 0) {
    availableCards = TAROT_CARDS.filter(card => 
      !drawnCards.includes(card.name)
    );
    
    if (availableCards.length === 0) {
      availableCards = TAROT_CARDS;
    }
  }
  
  const randomIndex = Math.floor(Math.random() * availableCards.length);
  const selectedCard = availableCards[randomIndex];
  
  const isReversed = Math.random() < 0.3;
  const position = isReversed ? "逆位" : "正位";
  const meaning = isReversed ? selectedCard.reversed : selectedCard.upright;
  
  return {
    card: `${selectedCard.name} - ${position}`,
    meaning: meaning,
    isReversed: isReversed,
    cardName: selectedCard.name
  };
};

// 帮助命令
const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = CONFIG.HELP_CMD;
cmdHelp.help = `显示${CONFIG.SYSTEM_NAME}的所有可用指令\n用法：.${CONFIG.HELP_CMD}`;
cmdHelp.solve = (ctx, msg, cmdArgs) => {
  let replyText = `${CONFIG.SYSTEM_NAME} - 命运指引系统\n\n`;
  
  replyText += `系统信息：\n`;
  replyText += `  - 系统名称：${CONFIG.SYSTEM_NAME}\n`;
  replyText += `  - 作者：${CONFIG.AUTHOR}\n`;
  replyText += `  - 版本：${CONFIG.VERSION}\n\n`;
  
  replyText += `抽卡限制：\n`;
  replyText += `  - 每日限制：每人每天只能抽取一次\n`;
  replyText += `  - 重复抽牌：${CONFIG.ALLOW_DUPLICATES ? '允许' : '不允许'}\n`;
  replyText += `  - 逆位概率：约30%\n\n`;
  
  replyText += `塔罗牌统计：\n`;
  replyText += `  - 总牌数：${TAROT_CARDS.length}张\n`;
  replyText += `  - 大阿卡纳：22张\n\n`;
  
  replyText += `可用指令：\n`;
  replyText += `  - .${CONFIG.DRAW_CMD} - 抽取今日塔罗牌\n`;
  replyText += `  - .${CONFIG.INFO_CMD} - 查看抽卡记录\n`;
  replyText += `  - .${CONFIG.LIST_CMD} - 查看所有塔罗牌列表\n`;
  replyText += `  - .${CONFIG.HELP_CMD} - 查看帮助信息\n\n`;
  
  replyText += `使用提示：\n`;
  replyText += `  - 每天只能抽取一次塔罗牌\n`;
  replyText += `  - 如果今天已经抽过，会显示今天抽到的牌\n`;
  replyText += `  - 牌的正位和逆位代表不同的含义\n`;
  replyText += `  - 用心感受牌面传达的信息\n`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 抽卡命令
const cmdDraw = seal.ext.newCmdItemInfo();
cmdDraw.name = CONFIG.DRAW_CMD;
cmdDraw.help = `抽取今日塔罗牌（每日一次）\n用法：.${CONFIG.DRAW_CMD}`;

cmdDraw.solve = (ctx, msg, cmdArgs) => {
  const targetUserId = ctx.player.userId;
  const targetUserName = ctx.player.name;
  const groupId = getGroupId(ctx);
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = {};
  }
  
  const userData = data[groupId][targetUserId] || {
    lastDrawTime: null,
    totalDraws: 0,
    drawnCards: []
  };
  
  // 检查是否今天已经抽过牌
  const todayDrawn = checkTodayDrawn(userData.lastDrawTime);
  
  if (todayDrawn && userData.lastCard && userData.lastMeaning) {
    // 今天已经抽过，显示今天抽到的牌
    let replyText = CONFIG.ALREADY_DRAWN_TEXT
      .replace('{player}', ctx.player?.name || '命运探寻者')
      .replace('{card}', userData.lastCard)
      .replace('{meaning}', userData.lastMeaning);
    
    replyText += `\n\n统计信息：\n`;
    replyText += `- 这是你第${userData.totalDraws}次抽卡\n`;
    
    if (!CONFIG.ALLOW_DUPLICATES) {
      const remainingCards = TAROT_CARDS.length - userData.drawnCards.length;
      replyText += `- 剩余未抽牌数：${remainingCards}张\n`;
    }
    
    replyText += `- 明天可以抽取新的塔罗牌`;
    
    seal.replyToSender(ctx, msg, replyText);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  // 执行抽卡
  const drawResult = drawTarotCard(targetUserId, userData.drawnCards);
  
  // 更新数据
  userData.lastDrawTime = new Date().toISOString();
  userData.totalDraws = (userData.totalDraws || 0) + 1;
  userData.lastCard = drawResult.card;
  userData.lastMeaning = drawResult.meaning;
  userData.lastDrawDate = new Date().toLocaleDateString('zh-CN');
  
  if (!CONFIG.ALLOW_DUPLICATES && !userData.drawnCards.includes(drawResult.cardName)) {
    userData.drawnCards.push(drawResult.cardName);
  }
  
  data[groupId][targetUserId] = userData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  // 构建回复消息
  let replyText = CONFIG.DRAW_TEXT
    .replace('{player}', ctx.player?.name || '命运探寻者')
    .replace('{card}', drawResult.card)
    .replace('{meaning}', drawResult.meaning);
  
  replyText += `\n\n统计信息：\n`;
  replyText += `- 这是你第${userData.totalDraws}次抽卡\n`;
  
  if (!CONFIG.ALLOW_DUPLICATES) {
    const remainingCards = TAROT_CARDS.length - userData.drawnCards.length;
    replyText += `- 剩余未抽牌数：${remainingCards}张\n`;
  }
  
  replyText += `- 明天可以抽取新的塔罗牌`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 信息命令
const cmdInfo = seal.ext.newCmdItemInfo();
cmdInfo.name = CONFIG.INFO_CMD;
cmdInfo.help = `查看塔罗牌抽卡记录\n用法：.${CONFIG.INFO_CMD}`;

cmdInfo.solve = (ctx, msg, cmdArgs) => {
  const targetUserId = ctx.player.userId;
  const targetUserName = ctx.player.name;
  const groupId = getGroupId(ctx);
  
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  const userData = data[groupId]?.[targetUserId] || {
    lastDrawTime: null,
    totalDraws: 0,
    drawnCards: []
  };
  
  const todayDrawn = checkTodayDrawn(userData.lastDrawTime);
  
  let replyText = `${CONFIG.SYSTEM_NAME} - 个人记录\n\n`;
  replyText += `用户：${targetUserName}\n`;
  replyText += `总抽卡次数：${userData.totalDraws || 0}\n`;
  replyText += `今日状态：${todayDrawn ? '已抽卡' : '未抽卡'}\n`;
  
  if (todayDrawn) {
    replyText += `下次抽卡：明天\n`;
  } else {
    replyText += `现在可以抽卡\n`;
  }
  
  if (userData.lastCard) {
    replyText += `\n最近一次抽卡：\n`;
    replyText += `- 日期：${userData.lastDrawDate || '未知'}\n`;
    replyText += `- 牌面：${userData.lastCard}\n`;
    replyText += `- 含义：${userData.lastMeaning || '未知'}\n`;
  }
  
  if (!CONFIG.ALLOW_DUPLICATES) {
    const drawnCount = userData.drawnCards?.length || 0;
    const totalCards = TAROT_CARDS.length;
    const progress = Math.round((drawnCount / totalCards) * 100);
    
    replyText += `\n收集进度：\n`;
    replyText += `- 已收集：${drawnCount}/${totalCards}张\n`;
    replyText += `- 完成度：${progress}%\n`;
    
    if (drawnCount >= totalCards) {
      replyText += `恭喜！你已经收集了所有塔罗牌！\n`;
    }
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 列表命令
const cmdList = seal.ext.newCmdItemInfo();
cmdList.name = CONFIG.LIST_CMD;
cmdList.help = `查看所有塔罗牌列表\n用法：.${CONFIG.LIST_CMD}`;
cmdList.solve = (ctx, msg, cmdArgs) => {
  let replyText = `${CONFIG.SYSTEM_NAME} - 塔罗牌全集\n\n`;
  
  TAROT_CARDS.forEach((card, index) => {
    replyText += `${card.name}\n`;
    replyText += `  - 正位：${card.upright}\n`;
    replyText += `  - 逆位：${card.reversed}\n`;
    
    if ((index + 1) % 5 === 0 && index !== TAROT_CARDS.length - 1) {
      replyText += '\n';
    }
  });
  
  replyText += `\n共 ${TAROT_CARDS.length} 张大阿卡纳牌`;
  replyText += `\n使用 .${CONFIG.DRAW_CMD} 抽取你的今日塔罗牌`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 注册命令
ext.cmdMap[CONFIG.HELP_CMD] = cmdHelp;
ext.cmdMap[CONFIG.DRAW_CMD] = cmdDraw;
ext.cmdMap[CONFIG.INFO_CMD] = cmdInfo;
ext.cmdMap[CONFIG.LIST_CMD] = cmdList;

// 注册别名命令
ext.cmdMap['塔罗牌帮助'] = cmdHelp;
ext.cmdMap['抽塔罗牌'] = cmdDraw;
ext.cmdMap['塔罗牌记录'] = cmdInfo;
ext.cmdMap['塔罗牌图鉴'] = cmdList;

console.log(`${CONFIG.SYSTEM_NAME} 加载完成`);
