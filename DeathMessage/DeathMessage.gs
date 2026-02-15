function run()
{
  const key_last_checkin = 'last_checkin';
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ConfigUtils.Init(spreadsheet);
  if (_init(spreadsheet))
  {
    ConfigUtils.SetValue(key_last_checkin, new Date().toISOString());
    ConfigUtils.Sync();
    Logger.log("Initialization completed.");
    return;
  }
  Logger.log("Checking daily checkin status");

}

function _init(spreadsheet)
{
  const key_sn_history = 'sn_history';
  const key_sn_messages = 'sn_message';
  const default_sn_history = 'CheckIn History';
  const default_sn_message = 'Death Message';

  const history_header = ['checkin time'];
  const message_header = ['enabled', 'notify after', 'recipients', 'title', 'body'];

  const key_tasklist_id = 'tasklist_id';
  const key_task_id = 'task_id';
  const default_tasklist_name = 'DM checkin';
  const default_taskname = '[DM] daily checkin';

  var is_init = false;
  is_init = _check_or_create_sheet(key_sn_history, default_sn_history, history_header) || is_init;
  is_init = _check_or_create_sheet(key_sn_messages, default_sn_message, message_header) || is_init;

  is_init = _check_or_create_task(key_tasklist_id, key_task_id, default_tasklist_name, default_taskname) || is_init;
  return is_init;
}

function _check_or_create_sheet(config_key, default_config_value, sheet_header)
{
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sn = ConfigUtils.GetValue(config_key, default_config_value);
  var sheet = spreadsheet.getSheetByName(sn);
  if (sheet == null)
  {
    ApiUtils.CreateSheet(sn);
    ConfigUtils.SetValue(config_key, sn);
    sheet = spreadsheet.getSheetByName(sn);
    ApiUtils.SetValuesInCell(sheet, 1, 1, [sheet_header], font='bold', row_offset=0, col_offset=0);
    return true;
  }
  return false;
}


function _check_or_create_task(tasklist_id_key, task_id_key, default_tasklist_name, default_taskname)
{
  var changed = false;

  var tasklistid = ConfigUtils.GetValue(tasklist_id_key);
  if (tasklistid == null || !ApiUtils.CheckTaskList(tasklistid))
  {
    var tasklist = ApiUtils.CreateTasklist(default_tasklist_name);
    tasklistid = tasklist.id;
    ConfigUtils.SetValue(tasklist_id_key, tasklistid);
    changed = true;
  }

  var taskid = ConfigUtils.GetValue(task_id_key);
  var task = null;
  if (taskid == null ||
    (task = ApiUtils.GetTask(tasklistid, taskid)) == null ||
    task.deleted == true)
  {
    task = ApiUtils.AddTask(tasklistid, {title: default_taskname});
    _reschedule_task(tasklistid, task.id);
    ConfigUtils.SetValue(task_id_key, task.id);
    changed = true;
  }
  return changed;
}

function _reschedule_task(tasklistid, taskid)
{
  var task = ApiUtils.GetTask(tasklistid, taskid);
  if (task == null)
  {
    Logger.log(`> Task[${taskid}] not found, skip rescheduling`);
    throw new Error(`Task[${taskid}] not found`);
  }

  const tz = Session.getScriptTimeZone();
  var last_complete = task.completed != undefined ? new Date(task.completed) : new Date();
  last_complete.setDate(last_complete.getDate() + 1);
  var new_due = Utilities.formatDate(last_complete, tz, "yyyy-MM-dd");

  task.status = 'needsAction';
  task.due = new Date(new_due).toISOString();

  ApiUtils.UpdateTask(tasklistid, taskid, task);
}