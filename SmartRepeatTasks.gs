const tasklistId = '<tasklistId>'; 

function Run()
{
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('auto-regen-task')
  var range = sheet.getRange("A2:G999");
  var data = range.getValues();

  for (i=0;i<data.length;i ++)
  {
    var row = data[i];
    // 狀態	標題	日期	說明	再生間隔	忽略星期	事件-ID 額外功能
    var errmsg = row[0];
    var title  = row[1];
    var date   = row[2];
    var desc   = row[3];
    var period = row[4];
    var features = row[5];
    var taskid = row[6];
    
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
      sheet.getRange(i+2, 1).setValue(error_msg);
      Logger.log(`> Error when parsing features, err: ${error_msg}`);
      continue;
    }

    // TODO: if task id exists => check if the task complete
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
        else // completed task
          date = EvaluateNextDate(task.completed,period,features);
      }
      catch (error)
      {
        Logger.log(`> Process record at row${i+1} failed: ${error.message}`);
        sheet.getRange(i+2, 1).setValue(`error ${error.message}`);
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
        sheet.getRange(i+2, 7).setValue(resp.id);
        Logger.log(`> success, id: ${resp.id}`);
      }
      catch (error)
      {
        Logger.log(`> failed, [${tr.title}, ${tr.notes}, ${tr.due}], error: ${error.message}`);
        sheet.getRange(i+1, 1).setValue(`error ${error.message}`);
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
    throw new Error("offset 格式錯誤")

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
    if (!trimmed) return; // 跳過空行

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
