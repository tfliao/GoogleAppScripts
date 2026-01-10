const ApiUtils = {
  // google spreadsheet
  data_row_offset: 2, // default value: 1-based row + header
  data_col_offset: 1, // default value: 1-based column

  SetDataOffsets(row_offset, col_offset)
  {
    this.data_row_offset = row_offset;
    this.data_col_offset = col_offset;
  },

  GetSheet(sheetName)
  {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheetByName(sheetName);
  },

  CreateSheet(sheetName)
  {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    sheet = spreadsheet.insertSheet(sheetName);
  },

  SetValueInCell(sheet, data_row, data_col, value, row_offset = null, col_offset = null)
  {
    row_offset = row_offset ?? this.data_row_offset;
    col_offset = col_offset ?? this.data_col_offset;
    sheet.getRange(data_row + row_offset, data_col + col_offset).setValue(value);
  },

  SetValuesInCell(sheet, data_row, data_col, values, row_offset = null, col_offset = null)
  {
    row_offset = row_offset ?? this.data_row_offset;
    col_offset = col_offset ?? this.data_col_offset;
    sheet.getRange(data_row + row_offset, data_col + col_offset, values.length, values[0].length).setValues(values);
  },

  // google calendar
  CreateTasklist(tasklistName)
  {
    const newTaskList = { title: tasklistName };
    return Tasks.Tasklists.insert(newTaskList);
  },

  GetTask(tasklistId, taskid)
  {
    try {
      if (tasklistId == '') return null;
      if (taskid == '') return null;
      
      task = Tasks.Tasks.get(tasklistId, taskid);
      if (task == undefined) return null;
      return task;
    }
    catch
    {
      return null;
    }
  },

  AddTask(tasklistId, taskRecord)
  {
    return Tasks.Tasks.insert(taskRecord, tasklistId);
  },
}