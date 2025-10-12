// ==UserScript==
// @name         每日答案之书
// @author       米线
// @version      1.0.0
// @description  每日限制抽取一次的答案之书
// @timestamp    1672066028
// @license      Apache-2
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==

// ================================
// 配置区域
// ================================

const CONFIG = {
  EXT_ID: 'dailyBookOfAnswers',
  EXT_NAME: '每日答案之书',
  AUTHOR: '米线',
  VERSION: '1.0.0',
  STORAGE_KEY: 'dailyBookOfAnswersData',
  SYSTEM_NAME: '答案之书',
  DRAW_CMD: '答案之书',
  INFO_CMD: '答案之书记录',
  HELP_CMD: '答案之书help',
  QUESTION_PROMPT: '请在心中默念你的问题，然后发送 .答案之书 来获取答案',
  DRAW_TEXT: '在{player}的虔诚询问下\n答案之书缓缓翻开...\n\n你的问题：{question}\n\n答案之书说：{answer}',
  ALREADY_DRAWN_TEXT: '{player}，你今天已经询问过答案之书了！\n\n你今天的问题：{question}\n\n答案之书说：{answer}',
  COOLDOWN_HOURS: 24
};

const BOOK_ANSWERS = [
  "是的，毫无疑问。",
  "不，现在还不是时候。",
  "相信你的直觉。",
  "再等等看。",
  "机会很大，但要谨慎。",
  "放下执念，顺其自然。",
  "勇敢地迈出第一步。",
  "保持耐心，时间会给你答案。",
  "寻求他人的帮助。",
  "专注于当下。",
  "这是一个好时机。",
  "暂时保持现状。",
  "答案就在你心中。",
  "会有意想不到的转机。",
  "学会放手。",
  "坚持就是胜利。",
  "换个角度思考。",
  "保持乐观的心态。",
  "需要更多的信息。",
  "听从内心的声音。",
  "一切都会好起来的。",
  "这值得一试。",
  "保持冷静。",
  "相信自己的判断。",
  "结果可能会让你惊喜。",
  "需要更多的努力。",
  "时机还未成熟。",
  "答案是肯定的。",
  "答案是否定的。",
  "跟随你的热情。",
  "谨慎行事。",
  "大胆一些。",
  "保持低调。",
  "寻求平衡。",
  "信任这个过程。",
  "会有贵人相助。",
  "先处理好其他事情。",
  "这只是一个阶段。",
  "未来充满希望。",
  "学会妥协。",
  "坚持你的立场。",
  "放慢脚步。",
  "加速前进。",
  "保持开放的心态。",
  "专注于你的目标。",
  "享受这个过程。",
  "结果可能不如预期。",
  "超出你的预期。",
  "需要更多的耐心。",
  "立即行动。",
  "等待更好的时机。",
  "答案很快就会揭晓。",
  "这需要时间。",
  "相信宇宙的安排。",
  "你已经有答案了。",
  "跟随你的梦想。",
  "现实一点。",
  "保持灵活性。",
  "坚持原则。",
  "会有新的机会。",
  "珍惜现在拥有的。",
  "向前看。",
  "回顾过去寻找答案。",
  "倾听他人的建议。",
  "自己做决定。",
  "这很重要。",
  "这并不重要。",
  "是的，但要付出代价。",
  "不，但会有更好的选择。",
  "全心全意去做。",
  "适可而止。",
  "冒险一试。",
  "安全第一。",
  "会有回报的。",
  "过程比结果更重要。",
  "结果比过程更重要。",
  "保持真诚。",
  "需要策略。",
  "简单直接最好。",
  "复杂但有价值。",
  "相信你的能力。",
  "寻求专业意见。",
  "答案就在眼前。",
  "需要深入思考。",
  "随缘就好。",
  "积极争取。",
  "保持距离。",
  "拉近距离。",
  "独立完成。",
  "团队合作。",
  "传统方法更好。",
  "创新方法更好。",
  "保持现状。",
  "做出改变。",
  "小的改变。",
  "大的改变。",
  "一步一步来。",
  "一次性解决。",
  "会有阻碍。",
  "一帆风顺。",
  "学习新的东西。",
  "运用已有的经验。",
  "分享你的想法。",
  "保守秘密。",
  "说出来。",
  "保持沉默。",
  "主动一些。",
  "被动等待。",
  "付出会有回报。",
  "不求回报。"
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

const getRandomAnswer = () => {
  const randomIndex = Math.floor(Math.random() * BOOK_ANSWERS.length);
  return BOOK_ANSWERS[randomIndex];
};

// 帮助命令
const cmdHelp = seal.ext.newCmdItemInfo();
cmdHelp.name = CONFIG.HELP_CMD;
cmdHelp.help = `显示${CONFIG.SYSTEM_NAME}的所有可用指令\n用法：.${CONFIG.HELP_CMD}`;
cmdHelp.solve = (ctx, msg, cmdArgs) => {
  let replyText = `${CONFIG.SYSTEM_NAME} - 智慧指引系统\n\n`;
  
  replyText += `系统信息：\n`;
  replyText += `  - 系统名称：${CONFIG.SYSTEM_NAME}\n`;
  replyText += `  - 作者：${CONFIG.AUTHOR}\n`;
  replyText += `  - 版本：${CONFIG.VERSION}\n\n`;
  
  replyText += `使用规则：\n`;
  replyText += `  - 每日限制：每人每天只能询问一次\n`;
  replyText += `  - 冷却时间：${CONFIG.COOL_DOWN_HOURS}小时\n\n`;
  
  replyText += `答案之书统计：\n`;
  replyText += `  - 总答案数：${BOOK_ANSWERS.length}条\n`;
  replyText += `  - 涵盖生活各个方面\n\n`;
  
  replyText += `可用指令：\n`;
  replyText += `  - .${CONFIG.DRAW_CMD} - 询问答案之书\n`;
  replyText += `  - .${CONFIG.INFO_CMD} - 查看询问记录\n`;
  replyText += `  - .${CONFIG.HELP_CMD} - 查看帮助信息\n\n`;
  
  replyText += `使用步骤：\n`;
  replyText += `  1. 在心中默念你的问题\n`;
  replyText += `  2. 发送 .${CONFIG.DRAW_CMD} 获取答案\n`;
  replyText += `  3. 仔细思考答案的含义\n\n`;
  
  replyText += `使用提示：\n`;
  replyText += `  - 问题要具体明确\n`;
  replyText += `  - 保持开放的心态接受答案\n`;
  replyText += `  - 答案仅供参考，最终决定在自己\n`;
  replyText += `  - 每天只能询问一次，请珍惜机会`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 抽卡命令
const cmdDraw = seal.ext.newCmdItemInfo();
cmdDraw.name = CONFIG.DRAW_CMD;
cmdDraw.help = `询问答案之书（每日一次）\n用法：.${CONFIG.DRAW_CMD} [你的问题]`;

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
    lastQuestion: '',
    lastAnswer: ''
  };
  
  // 检查是否今天已经询问过
  const todayDrawn = checkTodayDrawn(userData.lastDrawTime);
  
  if (todayDrawn && userData.lastAnswer) {
    // 今天已经询问过，显示今天的答案
    let replyText = CONFIG.ALREADY_DRAWN_TEXT
      .replace('{player}', ctx.player?.name || '询问者')
      .replace('{question}', userData.lastQuestion || '未记录问题')
      .replace('{answer}', userData.lastAnswer);
    
    replyText += `\n\n统计信息：\n`;
    replyText += `- 这是你第${userData.totalDraws}次询问答案之书\n`;
    replyText += `- 明天可以再次询问`;
    
    seal.replyToSender(ctx, msg, replyText);
    return seal.ext.newCmdExecuteResult(true);
  }
  
  // 获取用户输入的问题
  const userQuestion = cmdArgs.getArgN(1);
  const question = userQuestion ? userQuestion : '心中默念的问题';
  
  // 获取随机答案
  const answer = getRandomAnswer();
  
  // 更新数据
  userData.lastDrawTime = new Date().toISOString();
  userData.totalDraws = (userData.totalDraws || 0) + 1;
  userData.lastQuestion = question;
  userData.lastAnswer = answer;
  userData.lastDrawDate = new Date().toLocaleDateString('zh-CN');
  
  data[groupId][targetUserId] = userData;
  ext.storageSet(CONFIG.STORAGE_KEY, JSON.stringify(data));
  
  // 构建回复消息
  let replyText = CONFIG.DRAW_TEXT
    .replace('{player}', ctx.player?.name || '询问者')
    .replace('{question}', question)
    .replace('{answer}', answer);
  
  replyText += `\n\n统计信息：\n`;
  replyText += `- 这是你第${userData.totalDraws}次询问答案之书\n`;
  replyText += `- 明天可以再次询问\n\n`;
  replyText += `提示：答案仅供参考，请结合实际情况思考`;
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 信息命令
const cmdInfo = seal.ext.newCmdItemInfo();
cmdInfo.name = CONFIG.INFO_CMD;
cmdInfo.help = `查看答案之书记录\n用法：.${CONFIG.INFO_CMD}`;

cmdInfo.solve = (ctx, msg, cmdArgs) => {
  const targetUserId = ctx.player.userId;
  const targetUserName = ctx.player.name;
  const groupId = getGroupId(ctx);
  
  const data = JSON.parse(ext.storageGet(CONFIG.STORAGE_KEY) || '{}');
  const userData = data[groupId]?.[targetUserId] || {
    lastDrawTime: null,
    totalDraws: 0,
    lastQuestion: '',
    lastAnswer: ''
  };
  
  const todayDrawn = checkTodayDrawn(userData.lastDrawTime);
  
  let replyText = `${CONFIG.SYSTEM_NAME} - 个人记录\n\n`;
  replyText += `用户：${targetUserName}\n`;
  replyText += `总询问次数：${userData.totalDraws || 0}\n`;
  replyText += `今日状态：${todayDrawn ? '已询问' : '未询问'}\n`;
  
  if (todayDrawn) {
    replyText += `下次询问：明天\n`;
  } else {
    replyText += `现在可以询问\n`;
  }
  
  if (userData.lastQuestion && userData.lastAnswer) {
    replyText += `\n最近一次询问：\n`;
    replyText += `- 日期：${userData.lastDrawDate || '未知'}\n`;
    replyText += `- 问题：${userData.lastQuestion}\n`;
    replyText += `- 答案：${userData.lastAnswer}\n`;
  }
  
  seal.replyToSender(ctx, msg, replyText);
  return seal.ext.newCmdExecuteResult(true);
};

// 注册命令
ext.cmdMap[CONFIG.HELP_CMD] = cmdHelp;
ext.cmdMap[CONFIG.DRAW_CMD] = cmdDraw;
ext.cmdMap[CONFIG.INFO_CMD] = cmdInfo;

// 注册别名命令
ext.cmdMap['答案之书帮助'] = cmdHelp;
ext.cmdMap['询问答案'] = cmdDraw;
ext.cmdMap['答案记录'] = cmdInfo;

console.log(`${CONFIG.SYSTEM_NAME} 加载完成`);