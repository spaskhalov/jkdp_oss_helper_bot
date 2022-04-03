import { Scenes, Context } from 'telegraf'
import { OSSLegend } from './readLegendData';


interface OssHelperSessionData extends Scenes.WizardSessionData {  
  flats: number[];
  carPlaces: number[];
  storerooms: number[];
  owners: string[];  
}

export interface OssHelperContext extends Context {
  // will be available under `ctx.ossLegend`
  ossLegend: OSSLegend

  // declare scene type
  scene: Scenes.SceneContextScene<OssHelperContext, OssHelperSessionData>
  // declare wizard type
  wizard: Scenes.WizardContextWizard<OssHelperContext>
}
