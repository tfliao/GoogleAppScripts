const key_last_checkin = 'last_checkin';
const key_sn_history = 'sn_history';
const key_sn_messages = 'sn_message';
const key_tasklist_id = 'tasklist_id';
const key_task_id = 'task_id';

const default_sn_history = 'CheckIn History';
const default_sn_message = 'Death Message';
const history_header = ['checkin time'];
const message_header = ['enabled', 'notify after', 'recipients', 'title', 'body'];
const sample_mail_body = `Hi,

This is an auto mail from DeathMessage.

It's been over 24hrs since you last checkin in.
If you are still alive, please go to checkin now.

Sincerely,
DM System`;
const message_sample = ['TRUE', 1, '', '[DM] checkin reminder', sample_mail_body];

const default_tasklist_name = 'DM checkin';
const default_taskname = '[DM] daily checkin';

function run()
{
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ConfigUtils.Init(spreadsheet);
  if (_init())
  {
    ConfigUtils.SetValue(key_last_checkin, _to_localtime(new Date()));
    ConfigUtils.Sync();
    Logger.log("Initialization completed.");
    return;
  }
  Logger.log("Checking daily checkin status");
  _update_checkin();
  _count_missed_checkin();
}

function _update_checkin()
{
  const tasklistid = ConfigUtils.GetValue(key_tasklist_id);
  const taskid = ConfigUtils.GetValue(key_task_id);
  var task = ApiUtils.GetTask(tasklistid, taskid);
  if (task.completed != undefined)
  {
    Logger.log(`> Task[${taskid}] is completed, update last checkin time and reschedule next checkin.`);
    var localtime = _to_localtime(task.completed);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(ConfigUtils.GetValue(key_sn_history));
    ApiUtils.InsertValues(sheet, 0, 0, [[localtime]]);
    ConfigUtils.SetValue(key_last_checkin, localtime);
    _reschedule_task(tasklistid, taskid);
    ConfigUtils.Sync();
    return;
  }
}

function _init()
{
  var is_init = false;
  is_init = _check_or_create_sheet(key_sn_history, default_sn_history, history_header) || is_init;
  is_init = _check_or_create_sheet(key_sn_messages, default_sn_message, message_header, [message_sample]) || is_init;

  is_init = _check_or_create_task(key_tasklist_id, key_task_id, default_tasklist_name, default_taskname) || is_init;
  return is_init;
}

function _check_or_create_sheet(config_key, default_config_value, sheet_header, sample_records = null)
{
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sn = ConfigUtils.GetValue(config_key, default_config_value);
  var sheet = spreadsheet.getSheetByName(sn);
  if (sheet == null)
  {
    ApiUtils.CreateSheet(sn);
    ConfigUtils.SetValue(config_key, sn);
    sheet = spreadsheet.getSheetByName(sn);
    ApiUtils.SetValuesInCell(sheet, 0, 0, [sheet_header], font='bold', row_offset=1, col_offset=1);
    if (sample_records != null)
    {
      ApiUtils.SetValuesInCell(sheet, 0, 0, sample_records);
    }
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
  task.completed = undefined;

  ApiUtils.UpdateTask(tasklistid, taskid, task);
}

function _to_localtime(datetime)
{
  const tz = Session.getScriptTimeZone();
  var local_time = new Date(datetime);
  return Utilities.formatDate(local_time, tz, "yyyy-MM-dd HH:mm:ss");
}
