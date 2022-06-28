import { sendMainMessage } from './mainScreenKeyboard';
import { OssHelperContext } from "./OssHelperContext";

export async function defaultAction(ctx: OssHelperContext) {
  await sendMainMessage(ctx);
  ctx.scene.enter('OssDecisionPaperWizard');
}
