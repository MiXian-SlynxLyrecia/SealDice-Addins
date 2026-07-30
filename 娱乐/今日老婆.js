// ==UserScript==
// @name         今日老婆
// @author       米线
// @version      1.2.3
// @description  脑婆我喜欢你喵！|随机抽取发过言的群友作为自己的老婆，使用.今日老婆help获取帮助文本
// @license      MIT
// ==/UserScript==

if (!seal.ext.find('TodayWife')) {
    const ext = seal.ext.new('TodayWife', '米线', '1.2.3');
    seal.ext.register(ext);

    // ---------- 数据缓存 ----------
    const groupData = {};

    function getGroupData(groupId) {
        if (!groupData[groupId]) {
            try {
                const raw = ext.storageGet(groupId) || '{}';
                const parsed = JSON.parse(raw);
                groupData[groupId] = {
                    userRecords: parsed.userRecords || [],
                    dailyMap: parsed.dailyMap || {},
                    marriageMap: parsed.marriageMap || {},
                    blacklists: parsed.blacklists || []
                };
            } catch (e) {
                groupData[groupId] = { userRecords: [], dailyMap: {}, marriageMap: {}, blacklists: [] };
            }
        }
        return groupData[groupId];
    }

    function saveGroupData(groupId) {
        try {
            ext.storageSet(groupId, JSON.stringify(groupData[groupId]));
        } catch (e) {
            console.error('[今日老婆] 保存失败', e);
        }
    }

    // ---------- 工具 ----------
    const extractPureId = (userId) => {
        const match = userId.match(/(\d+)/);
        return match ? match[1] : userId;
    };

    function getToday() {
        return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).split(' ')[0];
    }

    function isMarriedToday(groupId, qq, today) {
        const marriages = groupData[groupId].marriageMap[today];
        if (!marriages) return false;
        if (marriages[qq]) return true;
        return Object.values(marriages).includes(qq);
    }

    function getSpouseInfo(groupId, qq, today) {
        const marriages = groupData[groupId].marriageMap[today];
        if (!marriages) return null;
        if (marriages[qq]) {
            return { role: '新郎', spouse: marriages[qq] };
        }
        for (let groom in marriages) {
            if (marriages[groom] === qq) {
                return { role: '新娘', spouse: groom };
            }
        }
        return null;
    }

    // ---------- 核心抽取逻辑 ----------
    function drawWife(groupId, senderId, today) {
        const data = getGroupData(groupId);
        if (!data.dailyMap[today]) data.dailyMap[today] = {};

        // 检查今天是否已抽过（自己只能抽一次）
        if (data.dailyMap[today][senderId]) {
            const previousId = data.dailyMap[today][senderId];
            const prevUser = data.userRecords.find(u => u.qqNumber === previousId);
            const name = prevUser ? prevUser.nickname : previousId;
            return { success: false, message: `你今天的老婆是 ${name}（${previousId}），不要移情别恋这么快啦` };
        }

        // 构建候选池：排除自己、已婚者、黑名单
        let candidates = data.userRecords.filter(u => {
            if (u.qqNumber === senderId) return false;
            if (isMarriedToday(groupId, u.qqNumber, today)) return false;
            if (data.blacklists.includes(u.qqNumber)) return false;
            return true;
        });

        if (candidates.length === 0) {
            return { success: false, message: '没有可以抽取的对象，可能群友被抽完了喵' };
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        data.dailyMap[today][senderId] = selected.qqNumber;
        saveGroupData(groupId);

        const atSender = `[CQ:at,qq=${senderId}] `;
        const avatar = `[CQ:image,file=https://q2.qlogo.cn/headimg_dl?dst_uin=${selected.qqNumber}&spec=5,cache=0]`;
        const reply = `${atSender}\n${avatar}\n今日老婆：${selected.nickname}（${selected.qqNumber}）`;
        return { success: true, message: reply, selected: selected };
    }

    // ---------- 监听非命令消息，收集群员 ----------
    ext.onNotCommandReceived = (ctx, msg) => {
        if (msg.messageType !== 'group') return;
        const groupId = msg.groupId;
        const pureId = extractPureId(msg.sender.userId);
        const nickname = msg.sender.nickname;

        const data = getGroupData(groupId);
        const exist = data.userRecords.find(u => u.qqNumber === pureId);
        if (exist) {
            if (exist.nickname !== nickname) {
                exist.nickname = nickname;
                saveGroupData(groupId);
            }
        } else {
            data.userRecords.push({ qqNumber: pureId, nickname });
            saveGroupData(groupId);
        }
    };

    // ---------- 命令 ----------
    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = '今日老婆';
    cmd.help = `今日老婆插件使用帮助：
  .今日老婆                    随机抽取一位群友（每天每人限一次）
  .结婚                        与今日抽到的老婆结婚（双方需未婚）
  .换老婆                      重新抽取一位老婆（仅限未婚状态）
  .离婚                        解除今日婚姻关系（已婚者使用）
  .今日老婆 黑名单 添加/移除 QQ号  管理黑名单（管理员）
  .今日老婆 移除成员 QQ号       从抽取池中删除指定用户（管理员）
  .今日老婆 help               显示本帮助

所有指令支持全角句号“。”开头。`;
    cmd.solve = (ctx, msg, cmdArgs) => {
        ctx.delegateText = "";

        const groupId = msg.groupId;
        const senderId = extractPureId(msg.sender.userId);
        const today = getToday();
        const data = getGroupData(groupId);

        const rawMsg = msg.message.trim();
        const isMarry = rawMsg.startsWith('.结婚') || rawMsg.startsWith('。结婚');
        const isChange = rawMsg.startsWith('.换老婆') || rawMsg.startsWith('。换老婆');
        const isDivorce = rawMsg.startsWith('.离婚') || rawMsg.startsWith('。离婚');

        const subCmd = cmdArgs.getArgN(1);

        // ---------- help 子命令 ----------
        if (subCmd === 'help') {
            seal.replyToSender(ctx, msg, cmd.help);
            return seal.ext.newCmdExecuteResult(true);
        }

        // ---------- 管理员命令：移除成员 ----------
        if (subCmd === '移除成员') {
            if (ctx.privilegeLevel < 50) {
                seal.replyToSender(ctx, msg, '只有管理员才能移除成员');
                return seal.ext.newCmdExecuteResult(true);
            }
            const targetId = extractPureId(cmdArgs.getArgN(2));
            if (!targetId) {
                seal.replyToSender(ctx, msg, '请提供要移除的QQ号');
                return seal.ext.newCmdExecuteResult(true);
            }
            const index = data.userRecords.findIndex(u => u.qqNumber === targetId);
            if (index === -1) {
                seal.replyToSender(ctx, msg, `未找到 QQ ${targetId} 的成员记录`);
                return seal.ext.newCmdExecuteResult(true);
            }
            data.userRecords.splice(index, 1);
            saveGroupData(groupId);
            seal.replyToSender(ctx, msg, `已将 QQ ${targetId} 从抽取池中移除`);
            return seal.ext.newCmdExecuteResult(true);
        }

        // ---------- 管理员命令：黑名单管理 ----------
        if (subCmd === '黑名单') {
            if (ctx.privilegeLevel < 50) {
                seal.replyToSender(ctx, msg, '只有管理员才能管理黑名单哦');
                return seal.ext.newCmdExecuteResult(true);
            }
            const action = cmdArgs.getArgN(2);
            const targetId = extractPureId(cmdArgs.getArgN(3));
            if (!targetId) {
                seal.replyToSender(ctx, msg, '请提供要操作的QQ号');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (action === '添加') {
                if (!data.blacklists.includes(targetId)) {
                    data.blacklists.push(targetId);
                    saveGroupData(groupId);
                    seal.replyToSender(ctx, msg, `已将 ${targetId} 加入黑名单`);
                } else {
                    seal.replyToSender(ctx, msg, `${targetId} 已经在黑名单中`);
                }
            } else if (action === '移除') {
                const idx = data.blacklists.indexOf(targetId);
                if (idx !== -1) {
                    data.blacklists.splice(idx, 1);
                    saveGroupData(groupId);
                    seal.replyToSender(ctx, msg, `已将 ${targetId} 移出黑名单`);
                } else {
                    seal.replyToSender(ctx, msg, `${targetId} 不在黑名单中`);
                }
            } else {
                seal.replyToSender(ctx, msg, '用法：.今日老婆 黑名单 添加/移除 QQ号');
            }
            return seal.ext.newCmdExecuteResult(true);
        }

        // ---------- 离婚 ----------
        if (isDivorce) {
            if (!isMarriedToday(groupId, senderId, today)) {
                seal.replyToSender(ctx, msg, '你今天还没结婚呢，离什么婚～');
                return seal.ext.newCmdExecuteResult(true);
            }
            const spouseInfo = getSpouseInfo(groupId, senderId, today);
            if (!spouseInfo) {
                seal.replyToSender(ctx, msg, '数据异常，找不到配偶');
                return seal.ext.newCmdExecuteResult(true);
            }
            const marriages = data.marriageMap[today];
            if (spouseInfo.role === '新郎') {
                delete marriages[senderId];
            } else {
                for (let groom in marriages) {
                    if (marriages[groom] === senderId) {
                        delete marriages[groom];
                        break;
                    }
                }
            }
            saveGroupData(groupId);
            seal.replyToSender(ctx, msg, `💔 离婚成功，恢复单身。祝各自安好。`);
            return seal.ext.newCmdExecuteResult(true);
        }

        // ---------- 结婚 ----------
        if (isMarry) {
            if (isMarriedToday(groupId, senderId, today)) {
                seal.replyToSender(ctx, msg, '你已经结婚了，不能再次结婚！');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (data.blacklists.includes(senderId)) {
                seal.replyToSender(ctx, msg, '你被列入黑名单，无法结婚。');
                return seal.ext.newCmdExecuteResult(true);
            }
            const wifeId = data.dailyMap[today]?.[senderId];
            if (!wifeId) {
                seal.replyToSender(ctx, msg, '你还没有抽取今日老婆，请先使用 .今日老婆');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (data.blacklists.includes(wifeId)) {
                seal.replyToSender(ctx, msg, '你抽到的老婆在黑名单中，无法结婚。');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (isMarriedToday(groupId, wifeId, today)) {
                seal.replyToSender(ctx, msg, '你抽到的老婆已经和别人结婚了……');
                return seal.ext.newCmdExecuteResult(true);
            }
            const groomUser = data.userRecords.find(u => u.qqNumber === senderId);
            const brideUser = data.userRecords.find(u => u.qqNumber === wifeId);
            const groomName = groomUser ? groomUser.nickname : senderId;
            const brideName = brideUser ? brideUser.nickname : wifeId;

            if (!data.marriageMap[today]) data.marriageMap[today] = {};
            data.marriageMap[today][senderId] = wifeId;
            saveGroupData(groupId);

            const weddingMessages = [
                '💒 恭喜你们结为夫妻，愿爱情长存！',
                '🌹 两颗心从此紧紧相连，祝福你们！',
                '💍 善良且可爱的骰娘为你们见证，幸福美满！'
            ];
            const msgText = weddingMessages[Math.floor(Math.random() * weddingMessages.length)];
            const avatar1 = `[CQ:image,file=https://q2.qlogo.cn/headimg_dl?dst_uin=${senderId}&spec=5,cache=0]`;
            const avatar2 = `[CQ:image,file=https://q2.qlogo.cn/headimg_dl?dst_uin=${wifeId}&spec=5,cache=0]`;
            const reply = `${msgText}\n${groomName}（${senderId}）❤️ ${brideName}（${wifeId}）\n${avatar1}  ${avatar2}`;
            seal.replyToSender(ctx, msg, reply);
            return seal.ext.newCmdExecuteResult(true);
        }

        // ---------- 换老婆 ----------
        if (isChange) {
            if (isMarriedToday(groupId, senderId, today)) {
                seal.replyToSender(ctx, msg, '你已经结婚了，不能换老婆！');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (data.blacklists.includes(senderId)) {
                seal.replyToSender(ctx, msg, '你被列入黑名单，无法换老婆。');
                return seal.ext.newCmdExecuteResult(true);
            }
            if (!data.dailyMap[today]?.[senderId]) {
                seal.replyToSender(ctx, msg, '你还没有抽取今日老婆，不需要换。');
                return seal.ext.newCmdExecuteResult(true);
            }
            delete data.dailyMap[today][senderId];
            saveGroupData(groupId);
            const result = drawWife(groupId, senderId, today);
            seal.replyToSender(ctx, msg, result.message);
            return seal.ext.newCmdExecuteResult(result.success);
        }

        // ---------- 普通抽取 ----------
        if (isMarriedToday(groupId, senderId, today)) {
            seal.replyToSender(ctx, msg, '你已经结婚了，不能再抽老婆啦！');
            return seal.ext.newCmdExecuteResult(true);
        }
        if (data.blacklists.includes(senderId)) {
            seal.replyToSender(ctx, msg, '你被列入黑名单，无法参与抽取。');
            return seal.ext.newCmdExecuteResult(true);
        }
        const result = drawWife(groupId, senderId, today);
        seal.replyToSender(ctx, msg, result.message);
        return seal.ext.newCmdExecuteResult(result.success);
    };

    ext.cmdMap['今日老婆'] = cmd;
    ext.cmdMap['jrlp'] = cmd;
    ext.cmdMap['结婚'] = cmd;
    ext.cmdMap['换老婆'] = cmd;
    ext.cmdMap['离婚'] = cmd;
}