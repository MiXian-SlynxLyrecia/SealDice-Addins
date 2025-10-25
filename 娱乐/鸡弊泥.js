// ==UserScript==
// @name         击毙群友
// @author       米线
// @version      2.1.0
// @Stage        窝要鸡弊泥门索有人Usage：击毙群友@xxx | .击毙群友 help
// @timestamp    0
// @license      MIT
// @homepageURL  https://github.com/
// @updateurl    https://example.com/击毙群友.js
// ==/UserScript==

// 配置项
const shootLimit = {
    minDamage: 10, // 最小伤害值
    maxDamage: 100, // 最大伤害值
    maxShootCount_today: 20, // 每日最大击毙次数
    beKOd: 5, // 被击毙多少次进入"KO"状态
    cooldown: 30000, // 击毙冷却时间 (ms)
    weaponUpgradeChance: 0.6, // 武器强化成功概率
    dailyReward: 100, // 每日登录奖励金币
    taskReward: 50 // 每个任务奖励金币
};

// 武器威力描述
const weaponStage = {
    Legendary: [90, "传说级"],
    Epic: [70, "史诗级"],
    Rare: [50, "稀有"],
    Common: [30, "普通"],
    Weak: [10, "微弱"],
    Garbage: [0, "小破枪"]
};

// 受伤状态描述
const injuryStage = {
    Critical: [1000, "重伤濒死"],
    Severe: [500, "严重受伤"],
    Moderate: [200, "伤痕累累"],
    Light: [50, "轻微擦伤"],
    Healthy: [0, "毫发无伤"]
};

// 道具系统 - 重新设计
const items = {
    // === 增益类道具 ===
    'damage_boost': {
        id: 'damage_boost',
        name: '伤害增幅器',
        description: '使用后1小时内攻击伤害提升50%',
        price: 300,
        type: 'buff',
        target: 'self',
        effect: (user, target) => {
            const expire = Date.now() + 60 * 60 * 1000; // 1小时
            return { 
                type: 'damage_boost', 
                value: 0.5, 
                expire: expire, 
                message: `💥 伤害增幅器激活！1小时内攻击伤害提升50%！` 
            };
        }
    },
    'crit_chance': {
        id: 'crit_chance',
        name: '暴击瞄准镜',
        description: '使用后30分钟内暴击率提升30%',
        price: 400,
        type: 'buff',
        target: 'self',
        effect: (user, target) => {
            const expire = Date.now() + 30 * 60 * 1000; // 30分钟
            return { 
                type: 'crit_chance', 
                value: 0.3, 
                expire: expire, 
                message: `🎯 暴击瞄准镜激活！30分钟内暴击率提升30%！` 
            };
        }
    },
    'gold_boost': {
        id: 'gold_boost',
        name: '金币增幅器',
        description: '使用后2小时内获得金币翻倍',
        price: 500,
        type: 'buff',
        target: 'self',
        effect: (user, target) => {
            const expire = Date.now() + 2 * 60 * 60 * 1000; // 2小时
            return { 
                type: 'gold_boost', 
                value: 2, 
                expire: expire, 
                message: `💰 金币增幅器激活！2小时内获得金币翻倍！` 
            };
        }
    },
    'cooldown_reducer': {
        id: 'cooldown_reducer',
        name: '冷却加速器',
        description: '使用后24小时内击毙冷却时间减少50%',
        price: 350,
        type: 'buff',
        target: 'self',
        effect: (user, target) => {
            const expire = Date.now() + 24 * 60 * 60 * 1000; // 24小时
            return { 
                type: 'cooldown_reducer', 
                value: 0.5, 
                expire: expire, 
                message: `⚡ 冷却加速器激活！24小时内击毙冷却时间减少50%！` 
            };
        }
    },

    // === 减益类道具 ===
    'damage_debuff': {
        id: 'damage_debuff',
        name: '虚弱子弹',
        description: '对目标使用，使其1小时内攻击伤害降低40%',
        price: 250,
        type: 'debuff',
        target: 'other',
        effect: (user, target) => {
            const expire = Date.now() + 60 * 60 * 1000; // 1小时
            return { 
                type: 'damage_debuff', 
                value: -0.4, 
                expire: expire, 
                message: `😵 虚弱子弹命中！1小时内攻击伤害降低40%！` 
            };
        }
    },
    'defense_break': {
        id: 'defense_break',
        name: '破甲弹',
        description: '对目标使用，使其30分钟内防御降低50%',
        price: 300,
        type: 'debuff',
        target: 'other',
        effect: (user, target) => {
            const expire = Date.now() + 30 * 60 * 1000; // 30分钟
            return { 
                type: 'defense_break', 
                value: -0.5, 
                expire: expire, 
                message: `🛡️ 破甲弹命中！30分钟内防御降低50%！` 
            };
        }
    },
    'confusion_grenade': {
        id: 'confusion_grenade',
        name: '混乱手雷',
        description: '对目标使用，使其1小时内暴击率降低25%',
        price: 200,
        type: 'debuff',
        target: 'other',
        effect: (user, target) => {
            const expire = Date.now() + 60 * 60 * 1000; // 1小时
            return { 
                type: 'confusion', 
                value: -0.25, 
                expire: expire, 
                message: `🌀 混乱手雷爆炸！1小时内暴击率降低25%！` 
            };
        }
    },

    // === 恢复类道具 ===
    'first_aid': {
        id: 'first_aid',
        name: '急救包',
        description: '立即恢复300点生命值',
        price: 200,
        type: 'recovery',
        target: 'self',
        effect: (user, target) => {
            const healAmount = 300;
            return { 
                type: 'heal', 
                value: healAmount, 
                message: `💊 使用急救包，恢复${healAmount}点生命值！` 
            };
        }
    },
    'revive_token': {
        id: 'revive_token',
        name: '复活令牌',
        description: '立即从KO状态恢复，并恢复200点生命值',
        price: 400,
        type: 'recovery',
        target: 'self',
        effect: (user, target) => {
            const healAmount = 200;
            return { 
                type: 'revive', 
                value: healAmount, 
                message: `✨ 复活令牌激活！从KO状态恢复，并恢复${healAmount}点生命值！` 
            };
        }
    },
    'full_heal': {
        id: 'full_heal',
        name: '全面治疗',
        description: '立即恢复所有生命值并清除所有减益效果',
        price: 600,
        type: 'recovery',
        target: 'self',
        effect: (user, target) => {
            return { 
                type: 'full_heal', 
                value: 0, 
                message: `🌟 全面治疗完成！生命值完全恢复，所有减益效果清除！` 
            };
        }
    },

    // === 豁免类道具 ===
    'damage_immunity': {
        id: 'damage_immunity',
        name: '伤害免疫',
        description: '使用后1次攻击完全免疫伤害',
        price: 450,
        type: 'immunity',
        target: 'self',
        effect: (user, target) => {
            return { 
                type: 'damage_immunity', 
                value: 1, // 免疫次数
                message: `🛡️ 伤害免疫激活！下一次攻击将完全免疫伤害！` 
            };
        }
    },
    'ko_protection': {
        id: 'ko_protection',
        name: 'KO保护',
        description: '使用后3次被击毙不会进入KO状态',
        price: 500,
        type: 'immunity',
        target: 'self',
        effect: (user, target) => {
            return { 
                type: 'ko_protection', 
                value: 3, // 保护次数
                message: `💫 KO保护激活！接下来3次被击毙不会进入KO状态！` 
            };
        }
    },
    'debuff_cleanse': {
        id: 'debuff_cleanse',
        name: '净化药剂',
        description: '清除自身所有减益效果',
        price: 300,
        type: 'immunity',
        target: 'self',
        effect: (user, target) => {
            return { 
                type: 'debuff_cleanse', 
                value: 0, 
                message: `💧 净化药剂生效！所有减益效果已被清除！` 
            };
        }
    },

    // === 特殊类道具 ===
    'stealth_cloak': {
        id: 'stealth_cloak',
        name: '隐身斗篷',
        description: '使用后30分钟内不会被其他人击毙',
        price: 700,
        type: 'special',
        target: 'self',
        effect: (user, target) => {
            const expire = Date.now() + 30 * 60 * 1000; // 30分钟
            return { 
                type: 'stealth', 
                value: 1, 
                expire: expire, 
                message: `👻 隐身斗篷激活！30分钟内不会被其他人击毙！` 
            };
        }
    },
    'bounty_hunter': {
        id: 'bounty_hunter',
        name: '赏金猎人',
        description: '对目标使用，击败该目标获得双倍金币奖励',
        price: 350,
        type: 'special',
        target: 'other',
        effect: (user, target) => {
            const expire = Date.now() + 60 * 60 * 1000; // 1小时
            return { 
                type: 'bounty', 
                value: 2, 
                expire: expire, 
                targetId: target.userId,
                message: `🎯 赏金标记已设置！1小时内击败 [CQ:at,qq=${target.userId}] 将获得双倍金币！` 
            };
        }
    }
};

