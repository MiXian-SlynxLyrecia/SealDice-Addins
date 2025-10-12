// ==UserScript==
// @name         类尖塔抽卡
// @author       米线
// @version      1.0.0
// @description  杀戮尖塔风格的抽牌系统，对，没错，还是我之前的模板
// @timestamp    0
// @license      Apache-2
// ==/UserScript==

// ================================
// 配置区域 - 修改这里来创建不同的抽牌池
// ================================

// 扩展基本信息
const CONFIG = {
  // 扩展ID - 必须唯一，用于区分不同的抽卡池
  EXT_ID: 'slayTheSpireDrawTemplate',
  // 扩展显示名称
  EXT_NAME: '类尖塔抽卡',
  // 作者
  AUTHOR: '米线',
  // 版本
  VERSION: '1.0.0',
  
  // 存储键名 - 必须唯一，避免与其他抽卡池冲突
  STORAGE_KEY: 'slayTheSpireDrawData',
  
  // 系统名称，用于显示
  SYSTEM_NAME: '尖塔牌库',
  
  // 抽牌命令名称
  DRAW_CMD: '尖塔抽卡',
  // 查看牌库命令名称
  DECK_CMD: '尖塔牌库',
  // 洗牌命令名称
  SHUFFLE_CMD: '尖塔洗牌',
  // 重置命令名称
  RESET_CMD: '重置尖塔牌堆',
  // 帮助命令名称
  HELP_CMD: '尖塔帮助',
  // 状态命令名称
  STATUS_CMD: '尖塔牌堆状态',
  
  // 单抽文案模板
  DRAW_TEXT: '{player} 从牌库中抽出了一张牌：\n\n{card}',
  // 洗牌文案模板
  SHUFFLE_TEXT: '{player} 将弃牌堆洗回牌库！牌库已重置。',
  // 空牌库文案
  EMPTY_DECK_TEXT: '{player} 的牌库已空！请先使用 .{shuffleCmd} 将弃牌堆洗回牌库。'
};

// 卡牌池配置 - 修改这里添加你的卡牌，唔，我没玩过所以卡牌这里是ds帮我写的，和原版不同不要骂我
// 顺便一提，没配置权重是因为我忘记了复制粘贴完才想起来，可以参考我发的抽卡插件模板，嘛，这样子才方便一个一个抽吧
const CARD_POOL = [
  // 攻击牌
  "打击", "打击", "打击", "打击", "打击", "打击",
  "防御", "防御", "防御", "防御", "防御", "防御",
  "重击", "重击",
  "全身撞击", "全身撞击",
  "剑柄打击", "剑柄打击",
  "铁斩波", "铁斩波",
  
  // 技能牌
  "坚毅", "坚毅",
  "盛怒", "盛怒",
  "燃烧", "燃烧",
  "观察弱点", "观察弱点",
  "残杀", "残杀",
  "双重打击", "双重打击",
  "顺劈斩", "顺劈斩",
  
  // 能力牌
  "燃烧之血",
  "金刚臂",
  "发现",
  "巩固",
  "壁垒",
  "恶魔形态",
  "突破极限",
  
  // 特殊牌
  "伤口",
  "灼伤",
  "虚空"
];

