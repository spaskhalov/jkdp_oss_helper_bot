/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Scenes, session, Telegraf } from 'telegraf'
import { sendMainMessage, mainScreenKeyboard } from './mainScreenKeyboard'
import { OssDecisionPaperWizard } from './ossDecisionWizard/ossDecisionPaperWizard'
import { OssHelperContext } from "./OssHelperContext"
import { readLegendData } from "./readLegendData"

const ossLegend = readLegendData()
console.log(`Readed ${ossLegend.data.length} fields from legend`)

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

// Handler factories
const { leave } = Scenes.Stage

const bot = new Telegraf<OssHelperContext>(token)

bot.start((ctx) => 
{
  sendMainMessage(ctx)     
})

const stage = new Scenes.Stage<OssHelperContext>([OssDecisionPaperWizard], {
  //ttl: 0,
})
bot.use(session())
bot.use((ctx, next) => {
  const now = new Date()
  ctx.ossLegend = ossLegend
  return next()
})
bot.use(stage.middleware())

bot.action('OSS_ACTION', (ctx) => ctx.scene.enter('OssDecisionPaperWizard'))
bot.action('DOWNLOAD_EMPTY_DOCS_ACTION',async (ctx) => {
  await ctx.reply('Настоятельно рекомендую поискать именные документы (🗳 Поучаствовать в нашем ОСС).')
  await ctx.replyWithMarkdown(`Это шаблон бланка для "короткого" ОСС. Его необходимо сдать до *31ого августа* 2022ого года.`)
  await ctx.replyWithDocument({ source: './data/short/Empty.pdf'})
  await ctx.replyWithMarkdown(`Это шаблона бланк для "длинного" ОСС. Его необходимо сдать до *30ого ноябра* 2022ого года.`)
  await ctx.replyWithDocument({ source: './data/long/Empty.pdf'})
  await ctx.replyWithMarkdown(`Обратите внимание на моменты:
- Необходимо расписаться внизу каждой страницы.
- Необходимо подписаться под таблицей на последней странице решения.
- Поставить галочки в каждой строчке таблицы за/против/воздержался.`)
  await sendMainMessage(ctx)
})
bot.action('LAW_OSS_ACTION',async (ctx) => {
  await ctx.reply('Такая возможность скоро появится.')
  await sendMainMessage(ctx)
})

bot.on('message', (ctx) => ctx.reply('Чем я могу помочь?', mainScreenKeyboard))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

