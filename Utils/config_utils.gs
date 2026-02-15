const ConfigUtils = {
  _sheetname: '_config',
  _spreadsheet: null,
  _sheet: null,
  _config: null,
  Init(spreadsheet, sheetname = null)
  {
    this._sheetname = sheetname ?? this._sheetname;
    this._spreadsheet = spreadsheet;
    this._sheet = this._spreadsheet.getSheetByName(this._sheetname);
    if (this._sheet == null)
    {
      Logger.log(`No sheet with name ${this._sheetname}, creating one.`);
      this._spreadsheet.insertSheet(this._sheetname);
      this._sheet = this._spreadsheet.getSheetByName(this._sheetname);
      this._config = {};
      this._SaveConfig(this._config);
    }
    else
    {
      this._config = this._LoadConfig();
    }
  },
  ReloadConfig()
  {
    return this._LoadConfig();
  },
  GetValue(key, defaultValue = null)
  {
    if (this._config[key] == undefined) {
      return defaultValue;
    }
    return this._config[key];
  },
  SetValue(key, value)
  {
    this._config[key] = value;
  },
  DeleteValue(key)
  {
    delete this._config[key];
  },
  Sync()
  {
    return this._SaveConfig(this._config);
  },
  _SaveConfig(config)
  {
    const title = [["[key]", "[value]"]];
    this._sheet.getRange(1, 1, title.length, 2).setValues(title);
    this._sheet.getRange(1, 1, title.length, 2).setFontWeight("bold");

    var kvpair = Object.entries(config);
    kvpair.push(["<end>", "<end>"]);
    this._sheet.getRange(2, 1, kvpair.length, 2).setValues(kvpair);
  },
  _LoadConfig()
  {
    var data = this._sheet.getRange("A2:B99").getValues();
    var config = {};
    for (i=0;i<data.length;i ++)
    {
      var row = data[i];
      var key = row[0];
      var value = row[1];
      if (key == "") {
        continue;
      }
      if (key == "<end>") {
        break;
      }
      config[key] = value;
    }
    return config;
  },
}