// 卡牌类型和描述配置
const CARD_DETAILS = {
  "打击": { type: "攻击", cost: 1, effect: "造成6点伤害" },
  "防御": { type: "技能", cost: 1, effect: "获得5点格挡" },
  "重击": { type: "攻击", cost: 2, effect: "造成9点伤害" },
  "全身撞击": { type: "攻击", cost: 1, effect: "造成5点伤害，如果本回合获得过格挡，改为造成14点伤害" },
  "剑柄打击": { type: "攻击", cost: 1, effect: "造成8点伤害，抽1张牌" },
  "铁斩波": { type: "攻击", cost: 1, effect: "造成6点伤害，如果本回合打出的上一张牌是攻击牌，获得3点格挡" },
  "坚毅": { type: "技能", cost: 1, effect: "获得7点格挡，本回合每打出一张攻击牌，额外获得2点格挡" },
  "盛怒": { type: "技能", cost: 0, effect: "进入盛怒状态，本回合获得2点力量，下回合失去2点力量" },
  "燃烧": { type: "技能", cost: 1, effect: "本回合每打出一张牌，获得2点格挡" },
  "观察弱点": { type: "技能", cost: 1, effect: "如果目标有意向，获得3点力量" },
  "残杀": { type: "攻击", cost: 1, effect: "造成6点伤害，如果目标生命值低于一半，造成12点伤害" },
  "双重打击": { type: "攻击", cost: 1, effect: "造成5点伤害两次" },
  "顺劈斩": { type: "攻击", cost: 2, effect: "造成8点伤害，对所有敌人造成5点伤害" },
  "燃烧之血": { type: "能力", cost: 0, effect: "在每场战斗结束时，回复6点生命" },
  "金刚臂": { type: "技能", cost: 1, effect: "获得9点格挡，如果本回合已经获得过格挡，获得4点力量" },
  "发现": { type: "技能", cost: 1, effect: "选择1张牌加入手牌，它本回合消耗为0" },
  "巩固": { type: "技能", cost: 1, effect: "双倍你当前的格挡值" },
  "壁垒": { type: "能力", cost: 3, effect: "格挡不再在回合结束时消失" },
  "恶魔形态": { type: "能力", cost: 3, effect: "在你的回合开始时，获得2点力量" },
  "突破极限": { type: "技能", cost: 0, effect: "双倍你当前的力量，获得1点虚弱" },
  "伤口": { type: "状态", cost: -1, effect: "无法被打出。当被抽到时，消耗" },
  "灼伤": { type: "状态", cost: -1, effect: "无法被打出。当被抽到时，受到2点伤害" },
  "虚空": { type: "状态", cost: -1, effect: "无法被打出。当被抽到时，失去1点能量" }
};

// ================================
// 核心代码区域 - 一般不需要修改
// ================================

let ext = seal.ext.find(CONFIG.EXT_ID);
if (!ext) {
  ext = seal.ext.new(CONFIG.EXT_ID, CONFIG.AUTHOR, CONFIG.VERSION);
  seal.ext.register(ext);
}

// 获取用户ID
const getUserId = (ctx) => {
  return ctx.player?.userId || 'default_user';
};

// 获取群组ID
const getGroupId = (ctx) => {
  return ctx.group?.id || 'private_' + getUserId(ctx);
};

// 权限检查函数
const checkPermission = (ctx, requiredLevel = 50) => {
  if (ctx.privilegeLevel >= requiredLevel) {
    return { allowed: true, level: ctx.privilegeLevel };
  }
  return { allowed: false, level: ctx.privilegeLevel };
};

// 获取权限名称
const getPermissionName = (level) => {
  switch (level) {
    case 100: return "master";
    case 60: return "owner";
    case 50: return "admin";
    case 40: return "inviter";
    case 20: return "trusted";
    case 0: return "normal";
    case -30: return "banned";
    default: return `unknown (${level})`;
  }
};

// Fisher-Yates 洗牌算法
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 初始化用户牌库数据
const initializeUserDeck = () => {
  // 创建初始牌库（洗牌后的完整卡牌池）
  const initialDeck = shuffleArray([...CARD_POOL]);
  
  return {
    // 抽牌堆
    drawPile: initialDeck,
    // 弃牌堆
    discardPile: [],
    // 总抽牌次数
    totalDraws: 0,
    // 洗牌次数
    shuffleCount: 0,
    // 初始化时间
    initTime: new Date().toISOString()
  };
};

// 从牌库抽牌
const drawFromDeck = (userData, count = 1) => {
  const drawnCards = [];
  
  for (let i = 0; i < count; i++) {
    // 如果抽牌堆为空，无法抽牌
    if (userData.drawPile.length === 0) {
      break;
    }
    
    // 从抽牌堆顶部抽一张牌（数组末尾）
    const card = userData.drawPile.pop();
    drawnCards.push(card);
    userData.totalDraws++;
    
    // 将抽到的牌放入弃牌堆
    userData.discardPile.push(card);
  }
  
  return drawnCards;
};

// 洗牌（将弃牌堆洗入抽牌堆）
const shuffleDiscardIntoDraw = (userData) => {
  if (userData.discardPile.length === 0) {
    return false;
  }
  
  // 将弃牌堆洗牌后放入抽牌堆
  userData.drawPile = shuffleArray([...userData.discardPile]);
  userData.discardPile = [];
  userData.shuffleCount++;
  
  return true;
};

