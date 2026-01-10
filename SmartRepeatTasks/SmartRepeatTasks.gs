// Deployment 
function Prepare()
{
  const defaultTasklistName = 'SmartRepeatTasks';
  const defaultSheetName = 'SmartRepeatTasks';

  const taskLists = Tasks.Tasklists.list().items;
  var tasklist = null;

  ApiUtils.SetDataOffsets(1, 1);

  if (taskLists && taskLists.length > 0) {
    for (let i = 0; i < taskLists.length; i++) {
      if (taskLists[i].title === defaultTasklistName) {
        tasklist = taskLists[i];
      }
    }
  }

  if (tasklist) {
    Logger.log(`Tasklist[${defaultTasklistName}] already exists, skip creation`);
  } else {
    const newTaskList = { title: defaultTasklistName };
    tasklist = Tasks.Tasklists.insert(newTaskList);
    Logger.log(`Tasklist[${defaultTasklistName}] created, id: ${tasklist.id}`);
  }
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(defaultSheetName);
  if (sheet) {
    Logger.log(`Sheet[${defaultSheetName}] already exists, skip creation`);
  } else {
    sheet = spreadsheet.insertSheet(defaultSheetName);
    Logger.log(`Sheet[${defaultSheetName}] created`);
  }

  const ColumnNames = ["ErrorMessage", "Title", "Date", "Description", "Recreate interval", "Features", "Event Id"];
  ApiUtils.SetValuesInCell(sheet, 0, 0, [ColumnNames]);

  Logger.log('Please copy below config to new gs file');
  Logger.log('');

  Logger.log(`const tasklistId = "${tasklist.id}";`);
  Logger.log(`const sheetName = "${defaultSheetName}";`);
}

// Trigger
function Run()
{
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName)
  var range = sheet.getRange("A2:H999");
  var data = range.getValues();

  ApiUtils.SetDataOffsets(2, 1);

  for (i=0;i<data.length;i ++)
  {
    var row = data[i];
    // 狀態	標題	日期	說明	再生間隔	忽略星期	事件-ID 額外功能  前次完成時間
    var errmsg = row[0];
    var title  = row[1];
    var date   = row[2];
    var desc   = row[3];
    var period = row[4];
    var features = row[5];
    var taskid = row[6];
    var last_complete = row[7];
    
    if (title == '')
    {
      // empty record
      continue;
    }

    Logger.log(`Processing Task[${title}] ... `);

    if (errmsg != '')
    {
      Logger.log('> Error in previous run, skip.');
      continue;
    }

    features = ParseFeatures(features);
    if ('error' in features) {
      error_msg = features['error'].join('\n');
      ApiUtils.SetValueInCell(sheet, i, 1, error_msg);
      Logger.log(`> Error when parsing features, err: ${error_msg}`);
      continue;
    }

    task = GetTask(taskid);
    if (task != null && task.status != 'completed')
    {
      Logger.log(`> Task[${task.id}] is active`);
    }
    else
    {
      try {
        if (task === null)
          date = EvaluateNextDate(date,'0 day',features);
        else
        { // completed task
          ApiUtils.SetValueInCell(sheet, i, 8, task.completed); // 前次完成時間
          if (last_complete != "")
          {
            try{
            let prev_date = new Date(last_complete.split('T')[0]);
            let this_date = new Date(task.completed.split('T')[0]);
            let diff_ts = this_date.getTime() - prev_date.getTime();
            ApiUtils.SetValueInCell(sheet, i, 9, diff_ts / (1000 * 60 * 60 * 24)); // 完成間距
            }
            catch(error)
            {
              Logger.log(`new feature failed, error: ${error.message}`);
            }
          }

          date = EvaluateNextDate(task.completed,period,features);
        }
      }
      catch (error)
      {
        Logger.log(`> Process record at row${i+1} failed: ${error.message}`);
        ApiUtils.SetValueInCell(sheet, i, 1, `error ${error.message}`);
        continue;
      }

      // make some time offset
      date = new Date(date);
      date = date.setHours(date.getHours() + 8);

      const tr = {
        title: title,
        notes: desc,
        due: new Date(date).toISOString()
      };

      Logger.log(`> Adding task ${tr.title} @ ${tr.due}`);
      try {
        resp = Tasks.Tasks.insert(tr, tasklistId);
        ApiUtils.SetValueInCell(sheet, i, 7, resp.id);
        Logger.log(`> success, id: ${resp.id}`);
      }
      catch (error)
      {
        Logger.log(`> failed, [${tr.title}, ${tr.notes}, ${tr.due}], error: ${error.message}`);
        ApiUtils.SetValueInCell(sheet, i, 1, `error ${error.message}`);
        continue;
      }
    }
  }
}

// helpers 
function GetTask(taskid)
{
  try {
    if (taskid == '') return null;
    
    task = Tasks.Tasks.get(tasklistId, taskid);
    if (task == undefined) return null;
    return task;
  }
  catch
  {
    return null;
  }
}

function EvaluateNextDate(base, offset, features)
{
  const regex = /(\d+)[,\s*](day|days|week|weeks|month|months)/i;
  const match = offset.match(regex);
  if (!match)
    throw new Error("offset format error")

  const n = parseInt(match[1], 10);
  var unit = match[2].toLowerCase();
  unit = unit.endsWith('s') ? unit.slice(0,-1) : unit;

  date = SimpleNextDate(base, n, unit);
  if ('delay' in features) {
    const begin = features['delay'][0];
    const end = features['delay'][1];
    delay = Math.floor(Math.random() * (end - begin + 1)) + begin;
    date = SimpleNextDate(date, delay, 'day');
  }

  if ('ignore' in features)
  {
    const ignore_list = features['ignore'];
    while (ignore_list.includes(date.getDay()))
    {
      Logger.log(`${date} in list ${ignore_list}, try next day`)
      date = SimpleNextDate(date, 1, 'day');
    }
  }
  return date;
}

function SimpleNextDate(base, n, unit)
{
  date = new Date(base);
  switch (unit) {
    case 'day':
      date.setDate(date.getDate() + n);
      break;
    case 'week':
      date.setDate(date.getDate() + n * 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() + n);
      break;
  }
  return date;
}

function ParseFeatures(feature_str)
{
  const lines = feature_str.split('\n');
  const delay_regex = /^delay:(\d+)-(\d+)$/;
  const ignore_regex = /^ignore:([\d,\s]+)$/;
  const results = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return; // skip empty line

    if (delay_match = trimmed.match(delay_regex)) {
      const begin = parseInt(delay_match[1], 10);
      const end = parseInt(delay_match[2], 10);
      results['delay'] = [begin, end];
    } else if (ignore_match = trimmed.match(ignore_regex)) {
      const ignore_list = ignore_match[1].split(',').map(s => s.trim()).map(Number);
      results['ignore'] = ignore_list;
    } else {
      if (!('error' in results))
        results['error'] = [];
      results['error'].push(`Unknown feature line: ${trimmed}`)
    }
  });
  return results;
}
