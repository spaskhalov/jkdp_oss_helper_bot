import { Composer, Markup } from 'telegraf';
import { WizardContextWizard } from 'telegraf/typings/scenes';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { OssHelperContext } from '../OssHelperContext';

export const yesOrNoKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('✅ Да', 'YES_ACTION'),
  Markup.button.callback('❌ Нет', 'NO_ACTION')
]);

export class YesOrNoComposer extends Composer<OssHelperContext>{

  yesCallback: (ctx: OssHelperContext) => void
  noCallback: (ctx: OssHelperContext) => void
  extraMsgNo? : ExtraReplyMessage
  
  constructor(
    yesCallback: (ctx: OssHelperContext) => void, 
    noCallback: (ctx : OssHelperContext) => void
    ){
    super()
    this.yesCallback = yesCallback    
    this.noCallback = noCallback    
        
    this.action('YES_ACTION', async (ctx) => {  
      this.yesCallback(ctx)
    });

    this.action('NO_ACTION', async (ctx) => {
      this.noCallback(ctx)
    });

    this.on('text', async (ctx) => {
      if (ctx.message.text.toLowerCase().includes('да'))
        return this.yesCallback(ctx)
      else if (ctx.message.text.toLowerCase().includes('нет'))
        return this.noCallback(ctx)
      ctx.replyWithMarkdown('Нажмите кнопку или введите "да" или "нет"')
    });
    
  }  
}