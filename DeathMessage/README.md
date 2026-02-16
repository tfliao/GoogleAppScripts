
# Key Feature

Allow you to checkin every day, and send messages to others when you failed to checkin after few days

# How it works
1. This script create tasklist on your [`Google Tasks`](https://tasks.google.com/), and a task require you to check `complete`
2. Everyday if you check in, the script will reschedule the check in task to next day
3. If you failed to check in, customized email will be sent to list of recipients to notify them you are dead.
    * In practice, please send mail to yourself as reminder for first missed checkin

## Detailed behaviors

### Initialization

Everytime the script was called, it will check if required materials exist, including two sheets, tasklist and task. If any of them missing, this run will be system initialization, which will create above missed materials.

### System healthy detection

To prevent unwanted notifications sent, the system has below behaviors.

* service active check (in `_service_active_check`): system keep last service run time, and skip notification sending when service inactive over 2 days. this can prevent missed checkin due to system failed to generate the checkin task.
* daily basis notification sending (in `_count_missed_checkin`): every time the script starts, it will send notifications register on single day. Say that we have notifications registed on day 1, 2, and 3. if checkin missed for 3 days, and last notfications sent on day 1, this run will only send notification on day 2.
* missed checkin calculation (in `_count_missed_checkin`): checkin miss days calculated by `current time - max(23:59@task due - 1 day, last checkin time)`, which should be safe enough.


# Deployment (might be incomplete)

0. Review the scripts before using, or simply trust me
    1. No guarantee of stable or reliability on this script

1. Create a google sheet, open Apps Script from "Extension" -> "Apps Script"
    1. [optional] Rename the Name of Google Sheet

2. Copy the scripts
    1. copy content of `DeathMessage.gs` to the editor
    2. copy scripts under `Utils/` to the editor, required utils: `api_utils.gs`, `db_utils.gs`
    3. [optional] Rename the script file name to `DeathMessage.gs` or anything you want

3. Initialize Tasklist and sheet used for this GAS
    1. Add `Tasks`, `Gmail` from `Services` tab on the left panel
    2. Save and choose the function of `Run`
        * this will trigger initialization of creating sheets and task.
    3. You will be asking if allow this script to access your data. Choose allow in (more).

4. Setup daily trigger
    1. Click trigger rule on left panel
    2. Choose `Run`, `upstream`, `time trigger`, `daily`, and select any time range
    3. Save

# Use

1. setup mails in `Death Message` sheet
    * `enabled`: enable this rule or not, any non-empty value is `true`.
    * `notify after`: days of missed checkin to send the notification.
    * `recipients`: comma-separated email to send, all recipients will receive mails as bcc, `To` will be the script owner.
    * `title`: mail title
    * `body`: content of the mail

2. check-in every day
    * the task will generated in tasklist named `DM checkin`, and expected to be visible in you google calender
    * `complete` the task as check-in

# Known issue

* expected timezone issue, the script developed in Taipei time (GMT+8), and expected some issues with timezone.
