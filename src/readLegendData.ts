import reader from "xlsx";

interface legendRawDataField {
  file_num: Number
  address: String
  owners: String
}

interface legendData{
  fileNum: Number,
  flats: Number[],
  carPlaces: Number[],
  pantries: Number[],
  owners: String[]
  name: String
}

export class OSSLegend{

  data: legendData[] = [];
  
  constructor(rawData: legendRawDataField[]){
    rawData.forEach(d => {      
      const flats = extractNumbers(d.address, /кв\. (\d+)/g)
      const carPlaces = extractNumbers(d.address, /м\/м (\d+)/g)
      const pantries = extractNumbers(d.address, /пом\. (\d+)/g)
      const owners = d.owners?.split(',')
      const name = owners !== undefined? owners[0].split(' ')[1] : ''
      this.data.push({
        fileNum: d.file_num,
        flats: flats,
        carPlaces: carPlaces,
        pantries: pantries,      
        owners: owners,
        name: name,
      })
    });
  }
}

function extractNumbers(st: String, flatsRegex: RegExp) {
  return Array.from(st.matchAll(flatsRegex), ns => Number.parseInt(ns[1]));
}

export function readLegendData() {
  
  // Reading our test file
  const file = reader.readFile(process.env.LEGEND_FILE!)
    
  let data: legendRawDataField[] = []
    
  const sheetName = file.SheetNames[0]
    
  const temp = reader.utils.sheet_to_json<legendRawDataField>(file.Sheets[sheetName])
  temp.forEach((res) => {
    data.push(res)   
  })
  
  return new OSSLegend(data)
  
}