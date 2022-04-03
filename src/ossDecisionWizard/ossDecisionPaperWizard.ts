import { Scenes, Composer } from 'telegraf'
import { OssHelperContext } from '../OssHelperContext'
import { YesOrNoComposer, yesOrNoKeyboard } from './yesOrNoStepHandler'
import { WizardContextWizard } from 'telegraf/typings/scenes';

function ExtractNumbers(st: string): false | number[] {
  const rez = Array.from(st.split(','), s => Number.parseInt(s))
  if (rez.some((v) => isNaN(v)))
    return false
  return rez
}

function GoNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.next()
}

function GoNextNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
}

const enterFlatHander = new Composer<OssHelperContext>()
enterFlatHander.on('text', async (ctx) => {   
  const rez = ExtractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер квартиры. Повторите еще раз.`)
  else
  {
    ctx.scene.session.flats = rez
    ctx.replyWithMarkdown(`Введите ФИО собственника. Если их несколько, перечисляйти их через запятую.\n_Например: Иванов Иван Иванович, Иванова Ивана Ивановна_`)    
    return ctx.wizard.next()    
  }
})

const enterFIOHandler = new Composer<OssHelperContext>()
enterFIOHandler.on('text', async (ctx) => {
  ctx.scene.session.owners = ctx.message.text.split(',')  
  await ctx.reply('У вас есть парковочное место?', yesOrNoKeyboard)
  return ctx.wizard.next()  
})

const yesOrNoCarPlaceHandler = new YesOrNoComposer(
  (ctx) => {
    ctx.replyWithMarkdown(`Введите номер парковочного места. Если их несколько, перечисляйти их через запятую.\n_Например: 123, 124_`,)
    GoNext(ctx)
  }, (ctx) => {
    ctx.reply('У вас есть кладовка?', yesOrNoKeyboard)    
    GoNextNext(ctx)
  })

const enterCarPlacesHandler = new Composer<OssHelperContext>()
enterCarPlacesHandler.on('text', async (ctx) => {   
  const rez = ExtractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер парковочного места. Повторите еще раз.`)
  else
  {
    ctx.scene.session.carPlaces = rez
    ctx.reply('У вас есть кладовка?', yesOrNoKeyboard)
    return ctx.wizard.next()    
  }
})

const yesOrNoStoreroomsHandler = new YesOrNoComposer(
  (ctx) => {
    ctx.replyWithMarkdown(`Введите номер кладовки. Если их несколько, перечисляйти их через запятую.\n_Например: 123, 124_`,)
    GoNext(ctx)
  }, (ctx) => {
    verifyData(ctx)
  })

const enterStoreroomsHandler = new Composer<OssHelperContext>()
enterStoreroomsHandler.on('text', async (ctx) => {   
  const rez = ExtractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер кладовки. Повторите еще раз.`)
  else
  {
    ctx.scene.session.storerooms = rez    
    verifyData(ctx)
  }
})

async function verifyData(ctx: OssHelperContext){
  ctx.reply('Данные проверены!')
  await ctx.scene.leave()
}


export const OssDecisionPaperWizard = new Scenes.WizardScene(  
  'OssDecisionPaperWizard',
  async (ctx) => {        
    await ctx.replyWithMarkdown('Введите номер вашей квартиры. Если их несколько, перечисляйти их через запятую.\n_Например: 1023, 1024_')
    return ctx.wizard.next()
  },
  enterFlatHander,  
  enterFIOHandler,
  yesOrNoCarPlaceHandler,
  enterCarPlacesHandler,
  yesOrNoStoreroomsHandler,
  enterStoreroomsHandler
)

