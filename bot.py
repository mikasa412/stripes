import discord
import os # default module
from dotenv import load_dotenv
from discord.ext import bridge

print('starting up...')

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True
load_dotenv() # load token
bot = bridge.Bot(command_prefix='$', intents=intents, default_integration_types={discord.IntegrationType.guild_install})
client = discord.Bot()

emojis = {
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
    }

@bot.event
async def on_ready(): print(f"logged in as {bot.user}")
        
@bot.bridge_command(command_prefix='$', intents=intents, integration_types={discord.IntegrationType.guild_install})
async def full(ctx):
    try:
        eList = ''
        for emoji in emojis: eList += (emoji + ' ' + emojis.get(emoji) + '\n')
        eEmbed = discord.Embed(
            title='list of emojis:',
            color=0x0000C0,
            description=eList,
            footer=discord.EmbedFooter(text=f'use $r (emoji) to react to a message with that emoji | ping {round(bot.latency * 1000)} ms')
        )
        
        await ctx.respond(embed=eEmbed)
    
    except Exception as e:
        print('error: ' + e)

@bot.bridge_command(command_prefix='$', intents=intents, integration_types={discord.IntegrationType.guild_install})
async def r(ctx, emoji='ellie'):
    try:
        if ctx.message.reference:
            replied_message = await ctx.channel.fetch_message(ctx.message.reference.message_id)
            try:
                await replied_message.add_reaction(emojis[emoji])
                await ctx.message.delete()
            except Exception as e:
                await ctx.respond('that\'s not an emoji fam')
        else: await ctx.respond("gotta be a reply champ")
    except Exception as e:
            await ctx.respond(e, ephemeral=True)

bot.run(os.getenv('TOKEN'))