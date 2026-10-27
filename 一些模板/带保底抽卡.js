// ==UserScript==
// @name         通用抽卡系统模板
// @author       米线
// @version      1.2.0
// @description  一个通用的抽卡系统模板，可快速创建不同主题的抽卡池
// @timestamp    0
// @license      Apache-2
// ==/UserScript==

// ================================
// 配置区域 - 修改这里来创建不同的抽卡池
// ================================

// 扩展基本信息
const CONFIG = {
  // 扩展ID - 必须唯一，用于区分不同的抽卡池
  EXT_ID: 'universalGachaTemplate',
  // 扩展显示名称
  EXT_NAME: '通用抽卡模板',
  // 作者
  AUTHOR: '米线',
  // 版本
  VERSION: '1.2.0',
  
  // 存储键名 - 必须唯一，避免与其他抽卡池冲突
  STORAGE_KEY: 'universalGachaData',
  
  // 卡池名称，用于显示
  POOL_NAME: '幻想冒险卡池',
  
  // 单抽命令名称
  SINGLE_CMD: '冒险单抽',
  // 十连命令名称  
  MULTI_CMD: '冒险十连',
  // 信息命令名称
  INFO_CMD: '冒险信息',
  // 模拟命令名称
  SIM_CMD: '冒险概率',
  // 重置命令名称
  RESET_CMD: '重置冒险',
  // 列表命令名称
  LIST_CMD: '冒险图鉴',
  // 帮助命令名称
  HELP_CMD: '抽卡help',
  // 权限检查命令名称
  PERM_CMD: '抽卡权限',
  
  // 单抽文案模板
  SINGLE_TEXT: '在{player}的祈祷下\n{result} 从魔法阵中显现！',
  // 十连文案模板  
  MULTI_TEXT: '在{player}的虔诚祈祷下\n{results}从魔法阵中集体显现！',
  
  // 保底配置
  PITY_CONFIG: {
    BASE_RATE: 0.006,        // 基础SSR概率 0.6%
    PITY_START: 60,          // 从多少抽开始保底
    PITY_MAX: 80,            // 多少抽必出SSR
    RATE_INCREASE: 0.01      // 保底区间每抽增加的概率 1%
  },
  
  // 稀有度概率分布
  RARITY_RATES: {
    SR: 0.06,    // SR概率 6% (包含SSR概率)
    R: 0.36,     // R概率 30% (包含SR概率)
    N: 1.00      // N概率 64% (剩余概率)
  }
};

// 卡牌池配置 - 修改这里添加你的卡牌
const CARD_POOLS = {
  N: [
    "N 普通的木棍",
    "N 小治疗药水",
    "N 破旧皮甲",
    "N 火把",
    "N 面包",
    "N 初级魔法卷轴",
    "N 铜质徽章",
    "N 冒险者手册",
    "N 简易陷阱",
    "N 指南针",
    "N 麻绳",
    "N 空瓶子",
    "N 羽毛笔",
    "N 蜡烛",
    "N 磨刀石",
    "N 幸运护身符"
  ],
  R: [
    "R 铁制长剑",
    "R 银质匕首",
    "R 治疗药水",
    "R 锁子甲",
    "R 魔法护符",
    "R 精灵弓箭",
    "R 魔法水晶",
    "R 冒险者地图",
    "R 解毒剂",
    "R 力量药剂",
    "R 敏捷靴子",
    "R 智慧之书",
    "R 防护戒指",
    "R 召唤哨子"
  ],
  SR: [
    "SR 精灵长剑·流光",
    "SR 魔法师法杖·星辰",
    "SR 龙鳞铠甲",
    "SR 凤凰羽毛斗篷",
    "SR 贤者之石",
    "SR 圣光治疗杖",
    "SR 暗影匕首",
    "SR 雷霆战锤",
    "SR 冰霜弓",
    "SR 火焰法珠",
    "SR 神圣十字架",
    "SR 恶魔契约书",
    "SR 时空沙漏",
    "SR 巨龙之魂"
  ],
  SSR: [
    "SSR 圣剑·艾克斯卡利伯",
    "SSR 魔导书·无限智慧",
    "SSR 龙骑铠甲·天命",
    "SSR 精灵王冠·自然之息",
    "SSR 时间之杖·永恒",
    "SSR 创世神剑·起源"
  ]
};