// 获取卡牌详细信息
const getCardDetails = (cardName) => {
  return CARD_DETAILS[cardName] || { type: "未知", cost: 0, effect: "效果未知" };
};

// 帮助命令
const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = CONFIG.HELP_CMD;
cmdHelp.help = `显示${CONFIG.SYSTEM_NAME}的所有可用指令\n用法：.${CONFIG.HELP_CMD}`;
cmdHelp.solve = (ctx, msg, cmdArgs) => {
  let replyText = `🎴 ${CONFIG.SYSTEM_NAME} - 杀戮尖塔风格抽牌系统 🎴\n\n`;
  
  replyText += `📊 系统信息：\n`;
  replyText += `  • 系统名称：${CONFIG.SYSTEM_NAME}\n`;
  replyText += `  • 作者：${CONFIG.AUTHOR}\n`;
  replyText += `  • 版本：${CONFIG.VERSION}\n\n`;
  
  replyText += `🃏 牌库机制：\n`;
  replyText += `  • 初始牌库：${CARD_POOL.length}张牌\n`;
  replyText += `  • 抽牌规则：抽完后不放回，牌库抽空后需要洗牌\n\n`;
  
  replyText += `📁 牌堆说明：\n`;
  replyText += `  • 抽牌堆：待抽取的牌\n`;
  replyText += `  • 弃牌堆：使用过的牌\n`;
  replyText += `  • 抽出的牌会自动进入弃牌堆\n\n`;
  
  replyText += `🎮 可用指令：\n`;
  replyText += `  • .${CONFIG.DRAW_CMD} [数量] - 从牌库抽牌（默认1张）\n`;
  replyText += `  • .${CONFIG.DECK_CMD} - 查看当前牌库状态\n`;
  replyText += `  • .${CONFIG.SHUFFLE_CMD} - 将弃牌堆洗回抽牌堆\n`;
  replyText += `  • .${CONFIG.STATUS_CMD} - 查看详细的牌库状态\n`;
  replyText += `  • .${CONFIG.RESET_CMD} - 重置牌库（管理员专用）\n`;
  replyText += `  • .${CONFIG.HELP_CMD} - 查看帮助信息\n\n`;
  
  replyText += `💡 使用提示：\n`;
  replyText += `  • 牌库抽空时需要使用洗牌命令\n`;
  replyText += `  • 所有数据按用户独立存储\n`;
  replyText += `  • 基于杀戮尖塔的抽牌机制设计\n`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 抽牌命令
const cmdDraw = seal.ext.newCmdItemInfo();
cmdDraw.name = CONFIG.DRAW_CMD;
cmdDraw.help = `从牌库抽取指定数量的牌\n用法：.${CONFIG.DRAW_CMD} [数量]`;
cmdDraw.solve = (ctx, msg, cmdArgs) => {
  const userId = getUserId(ctx);
  const groupId = getGroupId(ctx);
  const drawCount = parseInt(cmdArgs.getArgN(1)) || 1;
  
  if (drawCount < 1) {
    seal.replyToSender(ctx, msg, `❌ 抽牌数量必须大于0`);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  if (drawCount > 10) {
    seal.replyToSender(ctx, msg, `❌ 单次抽牌数量不能超过10张`);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = {};
  }
  
  let userData = data[groupId][userId];
  if (!userData) {
    userData = initializeUserDeck();
  }
  
  // 检查牌库是否为空
  if (userData.drawPile.length === 0) {
    const replyText = CONFIG.EMPTY_DECK_TEXT
      .replace('{player}', ctx.player?.name || '玩家')
      .replace('{shuffleCmd}', CONFIG.SHUFFLE_CMD);
    seal.replyToSender(ctx, msg, replyText);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  // 执行抽牌
  const drawnCards = drawFromDeck(userData, drawCount);
  
  if (drawnCards.length === 0) {
    seal.replyToSender(ctx, msg, '❌ 抽牌失败，牌库已空');
    return seal.ext.newCmdExecuteResult(true);
  }
  
  // 构建回复消息
  let replyText = '';
  
  if (drawnCards.length === 1) {
    const cardDetails = getCardDetails(drawnCards[0]);
    replyText = CONFIG.DRAW_TEXT
      .replace('{player}', ctx.player?.name || '玩家')
      .replace('{card}', `【${drawnCards[0]}】${cardDetails.type} | 消耗:${cardDetails.cost} | ${cardDetails.effect}`);
  } else {
    replyText = `${ctx.player?.name || '玩家'} 从牌库中抽出了 ${drawnCards.length} 张牌：\n\n`;
    drawnCards.forEach((card, index) => {
      const cardDetails = getCardDetails(card);
      replyText += `${index + 1}. 【${card}】${cardDetails.type} | 消耗:${cardDetails.cost} | ${cardDetails.effect}\n`;
    });
  }
  
  replyText += `\n📊 状态：`;
  replyText += ` 牌库:${userData.drawPile.length}`;
  replyText += ` 弃牌:${userData.discardPile.length}`;
  
  if (userData.drawPile.length === 0) {
    replyText += `\n💡 牌库已空！使用 .${CONFIG.SHUFFLE_CMD} 洗牌`;
  }
  
  // 保存数据
  data[groupId][userId] = userData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 查看牌库命令
const cmdDeck = seal.ext.newCmdItemInfo();
cmdDeck.name = CONFIG.DECK_CMD;
cmdDeck.help = `查看当前牌库状态\n用法：.${CONFIG.DECK_CMD}`;
cmdDeck.solve = (ctx, msg, cmdArgs) => {
  const userId = getUserId(ctx);
  const groupId = getGroupId(ctx);
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  let userData = data[groupId]?.[userId];
  
  if (!userData) {
    userData = initializeUserDeck();
    data[groupId] = data[groupId] || {};
    data[groupId][userId] = userData;
    ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  }
  
  let replyText = `🎴 ${ctx.player?.name || '玩家'} 的牌库状态\n\n`;
  
  replyText += `📊 牌堆统计：\n`;
  replyText += `  • 抽牌堆：${userData.drawPile.length}张\n`;
  replyText += `  • 弃牌堆：${userData.discardPile.length}张\n`;
  replyText += `  • 总抽牌：${userData.totalDraws}次\n`;
  replyText += `  • 洗牌次数：${userData.shuffleCount}次\n`;
  
  if (userData.drawPile.length === 0 && userData.discardPile.length > 0) {
    replyText += `\n💡 牌库已空！使用 .${CONFIG.SHUFFLE_CMD} 将弃牌堆洗回牌库`;
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 洗牌命令
const cmdShuffle = seal.ext.newCmdItemInfo();
cmdShuffle.name = CONFIG.SHUFFLE_CMD;
cmdShuffle.help = `将弃牌堆洗回抽牌堆\n用法：.${CONFIG.SHUFFLE_CMD}`;
cmdShuffle.solve = (ctx, msg, cmdArgs) => {
  const userId = getUserId(ctx);
  const groupId = getGroupId(ctx);
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = {};
  }
  
  let userData = data[groupId][userId];
  if (!userData) {
    userData = initializeUserDeck();
  }
  
  // 执行洗牌
  const shuffleSuccess = shuffleDiscardIntoDraw(userData);
  
  let replyText = '';
  if (shuffleSuccess) {
    replyText = CONFIG.SHUFFLE_TEXT
      .replace('{player}', ctx.player?.name || '玩家');
    
    replyText += `\n\n📊 洗牌结果：`;
    replyText += ` 抽牌堆:${userData.drawPile.length}张`;
    replyText += ` 弃牌堆:${userData.discardPile.length}张`;
  } else {
    replyText = `❌ 弃牌堆为空，无需洗牌`;
  }
  
  // 保存数据
  data[groupId][userId] = userData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 状态命令
const cmdStatus = seal.ext.newCmdItemInfo();
cmdStatus.name = CONFIG.STATUS_CMD;
cmdStatus.help = `查看详细的牌库状态信息\n用法：.${CONFIG.STATUS_CMD}`;
cmdStatus.solve = (ctx, msg, cmdArgs) => {
  const userId = getUserId(ctx);
  const groupId = getGroupId(ctx);
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  let userData = data[groupId]?.[userId];
  
  if (!userData) {
    userData = initializeUserDeck();
    data[groupId] = data[groupId] || {};
    data[groupId][userId] = userData;
    ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  }
  
  let replyText = `📈 ${ctx.player?.name || '玩家'} - 详细牌库状态\n\n`;
  
  // 基本统计
  replyText += `📊 基本统计：\n`;
  replyText += `  • 总抽牌次数：${userData.totalDraws}\n`;
  replyText += `  • 洗牌次数：${userData.shuffleCount}\n`;
  replyText += `  • 牌库初始化：${new Date(userData.initTime).toLocaleDateString('zh-CN')}\n\n`;
  
  // 牌堆详情
  replyText += `🃏 牌堆详情：\n`;
  replyText += `  • 抽牌堆：${userData.drawPile.length}张\n`;
  
  // 统计抽牌堆中的卡牌类型
  const drawPileStats = {};
  userData.drawPile.forEach(card => {
    const details = getCardDetails(card);
    drawPileStats[details.type] = (drawPileStats[details.type] || 0) + 1;
  });
  
  if (Object.keys(drawPileStats).length > 0) {
    replyText += `    类型分布：`;
    replyText += Object.entries(drawPileStats).map(([type, count]) => `${type}×${count}`).join(' ') + '\n';
  }
  
  replyText += `  • 弃牌堆：${userData.discardPile.length}张\n`;
  
  // 统计弃牌堆中的卡牌类型
  const discardPileStats = {};
  userData.discardPile.forEach(card => {
    const details = getCardDetails(card);
    discardPileStats[details.type] = (discardPileStats[details.type] || 0) + 1;
  });
  
  if (Object.keys(discardPileStats).length > 0) {
    replyText += `    类型分布：`;
    replyText += Object.entries(discardPileStats).map(([type, count]) => `${type}×${count}`).join(' ') + '\n';
  }
  
  // 系统信息
  replyText += `\n⚙️ 系统信息：\n`;
  replyText += `  • 初始牌库大小：${CARD_POOL.length}张\n`;
  replyText += `  • 当前牌库总数：${userData.drawPile.length + userData.discardPile.length}张\n`;
  
  if (userData.drawPile.length === 0 && userData.discardPile.length > 0) {
    replyText += `\n💡 提示：牌库已空，使用 .${CONFIG.SHUFFLE_CMD} 洗牌`;
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 重置命令（管理员专用）
const cmdReset = seal.ext.newCmdItemInfo();
cmdReset.name = CONFIG.RESET_CMD;
cmdReset.help = `重置牌库（管理员专用）\n用法：.${CONFIG.RESET_CMD}`;
cmdReset.solve = (ctx, msg, cmdArgs) => {
  // 权限检查 - 需要admin(50)或以上权限
  const perm = checkPermission(ctx, 50);
  
  if (!perm.allowed) {
    const permName = getPermissionName(perm.level);
    seal.replyToSender(ctx, msg, `❌ 权限不足！需要admin(50)权限，当前权限：${perm.level} (${permName})`);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  const userId = getUserId(ctx);
  const groupId = getGroupId(ctx);
  
  // 读取数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = {};
  }
  
  const oldData = data[groupId][userId];
  data[groupId][userId] = initializeUserDeck();
  
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  const permName = getPermissionName(perm.level);
  let replyText = `✅ 已重置 ${ctx.player?.name || '玩家'} 的牌库\n`;
  replyText += `👤 操作者权限：${perm.level} (${permName})\n\n`;
  
  if (oldData) {
    replyText += `📊 重置前统计：\n`;
    replyText += `  • 总抽牌次数：${oldData.totalDraws || 0}\n`;
    replyText += `  • 洗牌次数：${oldData.shuffleCount || 0}\n`;
  }
  
  replyText += `\n🃏 新牌库已就绪，包含 ${CARD_POOL.length} 张牌`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 注册命令
ext.cmdMap[CONFIG.HELP_CMD] = cmdHelp;
ext.cmdMap[CONFIG.DRAW_CMD] = cmdDraw;
ext.cmdMap[CONFIG.DECK_CMD] = cmdDeck;
ext.cmdMap[CONFIG.SHUFFLE_CMD] = cmdShuffle;
ext.cmdMap[CONFIG.STATUS_CMD] = cmdStatus;
ext.cmdMap[CONFIG.RESET_CMD] = cmdReset;


console.log(`${CONFIG.SYSTEM_NAME} 加载完成`);
