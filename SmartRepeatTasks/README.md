
# Deployment (might be incomplete)

0. Review the scripts before using, or simply trust me
    1. No guarantee of stable or reliability on this script 

1. Create a google sheet, open Apps Script from "Extension" -> "Apps Script"
    1. [optional] Rename the Name of Google Sheet

2. Copy the scripts
    1. copy content of `SmartRepeatTasks.gs` to the editor
    2. copy content of `api_utils.gs` to the editor
    3. [optional] Rename the script file name to `SmartRepeatTasks.gs` or anything you want

3. Initialize Tasklist and sheet used for this GAS
    1. Add `Google Tasks API` from `Services` tab on the left panel
    2. Save and choose the function of `Prepare`
    3. You will be asking if allow this script to access your data. Choose allow in (more).
    4. Copy the setting from log console to another gs file

```
const tasklistId = "<tasklistid>";
const sheetName = "<sheetName>";
```

4. Setup daily trigger
    1. Click trigger rule on left panel
    2. Choose `Run`, `upstream`, `time trigger`, `daily`, and select any time range
    3. Save