// UP卡牌配置 - 修改这里设置UP卡牌
const UP_CARDS = {
  // 格式: [卡牌完整名称, 权重倍数]
  SR: [
    ["SR 精灵长剑·流光", 2],
    ["SR 魔法师法杖·星辰", 2]
  ],
  SSR: [
    ["SSR 圣剑·艾克斯卡利伯", 2],
    ["SSR 魔导书·无限智慧", 2]
  ]
};

// ================================
// 核心代码区域 - 一般不需要修改
// ================================

let ext = seal.ext.find(CONFIG.EXT_ID);
if (!ext) {
  ext = seal.ext.new(CONFIG.EXT_ID, CONFIG.AUTHOR, CONFIG.VERSION);
  seal.ext.register(ext);
}

// 获取群组ID
const getGroupId = (ctx) => {
  return ctx.group?.id || 'private_' + (ctx.player?.userId || 'default');
};

// 权限检查函数
const checkPermission = (ctx, requiredLevel = 50) => {
  // 权限等级说明：
  // 100: master
  // 60: owner
  // 50: admin
  // 40: inviter
  // 20: trusted
  // 0: normal
  // -30: banned
  
  if (ctx.privilegeLevel >= requiredLevel) {
    return { allowed: true, level: ctx.privilegeLevel };
  }
  
  return { allowed: false, level: ctx.privilegeLevel };
};

// 获取权限名称
const getPermissionName = (level) => {
  switch (level) {
    case 100:
      return "master";
    case 60:
      return "owner";
    case 50:
      return "admin";
    case 40:
      return "inviter";
    case 20:
      return "trusted";
    case 0:
      return "normal";
    case -30:
      return "banned";
    default:
      return `unknown (${level})`;
  }
};

// 权限检查命令
const cmdPerm = seal.ext.newCmdItemInfo();
cmdPerm.name = CONFIG.PERM_CMD;
cmdPerm.help = '查看当前用户的抽卡系统权限\n用法：.抽卡权限';
cmdPerm.solve = (ctx, msg, cmdArgs) => {
  const perm = checkPermission(ctx, 0); // 只是检查，不限制
  const permName = getPermissionName(perm.level);
  
  let replyText = `🔐 ${CONFIG.POOL_NAME} - 权限信息\n\n`;
  replyText += `👤 用户：${ctx.player?.name || '未知'}\n`;
  replyText += `📊 权限等级：${perm.level} (${permName})\n\n`;
  
  replyText += `🛡️ 权限说明：\n`;
  replyText += `  • normal (0): 普通用户，可正常抽卡\n`;
  replyText += `  • trusted (20): 信任用户\n`;
  replyText += `  • inviter (40): 邀请者\n`;
  replyText += `  • admin (50): 管理员，可重置保底\n`;
  replyText += `  • owner (60): 群主\n`;
  replyText += `  • master (100): 骰主\n\n`;
  
  replyText += `🎮 当前可用功能：\n`;
  replyText += `  • 抽卡功能：✅ 可用\n`;
  replyText += `  • 重置保底：${perm.level >= 50 ? '✅ 可用' : '❌ 需要admin权限'}\n`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 计算当前SSR概率
const calculateSSRProbability = (pityCount) => {
  const cfg = CONFIG.PITY_CONFIG;
  let baseProbability = cfg.BASE_RATE;
  
  if (pityCount >= cfg.PITY_START) {
    const additionalProbability = (pityCount - cfg.PITY_START) * cfg.RATE_INCREASE;
    baseProbability += additionalProbability;
  }
  
  return Math.min(baseProbability, 1.0);
};

// 构建权重映射
const buildWeightMap = () => {
  const weightMap = {};
  
  // 为每个稀有度构建权重数组
  for (const rarity of ['N', 'R', 'SR', 'SSR']) {
    const cards = CARD_POOLS[rarity];
    const upCardsList = UP_CARDS[rarity] || [];
    
    const weights = cards.map(card => {
      const upCard = upCardsList.find(up => up[0] === card);
      return upCard ? upCard[1] : 1;
    });
    
    weightMap[rarity] = { cards, weights };
  }
  
  return weightMap;
};

const weightMap = buildWeightMap();

// 从数组中随机选择一个元素，支持权重
const getWeightedRandomFromArray = (rarity) => {
  const { cards, weights } = weightMap[rarity];
  
  // 计算总权重
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // 生成随机数
  let random = Math.random() * totalWeight;
  
  // 根据权重选择卡牌
  for (let i = 0; i < cards.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return cards[i];
    }
  }
  
  // 如果出现错误，返回随机卡牌
  return cards[Math.floor(Math.random() * cards.length)];
};

