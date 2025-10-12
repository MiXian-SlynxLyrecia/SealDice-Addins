// ==UserScript==
// @name         击毙群友
// @author       米线
// @version      1.1.0
// @Stage        基于某人佬神秘插件改出来的和谐版，窝要鸡弊泥门索有人！！！Usage：击毙群友@xxx | .击毙群友 help
// @timestamp    0
// @license      MIT
// @homepageURL  https://github.com/
// ==/UserScript==

// FAQ:
// - Q: 为什么使用 JavaScript 而不是 TypeScript？
// - A: TypeScript 需要编译，考虑到手机用户和硬编码配置的便捷性，JavaScript 更适合直接修改和使用。

// 配置项
let shootLimit = {
    'minDamage': 10, // 最小伤害值
    'maxDamage': 100, // 最大伤害值
    'maxShootCount_today': 20, // 每日最大击毙次数
    'beKOd': 5, // 被击毙多少次进入"KO"状态
    'cooldown': 30000 // 击毙冷却时间 (ms)
};

// 武器威力描述
let weaponStage = {
    'Legendary': [90, "传说级"],
    'Epic': [70, "史诗级"],
    'Rare': [50, "稀有"],
    'Common': [30, "普通"],
    'Weak': [10, "微弱"],
    'Garbage':[0,"小破枪"]
};

// 受伤状态描述
let injuryStage = {
    'Critical': [1000, "重伤濒死"],
    'Severe': [500, "严重受伤"],
    'Moderate': [200, "伤痕累累"],
    'Light': [50, "轻微擦伤"],
    'Healthy': [0, "毫发无伤"]
};

// 部分回复词
let shootNotice = {
    'cooldown': "你的枪管还在冷却，暂时无法开火！",
    'noSelfShoot': "你不能对着自己开枪！想不开去找心理医生！",
    'KOFight': {
        '1': (targetUserId) => `[CQ:at,qq=${targetUserId}] 已经被你击毙到昏迷，但你依然火力全开，子弹无情地倾泻，地面都被血染红了！`,
        '2': (targetUserId) => `[CQ:at,qq=${targetUserId}] 在你的狂轰滥炸下已经失去意识，可你还是对着那颤抖的身躯疯狂扫射，空气中弥漫着火药味！`,
        '3': (targetUserId) => `[CQ:at,qq=${targetUserId}] 在你无休止的射击下露出崩溃的表情，但你依然扣动扳机，子弹撕裂了最后一丝防线！`
    },
    'weaponUpgrade': {
        'success': [
            "武器大师精心打磨了你的枪械，威力大幅提升！",
            "你找到了一盒高级弹药，武器威力得到了增强！",
            "经过专业改造，你的武器现在更加致命了！",
            "神秘商人赠送了你一件武器配件，威力上升！"
        ],
        'fail': [
            "武器卡壳了！威力不升反降...",
            "你在改造时不小心弄坏了零件，武器威力下降了！",
            "使用了劣质弹药，武器性能受损！",
            "改造失败！武器好像不如以前好用了..."
        ],
        'neutral': [
            "你尝试强化武器，但似乎什么都没发生...",
            "武器大师看了看你的装备，摇了摇头表示无能为力。",
            "你摆弄了半天武器，但它看起来没什么变化。",
            "强化过程很顺利，但武器威力似乎保持原样。"
        ]
    }
};