// 商店系统
const shop = {
    // 增益类
    'damage_boost': items.damage_boost,
    'crit_chance': items.crit_chance,
    'gold_boost': items.gold_boost,
    'cooldown_reducer': items.cooldown_reducer,
    
    // 减益类
    'damage_debuff': items.damage_debuff,
    'defense_break': items.defense_break,
    'confusion_grenade': items.confusion_grenade,
    
    // 恢复类
    'first_aid': items.first_aid,
    'revive_token': items.revive_token,
    'full_heal': items.full_heal,
    
    // 豁免类
    'damage_immunity': items.damage_immunity,
    'ko_protection': items.ko_protection,
    'debuff_cleanse': items.debuff_cleanse,
    
    // 特殊类
    'stealth_cloak': items.stealth_cloak,
    'bounty_hunter': items.bounty_hunter,
    
    // 武器强化
    'weapon_upgrade': {
        name: '武器强化券',
        description: '随机提升武器威力2-8点',
        price: 150,
        type: 'upgrade'
    },
    
    // 幸运宝箱
    'lucky_box': {
        name: '幸运宝箱',
        description: '随机获得一件道具',
        price: 250,
        type: 'special'
    }
};

// 每日任务系统
const dailyTasks = {
    'shoot_5_times': {
        id: 'shoot_5_times',
        name: '火力全开',
        description: '今日击毙群友5次',
        condition: (user) => user.shootCount_today >= 5,
        reward: 100
    },
    'damage_1000': {
        id: 'damage_1000',
        name: '伤害达人',
        description: '今日累计造成1000点伤害',
        condition: (user) => user.shootDamage_today >= 1000,
        reward: 150
    },
    'use_buff': {
        id: 'use_buff',
        name: '增益大师',
        description: '今日使用任意增益道具1次',
        condition: (user) => user.buffsUsed_today >= 1,
        reward: 120
    },
    'use_debuff': {
        id: 'use_debuff',
        name: '战术专家',
        description: '今日使用任意减益道具1次',
        condition: (user) => user.debuffsUsed_today >= 1,
        reward: 130
    },
    'use_recovery': {
        id: 'use_recovery',
        name: '生存专家',
        description: '今日使用任意恢复道具1次',
        condition: (user) => user.recoveryUsed_today >= 1,
        reward: 110
    }
};