// 手动权重抽取
const manualWeightedDraw = (ctx, pityCount) => {
  const cfg = CONFIG.PITY_CONFIG;
  
  // 检查是否触发保底
  if (pityCount >= cfg.PITY_MAX - 1) {
    const result = getWeightedRandomFromArray("SSR");
    return {
      result: result,
      isSSR: true,
      pityCount: 0
    };
  }
  
  const currentProbability = calculateSSRProbability(pityCount);
  const roll = Math.random();
  
  // 检查是否概率抽中SSR
  if (roll < currentProbability) {
    const result = getWeightedRandomFromArray("SSR");
    return {
      result: result,
      isSSR: true,
      pityCount: 0
    };
  } else {
    // 普通抽取
    const rarityRoll = Math.random();
    let result;
    let rarity;
    
    if (rarityRoll < CONFIG.RARITY_RATES.SR) {
      result = getWeightedRandomFromArray("SR");
      rarity = "SR";
    } else if (rarityRoll < CONFIG.RARITY_RATES.R) {
      result = getWeightedRandomFromArray("R");
      rarity = "R";
    } else {
      result = getWeightedRandomFromArray("N");
      rarity = "N";
    }
    
    return {
      result: result,
      isSSR: false,
      pityCount: pityCount + 1,
      rarity: rarity
    };
  }
};

// 检查是否是UP卡牌
const isUpCard = (card, rarity) => {
  const upCardsList = UP_CARDS[rarity] || [];
  return upCardsList.some(up => up[0] === card && up[1] > 1);
};

// 获取UP卡牌权重
const getUpCardWeight = (card, rarity) => {
  const upCardsList = UP_CARDS[rarity] || [];
  const upCard = upCardsList.find(up => up[0] === card);
  return upCard ? upCard[1] : 1;
};

