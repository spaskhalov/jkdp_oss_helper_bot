import { Scenes, Composer } from 'telegraf'
import { OssHelperContext } from '../OssHelperContext'
import { YesOrNoComposer, yesOrNoKeyboard } from './yesOrNoStepHandler'
import { WizardContextWizard } from 'telegraf/typings/scenes';
import { legendData } from '../readLegendData'
import { sendMainMessage } from '../mainScreenKeyboard'

function extractNumbers(st: string): false | number[] {
  const rez = Array.from(st.split(','), s => Number.parseInt(s))
  if (rez.some((v) => isNaN(v)))
    return false
  return rez
}

function goNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.next()
}

function goNextNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
}

const enterFlatHander = new Composer<OssHelperContext>()
enterFlatHander.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
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
  ctx.scene.session.owners = ctx.message.text.split(',').map((n) => n.trim().toLowerCase())
  await ctx.reply('У вас есть парковочное место?', yesOrNoKeyboard)
  return ctx.wizard.next()  
})

const yesOrNoCarPlaceHandler = new YesOrNoComposer(
  (ctx) => {
    ctx.replyWithMarkdown(`Введите номер парковочного места. Если их несколько, перечисляйти их через запятую.\n_Например: 123, 124_`,)
    goNext(ctx)
  }, (ctx) => {
    ctx.reply('У вас есть кладовка?', yesOrNoKeyboard)    
    goNextNext(ctx)
  })

const enterCarPlacesHandler = new Composer<OssHelperContext>()
enterCarPlacesHandler.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
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
    goNext(ctx)
  }, (ctx) => {
    lastStep(ctx)
  })

const enterStoreroomsHandler = new Composer<OssHelperContext>()
enterStoreroomsHandler.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер кладовки. Повторите еще раз.`)
  else
  {
    ctx.scene.session.storerooms = rez    
    lastStep(ctx)
  }
})

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

async function lastStep(ctx: OssHelperContext){
  await verifyData(ctx)
  await ctx.scene.leave()
  await sendMainMessage(ctx)
}

async function verifyData(ctx: OssHelperContext){
  const rowByFlatNum = getRowByFlatNum()

  let shortOSSBlankPath = './data/short/Empty.pdf'
  let longOSSBlankPath = './data/long/Empty.pdf'

  if(rowByFlatNum){
    if(checkOwners()){
      await ctx.reply(`Отлично! ${rowByFlatNum.name} я нашел для Вас именные бланки!`)
      shortOSSBlankPath = `./data/short/files/${rowByFlatNum.fileNum} _ .pdf`
      longOSSBlankPath = `./data/long/files/${rowByFlatNum.fileNum} _ .pdf`      
    }else{
      await ctx.reply(`Собственники указанные в реестре отличаются от введенных Вами. Попробуйте еще раз.`)
      return
    }
  }else
  {
    await ctx.reply(`Простите... Но я не нашел квартиры №${ctx.scene.session.flats}:( Если вы уверены, что номер введен верно обратитесь к @leonid_tj или @paskhalov`)
    return
  }
  
  await sendFilesToUser(shortOSSBlankPath, longOSSBlankPath)
  
  async function sendFilesToUser(shortOSSPath: string, longOSSPath: string) {
    await ctx.replyWithMarkdown(`Это Ваш бланк для "короткого" ОСС. Его необходимо сдать до *31ого августа* 2022ого года.`);
    await ctx.replyWithDocument({ source:  shortOSSPath});
    await ctx.replyWithMarkdown(`Это Ваш бланк для "длинного" ОСС. Его необходимо сдать до *30ого ноябра* 2022ого года.`);
    await ctx.replyWithDocument({ source:  longOSSPath});
    await ctx.replyWithMarkdown(`Обратите внимание на моменты:
- Необходимо расписаться внизу каждой страницы.
- Необходимо подписаться под таблицей на последней странице решения.
- Поставить галочки в каждой строчке таблицы за/против/воздержался.`);
  }

  function getRowByFlatNum(): legendData | undefined{    
    for(let flatNum of ctx.scene.session.flats){    
      const row = ctx.ossLegend.data.find(((d) => d.flats.includes(flatNum)))
      if(row !== undefined)
        return row
    }
    return undefined
  }

  function ownersIsSettedInReester() {
    return rowByFlatNum?.owners && rowByFlatNum?.owners.length > 0
  }

  function checkOwners() {
    if(!ownersIsSettedInReester())
      return true
    return rowByFlatNum?.owners.every((fio) => ctx.scene.session?.owners.includes(fio))
  }
}