// 回复词
const shootNotice = {
    cooldown: "你的枪管还在冷却，暂时无法开火！",
    noSelfShoot: "你不能对着自己开枪！想不开去找心理医生！",
    KOFight: {
        1: (targetUserId) => `[CQ:at,qq=${targetUserId}] 已经被你击毙到昏迷，但你依然火力全开，子弹无情地倾泻，地面都被血染红了！`,
        2: (targetUserId) => `[CQ:at,qq=${targetUserId}] 在你的狂轰滥炸下已经失去意识，可你还是对着那颤抖的身躯疯狂扫射，空气中弥漫着火药味！`,
        3: (targetUserId) => `[CQ:at,qq=${targetUserId}] 在你无休止的射击下露出崩溃的表情，但你依然扣动扳机，子弹撕裂了最后一丝防线！`
    },
    weaponUpgrade: {
        success: (userId) => `武器大师精心打磨了你的枪械，威力大幅提升！`,
        fail: (userId) => `武器卡壳了！威力不升反降...`,
        neutral: (userId) => `你尝试强化武器，但似乎什么都没发生...`
    },
    KOWakeUp: {
        success: (userId) => `[CQ:at,qq=${userId}] 挣扎着从昏迷中清醒过来，身上还残留着硝烟味`,
        fail: (userId) => `[CQ:at,qq=${userId}] 试图站起来，但伤口的剧痛又让你倒了下去`,
        notKO: (userId) => `[CQ:at,qq=${userId}] 你现在很清醒，不需要恢复`
    },
    KOAction: "你已经被击毙昏迷了，先恢复意识再说吧",
    shop: {
        notEnoughGold: "金币不足，无法购买！",
        purchaseSuccess: (itemName) => `购买成功！获得 ${itemName}`,
        itemNotFound: "商品不存在！"
    },
    items: {
        notFound: "道具不存在！",
        noTarget: "请指定使用目标！",
        useSuccess: "道具使用成功！",
        notEnoughItems: "道具数量不足！",
        invalidTarget: "无效的目标！",
        stealthProtected: (targetUserId) => `[CQ:at,qq=${targetUserId}] 处于隐身状态，无法被击毙！`,
        damageImmune: (targetUserId) => `[CQ:at,qq=${targetUserId}] 免疫了这次伤害！`,
        koProtected: (targetUserId) => `[CQ:at,qq=${targetUserId}] 受到KO保护，没有进入昏迷状态！`
    },
    tasks: {
        alreadyCompleted: "该任务已完成！",
        notCompleted: "任务尚未完成！",
        claimSuccess: (taskName, reward) => `任务「${taskName}」完成！获得 ${reward}金币！`,
        noTasks: "今日没有可完成的任务"
    }
};

