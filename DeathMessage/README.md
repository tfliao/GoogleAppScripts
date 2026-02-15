
# Key Feature

Allow you to checkin every day, and send messages to others when you failed to checkin after few days

# How it works
1. This script create tasklist on your [`Google Tasks`](https://tasks.google.com/), and a task require you to check `complete`
2. Everyday if you check in, the script will reschedule the check in task to next day
3. If you failed to check in, customized email will be sent to list of recipients to notify them you are dead.
    * In practice, please send mail to yourself as reminder for first missed checkin


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
    3. You will be asking if allow this script to access your data. Choose allow in (more).

4. Setup daily trigger
    1. Click trigger rule on left panel
    2. Choose `Run`, `upstream`, `time trigger`, `daily`, and select any time range
    3. Save