// 插件注册
let ext = seal.ext.find('击毙群友');
if (!ext) {
    /**
     * 初始化或更新用户数据
     * @param {object} shootStorage - 存储对象
     * @param {string} userId - 用户 ID (纯数字)
     * @param {object} defaultData - 初始数据对象
     */
    function mergeUserData(shootStorage, ctx, defaultData) {
        let userId = ctx.player.userId.replace(/\D/g, '');
        let userData = shootStorage[userId];

        if (!userData) {
            defaultData.name = ctx.player.name;
            shootStorage[userId] = defaultData;
            return;
        }

        if (!userData.name) {
            userData.name = ctx.player.name;
        }

        for (const key in defaultData) {
            if (!(key in userData)) {
                userData[key] = defaultData[key];
            } else if (key === 'shootTime_first' && userData[key] === 0) {
                userData[key] = defaultData[key];
            }
        }

        shootStorage[userId] = userData;
    }

    /**
     * 根据数值获取对应的描述文本
     * @param {object} obj - 描述对象，键为阶段名，值为 [阈值, 描述文本] 的数组
     * @param {number} value - 用于判断的数值
     * @returns {string} 匹配到的描述文本
     */
    function getDescription(obj, value) {
        const entries = Object.entries(obj).sort((a, b) => b[1][0] - a[1][0]);
        for (const [key, val] of entries) {
            if (value >= val[0]) {
                return val[1];
            }
        }
    }

    /**
     * 生成随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 保留两位小数的随机数
     */
    function doRandom(min, max) {
        return +(Math.random() * (max - min) + min).toFixed(2);
    }

    /**
     * 每日重置数据
     * @param {object} shootStorage - 存储对象
     */
    function dailyReset(shootStorage) {
        for (const user in shootStorage) {
            let tmpUser = shootStorage[user];
            tmpUser.shootTime_last_today = 0;
            tmpUser.shootCount_today = 0;
            tmpUser.shootDamage_today = 0;
            tmpUser.beShotTime_last_today = 0;
            tmpUser.beShotCount_today = 0;
            tmpUser.beShotDamage_today = 0;
            tmpUser.isKO = false;
        }
    }

    /**
     * 按指定字段排序对象
     * @param {object} obj - 待排序对象
     * @param {string} sortKey - 排序字段
     * @param {boolean} reverse - 是否倒序
     * @returns {object} 排序后的对象
     */
    function sortNestedObject(obj, sortKey, reverse = true) {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            throw new Error('第一个参数必须是非数组对象');
        }
        if (typeof sortKey !== 'string') {
            throw new Error('第二个参数必须是字符串');
        }

        const entries = Object.entries(obj);
        entries.sort((a, b) => {
            const aValue = a[1][sortKey];
            const bValue = b[1][sortKey];

            if (typeof aValue !== 'number' || typeof bValue !== 'number') {
                const aStr = String(aValue);
                const bStr = String(bValue);
                return reverse ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
            }

            return reverse ? bValue - aValue : aValue - bValue;
        });

        return Object.fromEntries(entries);
    }

    /**
     * 生成排行榜文本
     * @param {object} storage - 存储对象
     * @param {string} field - 排序字段
     * @param {string} title - 排行榜标题
     * @param {string} unit - 单位描述
     * @returns {string} 排行榜文本
     */
    function generateRanking(storage, field, title, unit, ctx) {
        const validUsers = Object.entries(storage)
            .filter(([userId, data]) => data[field] !== undefined && data[field] > 0)
            .map(([userId, data]) => ({
                userId,
                value: data[field],
                name: data.name || `[CQ:at,qq=${userId}]`
            }));

        if (validUsers.length === 0) {
            return `${title}\n暂无数据，大家都和平相处呢~`;
        }

        validUsers.sort((a, b) => b.value - a.value);
        const topUsers = validUsers.slice(0, 10);

        let text = `===== ${title} =====\n`;
        text += `🏆 排名 | 用户 | ${unit}\n`;
        text += '----------------------------\n';

        topUsers.forEach((user, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            text += `${rankEmoji} ${user.name} - ${user.value.toFixed(2)}${unit.includes('次') ? '' : '点'}\n`;
        });

        const currentUser = validUsers.find(u => u.userId === ctx.player.userId.replace(/\D/g, ''));
        if (currentUser && !topUsers.includes(currentUser)) {
            const userRank = validUsers.findIndex(u => u.userId === ctx.player.userId.replace(/\D/g, '')) + 1;
            text += `\n你的排名：${userRank}/${validUsers.length}`;
        }

        return text;
    }

    /**
     * 获取随机回复文本
     * @param {string[]} texts - 文本数组
     * @returns {string} 随机文本
     */
    function getRandomText(texts) {
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // 注册扩展
    ext = seal.ext.new('击毙群友', '米线', '1.1.0');
    seal.ext.register(ext);
    seal.ext.registerIntConfig(ext, "每天击毙群友次数上限", 20);
    seal.ext.registerIntConfig(ext, "击毙群友冷却时间(毫秒)", 30000);

    // 每日重置任务
    seal.ext.registerTask(
        ext,
        "daily",
        "0:00",
        () => dailyReset(shootStorage),
        "SHOOT.每日重置",
        "每天零点重置今日数据"
    );

    // 用插件设置覆盖默认值
    shootLimit.cooldown = seal.ext.getIntConfig(ext, "击毙群友冷却时间(毫秒)");
    shootLimit.maxShootCount_today = seal.ext.getIntConfig(ext, "每天击毙群友次数上限");

    // 初始化存储
    let shootStorage = {};
    ext.storageGet("shootStorage", (val) => {
        if (val) {
            shootStorage = val;
        } else {
            shootStorage = {};
            ext.storageSet("shootStorage", shootStorage);
        }
    });

    // 主命令：击毙群友
    const cmdShoot = seal.ext.newCmdItemInfo();
    cmdShoot.name = 'shoot';
    cmdShoot.help = '使用指令：击毙群友@某人 | .击毙群友 help';
    cmdShoot.allowDelegate = true;
    cmdShoot.solve = (ctx, msg, cmdArgs) => {
        // 处理help指令
        if (cmdArgs.getArgN(1) === 'help') {
            const helpText = `🔫 击毙群友插件 v1.1.0

主要命令：
• 击毙群友@某人 - 对目标进行攻击
• 击毙@某人 - 同上
• shootplus help - 查看扩展命令

扩展命令 (使用 shootplus 或 击毙扩展)：
• 强化武器 - 随机提升或降低武器威力
• 排行榜 今日击毙 - 今日击毙次数排行
• 排行榜 今日伤害 - 今日造成伤害排行
• 排行榜 总击毙 - 总击毙次数排行
• 排行榜 总伤害 - 总造成伤害排行
• 排行榜 今日承伤 - 今日承受伤害排行  
• 排行榜 总承伤 - 总承受伤害排行

每日限制：${shootLimit.maxShootCount_today}次击毙
冷却时间：${shootLimit.cooldown/1000}秒
KO状态：被击毙${shootLimit.beKOd}次后进入昏迷状态`;
            seal.replyToSender(ctx, msg, helpText);
            return;
        }

        ctx.delegateText = "";
        try {
            const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
            const userId = ctx.player.userId.replace(/\D/g, '');
            const targetUserId = mctx.player.userId.replace(/\D/g, '');

            // 禁止自残
            if (targetUserId === userId) {
                seal.replyToSender(ctx, msg, shootNotice.noSelfShoot);
                return;
            }

            let tmpUser = shootStorage[userId];
            let tmpTargetUser = shootStorage[targetUserId];

            // 初始化攻击者数据
            if (!tmpUser || !tmpUser.shootTime_first) {
                const defaultShootStorage = {
                    shootTime_first: Date.now(), // 第一次击毙时间
                    shootTime_last_total: 0, // 上一次击毙时间
                    shootTime_last_today: 0, // 今天上一次击毙时间
                    shootCount_total: 0, // 总击毙次数
                    shootCount_today: 0, // 今日击毙次数
                    shootDamage_total: 0, // 总造成伤害
                    shootDamage_today: 0, // 今日造成伤害
                    weapon_power: 10 // 武器威力
                };
                mergeUserData(shootStorage, ctx, defaultShootStorage);
            }

            // 初始化被攻击者数据
            if (!tmpTargetUser || !tmpTargetUser.beShotTime_first) {
                const defaultBeShotStorage = {
                    beShotTime_first: Date.now(), // 第一次被击毙时间
                    beShotTime_last_total: 0, // 上一次被击毙时间
                    beShotTime_last_today: 0, // 今天上一次被击毙时间
                    beShotCount_total: 0, // 总被击毙次数
                    beShotCount_today: 0, // 今日被击毙次数
                    beShotDamage_total: 0, // 总受到伤害
                    beShotDamage_today: 0, // 今日受到伤害
                    isKO: false // 是否被击毙到昏迷
                };
                mergeUserData(shootStorage, mctx, defaultBeShotStorage);
            }

            // 检查冷却时间
            if (Date.now() - shootStorage[userId].shootTime_last_total < shootLimit.cooldown) {
                seal.replyToSender(ctx, msg, shootNotice.cooldown);
                return;
            }

            // 检查今日击毙次数
            if (shootStorage[userId].shootCount_today >= shootLimit.maxShootCount_today) {
                seal.replyToSender(ctx, msg, `你今天已经击毙了 ${shootStorage[userId].shootCount_today} 次群友，枪管都烧红了！`);
                return;
            }

            // 随机生成伤害量
            let damage = doRandom(shootLimit.minDamage, shootLimit.maxDamage);

            // 更新数据
            tmpUser = shootStorage[userId];
            tmpTargetUser = shootStorage[targetUserId];
            // 攻击者
            tmpUser.shootTime_last_total = Date.now();
            tmpUser.shootTime_last_today = Date.now();
            tmpUser.shootCount_total += 1;
            tmpUser.shootCount_today += 1;
            tmpUser.shootDamage_total += damage;
            tmpUser.shootDamage_today += damage;
            // 被攻击者
            tmpTargetUser.beShotTime_last_total = Date.now();
            tmpTargetUser.beShotTime_last_today = Date.now();
            tmpTargetUser.beShotCount_total += 1;
            tmpTargetUser.beShotCount_today += 1;
            tmpTargetUser.beShotDamage_total += damage;
            tmpTargetUser.beShotDamage_today += damage;
            tmpTargetUser.isKO = (tmpTargetUser.beShotCount_today >= shootLimit.beKOd);

            let reply = "";
            if (tmpTargetUser.isKO) {
                const koKeys = Object.keys(shootNotice.KOFight);
                const randomKey = koKeys[Math.floor(Math.random() * koKeys.length)];
                let extraDamage = doRandom(50, 200); // KO状态额外伤害
                reply += shootNotice.KOFight[randomKey](targetUserId);
                tmpUser.shootDamage_total += extraDamage;
                tmpUser.shootDamage_today += extraDamage;
                tmpTargetUser.beShotDamage_total += extraDamage;
                tmpTargetUser.beShotDamage_today += extraDamage;
            } else {
                reply += `你用${getDescription(weaponStage, tmpUser.weapon_power)}武器击毙了 [CQ:at,qq=${targetUserId}]，造成 ${damage}点伤害！`;
                if (tmpTargetUser.beShotCount_today === 1) reply += `\n💥你拿下了 [CQ:at,qq=${targetUserId}] 今日首杀！`;
            }
            reply += `\n[CQ:image,url=http://q.qlogo.cn/headimg_dl?dst_uin=${targetUserId}&spec=640&img_type=jpg,c=3]`;
            reply += `\nTA的身上累积了 ${tmpTargetUser.beShotDamage_today}点伤害，状态${getDescription(injuryStage, tmpTargetUser.beShotDamage_today)}！`;
            reply += `\n今天你已经击毙了 ${tmpUser.shootCount_today} 次群友！`;
            if (tmpTargetUser.isKO) reply += `\n由于过度击毙，[CQ:at,qq=${targetUserId}] 已经被打到昏迷！面对倒地的群友，你的选择是……`;

            ext.storageSet("shootStorage", shootStorage);
            seal.replyToSender(ctx, msg, reply);
        } catch (e) {
            console.error("[SHOOT]", e.message);
        }
    };

    // 扩展命令：shootplus
    const cmdShootPlus = seal.ext.newCmdItemInfo();
    cmdShootPlus.name = 'shootplus';
    cmdShootPlus.help = '击毙群友扩展命令，使用 .shootplus help 查看详细帮助';
    cmdShootPlus.solve = (ctx, msg, cmdArgs) => {
        const firstArg = cmdArgs.getArgN(1);
        
        // 处理help指令
        if (firstArg === 'help') {
            const helpText = `🔫 击毙群友扩展命令 v1.1.0

可用命令：
• 强化武器 - 随机提升或降低武器威力（±10点）
• 排行榜 今日击毙 - 今日击毙次数排行榜
• 排行榜 今日伤害 - 今日造成伤害排行榜  
• 排行榜 总击毙 - 总击毙次数排行榜
• 排行榜 总伤害 - 总造成伤害排行榜
• 排行榜 今日承伤 - 今日承受伤害排行榜
• 排行榜 总承伤 - 总承受伤害排行榜

用法示例：
• .shootplus 强化武器
• .shootplus 排行榜 今日击毙`;
            seal.replyToSender(ctx, msg, helpText);
            return;
        }

        switch (firstArg) {
            case '强化武器':
                const userId = ctx.player.userId.replace(/\D/g, '');
                if (!shootStorage[userId]) {
                    seal.replyToSender(ctx, msg, "请先使用一次击毙命令来初始化你的数据！");
                    return;
                }

                let powerUp = doRandom(-10, 10);
                let replyText = "";
                
                if (powerUp > 0) {
                    // 强化成功
                    replyText = getRandomText(shootNotice.weaponUpgrade.success);
                    replyText += `\n你的武器威力提升了 ${powerUp}点！`;
                } else if (powerUp < 0) {
                    // 强化失败
                    replyText = getRandomText(shootNotice.weaponUpgrade.fail);
                    replyText += `\n你的武器威力下降了 ${Math.abs(powerUp)}点！`;
                } else {
                    // 无变化
                    replyText = getRandomText(shootNotice.weaponUpgrade.neutral);
                    replyText += `\n武器威力没有变化。`;
                }

                // 更新武器威力
                shootStorage[userId].weapon_power += powerUp;
                // 确保武器威力不会低于最小值
                if (shootStorage[userId].weapon_power < 1) {
                    shootStorage[userId].weapon_power = 1;
                }
                
                replyText += `\n当前武器威力：${shootStorage[userId].weapon_power.toFixed(2)}点`;
                replyText += `\n武器等级：${getDescription(weaponStage, shootStorage[userId].weapon_power)}`;
                
                ext.storageSet("shootStorage", shootStorage);
                seal.replyToSender(ctx, msg, replyText);
                return;

            case '排行榜':
                switch (cmdArgs.getArgN(2)) {
                    case '今日击毙':
                        const todayShootRank = generateRanking(shootStorage, 'shootCount_today', '今日击毙排行榜', '击毙次数', ctx);
                        seal.replyToSender(ctx, msg, todayShootRank);
                        return;

                    case '今日伤害':
                        const todayDamageRank = generateRanking(shootStorage, 'shootDamage_today', '今日伤害排行榜', '伤害量', ctx);
                        seal.replyToSender(ctx, msg, todayDamageRank);
                        return;

                    case '总击毙':
                        const totalShootRank = generateRanking(shootStorage, 'shootCount_total', '总击毙排行榜', '击毙次数', ctx);
                        seal.replyToSender(ctx, msg, totalShootRank);
                        return;

                    case '总伤害':
                        const totalDamageRank = generateRanking(shootStorage, 'shootDamage_total', '总伤害排行榜', '伤害量', ctx);
                        seal.replyToSender(ctx, msg, totalDamageRank);
                        return;

                    case '今日承伤':
                        const todayBeShotRank = generateRanking(shootStorage, 'beShotDamage_today', '今日承伤排行榜', '承受伤害', ctx);
                        seal.replyToSender(ctx, msg, todayBeShotRank);
                        return;

                    case '总承伤':
                        const totalBeShotRank = generateRanking(shootStorage, 'beShotDamage_total', '总承伤排行榜', '承受伤害', ctx);
                        seal.replyToSender(ctx, msg, totalBeShotRank);
                        return;

                    default:
                        const helpText = `请指定排行榜类型：
- 今日击毙：今日击毙次数排行榜
- 今日伤害：今日造成伤害排行榜
- 总击毙：总击毙次数排行榜
- 总伤害：总造成伤害排行榜
- 今日承伤：今日承受伤害排行榜
- 总承伤：总承受伤害排行榜

用法：.shootplus 排行榜 [类型]`;
                        seal.replyToSender(ctx, msg, helpText);
                        return;
                }

            default:
                seal.replyToSender(ctx, msg, '未知命令，使用 .shootplus help 查看可用命令');
                return;
        }
    };

    // 注册命令
    ext.cmdMap['击毙群友'] = cmdShoot;
    ext.cmdMap['击毙'] = cmdShoot;
    ext.cmdMap['shoot'] = cmdShoot;
    ext.cmdMap['shootplus'] = cmdShootPlus;
    // 添加中文别名
    ext.cmdMap['击毙扩展'] = cmdShootPlus;

}