// 帮助命令 - 显示所有可用指令
const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = CONFIG.HELP_CMD;
cmdHelp.help = `显示${CONFIG.POOL_NAME}的所有可用指令\n用法：.${CONFIG.HELP_CMD}`;
cmdHelp.solve = (ctx, msg, cmdArgs) => {
  let replyText = `🎮 ${CONFIG.POOL_NAME} - 抽卡系统帮助 🎮\n\n`;
  
  replyText += `📊 系统信息：\n`;
  replyText += `  • 卡池名称：${CONFIG.POOL_NAME}\n`;
  replyText += `  • 作者：${CONFIG.AUTHOR}\n`;
  replyText += `  • 版本：${CONFIG.VERSION}\n\n`;
  
  replyText += `🎯 概率设置：\n`;
  replyText += `  • SSR基础概率：${(CONFIG.PITY_CONFIG.BASE_RATE * 100).toFixed(2)}%\n`;
  replyText += `  • SR概率：${(CONFIG.RARITY_RATES.SR * 100).toFixed(1)}%\n`;
  replyText += `  • R概率：${((CONFIG.RARITY_RATES.R - CONFIG.RARITY_RATES.SR) * 100).toFixed(1)}%\n`;
  replyText += `  • N概率：${((CONFIG.RARITY_RATES.N - CONFIG.RARITY_RATES.R) * 100).toFixed(1)}%\n\n`;
  
  replyText += `🛡️ 保底机制：\n`;
  replyText += `  • ${CONFIG.PITY_CONFIG.PITY_START}抽后进入保底区间\n`;
  replyText += `  • ${CONFIG.PITY_CONFIG.PITY_MAX}抽必出SSR\n`;
  replyText += `  • 保底区间每抽SSR概率增加${(CONFIG.PITY_CONFIG.RATE_INCREASE * 100).toFixed(0)}%\n\n`;
  
  replyText += `🎪 可用指令：\n`;
  replyText += `  • .${CONFIG.SINGLE_CMD} - 进行单次抽卡\n`;
  replyText += `  • .${CONFIG.MULTI_CMD} - 进行十连抽卡\n`;
  replyText += `  • .${CONFIG.INFO_CMD} - 查看当前保底信息\n`;
  replyText += `  • .${CONFIG.SIM_CMD} [次数] - 模拟指定保底计数下的概率\n`;
  replyText += `  • .${CONFIG.LIST_CMD} [稀有度] - 查看卡牌图鉴\n`;
  replyText += `  • .${CONFIG.PERM_CMD} - 查看当前权限\n`;
  replyText += `  • .${CONFIG.RESET_CMD} - 重置保底计数（管理员专用）\n\n`;
  
  // 显示UP卡牌信息
  const hasUpCards = UP_CARDS.SSR.length > 0 || UP_CARDS.SR.length > 0;
  if (hasUpCards) {
    replyText += `✨ UP卡牌（概率提升）：\n`;
    if (UP_CARDS.SSR.length > 0) {
      replyText += `  • SSR：${UP_CARDS.SSR.map(card => `${card[0]}(${card[1]}倍)`).join("、")}\n`;
    }
    if (UP_CARDS.SR.length > 0) {
      replyText += `  • SR：${UP_CARDS.SR.map(card => `${card[0]}(${card[1]}倍)`).join("、")}\n`;
    }
    replyText += `\n`;
  }
  
  replyText += `📝 卡牌统计：\n`;
  replyText += `  • N卡：${CARD_POOLS.N.length}张\n`;
  replyText += `  • R卡：${CARD_POOLS.R.length}张\n`;
  replyText += `  • SR卡：${CARD_POOLS.SR.length}张\n`;
  replyText += `  • SSR卡：${CARD_POOLS.SSR.length}张\n\n`;
  
  replyText += `💡 使用提示：\n`;
  replyText += `  • 所有指令都有简写形式，如 .单抽 .十连 等\n`;
  replyText += `  • 保底计数按群组独立存储\n`;
  replyText += `  • UP卡牌在同稀有度中概率更高\n`;
  replyText += `  • 使用 .${CONFIG.PERM_CMD} 查看权限信息\n`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 单抽命令
const cmdSingle = seal.ext.newCmdItemInfo();
cmdSingle.name = CONFIG.SINGLE_CMD;
cmdSingle.help = `${CONFIG.POOL_NAME}单抽\n用法：.${CONFIG.SINGLE_CMD}`;
cmdSingle.solve = (ctx, msg, cmdArgs) => {
  const groupId = getGroupId(ctx);
  
  // 读取保底数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = { pityCount: 0, totalDraws: 0 };
  }
  
  const groupData = data[groupId];
  const currentPity = groupData.pityCount || 0;
  
  // 执行抽卡
  const drawResult = manualWeightedDraw(ctx, currentPity);
  
  // 更新数据
  groupData.pityCount = drawResult.pityCount;
  groupData.totalDraws = (groupData.totalDraws || 0) + 1;
  data[groupId] = groupData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  // 构建回复消息
  let replyText = CONFIG.SINGLE_TEXT
    .replace('{player}', ctx.player?.name || '玩家')
    .replace('{result}', drawResult.result);
  
  replyText += `\n\n`;
  
  // 检查是否是UP卡牌
  const isUp = isUpCard(drawResult.result, drawResult.rarity);
  
  if (drawResult.isSSR) {
    replyText += `🎉 恭喜获得SSR！`;
    if (isUp) {
      replyText += `✨ UP卡牌概率提升！`;
    }
    replyText += `\n保底计数已重置\n`;
  } else {
    const nextPity = drawResult.pityCount;
    const currentProb = (calculateSSRProbability(nextPity) * 100).toFixed(2);
    const cfg = CONFIG.PITY_CONFIG;
    
    replyText += `保底计数：${nextPity}/${cfg.PITY_MAX} | 当前SSR概率：${currentProb}%`;
    if (isUp) {
      const weight = getUpCardWeight(drawResult.result, drawResult.rarity);
      replyText += `\n✨ UP卡牌概率提升${weight}倍！`;
    }
    
    // 提示信息
    if (nextPity >= cfg.PITY_START && nextPity < cfg.PITY_START + 10) {
      replyText += `\n💫 已进入保底区间！SSR概率每抽增加${(cfg.RATE_INCREASE * 100).toFixed(0)}%`;
    } else if (nextPity >= cfg.PITY_START + 10 && nextPity < cfg.PITY_MAX - 1) {
      replyText += `\n✨ SSR概率大幅提升中！`;
    } else if (nextPity >= cfg.PITY_MAX - 1) {
      replyText += `\n🌟 下次必出SSR！`;
    }
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 十连命令
const cmdMulti = seal.ext.newCmdItemInfo();
cmdMulti.name = CONFIG.MULTI_CMD;
cmdMulti.help = `${CONFIG.POOL_NAME}十连\n用法：.${CONFIG.MULTI_CMD}`;
cmdMulti.solve = (ctx, msg, cmdArgs) => {
  const groupId = getGroupId(ctx);
  
  // 读取保底数据
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  if (!data[groupId]) {
    data[groupId] = { pityCount: 0, totalDraws: 0 };
  }
  
  const groupData = data[groupId];
  let currentPity = groupData.pityCount || 0;
  let totalSSR = 0;
  let upCardsCount = 0;
  const results = [];
  
  // 执行10次抽卡
  for (let i = 0; i < 10; i++) {
    const drawResult = manualWeightedDraw(ctx, currentPity);
    results.push(drawResult);
    currentPity = drawResult.pityCount;
    if (drawResult.isSSR) {
      totalSSR++;
    }
    
    // 统计UP卡牌
    if (isUpCard(drawResult.result, drawResult.rarity)) {
      upCardsCount++;
    }
  }
  
  // 更新数据
  groupData.pityCount = currentPity;
  groupData.totalDraws = (groupData.totalDraws || 0) + 10;
  data[groupId] = groupData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  // 构建回复消息
  let resultsText = '';
  results.forEach((drawResult) => {
    const isUp = isUpCard(drawResult.result, drawResult.rarity);
    resultsText += isUp ? `✨ ${drawResult.result} ✨\n` : `${drawResult.result}\n`;
  });
  
  let replyText = CONFIG.MULTI_TEXT
    .replace('{player}', ctx.player?.name || '玩家')
    .replace('{results}', resultsText);
  
  replyText += `\n\n`;
  replyText += `🎊 十连结果：获得 ${totalSSR} 个SSR！\n`;
  if (upCardsCount > 0) {
    replyText += `✨ 其中 ${upCardsCount} 张UP卡牌！\n`;
  }
  
  const cfg = CONFIG.PITY_CONFIG;
  const currentProb = (calculateSSRProbability(currentPity) * 100).toFixed(2);
  replyText += `📊 保底计数：${currentPity}/${cfg.PITY_MAX} | 当前SSR概率：${currentProb}%`;
  
  // 概率信息
  if (currentPity >= cfg.PITY_START) {
    if (currentPity >= cfg.PITY_START && currentPity < cfg.PITY_START + 10) {
      replyText += `\n💫 已进入保底区间！SSR概率每抽增加${(cfg.RATE_INCREASE * 100).toFixed(0)}%`;
    } else if (currentPity >= cfg.PITY_START + 10 && currentPity < cfg.PITY_MAX - 1) {
      replyText += `\n✨ SSR概率大幅提升中！`;
    } else if (currentPity >= cfg.PITY_MAX - 1) {
      replyText += `\n🌟 下次必出SSR！`;
    }
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 查看保底信息命令
const cmdInfo = seal.ext.newCmdItemInfo();
cmdInfo.name = CONFIG.INFO_CMD;
cmdInfo.help = `查看${CONFIG.POOL_NAME}抽卡保底信息\n用法：.${CONFIG.INFO_CMD}`;
cmdInfo.solve = (ctx, msg, cmdArgs) => {
  const groupId = getGroupId(ctx);
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  const groupData = data[groupId] || { pityCount: 0, totalDraws: 0 };
  
  const pityCount = groupData.pityCount || 0;
  const totalDraws = groupData.totalDraws || 0;
  const currentProbability = (calculateSSRProbability(pityCount) * 100).toFixed(2);
  const cfg = CONFIG.PITY_CONFIG;
  
  let replyText = `📊 ${CONFIG.POOL_NAME}抽卡信息\n`;
  replyText += `🔄 保底计数：${pityCount}/${cfg.PITY_MAX}\n`;
  replyText += `🎯 当前SSR概率：${currentProbability}%\n`;
  replyText += `📈 总抽卡次数：${totalDraws}\n\n`;
  
  // 显示UP卡牌信息
  const hasUpCards = UP_CARDS.SSR.length > 0 || UP_CARDS.SR.length > 0;
  if (hasUpCards) {
    replyText += `✨ UP卡牌概率提升：\n`;
    if (UP_CARDS.SSR.length > 0) {
      replyText += `  SSR: ${UP_CARDS.SSR.map(card => `${card[0]}(${card[1]}倍)`).join(", ")}\n`;
    }
    if (UP_CARDS.SR.length > 0) {
      replyText += `  SR: ${UP_CARDS.SR.map(card => `${card[0]}(${card[1]}倍)`).join(", ")}\n`;
    }
    replyText += `\n`;
  }
  
  // 保底进度提示
  if (pityCount < cfg.PITY_START) {
    replyText += `💤 距离保底区间还有${cfg.PITY_START - pityCount}抽`;
  } else if (pityCount < cfg.PITY_MAX - 1) {
    const remaining = cfg.PITY_MAX - pityCount;
    replyText += `💫 已在保底区间！${remaining}抽后必出SSR\n`;
    replyText += `⭐ 每抽SSR概率增加${(cfg.RATE_INCREASE * 100).toFixed(0)}%，当前已增加${(pityCount - cfg.PITY_START) * cfg.RATE_INCREASE * 100}%`;
  } else {
    replyText += `🌟 下次抽卡必出SSR！`;
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 概率模拟命令
const cmdSimulate = seal.ext.newCmdItemInfo();
cmdSimulate.name = CONFIG.SIM_CMD;
cmdSimulate.help = `模拟指定保底计数下的SSR概率\n用法：.${CONFIG.SIM_CMD} [保底计数]`;
cmdSimulate.solve = (ctx, msg, cmdArgs) => {
  const cfg = CONFIG.PITY_CONFIG;
  let pityCount = parseInt(cmdArgs.getArgN(1)) || 0;
  
  if (pityCount < 0) pityCount = 0;
  if (pityCount > cfg.PITY_MAX - 1) pityCount = cfg.PITY_MAX - 1;
  
  const probability = (calculateSSRProbability(pityCount) * 100).toFixed(2);
  
  let replyText = `📈 ${CONFIG.POOL_NAME}概率模拟 - 保底计数: ${pityCount}/${cfg.PITY_MAX}\n`;
  replyText += `🎯 SSR概率: ${probability}%\n\n`;
  
  if (pityCount < cfg.PITY_START) {
    replyText += `基础概率: ${(cfg.BASE_RATE * 100).toFixed(2)}%\n`;
    replyText += `距离保底区间: ${cfg.PITY_START - pityCount}抽`;
  } else if (pityCount < cfg.PITY_MAX - 1) {
    const increase = (pityCount - cfg.PITY_START) * cfg.RATE_INCREASE * 100;
    replyText += `基础概率: ${(cfg.BASE_RATE * 100).toFixed(2)}%\n`;
    replyText += `保底加成: +${increase.toFixed(2)}%\n`;
    replyText += `剩余${cfg.PITY_MAX - pityCount}抽后必出SSR`;
  } else {
    replyText += `🎯 下次抽卡必出SSR！`;
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 重置保底命令（管理员专用）- 按照海豹权限系统重写
const cmdReset = seal.ext.newCmdItemInfo();
cmdReset.name = CONFIG.RESET_CMD;
cmdReset.help = `重置当前群组${CONFIG.POOL_NAME}保底计数（管理员专用）\n用法：.${CONFIG.RESET_CMD}`;
cmdReset.solve = (ctx, msg, cmdArgs) => {
  // 权限检查 - 需要admin(50)或以上权限
  const perm = checkPermission(ctx, 50);
  
  if (!perm.allowed) {
    const permName = getPermissionName(perm.level);
    seal.replyToSender(ctx, msg, `❌ 权限不足！需要admin(50)权限，当前权限：${perm.level} (${permName})`);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  const groupId = getGroupId(ctx);
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  
  if (data[groupId]) {
    const oldPity = data[groupId].pityCount || 0;
    const oldTotal = data[groupId].totalDraws || 0;
    
    data[groupId].pityCount = 0;
    data[groupId].totalDraws = oldTotal; // 保持总抽数记录不变
    
    ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
    
    const permName = getPermissionName(perm.level);
    seal.replyToSender(ctx, msg, `✅ 已重置当前群组的${CONFIG.POOL_NAME}保底计数（${oldPity}→0）\n👤 操作者权限：${perm.level} (${permName})`);
  } else {
    seal.replyToSender(ctx, msg, `当前群组暂无${CONFIG.POOL_NAME}抽卡记录。`);
  }
  
  return seal.ext.newCmdExecuteResult(true);
};

// 卡牌列表命令
const cmdList = seal.ext.newCmdItemInfo();
cmdList.name = CONFIG.LIST_CMD;
cmdList.help = `查看${CONFIG.POOL_NAME}所有可用卡牌\n用法：.${CONFIG.LIST_CMD} [N|R|SR|SSR]`;
cmdList.solve = (ctx, msg, cmdArgs) => {
  const rarity = cmdArgs.getArgN(1)?.toUpperCase() || '';
  
  let replyText = '';
  
  if (!rarity || !['N', 'R', 'SR', 'SSR'].includes(rarity)) {
    // 显示所有稀有度的统计
    const totalSR = CARD_POOLS.SR.length;
    const totalSSR = CARD_POOLS.SSR.length;
    const upSR = UP_CARDS.SR.length;
    const upSSR = UP_CARDS.SSR.length;
    
    replyText = `🃏 ${CONFIG.POOL_NAME}卡牌统计\n`;
    replyText += `N卡: ${CARD_POOLS.N.length} 张\n`;
    replyText += `R卡: ${CARD_POOLS.R.length} 张\n`;
    replyText += `SR卡: ${totalSR} 张${upSR > 0 ? ` (其中${upSR}张UP卡牌概率提升)` : ''}\n`;
    replyText += `SSR卡: ${totalSSR} 张${upSSR > 0 ? ` (其中${upSSR}张UP卡牌概率提升)` : ''}\n\n`;
    
    if (upSR > 0 || upSSR > 0) {
      replyText += `✨ UP卡牌：\n`;
      if (upSSR > 0) {
        replyText += `  SSR: ${UP_CARDS.SSR.map(card => `${card[0]}(${card[1]}倍)`).join(", ")}\n`;
      }
      if (upSR > 0) {
        replyText += `  SR: ${UP_CARDS.SR.map(card => `${card[0]}(${card[1]}倍)`).join(", ")}\n`;
      }
      replyText += `\n`;
    }
    
    replyText += `使用 .${CONFIG.LIST_CMD} N/R/SR/SSR 查看具体卡牌`;
  } else {
    // 显示指定稀有度的卡牌列表
    const cards = CARD_POOLS[rarity];
    const upCardsList = UP_CARDS[rarity] || [];
    
    replyText = `${CONFIG.POOL_NAME} ${rarity}卡列表 (共${cards.length}张):\n`;
    cards.forEach((card, index) => {
      // 标记UP卡牌
      const upCard = upCardsList.find(up => up[0] === card);
      if (upCard) {
        replyText += `✨ ${card} ✨ (UP卡牌${upCard[1]}倍概率)\n`;
      } else {
        replyText += `${card}\n`;
      }
    });
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 注册命令
ext.cmdMap[CONFIG.HELP_CMD] = cmdHelp;
ext.cmdMap[CONFIG.PERM_CMD] = cmdPerm;
ext.cmdMap[CONFIG.SINGLE_CMD] = cmdSingle;
ext.cmdMap[CONFIG.MULTI_CMD] = cmdMulti;
ext.cmdMap[CONFIG.INFO_CMD] = cmdInfo;
ext.cmdMap[CONFIG.SIM_CMD] = cmdSimulate;
ext.cmdMap[CONFIG.RESET_CMD] = cmdReset;
ext.cmdMap[CONFIG.LIST_CMD] = cmdList;

// 注册别名命令（可选）
ext.cmdMap['抽卡帮助'] = cmdHelp;
ext.cmdMap['抽卡权限'] = cmdPerm;
ext.cmdMap['单抽'] = cmdSingle;
ext.cmdMap['十连'] = cmdMulti;
ext.cmdMap['抽卡信息'] = cmdInfo;
ext.cmdMap['概率模拟'] = cmdSimulate;
ext.cmdMap['重置保底'] = cmdReset;
ext.cmdMap['卡牌列表'] = cmdList;
