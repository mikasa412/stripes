import { Client, GuildMember, TextChannel, Message, MessageFlags, EmbedBuilder } from "discord.js";
import { pool } from "../../index";

async function increment(
    ID: string,
    command: string,
    amount: number = 1
) {
    const sqlConn = await pool.getConnection();
    
    try {
        
        const statU = `INSERT INTO ${process.env.sql_usertable} (HuserID, \`${command}\`) VALUES (${ID}, ${amount}) ON DUPLICATE KEY UPDATE \`${command}\` = \`${command}\` + ${amount};`;
        await sqlConn.query(statU);
        
    } catch (err) {
        console.error('error on increment: ', err);
    }

    sqlConn.release();
}

const emo = {
    'ellie': '<:ellie:1475350683032228025>',
    'curse': '<:curse:1475948380302737608>',
    'cabbit': '<:cabbit:1475948544576983315>',
    'jamas': '<:jamas:1475953247117119701>',
    'bluepikmin': '<:bluepikmin:1475953370148634811>',
    'whatsapp': '<:whatsapp:1475954438299586571>',
    'redsapp': '<:redsapp:1475954437322309722>',
    'bluesapp': '<:bluesapp:1475954434449211422>',
    'potguy': '<:potguy:1475953493209649152>',
    'gold': '<:gold:1483516758458634471>',
    'upvote': '<:upvote:1483532455842414723>',
    'downvote': '<:downvote:1483532510011850792>',
    'splat': '<:splat:1475953723766210700>',
    'uaucat': '<:uaucat:1475953924153540891>',
    'popo': '<:popo:1475954041409241183>',
    'pou': '<:pou:1483915454111289455>',
    'joob': '<:joob:1475954431471386796>',
    'emjo': '<:emjo:1475954433455034388>',
    'evil': '<:evil:1475954436172943402>',
    'fear': '<:fear:1475954438999900271>',
    'scott': '<:scott:1475954442372382920>'
};

function arg ( command: Message, layer: number ) { return command.content.slice(1).trim().split(/ +/)[layer]?.toLowerCase(); }

class Command {
    desc: string;
    use: string;
    exec: (client: Client, interaction: Message) => Promise<void>;
}

