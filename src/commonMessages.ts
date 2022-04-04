import { OssHelperContext } from "./OssHelperContext";

export async function sendDecisionPapers(ctx: OssHelperContext, objectName: string, shortOSSPath: string, longOSSPath: string, isPreFilled: boolean = false) {
  const notFilledWarning = !isPreFilled ? `*Он заполнен только частично. *` : ''
  await ctx.replyWithMarkdown(`Это Ваш бланк ${objectName} для "короткого" ОСС. ${notFilledWarning}Его необходимо сдать до *31ого августа* 2022 года.`);
  await ctx.replyWithDocument({ source:  shortOSSPath});
  await ctx.replyWithMarkdown(`Это Ваш бланк ${objectName} для "длинного" ОСС. ${notFilledWarning}Его необходимо сдать до *30ого ноября* 2022 года.`);
  await ctx.replyWithDocument({ source:  longOSSPath});
}