// 插件注册
let ext = seal.ext.find('击毙群友');
if (!ext) {
    /**
     * 初始化或更新用户数据
     */
    function mergeUserData(shootStorage, ctx, defaultData) {
        const userId = ctx.player.userId.replace(/\D/g, '');
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
     */
    function getDescription(obj, value) {
        const entries = Object.entries(obj).sort((a, b) => b[1][0] - a[1][0]);
        for (const [key, val] of entries) {
            if (value >= val[0]) {
                return val[1];
            }
        }
        return obj[Object.keys(obj)[Object.keys(obj).length - 1]][1];
    }

    /**
     * 生成随机数
     */
    function doRandom(min, max) {
        return Number((Math.random() * (max - min) + min).toFixed(2));
    }

    /**
     * 每日重置数据
     */
    function dailyReset(shootStorage) {
        for (const user in shootStorage) {
            const tmpUser = shootStorage[user];
            tmpUser.shootTime_last_today = 0;
            tmpUser.shootCount_today = 0;
            tmpUser.shootDamage_today = 0;
            tmpUser.beShotTime_last_today = 0;
            tmpUser.beShotCount_today = 0;
            tmpUser.beShotDamage_today = 0;
            tmpUser.isKO = false;
            tmpUser.weaponUpgrades_today = 0;
            tmpUser.buffsUsed_today = 0;
            tmpUser.debuffsUsed_today = 0;
            tmpUser.recoveryUsed_today = 0;
            tmpUser.dailyRewardClaimed = false;
            tmpUser.completedTasks = {};
            
            // 清理过期效果，但保留次数型效果
            if (tmpUser.activeEffects) {
                const now = Date.now();
                tmpUser.activeEffects = tmpUser.activeEffects.filter(effect => 
                    !effect.expire || effect.expire > now
                );
            }
        }
    }

    /**
     * 生成排行榜文本
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
     * 应用道具效果
     */
    function applyItemEffects(user, target, effects) {
        if (!user.activeEffects) user.activeEffects = [];
        
        const effect = {
            type: effects.type,
            value: effects.value,
            expire: effects.expire,
            targetId: effects.targetId
        };
        
        user.activeEffects.push(effect);
        
        // 特殊效果处理
        if (effects.type === 'heal') {
            user.beShotDamage_today = Math.max(0, user.beShotDamage_today - effects.value);
            user.beShotDamage_total = Math.max(0, user.beShotDamage_total - effects.value);
        }
        else if (effects.type === 'revive') {
            user.isKO = false;
            user.beShotDamage_today = Math.max(0, user.beShotDamage_today - effects.value);
            user.beShotDamage_total = Math.max(0, user.beShotDamage_total - effects.value);
        }
        else if (effects.type === 'full_heal') {
            user.beShotDamage_today = 0;
            user.beShotDamage_total = Math.max(0, user.beShotDamage_total - user.beShotDamage_today);
            // 清除减益效果
            user.activeEffects = user.activeEffects.filter(e => 
                !e.type.includes('debuff') && !e.type.includes('confusion')
            );
        }
        else if (effects.type === 'debuff_cleanse') {
            // 清除所有减益效果
            user.activeEffects = user.activeEffects.filter(e => 
                !e.type.includes('debuff') && !e.type.includes('confusion')
            );
        }
        
        // 对目标应用减益效果
        if (target && effects.type.includes('debuff')) {
            if (!target.activeEffects) target.activeEffects = [];
            target.activeEffects.push(effect);
        }
        
        return effects.message;
    }

    /**
     * 计算实际伤害（考虑道具效果）
     */
    function calculateActualDamage(attacker, target, baseDamage) {
        let actualDamage = baseDamage;
        let criticalHit = false;
        
        // 检查目标是否隐身
        if (target.activeEffects) {
            const stealthEffect = target.activeEffects.find(e => e.type === 'stealth');
            if (stealthEffect && stealthEffect.expire > Date.now()) {
                return { damage: 0, critical: false, immune: true, immuneType: 'stealth' };
            }
        }
        
        // 检查目标伤害免疫
        if (target.activeEffects) {
            const immunityEffect = target.activeEffects.find(e => e.type === 'damage_immunity');
            if (immunityEffect && immunityEffect.value > 0) {
                immunityEffect.value -= 1;
                if (immunityEffect.value <= 0) {
                    target.activeEffects = target.activeEffects.filter(e => e !== immunityEffect);
                }
                return { damage: 0, critical: false, immune: true, immuneType: 'damage_immunity' };
            }
        }
        
        // 攻击者增益效果
        if (attacker.activeEffects) {
            attacker.activeEffects.forEach(effect => {
                if (effect.type === 'damage_boost' && effect.expire > Date.now()) {
                    actualDamage *= (1 + effect.value);
                }
                if (effect.type === 'crit_chance' && effect.expire > Date.now()) {
                    if (Math.random() < effect.value) {
                        actualDamage *= 1.5; // 暴击伤害
                        criticalHit = true;
                    }
                }
            });
        }
        
        // 攻击者减益效果
        if (attacker.activeEffects) {
            attacker.activeEffects.forEach(effect => {
                if (effect.type === 'damage_debuff' && effect.expire > Date.now()) {
                    actualDamage *= (1 + effect.value); // value为负数
                }
            });
        }
        
        // 目标减伤效果
        let damageReduction = 0;
        if (target.activeEffects) {
            target.activeEffects.forEach(effect => {
                if (effect.type === 'defense_break' && effect.expire > Date.now()) {
                    damageReduction += effect.value; // value为负数，所以是减少防御
                }
            });
        }
        
        actualDamage *= (1 + damageReduction);
        
        return { 
            damage: Math.max(1, Math.round(actualDamage)), 
            critical: criticalHit,
            immune: false
        };
    }

    /**
     * 检查KO保护
     */
    function checkKOProtection(target) {
        if (target.activeEffects) {
            const koProtectionEffect = target.activeEffects.find(e => e.type === 'ko_protection');
            if (koProtectionEffect && koProtectionEffect.value > 0) {
                koProtectionEffect.value -= 1;
                if (koProtectionEffect.value <= 0) {
                    target.activeEffects = target.activeEffects.filter(e => e !== koProtectionEffect);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 获取当前金币收益倍数
     */
    function getGoldMultiplier(user, targetUserId) {
        let multiplier = 1;
        if (user.activeEffects) {
            user.activeEffects.forEach(effect => {
                if (effect.type === 'gold_boost' && effect.expire > Date.now()) {
                    multiplier = effect.value;
                }
                if (effect.type === 'bounty' && effect.expire > Date.now() && effect.targetId === targetUserId) {
                    multiplier *= effect.value;
                }
            });
        }
        return multiplier;
    }

    /**
     * 获取实际冷却时间
     */
    function getActualCooldown(user) {
        let cooldown = shootLimit.cooldown;
        if (user.activeEffects) {
            user.activeEffects.forEach(effect => {
                if (effect.type === 'cooldown_reducer' && effect.expire > Date.now()) {
                    cooldown *= (1 - effect.value);
                }
            });
        }
        return Math.max(5000, cooldown); // 最少5秒冷却
    }

    // 注册扩展
    ext = seal.ext.new('击毙群友', '米线', '2.1.0');
    seal.ext.register(ext);
    seal.ext.registerIntConfig(ext, "每天击毙群友次数上限", 20);
    seal.ext.registerIntConfig(ext, "击毙群友冷却时间(毫秒)", 30000);
    seal.ext.registerIntConfig(ext, "击晕需要次数", 5);
    seal.ext.registerIntConfig(ext, "最小伤害", 10);
    seal.ext.registerIntConfig(ext, "最大伤害", 100);
    seal.ext.registerFloatConfig(ext, "武器强化概率", 0.6);
    seal.ext.registerIntConfig(ext, "每日登录奖励", 100);
    seal.ext.registerIntConfig(ext, "任务奖励金币", 50);

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
    shootLimit.beKOd = seal.ext.getIntConfig(ext, "击晕需要次数");
    shootLimit.minDamage = seal.ext.getIntConfig(ext, "最小伤害");
    shootLimit.maxDamage = seal.ext.getIntConfig(ext, "最大伤害");
    shootLimit.weaponUpgradeChance = seal.ext.getFloatConfig(ext, "武器强化概率");
    shootLimit.dailyReward = seal.ext.getIntConfig(ext, "每日登录奖励");
    shootLimit.taskReward = seal.ext.getIntConfig(ext, "任务奖励金币");

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
    cmdShoot.help = `使用指令：.击毙群友@某人\n查看帮助：.击毙群友 help`;
    cmdShoot.allowDelegate = true;
    cmdShoot.solve = (ctx, msg, cmdArgs) => {
        ctx.delegateText = "";
        try {
            // 处理help命令
            if (cmdArgs.getArgN(1) === 'help') {
                const helpText = `🔫 击毙群友插件 v2.1.0\n` +
                    `主要命令：\n` +
                    `.击毙群友 @某人 - 击毙指定的群友\n` +
                    `.击毙 @某人 - 同上\n` +
                    `.shootplus 强化武器 - 随机改变武器威力\n` +
                    `.shootplus 恢复 - 尝试从KO状态中恢复\n` +
                    `.shootplus 排行榜 [类型] - 查看各种排行榜\n` +
                    `.shootplus 商店 - 查看商店\n` +
                    `.shootplus 购买 <道具名> - 购买道具\n` +
                    `.shootplus 我的道具 - 查看拥有的道具\n` +
                    `.shootplus 使用 <道具名> [目标] - 使用道具\n` +
                    `.shootplus 任务 - 查看每日任务\n` +
                    `.shootplus 领取奖励 - 领取每日登录奖励\n` +
                    `\n道具类型：\n` +
                    `- 增益类：提升自身能力\n` +
                    `- 减益类：削弱目标能力\n` +
                    `- 恢复类：治疗和复活\n` +
                    `- 豁免类：免疫伤害和效果\n` +
                    `- 特殊类：独特效果\n` +
                    `\n输入 .shootplus 商店 查看所有道具`;
                seal.replyToSender(ctx, msg, helpText);
                return;
            }

            const mctx = seal.getCtxProxyFirst(ctx, cmdArgs);
            const userId = ctx.player.userId.replace(/\D/g, '');
            const targetUserId = mctx.player.userId.replace(/\D/g, '');

            // 检查当前用户是否KO
            if (shootStorage[userId] && shootStorage[userId].isKO) {
                seal.replyToSender(ctx, msg, shootNotice.KOAction);
                return;
            }

            // 禁止自残
            if (targetUserId === userId) {
                seal.replyToSender(ctx, msg, shootNotice.noSelfShoot);
                return;
            }

            // 初始化 攻击者
            let tmpUser = shootStorage[userId];
            if (!tmpUser || !tmpUser.shootTime_first) {
                const defaultShootStorage = {
                    shootTime_first: Date.now(),
                    shootTime_last_total: 0,
                    shootTime_last_today: 0,
                    shootCount_total: 0,
                    shootCount_today: 0,
                    shootDamage_total: 0,
                    shootDamage_today: 0,
                    weapon_power: 10,
                    gold: 100, // 初始金币
                    items: {},
                    activeEffects: [],
                    weaponUpgrades_today: 0,
                    buffsUsed_today: 0,
                    debuffsUsed_today: 0,
                    recoveryUsed_today: 0,
                    dailyRewardClaimed: false,
                    completedTasks: {}
                };
                mergeUserData(shootStorage, ctx, defaultShootStorage);
                tmpUser = shootStorage[userId];
            }

            // 初始化 被攻击者
            let tmpTargetUser = shootStorage[targetUserId];
            if (!tmpTargetUser || !tmpTargetUser.beShotTime_first) {
                const defaultBeShotStorage = {
                    beShotTime_first: Date.now(),
                    beShotTime_last_total: 0,
                    beShotTime_last_today: 0,
                    beShotCount_total: 0,
                    beShotCount_today: 0,
                    beShotDamage_total: 0,
                    beShotDamage_today: 0,
                    isKO: false,
                    gold: 100,
                    items: {},
                    activeEffects: []
                };
                mergeUserData(shootStorage, mctx, defaultBeShotStorage);
                tmpTargetUser = shootStorage[targetUserId];
            }

            // 检查冷却时间
            const actualCooldown = getActualCooldown(tmpUser);
            if (Date.now() - tmpUser.shootTime_last_total < actualCooldown) {
                seal.replyToSender(ctx, msg, shootNotice.cooldown);
                return;
            }

            // 检查今日击毙次数
            if (tmpUser.shootCount_today >= shootLimit.maxShootCount_today) {
                seal.replyToSender(ctx, msg, `你今天已经击毙群友 ${tmpUser.shootCount_today} 次了，不要再开枪了。`);
                return;
            }

            // 计算基础伤害
            let baseDamage = doRandom(shootLimit.minDamage, shootLimit.maxDamage);
            const weaponMultiplier = 1 + (tmpUser.weapon_power / 100);
            baseDamage = Number((baseDamage * weaponMultiplier).toFixed(2));

            // 应用道具效果计算实际伤害
            const damageResult = calculateActualDamage(tmpUser, tmpTargetUser, baseDamage);

            // 处理免疫情况
            if (damageResult.immune) {
                if (damageResult.immuneType === 'stealth') {
                    seal.replyToSender(ctx, msg, shootNotice.items.stealthProtected(targetUserId));
                    return;
                } else if (damageResult.immuneType === 'damage_immunity') {
                    seal.replyToSender(ctx, msg, shootNotice.items.damageImmune(targetUserId));
                    // 免疫也算一次攻击，但不造成伤害
                    tmpUser.shootTime_last_total = Date.now();
                    tmpUser.shootTime_last_today = Date.now();
                    tmpUser.shootCount_total += 1;
                    tmpUser.shootCount_today += 1;
                    ext.storageSet("shootStorage", shootStorage);
                    return;
                }
            }

            const actualDamage = damageResult.damage;

            // 更新数据
            tmpUser.shootTime_last_total = Date.now();
            tmpUser.shootTime_last_today = Date.now();
            tmpUser.shootCount_total += 1;
            tmpUser.shootCount_today += 1;
            tmpUser.shootDamage_total += actualDamage;
            tmpUser.shootDamage_today += actualDamage;

            // 获得金币（基础10金币 + 伤害/10）
            const goldMultiplier = getGoldMultiplier(tmpUser, targetUserId);
            const goldEarned = Math.floor(10 + actualDamage / 10) * goldMultiplier;
            tmpUser.gold = (tmpUser.gold || 0) + goldEarned;

            tmpTargetUser.beShotTime_last_total = Date.now();
            tmpTargetUser.beShotTime_last_today = Date.now();
            tmpTargetUser.beShotCount_total += 1;
            tmpTargetUser.beShotCount_today += 1;
            tmpTargetUser.beShotDamage_total += actualDamage;
            tmpTargetUser.beShotDamage_today += actualDamage;
            
            // 检查KO保护
            const koProtected = checkKOProtection(tmpTargetUser);
            if (!koProtected) {
                tmpTargetUser.isKO = tmpTargetUser.beShotCount_today >= shootLimit.beKOd;
            }

            let reply = "";
            if (tmpTargetUser.isKO) {
                const koKeys = Object.keys(shootNotice.KOFight);
                const randomKey = koKeys[Math.floor(Math.random() * koKeys.length)];
                const extraDamage = doRandom(50, 200);
                reply += shootNotice.KOFight[randomKey](targetUserId);
                tmpUser.shootDamage_total += extraDamage;
                tmpUser.shootDamage_today += extraDamage;
                tmpTargetUser.beShotDamage_total += extraDamage;
                tmpTargetUser.beShotDamage_today += extraDamage;
            } else {
                reply += `你用${getDescription(weaponStage, tmpUser.weapon_power)}武器击毙了 [CQ:at,qq=${targetUserId}]，造成 ${actualDamage}点伤害${damageResult.critical ? '（暴击！）' : ''}！`;
                if (tmpTargetUser.beShotCount_today === 1) {
                    reply += `\n💥你拿下了 [CQ:at,qq=${targetUserId}] 今日首杀！`;
                }
                if (koProtected) {
                    reply += `\n${shootNotice.items.koProtected(targetUserId)}`;
                }
            }

            reply += `\n[CQ:image,url=http://q.qlogo.cn/headimg_dl?dst_uin=${targetUserId}&spec=640&img_type=jpg,c=3]`;
            reply += `\nTA的身上累积了 ${tmpTargetUser.beShotDamage_today.toFixed(2)}点伤害，状态${getDescription(injuryStage, tmpTargetUser.beShotDamage_today)}！`;
            reply += `\n💰 获得 ${goldEarned}金币（${goldMultiplier > 1 ? `x${goldMultiplier}倍奖励！` : ''}当前：${tmpUser.gold}金币）`;
            reply += `\n今天你已经击毙了 ${tmpUser.shootCount_today} 次群友！`;
            
            if (tmpTargetUser.isKO) {
                reply += `\n由于过度击毙，[CQ:at,qq=${targetUserId}] 已经被打到昏迷！面对倒地的群友，你的选择是……`;
            }

            ext.storageSet("shootStorage", shootStorage);
            seal.replyToSender(ctx, msg, reply);
        } catch (e) {
            console.error("[SHOOT] 错误:", e.message);
        }
    };

    // 扩展命令：shootplus
    const cmdShootPlus = seal.ext.newCmdItemInfo();
    cmdShootPlus.name = 'shootplus';
    cmdShootPlus.help = `=== 击毙群友 (拓展) ===\n此处为击毙群友的拓展命令\n`;
    cmdShootPlus.solve = (ctx, msg, cmdArgs) => {
        try {
            const userId = ctx.player.userId.replace(/\D/g, '');

            // 初始化用户数据
            if (!shootStorage[userId] || !shootStorage[userId].shootTime_first) {
                const defaultShootStorage = {
                    shootTime_first: Date.now(),
                    shootTime_last_total: 0,
                    shootTime_last_today: 0,
                    shootCount_total: 0,
                    shootCount_today: 0,
                    shootDamage_total: 0,
                    shootDamage_today: 0,
                    weapon_power: 10,
                    gold: 100,
                    items: {},
                    activeEffects: [],
                    weaponUpgrades_today: 0,
                    buffsUsed_today: 0,
                    debuffsUsed_today: 0,
                    recoveryUsed_today: 0,
                    dailyRewardClaimed: false,
                    completedTasks: {}
                };
                mergeUserData(shootStorage, ctx, defaultShootStorage);
            }

            const user = shootStorage[userId];

            switch (cmdArgs.getArgN(1)) {
                case '强化武器':
                    const upgrade = doRandom(2, 8);
                    user.weapon_power = Math.max(1, user.weapon_power + upgrade);
                    user.weaponUpgrades_today = (user.weaponUpgrades_today || 0) + 1;
                    seal.replyToSender(ctx, msg, `🔧 武器强化成功！武器威力提升了 ${upgrade}点！\n当前武器威力：${user.weapon_power.toFixed(2)}点`);
                    ext.storageSet("shootStorage", shootStorage);
                    return;

                case '恢复':
                    if (!user.isKO) {
                        seal.replyToSender(ctx, msg, shootNotice.KOWakeUp.notKO(userId));
                        return;
                    }
                    
                    if (Math.random() < shootLimit.weaponUpgradeChance) {
                        user.isKO = false;
                        seal.replyToSender(ctx, msg, shootNotice.KOWakeUp.success(userId));
                    } else {
                        seal.replyToSender(ctx, msg, shootNotice.KOWakeUp.fail(userId));
                    }
                    ext.storageSet("shootStorage", shootStorage);
                    return;

                case '商店':
                    let shopText = "🏪 击毙群友商店\n";
                    shopText += `你的金币：${user.gold}\n\n`;
                    
                    // 按类别显示商品
                    const categories = {
                        '增益类': ['damage_boost', 'crit_chance', 'gold_boost', 'cooldown_reducer'],
                        '减益类': ['damage_debuff', 'defense_break', 'confusion_grenade'],
                        '恢复类': ['first_aid', 'revive_token', 'full_heal'],
                        '豁免类': ['damage_immunity', 'ko_protection', 'debuff_cleanse'],
                        '特殊类': ['stealth_cloak', 'bounty_hunter'],
                        '其他': ['weapon_upgrade', 'lucky_box']
                    };
                    
                    Object.entries(categories).forEach(([category, itemIds]) => {
                        shopText += `【${category}】\n`;
                        itemIds.forEach(itemId => {
                            const item = shop[itemId];
                            if (item) {
                                shopText += `• ${item.name} - ${item.price}金币\n`;
                                shopText += `  📝 ${item.description}\n`;
                            }
                        });
                        shopText += '\n';
                    });
                    
                    shopText += "使用 .shootplus 购买 <道具名> 来购买道具";
                    seal.replyToSender(ctx, msg, shopText);
                    return;

                case '购买':
                    const itemName = cmdArgs.getArgN(2);
                    const shopItem = Object.values(shop).find(item => 
                        item.name === itemName || item.id === itemName
                    );
                    
                    if (!shopItem) {
                        seal.replyToSender(ctx, msg, shootNotice.shop.itemNotFound);
                        return;
                    }
                    
                    if (user.gold < shopItem.price) {
                        seal.replyToSender(ctx, msg, shootNotice.shop.notEnoughGold);
                        return;
                    }
                    
                    user.gold -= shopItem.price;
                    
                    // 处理特殊商品
                    if (shopItem.id === 'weapon_upgrade') {
                        const upgrade = doRandom(2, 8);
                        user.weapon_power += upgrade;
                        seal.replyToSender(ctx, msg, `购买成功！武器威力提升了 ${upgrade}点！`);
                    } else if (shopItem.id === 'lucky_box') {
                        const randomItems = Object.values(items);
                        const randomItem = randomItems[Math.floor(Math.random() * randomItems.length)];
                        user.items[randomItem.id] = (user.items[randomItem.id] || 0) + 1;
                        seal.replyToSender(ctx, msg, `🎁 幸运宝箱开启！获得 ${randomItem.name}！`);
                    } else {
                        // 普通道具
                        user.items[shopItem.id] = (user.items[shopItem.id] || 0) + 1;
                        seal.replyToSender(ctx, msg, shootNotice.shop.purchaseSuccess(shopItem.name));
                    }
                    
                    ext.storageSet("shootStorage", shootStorage);
                    return;

                case '我的道具':
                    if (!user.items || Object.keys(user.items).length === 0) {
                        seal.replyToSender(ctx, msg, "你的道具栏空空如也！");
                        return;
                    }
                    
                    let itemsText = "🎒 我的道具\n\n";
                    Object.entries(user.items).forEach(([itemId, count]) => {
                        const item = items[itemId];
                        if (item) {
                            itemsText += `• ${item.name} x${count}\n`;
                            itemsText += `  📝 ${item.description}\n`;
                            itemsText += `  🎯 目标：${item.target === 'self' ? '自己' : '他人'}\n\n`;
                        }
                    });
                    
                    // 显示当前生效的效果
                    if (user.activeEffects && user.activeEffects.length > 0) {
                        itemsText += "✨ 当前生效效果：\n";
                        user.activeEffects.forEach(effect => {
                            const now = Date.now();
                            if (!effect.expire || effect.expire > now) {
                                const item = Object.values(items).find(i => i.effect && i.effect().type === effect.type);
                                if (item) {
                                    const timeLeft = effect.expire ? `（剩余${Math.ceil((effect.expire - now) / 60000)}分钟）` : '';
                                    itemsText += `• ${item.name}${timeLeft}\n`;
                                }
                            }
                        });
                    }
                    
                    itemsText += "\n使用 .shootplus 使用 <道具名> [目标] 来使用道具";
                    seal.replyToSender(ctx, msg, itemsText);
                    return;

                case '使用':
                    const useItemName = cmdArgs.getArgN(2);
                    const targetId = cmdArgs.getArgN(3);
                    const useItem = Object.values(items).find(item => 
                        item.name === useItemName || item.id === useItemName
                    );
                    
                    if (!useItem) {
                        seal.replyToSender(ctx, msg, shootNotice.items.notFound);
                        return;
                    }
                    
                    if (!user.items || user.items[useItem.id] < 1) {
                        seal.replyToSender(ctx, msg, shootNotice.items.notEnoughItems);
                        return;
                    }
                    
                    // 检查目标
                    let targetUser = null;
                    if (useItem.target === 'other') {
                        if (!targetId) {
                            seal.replyToSender(ctx, msg, shootNotice.items.noTarget);
                            return;
                        }
                        targetUser = shootStorage[targetId];
                        if (!targetUser) {
                            seal.replyToSender(ctx, msg, shootNotice.items.invalidTarget);
                            return;
                        }
                    }
                    
                    // 使用道具
                    user.items[useItem.id] -= 1;
                    if (user.items[useItem.id] <= 0) {
                        delete user.items[useItem.id];
                    }
                    
                    // 更新使用统计
                    if (useItem.type === 'buff') {
                        user.buffsUsed_today = (user.buffsUsed_today || 0) + 1;
                    } else if (useItem.type === 'debuff') {
                        user.debuffsUsed_today = (user.debuffsUsed_today || 0) + 1;
                    } else if (useItem.type === 'recovery') {
                        user.recoveryUsed_today = (user.recoveryUsed_today || 0) + 1;
                    }
                    
                    const effects = useItem.effect(user, targetUser);
                    const resultMessage = applyItemEffects(user, targetUser, effects);
                    
                    seal.replyToSender(ctx, msg, `${shootNotice.items.useSuccess}\n${resultMessage}`);
                    ext.storageSet("shootStorage", shootStorage);
                    return;

                case '任务':
                    let tasksText = "📋 每日任务\n";
                    tasksText += `今日已完成任务：${Object.keys(user.completedTasks || {}).length}/${Object.keys(dailyTasks).length}\n\n`;
                    
                    Object.values(dailyTasks).forEach(task => {
                        const isCompleted = user.completedTasks && user.completedTasks[task.id];
                        const canComplete = task.condition(user) && !isCompleted;
                        
                        tasksText += `${isCompleted ? '✅' : canComplete ? '🎯' : '◻'} ${task.name}\n`;
                        tasksText += `   📝 ${task.description}\n`;
                        tasksText += `   💰 奖励：${task.reward}金币\n`;
                        
                        if (canComplete) {
                            tasksText += `   ⚡ 可领取！\n`;
                        }
                        tasksText += '\n';
                    });
                    
                    tasksText += "使用 .shootplus 领取奖励 来领取已完成任务的奖励";
                    seal.replyToSender(ctx, msg, tasksText);
                    return;

                case '领取奖励':
                    let totalReward = 0;
                    let claimedTasks = [];
                    
                    Object.values(dailyTasks).forEach(task => {
                        if (task.condition(user) && !(user.completedTasks && user.completedTasks[task.id])) {
                            totalReward += task.reward;
                            claimedTasks.push(task.name);
                            
                            if (!user.completedTasks) user.completedTasks = {};
                            user.completedTasks[task.id] = true;
                        }
                    });
                    
                    if (totalReward > 0) {
                        user.gold += totalReward;
                        seal.replyToSender(ctx, msg, `🎉 成功领取 ${claimedTasks.length} 个任务奖励！\n获得 ${totalReward}金币！\n当前金币：${user.gold}`);
                    } else {
                        seal.replyToSender(ctx, msg, "没有可领取的任务奖励！");
                    }
                    
                    // 每日登录奖励
                    if (!user.dailyRewardClaimed) {
                        user.gold += shootLimit.dailyReward;
                        user.dailyRewardClaimed = true;
                        seal.replyToSender(ctx, msg, `🎁 每日登录奖励！获得 ${shootLimit.dailyReward}金币！`);
                    }
                    
                    ext.storageSet("shootStorage", shootStorage);
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
                        case '今日武器威力':
                            const todayWeaponRank = generateRanking(shootStorage, 'weapon_power', '今日武器威力排行榜', '武器威力', ctx);
                            seal.replyToSender(ctx, msg, todayWeaponRank);
                            return;
                        case '总击毙':
                            const totalShootRank = generateRanking(shootStorage, 'shootCount_total', '总击毙排行榜', '击毙次数', ctx);
                            seal.replyToSender(ctx, msg, totalShootRank);
                            return;
                        case '总伤害':
                            const totalDamageRank = generateRanking(shootStorage, 'shootDamage_total', '总伤害排行榜', '伤害量', ctx);
                            seal.replyToSender(ctx, msg, totalDamageRank);
                            return;
                        case '总武器威力':
                            const totalWeaponRank = generateRanking(shootStorage, 'weapon_power', '总武器威力排行榜', '武器威力', ctx);
                            seal.replyToSender(ctx, msg, totalWeaponRank);
                            return;
                        default:
                            const helpText = `请指定排行榜类型：\n` +
                                `- 今日击毙：今日击毙次数排行榜\n` +
                                `- 今日伤害：今日造成伤害排行榜\n` +
                                `- 今日武器威力：今日武器威力排行榜\n` +
                                `- 总击毙：总击毙次数排行榜\n` +
                                `- 总伤害：总造成伤害排行榜\n` +
                                `- 总武器威力：总武器威力排行榜\n` +
                                `用法：.shootplus 排行榜 [类型]`;
                            seal.replyToSender(ctx, msg, helpText);
                            return;
                    }

                default:
                    const defaultHelp = `🔫 击毙群友拓展命令 v2.1.0\n` +
                        `可用命令：\n` +
                        `.shootplus 强化武器 - 随机改变武器威力\n` +
                        `.shootplus 恢复 - 尝试从KO状态中恢复\n` +
                        `.shootplus 排行榜 [类型] - 查看各种排行榜\n` +
                        `.shootplus 商店 - 查看商店\n` +
                        `.shootplus 购买 <道具名> - 购买道具\n` +
                        `.shootplus 我的道具 - 查看拥有的道具\n` +
                        `.shootplus 使用 <道具名> [目标] - 使用道具\n` +
                        `.shootplus 任务 - 查看每日任务\n` +
                        `.shootplus 领取奖励 - 领取任务奖励\n` +
                        `输入 .击毙群友 help 查看完整帮助`;
                    seal.replyToSender(ctx, msg, defaultHelp);
                    return;
            }
        } catch (e) {
            console.error("[SHOOTPLUS] 错误:", e.message);
        }
    };

    // 注册命令
    ext.cmdMap['击毙群友'] = cmdShoot;
    ext.cmdMap['击毙'] = cmdShoot;
    ext.cmdMap['shoot'] = cmdShoot;
    ext.cmdMap['shootplus'] = cmdShootPlus;
    ext.cmdMap['击毙扩展'] = cmdShootPlus;
}