const tree: { [key: string]: Command } = {
    ping: {
        desc: "check if I'm alive",
        use: "=ping",
        exec: async (client: Client, interaction: Message) => {
            await interaction.react("🏓");
            increment(interaction.author.id, "invoke", 1);
        }  
    },
    settings: {
        desc: "view/change user settings, initializes your data on first use",
        use: "=settings [setting] [value] \nsetting: the setting you want to change (if not provided, shows all settings) \nvalue: the value you want to change it to (if not provided, shows current value)",
        exec: async (client: Client, interaction: Message) => {
            const member = interaction.member as GuildMember;
            const mID = member.id;

            try {

                const sqlConn = await pool.getConnection();
                let settingsuser = `no settings found for ${member.nickname ? member.nickname : member.user.displayName}`;
                const result = await sqlConn.query(`SELECT * FROM ${process.env.sql_usertable} WHERE HuserID = ${mID};`);

                if (result.length == 0) {
                    await sqlConn.query(`INSERT INTO ${process.env.sql_usertable} (HuserID) VALUES (${mID})`);
                    await interaction.reply('settings initialized!' + (arg(interaction, 1) ? ' (extra command data ignored)' : ''));
                    sqlConn.release();
                    return;
                }

                const setting = arg(interaction, 1);
                let value = arg(interaction, 2);
                if (!setting) {
                    const usersettings = result[0];
                    const settings = Object.entries(usersettings).filter(([key, value]) => key[0] !== 'H'  && value != 0).map(([key, value]) => `**${key}:** ${value}`).join('\n');
                    if (settings) settingsuser = settings;
                    settingsuser = settingsuser.replace(/_/g, " ");
                    const embed = new EmbedBuilder()
                        .setTitle(`settings for ${member.nickname ? member.nickname : member.user.displayName}`)
                        .setDescription(settingsuser)
                        .setTimestamp()
                        .setColor(0x39ff14);
                    await interaction.reply({ embeds: [embed]});
                    sqlConn.release();
                    return;
                } 

                if (!(setting in result[0])) {
                    await interaction.reply(`setting ${setting} not found` + (value ? ' (extra command data ignored)' : ''));
                    sqlConn.release();
                    return;
                }

                if (!value) {
                    await interaction.reply(`current value of ${setting}: ${result[0][setting as keyof typeof result[0]]}`);
                    sqlConn.release();
                    return;
                }

                if (setting == 'pronouns') {
                    const valid = ['they', 'it', 'fae', 'xe', 'she', 'he'];
                    if (!valid.includes(value)) {
                        await interaction.reply(`my bad fam idk that one - I only have the grammar for these: ${valid.join(', ')}`);
                        sqlConn.release();
                        return;
                    }
                    value = `'${value}'`;
                }

                await sqlConn.query(`UPDATE ${process.env.sql_usertable} SET \`${setting}\` = ${value} WHERE HuserID = ${mID}`);
                await interaction.reply(`updated ${setting} to ${value}`);

                sqlConn.release();

            } catch (err) {
                console.error('Error in request:', err);
                await interaction.reply('sql bugged lmao');
            }
        }
    },
    r: {
        desc: "react with an emoji",
        use: "=r [emoji] \nemoji: the emoji you want to react with (if you want to react with multiple, separate them with spaces)",
        exec: async (client: Client, interaction: Message) => {
            if (!interaction.reference || !interaction.reference.messageId) {
                await interaction.reply("gotta be a reply fam");
                return;
            }
            const emojis = interaction.content.split(' ').slice(1);
            const channel = interaction.channel as TextChannel;
            const msg = await channel.messages.fetch(interaction.reference.messageId);
            if (emojis.length == 0) {
                await interaction.react("❓");
                return;
            }
            for (const emoji of emojis) {
                try {
                    if (emo[emoji]) await msg.react(emo[emoji]);
                    else await interaction.reply(`${emoji}\'s not a emoji fam`);
                } catch (err) {
                    console.error(`error reacting with ${emoji}: `, err);
                    await interaction.react("⚠️");
                }
            }
            await interaction.delete();
        }
    },
    full: {
        desc: "reply with the full list of emojis",
        use: "=full",
        exec: async (client: Client, interaction: Message) => {
            const emojiList = Object.entries(emo).map(([key, value]) => `${value} - **${key}**`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle("list of emojis")
                .setDescription(emojiList)
                .setTimestamp()
                .setColor(0x39ff14);
            await interaction.reply({ embeds: [embed] });
        }
    },
    help: {
        desc: "view this message",
        use: "=help [command] \ncommand: any of the commands listed in =help (if not provided, shows a list of commands)",
        exec: async (client: Client, interaction: Message) => {
            if (!arg(interaction, 1)) {
                const helpMessage = Object.entries(tree).map(([key, value]) => `**=${key}** - ${value.desc}`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle("help")
                    .setDescription(helpMessage)
                    .setTimestamp()
                    .setColor(0x39ff14);
                await interaction.reply({ embeds: [embed] });
                return;
            }
            const commandName = arg(interaction, 1);
            if (!(commandName in tree)) {
                await interaction.reply(`command ${commandName} not found` + (arg(interaction, 2) ? ' (extra command data ignored)' : ''));
                return;
            }
            const command = tree[commandName as keyof typeof tree];
            const embed = new EmbedBuilder()
                .setTitle(`help for ${commandName}`)
                .setDescription(`**description:** ${command.desc}\n**usage:** ${command.use ? command.use : 'no usage data found'}`)
                .setTimestamp()
                .setColor(0x9635e2);
            await interaction.reply({ embeds: [embed] });
        }
    }
}

export default async function execute(
    client: Client,
    interaction: Message
) {
    if (interaction.author.bot) return;
    
    if (interaction.content.toLowerCase()[0] == "=") {
        try {
            const commandName = arg(interaction, 0);
            if (!commandName) return;
            const command = tree[commandName as keyof typeof tree];
            if (!command) {
                await interaction.react("❓");
                return;
            }
            console.log(`executing command ${commandName} for ${interaction.author.tag} (${interaction.author.id}) in ${interaction.guild?.name} (${interaction.guildId}) \ncommand content: ${interaction.content}`);
            await command.exec(client, interaction);
        } catch (err) {
            console.error('error: ', err);
            await interaction.react("⚠️");
        }
    }
    
}