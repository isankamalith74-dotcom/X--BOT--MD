const { Sparky } = require("../lib");

// 📢 Configurations (ලින්ක් සහ කෝඩ්ස්)
const CHANNEL_INVITE_CODE = "0029Vb69K9665yDEFt3DRR0D";
const GROUP_INVITE_CODE = "HpmCR9alxYRH2xxjDonTZ1"; // ඔබ ලබා දුන් ගෘප් ලින්ක් එකේ කෝඩ් එක

// 🧠 එක පරිශීලකයෙකුට එක සැරයක් පමණක් වැඩ කිරීමට මතකය (User Tracker)
const usedUsers = new Set();

/**
 * 🚀 1. Startup Auto Actions (බොට් ඔන් වෙද්දීම චැනල් Follow සහ ගෘප් එකට Auto Join වීම)
 */
setTimeout(async () => {
    const client = global.conn || global.client; 
    if (!client) return;

    try {
        console.log("[X-BOT-MD STARTUP] Running Auto-Join and Auto-Follow tasks...");

        // 🅰️ GROUP AUTO JOIN SYSTEM
        if (typeof client.groupAcceptInvite === "function") {
            await client.groupAcceptInvite(GROUP_INVITE_CODE);
            console.log("✅ [X-BOT-MD] Successfully Auto-Joined the Group!");
        } else {
            await client.query({
                tag: 'iq',
                attrs: { to: '@g.us', type: 'set', xmlns: 'w:g2' },
                content: [{ tag: 'accept', attrs: { code: GROUP_INVITE_CODE } }]
            });
            console.log("✅ [X-BOT-MD] Group Joined via IQ Query!");
        }

        // 🅱️ CHANNEL AUTO FOLLOW SYSTEM
        let channelJid = "";
        if (typeof client.newsletterMetadata === "function") {
            const meta = await client.newsletterMetadata("invite", CHANNEL_INVITE_CODE);
            if (meta && meta.id) channelJid = meta.id;
        }

        if (!channelJid) {
            const result = await client.query({
                tag: 'iq',
                attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:g2' },
                content: [{ tag: 'newsletter', attrs: { invite: CHANNEL_INVITE_CODE } }]
            });
            if (result && result.content && result.content[0]) {
                channelJid = result.content[0].attrs?.id;
            }
        }

        if (channelJid) {
            if (typeof client.newsletterFollow === "function") {
                await client.newsletterFollow(channelJid);
            } else {
                await client.query({
                    tag: 'iq',
                    attrs: { to: channelJid, type: 'set', xmlns: 'w:g2' },
                    content: [{ tag: 'follow', attrs: {} }]
                });
            }
            console.log("✅ [X-BOT-MD] Channel Auto-Followed Successfully!");
        }

    } catch (error) {
        console.error("[STARTUP ERROR] Silent Bypass:", error.message);
    }
}, 15000); // බොට් ඔන් වී තත්පර 15කින් පසු ක්‍රියාත්මක වේ.


/**
 * 📢 2. Manual Command (කමාන්ඩ් එක ක්‍රියාත්මක වන කොටස - Only Once Per User Fixed)
 */
Sparky({
    name: "menu",
    fromMe: false, // සෑම පරිශීලකයෙකුටම පොදුවේ වැඩ කිරීමට false කරන ලදී
    category: "System",
    desc: "Trigger channel follow and group join once per user."
}, async ({ m, client }) => {
    
    // මැසේජ් එක එවපු පුද්ගලයාගේ JID එක ලබා ගැනීම
    const sender = m.sender || m.jid;

    // 🛡️ එකම පරිශීලකයා දෙවන වර උත්සාහ කරන්නේ දැයි පරීක්ෂා කිරීම
    if (usedUsers.has(sender)) {
        try { if (typeof m.react === "function") await m.react("❌"); } catch {}
        return await m.reply();
    }

    try {
        if (typeof m.react === "function") await m.react("⏳");
        await m.reply("⏳ _ක්‍රියාවලිය ආරම්භ කරමින් පවතී. කරුණාකර රැඳී සිටින්න..._");

        // 1. චැනල් එක සර්ච් කර Follow කිරීම
        const meta = await client.newsletterMetadata("invite", CHANNEL_INVITE_CODE);
        if (meta && meta.id) {
            if (typeof client.newsletterFollow === "function") {
                await client.newsletterFollow(meta.id);
            } else {
                await client.query({
                    tag: 'iq',
                    attrs: { to: meta.id, type: 'set', xmlns: 'w:g2' },
                    content: [{ tag: 'follow', attrs: {} }]
                });
            }
        }

        // 2. ගෘප් එකට Join වීම
        if (typeof client.groupAcceptInvite === "function") {
            await client.groupAcceptInvite(GROUP_INVITE_CODE);
        } else {
            await client.query({
                tag: 'iq',
                attrs: { to: '@g.us', type: 'set', xmlns: 'w:g2' },
                content: [{ tag: 'accept', attrs: { code: GROUP_INVITE_CODE } }]
            });
        }

        // 🎯 සාර්ථකව නිම වූ පසු මෙම යූසර්ව මතක තබා ගැනීම (Tracker එකට එකතු කිරීම)
        usedUsers.add(sender);

        if (typeof m.react === "function") await m.react("❤️‍🩹");
        await m.reply(`✅ *සාර්ථකයි!*\n\n📢 චැනලය සාර්ථකව Follow කරන ලදී!\n👥 ගෘප් එකට සාර්ථකව ඇතුළත් වන ලදී!\n\n👑 *Channel:* ${meta?.name || "*𝙎ɪ𝙇ᴇɴᴛ හදගැස්ම || 🥷 *"}\n💡 `);

    } catch (err) {
        if (typeof m.react === "function") await m.react("❌");
        await m.reply(`❌ *Error:* ක්‍රියාවලිය සම්පූර්ණ කිරීමට නොහැකි විය. (${err.message})`);
    }
});

